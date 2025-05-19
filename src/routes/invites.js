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
  checkRole(['pm', 'presale']),
  [
    body('executorId').notEmpty(),
    body('role').optional().trim(),
    body('description').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { projectId } = req.params;
      const { executorId, role, description } = req.body;

      // Check if project exists
      const projectDoc = await db.collection('projects').doc(projectId).get();
      if (!projectDoc.exists) {
        return res.status(404).json({ message: 'Project not found' });
      }

      const projectData = projectDoc.data();

      // Check if user has access to project
      const hasAccess = 
        req.user.roles.includes('presale') ||
        projectData.pmId === req.user.uid;

      if (!hasAccess) {
        return res.status(403).json({ message: 'Not authorized to invite team members' });
      }

      // Check if executor exists
      const executorDoc = await db.collection('users').doc(executorId).get();
      if (!executorDoc.exists) {
        return res.status(404).json({ message: 'Executor not found' });
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
        executorId,
        role: role || 'Team Member',
        description: description || '',
        status: 'pending',
        createdBy: req.user.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const inviteRef = await db.collection('invites').add(inviteData);

      // Create notification for executor
      await db.collection('users')
        .doc(executorId)
        .collection('notifications')
        .add({
          type: 'invite',
          title: 'New Project Invitation',
          message: `You have been invited to join project "${projectData.title}"`,
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
  checkRole(['pm', 'presale']),
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
        req.user.roles.includes('presale') ||
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

module.exports = router; 