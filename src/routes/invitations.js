const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');
const { authenticate } = require('../middleware/auth');

// ============= ЗАЯВКИ НА ВСТУПЛЕНИЕ В КОМАНДУ (ДЛЯ PM) =============

// Отправить заявку на вступление в команду
router.post('/team-invitations', authenticate, async (req, res) => {
  try {
    const { projectId, userId, message } = req.body;
    const senderId = req.user.uid;

    // Проверяем, что отправитель - PM
    if (!req.user.roles.includes('pm') && !req.user.roles.includes('pm')) {
      return res.status(403).json({ error: 'Только проект-менеджеры могут отправлять заявки' });
    }

    // Получаем информацию о проекте
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ error: 'Проект не найден' });
    }

    // Получаем информацию о получателе
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Проверяем, нет ли уже активной заявки
    const existingInvitation = await db.collection('team_invitations')
      .where('projectId', '==', projectId)
      .where('userId', '==', userId)
      .where('status', '==', 'pending')
      .get();

    if (!existingInvitation.empty) {
      return res.status(400).json({ error: 'Заявка уже отправлена этому пользователю' });
    }

    // Создаем заявку на вступление в команду
    const invitation = {
      id: db.collection('team_invitations').doc().id,
      type: 'team_invitation',
      projectId,
      projectName: projectDoc.data().name,
      userId,
      userName: userDoc.data().displayName,
      userEmail: userDoc.data().email,
      senderId,
      senderName: req.user.displayName || req.user.email,
      message: message || `Приглашение в проект "${projectDoc.data().name}"`,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('team_invitations').doc(invitation.id).set(invitation);

    res.status(201).json({ 
      message: 'Заявка отправлена успешно',
      invitationId: invitation.id 
    });
  } catch (error) {
    console.error('Error sending team invitation:', error);
    res.status(500).json({ error: 'Ошибка при отправке заявки' });
  }
});

// Получить заявки на вступление в команду для пользователя (исполнители)
router.get('/team-invitations', authenticate, async (req, res) => {
  try {
    const userId = req.user.uid;
    const status = req.query.status || 'pending';

    const invitationsSnapshot = await db.collection('team_invitations')
      .where('userId', '==', userId)
      .where('status', '==', status)
      .orderBy('createdAt', 'desc')
      .get();

    const invitations = [];
    invitationsSnapshot.forEach(doc => {
      invitations.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json(invitations);
  } catch (error) {
    console.error('Error getting team invitations:', error);
    res.status(500).json({ error: 'Ошибка при получении заявок' });
  }
});

// Ответить на заявку на вступление в команду (принять/отклонить)
router.post('/team-invitations/:invitationId/respond', authenticate, async (req, res) => {
  try {
    const { invitationId } = req.params;
    const { action } = req.body;
    const userId = req.user.uid;

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Неверное действие. Используйте accept или reject' });
    }

    const invitationDoc = await db.collection('team_invitations').doc(invitationId).get();
    if (!invitationDoc.exists) {
      return res.status(404).json({ error: 'Заявка не найдена' });
    }

    const invitation = invitationDoc.data();

    if (invitation.userId !== userId) {
      return res.status(403).json({ error: 'Нет доступа к этой заявке' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ error: 'Заявка уже обработана' });
    }

    const batch = db.batch();
    const newStatus = action === 'accept' ? 'accepted' : 'rejected';
    
    batch.update(db.collection('team_invitations').doc(invitationId), {
      status: newStatus,
      respondedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    if (action === 'accept') {
      const projectRef = db.collection('projects').doc(invitation.projectId);
      const teamRef = db.collection('teams').doc(invitation.projectId);

      // Получаем данные проекта
      const projectDoc = await projectRef.get();
      if (projectDoc.exists) {
        const projectData = projectDoc.data();
        const currentMembers = projectData.members || {};
        const currentTeamMembers = projectData.teamMembers || [];

        // Добавляем пользователя в members объект
        currentMembers[userId] = {
          uid: userId,
          email: invitation.userEmail,
          displayName: invitation.userName,
          roles: req.user.roles || [],
          joinedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        // Добавляем пользователя в teamMembers массив, если его там нет
        if (!currentTeamMembers.includes(userId)) {
          currentTeamMembers.push(userId);
        }

        batch.update(projectRef, {
          members: currentMembers,
          teamMembers: currentTeamMembers,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      // Проверяем существование команды и создаем/обновляем
      const teamDoc = await teamRef.get();
      if (teamDoc.exists) {
        // Команда существует - обновляем
        const teamData = teamDoc.data();
        const currentTeamMembers = teamData.members || {};

        currentTeamMembers[userId] = {
          uid: userId,
          email: invitation.userEmail,
          name: invitation.userName,
          roles: req.user.roles || [],
          joinedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        batch.update(teamRef, {
          members: currentTeamMembers,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        // Команда не существует - создаем новую
        const newTeam = {
          id: invitation.projectId,
          projectId: invitation.projectId,
          name: `Команда проекта ${invitation.projectName}`,
          description: `Команда для работы над проектом "${invitation.projectName}"`,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          members: {
            [userId]: {
              uid: userId,
              email: invitation.userEmail,
              name: invitation.userName,
              roles: req.user.roles || [],
              joinedAt: admin.firestore.FieldValue.serverTimestamp()
            }
          }
        };

        batch.set(teamRef, newTeam);
      }
    }

    await batch.commit();

    const message = action === 'accept' 
      ? 'Заявка принята. Вы добавлены в команду проекта!'
      : 'Заявка отклонена';

    res.json({ message, status: newStatus });
  } catch (error) {
    console.error('Error responding to team invitation:', error);
    res.status(500).json({ error: 'Ошибка при обработке заявки' });
  }
});

// Получить заявки на вступление в команду для проекта (для PM)
router.get('/projects/:projectId/team-invitations', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;
    const senderId = req.user.uid;

    // Проверяем, что отправитель - PM
    if (!req.user.roles.includes('pm') && !req.user.roles.includes('admin')) {
      return res.status(403).json({ error: 'Только проект-менеджеры могут просматривать заявки' });
    }

    // Исправленный запрос - убираем составной индекс
    const invitationsSnapshot = await db.collection('team_invitations')
      .where('projectId', '==', projectId)
      .get();

    const invitations = [];
    invitationsSnapshot.forEach(doc => {
      const data = doc.data();
      // Фильтруем по senderId в памяти, если нужно
      if (data.senderId === senderId || req.user.roles.includes('admin')) {
        invitations.push({
          id: doc.id,
          ...data
        });
      }
    });

    // Сортируем по времени создания в памяти
    invitations.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
      const bTime = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
      return bTime - aTime;
    });

    res.json(invitations);
  } catch (error) {
    console.error('Error getting project team invitations:', error);
    res.status(500).json({ error: 'Ошибка при получении заявок проекта' });
  }
});

// ============= ЗАЯВКИ КЛИЕНТОВ НА СОЗДАНИЕ ПРОЕКТОВ (ДЛЯ АДМИНОВ) =============

// Создать заявку клиента на создание проекта
router.post('/client-applications', authenticate, async (req, res) => {
  try {
    const {
      projectName,
      description,
      budget,
      deadline,
      requirements,
      contactInfo
    } = req.body;
    
    const clientId = req.user.uid;

    if (!req.user.roles.includes('client')) {
      return res.status(403).json({ error: 'Только клиенты могут подавать заявки на создание проектов' });
    }

    const application = {
      id: db.collection('client_applications').doc().id,
      type: 'client_application',
      clientId,
      clientName: req.user.displayName || req.user.email,
      clientEmail: req.user.email,
      projectName,
      description,
      budget: parseFloat(budget),
      deadline: new Date(deadline),
      requirements: requirements || '',
      contactInfo: contactInfo || {},
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('client_applications').doc(application.id).set(application);

    res.status(201).json({ 
      message: 'Заявка на создание проекта отправлена успешно',
      applicationId: application.id 
    });
  } catch (error) {
    console.error('Error creating client application:', error);
    res.status(500).json({ error: 'Ошибка при создании заявки' });
  }
});

// Получить заявки клиентов (для админов)
router.get('/client-applications', authenticate, async (req, res) => {
  try {
    if (!req.user.roles.includes('admin')) {
      return res.status(403).json({ error: 'Только администраторы могут просматривать заявки клиентов' });
    }

    const status = req.query.status || 'pending';
    
    const applicationsSnapshot = await db.collection('client_applications')
      .where('status', '==', status)
      .orderBy('createdAt', 'desc')
      .get();

    const applications = [];
    applicationsSnapshot.forEach(doc => {
      applications.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json(applications);
  } catch (error) {
    console.error('Error getting client applications:', error);
    res.status(500).json({ error: 'Ошибка при получении заявок клиентов' });
  }
});

// Обработать заявку клиента (одобрить/отклонить)
router.post('/client-applications/:applicationId/process', authenticate, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { action, comment } = req.body;

    if (!req.user.roles.includes('admin')) {
      return res.status(403).json({ error: 'Только администраторы могут обрабатывать заявки' });
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Неверное действие. Используйте approve или reject' });
    }

    const applicationDoc = await db.collection('client_applications').doc(applicationId).get();
    if (!applicationDoc.exists) {
      return res.status(404).json({ error: 'Заявка не найдена' });
    }

    const application = applicationDoc.data();

    if (application.status !== 'pending') {
      return res.status(400).json({ error: 'Заявка уже обработана' });
    }

    const batch = db.batch();
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    batch.update(db.collection('client_applications').doc(applicationId), {
      status: newStatus,
      processedBy: req.user.uid,
      processedByName: req.user.displayName || req.user.email,
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      adminComment: comment || '',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    if (action === 'approve') {
      const projectId = `project-${Date.now()}`;
      const project = {
        id: projectId,
        name: application.projectName,
        description: application.description,
        budget: application.budget,
        deadline: application.deadline,
        requirements: application.requirements,
        clientId: application.clientId,
        clientName: application.clientName,
        status: 'planning',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        members: {
          [application.clientId]: {
            uid: application.clientId,
            email: application.clientEmail,
            displayName: application.clientName,
            roles: ['client'],
            joinedAt: admin.firestore.FieldValue.serverTimestamp()
          }
        }
      };

      batch.set(db.collection('projects').doc(projectId), project);

      const team = {
        id: projectId,
        projectId: projectId,
        name: `Команда проекта ${application.projectName}`,
        description: `Команда для работы над проектом "${application.projectName}"`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        members: {
          [application.clientId]: {
            uid: application.clientId,
            email: application.clientEmail,
            name: application.clientName,
            roles: ['client'],
            joinedAt: admin.firestore.FieldValue.serverTimestamp()
          }
        }
      };

      batch.set(db.collection('teams').doc(projectId), team);
    }

    await batch.commit();

    const message = action === 'approve' 
      ? 'Заявка одобрена. Проект создан!'
      : 'Заявка отклонена';

    res.json({ message, status: newStatus });
  } catch (error) {
    console.error('Error processing client application:', error);
    res.status(500).json({ error: 'Ошибка при обработке заявки' });
  }
});

// Получить свои заявки (для клиентов)
router.get('/my-applications', authenticate, async (req, res) => {
  try {
    const userId = req.user.uid;
    
    const applicationsSnapshot = await db.collection('client_applications')
      .where('clientId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const applications = [];
    applicationsSnapshot.forEach(doc => {
      applications.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json(applications);
  } catch (error) {
    console.error('Error getting my applications:', error);
    res.status(500).json({ error: 'Ошибка при получении ваших заявок' });
  }
});

// ============= ОБЩИЙ РОУТ ДЛЯ ВСЕХ ПРИГЛАШЕНИЙ =============

// Получить все приглашения для пользователя (универсальный роут)
router.get('/invitations', authenticate, async (req, res) => {
  try {
    const userId = req.user.uid;
    const status = req.query.status || 'pending';
    const allInvitations = [];

    // Получаем team invitations (приглашения в команду)
    if (req.user.roles.includes('executor') || req.user.roles.includes('pm')) {
      const teamInvitationsSnapshot = await db.collection('team_invitations')
        .where('userId', '==', userId)
        .where('status', '==', status)
        .get();

      teamInvitationsSnapshot.forEach(doc => {
        allInvitations.push({
          id: doc.id,
          type: 'team_invitation',
          ...doc.data()
        });
      });
    }

    // Получаем client applications (заявки клиентов) - только для клиентов
    if (req.user.roles.includes('client')) {
      const clientApplicationsSnapshot = await db.collection('client_applications')
        .where('clientId', '==', userId)
        .where('status', '==', status)
        .get();

      clientApplicationsSnapshot.forEach(doc => {
        allInvitations.push({
          id: doc.id,
          type: 'client_application',
          ...doc.data()
        });
      });
    }

    // Сортируем по времени создания
    allInvitations.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
      const bTime = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
      return bTime - aTime;
    });

    res.json(allInvitations);
  } catch (error) {
    console.error('Error getting all invitations:', error);
    res.status(500).json({ error: 'Ошибка при получении приглашений' });
  }
});

// Принять приглашение (универсальный роут)
router.post('/invitations/:invitationId/accept', authenticate, async (req, res) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user.uid;

    // Сначала ищем в team_invitations
    let invitationDoc = await db.collection('team_invitations').doc(invitationId).get();
    let collection = 'team_invitations';
    let type = 'team_invitation';

    // Если не найдено, ищем в client_applications
    if (!invitationDoc.exists) {
      invitationDoc = await db.collection('client_applications').doc(invitationId).get();
      collection = 'client_applications';
      type = 'client_application';
    }

    if (!invitationDoc.exists) {
      return res.status(404).json({ error: 'Приглашение не найдено' });
    }

    const invitation = invitationDoc.data();

    // Проверяем права доступа
    if (type === 'team_invitation' && invitation.userId !== userId) {
      return res.status(403).json({ error: 'Нет доступа к этому приглашению' });
    }
    if (type === 'client_application' && invitation.clientId !== userId) {
      return res.status(403).json({ error: 'Нет доступа к этой заявке' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ error: 'Приглашение уже обработано' });
    }

    // Обновляем статус
    await db.collection(collection).doc(invitationId).update({
      status: 'accepted',
      respondedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Для team_invitation добавляем пользователя в команду
    if (type === 'team_invitation') {
      const batch = db.batch();
      const projectRef = db.collection('projects').doc(invitation.projectId);
      const teamRef = db.collection('teams').doc(invitation.projectId);

      // Получаем данные проекта
      const projectDoc = await projectRef.get();
      if (projectDoc.exists) {
        const projectData = projectDoc.data();
        const currentMembers = projectData.members || {};
        const currentTeamMembers = projectData.teamMembers || [];

        // Добавляем пользователя в members объект
        currentMembers[userId] = {
          uid: userId,
          email: invitation.userEmail,
          displayName: invitation.userName,
          roles: req.user.roles || [],
          joinedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        // Добавляем пользователя в teamMembers массив, если его там нет
        if (!currentTeamMembers.includes(userId)) {
          currentTeamMembers.push(userId);
        }

        batch.update(projectRef, {
          members: currentMembers,
          teamMembers: currentTeamMembers,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      // Проверяем существование команды и создаем/обновляем
      const teamDoc = await teamRef.get();
      if (teamDoc.exists) {
        // Команда существует - обновляем
        const teamData = teamDoc.data();
        const currentTeamMembers = teamData.members || {};

        currentTeamMembers[userId] = {
          uid: userId,
          email: invitation.userEmail,
          name: invitation.userName,
          roles: req.user.roles || [],
          joinedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        batch.update(teamRef, {
          members: currentTeamMembers,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        // Команда не существует - создаем новую
        const newTeam = {
          id: invitation.projectId,
          projectId: invitation.projectId,
          name: `Команда проекта ${invitation.projectName}`,
          description: `Команда для работы над проектом "${invitation.projectName}"`,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          members: {
            [userId]: {
              uid: userId,
              email: invitation.userEmail,
              name: invitation.userName,
              roles: req.user.roles || [],
              joinedAt: admin.firestore.FieldValue.serverTimestamp()
            }
          }
        };

        batch.set(teamRef, newTeam);
      }

      await batch.commit();
    }

    res.json({ 
      message: type === 'team_invitation' 
        ? 'Приглашение принято. Вы добавлены в команду проекта!' 
        : 'Заявка принята',
      status: 'accepted' 
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ error: 'Ошибка при принятии приглашения' });
  }
});

// Отклонить приглашение (универсальный роут)
router.post('/invitations/:invitationId/decline', authenticate, async (req, res) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user.uid;

    // Сначала ищем в team_invitations
    let invitationDoc = await db.collection('team_invitations').doc(invitationId).get();
    let collection = 'team_invitations';
    let type = 'team_invitation';

    // Если не найдено, ищем в client_applications
    if (!invitationDoc.exists) {
      invitationDoc = await db.collection('client_applications').doc(invitationId).get();
      collection = 'client_applications';
      type = 'client_application';
    }

    if (!invitationDoc.exists) {
      return res.status(404).json({ error: 'Приглашение не найдено' });
    }

    const invitation = invitationDoc.data();

    // Проверяем права доступа
    if (type === 'team_invitation' && invitation.userId !== userId) {
      return res.status(403).json({ error: 'Нет доступа к этому приглашению' });
    }
    if (type === 'client_application' && invitation.clientId !== userId) {
      return res.status(403).json({ error: 'Нет доступа к этой заявке' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ error: 'Приглашение уже обработано' });
    }

    // Обновляем статус
    await db.collection(collection).doc(invitationId).update({
      status: 'rejected',
      respondedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ 
      message: 'Приглашение отклонено',
      status: 'rejected' 
    });
  } catch (error) {
    console.error('Error declining invitation:', error);
    res.status(500).json({ error: 'Ошибка при отклонении приглашения' });
  }
});

module.exports = router; 