/**
 * @swagger
 * tags:
 *   - name: Invites
 *     description: Управление приглашениями в команду
 */

/**
 * @swagger
 * /api/invites:
 *   get:
 *     summary: Получить список приглашений пользователя
 *     tags: [Invites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Фильтр по статусу
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Лимит приглашений
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *         description: Курсор для пагинации
 *     responses:
 *       200:
 *         description: Список приглашений
 *       401:
 *         description: Неавторизован
 */

/**
 * @swagger
 * /api/projects/{projectId}/team/invite:
 *   post:
 *     summary: Пригласить пользователя в команду проекта
 *     tags: [Invites]
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
 *               - executorId
 *             properties:
 *               executorId:
 *                 type: string
 *               role:
 *                 type: string
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Приглашение отправлено
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Неавторизован
 */

/**
 * @swagger
 * /api/invites/{inviteId}/respond:
 *   put:
 *     summary: Ответить на приглашение (принять/отклонить)
 *     tags: [Invites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: inviteId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID приглашения
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [accepted, declined]
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ответ на приглашение сохранен
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Неавторизован
 *       404:
 *         description: Приглашение не найдено
 */

/**
 * @swagger
 * /api/invites/{inviteId}/accept:
 *   put:
 *     summary: Решение менеджера по приглашению
 *     tags: [Invites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: inviteId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID приглашения
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [accepted, declined]
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Решение по приглашению сохранено
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Неавторизован
 *       404:
 *         description: Приглашение не найдено
 */

const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { authenticate, checkRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/tech-specs/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'techspec-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow common document and image formats
    const allowedTypes = /\.(pdf|doc|docx|txt|jpg|jpeg|png|gif)$/i;
    if (allowedTypes.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: PDF, DOC, DOCX, TXT, JPG, PNG, GIF'));
    }
  }
});

// Get user's invites
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, limit = 50, before } = req.query;

    let query = db.collection('invites')
      .where('executorId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit));

    if (status) {
      query = query.where('status', '==', status);
    }

    if (before) {
      query = query.startAfter(before);
    }

    const invitesSnapshot = await query.get();
    const invites = [];

    for (const doc of invitesSnapshot.docs) {
      const invite = doc.data();
      
      // Get project details
      const projectDoc = await db.collection('projects').doc(invite.projectId).get();
      const projectData = projectDoc.exists ? projectDoc.data() : null;

      // Get creator details
      const creatorDoc = await db.collection('users').doc(invite.createdBy).get();
      const creatorData = creatorDoc.exists ? creatorDoc.data() : null;

      invites.push({
        id: doc.id,
        ...invite,
        project: projectData ? {
          id: projectDoc.id,
          title: projectData.title,
          status: projectData.status
        } : null,
        creator: creatorData ? {
          id: creatorData.uid,
          fullName: creatorData.fullName,
          profileImage: creatorData.profileImage
        } : null
      });
    }

    res.json(invites);
  } catch (error) {
    console.error('Get invites error:', error);
    res.status(500).json({ message: 'Error fetching invites' });
  }
});

// Create invite
router.post('/projects/:projectId/team/invite',
  authenticate,
  checkRole(['pm', 'admin']),
  upload.single('techSpecFile'),
  [
    body('executorId').notEmpty(),
    body('role').optional().trim(),
    body('description').optional().trim(),
    body('rate').optional().trim(), // Ставка (например "Договорная")
    body('startDate').optional().isISO8601(), // Дата старта проекта
    body('estimatedDuration').optional().trim(), // Оценочное время реализации
    body('estimatedDurationUnit').optional().isIn(['days', 'weeks', 'months']), // Единица времени
    body('coverLetter').optional().trim() // Сопроводительное письмо
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { projectId } = req.params;
      const { 
        executorId, 
        role, 
        description, 
        rate,
        startDate,
        estimatedDuration,
        estimatedDurationUnit,
        coverLetter
      } = req.body;

      // Check if project exists
      const projectDoc = await db.collection('projects').doc(projectId).get();
      if (!projectDoc.exists) {
        return res.status(404).json({ message: 'Project not found' });
      }

      const projectData = projectDoc.data();

      // Check if user has access to project
      const hasAccess = 
        req.user.roles.includes('admin') ||
        projectData.pmId === req.user.uid ||
        projectData.manager === req.user.uid;

      if (!hasAccess) {
        return res.status(403).json({ message: 'Not authorized to invite team members' });
      }

      // Check if executor exists
      const executorDoc = await db.collection('users').doc(executorId).get();
      if (!executorDoc.exists) {
        return res.status(404).json({ message: 'Executor not found' });
      }

      const executorData = executorDoc.data();
      
      // Check if executor has correct role
      if (!executorData.roles || !executorData.roles.includes('executor')) {
        return res.status(400).json({ message: 'User is not an executor' });
      }

      // Check if executor is already in team
      if (projectData.team && projectData.team.includes(executorId)) {
        return res.status(400).json({ message: 'User is already in project team' });
      }

      // Check if there's already a pending invite
      const existingInvite = await db.collection('invites')
        .where('projectId', '==', projectId)
        .where('executorId', '==', executorId)
        .where('status', '==', 'pending')
        .get();

      if (!existingInvite.empty) {
        return res.status(400).json({ message: 'User already has a pending invite' });
      }

      const inviteData = {
        projectId,
        projectTitle: projectData.title,
        executorId,
        executorName: executorData.fullName || executorData.displayName || executorData.email,
        executorEmail: executorData.email,
        role: role || 'executor',
        description: description || '',
        rate: rate || 'Договорная', // Ставка
        startDate: startDate ? new Date(startDate) : null, // Дата старта проекта
        estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : null, // Время реализации
        estimatedDurationUnit: estimatedDurationUnit || 'months', // Единица времени
        coverLetter: coverLetter || '', // Сопроводительное письмо
        techSpecFile: req.file ? {
          filename: req.file.filename,
          originalName: req.file.originalname,
          path: req.file.path,
          size: req.file.size,
          mimetype: req.file.mimetype,
          uploadedAt: new Date()
        } : null, // Файл технического задания
        status: 'pending',
        createdBy: req.user.uid,
        createdByName: req.user.displayName || req.user.email,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const inviteRef = await db.collection('invites').add(inviteData);

      // Create notification for executor
      await db.collection('users')
        .doc(executorId)
        .collection('notifications')
        .add({
          type: 'project_invite',
          title: 'Приглашение в проект',
          message: `Вас приглашают в проект "${projectData.title}"`,
          inviteId: inviteRef.id,
          projectId,
          read: false,
          createdAt: new Date()
        });

      res.status(201).json({
        message: 'Invite sent successfully',
        inviteId: inviteRef.id
      });
    } catch (error) {
      console.error('Create invite error:', error);
      res.status(500).json({ message: 'Error creating invite' });
    }
  }
);

// Respond to invite
router.put('/:inviteId/respond',
  authenticate,
  [
    body('response').isIn(['accept', 'decline']),
    body('comment').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { inviteId } = req.params;
      const { response, comment } = req.body;

      // Get invite
      const inviteDoc = await db.collection('invites').doc(inviteId).get();
      if (!inviteDoc.exists) {
        return res.status(404).json({ message: 'Invite not found' });
      }

      const inviteData = inviteDoc.data();

      // Check if user is the executor
      if (inviteData.executorId !== req.user.uid) {
        return res.status(403).json({ message: 'Not authorized to respond to this invite' });
      }

      // Check if invite is still pending
      if (inviteData.status !== 'pending') {
        return res.status(400).json({ message: 'Invite is no longer pending' });
      }

      const newStatus = response === 'accept' ? 'accepted_by_executor' : 'declined_by_executor';
      const responseData = {
        status: newStatus,
        responseAt: new Date(),
        responseComment: comment || '',
        updatedAt: new Date()
      };

      await db.collection('invites').doc(inviteId).update(responseData);

      // Create notification for project manager
      const projectDoc = await db.collection('projects').doc(inviteData.projectId).get();
      const projectData = projectDoc.data();
      const pmId = projectData.pmId;

      await db.collection('users')
        .doc(pmId)
        .collection('notifications')
        .add({
          type: 'invite_response',
          title: 'Invite Response',
          message: `User has ${response}ed your invitation to project "${projectData.title}"`,
          inviteId,
          projectId: inviteData.projectId,
          read: false,
          createdAt: new Date()
        });

      res.json({ message: 'Response recorded successfully' });
    } catch (error) {
      console.error('Respond to invite error:', error);
      res.status(500).json({ message: 'Error responding to invite' });
    }
  }
);

// Accept/decline invite (by PM)
router.put('/:inviteId/accept',
  authenticate,
  checkRole(['pm', 'admin']),
  [
    body('action').isIn(['accept', 'decline']),
    body('comment').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { inviteId } = req.params;
      const { action, comment } = req.body;

      // Get invite
      const inviteDoc = await db.collection('invites').doc(inviteId).get();
      if (!inviteDoc.exists) {
        return res.status(404).json({ message: 'Invite not found' });
      }

      const inviteData = inviteDoc.data();

      // Check if project exists
      const projectDoc = await db.collection('projects').doc(inviteData.projectId).get();
      if (!projectDoc.exists) {
        return res.status(404).json({ message: 'Project not found' });
      }

      const projectData = projectDoc.data();

      // Check if user has access to project
      const hasAccess = 
        req.user.roles.includes('admin') ||
        projectData.pmId === req.user.uid;

      if (!hasAccess) {
        return res.status(403).json({ message: 'Not authorized to manage this invite' });
      }

      // Check if invite is in correct state
      if (inviteData.status !== 'accepted_by_executor') {
        return res.status(400).json({ message: 'Invite must be accepted by executor first' });
      }

      const newStatus = action === 'accept' ? 'accepted_by_pm' : 'declined_by_pm';
      const responseData = {
        status: newStatus,
        pmResponseAt: new Date(),
        pmResponseComment: comment || '',
        updatedAt: new Date()
      };

      const batch = db.batch();

      // Update invite
      batch.update(db.collection('invites').doc(inviteId), responseData);

      // If accepted, add user to project team
      if (action === 'accept') {
        batch.update(db.collection('projects').doc(inviteData.projectId), {
          team: [...(projectData.team || []), inviteData.executorId],
          updatedAt: new Date()
        });
      }

      await batch.commit();

      // Create notification for executor
      await db.collection('users')
        .doc(inviteData.executorId)
        .collection('notifications')
        .add({
          type: 'invite_response',
          title: 'Invite Response',
          message: `Your invitation to project "${projectData.title}" has been ${action}ed`,
          inviteId,
          projectId: inviteData.projectId,
          read: false,
          createdAt: new Date()
        });

      res.json({ message: `Invite ${action}ed successfully` });
    } catch (error) {
      console.error('Accept/decline invite error:', error);
      res.status(500).json({ message: 'Error processing invite response' });
    }
  }
);

// Download tech spec file
router.get('/:inviteId/tech-spec-file', authenticate, async (req, res) => {
  try {
    const { inviteId } = req.params;

    // Get invite
    const inviteDoc = await db.collection('invites').doc(inviteId).get();
    if (!inviteDoc.exists) {
      return res.status(404).json({ message: 'Invite not found' });
    }

    const inviteData = inviteDoc.data();

    // Check if user has access to this invite
    const hasAccess = 
      req.user.uid === inviteData.executorId || // Executor can download
      req.user.uid === inviteData.createdBy || // Creator can download
      req.user.roles.includes('admin'); // Admin can download

    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to download this file' });
    }

    // Check if file exists
    if (!inviteData.techSpecFile) {
      return res.status(404).json({ message: 'No tech spec file attached to this invite' });
    }

    const filePath = inviteData.techSpecFile.path;
    const fs = require('fs');

    // Check if file exists on disk
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${inviteData.techSpecFile.originalName}"`);
    res.setHeader('Content-Type', inviteData.techSpecFile.mimetype);

    // Send file
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    console.error('Download tech spec file error:', error);
    res.status(500).json({ message: 'Error downloading file' });
  }
});

module.exports = router; 