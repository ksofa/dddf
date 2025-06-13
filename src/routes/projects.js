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
 *               adminId:
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
const admin = require('firebase-admin');

// Firebase error handler
const handleFirebaseError = (error) => {
  console.error('Firebase error:', error);
  
  if (error.code === 'permission-denied') {
    return { status: 403, message: 'Access denied to Firebase resource' };
  }
  
  if (error.code === 'not-found') {
    return { status: 404, message: 'Resource not found in Firebase' };
  }
  
  if (error.code === 'already-exists') {
    return { status: 409, message: 'Resource already exists' };
  }
  
  if (error.code === 'invalid-argument') {
    return { status: 400, message: 'Invalid argument provided' };
  }
  
  return { status: 500, message: 'Firebase operation failed' };
};

// Validation middleware
const validateProject = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('status').optional().isArray().withMessage('Status must be an array'),
  body('customerId').optional().isString().withMessage('Customer ID must be a string'),
  body('teamMembers').optional().isArray().withMessage('Team members must be an array'),
  body('teamLead').optional().isString().withMessage('Team lead must be a string'),
  body('pmId').optional().isString().withMessage('PM ID must be a string')
];

// Get projects list with improved error handling
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, stage, limit = 50, before } = req.query;

    let query = db.collection('projects');
    let needsClientSideFiltering = false;
    let filterField = null;
    let filterValue = null;

    // Фильтрация по роли пользователя
    if (req.user.roles && req.user.roles.includes('admin')) {
      // Админы могут видеть все проекты
    } else if (req.user.roles && req.user.roles.includes('customer')) {
      query = query.where('customerId', '==', req.user.uid);
    } else if (req.user.roles && req.user.roles.includes('pm')) {
      needsClientSideFiltering = true;
      filterField = 'pmId';
      filterValue = req.user.uid;
    } else if (req.user.roles && req.user.roles.includes('teamlead')) {
      needsClientSideFiltering = true;
      filterField = 'teamLead';
      filterValue = req.user.uid;
    } else if (req.user.roles && req.user.roles.includes('executor')) {
      needsClientSideFiltering = true;
      filterField = 'teamMembers';
      filterValue = req.user.uid;
    } else {
      needsClientSideFiltering = true;
      filterField = 'teamMembers';
      filterValue = req.user.uid;
    }

    // Дополнительная фильтрация
    if (status) {
      query = query.where('status', '==', status);
    }

    if (stage) {
      query = query.where('stage', '==', stage);
    }

    // Сортировка и лимит
    const queryLimit = needsClientSideFiltering ? parseInt(limit) * 3 : parseInt(limit);
    query = query.orderBy('createdAt', 'desc').limit(queryLimit);

    if (before) {
      query = query.startAfter(before);
    }

    const projectsSnapshot = await query.get();
    let filteredDocs = projectsSnapshot.docs;

    // Применяем клиентскую фильтрацию если необходимо
    if (needsClientSideFiltering) {
      filteredDocs = projectsSnapshot.docs.filter(doc => {
        const project = doc.data();
        if (filterField === 'pmId') {
          return project.pmId === filterValue;
        } else if (filterField === 'teamLead') {
          return project.teamLead === filterValue;
        } else if (filterField === 'teamMembers') {
          return project.teamMembers && project.teamMembers.includes(filterValue);
        }
        return false;
      });
      
      filteredDocs = filteredDocs.slice(0, parseInt(limit));
    }

    const projects = await Promise.all(filteredDocs.map(async (doc) => {
      const project = doc.data();
      
      try {
        // Get customer details
        let customerData = null;
        if (project.customerId) {
          const customerDoc = await db.collection('users').doc(project.customerId).get();
          customerData = customerDoc.exists ? customerDoc.data() : null;
        }

        // Get PM details
        let pmData = null;
        if (project.pmId) {
          const pmDoc = await db.collection('users').doc(project.pmId).get();
          pmData = pmDoc.exists ? pmDoc.data() : null;
        }

        // Get team lead details
        let teamLeadData = null;
        if (project.teamLead) {
          const teamLeadDoc = await db.collection('users').doc(project.teamLead).get();
          teamLeadData = teamLeadDoc.exists ? teamLeadDoc.data() : null;
        }

        // Get team members details
        const teamMembers = [];
        if (project.teamMembers && project.teamMembers.length > 0) {
          const teamPromises = project.teamMembers.map(async (memberId) => {
            const memberDoc = await db.collection('users').doc(memberId).get();
            if (memberDoc.exists) {
              const memberData = memberDoc.data();
              teamMembers.push({
                id: memberId,
                displayName: memberData.displayName || memberData.fullName,
                email: memberData.email,
                roles: memberData.roles
              });
            }
          });
          await Promise.all(teamPromises);
        }

        return {
          id: doc.id,
          ...project,
          customer: customerData ? {
            id: project.customerId,
            fullName: customerData.fullName || customerData.displayName,
            email: customerData.email
          } : null,
          pm: pmData ? {
            id: project.pmId,
            fullName: pmData.fullName || pmData.displayName,
            email: pmData.email
          } : null,
          teamLead: teamLeadData ? {
            id: project.teamLead,
            fullName: teamLeadData.fullName || teamLeadData.displayName,
            email: teamLeadData.email
          } : null,
          teamMembers
        };
      } catch (error) {
        console.error(`Error enriching project ${doc.id}:`, error);
        return {
          id: doc.id,
          ...project,
          error: 'Error loading additional data'
        };
      }
    }));

    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    const { status, message } = handleFirebaseError(error);
    res.status(status).json({ error: message });
  }
});

// Функция для автоматического создания чатов проекта
async function createProjectChats(projectId, projectData) {
  try {
    const teamMembers = projectData.teamMembers || [];
    const pmId = projectData.teamLead || projectData.pmId;
    
    if (teamMembers.length === 0) {
      console.log('No team members to create chats for');
      return;
    }

    // 1. Создаем общий чат команды
    const teamChatData = {
      name: `Общий чат команды - ${projectData.title}`,
      type: 'group',
      participants: teamMembers,
      createdBy: pmId,
      createdAt: new Date(),
      updatedAt: new Date(),
      isTeamChat: true
    };

    const teamChatRef = await db.collection('projects')
      .doc(projectId)
      .collection('chats')
      .add(teamChatData);

    console.log(`Created team chat: ${teamChatRef.id}`);

    // 2. Создаем приватные чаты PM с каждым участником
    if (pmId) {
      for (const memberId of teamMembers) {
        if (memberId !== pmId) {
          // Получаем информацию о участнике
          const memberDoc = await db.collection('users').doc(memberId).get();
          const memberData = memberDoc.exists ? memberDoc.data() : null;
          const memberName = memberData ? (memberData.displayName || memberData.fullName || 'Участник') : 'Участник';

          const privateChatData = {
            name: `Чат с ${memberName}`,
            type: 'direct',
            participants: [pmId, memberId],
            createdBy: pmId,
            createdAt: new Date(),
            updatedAt: new Date(),
            isPrivateChat: true
          };

          const privateChatRef = await db.collection('projects')
            .doc(projectId)
            .collection('chats')
            .add(privateChatData);

          console.log(`Created private chat with ${memberName}: ${privateChatRef.id}`);
        }
      }
    }

    console.log(`Successfully created chats for project ${projectId}`);
  } catch (error) {
    console.error('Error creating project chats:', error);
  }
}

// Create project with improved validation
router.post('/', authenticate, validateProject, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      status = ['planning'],
      client,
      customerInfo,
      techSpec,
      teamLead,
      teamMembers = [],
      manager
    } = req.body;

    // Проверяем права доступа
    const canCreate = req.user.roles && (
      req.user.roles.includes('admin') ||
      req.user.roles.includes('pm') ||
      req.user.roles.includes('teamlead')
    );

    if (!canCreate) {
      return res.status(403).json({ error: 'Недостаточно прав для создания проекта' });
    }

    // Validate team lead if provided
    if (teamLead) {
      const teamLeadDoc = await db.collection('users').doc(teamLead).get();
      if (!teamLeadDoc.exists) {
        return res.status(400).json({ error: 'Team lead not found' });
      }
      const teamLeadData = teamLeadDoc.data();
      if (!teamLeadData.roles || !teamLeadData.roles.includes('teamlead')) {
        return res.status(400).json({ error: 'User is not a team lead' });
      }
    }

    // Validate team members if provided
    if (teamMembers.length > 0) {
      const memberPromises = teamMembers.map(async (memberId) => {
        const memberDoc = await db.collection('users').doc(memberId).get();
        return memberDoc.exists;
      });
      const memberResults = await Promise.all(memberPromises);
      if (memberResults.includes(false)) {
        return res.status(400).json({ error: 'One or more team members not found' });
      }
    }

    const projectData = {
      title,
      description,
      status,
      client,
      customerInfo,
      techSpec,
      teamLead,
      teamMembers,
      team: teamMembers, // Дублируем для совместимости
      manager: manager || teamLead,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: req.user.uid
    };

    const docRef = await db.collection('projects').add(projectData);
    
    // Create project chats
    await createProjectChats(docRef.id, projectData);

    // Create initial activity log
    await db.collection('projects')
      .doc(docRef.id)
      .collection('activity')
      .add({
        type: 'project_created',
        userId: req.user.uid,
        details: {
          title,
          description
        },
        timestamp: new Date()
      });

    res.status(201).json({
      message: 'Проект создан успешно',
      projectId: docRef.id,
      project: { id: docRef.id, ...projectData }
    });
  } catch (error) {
    console.error('Error creating project:', error);
    const { status, message } = handleFirebaseError(error);
    res.status(status).json({ error: message });
  }
});

// Get project by ID
router.get('/:projectId', authenticate, async (req, res) => {
  try {
    console.log('Fetching project:', req.params.projectId);
    console.log('User:', req.user.uid, 'Roles:', req.user.roles);

    const projectRef = db.collection('projects').doc(req.params.projectId);
    const projectDoc = await projectRef.get();

    if (!projectDoc.exists) {
      console.log('Project not found:', req.params.projectId);
      return res.status(404).json({ error: 'Project not found' });
    }

    const projectData = projectDoc.data();
    console.log('Project data retrieved successfully');

    // Check if user has access to this project
    const hasAccess = 
      req.user.roles.includes('admin') ||
      projectData.customerId === req.user.uid ||
      projectData.pmId === req.user.uid ||
      (projectData.teamMembers && projectData.teamMembers.includes(req.user.uid));

    if (!hasAccess) {
      console.log('Access denied for user:', req.user.uid);
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get customer details
    let customerData = null;
    if (projectData.customerId) {
      const customerDoc = await db.collection('users').doc(projectData.customerId).get();
      customerData = customerDoc.exists ? customerDoc.data() : null;
    }

    // Get PM details if assigned
    let pmData = null;
    if (projectData.pmId) {
      const pmDoc = await db.collection('users').doc(projectData.pmId).get();
      pmData = pmDoc.exists ? pmDoc.data() : null;
    }

    // Get team lead details if assigned
    let teamLeadData = null;
    if (projectData.teamLead) {
      const teamLeadDoc = await db.collection('users').doc(projectData.teamLead).get();
      teamLeadData = teamLeadDoc.exists ? teamLeadDoc.data() : null;
    }

    // Get team members details
    const teamMembers = [];
    if (projectData.teamMembers && projectData.teamMembers.length > 0) {
      const teamPromises = projectData.teamMembers.map(async (memberId) => {
        const memberDoc = await db.collection('users').doc(memberId).get();
        if (memberDoc.exists) {
          const memberData = memberDoc.data();
          teamMembers.push({
            id: memberId,
            displayName: memberData.displayName || memberData.fullName,
            email: memberData.email,
            roles: memberData.roles
          });
        }
      });
      await Promise.all(teamPromises);
    }

    // Get project documents
    const documentsSnapshot = await db.collection('projects')
      .doc(req.params.projectId)
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
      .doc(req.params.projectId)
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

    // Get project tasks
    const tasksSnapshot = await db.collection('projects')
      .doc(req.params.projectId)
      .collection('tasks')
      .get();

    const tasks = [];
    tasksSnapshot.forEach(doc => {
      tasks.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Combine all data
    const enrichedProjectData = {
      id: projectDoc.id,
      ...projectData,
      customer: customerData ? {
        id: projectData.customerId,
        fullName: customerData.fullName || customerData.displayName,
        email: customerData.email
      } : null,
      pm: pmData ? {
        id: projectData.pmId,
        fullName: pmData.fullName || pmData.displayName,
        email: pmData.email
      } : null,
      teamLead: teamLeadData ? {
        id: projectData.teamLead,
        fullName: teamLeadData.fullName || teamLeadData.displayName,
        email: teamLeadData.email
      } : null,
      teamMembers,
      documents,
      activity,
      tasks
    };

    res.json(enrichedProjectData);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Update project
router.put('/:projectId',
  authenticate,
  checkRole(['admin', 'pm']),
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
        (req.user.roles.includes('admin') && project.status === 'pre_project') ||
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
  checkRole(['admin']),
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
// Get project tasks
router.get('/:projectId/tasks', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;

    // Check if project exists
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const project = projectDoc.data();
    
    // Check if user has access to view tasks
    const canViewTasks = 
      req.user.roles && req.user.roles.includes('admin') ||
      project.pmId === req.user.uid ||
      project.team?.includes(req.user.uid) ||
      project.teamMembers?.some(member => member.id === req.user.uid || member === req.user.uid);
    
    console.log('🔍 Task view permission check (projects.js):', {
      userId: req.user.uid,
      userRoles: req.user.roles,
      projectId: projectId,
      projectPmId: project.pmId,
      projectTeam: project.team,
      canViewTasks: canViewTasks
    });
    
    if (!canViewTasks) {
      return res.status(403).json({ message: 'Not authorized to view tasks in this project' });
    }

    // Get all tasks for the project
    const tasksSnapshot = await db.collection('projects')
      .doc(projectId)
      .collection('tasks')
      .orderBy('createdAt', 'desc')
      .get();

    const tasks = [];
    for (const doc of tasksSnapshot.docs) {
      const taskData = doc.data();
      
      // Get assignee details if exists
      let assigneeDetails = null;
      if (taskData.assignee) {
        try {
          const assigneeDoc = await db.collection('users').doc(taskData.assignee).get();
          if (assigneeDoc.exists) {
            const assigneeData = assigneeDoc.data();
            assigneeDetails = {
              id: taskData.assignee,
              fullName: assigneeData.fullName || assigneeData.displayName,
              email: assigneeData.email,
              profileImage: assigneeData.profileImage
            };
          }
        } catch (error) {
          console.error('Error fetching assignee details:', error);
        }
      }

      tasks.push({
        id: doc.id,
        ...taskData,
        assigneeDetails
      });
    }

    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Error fetching tasks' });
  }
});

router.post('/:projectId/tasks',
  authenticate,
  [
    body('text').notEmpty().trim(),
    body('column').notEmpty().trim(),
    body('status').optional().isString(),
    body('assignee').optional().isString(),
    body('dueDate').optional().isISO8601(),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
    body('color').optional().isString(),
    body('description').optional().isString()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { projectId } = req.params;
      const { text, column, status, assignee, dueDate, priority, color, description } = req.body;

      // Check if user is PM of the project
      const projectDoc = await db.collection('projects').doc(projectId).get();
      if (!projectDoc.exists) {
        return res.status(404).json({ message: 'Project not found' });
      }

      const project = projectDoc.data();
      
      // Проверяем права доступа для создания задач
      const canCreateTasks = 
        req.user.roles && req.user.roles.includes('admin') ||
        project.pmId === req.user.uid;
      
      console.log('🔍 Task creation permission check (projects.js):', {
        userId: req.user.uid,
        userRoles: req.user.roles,
        projectId: projectId,
        projectPmId: project.pmId,
        canCreateTasks: canCreateTasks
      });
      
      if (!canCreateTasks) {
        return res.status(403).json({ message: 'Not authorized to create tasks in this project' });
      }

      // Validate assignee if provided
      if (assignee) {
        const assigneeDoc = await db.collection('users').doc(assignee).get();
        if (!assigneeDoc.exists) {
          return res.status(400).json({ message: 'Assignee not found' });
        }
      }

      const taskData = {
        text,
        title: text, // Also store as title for compatibility
        column,
        status: status || column || 'todo',
        assignee: assignee || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || 'medium',
        color: color || '#3B82F6',
        description: description || null,
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

      // Check if user is PM of the project
      const projectDoc = await db.collection('projects').doc(projectId).get();
      if (!projectDoc.exists) {
        return res.status(404).json({ message: 'Project not found' });
      }

      const project = projectDoc.data();
      
      // Проверяем права доступа для обновления задач
      const canUpdateTasks = 
        req.user.roles && req.user.roles.includes('admin') ||
        project.pmId === req.user.uid;
      
      console.log('🔍 Task update permission check (projects.js):', {
        userId: req.user.uid,
        userRoles: req.user.roles,
        projectId: projectId,
        projectPmId: project.pmId,
        canUpdateTasks: canUpdateTasks
      });
      
      if (!canUpdateTasks) {
        return res.status(403).json({ message: 'Not authorized to update tasks in this project' });
      }

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

// Delete task (PM only)
router.delete('/:projectId/tasks/:taskId', authenticate, async (req, res) => {
  try {
    const { projectId, taskId } = req.params;

    // Get task
    const taskDoc = await db.collection('projects')
      .doc(projectId)
      .collection('tasks')
      .doc(taskId)
      .get();

    if (!taskDoc.exists) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const taskData = taskDoc.data();

    // Check if user is PM
    const isPM = taskData.createdBy === req.user.uid;
    const isAdmin = req.user.roles.includes('admin');

    if (!isPM && !isAdmin) {
      return res.status(403).json({ error: 'Only project manager can delete tasks' });
    }

    await db.collection('projects')
      .doc(projectId)
      .collection('tasks')
      .doc(taskId)
      .delete();

    // Create activity log
    await db.collection('projects')
      .doc(projectId)
      .collection('activity')
      .add({
        type: 'task_deleted',
        userId: req.user.uid,
        details: {
          taskId,
          title: taskData.title
        },
        timestamp: new Date()
      });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    const { status, message } = handleFirebaseError(error);
    res.status(status).json({ error: message });
  }
});

// Task comments routes
// Get task comments
router.get('/:projectId/tasks/:taskId/comments', authenticate, async (req, res) => {
  try {
    const { projectId, taskId } = req.params;

    // Check if project exists and user has access
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const project = projectDoc.data();
    
    // Check if user has access to view comments
    const canViewComments = 
      req.user.roles && req.user.roles.includes('admin') ||
      project.pmId === req.user.uid ||
      project.team?.includes(req.user.uid) ||
      project.teamMembers?.some(member => member.id === req.user.uid || member === req.user.uid);
    
    if (!canViewComments) {
      return res.status(403).json({ message: 'Not authorized to view comments' });
    }

    // Check if task exists
    const taskDoc = await db.collection('projects')
      .doc(projectId)
      .collection('tasks')
      .doc(taskId)
      .get();

    if (!taskDoc.exists) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Get comments
    const commentsSnapshot = await db.collection('projects')
      .doc(projectId)
      .collection('tasks')
      .doc(taskId)
      .collection('comments')
      .orderBy('createdAt', 'asc')
      .get();

    const comments = [];
    for (const doc of commentsSnapshot.docs) {
      const commentData = doc.data();
      
      // Get user details for comment author
      let authorName = commentData.createdBy;
      try {
        const authorDoc = await db.collection('users').doc(commentData.createdBy).get();
        if (authorDoc.exists) {
          const authorData = authorDoc.data();
          authorName = authorData.displayName || authorData.fullName || authorData.email;
        }
      } catch (error) {
        console.error('Error fetching comment author:', error);
      }

      comments.push({
        id: doc.id,
        text: commentData.text,
        createdBy: authorName,
        createdAt: commentData.createdAt?.toDate?.() || commentData.createdAt,
        updatedAt: commentData.updatedAt?.toDate?.() || commentData.updatedAt,
        mentions: commentData.mentions || []
      });
    }

    res.json(comments);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Error fetching comments' });
  }
});

// Add task comment
router.post('/:projectId/tasks/:taskId/comments', authenticate, async (req, res) => {
  try {
    const { projectId, taskId } = req.params;
    const { text, mentions = [] } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    // Check if project exists and user has access
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const project = projectDoc.data();
    
    // Check if user has access to add comments
    const canAddComments = 
      req.user.roles && req.user.roles.includes('admin') ||
      project.pmId === req.user.uid ||
      project.team?.includes(req.user.uid) ||
      project.teamMembers?.some(member => member.id === req.user.uid || member === req.user.uid);
    
    if (!canAddComments) {
      return res.status(403).json({ message: 'Not authorized to add comments' });
    }

    // Check if task exists
    const taskDoc = await db.collection('projects')
      .doc(projectId)
      .collection('tasks')
      .doc(taskId)
      .get();

    if (!taskDoc.exists) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Add comment
    const commentData = {
      text: text.trim(),
      createdBy: req.user.uid,
      createdAt: new Date(),
      mentions: mentions || []
    };

    const commentRef = await db.collection('projects')
      .doc(projectId)
      .collection('tasks')
      .doc(taskId)
      .collection('comments')
      .add(commentData);

    res.status(201).json({
      message: 'Comment added successfully',
      commentId: commentRef.id
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Error adding comment' });
  }
});

// Delete task comment
router.delete('/:projectId/tasks/:taskId/comments/:commentId', authenticate, async (req, res) => {
  try {
    const { projectId, taskId, commentId } = req.params;

    // Check if project exists
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const project = projectDoc.data();

    // Check if task exists
    const taskDoc = await db.collection('projects')
      .doc(projectId)
      .collection('tasks')
      .doc(taskId)
      .get();

    if (!taskDoc.exists) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Get comment
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

    // Check if user can delete comment (author, PM, or admin)
    const canDeleteComment = 
      req.user.roles && req.user.roles.includes('admin') ||
      project.pmId === req.user.uid ||
      commentData.createdBy === req.user.uid;
    
    if (!canDeleteComment) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    // Delete comment
    await db.collection('projects')
      .doc(projectId)
      .collection('tasks')
      .doc(taskId)
      .collection('comments')
      .doc(commentId)
      .delete();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Error deleting comment' });
  }
});

// Get PM's projects and teams
router.get('/pm/dashboard', authenticate, async (req, res) => {
  try {
    // Check if user is PM
    if (!req.user.roles.includes('pm')) {
      return res.status(403).json({ error: 'Only PM can access this endpoint' });
    }

    // Get all projects where user is PM
    const projectsSnapshot = await db.collection('projects')
      .where('pmId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .get();

    const projects = [];
    for (const doc of projectsSnapshot.docs) {
      const project = doc.data();
      
      // Get team members details
      const teamMembers = [];
      if (project.teamMembers && project.teamMembers.length > 0) {
        const memberPromises = project.teamMembers.map(async (memberId) => {
          const memberDoc = await db.collection('users').doc(memberId).get();
          if (memberDoc.exists) {
            const memberData = memberDoc.data();
            teamMembers.push({
              id: memberId,
              displayName: memberData.displayName || memberData.fullName,
              email: memberData.email,
              roles: memberData.roles,
              specialization: memberData.specialization
            });
          }
        });
        await Promise.all(memberPromises);
      }

      // Get project statistics
      const tasksSnapshot = await db.collection('projects')
        .doc(doc.id)
        .collection('tasks')
        .get();

      const tasks = tasksSnapshot.docs.map(taskDoc => taskDoc.data());
      const stats = {
        total: tasks.length,
        backlog: tasks.filter(t => t.status === 'backlog').length,
        todo: tasks.filter(t => t.status === 'todo').length,
        in_progress: tasks.filter(t => t.status === 'in_progress').length,
        review: tasks.filter(t => t.status === 'review').length,
        done: tasks.filter(t => t.status === 'done').length
      };

      projects.push({
        id: doc.id,
        ...project,
        teamMembers,
        stats
      });
    }

    res.json({ projects });
  } catch (error) {
    console.error('Error fetching PM dashboard:', error);
    const { status, message } = handleFirebaseError(error);
    res.status(status).json({ error: message });
  }
});

// Get project team details
router.get('/:projectId/team', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;

    // Get project
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const projectData = projectDoc.data();

    // Check if user is PM of this project or team member
    const isPM = projectData.pmId === req.user.uid;
    const isAdmin = req.user.roles.includes('admin');
    const isTeamMember = projectData.teamMembers && 
      (Array.isArray(projectData.teamMembers) 
        ? projectData.teamMembers.some(member => 
            typeof member === 'string' ? member === req.user.uid : member.id === req.user.uid)
        : false);

    if (!isPM && !isAdmin && !isTeamMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get team members with detailed information
    const teamMembers = [];
    
    // Add PM to team members
    if (projectData.pmId) {
      try {
        const pmDoc = await db.collection('users').doc(projectData.pmId).get();
        if (pmDoc.exists) {
          const pmData = pmDoc.data();
          teamMembers.push({
            id: projectData.pmId,
            name: pmData.name || pmData.displayName || pmData.fullName || 'Unknown',
            email: pmData.email,
            roles: pmData.roles || [],
            avatar: pmData.avatar || pmData.photoURL || pmData.profileImage,
            role: 'pm'
          });
        }
      } catch (error) {
        console.error(`Error getting PM ${projectData.pmId}:`, error);
      }
    }

    // Add team members
    if (projectData.teamMembers && projectData.teamMembers.length > 0) {
      const memberPromises = projectData.teamMembers.map(async (member) => {
        const memberId = typeof member === 'string' ? member : member.id;
        
        // Skip if already added as PM
        if (memberId === projectData.pmId) return;
        
        try {
          const memberDoc = await db.collection('users').doc(memberId).get();
          if (memberDoc.exists) {
            const memberData = memberDoc.data();
            
            teamMembers.push({
              id: memberId,
              name: memberData.name || memberData.displayName || memberData.fullName || 'Unknown',
              email: memberData.email,
              roles: memberData.roles || [],
              avatar: memberData.avatar || memberData.photoURL || memberData.profileImage,
              role: 'member'
            });
          }
        } catch (error) {
          console.error(`Error getting user ${memberId}:`, error);
        }
      });
      await Promise.all(memberPromises);
    }

    // Add team lead if exists and not already added
    if (projectData.teamLead && projectData.teamLead !== projectData.pmId) {
      try {
        const leadDoc = await db.collection('users').doc(projectData.teamLead).get();
        if (leadDoc.exists) {
          const leadData = leadDoc.data();
          teamMembers.push({
            id: projectData.teamLead,
            name: leadData.name || leadData.displayName || leadData.fullName || 'Unknown',
            email: leadData.email,
            roles: leadData.roles || [],
            avatar: leadData.avatar || leadData.photoURL || leadData.profileImage,
            role: 'lead'
          });
        }
      } catch (error) {
        console.error(`Error getting team lead ${projectData.teamLead}:`, error);
      }
    }

    // Return data in format expected by frontend
    res.json({
      projectId,
      projectTitle: projectData.title,
      teamMembers,
      canManage: isPM || isAdmin, // PM or admin can manage
      teamLead: projectData.teamLead ? {
        id: projectData.teamLead,
        displayName: 'Team Lead', // Will be filled from user data if needed
        email: ''
      } : null,
      customerInfo: projectData.customer ? {
        fullName: projectData.customer.fullName || 'Unknown Customer',
        phone: projectData.customer.phone || '',
        email: projectData.customer.email || ''
      } : null
    });
  } catch (error) {
    console.error('Error fetching project team:', error);
    const { status, message } = handleFirebaseError(error);
    res.status(status).json({ error: message });
  }
});

// Update team member role
router.put('/:projectId/team/:memberId/role', authenticate, async (req, res) => {
  try {
    const { projectId, memberId } = req.params;
    const { role } = req.body;

    // Get project
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const projectData = projectDoc.data();

    // Check if user is PM of this project
    const isPM = projectData.pmId === req.user.uid;
    const isAdmin = req.user.roles.includes('admin');

    if (!isPM && !isAdmin) {
      return res.status(403).json({ error: 'Only project manager can update team roles' });
    }

    // Check if member is in the team
    if (!projectData.teamMembers.includes(memberId)) {
      return res.status(400).json({ error: 'User is not a team member' });
    }

    // Update user's role in the project
    await db.collection('projects')
      .doc(projectId)
      .collection('team_roles')
      .doc(memberId)
      .set({
        role,
        updatedAt: new Date().toISOString(),
        updatedBy: req.user.uid
      });

    // Create activity log
    await db.collection('projects')
      .doc(projectId)
      .collection('activity')
      .add({
        type: 'team_role_updated',
        userId: req.user.uid,
        details: {
          memberId,
          role
        },
        timestamp: new Date()
      });

    res.json({ message: 'Team member role updated successfully' });
  } catch (error) {
    console.error('Error updating team member role:', error);
    const { status, message } = handleFirebaseError(error);
    res.status(status).json({ error: message });
  }
});

// Get team member performance
router.get('/:projectId/team/:memberId/performance', authenticate, async (req, res) => {
  try {
    const { projectId, memberId } = req.params;

    // Get project
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const projectData = projectDoc.data();

    // Check if user is PM of this project
    const isPM = projectData.pmId === req.user.uid;
    const isAdmin = req.user.roles.includes('admin');

    if (!isPM && !isAdmin) {
      return res.status(403).json({ error: 'Only project manager can view team performance' });
    }

    // Get member's tasks
    const tasksSnapshot = await db.collection('projects')
      .doc(projectId)
      .collection('tasks')
      .where('assigneeId', '==', memberId)
      .get();

    const tasks = tasksSnapshot.docs.map(taskDoc => ({
      id: taskDoc.id,
      ...taskDoc.data()
    }));

    // Calculate performance metrics
    const performance = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'done').length,
      inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
      averageCompletionTime: calculateAverageCompletionTime(tasks),
      onTimeDelivery: calculateOnTimeDelivery(tasks),
      taskBreakdown: {
        backlog: tasks.filter(t => t.status === 'backlog').length,
        todo: tasks.filter(t => t.status === 'todo').length,
        in_progress: tasks.filter(t => t.status === 'in_progress').length,
        review: tasks.filter(t => t.status === 'review').length,
        done: tasks.filter(t => t.status === 'done').length
      }
    };

    res.json(performance);
  } catch (error) {
    console.error('Error fetching team member performance:', error);
    const { status, message } = handleFirebaseError(error);
    res.status(status).json({ error: message });
  }
});

// Helper function to calculate average completion time
function calculateAverageCompletionTime(tasks) {
  const completedTasks = tasks.filter(t => t.status === 'done' && t.dueDate);
  if (completedTasks.length === 0) return 0;

  const totalTime = completedTasks.reduce((sum, task) => {
    const created = new Date(task.createdAt);
    const completed = new Date(task.updatedAt);
    return sum + (completed - created);
  }, 0);

  return totalTime / completedTasks.length;
}

// Helper function to calculate on-time delivery percentage
function calculateOnTimeDelivery(tasks) {
  const completedTasks = tasks.filter(t => t.status === 'done' && t.dueDate);
  if (completedTasks.length === 0) return 0;

  const onTimeTasks = completedTasks.filter(task => {
    const completed = new Date(task.updatedAt);
    const due = new Date(task.dueDate);
    return completed <= due;
  });

  return (onTimeTasks.length / completedTasks.length) * 100;
}

// Отправить приглашение исполнителю
router.post('/:projectId/invite', authenticate, [
  body('executorId').notEmpty().trim(),
  body('message').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { projectId } = req.params;
    const { executorId, message } = req.body;
    const userId = req.user.uid;

    // Получаем проект
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projectDoc.data();

    // Проверяем права (только PM проекта)
    // Используем pmId как основное поле для PM, manager как fallback
    const projectManagerId = project.pmId || project.manager;
    if (projectManagerId !== userId) {
      return res.status(403).json({ error: 'Only project manager can send invitations' });
    }

    // Проверяем что исполнитель существует
    const executorDoc = await db.collection('users').doc(executorId).get();
    if (!executorDoc.exists) {
      return res.status(404).json({ error: 'Executor not found' });
    }

    const executorData = executorDoc.data();
    if (!executorData.roles || !executorData.roles.includes('executor')) {
      return res.status(400).json({ error: 'User is not an executor' });
    }

    // Проверяем что исполнитель не в команде
    const teamMemberIds = project.teamMembers && Array.isArray(project.teamMembers) 
      ? project.teamMembers.map(member => typeof member === 'string' ? member : member.id)
      : [];
    
    if (teamMemberIds.includes(executorId)) {
      return res.status(400).json({ error: 'Executor is already in the team' });
    }

    // Создаем приглашение (без сложных индексов)
    const invitationData = {
      projectId,
      projectTitle: project.title,
      executorId,
      executorName: executorData.name || executorData.displayName || executorData.fullName,
      executorEmail: executorData.email,
      senderId: userId,
      senderName: req.user.displayName || req.user.email,
      message: message || `Приглашаем вас в проект "${project.title}"`,
      status: 'pending',
      createdAt: new Date()
    };

    const invitationRef = await db.collection('invitations').add(invitationData);

    // Уведомление исполнителю
    await db.collection('users').doc(executorId).collection('notifications').add({
      type: 'project_invitation',
      title: 'Приглашение в проект',
      message: `Вас приглашают в проект: ${project.title}`,
      projectId,
      invitationId: invitationRef.id,
      read: false,
      createdAt: new Date()
    });

    res.json({
      message: 'Invitation sent successfully',
      invitationId: invitationRef.id
    });
  } catch (error) {
    console.error('Send invitation error:', error);
    res.status(500).json({ error: 'Failed to send invitation' });
  }
});

// Get project members (for chat creation)
router.get('/:projectId/members', authenticate, async (req, res) => {
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
      project.teamLead === req.user.uid ||
      (project.team && project.team.includes(req.user.uid)) ||
      (project.teamMembers && project.teamMembers.includes(req.user.uid)) ||
      req.user.roles.includes('admin');

    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to view project members' });
    }

    const members = [];
    const memberIds = new Set();

    // Добавляем всех участников проекта
    if (project.customerId) memberIds.add(project.customerId);
    if (project.pmId) memberIds.add(project.pmId);
    if (project.teamLead) memberIds.add(project.teamLead);
    if (project.team) project.team.forEach(id => memberIds.add(id));
    if (project.teamMembers) project.teamMembers.forEach(id => memberIds.add(id));

    // Получаем данные пользователей
    for (const memberId of memberIds) {
      const userDoc = await db.collection('users').doc(memberId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        members.push({
          id: memberId,
          name: userData.fullName || userData.displayName || userData.email,
          fullName: userData.fullName || userData.displayName,
          displayName: userData.displayName || userData.fullName,
          email: userData.email,
          profileImage: userData.profileImage,
          roles: userData.roles
        });
      }
    }

    res.json(members);
  } catch (error) {
    console.error('Get project members error:', error);
    res.status(500).json({ message: 'Error fetching project members' });
  }
});

module.exports = router; 