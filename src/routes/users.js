/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: Управление пользователями
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Получить список пользователей
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Фильтр по роли
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Фильтр по категории
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Лимит пользователей
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *         description: Курсор для пагинации
 *     responses:
 *       200:
 *         description: Список пользователей
 *       401:
 *         description: Неавторизован
 */

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Получить профиль текущего пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Профиль пользователя
 *       401:
 *         description: Неавторизован
 */

/**
 * @swagger
 * /api/users/{userId}:
 *   get:
 *     summary: Получить информацию о пользователе
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID пользователя
 *     responses:
 *       200:
 *         description: Информация о пользователе
 *       401:
 *         description: Неавторизован
 *       404:
 *         description: Пользователь не найден
 */

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Обновить профиль текущего пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               contactInfo:
 *                 type: object
 *               profileImage:
 *                 type: string
 *     responses:
 *       200:
 *         description: Профиль обновлен
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Неавторизован
 */

/**
 * @swagger
 * /api/users/{userId}/statistics:
 *   get:
 *     summary: Получить статистику пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID пользователя
 *     responses:
 *       200:
 *         description: Статистика пользователя
 *       401:
 *         description: Неавторизован
 *       404:
 *         description: Пользователь не найден
 */

const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { authenticate, checkRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get users list
router.get('/', authenticate, checkRole(['presale', 'super-admin']), async (req, res) => {
  try {
    const { role, category, limit = 50, before } = req.query;

    let query = db.collection('users');

    if (role) {
      query = query.where('roles', 'array-contains', role);
    }

    if (category) {
      query = query.where('categories', 'array-contains', category);
    }

    query = query.orderBy('createdAt', 'desc').limit(parseInt(limit));

    if (before) {
      query = query.startAfter(before);
    }

    const usersSnapshot = await query.get();
    const users = [];

    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      users.push({
        id: doc.id,
        fullName: userData.fullName,
        email: userData.email,
        roles: userData.roles,
        categories: userData.categories,
        profileImage: userData.profileImage,
        contactInfo: userData.contactInfo,
        createdAt: userData.createdAt
      });
    }

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Get user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userData = userDoc.data();

    // Get user's projects
    const projectsSnapshot = await db.collection('projects')
      .where('customerId', '==', req.user.uid)
      .get();

    const customerProjects = [];
    projectsSnapshot.forEach(doc => {
      customerProjects.push({
        id: doc.id,
        title: doc.data().title,
        status: doc.data().status
      });
    });

    // Get projects where user is PM
    const pmProjectsSnapshot = await db.collection('projects')
      .where('pmId', '==', req.user.uid)
      .get();

    const pmProjects = [];
    pmProjectsSnapshot.forEach(doc => {
      pmProjects.push({
        id: doc.id,
        title: doc.data().title,
        status: doc.data().status
      });
    });

    // Get projects where user is team member
    const teamProjectsSnapshot = await db.collection('projects')
      .where('team', 'array-contains', req.user.uid)
      .get();

    const teamProjects = [];
    teamProjectsSnapshot.forEach(doc => {
      teamProjects.push({
        id: doc.id,
        title: doc.data().title,
        status: doc.data().status
      });
    });

    // Get user's invites
    const invitesSnapshot = await db.collection('invites')
      .where('executorId', '==', req.user.uid)
      .where('status', '==', 'pending')
      .get();

    const pendingInvites = [];
    invitesSnapshot.forEach(doc => {
      pendingInvites.push({
        id: doc.id,
        projectId: doc.data().projectId,
        role: doc.data().role
      });
    });

    res.json({
      id: userDoc.id,
      ...userData,
      projects: {
        asCustomer: customerProjects,
        asPM: pmProjects,
        asTeamMember: teamProjects
      },
      pendingInvites
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// Get specific user
router.get('/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userData = userDoc.data();

    // Check if user has access to view this profile
    const hasAccess = 
      req.user.uid === userId ||
      req.user.roles.includes('presale') ||
      req.user.roles.includes('super-admin');

    if (!hasAccess) {
      // For other users, return limited profile
      return res.json({
        id: userDoc.id,
        fullName: userData.fullName,
        profileImage: userData.profileImage,
        roles: userData.roles,
        categories: userData.categories
      });
    }

    res.json({
      id: userDoc.id,
      ...userData
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Error fetching user' });
  }
});

// Update user profile
router.put('/profile',
  authenticate,
  [
    body('fullName').optional().trim(),
    body('contactInfo').optional().isObject(),
    body('profileImage').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { fullName, contactInfo, profileImage } = req.body;

      const updateData = {
        ...(fullName && { fullName }),
        ...(contactInfo && { contactInfo }),
        ...(profileImage && { profileImage }),
        updatedAt: new Date()
      };

      await db.collection('users').doc(req.user.uid).update(updateData);

      res.json({ message: 'Profile updated successfully' });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ message: 'Error updating profile' });
    }
  }
);

// Update user (admin only)
router.put('/:userId',
  authenticate,
  checkRole(['presale', 'super-admin']),
  [
    body('roles').optional().isArray(),
    body('categories').optional().isArray()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { userId } = req.params;
      const { roles, categories } = req.body;

      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        return res.status(404).json({ message: 'User not found' });
      }

      const updateData = {
        ...(roles && { roles }),
        ...(categories && { categories }),
        updatedAt: new Date()
      };

      await db.collection('users').doc(userId).update(updateData);

      // Create notification for user
      await db.collection('users')
        .doc(userId)
        .collection('notifications')
        .add({
          type: 'profile_updated',
          title: 'Profile Updated',
          message: 'Your profile has been updated by an administrator',
          read: false,
          createdAt: new Date()
        });

      res.json({ message: 'User updated successfully' });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ message: 'Error updating user' });
    }
  }
);

// Get user statistics
router.get('/:userId/statistics',
  authenticate,
  checkRole(['presale', 'super-admin']),
  async (req, res) => {
    try {
      const { userId } = req.params;

      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Get projects where user is customer
      const customerProjectsSnapshot = await db.collection('projects')
        .where('customerId', '==', userId)
        .get();

      const customerProjects = [];
      customerProjectsSnapshot.forEach(doc => {
        customerProjects.push(doc.data());
      });

      // Get projects where user is PM
      const pmProjectsSnapshot = await db.collection('projects')
        .where('pmId', '==', userId)
        .get();

      const pmProjects = [];
      pmProjectsSnapshot.forEach(doc => {
        pmProjects.push(doc.data());
      });

      // Get projects where user is team member
      const teamProjectsSnapshot = await db.collection('projects')
        .where('team', 'array-contains', userId)
        .get();

      const teamProjects = [];
      teamProjectsSnapshot.forEach(doc => {
        teamProjects.push(doc.data());
      });

      // Get user's invites
      const invitesSnapshot = await db.collection('invites')
        .where('executorId', '==', userId)
        .get();

      const invites = [];
      invitesSnapshot.forEach(doc => {
        invites.push(doc.data());
      });

      // Calculate statistics
      const statistics = {
        projects: {
          total: customerProjects.length + pmProjects.length + teamProjects.length,
          asCustomer: customerProjects.length,
          asPM: pmProjects.length,
          asTeamMember: teamProjects.length,
          completed: [
            ...customerProjects,
            ...pmProjects,
            ...teamProjects
          ].filter(project => project.status === 'completed').length
        },
        invites: {
          total: invites.length,
          pending: invites.filter(invite => invite.status === 'pending').length,
          accepted: invites.filter(invite => 
            invite.status === 'accepted_by_executor' || 
            invite.status === 'accepted_by_pm'
          ).length,
          declined: invites.filter(invite => 
            invite.status === 'declined_by_executor' || 
            invite.status === 'declined_by_pm'
          ).length
        },
        activity: {
          lastActive: new Date(), // TODO: Implement last activity tracking
          totalActions: 0 // TODO: Implement action counting
        }
      };

      res.json(statistics);
    } catch (error) {
      console.error('Get user statistics error:', error);
      res.status(500).json({ message: 'Error fetching user statistics' });
    }
  }
);

module.exports = router; 