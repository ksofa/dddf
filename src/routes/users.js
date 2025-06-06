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

// Get users list - ЕДИНСТВЕННЫЙ маршрут для получения списка пользователей
router.get('/', authenticate, checkRole(['admin', 'pm']), async (req, res) => {
  try {
    const { role, category, limit = 50, before, profession, search } = req.query;
    const userId = req.user.uid;

    // Получаем данные текущего пользователя
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userRoles = userDoc.data().roles || [];

    let query = db.collection('users');

    // Если не админ, то можем искать только исполнителей
    if (!userRoles.includes('admin')) {
      query = query.where('roles', 'array-contains', 'executor');
    } else if (role) {
      // Админ может искать по роли
      query = query.where('roles', 'array-contains', role);
    }

    // Фильтр по категории
    if (category) {
      query = query.where('categories', 'array-contains', category);
    }

    // Фильтр по профессии
    if (profession) {
      query = query.where('profession', '==', profession);
    }

    // Убираем сортировку по createdAt, так как не у всех пользователей есть это поле
    query = query.limit(parseInt(limit));

    if (before) {
      query = query.startAfter(before);
    }

    const usersSnapshot = await query.get();
    let users = [];

    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      users.push({
        id: doc.id,
        uid: doc.id, // Добавляем uid для совместимости
        fullName: userData.fullName,
        displayName: userData.displayName || userData.fullName,
        name: userData.fullName || userData.displayName,
        email: userData.email,
        roles: userData.roles,
        categories: userData.categories,
        profileImage: userData.profileImage,
        contactInfo: userData.contactInfo,
        createdAt: userData.createdAt,
        profession: userData.profession,
        avatarUrl: userData.avatarUrl,
        rating: userData.rating,
        experienceYears: userData.experienceYears,
        projectsCount: userData.projectsCount,
        teamsCount: userData.teamsCount,
        avgRate: userData.avgRate,
        workTime: userData.workTime,
        timezone: userData.timezone,
        workDays: userData.workDays,
        verified: userData.verified,
        isActive: userData.isActive !== false
      });
    }

    // Фильтрация по поисковому запросу
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(user => 
        user.name?.toLowerCase().includes(searchLower) ||
        user.profession?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower)
      );
    }

    // Убираем чувствительные данные для не-админов
    if (!userRoles.includes('admin')) {
      users = users.map(user => ({
        id: user.id,
        uid: user.uid,
        name: user.name,
        displayName: user.displayName,
        profession: user.profession,
        avatarUrl: user.avatarUrl,
        rating: user.rating,
        experienceYears: user.experienceYears,
        projectsCount: user.projectsCount,
        teamsCount: user.teamsCount,
        avgRate: user.avgRate,
        workTime: user.workTime,
        timezone: user.timezone,
        workDays: user.workDays,
        verified: user.verified,
        roles: user.roles
      }));
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
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const userData = userDoc.data();
    res.json({
      id: req.user.uid,
      email: req.user.email,
      ...userData
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Ошибка при получении профиля' });
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
      req.user.roles.includes('admin');

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
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { displayName, phone, position, department } = req.body;
    
    const updateData = {
      displayName,
      phone,
      position,
      department,
      updatedAt: new Date().toISOString()
    };

    await db.collection('users').doc(req.user.uid).update(updateData);
    res.json({ message: 'Профиль обновлен' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Ошибка при обновлении профиля' });
  }
});

// Update user (admin only)
router.put('/:userId',
  authenticate,
  checkRole(['admin']),
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
  checkRole(['admin']),
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

// Получить всех тимлидов (для админов)
router.get('/teamleads', authenticate, checkRole(['admin']), async (req, res) => {
  try {
    const snapshot = await db.collection('users').where('roles', 'array-contains', 'teamlead').get();
    const teamleads = [];
    
    snapshot.forEach(doc => {
      const userData = doc.data();
      teamleads.push({
        id: doc.id,
        email: userData.email,
        displayName: userData.displayName,
        position: userData.position,
        department: userData.department
      });
    });

    res.json(teamleads);
  } catch (error) {
    console.error('Error fetching teamleads:', error);
    res.status(500).json({ error: 'Ошибка при получении тимлидов' });
  }
});

// Назначить роль пользователю (только для админов)
router.post('/:userId/assign-role', authenticate, checkRole(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const validRoles = ['admin', 'teamlead', 'developer', 'designer', 'tester'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        error: 'Недопустимая роль. Доступные роли: ' + validRoles.join(', ') 
      });
    }

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const userData = userDoc.data();
    const currentRoles = userData.roles || [];

    if (currentRoles.includes(role)) {
      return res.status(400).json({ error: 'Пользователь уже имеет эту роль' });
    }

    currentRoles.push(role);

    await db.collection('users').doc(userId).update({
      roles: currentRoles,
      updatedAt: new Date().toISOString()
    });

    res.json({ message: `Роль ${role} назначена пользователю` });
  } catch (error) {
    console.error('Error assigning role:', error);
    res.status(500).json({ error: 'Ошибка при назначении роли' });
  }
});

// Удалить роль у пользователя (только для админов)
router.post('/:userId/remove-role', authenticate, checkRole(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const userData = userDoc.data();
    const currentRoles = userData.roles || [];

    if (!currentRoles.includes(role)) {
      return res.status(400).json({ error: 'Пользователь не имеет этой роли' });
    }

    const updatedRoles = currentRoles.filter(r => r !== role);

    await db.collection('users').doc(userId).update({
      roles: updatedRoles,
      updatedAt: new Date().toISOString()
    });

    res.json({ message: `Роль ${role} удалена у пользователя` });
  } catch (error) {
    console.error('Error removing role:', error);
    res.status(500).json({ error: 'Ошибка при удалении роли' });
  }
});

// Деактивировать пользователя (только для админов)
router.post('/:userId/deactivate', authenticate, checkRole(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    await db.collection('users').doc(userId).update({
      isActive: false,
      deactivatedAt: new Date().toISOString(),
      deactivatedBy: req.user.uid
    });

    res.json({ message: 'Пользователь деактивирован' });
  } catch (error) {
    console.error('Error deactivating user:', error);
    res.status(500).json({ error: 'Ошибка при деактивации пользователя' });
  }
});

// Активировать пользователя (только для админов)
router.post('/:userId/activate', authenticate, checkRole(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    await db.collection('users').doc(userId).update({
      isActive: true,
      activatedAt: new Date().toISOString(),
      activatedBy: req.user.uid
    });

    res.json({ message: 'Пользователь активирован' });
  } catch (error) {
    console.error('Error activating user:', error);
    res.status(500).json({ error: 'Ошибка при активации пользователя' });
  }
});

// Получить участников команды для тимлида
router.get('/my-team', authenticate, async (req, res) => {
  try {
    // Проверяем, что пользователь является тимлидом
    if (!req.user.roles || !req.user.roles.includes('teamlead')) {
      return res.status(403).json({ error: 'Доступно только для тимлидов' });
    }

    // Находим проекты, где пользователь является тимлидом
    const projectsSnapshot = await db.collection('projects')
      .where('teamLead', '==', req.user.uid)
      .get();

    const allTeamMemberIds = new Set();
    
    projectsSnapshot.forEach(doc => {
      const projectData = doc.data();
      if (projectData.teamMembers) {
        projectData.teamMembers.forEach(memberId => {
          allTeamMemberIds.add(memberId);
        });
      }
    });

    // Получаем информацию о всех участниках команды
    const teamMembers = [];
    for (const memberId of allTeamMemberIds) {
      const userDoc = await db.collection('users').doc(memberId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        teamMembers.push({
          id: memberId,
          email: userData.email,
          displayName: userData.displayName,
          position: userData.position,
          roles: userData.roles || []
        });
      }
    }

    res.json(teamMembers);
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ error: 'Ошибка при получении участников команды' });
  }
});

// Получить список профессий
router.get('/meta/professions', async (req, res) => {
  try {
    const professions = [
      'Frontend разработчик',
      'Back-End разработчик',
      'VUE.JS',
      'REACT.JS',
      'ANGULAR.JS',
      'Веб-разработчик',
      'Full Stack разработчик',
      'Тестировщик',
      'Аналитик',
      'Дизайнер',
      'DevOps',
      'Mobile разработчик',
      'QA инженер',
      'Системный администратор',
      'Архитектор ПО',
      'Продуктовый менеджер',
      'Scrum мастер',
      'Технический писатель'
    ];
    
    res.json(professions);
  } catch (error) {
    console.error('Error getting professions:', error);
    res.status(500).json({ error: 'Failed to get professions' });
  }
});

// Получить статистику пользователей (для админа)
router.get('/meta/stats', authenticate, async (req, res) => {
  try {
    const userId = req.user.uid;
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists || !userDoc.data().roles.includes('admin')) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const usersSnapshot = await db.collection('users').get();
    const stats = {
      total: usersSnapshot.size,
      admins: 0,
      pms: 0,
      executors: 0,
      customers: 0,
      verified: 0
    };
    
    usersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const roles = data.roles || [];
      
      if (roles.includes('admin')) stats.admins++;
      if (roles.includes('pm')) stats.pms++;
      if (roles.includes('executor')) stats.executors++;
      if (roles.includes('customer')) stats.customers++;
      if (data.verified) stats.verified++;
    });
    
    res.json(stats);
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({ error: 'Failed to get user stats' });
  }
});

// Поиск исполнителей для приглашения в проект
router.get('/executors/search', authenticate, async (req, res) => {
  try {
    const { search, specialization, limit = 50 } = req.query;
    const userId = req.user.uid;

    // Проверяем права доступа (PM или admin)
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userRoles = userDoc.data().roles || [];
    if (!userRoles.includes('pm') && !userRoles.includes('admin')) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Строим запрос для поиска исполнителей
    let query = db.collection('users').where('roles', 'array-contains', 'executor');

    // Фильтр по специализации
    if (specialization) {
      query = query.where('specialization', '==', specialization);
    }

    query = query.limit(parseInt(limit));

    const executorsSnapshot = await query.get();
    const executors = [];

    for (const doc of executorsSnapshot.docs) {
      const executorData = doc.data();
      
      // Фильтр по поиску (имя или email)
      if (search) {
        const searchLower = search.toLowerCase();
        const name = (executorData.name || executorData.displayName || executorData.fullName || '').toLowerCase();
        const email = (executorData.email || '').toLowerCase();
        
        if (!name.includes(searchLower) && !email.includes(searchLower)) {
          continue;
        }
      }

      executors.push({
        id: doc.id,
        name: executorData.name || executorData.displayName || executorData.fullName || 'Unknown',
        email: executorData.email,
        specialization: executorData.specialization || 'Не указана',
        avatar: executorData.avatar || executorData.photoURL || executorData.profileImage,
        roles: executorData.roles || [],
        contactInfo: executorData.contactInfo,
        profession: executorData.profession,
        categories: executorData.categories || []
      });
    }

    res.json(executors);
  } catch (error) {
    console.error('Error searching executors:', error);
    res.status(500).json({ error: 'Failed to search executors' });
  }
});

module.exports = router; 