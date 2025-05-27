/**
 * @swagger
 * tags:
 *   - name: Chats
 *     description: Управление чатами проекта
 */

/**
 * @swagger
 * /api/projects/{projectId}/chats:
 *   get:
 *     summary: Получить список чатов проекта
 *     tags: [Chats]
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
 *         description: Список чатов
 *       401:
 *         description: Неавторизован
 *       403:
 *         description: Нет доступа к проекту
 *       404:
 *         description: Проект не найден
 */

/**
 * @swagger
 * /api/projects/{projectId}/chats:
 *   post:
 *     summary: Создать новый чат
 *     tags: [Chats]
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
 *               - type
 *               - participants
 *             properties:
 *               name:
 *                 type: string
 *                 description: Название чата
 *               type:
 *                 type: string
 *                 enum: [group, direct]
 *                 description: Тип чата
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Список ID участников
 *     responses:
 *       201:
 *         description: Чат создан
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Неавторизован
 *       403:
 *         description: Нет доступа к проекту
 *       404:
 *         description: Проект не найден
 */

/**
 * @swagger
 * /api/projects/{projectId}/chats/{chatId}/messages:
 *   get:
 *     summary: Получить сообщения чата
 *     tags: [Chats]
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
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID чата
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Лимит сообщений
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *         description: Курсор для пагинации
 *     responses:
 *       200:
 *         description: Список сообщений
 *       401:
 *         description: Неавторизован
 *       403:
 *         description: Нет доступа к чату
 *       404:
 *         description: Чат не найден
 */

/**
 * @swagger
 * /api/projects/{projectId}/chats/{chatId}/messages:
 *   post:
 *     summary: Отправить сообщение в чат
 *     tags: [Chats]
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
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID чата
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: Текст сообщения
 *     responses:
 *       201:
 *         description: Сообщение отправлено
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Неавторизован
 *       403:
 *         description: Нет доступа к чату
 *       404:
 *         description: Чат не найден
 */

const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { authenticate, checkRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Helper function to create chat activity entry
const createChatActivityEntry = async (projectId, chatId, userId, action, details) => {
  try {
    const activityData = {
      action,
      details,
      userId,
      timestamp: new Date()
    };

    await db.collection('projects')
      .doc(projectId)
      .collection('chats')
      .doc(chatId)
      .collection('activity')
      .add(activityData);
  } catch (error) {
    console.error('Create chat activity error:', error);
  }
};

// Get project chats
router.get('/projects/:projectId/chats', authenticate, async (req, res) => {
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
      req.user.roles.includes('admin') ||
      req.user.roles.includes('admin') ||
      req.user.roles.includes('admin');

    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to view project chats' });
    }

    // Исправленный запрос - сначала получаем все чаты, потом фильтруем
    const chatsSnapshot = await db.collection('projects')
      .doc(projectId)
      .collection('chats')
      .get();

    const chats = [];
    for (const doc of chatsSnapshot.docs) {
      const chat = doc.data();
      
      // Фильтруем чаты где пользователь является участником
      if (!chat.participants || !chat.participants.includes(req.user.uid)) {
        continue;
      }
      
      // Get participants details
      const participants = [];
      for (const participantId of chat.participants) {
        const userDoc = await db.collection('users').doc(participantId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          participants.push({
            id: participantId,
            name: userData.fullName || userData.displayName,
            fullName: userData.fullName || userData.displayName,
            displayName: userData.displayName || userData.fullName,
            profileImage: userData.profileImage
          });
        }
      }

      // Get last message
      const lastMessageSnapshot = await db.collection('projects')
        .doc(projectId)
        .collection('chats')
        .doc(doc.id)
        .collection('messages')
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();

      let lastMessage = null;
      if (!lastMessageSnapshot.empty) {
        const messageDoc = lastMessageSnapshot.docs[0];
        const messageData = messageDoc.data();
        const senderDoc = await db.collection('users').doc(messageData.senderId).get();
        const senderData = senderDoc.exists ? senderDoc.data() : null;

        lastMessage = {
          id: messageDoc.id,
          text: messageData.text,
          timestamp: messageData.timestamp,
          sender: senderData ? {
            id: messageData.senderId,
            name: senderData.fullName || senderData.displayName,
            fullName: senderData.fullName || senderData.displayName,
            displayName: senderData.displayName || senderData.fullName,
            profileImage: senderData.profileImage
          } : null
        };
      }

      // Calculate unread count - упрощенный подсчет
      let unreadCount = 0;
      try {
        const unreadMessagesSnapshot = await db.collection('projects')
          .doc(projectId)
          .collection('chats')
          .doc(doc.id)
          .collection('messages')
          .get();
        
        // Считаем непрочитанные сообщения в памяти
        unreadMessagesSnapshot.docs.forEach(msgDoc => {
          const msgData = msgDoc.data();
          if (!msgData.readBy || !msgData.readBy.includes(req.user.uid)) {
            unreadCount++;
          }
        });
      } catch (error) {
        console.log('Error counting unread messages:', error);
        unreadCount = 0;
      }

      chats.push({
        id: doc.id,
        ...chat,
        participants,
        lastMessage,
        unreadCount
      });
    }

    // Сортируем чаты по времени обновления в памяти
    chats.sort((a, b) => {
      const aTime = a.updatedAt?.toDate?.() || a.updatedAt || new Date(0);
      const bTime = b.updatedAt?.toDate?.() || b.updatedAt || new Date(0);
      return bTime - aTime;
    });

    res.json(chats);
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ message: 'Error fetching chats' });
  }
});

// Get all user chats (global chats across all projects and direct chats)
router.get('/chats', authenticate, async (req, res) => {
  try {
    const userRoles = req.user.roles || [];
    const allChats = [];

    // 1. Для админов - все чаты системы
    if (userRoles.includes('admin') || userRoles.includes('admin')) {
      // Получаем все проекты
      const projectsSnapshot = await db.collection('projects').get();
      
      for (const projectDoc of projectsSnapshot.docs) {
        const chatsSnapshot = await db.collection('projects')
          .doc(projectDoc.id)
          .collection('chats')
          .get();

        for (const chatDoc of chatsSnapshot.docs) {
          const chatData = chatDoc.data();
          allChats.push({
            id: chatDoc.id,
            projectId: projectDoc.id,
            projectTitle: projectDoc.data().title,
            ...chatData
          });
        }
      }

      // Также добавляем глобальные чаты
      const globalChatsSnapshot = await db.collection('global-chats').get();
      globalChatsSnapshot.forEach(doc => {
        allChats.push({
          id: doc.id,
          isGlobal: true,
          ...doc.data()
        });
      });
    }
    // 2. Для PM - чаты своих проектов
    else if (userRoles.includes('pm')) {
      const projectsSnapshot = await db.collection('projects')
        .where('pmId', '==', req.user.uid)
        .get();

      for (const projectDoc of projectsSnapshot.docs) {
        const chatsSnapshot = await db.collection('projects')
          .doc(projectDoc.id)
          .collection('chats')
          .where('participants', 'array-contains', req.user.uid)
          .get();

        for (const chatDoc of chatsSnapshot.docs) {
          const chatData = chatDoc.data();
          allChats.push({
            id: chatDoc.id,
            projectId: projectDoc.id,
            projectTitle: projectDoc.data().title,
            ...chatData
          });
        }
      }

      // Глобальные чаты где PM участник
      const globalChatsSnapshot = await db.collection('global-chats')
        .where('participants', 'array-contains', req.user.uid)
        .get();
      
      globalChatsSnapshot.forEach(doc => {
        allChats.push({
          id: doc.id,
          isGlobal: true,
          ...doc.data()
        });
      });
    }
    // 3. Для исполнителей - чаты проектов где они участники + глобальные чаты
    else if (userRoles.includes('executor')) {
      const projectsSnapshot = await db.collection('projects')
        .where('teamMembers', 'array-contains', req.user.uid)
        .get();

      for (const projectDoc of projectsSnapshot.docs) {
        const chatsSnapshot = await db.collection('projects')
          .doc(projectDoc.id)
          .collection('chats')
          .where('participants', 'array-contains', req.user.uid)
          .get();

        for (const chatDoc of chatsSnapshot.docs) {
          const chatData = chatDoc.data();
          allChats.push({
            id: chatDoc.id,
            projectId: projectDoc.id,
            projectTitle: projectDoc.data().title,
            ...chatData
          });
        }
      }

      // Глобальные чаты где исполнитель участник
      const globalChatsSnapshot = await db.collection('global-chats')
        .where('participants', 'array-contains', req.user.uid)
        .get();
      
      globalChatsSnapshot.forEach(doc => {
        allChats.push({
          id: doc.id,
          isGlobal: true,
          ...doc.data()
        });
      });
    }
    // 4. Для заказчиков - чаты своих проектов
    else if (userRoles.includes('customer')) {
      const projectsSnapshot = await db.collection('projects')
        .where('customerId', '==', req.user.uid)
        .get();

      for (const projectDoc of projectsSnapshot.docs) {
        const chatsSnapshot = await db.collection('projects')
          .doc(projectDoc.id)
          .collection('chats')
          .where('participants', 'array-contains', req.user.uid)
          .get();

        for (const chatDoc of chatsSnapshot.docs) {
          const chatData = chatDoc.data();
          allChats.push({
            id: chatDoc.id,
            projectId: projectDoc.id,
            projectTitle: projectDoc.data().title,
            ...chatData
          });
        }
      }
    }

    // Обогащаем данные чатов
    const enrichedChats = [];
    for (const chat of allChats) {
      // Получаем участников
      const participants = [];
      if (chat.participants) {
        for (const participantId of chat.participants) {
          const userDoc = await db.collection('users').doc(participantId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            participants.push({
              id: participantId,
              name: userData.fullName || userData.displayName,
              fullName: userData.fullName || userData.displayName,
              displayName: userData.displayName || userData.fullName,
              profileImage: userData.profileImage,
              roles: userData.roles
            });
          }
        }
      }

      // Получаем последнее сообщение
      let lastMessage = null;
      if (chat.isGlobal) {
        const lastMessageSnapshot = await db.collection('global-chats')
          .doc(chat.id)
          .collection('messages')
          .orderBy('timestamp', 'desc')
          .limit(1)
          .get();

        if (!lastMessageSnapshot.empty) {
          const messageDoc = lastMessageSnapshot.docs[0];
          const messageData = messageDoc.data();
          const senderDoc = await db.collection('users').doc(messageData.senderId).get();
          const senderData = senderDoc.exists ? senderDoc.data() : null;

          lastMessage = {
            id: messageDoc.id,
            text: messageData.text,
            timestamp: messageData.timestamp,
            sender: senderData ? {
              id: messageData.senderId,
              name: senderData.fullName || senderData.displayName,
              fullName: senderData.fullName || senderData.displayName,
              displayName: senderData.displayName || senderData.fullName
            } : null
          };
        }
      } else if (chat.projectId) {
        const lastMessageSnapshot = await db.collection('projects')
          .doc(chat.projectId)
          .collection('chats')
          .doc(chat.id)
          .collection('messages')
          .orderBy('timestamp', 'desc')
          .limit(1)
          .get();

        if (!lastMessageSnapshot.empty) {
          const messageDoc = lastMessageSnapshot.docs[0];
          const messageData = messageDoc.data();
          const senderDoc = await db.collection('users').doc(messageData.senderId).get();
          const senderData = senderDoc.exists ? senderDoc.data() : null;

          lastMessage = {
            id: messageDoc.id,
            text: messageData.text,
            timestamp: messageData.timestamp,
            sender: senderData ? {
              id: messageData.senderId,
              name: senderData.fullName || senderData.displayName,
              fullName: senderData.fullName || senderData.displayName,
              displayName: senderData.displayName || senderData.fullName
            } : null
          };
        }
      }

      enrichedChats.push({
        ...chat,
        participants,
        lastMessage
      });
    }

    // Сортируем по последней активности
    enrichedChats.sort((a, b) => {
      const aTime = a.lastMessage?.timestamp || a.updatedAt || a.createdAt;
      const bTime = b.lastMessage?.timestamp || b.updatedAt || b.createdAt;
      return new Date(bTime) - new Date(aTime);
    });

    res.json(enrichedChats);
  } catch (error) {
    console.error('Get all chats error:', error);
    res.status(500).json({ message: 'Error fetching chats' });
  }
});

// Create new chat
router.post('/projects/:projectId/chats',
  authenticate,
  [
    body('name').notEmpty().trim(),
    body('type').isIn(['group', 'direct']),
    body('participants').isArray().notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { projectId } = req.params;
      const { name, type, participants } = req.body;

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
        req.user.roles.includes('admin') ||
        req.user.roles.includes('admin');

      if (!hasAccess) {
        return res.status(403).json({ message: 'Not authorized to create chats' });
      }

      // Validate participants
      for (const participantId of participants) {
        const userDoc = await db.collection('users').doc(participantId).get();
        if (!userDoc.exists) {
          return res.status(400).json({ message: `User ${participantId} not found` });
        }
      }

      // For direct chats, ensure only two participants
      if (type === 'direct' && participants.length !== 2) {
        return res.status(400).json({ message: 'Direct chats must have exactly two participants' });
      }

      const chatData = {
        name,
        type,
        participants,
        createdBy: req.user.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const chatRef = await db.collection('projects')
        .doc(projectId)
        .collection('chats')
        .add(chatData);

      // Create activity log
      await createChatActivityEntry(
        projectId,
        chatRef.id,
        req.user.uid,
        'chat_created',
        {
          name,
          type,
          participants
        }
      );

      // Create notifications for participants
      for (const participantId of participants) {
        if (participantId !== req.user.uid) {
          await db.collection('users')
            .doc(participantId)
            .collection('notifications')
            .add({
              type: 'chat_created',
              title: 'New Chat Created',
              message: `You have been added to chat: ${name}`,
              projectId,
              chatId: chatRef.id,
              createdAt: new Date(),
              read: false
            });
        }
      }

      res.status(201).json({
        message: 'Chat created successfully',
        chatId: chatRef.id
      });
    } catch (error) {
      console.error('Create chat error:', error);
      res.status(500).json({ message: 'Error creating chat' });
    }
  }
);

// Get chat messages
router.get('/projects/:projectId/chats/:chatId/messages', authenticate, async (req, res) => {
  try {
    const { projectId, chatId } = req.params;
    const { limit = 50, before } = req.query;

    // Check if user has access to chat
    const chatDoc = await db.collection('projects')
      .doc(projectId)
      .collection('chats')
      .doc(chatId)
      .get();

    if (!chatDoc.exists) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const chat = chatDoc.data();
    if (!chat.participants.includes(req.user.uid)) {
      return res.status(403).json({ message: 'Not authorized to view chat messages' });
    }

    let query = db.collection('projects')
      .doc(projectId)
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .orderBy('timestamp', 'desc')
      .limit(parseInt(limit));

    if (before) {
      query = query.startAfter(before);
    }

    const messagesSnapshot = await query.get();
    const messages = [];

    for (const doc of messagesSnapshot.docs) {
      const message = doc.data();
      const senderDoc = await db.collection('users').doc(message.senderId).get();
      const senderData = senderDoc.exists ? senderDoc.data() : null;

      messages.push({
        id: doc.id,
        ...message,
        sender: senderData ? {
          id: senderData.uid,
          fullName: senderData.fullName,
          profileImage: senderData.profileImage
        } : null
      });
    }

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

// Send message
router.post('/projects/:projectId/chats/:chatId/messages',
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

      const { projectId, chatId } = req.params;
      const { text, mentions = [] } = req.body;

      // Check if user has access to chat
      const chatDoc = await db.collection('projects')
        .doc(projectId)
        .collection('chats')
        .doc(chatId)
        .get();

      if (!chatDoc.exists) {
        return res.status(404).json({ message: 'Chat not found' });
      }

      const chat = chatDoc.data();
      if (!chat.participants.includes(req.user.uid)) {
        return res.status(403).json({ message: 'Not authorized to send messages' });
      }

      const messageData = {
        text,
        mentions,
        senderId: req.user.uid,
        timestamp: new Date(),
        readBy: [req.user.uid]
      };

      const messageRef = await db.collection('projects')
        .doc(projectId)
        .collection('chats')
        .doc(chatId)
        .collection('messages')
        .add(messageData);

      // Update chat's last message timestamp
      await db.collection('projects')
        .doc(projectId)
        .collection('chats')
        .doc(chatId)
        .update({
          lastMessageAt: new Date(),
          updatedAt: new Date()
        });

      // Create notifications for mentioned users and other participants
      const notifyUsers = new Set([...mentions, ...chat.participants]);
      notifyUsers.delete(req.user.uid); // Don't notify sender

      for (const userId of notifyUsers) {
        await db.collection('users')
          .doc(userId)
          .collection('notifications')
          .add({
            type: mentions.includes(userId) ? 'message_mention' : 'new_message',
            title: mentions.includes(userId) ? 'You were mentioned' : 'New Message',
            message: `${req.user.fullName}: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`,
            projectId,
            chatId,
            messageId: messageRef.id,
            createdAt: new Date(),
            read: false
          });
      }

      res.status(201).json({
        message: 'Message sent successfully',
        messageId: messageRef.id
      });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ message: 'Error sending message' });
    }
  }
);

// Mark messages as read
router.post('/projects/:projectId/chats/:chatId/read', authenticate, async (req, res) => {
  try {
    const { projectId, chatId } = req.params;

    // Check if user has access to chat
    const chatDoc = await db.collection('projects')
      .doc(projectId)
      .collection('chats')
      .doc(chatId)
      .get();

    if (!chatDoc.exists) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const chat = chatDoc.data();
    if (!chat.participants.includes(req.user.uid)) {
      return res.status(403).json({ message: 'Not authorized to access chat' });
    }

    // Update all unread messages to mark them as read by this user
    const messagesSnapshot = await db.collection('projects')
      .doc(projectId)
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .where('readBy', 'not-in', [[req.user.uid]])
      .get();

    const batch = db.batch();
    messagesSnapshot.docs.forEach(doc => {
      const messageRef = db.collection('projects')
        .doc(projectId)
        .collection('chats')
        .doc(chatId)
        .collection('messages')
        .doc(doc.id);
      
      const currentReadBy = doc.data().readBy || [];
      if (!currentReadBy.includes(req.user.uid)) {
        batch.update(messageRef, {
          readBy: [...currentReadBy, req.user.uid]
        });
      }
    });

    await batch.commit();

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({ message: 'Error marking messages as read' });
  }
});

// Add participant to chat
router.post('/projects/:projectId/chats/:chatId/participants', 
  authenticate,
  [body('userId').notEmpty()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { projectId, chatId } = req.params;
      const { userId } = req.body;

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
        req.user.roles.includes('admin') ||
        req.user.roles.includes('admin');

      if (!hasAccess) {
        return res.status(403).json({ message: 'Not authorized to modify chat' });
      }

      // Check if chat exists
      const chatDoc = await db.collection('projects')
        .doc(projectId)
        .collection('chats')
        .doc(chatId)
        .get();

      if (!chatDoc.exists) {
        return res.status(404).json({ message: 'Chat not found' });
      }

      const chat = chatDoc.data();
      
      // Check if user to add exists
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        return res.status(400).json({ message: 'User not found' });
      }

      // Check if user is already a participant
      if (chat.participants.includes(userId)) {
        return res.status(400).json({ message: 'User is already a participant' });
      }

      // Add user to participants
      await db.collection('projects')
        .doc(projectId)
        .collection('chats')
        .doc(chatId)
        .update({
          participants: [...chat.participants, userId],
          updatedAt: new Date()
        });

      // Create notification for added user
      const userData = userDoc.data();
      await db.collection('users')
        .doc(userId)
        .collection('notifications')
        .add({
          type: 'chat_added',
          title: 'Added to Chat',
          message: `You have been added to chat: ${chat.name}`,
          projectId,
          chatId,
          createdAt: new Date(),
          read: false
        });

      res.json({ message: 'Participant added successfully' });
    } catch (error) {
      console.error('Add participant error:', error);
      res.status(500).json({ message: 'Error adding participant' });
    }
  }
);

// Remove participant from chat
router.delete('/projects/:projectId/chats/:chatId/participants/:userId', authenticate, async (req, res) => {
  try {
    const { projectId, chatId, userId } = req.params;

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
      req.user.roles.includes('admin') ||
      req.user.roles.includes('admin') ||
      req.user.uid === userId; // Users can remove themselves

    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to modify chat' });
    }

    // Check if chat exists
    const chatDoc = await db.collection('projects')
      .doc(projectId)
      .collection('chats')
      .doc(chatId)
      .get();

    if (!chatDoc.exists) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const chat = chatDoc.data();
    
    // Check if user is a participant
    if (!chat.participants.includes(userId)) {
      return res.status(400).json({ message: 'User is not a participant' });
    }

    // Remove user from participants
    const updatedParticipants = chat.participants.filter(id => id !== userId);
    
    await db.collection('projects')
      .doc(projectId)
      .collection('chats')
      .doc(chatId)
      .update({
        participants: updatedParticipants,
        updatedAt: new Date()
      });

    res.json({ message: 'Participant removed successfully' });
  } catch (error) {
    console.error('Remove participant error:', error);
    res.status(500).json({ message: 'Error removing participant' });
  }
});

// Get chat statistics
router.get('/projects/:projectId/chats/:chatId/statistics', authenticate, async (req, res) => {
  try {
    const { projectId, chatId } = req.params;
    const { startDate, endDate } = req.query;

    // Check if user has access to chat
    const chatDoc = await db.collection('projects')
      .doc(projectId)
      .collection('chats')
      .doc(chatId)
      .get();

    if (!chatDoc.exists) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const chat = chatDoc.data();
    if (!chat.participants.includes(req.user.uid)) {
      return res.status(403).json({ message: 'Not authorized to view chat statistics' });
    }

    let query = db.collection('projects')
      .doc(projectId)
      .collection('chats')
      .doc(chatId)
      .collection('messages');

    if (startDate) {
      query = query.where('timestamp', '>=', new Date(startDate));
    }
    if (endDate) {
      query = query.where('timestamp', '<=', new Date(endDate));
    }

    const messagesSnapshot = await query.get();
    
    const statistics = {
      totalMessages: 0,
      messagesByUser: {},
      messagesByDay: {},
      averageMessagesPerDay: 0,
      mostActiveUsers: [],
      mostMentionedUsers: {}
    };

    messagesSnapshot.forEach(doc => {
      const message = doc.data();
      statistics.totalMessages++;

      // Count messages by user
      statistics.messagesByUser[message.senderId] = 
        (statistics.messagesByUser[message.senderId] || 0) + 1;

      // Count messages by day
      const day = message.timestamp.toDate().toISOString().split('T')[0];
      statistics.messagesByDay[day] = 
        (statistics.messagesByDay[day] || 0) + 1;

      // Count mentions
      if (message.mentions) {
        message.mentions.forEach(userId => {
          statistics.mostMentionedUsers[userId] = 
            (statistics.mostMentionedUsers[userId] || 0) + 1;
        });
      }
    });

    // Calculate average messages per day
    const days = Object.keys(statistics.messagesByDay).length;
    statistics.averageMessagesPerDay = days > 0 
      ? statistics.totalMessages / days 
      : 0;

    // Calculate most active users
    statistics.mostActiveUsers = Object.entries(statistics.messagesByUser)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([userId, count]) => ({ userId, count }));

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
    console.error('Get chat statistics error:', error);
    res.status(500).json({ message: 'Error fetching chat statistics' });
  }
});

// Create global chat (for admins to create chats with anyone)
router.post('/chats/global',
  authenticate,
  checkRole(['admin', 'admin']),
  [
    body('name').notEmpty().trim(),
    body('type').isIn(['group', 'direct']),
    body('participants').isArray().notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, type, participants } = req.body;

      // Validate participants
      for (const participantId of participants) {
        const userDoc = await db.collection('users').doc(participantId).get();
        if (!userDoc.exists) {
          return res.status(400).json({ message: `User ${participantId} not found` });
        }
      }

      // For direct chats, ensure only two participants
      if (type === 'direct' && participants.length !== 2) {
        return res.status(400).json({ message: 'Direct chats must have exactly two participants' });
      }

      // Add creator to participants if not already included
      if (!participants.includes(req.user.uid)) {
        participants.push(req.user.uid);
      }

      const chatData = {
        name,
        type,
        participants,
        createdBy: req.user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        isGlobal: true
      };

      const chatRef = await db.collection('global-chats').add(chatData);

      // Create notifications for participants
      for (const participantId of participants) {
        if (participantId !== req.user.uid) {
          await db.collection('users')
            .doc(participantId)
            .collection('notifications')
            .add({
              type: 'chat_created',
              title: 'New Chat Created',
              message: `You have been added to chat: ${name}`,
              chatId: chatRef.id,
              isGlobal: true,
              createdAt: new Date(),
              read: false
            });
        }
      }

      res.status(201).json({
        message: 'Global chat created successfully',
        chatId: chatRef.id
      });
    } catch (error) {
      console.error('Create global chat error:', error);
      res.status(500).json({ message: 'Error creating global chat' });
    }
  }
);

// Get messages from global chat
router.get('/chats/global/:chatId/messages', authenticate, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { limit = 50, before } = req.query;

    // Check if user has access to chat
    const chatDoc = await db.collection('global-chats').doc(chatId).get();

    if (!chatDoc.exists) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const chat = chatDoc.data();
    if (!chat.participants.includes(req.user.uid)) {
      return res.status(403).json({ message: 'Not authorized to view chat messages' });
    }

    let query = db.collection('global-chats')
      .doc(chatId)
      .collection('messages')
      .orderBy('timestamp', 'desc')
      .limit(parseInt(limit));

    if (before) {
      query = query.startAfter(before);
    }

    const messagesSnapshot = await query.get();
    const messages = [];

    for (const doc of messagesSnapshot.docs) {
      const message = doc.data();
      const senderDoc = await db.collection('users').doc(message.senderId).get();
      const senderData = senderDoc.exists ? senderDoc.data() : null;

      messages.push({
        id: doc.id,
        ...message,
        sender: senderData ? {
          id: message.senderId,
          name: senderData.fullName || senderData.displayName,
          fullName: senderData.fullName || senderData.displayName,
          displayName: senderData.displayName || senderData.fullName,
          profileImage: senderData.profileImage
        } : null
      });
    }

    res.json(messages);
  } catch (error) {
    console.error('Get global chat messages error:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

// Send message to global chat
router.post('/chats/global/:chatId/messages',
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

      const { chatId } = req.params;
      const { text, mentions = [] } = req.body;

      // Check if user has access to chat
      const chatDoc = await db.collection('global-chats').doc(chatId).get();

      if (!chatDoc.exists) {
        return res.status(404).json({ message: 'Chat not found' });
      }

      const chat = chatDoc.data();
      if (!chat.participants.includes(req.user.uid)) {
        return res.status(403).json({ message: 'Not authorized to send messages' });
      }

      const messageData = {
        text,
        mentions,
        senderId: req.user.uid,
        timestamp: new Date(),
        readBy: [req.user.uid]
      };

      const messageRef = await db.collection('global-chats')
        .doc(chatId)
        .collection('messages')
        .add(messageData);

      // Update chat's last message timestamp
      await db.collection('global-chats')
        .doc(chatId)
        .update({
          lastMessageAt: new Date(),
          updatedAt: new Date()
        });

      res.status(201).json({
        message: 'Message sent successfully',
        messageId: messageRef.id
      });
    } catch (error) {
      console.error('Send global chat message error:', error);
      res.status(500).json({ message: 'Error sending message' });
    }
  }
);

module.exports = router; 