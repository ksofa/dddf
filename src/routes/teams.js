const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { authenticate } = require('../middleware/auth');

// Получить все команды
router.get('/', async (req, res) => {
  try {
    console.log('Getting teams...');
    const teamsSnapshot = await db.collection('teams').get();
    const teams = [];
    
    for (const doc of teamsSnapshot.docs) {
      const teamData = { id: doc.id, ...doc.data() };
      
      // Получаем данные PM (Team Leader)
      if (teamData.pmId) {
        const pmDoc = await db.collection('users').doc(teamData.pmId).get();
        if (pmDoc.exists) {
          teamData.pm = { id: pmDoc.id, ...pmDoc.data() };
        }
      }
      
      // Получаем данные участников
      if (teamData.memberIds && teamData.memberIds.length > 0) {
        const members = [];
        for (const memberId of teamData.memberIds) {
          const memberDoc = await db.collection('users').doc(memberId).get();
          if (memberDoc.exists) {
            members.push({ id: memberDoc.id, ...memberDoc.data() });
          }
        }
        teamData.members = members;
      } else {
        teamData.members = [];
      }
      
      teams.push(teamData);
    }
    
    console.log(`Found ${teams.length} teams`);
    res.json(teams);
  } catch (error) {
    console.error('Error getting teams:', error);
    res.status(500).json({ error: 'Failed to get teams' });
  }
});

// Получить детали команды
router.get('/:id', async (req, res) => {
  try {
    const teamDoc = await db.collection('teams').doc(req.params.id).get();
    
    if (!teamDoc.exists) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    const teamData = { id: teamDoc.id, ...teamDoc.data() };
    
    // Получаем данные PM
    if (teamData.pmId) {
      const pmDoc = await db.collection('users').doc(teamData.pmId).get();
      if (pmDoc.exists) {
        teamData.pm = { id: pmDoc.id, ...pmDoc.data() };
      }
    }
    
    // Получаем данные участников
    if (teamData.memberIds && teamData.memberIds.length > 0) {
      const members = [];
      for (const memberId of teamData.memberIds) {
        const memberDoc = await db.collection('users').doc(memberId).get();
        if (memberDoc.exists) {
          members.push({ id: memberDoc.id, ...memberDoc.data() });
        }
      }
      teamData.members = members;
    } else {
      teamData.members = [];
    }
    
    res.json(teamData);
  } catch (error) {
    console.error('Error getting team:', error);
    res.status(500).json({ error: 'Failed to get team' });
  }
});

// Создать команду
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, description, projectId } = req.body;
    const userId = req.user.uid;
    
    // Проверяем, что пользователь - PM
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists || !userDoc.data().roles.includes('pm')) {
      return res.status(403).json({ error: 'Only PMs can create teams' });
    }
    
    const teamData = {
      name,
      description: description || '',
      pmId: userId,
      memberIds: [],
      projectId: projectId || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const teamRef = await db.collection('teams').add(teamData);
    
    res.status(201).json({
      id: teamRef.id,
      ...teamData,
      message: 'Team created successfully'
    });
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ error: 'Failed to create team' });
  }
});

// Поиск исполнителей для добавления в команду
router.get('/:id/search-executors', authenticate, async (req, res) => {
  try {
    const { profession, search } = req.query;
    
    // Получаем всех исполнителей
    let query = db.collection('users').where('roles', 'array-contains', 'executor');
    
    const usersSnapshot = await query.get();
    let users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Фильтрация по профессии
    if (profession) {
      users = users.filter(user => user.profession === profession);
    }
    
    // Фильтрация по поисковому запросу
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(user => 
        user.name?.toLowerCase().includes(searchLower) ||
        user.profession?.toLowerCase().includes(searchLower)
      );
    }
    
    res.json(users);
  } catch (error) {
    console.error('Error searching executors:', error);
    res.status(500).json({ error: 'Failed to search executors' });
  }
});

// Отправить заявку исполнителю
router.post('/:id/invite', authenticate, async (req, res) => {
  try {
    const teamId = req.params.id;
    const senderId = req.user.uid;
    const { 
      receiverId, 
      rate, 
      startDate, 
      estimatedDuration, 
      coverLetter, 
      attachmentUrl,
      projectType 
    } = req.body;
    
    // Проверяем, что отправитель - PM этой команды
    const teamDoc = await db.collection('teams').doc(teamId).get();
    if (!teamDoc.exists || teamDoc.data().pmId !== senderId) {
      return res.status(403).json({ error: 'Only team PM can send invitations' });
    }
    
    // Проверяем, что получатель - исполнитель
    const receiverDoc = await db.collection('users').doc(receiverId).get();
    if (!receiverDoc.exists || !receiverDoc.data().roles.includes('executor')) {
      return res.status(400).json({ error: 'Receiver must be an executor' });
    }
    
    const applicationData = {
      type: 'team_invitation',
      teamId,
      projectId: teamDoc.data().projectId,
      senderId,
      receiverId,
      status: 'pending',
      rate: rate || null,
      startDate: startDate || null,
      estimatedDuration: estimatedDuration || null,
      coverLetter: coverLetter || '',
      attachmentUrl: attachmentUrl || null,
      projectType: projectType || 'without_project',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const applicationRef = await db.collection('applications').add(applicationData);
    
    res.status(201).json({
      id: applicationRef.id,
      ...applicationData,
      message: 'Invitation sent successfully'
    });
  } catch (error) {
    console.error('Error sending invitation:', error);
    res.status(500).json({ error: 'Failed to send invitation' });
  }
});

// Удалить участника из команды (только для PM)
router.delete('/:id/remove-member', authenticate, async (req, res) => {
  try {
    const teamId = req.params.id;
    const userId = req.user.uid;
    const { memberId } = req.body;
    
    const teamDoc = await db.collection('teams').doc(teamId).get();
    
    if (!teamDoc.exists) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    const teamData = teamDoc.data();
    
    // Проверяем, что пользователь - PM команды
    if (teamData.pmId !== userId) {
      return res.status(403).json({ error: 'Only team PM can remove members' });
    }
    
    // Удаляем участника из команды
    const memberIds = teamData.memberIds || [];
    const updatedMemberIds = memberIds.filter(id => id !== memberId);
    
    await db.collection('teams').doc(teamId).update({
      memberIds: updatedMemberIds,
      updatedAt: new Date()
    });
    
    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

module.exports = router; 