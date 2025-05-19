/**
 * @swagger
 * tags:
 *   - name: Projects
 *     description: Управление проектами
 */

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Получить список проектов
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Фильтр по статусу
 *       - in: query
 *         name: stage
 *         schema:
 *           type: string
 *         description: Фильтр по этапу
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Лимит проектов
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *         description: Курсор для пагинации
 *     responses:
 *       200:
 *         description: Список проектов
 *       401:
 *         description: Неавторизован
 */

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Создать новый проект
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - customerId
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               customerId:
 *                 type: string
 *               presaleId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Проект создан
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Неавторизован
 */

/**
 * @swagger
 * /api/projects/{projectId}:
 *   get:
 *     summary: Получить детали проекта
 *     tags: [Projects]
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
 *         description: Детали проекта
 *       401:
 *         description: Неавторизован
 *       404:
 *         description: Проект не найден
 */

/**
 * @swagger
 * /api/projects/{projectId}:
 *   put:
 *     summary: Обновить проект
 *     tags: [Projects]
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
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *               stage:
 *                 type: string
 *               pmId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Проект обновлен
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Неавторизован
 *       404:
 *         description: Проект не найден
 */

/**
 * @swagger
 * /api/projects/{projectId}:
 *   delete:
 *     summary: Удалить проект
 *     tags: [Projects]
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
 *         description: Проект удален
 *       401:
 *         description: Неавторизован
 *       404:
 *         description: Проект не найден
 */

const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { authenticate, checkRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get projects list
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, stage, limit = 50, before } = req.query;

    let query = db.collection('projects');

    // Filter projects based on user role
    if (req.user.roles.includes('customer')) {
      query = query.where('customerId', '==', req.user.uid);
    } else if (req.user.roles.includes('pm')) {
      query = query.where('pmId', '==', req.user.uid);
    } else if (req.user.roles.includes('executor')) {
      query = query.where('team', 'array-contains', req.user.uid);
    }
    // Presale and super-admin can see all projects

    if (status) {
      query = query.where('status', '==', status);
    }

    if (stage) {
      query = query.where('stage', '==', stage);
    }

    query = query.orderBy('createdAt', 'desc').limit(parseInt(limit));

    if (before) {
      query = query.startAfter(before);
    }

    const projectsSnapshot = await query.get();
    const projects = [];

    for (const doc of projectsSnapshot.docs) {
      const project = doc.data();

      // Get customer details
      const customerDoc = await db.collection('users').doc(project.customerId).get();
      const customerData = customerDoc.exists ? customerDoc.data() : null;

      // Get PM details if assigned
      let pmData = null;
      if (project.pmId) {
        const pmDoc = await db.collection('users').doc(project.pmId).get();
        pmData = pmDoc.exists ? pmDoc.data() : null;
      }

      // Get presale details
      const presaleDoc = await db.collection('users').doc(project.presaleId).get();
      const presaleData = presaleDoc.exists ? presaleDoc.data() : null;

      // Get team members details
      const teamMembers = [];
      if (project.team && project.team.length > 0) {
        const teamPromises = project.team.map(async (memberId) => {
          const memberDoc = await db.collection('users').doc(memberId).get();
          if (memberDoc.exists) {
            const memberData = memberDoc.data();
            teamMembers.push({
              id: memberId,
              fullName: memberData.fullName,
              profileImage: memberData.profileImage,
              roles: memberData.roles
            });
          }
        });
        await Promise.all(teamPromises);
      }

      projects.push({
        id: doc.id,
        ...project,
        customer: customerData ? {
          id: project.customerId,
          fullName: customerData.fullName,
          profileImage: customerData.profileImage
        } : null,
        pm: pmData ? {
          id: project.pmId,
          fullName: pmData.fullName,
          profileImage: pmData.profileImage
        } : null,
        presale: presaleData ? {
          id: project.presaleId,
          fullName: presaleData.fullName,
          profileImage: presaleData.profileImage
        } : null,
        team: teamMembers
      });
    }

    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Error fetching projects' });
  }
});

// Create new project
router.post('/',
  authenticate,
  checkRole(['customer', 'presale']),
  [
    body('title').notEmpty().trim(),
    body('description').notEmpty().trim(),
    body('customerId').optional().notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, description, customerId } = req.body;

      // If presale creates project, customerId is required
      if (req.user.roles.includes('presale') && !customerId) {
        return res.status(400).json({ message: 'Customer ID is required when creating project by presale' });
      }

      // Check if customer exists
      const customerIdToUse = req.user.roles.includes('customer') ? req.user.uid : customerId;
      const customerDoc = await db.collection('users').doc(customerIdToUse).get();
      if (!customerDoc.exists) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      const projectData = {
        title,
        description,
        customerId: customerIdToUse,
        presaleId: req.user.roles.includes('presale') ? req.user.uid : null,
        status: 'pre_project',
        stage: 1,
        team: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const projectRef = await db.collection('projects').add(projectData);

      // Create notification for customer
      await db.collection('users')
        .doc(customerIdToUse)
        .collection('notifications')
        .add({
          type: 'project_created',
          title: 'New Project Created',
          message: `Project "${title}" has been created`,
          projectId: projectRef.id,
          read: false,
          createdAt: new Date()
        });

      res.status(201).json({
        message: 'Project created successfully',
        projectId: projectRef.id
      });
    } catch (error) {
      console.error('Create project error:', error);
      res.status(500).json({ message: 'Error creating project' });
    }
  }
);

// Get project details
router.get('/:projectId', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;

    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const project = projectDoc.data();

    // Check if user has access to project
    const hasAccess = 
      project.customerId === req.user.uid ||
      project.pmId === req.user.uid ||
      (project.team && project.team.includes(req.user.uid)) ||
      req.user.roles.includes('presale') ||
      req.user.roles.includes('super-admin');

    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to view this project' });
    }

    // Get customer details
    const customerDoc = await db.collection('users').doc(project.customerId).get();
    const customerData = customerDoc.exists ? customerDoc.data() : null;

    // Get PM details if assigned
    let pmData = null;
    if (project.pmId) {
      const pmDoc = await db.collection('users').doc(project.pmId).get();
      pmData = pmDoc.exists ? pmDoc.data() : null;
    }

    // Get presale details
    const presaleDoc = await db.collection('users').doc(project.presaleId).get();
    const presaleData = presaleDoc.exists ? presaleDoc.data() : null;

    // Get team members details
    const teamMembers = [];
    if (project.team && project.team.length > 0) {
      const teamPromises = project.team.map(async (memberId) => {
        const memberDoc = await db.collection('users').doc(memberId).get();
        if (memberDoc.exists) {
          const memberData = memberDoc.data();
          teamMembers.push({
            id: memberId,
            fullName: memberData.fullName,
            profileImage: memberData.profileImage,
            roles: memberData.roles
          });
        }
      });
      await Promise.all(teamPromises);
    }

    // Get project documents
    const documentsSnapshot = await db.collection('projects')
      .doc(projectId)
      .collection('documents')
      .get();

    const documents = [];
    documentsSnapshot.forEach(doc => {
      documents.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Get project activity
    const activitySnapshot = await db.collection('projects')
      .doc(projectId)
      .collection('activity')
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();

    const activity = [];
    activitySnapshot.forEach(doc => {
      activity.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      id: projectDoc.id,
      ...project,
      customer: customerData ? {
        id: project.customerId,
        fullName: customerData.fullName,
        profileImage: customerData.profileImage
      } : null,
      pm: pmData ? {
        id: project.pmId,
        fullName: pmData.fullName,
        profileImage: pmData.profileImage
      } : null,
      presale: presaleData ? {
        id: project.presaleId,
        fullName: presaleData.fullName,
        profileImage: presaleData.profileImage
      } : null,
      team: teamMembers,
      documents,
      activity
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Error fetching project' });
  }
});

// Update project
router.put('/:projectId',
  authenticate,
  checkRole(['presale', 'pm']),
  [
    body('title').optional().trim(),
    body('description').optional().trim(),
    body('status').optional().isIn(['pre_project', 'in_progress', 'completed', 'cancelled']),
    body('stage').optional().isInt({ min: 1 }),
    body('pmId').optional().notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { projectId } = req.params;
      const { title, description, status, stage, pmId } = req.body;

      const projectDoc = await db.collection('projects').doc(projectId).get();
      if (!projectDoc.exists) {
        return res.status(404).json({ message: 'Project not found' });
      }

      const project = projectDoc.data();

      // Check if user has access to update project
      const hasAccess = 
        (req.user.roles.includes('presale') && project.status === 'pre_project') ||
        (req.user.roles.includes('pm') && project.pmId === req.user.uid);

      if (!hasAccess) {
        return res.status(403).json({ message: 'Not authorized to update this project' });
      }

      // If assigning PM, check if user exists and has PM role
      if (pmId) {
        const pmDoc = await db.collection('users').doc(pmId).get();
        if (!pmDoc.exists) {
          return res.status(404).json({ message: 'PM not found' });
        }
        const pmData = pmDoc.data();
        if (!pmData.roles.includes('pm')) {
          return res.status(400).json({ message: 'User does not have PM role' });
        }
      }

      const updateData = {
        ...(title && { title }),
        ...(description && { description }),
        ...(status && { status }),
        ...(stage && { stage }),
        ...(pmId && { pmId }),
        updatedAt: new Date()
      };

      await db.collection('projects').doc(projectId).update(updateData);

      // Create activity log
      await db.collection('projects')
        .doc(projectId)
        .collection('activity')
        .add({
          type: 'project_updated',
          userId: req.user.uid,
          details: {
            title,
            description,
            status,
            stage,
            pmId
          },
          timestamp: new Date()
        });

      // Create notifications
      const notifications = [];

      if (status && status !== project.status) {
        notifications.push({
          type: 'project_status_changed',
          title: 'Project Status Changed',
          message: `Project "${project.title}" status changed to ${status}`,
          projectId,
          read: false,
          createdAt: new Date()
        });
      }

      if (pmId && pmId !== project.pmId) {
        notifications.push({
          type: 'pm_assigned',
          title: 'PM Assigned',
          message: `You have been assigned as PM for project "${project.title}"`,
          projectId,
          read: false,
          createdAt: new Date()
        });
      }

      // Send notifications
      for (const notification of notifications) {
        if (notification.type === 'project_status_changed') {
          // Notify customer and team
          await db.collection('users')
            .doc(project.customerId)
            .collection('notifications')
            .add(notification);

          if (project.team) {
            for (const memberId of project.team) {
              await db.collection('users')
                .doc(memberId)
                .collection('notifications')
                .add(notification);
            }
          }
        } else if (notification.type === 'pm_assigned') {
          // Notify new PM
          await db.collection('users')
            .doc(pmId)
            .collection('notifications')
            .add(notification);
        }
      }

      res.json({ message: 'Project updated successfully' });
    } catch (error) {
      console.error('Update project error:', error);
      res.status(500).json({ message: 'Error updating project' });
    }
  }
);

// Delete project
router.delete('/:projectId',
  authenticate,
  checkRole(['presale', 'super-admin']),
  async (req, res) => {
    try {
      const { projectId } = req.params;

      const projectDoc = await db.collection('projects').doc(projectId).get();
      if (!projectDoc.exists) {
        return res.status(404).json({ message: 'Project not found' });
      }

      const project = projectDoc.data();

      // Only allow deletion of pre-project stage projects
      if (project.status !== 'pre_project') {
        return res.status(400).json({ message: 'Can only delete projects in pre-project stage' });
      }

      // Delete project and all subcollections
      const batch = db.batch();

      // Delete documents
      const documentsSnapshot = await db.collection('projects')
        .doc(projectId)
        .collection('documents')
        .get();

      documentsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Delete activity logs
      const activitySnapshot = await db.collection('projects')
        .doc(projectId)
        .collection('activity')
        .get();

      activitySnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Delete tasks
      const tasksSnapshot = await db.collection('projects')
        .doc(projectId)
        .collection('tasks')
        .get();

      tasksSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Delete project
      batch.delete(projectDoc.ref);

      await batch.commit();

      // Create notification for customer
      await db.collection('users')
        .doc(project.customerId)
        .collection('notifications')
        .add({
          type: 'project_deleted',
          title: 'Project Deleted',
          message: `Project "${project.title}" has been deleted`,
          read: false,
          createdAt: new Date()
        });

      res.json({ message: 'Project deleted successfully' });
    } catch (error) {
      console.error('Delete project error:', error);
      res.status(500).json({ message: 'Error deleting project' });
    }
  }
);

// Project tasks routes
router.post('/:projectId/tasks',
  authenticate,
  checkRole(['pm']),
  [
    body('text').notEmpty().trim(),
    body('column').notEmpty().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { projectId } = req.params;
      const { text, column } = req.body;

      const taskData = {
        text,
        column,
        status: 'to-do',
        createdAt: new Date(),
        createdBy: req.user.uid
      };

      const taskRef = await db.collection('projects')
        .doc(projectId)
        .collection('tasks')
        .add(taskData);

      res.status(201).json({
        message: 'Task created successfully',
        taskId: taskRef.id
      });
    } catch (error) {
      console.error('Create task error:', error);
      res.status(500).json({ message: 'Error creating task' });
    }
  }
);

router.put('/:projectId/tasks/:taskId',
  authenticate,
  checkRole(['pm']),
  [
    body('text').optional().trim(),
    body('column').optional().trim(),
    body('status').optional().isString(),
    body('assignee').optional().isString()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { projectId, taskId } = req.params;
      const updateData = req.body;

      await db.collection('projects')
        .doc(projectId)
        .collection('tasks')
        .doc(taskId)
        .update({
          ...updateData,
          updatedAt: new Date()
        });

      res.json({ message: 'Task updated successfully' });
    } catch (error) {
      console.error('Update task error:', error);
      res.status(500).json({ message: 'Error updating task' });
    }
  }
);

module.exports = router; 