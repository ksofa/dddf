/**
 * @swagger
 * tags:
 *   - name: Columns
 *     description: Управление колонками проекта
 */

/**
 * @swagger
 * /api/projects/{projectId}/columns:
 *   get:
 *     summary: Получить список колонок проекта
 *     tags: [Columns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID проекта
 *     responses:
 *       200:
 *         description: Список колонок
 *       401:
 *         description: Неавторизован
 *       403:
 *         description: Нет доступа к проекту
 *       404:
 *         description: Проект не найден
 */

/**
 * @swagger
 * /api/projects/{projectId}/columns:
 *   post:
 *     summary: Создать новую колонку
 *     tags: [Columns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID проекта
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Название колонки
 *               order:
 *                 type: integer
 *                 minimum: 0
 *                 description: Порядок колонки
 *     responses:
 *       201:
 *         description: Колонка создана
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Неавторизован
 *       403:
 *         description: Только PM может создавать колонки
 *       404:
 *         description: Проект не найден
 */

/**
 * @swagger
 * /api/projects/{projectId}/columns/{columnId}:
 *   put:
 *     summary: Обновить колонку
 *     tags: [Columns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID проекта
 *       - in: path
 *         name: columnId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID колонки
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Название колонки
 *               order:
 *                 type: integer
 *                 minimum: 0
 *                 description: Порядок колонки
 *     responses:
 *       200:
 *         description: Колонка обновлена
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Неавторизован
 *       403:
 *         description: Только PM может обновлять колонки
 *       404:
 *         description: Проект или колонка не найдены
 */

/**
 * @swagger
 * /api/projects/{projectId}/columns/{columnId}:
 *   delete:
 *     summary: Удалить колонку
 *     tags: [Columns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID проекта
 *       - in: path
 *         name: columnId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID колонки
 *     responses:
 *       200:
 *         description: Колонка удалена
 *       400:
 *         description: Нельзя удалить колонку с задачами
 *       401:
 *         description: Неавторизован
 *       403:
 *         description: Только PM может удалять колонки
 *       404:
 *         description: Проект или колонка не найдены
 */

const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { authenticate, checkRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get project columns
router.get('/projects/:projectId/columns', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;

    // Check if user has access to project
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const project = projectDoc.data();
    const hasAccess = 
      project.customerId === req.user.uid ||
      project.pmId === req.user.uid ||
      (project.team && project.team.includes(req.user.uid)) ||
      req.user.roles.includes('presale') ||
      req.user.roles.includes('super-admin');

    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to view project columns' });
    }

    const columnsSnapshot = await db.collection('projects')
      .doc(projectId)
      .collection('columns')
      .orderBy('order')
      .get();

    const columns = [];
    columnsSnapshot.forEach(doc => {
      columns.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json(columns);
  } catch (error) {
    console.error('Get columns error:', error);
    res.status(500).json({ message: 'Error fetching columns' });
  }
});

// Create new column
router.post('/projects/:projectId/columns',
  authenticate,
  checkRole(['pm']),
  [
    body('name').notEmpty().trim(),
    body('order').optional().isInt({ min: 0 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { projectId } = req.params;
      const { name, order } = req.body;

      // Check if user is PM of the project
      const projectDoc = await db.collection('projects').doc(projectId).get();
      if (!projectDoc.exists) {
        return res.status(404).json({ message: 'Project not found' });
      }

      const project = projectDoc.data();
      if (project.pmId !== req.user.uid) {
        return res.status(403).json({ message: 'Only project PM can create columns' });
      }

      // Get current max order if not provided
      let columnOrder = order;
      if (columnOrder === undefined) {
        const lastColumn = await db.collection('projects')
          .doc(projectId)
          .collection('columns')
          .orderBy('order', 'desc')
          .limit(1)
          .get();

        columnOrder = lastColumn.empty ? 0 : lastColumn.docs[0].data().order + 1;
      }

      const columnData = {
        name,
        order: columnOrder,
        createdAt: new Date(),
        createdBy: req.user.uid
      };

      const columnRef = await db.collection('projects')
        .doc(projectId)
        .collection('columns')
        .add(columnData);

      // Create activity log
      await db.collection('projects')
        .doc(projectId)
        .collection('activity')
        .add({
          type: 'column_created',
          userId: req.user.uid,
          details: {
            columnId: columnRef.id,
            name
          },
          timestamp: new Date()
        });

      res.status(201).json({
        message: 'Column created successfully',
        columnId: columnRef.id
      });
    } catch (error) {
      console.error('Create column error:', error);
      res.status(500).json({ message: 'Error creating column' });
    }
  }
);

// Update column
router.put('/projects/:projectId/columns/:columnId',
  authenticate,
  checkRole(['pm']),
  [
    body('name').optional().trim(),
    body('order').optional().isInt({ min: 0 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { projectId, columnId } = req.params;
      const { name, order } = req.body;

      // Check if user is PM of the project
      const projectDoc = await db.collection('projects').doc(projectId).get();
      if (!projectDoc.exists) {
        return res.status(404).json({ message: 'Project not found' });
      }

      const project = projectDoc.data();
      if (project.pmId !== req.user.uid) {
        return res.status(403).json({ message: 'Only project PM can update columns' });
      }

      const columnDoc = await db.collection('projects')
        .doc(projectId)
        .collection('columns')
        .doc(columnId)
        .get();

      if (!columnDoc.exists) {
        return res.status(404).json({ message: 'Column not found' });
      }

      const column = columnDoc.data();
      const updateData = {
        ...(name && { name }),
        ...(order !== undefined && { order }),
        updatedAt: new Date(),
        updatedBy: req.user.uid
      };

      await columnDoc.ref.update(updateData);

      // Create activity log
      await db.collection('projects')
        .doc(projectId)
        .collection('activity')
        .add({
          type: 'column_updated',
          userId: req.user.uid,
          details: {
            columnId,
            name: name || column.name,
            order: order !== undefined ? order : column.order
          },
          timestamp: new Date()
        });

      res.json({ message: 'Column updated successfully' });
    } catch (error) {
      console.error('Update column error:', error);
      res.status(500).json({ message: 'Error updating column' });
    }
  }
);

// Delete column
router.delete('/projects/:projectId/columns/:columnId',
  authenticate,
  checkRole(['pm']),
  async (req, res) => {
    try {
      const { projectId, columnId } = req.params;

      // Check if user is PM of the project
      const projectDoc = await db.collection('projects').doc(projectId).get();
      if (!projectDoc.exists) {
        return res.status(404).json({ message: 'Project not found' });
      }

      const project = projectDoc.data();
      if (project.pmId !== req.user.uid) {
        return res.status(403).json({ message: 'Only project PM can delete columns' });
      }

      const columnDoc = await db.collection('projects')
        .doc(projectId)
        .collection('columns')
        .doc(columnId)
        .get();

      if (!columnDoc.exists) {
        return res.status(404).json({ message: 'Column not found' });
      }

      const column = columnDoc.data();

      // Check if column has tasks
      const tasksSnapshot = await db.collection('projects')
        .doc(projectId)
        .collection('tasks')
        .where('column', '==', columnId)
        .get();

      if (!tasksSnapshot.empty) {
        return res.status(400).json({
          message: 'Cannot delete column with tasks',
          tasksCount: tasksSnapshot.size
        });
      }

      await columnDoc.ref.delete();

      // Create activity log
      await db.collection('projects')
        .doc(projectId)
        .collection('activity')
        .add({
          type: 'column_deleted',
          userId: req.user.uid,
          details: {
            columnId,
            name: column.name
          },
          timestamp: new Date()
        });

      res.json({ message: 'Column deleted successfully' });
    } catch (error) {
      console.error('Delete column error:', error);
      res.status(500).json({ message: 'Error deleting column' });
    }
  }
);

// Reorder columns
router.post('/projects/:projectId/columns/reorder',
  authenticate,
  checkRole(['pm']),
  [
    body('columnOrders').isArray(),
    body('columnOrders.*.columnId').notEmpty(),
    body('columnOrders.*.order').isInt({ min: 0 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { projectId } = req.params;
      const { columnOrders } = req.body;

      // Check if user is PM of the project
      const projectDoc = await db.collection('projects').doc(projectId).get();
      if (!projectDoc.exists) {
        return res.status(404).json({ message: 'Project not found' });
      }

      const project = projectDoc.data();
      if (project.pmId !== req.user.uid) {
        return res.status(403).json({ message: 'Only project PM can reorder columns' });
      }

      // Update column orders in batch
      const batch = db.batch();
      for (const { columnId, order } of columnOrders) {
        const columnRef = db.collection('projects')
          .doc(projectId)
          .collection('columns')
          .doc(columnId);

        batch.update(columnRef, {
          order,
          updatedAt: new Date(),
          updatedBy: req.user.uid
        });
      }

      await batch.commit();

      // Create activity log
      await db.collection('projects')
        .doc(projectId)
        .collection('activity')
        .add({
          type: 'columns_reordered',
          userId: req.user.uid,
          details: {
            columnOrders
          },
          timestamp: new Date()
        });

      res.json({ message: 'Columns reordered successfully' });
    } catch (error) {
      console.error('Reorder columns error:', error);
      res.status(500).json({ message: 'Error reordering columns' });
    }
  }
);

module.exports = router; 