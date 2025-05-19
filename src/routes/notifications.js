/**
 * @swagger
 * tags:
 *   - name: Notifications
 *     description: Уведомления пользователя
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Получить список уведомлений пользователя
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Лимит уведомлений
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *         description: Курсор для пагинации
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *         description: Только непрочитанные
 *     responses:
 *       200:
 *         description: Список уведомлений
 *       401:
 *         description: Неавторизован
 */

/**
 * @swagger
 * /api/notifications/mark-read:
 *   post:
 *     summary: Пометить уведомления как прочитанные
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notificationIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               markAll:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Уведомления помечены как прочитанные
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Неавторизован
 */

/**
 * @swagger
 * /api/notifications/settings:
 *   get:
 *     summary: Получить настройки уведомлений пользователя
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Настройки уведомлений
 *       401:
 *         description: Неавторизован
 */

/**
 * @swagger
 * /api/notifications/settings:
 *   put:
 *     summary: Обновить настройки уведомлений пользователя
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: boolean
 *               push:
 *                 type: boolean
 *               telegram:
 *                 type: boolean
 *               projectUpdates:
 *                 type: boolean
 *               taskUpdates:
 *                 type: boolean
 *               chatMessages:
 *                 type: boolean
 *               inviteResponses:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Настройки уведомлений обновлены
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Неавторизован
 */

const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { authenticate } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get user notifications
router.get('/', authenticate, async (req, res) => {
  try {
    const { limit = 50, before, unreadOnly } = req.query;

    let query = db.collection('users')
      .doc(req.user.uid)
      .collection('notifications')
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit));

    if (before) {
      query = query.startAfter(before);
    }

    if (unreadOnly === 'true') {
      query = query.where('read', '==', false);
    }

    const notificationsSnapshot = await query.get();
    const notifications = [];

    for (const doc of notificationsSnapshot.docs) {
      const notification = doc.data();
      
      // Get related entity details if needed
      let relatedEntity = null;
      if (notification.projectId) {
        const projectDoc = await db.collection('projects').doc(notification.projectId).get();
        if (projectDoc.exists) {
          relatedEntity = {
            type: 'project',
            id: projectDoc.id,
            title: projectDoc.data().title
          };
        }
      } else if (notification.inviteId) {
        const inviteDoc = await db.collection('invites').doc(notification.inviteId).get();
        if (inviteDoc.exists) {
          relatedEntity = {
            type: 'invite',
            id: inviteDoc.id,
            status: inviteDoc.data().status
          };
        }
      }

      notifications.push({
        id: doc.id,
        ...notification,
        relatedEntity
      });
    }

    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// Mark notifications as read
router.post('/mark-read', authenticate, [
  body('notificationIds').optional().isArray(),
  body('markAll').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { notificationIds, markAll } = req.body;

    if (!markAll && (!notificationIds || notificationIds.length === 0)) {
      return res.status(400).json({ message: 'Either notificationIds or markAll must be provided' });
    }

    const batch = db.batch();
    const notificationsRef = db.collection('users')
      .doc(req.user.uid)
      .collection('notifications');

    if (markAll) {
      // Get all unread notifications
      const unreadSnapshot = await notificationsRef
        .where('read', '==', false)
        .get();

      unreadSnapshot.forEach(doc => {
        batch.update(doc.ref, { read: true });
      });
    } else {
      // Mark specific notifications as read
      for (const notificationId of notificationIds) {
        const notificationRef = notificationsRef.doc(notificationId);
        batch.update(notificationRef, { read: true });
      }
    }

    await batch.commit();

    res.json({ message: 'Notifications marked as read successfully' });
  } catch (error) {
    console.error('Mark notifications as read error:', error);
    res.status(500).json({ message: 'Error marking notifications as read' });
  }
});

// Delete notifications
router.delete('/', authenticate, [
  body('notificationIds').isArray().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { notificationIds } = req.body;
    const batch = db.batch();
    const notificationsRef = db.collection('users')
      .doc(req.user.uid)
      .collection('notifications');

    for (const notificationId of notificationIds) {
      const notificationRef = notificationsRef.doc(notificationId);
      batch.delete(notificationRef);
    }

    await batch.commit();

    res.json({ message: 'Notifications deleted successfully' });
  } catch (error) {
    console.error('Delete notifications error:', error);
    res.status(500).json({ message: 'Error deleting notifications' });
  }
});

// Get notification settings
router.get('/settings', authenticate, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userData = userDoc.data();
    const settings = userData.notificationSettings || {
      email: true,
      push: true,
      telegram: false,
      projectUpdates: true,
      taskUpdates: true,
      chatMessages: true,
      inviteResponses: true
    };

    res.json(settings);
  } catch (error) {
    console.error('Get notification settings error:', error);
    res.status(500).json({ message: 'Error fetching notification settings' });
  }
});

// Update notification settings
router.put('/settings', authenticate, [
  body('email').optional().isBoolean(),
  body('push').optional().isBoolean(),
  body('telegram').optional().isBoolean(),
  body('projectUpdates').optional().isBoolean(),
  body('taskUpdates').optional().isBoolean(),
  body('chatMessages').optional().isBoolean(),
  body('inviteResponses').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const settings = req.body;
    const userRef = db.collection('users').doc(req.user.uid);

    await userRef.update({
      notificationSettings: settings,
      updatedAt: new Date()
    });

    res.json({ message: 'Notification settings updated successfully' });
  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({ message: 'Error updating notification settings' });
  }
});

module.exports = router; 