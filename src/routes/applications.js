const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { authenticate } = require('../middleware/auth');

// Получить заявки в зависимости от роли пользователя
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.uid;
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userRoles = userDoc.data().roles || [];
    let applicationsQuery;
    
    if (userRoles.includes('admin')) {
      // Админ видит все заявки
      applicationsQuery = db.collection('applications');
    } else if (userRoles.includes('pm')) {
      // PM видит заявки от клиентов и отправленные им приглашения в команду
      applicationsQuery = db.collection('applications')
        .where('type', 'in', ['client_request', 'team_invitation']);
    } else if (userRoles.includes('executor')) {
      // Исполнитель видит только входящие заявки (приглашения в команду)
      applicationsQuery = db.collection('applications')
        .where('receiverId', '==', userId)
        .where('type', '==', 'team_invitation');
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const applicationsSnapshot = await applicationsQuery.get();
    const applications = [];
    
    for (const doc of applicationsSnapshot.docs) {
      const appData = { id: doc.id, ...doc.data() };
      
      // Получаем данные отправителя
      if (appData.senderId) {
        const senderDoc = await db.collection('users').doc(appData.senderId).get();
        if (senderDoc.exists) {
          appData.sender = { id: senderDoc.id, ...senderDoc.data() };
        }
      }
      
      // Получаем данные получателя
      if (appData.receiverId) {
        const receiverDoc = await db.collection('users').doc(appData.receiverId).get();
        if (receiverDoc.exists) {
          appData.receiver = { id: receiverDoc.id, ...receiverDoc.data() };
        }
      }
      
      // Получаем данные команды
      if (appData.teamId) {
        const teamDoc = await db.collection('teams').doc(appData.teamId).get();
        if (teamDoc.exists) {
          appData.team = { id: teamDoc.id, ...teamDoc.data() };
        }
      }
      
      // Получаем данные проекта
      if (appData.projectId) {
        const projectDoc = await db.collection('projects').doc(appData.projectId).get();
        if (projectDoc.exists) {
          appData.project = { id: projectDoc.id, ...projectDoc.data() };
        }
      }
      
      applications.push(appData);
    }
    
    res.json(applications);
  } catch (error) {
    console.error('Error getting applications:', error);
    res.status(500).json({ error: 'Failed to get applications' });
  }
});

// Принять заявку (только для исполнителей)
router.post('/:id/accept', authenticate, async (req, res) => {
  try {
    const applicationId = req.params.id;
    const userId = req.user.uid;
    
    const applicationDoc = await db.collection('applications').doc(applicationId).get();
    
    if (!applicationDoc.exists) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    const applicationData = applicationDoc.data();
    
    // Проверяем, что пользователь - получатель заявки
    if (applicationData.receiverId !== userId) {
      return res.status(403).json({ error: 'You can only accept your own applications' });
    }
    
    // Проверяем, что заявка еще не обработана
    if (applicationData.status !== 'pending') {
      return res.status(400).json({ error: 'Application already processed' });
    }
    
    // Обновляем статус заявки
    await db.collection('applications').doc(applicationId).update({
      status: 'accepted',
      updatedAt: new Date()
    });
    
    // Добавляем исполнителя в команду
    if (applicationData.teamId) {
      const teamDoc = await db.collection('teams').doc(applicationData.teamId).get();
      if (teamDoc.exists) {
        const teamData = teamDoc.data();
        const memberIds = teamData.memberIds || [];
        
        if (!memberIds.includes(userId)) {
          memberIds.push(userId);
          await db.collection('teams').doc(applicationData.teamId).update({
            memberIds,
            updatedAt: new Date()
          });
        }
      }
    }
    
    res.json({ message: 'Application accepted successfully' });
  } catch (error) {
    console.error('Error accepting application:', error);
    res.status(500).json({ error: 'Failed to accept application' });
  }
});

// Отклонить заявку (только для исполнителей)
router.post('/:id/decline', authenticate, async (req, res) => {
  try {
    const applicationId = req.params.id;
    const userId = req.user.uid;
    
    const applicationDoc = await db.collection('applications').doc(applicationId).get();
    
    if (!applicationDoc.exists) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    const applicationData = applicationDoc.data();
    
    // Проверяем, что пользователь - получатель заявки
    if (applicationData.receiverId !== userId) {
      return res.status(403).json({ error: 'You can only decline your own applications' });
    }
    
    // Проверяем, что заявка еще не обработана
    if (applicationData.status !== 'pending') {
      return res.status(400).json({ error: 'Application already processed' });
    }
    
    // Обновляем статус заявки
    await db.collection('applications').doc(applicationId).update({
      status: 'declined',
      updatedAt: new Date()
    });
    
    res.json({ message: 'Application declined successfully' });
  } catch (error) {
    console.error('Error declining application:', error);
    res.status(500).json({ error: 'Failed to decline application' });
  }
});

// Назначить PM для заявки (только для админа)
router.post('/:id/assign-pm', authenticate, async (req, res) => {
  try {
    const applicationId = req.params.id;
    const userId = req.user.uid;
    const { pmId } = req.body;
    
    // Проверяем, что пользователь - админ
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists || !userDoc.data().roles.includes('admin')) {
      return res.status(403).json({ error: 'Only admin can assign PM' });
    }
    
    const applicationDoc = await db.collection('applications').doc(applicationId).get();
    
    if (!applicationDoc.exists) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    const applicationData = applicationDoc.data();
    
    // Проверяем, что заявка еще не обработана
    if (applicationData.status !== 'pending') {
      return res.status(400).json({ error: 'Application already processed' });
    }
    
    // Проверяем, что PM существует и имеет роль PM
    const pmDoc = await db.collection('users').doc(pmId).get();
    if (!pmDoc.exists || !pmDoc.data().roles.includes('pm')) {
      return res.status(400).json({ error: 'Invalid PM' });
    }
    
    // Обновляем заявку
    await db.collection('applications').doc(applicationId).update({
      assignedPM: pmId,
      updatedAt: new Date()
    });
    
    res.json({ message: 'PM assigned successfully' });
  } catch (error) {
    console.error('Error assigning PM:', error);
    res.status(500).json({ error: 'Failed to assign PM' });
  }
});

// Получить статистику заявок для админа
router.get('/stats', authenticate, async (req, res) => {
  try {
    const userId = req.user.uid;
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists || !userDoc.data().roles.includes('admin')) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const applicationsSnapshot = await db.collection('applications').get();
    const stats = {
      total: applicationsSnapshot.size,
      pending: 0,
      accepted: 0,
      declined: 0,
      team_invitations: 0
    };
    
    applicationsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.status === 'pending') stats.pending++;
      if (data.status === 'accepted') stats.accepted++;
      if (data.status === 'declined') stats.declined++;
      if (data.type === 'team_invitation') stats.team_invitations++;
    });
    
    res.json(stats);
  } catch (error) {
    console.error('Error getting application stats:', error);
    res.status(500).json({ error: 'Failed to get application stats' });
  }
});

module.exports = router; 