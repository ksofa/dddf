const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { authenticate, checkRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

/**
 * @swagger
 * tags:
 *   - name: Tasks
 *     description: Управление задачами проекта
 */

/**
 * @swagger
 * /api/projects/{projectId}/tasks:
 *   get:
 *     summary: Получить список задач проекта
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID проекта
 *       - in: query
 *         name: column
 *         schema:
 *           type: string
 *         description: Фильтр по колонке
 *       - in: query
 *         name: assignee
 *         schema:
 *           type: string
 *         description: Фильтр по исполнителю
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [todo, in_progress, done]
 *         description: Фильтр по статусу
 *     responses:
 *       200:
 *         description: Список задач
 *       401:
 *         description: Неавторизован
 *       403:
 *         description: Нет доступа к проекту
 *       404:
 *         description: Проект не найден
 */

/**
 * @swagger
 * /api/projects/{projectId}/tasks:
 *   post:
 *     summary: Создать новую задачу
 *     tags: [Tasks]
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
 *               - text
 *               - column
 *             properties:
 *               text:
 *                 type: string
 *               column:
 *                 type: string
 *               assignee:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [todo, in_progress, done]
 *               color:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Задача создана
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Неавторизован
 *       403:
 *         description: Только PM может создавать задачи
 *       404:
 *         description: Проект не найден
 */

/**
 * @swagger
 * /api/projects/{projectId}/tasks/{taskId}/history:
 *   get:
 *     summary: Получить историю изменений задачи
 *     tags: [Tasks]
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
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID задачи
 *     responses:
 *       200:
 *         description: История изменений задачи
 *       401:
 *         description: Неавторизован
 *       403:
 *         description: Нет доступа к проекту
 *       404:
 *         description: Проект или задача не найдены
 */

// Helper function to create task history entry
const createTaskHistoryEntry = async (projectId, taskId, userId, action, details) => {
  try {
    const historyData = {
      action,
      details,
      userId,
      timestamp: new Date()
    };

    await db.collection('projects')
      .doc(projectId)
      .collection('tasks')
      .doc(taskId)
      .collection('history')
      .add(historyData);
  } catch (error) {
    console.error('Create task history error:', error);
  }
};

// Helper function to create project activity entry
const createProjectActivityEntry = async (projectId, userId, action, details) => {
  try {
    const activityData = {
      action,
      details,
      userId,
      timestamp: new Date()
    };

    await db.collection('projects')
      .doc(projectId)
      .collection('activity')
      .add(activityData);
  } catch (error) {
    console.error('Create project activity error:', error);
  }
};

// Get project tasks
router.get('/projects/:projectId/tasks', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { column, assignee, status } = req.query;

    // Check if user has access to project
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const project = projectDoc.data();
    const hasAccess = 
      req.user.roles && req.user.roles.includes('admin') ||
      project.manager === req.user.uid ||
      project.customerId === req.user.uid ||
      project.pmId === req.user.uid ||
      (project.teamMembers && project.teamMembers.includes(req.user.uid)) ||
      (project.team && project.team.includes(req.user.uid)) ||
      req.user.roles.includes('admin') ||
      req.user.roles.includes('admin');

    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to view project tasks' });
    }

    let query = db.collection('projects')
      .doc(projectId)
      .collection('tasks')
      .orderBy('createdAt', 'desc');

    // Apply filters
    if (column) {
      query = query.where('column', '==', column);
    }
    if (assignee) {
      query = query.where('assignee', '==', assignee);
    }
    if (status) {
      query = query.where('status', '==', status);
    }

    const tasksSnapshot = await query.get();
    const tasks = [];

    // Get assignee details for each task
    const assigneeIds = new Set();
    tasksSnapshot.forEach(doc => {
      const task = doc.data();
      if (task.assignee) {
        assigneeIds.add(task.assignee);
      }
      tasks.push({
        id: doc.id,
        ...task
      });
    });

    // Fetch assignee details
    const assignees = {};
    if (assigneeIds.size > 0) {
      // Получаем пользователей по их ID документов
      for (const assigneeId of assigneeIds) {
        try {
          const userDoc = await db.collection('users').doc(assigneeId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            assignees[assigneeId] = {
              id: assigneeId,
              fullName: userData.fullName || userData.displayName,
              profileImage: userData.profileImage
            };
          }
        } catch (error) {
          console.error(`Error fetching user ${assigneeId}:`, error);
        }
      }
    }

    // Add assignee details to tasks
    const tasksWithAssignees = tasks.map(task => ({
      ...task,
      assigneeDetails: task.assignee ? assignees[task.assignee] : null
    }));

    res.json(tasksWithAssignees);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Error fetching tasks' });
  }
});

// Create new task
router.post('/projects/:projectId/tasks',
  authenticate,
  [
    body('text').notEmpty().trim(),
    body('column').notEmpty(),
    body('assignee').optional(),
    body('status').optional().isIn(['todo', 'in_progress', 'done']),
    body('color').optional(),
    body('dueDate').optional().isISO8601(),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
    body('description').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { projectId } = req.params;
      const { text, column, assignee, status, color, dueDate, priority, description } = req.body;

      // Check if user is PM of the project
      const projectDoc = await db.collection('projects').doc(projectId).get();
      if (!projectDoc.exists) {
        return res.status(404).json({ message: 'Project not found' });
      }

      const project = projectDoc.data();
      
      // Проверяем права доступа для создания задач
      const canCreateTasks = 
        req.user.roles && req.user.roles.includes('admin') ||
        project.pmId === req.user.uid ||
        project.teamLead === req.user.uid ||
        project.manager === req.user.uid ||
        req.user.roles && req.user.roles.includes('pm');
      
      if (!canCreateTasks) {
        return res.status(403).json({ message: 'Not authorized to create tasks in this project' });
      }

      // Check if column exists - создаем колонку если не существует
      let columnExists = false;
      try {
        const columnDoc = await db.collection('projects')
          .doc(projectId)
          .collection('columns')
          .where('name', '==', column)
          .limit(1)
          .get();
        
        columnExists = !columnDoc.empty;
      } catch (error) {
        console.log('Column check error:', error);
      }

      if (!columnExists) {
        // Создаем колонку если не существует
        const columnOrder = {
          'backlog': 0,
          'todo': 1,
          'in_progress': 2,
          'review': 3,
          'done': 4
        };

        await db.collection('projects')
          .doc(projectId)
          .collection('columns')
          .add({
            name: column,
            order: columnOrder[column] || 1,
            createdAt: new Date(),
            createdBy: req.user.uid
          });
      }

      // Check if assignee exists and is part of the team
      let assigneeDetails = null;
      if (assignee) {
        // Получаем информацию об исполнителе
        const assigneeDoc = await db.collection('users').doc(assignee).get();
        if (assigneeDoc.exists) {
          const assigneeData = assigneeDoc.data();
          assigneeDetails = {};
          
          // Добавляем только определенные поля
          assigneeDetails.id = assignee;
          if (assigneeData.displayName) assigneeDetails.fullName = assigneeData.displayName;
          else if (assigneeData.name) assigneeDetails.fullName = assigneeData.name;
          else assigneeDetails.fullName = 'Unknown User';
          
          if (assigneeData.email) assigneeDetails.email = assigneeData.email;
          if (assigneeData.profileImage) assigneeDetails.profileImage = assigneeData.profileImage;
          else if (assigneeData.avatarUrl) assigneeDetails.profileImage = assigneeData.avatarUrl;
        }

        // Проверяем, что исполнитель в команде
        if (!project.team || !project.team.includes(assignee)) {
          // Если не в команде, но это PM или админ - разрешаем
          if (!req.user.roles?.includes('admin') && project.pmId !== assignee) {
            return res.status(400).json({ message: 'Assignee must be a team member' });
          }
        }
      }

      const taskData = {
        text,
        column,
        status: status || column || 'todo',
        priority: priority || 'medium',
        createdAt: new Date(),
        createdBy: req.user.uid,
        updatedAt: new Date(),
        updatedBy: req.user.uid
      };

      // Добавляем только определенные поля
      if (assignee) taskData.assignee = assignee;
      if (assigneeDetails) taskData.assigneeDetails = assigneeDetails;
      if (color) taskData.color = color;
      if (dueDate) taskData.dueDate = new Date(dueDate);
      if (description) taskData.description = description;

      const taskRef = await db.collection('projects')
        .doc(projectId)
        .collection('tasks')
        .add(taskData);

      // Create activity log
      await db.collection('projects')
        .doc(projectId)
        .collection('activity')
        .add({
          type: 'task_created',
          userId: req.user.uid,
          details: {
            taskId: taskRef.id,
            text,
            column,
            assignee,
            priority
          },
          timestamp: new Date()
        });

      // Create notification for assignee
      if (assignee && assignee !== req.user.uid) {
        await db.collection('users')
          .doc(assignee)
          .collection('notifications')
          .add({
            type: 'task_assigned',
            title: 'New Task Assigned',
            message: `You have been assigned to task: ${text}`,
            projectId,
            taskId: taskRef.id,
            createdAt: new Date(),
            read: false
          });
      }

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

// Get task history
router.get('/projects/:projectId/tasks/:taskId/history', authenticate, async (req, res) => {
  try {
    const { projectId, taskId } = req.params;

    // Check if user has access to project
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const projectData = projectDoc.data();
    const hasAccess = 
      req.user.roles.includes('admin') ||
      req.user.roles.includes('admin') ||
      projectData.customerId === req.user.uid ||
      projectData.pmId === req.user.uid ||
      projectData.team.includes(req.user.uid);

    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to view task history' });
    }

    const historySnapshot = await db.collection('projects')
      .doc(projectId)
      .collection('tasks')
      .doc(taskId)
      .collection('history')
      .orderBy('timestamp', 'desc')
      .get();

    const history = [];
    historySnapshot.forEach(doc => {
      history.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json(history);
  } catch (error) {
    console.error('Get task history error:', error);
    res.status(500).json({ message: 'Error fetching task history' });
  }
});

// Update task
router.put('/projects/:projectId/tasks/:taskId',
  authenticate,
  checkRole(['pm', 'executor']),
  [
    body('text').optional().trim(),
    body('column').optional(),
    body('assignee').optional(),
    body('status').optional().isIn(['todo', 'in_progress', 'done']),
    body('color').optional(),
    body('dueDate').optional().isISO8601()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { projectId, taskId } = req.params;
      const { text, column, assignee, status, color, dueDate } = req.body;

      // Check if user has access to project
      const projectDoc = await db.collection('projects').doc(projectId).get();
      if (!projectDoc.exists) {
        return res.status(404).json({ message: 'Project not found' });
      }

      const project = projectDoc.data();
      const isPM = project.pmId === req.user.uid;
      const isExecutor = project.team && project.team.includes(req.user.uid);

      if (!isPM && !isExecutor) {
        return res.status(403).json({ message: 'Not authorized to update tasks' });
      }

      const taskDoc = await db.collection('projects')
        .doc(projectId)
        .collection('tasks')
        .doc(taskId)
        .get();

      if (!taskDoc.exists) {
        return res.status(404).json({ message: 'Task not found' });
      }

      const task = taskDoc.data();

      // Executors can only update status and their own tasks
      if (isExecutor && !isPM) {
        if (task.assignee !== req.user.uid) {
          return res.status(403).json({ message: 'Can only update assigned tasks' });
        }
        if (status === undefined) {
          return res.status(400).json({ message: 'Can only update task status' });
        }
      }

      // Check if column exists if being updated
      if (column) {
        const columnDoc = await db.collection('projects')
          .doc(projectId)
          .collection('columns')
          .doc(column)
          .get();

        if (!columnDoc.exists) {
          return res.status(400).json({ message: 'Invalid column' });
        }
      }

      // Check if assignee exists and is part of the team
      if (assignee) {
        if (!project.team || !project.team.includes(assignee)) {
          return res.status(400).json({ message: 'Assignee must be a team member' });
        }
      }

      const updateData = {
        ...(text && { text }),
        ...(column && { column }),
        ...(assignee !== undefined && { assignee: assignee || null }),
        ...(status && { status }),
        ...(color && { color }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
        updatedAt: new Date(),
        updatedBy: req.user.uid
      };

      await taskDoc.ref.update(updateData);

      // Create activity log
      await db.collection('projects')
        .doc(projectId)
        .collection('activity')
        .add({
          type: 'task_updated',
          userId: req.user.uid,
          details: {
            taskId,
            text: text || task.text,
            column: column || task.column,
            assignee: assignee !== undefined ? assignee : task.assignee,
            status: status || task.status
          },
          timestamp: new Date()
        });

      // Create notification for new assignee
      if (assignee && assignee !== task.assignee) {
        await db.collection('users')
          .doc(assignee)
          .collection('notifications')
          .add({
            type: 'task_assigned',
            title: 'Task Assigned',
            message: `You have been assigned to task: ${text || task.text}`,
            projectId,
            taskId,
            createdAt: new Date(),
            read: false
          });
      }

      res.json({ message: 'Task updated successfully' });
    } catch (error) {
      console.error('Update task error:', error);
      res.status(500).json({ message: 'Error updating task' });
    }
  }
);

// Delete task
router.delete('/projects/:projectId/tasks/:taskId',
  authenticate,
  checkRole(['pm']),
  async (req, res) => {
    try {
      const { projectId, taskId } = req.params;

      // Check if user is PM of the project
      const projectDoc = await db.collection('projects').doc(projectId).get();
      if (!projectDoc.exists) {
        return res.status(404).json({ message: 'Project not found' });
      }

      const project = projectDoc.data();
      if (project.pmId !== req.user.uid) {
        return res.status(403).json({ message: 'Only project PM can delete tasks' });
      }

      const taskDoc = await db.collection('projects')
        .doc(projectId)
        .collection('tasks')
        .doc(taskId)
        .get();

      if (!taskDoc.exists) {
        return res.status(404).json({ message: 'Task not found' });
      }

      const task = taskDoc.data();

      await taskDoc.ref.delete();

      // Create activity log
      await db.collection('projects')
        .doc(projectId)
        .collection('activity')
        .add({
          type: 'task_deleted',
          userId: req.user.uid,
          details: {
            taskId,
            text: task.text
          },
          timestamp: new Date()
        });

      res.json({ message: 'Task deleted successfully' });
    } catch (error) {
      console.error('Delete task error:', error);
      res.status(500).json({ message: 'Error deleting task' });
    }
  }
);

// Create new column
router.post('/projects/:projectId/columns',
  authenticate,
  [
    body('name').notEmpty().trim(),
    body('order').isInt({ min: 0 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { projectId } = req.params;
      const { name, order } = req.body;

      // Проверяем права доступа к проекту
      const projectDoc = await db.collection('projects').doc(projectId).get();
      if (!projectDoc.exists) {
        return res.status(404).json({ message: 'Project not found' });
      }

      const project = projectDoc.data();
      const canCreateColumns = 
        req.user.roles && req.user.roles.includes('admin') ||
        project.pmId === req.user.uid ||
        project.teamLead === req.user.uid ||
        project.manager === req.user.uid ||
        req.user.roles && req.user.roles.includes('pm');
      
      if (!canCreateColumns) {
        return res.status(403).json({ message: 'Not authorized to create columns in this project' });
      }

      const columnData = {
        name,
        order,
        createdAt: new Date(),
        createdBy: req.user.uid
      };

      const columnRef = await db.collection('projects')
        .doc(projectId)
        .collection('columns')
        .add(columnData);

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
      const updateData = req.body;

      await db.collection('projects')
        .doc(projectId)
        .collection('columns')
        .doc(columnId)
        .update({
          ...updateData,
          updatedAt: new Date()
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

      // Check if column has tasks
      const tasksSnapshot = await db.collection('projects')
        .doc(projectId)
        .collection('tasks')
        .where('column', '==', columnId)
        .get();

      if (!tasksSnapshot.empty) {
        return res.status(400).json({ message: 'Cannot delete column with tasks' });
      }

      await db.collection('projects')
        .doc(projectId)
        .collection('columns')
        .doc(columnId)
        .delete();

      res.json({ message: 'Column deleted successfully' });
    } catch (error) {
      console.error('Delete column error:', error);
      res.status(500).json({ message: 'Error deleting column' });
    }
  }
);

// Add file to task
router.post('/projects/:projectId/tasks/:taskId/files',
  authenticate,
  checkRole(['pm']),
  [
    body('fileName').notEmpty().trim(),
    body('fileType').notEmpty().trim(),
    body('fileSize').isInt({ min: 1 }),
    body('fileUrl').notEmpty().isURL(),
    body('storagePath').notEmpty().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { projectId, taskId } = req.params;
      const { fileName, fileType, fileSize, fileUrl, storagePath } = req.body;

      // Check if task exists
      const taskDoc = await db.collection('projects')
        .doc(projectId)
        .collection('tasks')
        .doc(taskId)
        .get();

      if (!taskDoc.exists) {
        return res.status(404).json({ message: 'Task not found' });
      }

      const fileData = {
        fileName,
        fileType,
        fileSize,
        fileUrl,
        storagePath,
        uploadedBy: req.user.uid,
        uploadedAt: new Date()
      };

      const fileRef = await db.collection('projects')
        .doc(projectId)
        .collection('tasks')
        .doc(taskId)
        .collection('files')
        .add(fileData);

      // Create history entry for file attachment
      await createTaskHistoryEntry(
        projectId,
        taskId,
        req.user.uid,
        'file_attached',
        {
          fileName,
          fileType,
          fileSize
        }
      );

      res.status(201).json({
        message: 'File attached successfully',
        fileId: fileRef.id
      });
    } catch (error) {
      console.error('Add file error:', error);
      res.status(500).json({ message: 'Error attaching file' });
    }
  }
);

// Get task files
router.get('/projects/:projectId/tasks/:taskId/files', authenticate, async (req, res) => {
  try {
    const { projectId, taskId } = req.params;

    // Check if user has access to project
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const projectData = projectDoc.data();
    const hasAccess = 
      req.user.roles.includes('admin') ||
      req.user.roles.includes('admin') ||
      projectData.customerId === req.user.uid ||
      projectData.pmId === req.user.uid ||
      projectData.team.includes(req.user.uid);

    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to view task files' });
    }

    const filesSnapshot = await db.collection('projects')
      .doc(projectId)
      .collection('tasks')
      .doc(taskId)
      .collection('files')
      .orderBy('uploadedAt', 'desc')
      .get();

    const files = [];
    filesSnapshot.forEach(doc => {
      files.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json(files);
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ message: 'Error fetching files' });
  }
});

// Delete task file
router.delete('/projects/:projectId/tasks/:taskId/files/:fileId',
  authenticate,
  checkRole(['pm']),
  async (req, res) => {
    try {
      const { projectId, taskId, fileId } = req.params;

      // Get file data before deletion
      const fileDoc = await db.collection('projects')
        .doc(projectId)
        .collection('tasks')
        .doc(taskId)
        .collection('files')
        .doc(fileId)
        .get();

      if (!fileDoc.exists) {
        return res.status(404).json({ message: 'File not found' });
      }

      const fileData = fileDoc.data();

      // Delete file
      await db.collection('projects')
        .doc(projectId)
        .collection('tasks')
        .doc(taskId)
        .collection('files')
        .doc(fileId)
        .delete();

      // Create history entry for file deletion
      await createTaskHistoryEntry(
        projectId,
        taskId,
        req.user.uid,
        'file_deleted',
        {
          fileName: fileData.fileName,
          fileType: fileData.fileType,
          fileSize: fileData.fileSize
        }
      );

      res.json({ message: 'File deleted successfully' });
    } catch (error) {
      console.error('Delete file error:', error);
      res.status(500).json({ message: 'Error deleting file' });
    }
  }
);

// Move task to another column
router.post('/projects/:projectId/tasks/:taskId/move',
  authenticate,
  checkRole(['pm']),
  [
    body('columnId').notEmpty().trim(),
    body('position').optional().isInt({ min: 0 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { projectId, taskId } = req.params;
      const { columnId, position } = req.body;

      // Check if task exists
      const taskDoc = await db.collection('projects')
        .doc(projectId)
        .collection('tasks')
        .doc(taskId)
        .get();

      if (!taskDoc.exists) {
        return res.status(404).json({ message: 'Task not found' });
      }

      // Check if target column exists
      const columnDoc = await db.collection('projects')
        .doc(projectId)
        .collection('columns')
        .doc(columnId)
        .get();

      if (!columnDoc.exists) {
        return res.status(404).json({ message: 'Target column not found' });
      }

      const taskData = taskDoc.data();
      const currentColumn = taskData.column;

      // Update task
      const updateData = {
        column: columnId,
        updatedAt: new Date()
      };

      // If position is provided, update it
      if (typeof position === 'number') {
        updateData.position = position;
      }

      await db.collection('projects')
        .doc(projectId)
        .collection('tasks')
        .doc(taskId)
        .update(updateData);

      // Create history entry for column change
      await createTaskHistoryEntry(
        projectId,
        taskId,
        req.user.uid,
        'task_moved',
        {
          fromColumn: currentColumn,
          toColumn: columnId,
          position: position
        }
      );

      res.json({ message: 'Task moved successfully' });
    } catch (error) {
      console.error('Move task error:', error);
      res.status(500).json({ message: 'Error moving task' });
    }
  }
);

// Reorder tasks in a column
router.post('/projects/:projectId/columns/:columnId/reorder',
  authenticate,
  checkRole(['pm']),
  [
    body('taskIds').isArray().notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { projectId, columnId } = req.params;
      const { taskIds } = req.body;

      // Check if column exists
      const columnDoc = await db.collection('projects')
        .doc(projectId)
        .collection('columns')
        .doc(columnId)
        .get();

      if (!columnDoc.exists) {
        return res.status(404).json({ message: 'Column not found' });
      }

      // Update positions for all tasks
      const batch = db.batch();
      const tasksRef = db.collection('projects')
        .doc(projectId)
        .collection('tasks');

      for (let i = 0; i < taskIds.length; i++) {
        const taskId = taskIds[i];
        batch.update(tasksRef.doc(taskId), {
          position: i,
          updatedAt: new Date()
        });
      }

      await batch.commit();

      // Create history entry for reordering
      await createTaskHistoryEntry(
        projectId,
        taskIds[0], // Use first task as reference
        req.user.uid,
        'tasks_reordered',
        {
          columnId,
          taskIds
        }
      );

      res.json({ message: 'Tasks reordered successfully' });
    } catch (error) {
      console.error('Reorder tasks error:', error);
      res.status(500).json({ message: 'Error reordering tasks' });
    }
  }
);

// Add comment to task
router.post('/projects/:projectId/tasks/:taskId/comments',
  authenticate,
  [
    body('text').notEmpty().trim(),
    body('mentions').optional().isArray()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { projectId, taskId } = req.params;
      const { text, mentions = [] } = req.body;

      // Check if task exists
      const taskDoc = await db.collection('projects')
        .doc(projectId)
        .collection('tasks')
        .doc(taskId)
        .get();

      if (!taskDoc.exists) {
        return res.status(404).json({ message: 'Task not found' });
      }

      const commentData = {
        text,
        mentions,
        createdBy: req.user.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const commentRef = await db.collection('projects')
        .doc(projectId)
        .collection('tasks')
        .doc(taskId)
        .collection('comments')
        .add(commentData);

      // Create history entry for comment
      await createTaskHistoryEntry(
        projectId,
        taskId,
        req.user.uid,
        'comment_added',
        {
          commentId: commentRef.id,
          text: text.substring(0, 100) // Store first 100 chars in history
        }
      );

      res.status(201).json({
        message: 'Comment added successfully',
        commentId: commentRef.id
      });
    } catch (error) {
      console.error('Add comment error:', error);
      res.status(500).json({ message: 'Error adding comment' });
    }
  }
);

// Get task comments
router.get('/projects/:projectId/tasks/:taskId/comments', authenticate, async (req, res) => {
  try {
    const { projectId, taskId } = req.params;
    const { limit = 50, before } = req.query;

    // Check if user has access to project
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const projectData = projectDoc.data();
    const hasAccess = 
      req.user.roles.includes('admin') ||
      req.user.roles.includes('admin') ||
      projectData.customerId === req.user.uid ||
      projectData.pmId === req.user.uid ||
      projectData.team.includes(req.user.uid);

    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to view task comments' });
    }

    let query = db.collection('projects')
      .doc(projectId)
      .collection('tasks')
      .doc(taskId)
      .collection('comments')
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit));

    if (before) {
      query = query.startAfter(before);
    }

    const commentsSnapshot = await query.get();
    const comments = [];
    commentsSnapshot.forEach(doc => {
      comments.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json(comments);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Error fetching comments' });
  }
});

// Update comment
router.put('/projects/:projectId/tasks/:taskId/comments/:commentId',
  authenticate,
  [
    body('text').notEmpty().trim(),
    body('mentions').optional().isArray()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { projectId, taskId, commentId } = req.params;
      const { text, mentions } = req.body;

      // Check if comment exists and belongs to user
      const commentDoc = await db.collection('projects')
        .doc(projectId)
        .collection('tasks')
        .doc(taskId)
        .collection('comments')
        .doc(commentId)
        .get();

      if (!commentDoc.exists) {
        return res.status(404).json({ message: 'Comment not found' });
      }

      const commentData = commentDoc.data();
      if (commentData.createdBy !== req.user.uid) {
        return res.status(403).json({ message: 'Not authorized to update this comment' });
      }

      await db.collection('projects')
        .doc(projectId)
        .collection('tasks')
        .doc(taskId)
        .collection('comments')
        .doc(commentId)
        .update({
          text,
          mentions,
          updatedAt: new Date()
        });

      // Create history entry for comment update
      await createTaskHistoryEntry(
        projectId,
        taskId,
        req.user.uid,
        'comment_updated',
        {
          commentId,
          text: text.substring(0, 100)
        }
      );

      res.json({ message: 'Comment updated successfully' });
    } catch (error) {
      console.error('Update comment error:', error);
      res.status(500).json({ message: 'Error updating comment' });
    }
  }
);

// Delete comment
router.delete('/projects/:projectId/tasks/:taskId/comments/:commentId',
  authenticate,
  async (req, res) => {
    try {
      const { projectId, taskId, commentId } = req.params;

      // Check if comment exists and belongs to user
      const commentDoc = await db.collection('projects')
        .doc(projectId)
        .collection('tasks')
        .doc(taskId)
        .collection('comments')
        .doc(commentId)
        .get();

      if (!commentDoc.exists) {
        return res.status(404).json({ message: 'Comment not found' });
      }

      const commentData = commentDoc.data();
      if (commentData.createdBy !== req.user.uid) {
        return res.status(403).json({ message: 'Not authorized to delete this comment' });
      }

      await db.collection('projects')
        .doc(projectId)
        .collection('tasks')
        .doc(taskId)
        .collection('comments')
        .doc(commentId)
        .delete();

      // Create history entry for comment deletion
      await createTaskHistoryEntry(
        projectId,
        taskId,
        req.user.uid,
        'comment_deleted',
        {
          commentId
        }
      );

      res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
      console.error('Delete comment error:', error);
      res.status(500).json({ message: 'Error deleting comment' });
    }
  }
);

// Add tag to task
router.post('/projects/:projectId/tasks/:taskId/tags',
  authenticate,
  checkRole(['pm']),
  [
    body('name').notEmpty().trim(),
    body('color').optional().isString()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { projectId, taskId } = req.params;
      const { name, color } = req.body;

      // Check if task exists
      const taskDoc = await db.collection('projects')
        .doc(projectId)
        .collection('tasks')
        .doc(taskId)
        .get();

      if (!taskDoc.exists) {
        return res.status(404).json({ message: 'Task not found' });
      }

      // Check if tag already exists
      const existingTag = await db.collection('projects')
        .doc(projectId)
        .collection('tasks')
        .doc(taskId)
        .collection('tags')
        .where('name', '==', name)
        .get();

      if (!existingTag.empty) {
        return res.status(400).json({ message: 'Tag already exists' });
      }

      const tagData = {
        name,
        color: color || null,
        createdBy: req.user.uid,
        createdAt: new Date()
      };

      const tagRef = await db.collection('projects')
        .doc(projectId)
        .collection('tasks')
        .doc(taskId)
        .collection('tags')
        .add(tagData);

      // Create history entry for tag addition
      await createTaskHistoryEntry(
        projectId,
        taskId,
        req.user.uid,
        'tag_added',
        {
          tagId: tagRef.id,
          name,
          color
        }
      );

      res.status(201).json({
        message: 'Tag added successfully',
        tagId: tagRef.id
      });
    } catch (error) {
      console.error('Add tag error:', error);
      res.status(500).json({ message: 'Error adding tag' });
    }
  }
);

// Get task tags
router.get('/projects/:projectId/tasks/:taskId/tags', authenticate, async (req, res) => {
  try {
    const { projectId, taskId } = req.params;

    // Check if user has access to project
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const projectData = projectDoc.data();
    const hasAccess = 
      req.user.roles.includes('admin') ||
      req.user.roles.includes('admin') ||
      projectData.customerId === req.user.uid ||
      projectData.pmId === req.user.uid ||
      projectData.team.includes(req.user.uid);

    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to view task tags' });
    }

    const tagsSnapshot = await db.collection('projects')
      .doc(projectId)
      .collection('tasks')
      .doc(taskId)
      .collection('tags')
      .orderBy('createdAt', 'desc')
      .get();

    const tags = [];
    tagsSnapshot.forEach(doc => {
      tags.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json(tags);
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ message: 'Error fetching tags' });
  }
});

// Update tag
router.put('/projects/:projectId/tasks/:taskId/tags/:tagId',
  authenticate,
  checkRole(['pm']),
  [
    body('name').optional().trim(),
    body('color').optional().isString()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { projectId, taskId, tagId } = req.params;
      const updateData = req.body;

      // Check if tag exists
      const tagDoc = await db.collection('projects')
        .doc(projectId)
        .collection('tasks')
        .doc(taskId)
        .collection('tags')
        .doc(tagId)
        .get();

      if (!tagDoc.exists) {
        return res.status(404).json({ message: 'Tag not found' });
      }

      const tagData = tagDoc.data();

      // If name is being updated, check for duplicates
      if (updateData.name && updateData.name !== tagData.name) {
        const existingTag = await db.collection('projects')
          .doc(projectId)
          .collection('tasks')
          .doc(taskId)
          .collection('tags')
          .where('name', '==', updateData.name)
          .get();

        if (!existingTag.empty) {
          return res.status(400).json({ message: 'Tag name already exists' });
        }
      }

      await db.collection('projects')
        .doc(projectId)
        .collection('tasks')
        .doc(taskId)
        .collection('tags')
        .doc(tagId)
        .update(updateData);

      // Create history entry for tag update
      await createTaskHistoryEntry(
        projectId,
        taskId,
        req.user.uid,
        'tag_updated',
        {
          tagId,
          oldName: tagData.name,
          newName: updateData.name,
          oldColor: tagData.color,
          newColor: updateData.color
        }
      );

      res.json({ message: 'Tag updated successfully' });
    } catch (error) {
      console.error('Update tag error:', error);
      res.status(500).json({ message: 'Error updating tag' });
    }
  }
);

// Delete tag
router.delete('/projects/:projectId/tasks/:taskId/tags/:tagId',
  authenticate,
  checkRole(['pm']),
  async (req, res) => {
    try {
      const { projectId, taskId, tagId } = req.params;

      // Get tag data before deletion
      const tagDoc = await db.collection('projects')
        .doc(projectId)
        .collection('tasks')
        .doc(taskId)
        .collection('tags')
        .doc(tagId)
        .get();

      if (!tagDoc.exists) {
        return res.status(404).json({ message: 'Tag not found' });
      }

      const tagData = tagDoc.data();

      await db.collection('projects')
        .doc(projectId)
        .collection('tasks')
        .doc(taskId)
        .collection('tags')
        .doc(tagId)
        .delete();

      // Create history entry for tag deletion
      await createTaskHistoryEntry(
        projectId,
        taskId,
        req.user.uid,
        'tag_deleted',
        {
          tagId,
          name: tagData.name,
          color: tagData.color
        }
      );

      res.json({ message: 'Tag deleted successfully' });
    } catch (error) {
      console.error('Delete tag error:', error);
      res.status(500).json({ message: 'Error deleting tag' });
    }
  }
);

// Add subtask to task
router.post('/projects/:projectId/tasks/:taskId/subtasks',
  authenticate,
  checkRole(['pm']),
  [
    body('text').notEmpty().trim(),
    body('assignee').optional().isString(),
    body('dueDate').optional().isISO8601()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { projectId, taskId } = req.params;
      const { text, assignee, dueDate } = req.body;

      // Check if task exists
      const taskDoc = await db.collection('projects')
        .doc(projectId)
        .collection('tasks')
        .doc(taskId)
        .get();

      if (!taskDoc.exists) {
        return res.status(404).json({ message: 'Task not found' });
      }

      const subtaskData = {
        text,
        assignee: assignee || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        completed: false,
        createdBy: req.user.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const subtaskRef = await db.collection('projects')
        .doc(projectId)
        .collection('tasks')
        .doc(taskId)
        .collection('subtasks')
        .add(subtaskData);

      // Create history entry for subtask addition
      await createTaskHistoryEntry(
        projectId,
        taskId,
        req.user.uid,
        'subtask_added',
        {
          subtaskId: subtaskRef.id,
          text: text.substring(0, 100)
        }
      );

      res.status(201).json({
        message: 'Subtask added successfully',
        subtaskId: subtaskRef.id
      });
    } catch (error) {
      console.error('Add subtask error:', error);
      res.status(500).json({ message: 'Error adding subtask' });
    }
  }
);

// Get task subtasks
router.get('/projects/:projectId/tasks/:taskId/subtasks', authenticate, async (req, res) => {
  try {
    const { projectId, taskId } = req.params;

    // Check if user has access to project
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const projectData = projectDoc.data();
    const hasAccess = 
      req.user.roles.includes('admin') ||
      req.user.roles.includes('admin') ||
      projectData.customerId === req.user.uid ||
      projectData.pmId === req.user.uid ||
      projectData.team.includes(req.user.uid);

    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to view task subtasks' });
    }

    const subtasksSnapshot = await db.collection('projects')
      .doc(projectId)
      .collection('tasks')
      .doc(taskId)
      .collection('subtasks')
      .orderBy('createdAt', 'desc')
      .get();

    const subtasks = [];
    subtasksSnapshot.forEach(doc => {
      subtasks.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json(subtasks);
  } catch (error) {
    console.error('Get subtasks error:', error);
    res.status(500).json({ message: 'Error fetching subtasks' });
  }
});

// Update subtask
router.put('/projects/:projectId/tasks/:taskId/subtasks/:subtaskId',
  authenticate,
  checkRole(['pm']),
  [
    body('text').optional().trim(),
    body('assignee').optional().isString(),
    body('dueDate').optional().isISO8601(),
    body('completed').optional().isBoolean()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { projectId, taskId, subtaskId } = req.params;
      const updateData = req.body;

      // Check if subtask exists
      const subtaskDoc = await db.collection('projects')
        .doc(projectId)
        .collection('tasks')
        .doc(taskId)
        .collection('subtasks')
        .doc(subtaskId)
        .get();

      if (!subtaskDoc.exists) {
        return res.status(404).json({ message: 'Subtask not found' });
      }

      const subtaskData = subtaskDoc.data();

      // Convert dueDate to Date object if provided
      if (updateData.dueDate) {
        updateData.dueDate = new Date(updateData.dueDate);
      }

      updateData.updatedAt = new Date();

      await db.collection('projects')
        .doc(projectId)
        .collection('tasks')
        .doc(taskId)
        .collection('subtasks')
        .doc(subtaskId)
        .update(updateData);

      // Create history entry for subtask update
      await createTaskHistoryEntry(
        projectId,
        taskId,
        req.user.uid,
        'subtask_updated',
        {
          subtaskId,
          changes: Object.keys(updateData).reduce((acc, key) => {
            if (key !== 'updatedAt') {
              acc[key] = {
                from: subtaskData[key],
                to: updateData[key]
              };
            }
            return acc;
          }, {})
        }
      );

      res.json({ message: 'Subtask updated successfully' });
    } catch (error) {
      console.error('Update subtask error:', error);
      res.status(500).json({ message: 'Error updating subtask' });
    }
  }
);

// Delete subtask
router.delete('/projects/:projectId/tasks/:taskId/subtasks/:subtaskId',
  authenticate,
  checkRole(['pm']),
  async (req, res) => {
    try {
      const { projectId, taskId, subtaskId } = req.params;

      // Get subtask data before deletion
      const subtaskDoc = await db.collection('projects')
        .doc(projectId)
        .collection('tasks')
        .doc(taskId)
        .collection('subtasks')
        .doc(subtaskId)
        .get();

      if (!subtaskDoc.exists) {
        return res.status(404).json({ message: 'Subtask not found' });
      }

      const subtaskData = subtaskDoc.data();

      await db.collection('projects')
        .doc(projectId)
        .collection('tasks')
        .doc(taskId)
        .collection('subtasks')
        .doc(subtaskId)
        .delete();

      // Create history entry for subtask deletion
      await createTaskHistoryEntry(
        projectId,
        taskId,
        req.user.uid,
        'subtask_deleted',
        {
          subtaskId,
          text: subtaskData.text
        }
      );

      res.json({ message: 'Subtask deleted successfully' });
    } catch (error) {
      console.error('Delete subtask error:', error);
      res.status(500).json({ message: 'Error deleting subtask' });
    }
  }
);

// Add task dependency
router.post('/projects/:projectId/tasks/:taskId/dependencies',
  authenticate,
  checkRole(['pm']),
  [
    body('dependentTaskId').notEmpty().trim(),
    body('type').isIn(['blocks', 'blocked_by', 'relates_to'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { projectId, taskId } = req.params;
      const { dependentTaskId, type } = req.body;

      // Check if both tasks exist
      const [taskDoc, dependentTaskDoc] = await Promise.all([
        db.collection('projects').doc(projectId).collection('tasks').doc(taskId).get(),
        db.collection('projects').doc(projectId).collection('tasks').doc(dependentTaskId).get()
      ]);

      if (!taskDoc.exists || !dependentTaskDoc.exists) {
        return res.status(404).json({ message: 'One or both tasks not found' });
      }

      // Check for circular dependencies
      if (type === 'blocks' || type === 'blocked_by') {
        const isCircular = await checkCircularDependency(projectId, taskId, dependentTaskId);
        if (isCircular) {
          return res.status(400).json({ message: 'Circular dependency detected' });
        }
      }

      const dependencyData = {
        taskId,
        dependentTaskId,
        type,
        createdBy: req.user.uid,
        createdAt: new Date()
      };

      const dependencyRef = await db.collection('projects')
        .doc(projectId)
        .collection('tasks')
        .doc(taskId)
        .collection('dependencies')
        .add(dependencyData);

      // Create history entry for dependency addition
      await createTaskHistoryEntry(
        projectId,
        taskId,
        req.user.uid,
        'dependency_added',
        {
          dependencyId: dependencyRef.id,
          dependentTaskId,
          type
        }
      );

      res.status(201).json({
        message: 'Dependency added successfully',
        dependencyId: dependencyRef.id
      });
    } catch (error) {
      console.error('Add dependency error:', error);
      res.status(500).json({ message: 'Error adding dependency' });
    }
  }
);

// Helper function to check for circular dependencies
async function checkCircularDependency(projectId, taskId, dependentTaskId, visited = new Set()) {
  if (taskId === dependentTaskId) return true;
  if (visited.has(taskId)) return false;
  
  visited.add(taskId);
  
  const dependenciesSnapshot = await db.collection('projects')
    .doc(projectId)
    .collection('tasks')
    .doc(taskId)
    .collection('dependencies')
    .where('type', 'in', ['blocks', 'blocked_by'])
    .get();

  for (const doc of dependenciesSnapshot.docs) {
    const dependency = doc.data();
    const nextTaskId = dependency.type === 'blocks' ? dependency.dependentTaskId : dependency.taskId;
    
    if (await checkCircularDependency(projectId, nextTaskId, dependentTaskId, visited)) {
      return true;
    }
  }
  
  return false;
}

// Get task dependencies
router.get('/projects/:projectId/tasks/:taskId/dependencies', authenticate, async (req, res) => {
  try {
    const { projectId, taskId } = req.params;

    // Check if user has access to project
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const projectData = projectDoc.data();
    const hasAccess = 
      req.user.roles.includes('admin') ||
      req.user.roles.includes('admin') ||
      projectData.customerId === req.user.uid ||
      projectData.pmId === req.user.uid ||
      projectData.team.includes(req.user.uid);

    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to view task dependencies' });
    }

    const dependenciesSnapshot = await db.collection('projects')
      .doc(projectId)
      .collection('tasks')
      .doc(taskId)
      .collection('dependencies')
      .get();

    const dependencies = [];
    for (const doc of dependenciesSnapshot.docs) {
      const dependency = doc.data();
      // Get dependent task details
      const dependentTaskDoc = await db.collection('projects')
        .doc(projectId)
        .collection('tasks')
        .doc(dependency.dependentTaskId)
        .get();

      if (dependentTaskDoc.exists) {
        dependencies.push({
          id: doc.id,
          ...dependency,
          dependentTask: {
            id: dependentTaskDoc.id,
            ...dependentTaskDoc.data()
          }
        });
      }
    }

    res.json(dependencies);
  } catch (error) {
    console.error('Get dependencies error:', error);
    res.status(500).json({ message: 'Error fetching dependencies' });
  }
});

// Delete task dependency
router.delete('/projects/:projectId/tasks/:taskId/dependencies/:dependencyId',
  authenticate,
  checkRole(['pm']),
  async (req, res) => {
    try {
      const { projectId, taskId, dependencyId } = req.params;

      // Get dependency data before deletion
      const dependencyDoc = await db.collection('projects')
        .doc(projectId)
        .collection('tasks')
        .doc(taskId)
        .collection('dependencies')
        .doc(dependencyId)
        .get();

      if (!dependencyDoc.exists) {
        return res.status(404).json({ message: 'Dependency not found' });
      }

      const dependencyData = dependencyDoc.data();

      await db.collection('projects')
        .doc(projectId)
        .collection('tasks')
        .doc(taskId)
        .collection('dependencies')
        .doc(dependencyId)
        .delete();

      // Create history entry for dependency deletion
      await createTaskHistoryEntry(
        projectId,
        taskId,
        req.user.uid,
        'dependency_deleted',
        {
          dependencyId,
          dependentTaskId: dependencyData.dependentTaskId,
          type: dependencyData.type
        }
      );

      res.json({ message: 'Dependency deleted successfully' });
    } catch (error) {
      console.error('Delete dependency error:', error);
      res.status(500).json({ message: 'Error deleting dependency' });
    }
  }
);

// Filter tasks
router.get('/projects/:projectId/tasks/filter', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;
    const {
      assignee,
      column,
      status,
      dueDateBefore,
      dueDateAfter,
      createdBy,
      hasDependencies,
      hasSubtasks,
      hasFiles,
      searchText
    } = req.query;

    // Check if user has access to project
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const projectData = projectDoc.data();
    const hasAccess = 
      req.user.roles.includes('admin') ||
      req.user.roles.includes('admin') ||
      projectData.customerId === req.user.uid ||
      projectData.pmId === req.user.uid ||
      projectData.team.includes(req.user.uid);

    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to view project tasks' });
    }

    let query = db.collection('projects')
      .doc(projectId)
      .collection('tasks')
      .orderBy('createdAt', 'desc');

    // Apply filters
    if (assignee) {
      query = query.where('assignee', '==', assignee);
    }
    if (column) {
      query = query.where('column', '==', column);
    }
    if (status) {
      query = query.where('status', '==', status);
    }
    if (createdBy) {
      query = query.where('createdBy', '==', createdBy);
    }
    if (dueDateBefore) {
      query = query.where('dueDate', '<=', new Date(dueDateBefore));
    }
    if (dueDateAfter) {
      query = query.where('dueDate', '>=', new Date(dueDateAfter));
    }

    const tasksSnapshot = await query.get();
    let tasks = [];
    tasksSnapshot.forEach(doc => {
      tasks.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Apply additional filters that require checking subcollections
    if (hasDependencies === 'true') {
      const tasksWithDependencies = await Promise.all(
        tasks.map(async task => {
          const dependenciesSnapshot = await db.collection('projects')
            .doc(projectId)
            .collection('tasks')
            .doc(task.id)
            .collection('dependencies')
            .limit(1)
            .get();
          return dependenciesSnapshot.empty ? null : task;
        })
      );
      tasks = tasksWithDependencies.filter(Boolean);
    }

    if (hasSubtasks === 'true') {
      const tasksWithSubtasks = await Promise.all(
        tasks.map(async task => {
          const subtasksSnapshot = await db.collection('projects')
            .doc(projectId)
            .collection('tasks')
            .doc(task.id)
            .collection('subtasks')
            .limit(1)
            .get();
          return subtasksSnapshot.empty ? null : task;
        })
      );
      tasks = tasksWithSubtasks.filter(Boolean);
    }

    if (hasFiles === 'true') {
      const tasksWithFiles = await Promise.all(
        tasks.map(async task => {
          const filesSnapshot = await db.collection('projects')
            .doc(projectId)
            .collection('tasks')
            .doc(task.id)
            .collection('files')
            .limit(1)
            .get();
          return filesSnapshot.empty ? null : task;
        })
      );
      tasks = tasksWithFiles.filter(Boolean);
    }

    // Apply text search if provided
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      tasks = tasks.filter(task => 
        task.text.toLowerCase().includes(searchLower)
      );
    }

    res.json(tasks);
  } catch (error) {
    console.error('Filter tasks error:', error);
    res.status(500).json({ message: 'Error filtering tasks' });
  }
});

// Add time estimate to task
router.post('/projects/:projectId/tasks/:taskId/estimates',
  authenticate,
  checkRole(['pm']),
  [
    body('estimatedHours').isFloat({ min: 0 }),
    body('description').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { projectId, taskId } = req.params;
      const { estimatedHours, description } = req.body;

      // Check if task exists
      const taskDoc = await db.collection('projects')
        .doc(projectId)
        .collection('tasks')
        .doc(taskId)
        .get();

      if (!taskDoc.exists) {
        return res.status(404).json({ message: 'Task not found' });
      }

      const estimateData = {
        estimatedHours,
        description: description || null,
        createdBy: req.user.uid,
        createdAt: new Date()
      };

      const estimateRef = await db.collection('projects')
        .doc(projectId)
        .collection('tasks')
        .doc(taskId)
        .collection('estimates')
        .add(estimateData);

      // Update task with latest estimate
      await db.collection('projects')
        .doc(projectId)
        .collection('tasks')
        .doc(taskId)
        .update({
          estimatedHours,
          updatedAt: new Date()
        });

      // Create history entry for estimate
      await createTaskHistoryEntry(
        projectId,
        taskId,
        req.user.uid,
        'estimate_added',
        {
          estimateId: estimateRef.id,
          estimatedHours,
          description
        }
      );

      res.status(201).json({
        message: 'Time estimate added successfully',
        estimateId: estimateRef.id
      });
    } catch (error) {
      console.error('Add estimate error:', error);
      res.status(500).json({ message: 'Error adding time estimate' });
    }
  }
);

// Add time tracking entry
router.post('/projects/:projectId/tasks/:taskId/time-entries',
  authenticate,
  [
    body('hours').isFloat({ min: 0 }),
    body('description').optional().trim(),
    body('date').optional().isISO8601()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { projectId, taskId } = req.params;
      const { hours, description, date } = req.body;

      // Check if task exists
      const taskDoc = await db.collection('projects')
        .doc(projectId)
        .collection('tasks')
        .doc(taskId)
        .get();

      if (!taskDoc.exists) {
        return res.status(404).json({ message: 'Task not found' });
      }

      const timeEntryData = {
        hours,
        description: description || null,
        date: date ? new Date(date) : new Date(),
        createdBy: req.user.uid,
        createdAt: new Date()
      };

      const timeEntryRef = await db.collection('projects')
        .doc(projectId)
        .collection('tasks')
        .doc(taskId)
        .collection('timeEntries')
        .add(timeEntryData);

      // Update task with total time spent
      const timeEntriesSnapshot = await db.collection('projects')
        .doc(projectId)
        .collection('tasks')
        .doc(taskId)
        .collection('timeEntries')
        .get();

      let totalHours = 0;
      timeEntriesSnapshot.forEach(doc => {
        totalHours += doc.data().hours;
      });

      await db.collection('projects')
        .doc(projectId)
        .collection('tasks')
        .doc(taskId)
        .update({
          totalHoursSpent: totalHours,
          updatedAt: new Date()
        });

      // Create history entry for time tracking
      await createTaskHistoryEntry(
        projectId,
        taskId,
        req.user.uid,
        'time_entry_added',
        {
          timeEntryId: timeEntryRef.id,
          hours,
          description
        }
      );

      res.status(201).json({
        message: 'Time entry added successfully',
        timeEntryId: timeEntryRef.id
      });
    } catch (error) {
      console.error('Add time entry error:', error);
      res.status(500).json({ message: 'Error adding time entry' });
    }
  }
);

// Get task time entries
router.get('/projects/:projectId/tasks/:taskId/time-entries', authenticate, async (req, res) => {
  try {
    const { projectId, taskId } = req.params;
    const { startDate, endDate } = req.query;

    // Check if user has access to project
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const projectData = projectDoc.data();
    const hasAccess = 
      req.user.roles.includes('admin') ||
      req.user.roles.includes('admin') ||
      projectData.customerId === req.user.uid ||
      projectData.pmId === req.user.uid ||
      projectData.team.includes(req.user.uid);

    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to view time entries' });
    }

    let query = db.collection('projects')
      .doc(projectId)
      .collection('tasks')
      .doc(taskId)
      .collection('timeEntries')
      .orderBy('date', 'desc');

    if (startDate) {
      query = query.where('date', '>=', new Date(startDate));
    }
    if (endDate) {
      query = query.where('date', '<=', new Date(endDate));
    }

    const timeEntriesSnapshot = await query.get();
    const timeEntries = [];
    timeEntriesSnapshot.forEach(doc => {
      timeEntries.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json(timeEntries);
  } catch (error) {
    console.error('Get time entries error:', error);
    res.status(500).json({ message: 'Error fetching time entries' });
  }
});

// Get task statistics
router.get('/projects/:projectId/tasks/:taskId/statistics', authenticate, async (req, res) => {
  try {
    const { projectId, taskId } = req.params;

    // Check if user has access to project
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const projectData = projectDoc.data();
    const hasAccess = 
      req.user.roles.includes('admin') ||
      req.user.roles.includes('admin') ||
      projectData.customerId === req.user.uid ||
      projectData.pmId === req.user.uid ||
      projectData.team.includes(req.user.uid);

    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to view task statistics' });
    }

    // Get task data
    const taskDoc = await db.collection('projects')
      .doc(projectId)
      .collection('tasks')
      .doc(taskId)
      .get();

    if (!taskDoc.exists) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const taskData = taskDoc.data();

    // Get time entries
    const timeEntriesSnapshot = await db.collection('projects')
      .doc(projectId)
      .collection('tasks')
      .doc(taskId)
      .collection('timeEntries')
      .get();

    let totalHoursSpent = 0;
    const timeEntriesByUser = {};
    timeEntriesSnapshot.forEach(doc => {
      const entry = doc.data();
      totalHoursSpent += entry.hours;
      timeEntriesByUser[entry.createdBy] = (timeEntriesByUser[entry.createdBy] || 0) + entry.hours;
    });

    // Get subtasks statistics
    const subtasksSnapshot = await db.collection('projects')
      .doc(projectId)
      .collection('tasks')
      .doc(taskId)
      .collection('subtasks')
      .get();

    let totalSubtasks = 0;
    let completedSubtasks = 0;
    subtasksSnapshot.forEach(doc => {
      totalSubtasks++;
      if (doc.data().completed) {
        completedSubtasks++;
      }
    });

    // Get dependencies statistics
    const dependenciesSnapshot = await db.collection('projects')
      .doc(projectId)
      .collection('tasks')
      .doc(taskId)
      .collection('dependencies')
      .get();

    const dependenciesByType = {
      blocks: 0,
      blocked_by: 0,
      relates_to: 0
    };

    dependenciesSnapshot.forEach(doc => {
      const dependency = doc.data();
      dependenciesByType[dependency.type]++;
    });

    // Calculate progress
    const progress = totalSubtasks > 0 
      ? (completedSubtasks / totalSubtasks) * 100 
      : (taskData.status === 'done' ? 100 : 0);

    // Calculate time variance
    const timeVariance = taskData.estimatedHours 
      ? ((totalHoursSpent - taskData.estimatedHours) / taskData.estimatedHours) * 100 
      : null;

    const statistics = {
      timeTracking: {
        estimatedHours: taskData.estimatedHours || 0,
        totalHoursSpent,
        timeVariance,
        timeEntriesByUser
      },
      subtasks: {
        total: totalSubtasks,
        completed: completedSubtasks,
        progress
      },
      dependencies: dependenciesByType,
      lastUpdated: taskData.updatedAt
    };

    res.json(statistics);
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ message: 'Error fetching task statistics' });
  }
});

// Get project tasks statistics
router.get('/projects/:projectId/tasks/statistics', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;

    // Check if user has access to project
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const projectData = projectDoc.data();
    const hasAccess = 
      req.user.roles.includes('admin') ||
      req.user.roles.includes('admin') ||
      projectData.customerId === req.user.uid ||
      projectData.pmId === req.user.uid ||
      projectData.team.includes(req.user.uid);

    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to view project statistics' });
    }

    // Get all tasks
    const tasksSnapshot = await db.collection('projects')
      .doc(projectId)
      .collection('tasks')
      .get();

    const statistics = {
      totalTasks: 0,
      completedTasks: 0,
      totalEstimatedHours: 0,
      totalHoursSpent: 0,
      tasksByStatus: {},
      tasksByAssignee: {},
      tasksByColumn: {},
      averageTimeVariance: 0,
      timeVarianceCount: 0
    };

    for (const taskDoc of tasksSnapshot.docs) {
      const taskData = taskDoc.data();
      statistics.totalTasks++;

      // Count by status
      statistics.tasksByStatus[taskData.status] = (statistics.tasksByStatus[taskData.status] || 0) + 1;
      if (taskData.status === 'done') {
        statistics.completedTasks++;
      }

      // Count by assignee
      if (taskData.assignee) {
        statistics.tasksByAssignee[taskData.assignee] = (statistics.tasksByAssignee[taskData.assignee] || 0) + 1;
      }

      // Count by column
      statistics.tasksByColumn[taskData.column] = (statistics.tasksByColumn[taskData.column] || 0) + 1;

      // Time tracking
      if (taskData.estimatedHours) {
        statistics.totalEstimatedHours += taskData.estimatedHours;
      }
      if (taskData.totalHoursSpent) {
        statistics.totalHoursSpent += taskData.totalHoursSpent;
      }

      // Calculate time variance
      if (taskData.estimatedHours && taskData.totalHoursSpent) {
        const variance = ((taskData.totalHoursSpent - taskData.estimatedHours) / taskData.estimatedHours) * 100;
        statistics.averageTimeVariance += variance;
        statistics.timeVarianceCount++;
      }
    }

    // Calculate average time variance
    if (statistics.timeVarianceCount > 0) {
      statistics.averageTimeVariance /= statistics.timeVarianceCount;
    }

    // Calculate project progress
    statistics.projectProgress = statistics.totalTasks > 0 
      ? (statistics.completedTasks / statistics.totalTasks) * 100 
      : 0;

    res.json(statistics);
  } catch (error) {
    console.error('Get project statistics error:', error);
    res.status(500).json({ message: 'Error fetching project statistics' });
  }
});

// Get project activity
router.get('/projects/:projectId/activity', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { 
      action,
      startDate,
      endDate,
      userId,
      limit = 50,
      before
    } = req.query;

    // Check if user has access to project
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const projectData = projectDoc.data();
    const hasAccess = 
      req.user.roles.includes('admin') ||
      req.user.roles.includes('admin') ||
      projectData.customerId === req.user.uid ||
      projectData.pmId === req.user.uid ||
      projectData.team.includes(req.user.uid);

    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to view project activity' });
    }

    let query = db.collection('projects')
      .doc(projectId)
      .collection('activity')
      .orderBy('timestamp', 'desc')
      .limit(parseInt(limit));

    // Apply filters
    if (action) {
      query = query.where('action', '==', action);
    }
    if (userId) {
      query = query.where('userId', '==', userId);
    }
    if (startDate) {
      query = query.where('timestamp', '>=', new Date(startDate));
    }
    if (endDate) {
      query = query.where('timestamp', '<=', new Date(endDate));
    }
    if (before) {
      query = query.startAfter(before);
    }

    const activitySnapshot = await query.get();
    const activities = [];
    
    for (const doc of activitySnapshot.docs) {
      const activity = doc.data();
      
      // Get user details for each activity
      const userDoc = await db.collection('users').doc(activity.userId).get();
      const userData = userDoc.exists ? userDoc.data() : null;

      activities.push({
        id: doc.id,
        ...activity,
        user: userData ? {
          id: userData.uid,
          fullName: userData.fullName,
          profileImage: userData.profileImage
        } : null
      });
    }

    res.json(activities);
  } catch (error) {
    console.error('Get project activity error:', error);
    res.status(500).json({ message: 'Error fetching project activity' });
  }
});

// Get project activity statistics
router.get('/projects/:projectId/activity/statistics', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { startDate, endDate } = req.query;

    // Check if user has access to project
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const projectData = projectDoc.data();
    const hasAccess = 
      req.user.roles.includes('admin') ||
      req.user.roles.includes('admin') ||
      projectData.customerId === req.user.uid ||
      projectData.pmId === req.user.uid ||
      projectData.team.includes(req.user.uid);

    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to view project activity statistics' });
    }

    let query = db.collection('projects')
      .doc(projectId)
      .collection('activity');

    if (startDate) {
      query = query.where('timestamp', '>=', new Date(startDate));
    }
    if (endDate) {
      query = query.where('timestamp', '<=', new Date(endDate));
    }

    const activitySnapshot = await query.get();
    
    const statistics = {
      totalActivities: 0,
      activitiesByType: {},
      activitiesByUser: {},
      activitiesByDay: {},
      mostActiveUsers: [],
      mostFrequentActions: []
    };

    activitySnapshot.forEach(doc => {
      const activity = doc.data();
      statistics.totalActivities++;

      // Count by action type
      statistics.activitiesByType[activity.action] = 
        (statistics.activitiesByType[activity.action] || 0) + 1;

      // Count by user
      statistics.activitiesByUser[activity.userId] = 
        (statistics.activitiesByUser[activity.userId] || 0) + 1;

      // Count by day
      const day = activity.timestamp.toDate().toISOString().split('T')[0];
      statistics.activitiesByDay[day] = 
        (statistics.activitiesByDay[day] || 0) + 1;
    });

    // Calculate most active users
    statistics.mostActiveUsers = Object.entries(statistics.activitiesByUser)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([userId, count]) => ({ userId, count }));

    // Calculate most frequent actions
    statistics.mostFrequentActions = Object.entries(statistics.activitiesByType)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([action, count]) => ({ action, count }));

    // Get user details for most active users
    for (const user of statistics.mostActiveUsers) {
      const userDoc = await db.collection('users').doc(user.userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        user.fullName = userData.fullName;
        user.profileImage = userData.profileImage;
      }
    }

    res.json(statistics);
  } catch (error) {
    console.error('Get activity statistics error:', error);
    res.status(500).json({ message: 'Error fetching activity statistics' });
  }
});

module.exports = router; 