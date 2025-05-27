const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { authenticate } = require('../middleware/auth');
const admin = require('firebase-admin');

// Получить все команды
router.get('/', authenticate, async (req, res) => {
  try {
    console.log('Getting teams...');
    const userId = req.user.uid;
    const userRoles = req.user.roles || [];
    
    let teamsSnapshot;
    
    // Если пользователь админ - показываем все команды
    if (userRoles.includes('admin')) {
      teamsSnapshot = await db.collection('teams').get();
    } else if (userRoles.includes('pm')) {
      // Для PM получаем все команды и фильтруем в памяти
      teamsSnapshot = await db.collection('teams').get();
    } else {
      // Для других ролей - показываем команды где пользователь является участником
      teamsSnapshot = await db.collection('teams')
        .where('memberIds', 'array-contains', userId)
        .get();
    }
    
    const teams = [];
    
    for (const doc of teamsSnapshot.docs) {
      const teamData = { id: doc.id, ...doc.data() };
      
      // Проверяем права доступа для PM
      if (userRoles.includes('pm') && !userRoles.includes('admin')) {
        // Проверяем разные структуры команд
        let isPMTeam = false;
        
        // Структура 1: pmId
        if (teamData.pmId === userId) {
          isPMTeam = true;
        }
        
        // Структура 2: teamLead
        if (teamData.teamLead && teamData.teamLead.uid === userId) {
          isPMTeam = true;
        }
        
        // Структура 3: проверяем через projectId
        if (teamData.projectId) {
          const projectDoc = await db.collection('projects').doc(teamData.projectId).get();
          if (projectDoc.exists && projectDoc.data().pmId === userId) {
            isPMTeam = true;
          }
        }
        
        // Если команда не принадлежит PM, пропускаем
        if (!isPMTeam) {
          continue;
        }
      }
      
      // Получаем данные PM (Team Leader)
      if (teamData.pmId) {
        const pmDoc = await db.collection('users').doc(teamData.pmId).get();
        if (pmDoc.exists) {
          teamData.pm = { id: pmDoc.id, ...pmDoc.data() };
        }
      } else if (teamData.teamLead && teamData.teamLead.uid) {
        // Если есть teamLead, используем его как PM
        const pmDoc = await db.collection('users').doc(teamData.teamLead.uid).get();
        if (pmDoc.exists) {
          teamData.pm = { id: pmDoc.id, ...pmDoc.data() };
          teamData.pmId = teamData.teamLead.uid; // Добавляем для совместимости
        }
      }
      
      // Получаем данные участников
      if (teamData.memberIds && teamData.memberIds.length > 0) {
        // Структура 1: memberIds
        const members = [];
        for (const memberId of teamData.memberIds) {
          const memberDoc = await db.collection('users').doc(memberId).get();
          if (memberDoc.exists) {
            members.push({ id: memberDoc.id, ...memberDoc.data() });
          }
        }
        teamData.members = members;
      } else if (teamData.members && typeof teamData.members === 'object') {
        // Структура 2: members как объект
        const membersArray = [];
        for (const [memberId, memberData] of Object.entries(teamData.members)) {
          const memberDoc = await db.collection('users').doc(memberId).get();
          if (memberDoc.exists) {
            const userData = memberDoc.data();
            membersArray.push({
              id: memberId,
              name: userData.fullName || userData.displayName || memberData.name,
              email: userData.email || memberData.email,
              role: memberData.role || memberData.roles?.[0] || 'member',
              ...userData
            });
          }
        }
        teamData.members = membersArray;
      } else {
        teamData.members = [];
      }
      
      teams.push(teamData);
    }
    
    console.log(`Found ${teams.length} teams for user ${userId} with roles [${userRoles.join(', ')}]`);
    res.json(teams);
  } catch (error) {
    console.error('Error getting teams:', error);
    res.status(500).json({ error: 'Failed to get teams' });
  }
});

// Получить детали команды
router.get('/:id', authenticate, async (req, res) => {
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

// Отправить приглашение в команду
router.post('/:teamId/invite', authenticate, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { 
      projectType, 
      rate, 
      startDate, 
      estimatedDuration, 
      estimatedDurationUnit, 
      coverLetter, 
      receiverId 
    } = req.body;

    // Проверяем авторизацию
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Получаем команду и проверяем права доступа
    const teamDoc = await db.collection('teams').doc(teamId).get();
    if (!teamDoc.exists) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const teamData = teamDoc.data();
    const userId = req.user.uid;
    const userRoles = req.user.roles || [];
    const isTeamPM = teamData.pmId === userId;
    const isAdmin = userRoles.includes('admin');

    if (!isAdmin && !isTeamPM) {
      return res.status(403).json({ error: 'Access denied. You can only send invitations from your own teams.' });
    }

    // Проверяем, что получатель существует
    const receiverDoc = await db.collection('users').doc(receiverId).get();
    if (!receiverDoc.exists) {
      return res.status(400).json({ error: 'Receiver not found' });
    }

    // Создаем приглашение
    const invitationData = {
      teamId,
      senderId: req.user.uid,
      receiverId,
      projectType: projectType || 'without_project',
      rate: rate || 'Договорная',
      startDate: startDate || null,
      estimatedDuration: estimatedDuration || null,
      estimatedDurationUnit: estimatedDurationUnit || 'months',
      coverLetter: coverLetter || 'Приглашение в команду',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const invitationRef = await db.collection('team_invitations').add(invitationData);

    res.json({
      success: true,
      invitationId: invitationRef.id,
      message: 'Приглашение отправлено успешно'
    });

  } catch (error) {
    console.error('Error sending team invitation:', error);
    res.status(500).json({ error: 'Internal server error' });
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

// Добавить участника в команду
router.post('/:teamId/members', authenticate, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { userId: newUserId, role } = req.body;

    console.log('=== ADDING MEMBER TO TEAM ===');
    console.log('Team ID:', teamId);
    console.log('New User ID:', newUserId);
    console.log('Role:', role);
    console.log('Request user:', req.user);

    // Проверяем авторизацию
    if (!req.user) {
      console.log('❌ No user in request');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('✅ User authenticated');

    // Получаем команду
    console.log('📋 Fetching team...');
    const teamDoc = await db.collection('teams').doc(teamId).get();
    if (!teamDoc.exists) {
      console.log('❌ Team not found');
      return res.status(404).json({ error: 'Team not found' });
    }

    const teamData = teamDoc.data();
    console.log('✅ Team found:', { 
      name: teamData.name, 
      pmId: teamData.pmId, 
      teamLead: teamData.teamLead,
      membersCount: (teamData.members || []).length
    });

    // Проверяем права (только PM команды, admin или team lead могут добавлять участников)
    const currentUserId = req.user.uid;
    const userRoles = req.user.roles || [];
    const isTeamPM = teamData.pmId === currentUserId;
    const isAdmin = userRoles.includes('admin');
    const isTeamLead = teamData.teamLead === currentUserId;
    
    console.log('🔐 Access check:', { 
      currentUserId, 
      isTeamPM, 
      isAdmin, 
      isTeamLead,
      userRoles 
    });
    
    if (!isAdmin && !isTeamPM && !isTeamLead) {
      console.log('❌ Access denied');
      return res.status(403).json({ error: 'Access denied. You can only add members to your own teams.' });
    }

    console.log('✅ Access granted');

    // Получаем данные пользователя
    console.log('👤 Fetching user data...');
    const userDoc = await db.collection('users').doc(newUserId).get();
    if (!userDoc.exists) {
      console.log('❌ User not found');
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    console.log('✅ User found:', { 
      displayName: userData.displayName, 
      email: userData.email,
      role: userData.role 
    });

    // Создаем объект участника
    const newMember = {
      id: newUserId,
      uid: newUserId,
      name: userData.displayName || userData.name || userData.fullName || 'Unknown',
      email: userData.email,
      role: role || userData.role || 'developer',
      rating: userData.rating || (8.0 + Math.random() * 2).toFixed(1),
      status: 'offline',
      lastSeen: 'недавно',
      addedAt: new Date()
    };

    // Добавляем avatar только если он существует
    if (userData.avatar || userData.photoURL) {
      newMember.avatar = userData.avatar || userData.photoURL;
    }

    console.log('👥 New member object:', newMember);

    // Добавляем участника в команду
    const currentMembers = teamData.members || teamData.teamMembers || [];
    console.log('📊 Current members count:', currentMembers.length);
    
    // Проверяем, не является ли пользователь уже участником
    const isAlreadyMember = currentMembers.some(member => 
      member.id === newUserId || member.uid === newUserId
    );

    if (isAlreadyMember) {
      console.log('❌ User is already a member');
      return res.status(400).json({ error: 'User is already a team member' });
    }

    const updatedMembers = [...currentMembers, newMember];
    console.log('📈 Updated members count:', updatedMembers.length);

    // Обновляем команду
    console.log('💾 Updating team in database...');
    const updateData = {
      members: updatedMembers,
      teamMembers: updatedMembers,
      updatedAt: new Date()
    };
    console.log('Update data:', updateData);

    await db.collection('teams').doc(teamId).update(updateData);

    console.log('✅ Team updated successfully');

    res.json({
      success: true,
      member: newMember,
      message: 'Участник добавлен в команду'
    });

  } catch (error) {
    console.error('❌ ERROR ADDING TEAM MEMBER:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error code:', error.code);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получить список пользователей для добавления в команду
router.get('/:teamId/available-users', authenticate, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { search } = req.query;

    // Проверяем авторизацию
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Получаем команду
    const teamDoc = await db.collection('teams').doc(teamId).get();
    if (!teamDoc.exists) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const teamData = teamDoc.data();
    const userId = req.user.uid;
    const userRoles = req.user.roles || [];

    // Проверяем права доступа к команде
    const isTeamPM = teamData.pmId === userId;
    const isAdmin = userRoles.includes('admin');
    const isTeamMember = (teamData.members || []).some(member => 
      member.id === userId || member.uid === userId
    );

    if (!isAdmin && !isTeamPM && !isTeamMember) {
      return res.status(403).json({ error: 'Access denied. You can only view users for your own teams.' });
    }

    const currentMembers = teamData.members || teamData.teamMembers || [];
    const currentMemberIds = currentMembers.map(member => member.id || member.uid);

    // Получаем всех пользователей
    let usersQuery = db.collection('users');
    
    if (search) {
      // Простой поиск по имени (в реальном приложении лучше использовать полнотекстовый поиск)
      usersQuery = usersQuery.where('displayName', '>=', search)
                            .where('displayName', '<=', search + '\uf8ff');
    }

    const usersSnapshot = await usersQuery.limit(50).get();
    
    const availableUsers = [];
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      const userId = doc.id;
      
      // Исключаем текущих участников команды
      if (!currentMemberIds.includes(userId)) {
        availableUsers.push({
          id: userId,
          uid: userId,
          name: userData.displayName || userData.name || userData.fullName || 'Unknown',
          email: userData.email,
          avatar: userData.avatar || userData.photoURL,
          role: userData.role || 'developer',
          specialization: userData.specialization || userData.profession,
          rating: userData.rating || (8.0 + Math.random() * 2).toFixed(1)
        });
      }
    });

    res.json(availableUsers);

  } catch (error) {
    console.error('Error fetching available users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 