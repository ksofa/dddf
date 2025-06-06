const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { authenticate } = require('../middleware/auth');
const multer = require('multer');

// Настройка multer для обработки файлов
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB лимит
  }
});

// Получить заявки в зависимости от роли пользователя
router.get('/', authenticate, async (req, res) => {
  try {
    // Отключаем кэширование для админов
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
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
    
    // Оптимизированная версия - без дополнительных запросов
    for (const doc of applicationsSnapshot.docs) {
      const appData = { id: doc.id, ...doc.data() };
      applications.push(appData);
    }
    
    console.log(`✅ Applications loaded: ${applications.length} items`);
    res.json(applications);
  } catch (error) {
    console.error('Error getting applications:', error);
    res.status(500).json({ error: 'Failed to get applications' });
  }
});

// Создать новую заявку (без авторизации - для клиентов)
router.post('/', upload.single('techSpecFile'), async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      projectTitle,
      projectDescription,
      techSpec,
      rate,
      startDate,
      estimatedDuration,
      coverLetter
    } = req.body;

    console.log('Received application data:', {
      fullName,
      email,
      phone,
      projectTitle,
      projectDescription,
      techSpec,
      rate,
      startDate,
      estimatedDuration,
      coverLetter,
      hasFile: !!req.file
    });

    // Валидация обязательных полей
    if (!fullName || !projectTitle) {
      return res.status(400).json({ 
        error: 'Missing required fields: fullName, projectTitle' 
      });
    }

    // Проверяем, что есть хотя бы один способ связи
    if (!email && !phone) {
      return res.status(400).json({ 
        error: 'At least one contact method required: email or phone' 
      });
    }

    // Создаем заявку
    const applicationData = {
      type: 'client_request',
      status: 'pending',
      fullName,
      email,
      phone: phone || '',
      projectTitle,
      projectDescription: projectDescription || '',
      techSpec: techSpec || '',
      rate: rate || 'Договорная',
      startDate: startDate || null,
      estimatedDuration: estimatedDuration || null,
      coverLetter: coverLetter || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Если есть файл, сохраняем информацию о нем
    if (req.file) {
      applicationData.techSpecFile = {
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        // В реальном проекте здесь бы сохранялся файл в облачное хранилище
        // Пока просто сохраняем метаданные
        uploadedAt: new Date()
      };
    }

    const applicationRef = await db.collection('applications').add(applicationData);
    
    console.log(`✅ New application created: ${applicationRef.id} from ${email}`);
    
    res.status(201).json({ 
      message: 'Application created successfully',
      applicationId: applicationRef.id
    });
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({ error: 'Failed to create application' });
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

// Одобрить заявку и создать проект (только для админа)
router.post('/:id/approve', authenticate, async (req, res) => {
  try {
    const applicationId = req.params.id;
    const userId = req.user.uid;
    const { pmId } = req.body;
    
    // Проверяем, что пользователь - админ
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists || !userDoc.data().roles.includes('admin')) {
      return res.status(403).json({ error: 'Only admin can approve applications' });
    }
    
    if (!pmId) {
      return res.status(400).json({ error: 'PM is required' });
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
    
    // Создаем проект на основе заявки
    const projectData = {
      title: applicationData.projectTitle || 'Новый проект',
      description: applicationData.projectDescription || '',
      status: 'active',
      pmId: pmId,
      manager: pmId,
      customerId: null,
      customerInfo: {
        fullName: applicationData.fullName,
        phone: applicationData.phone,
        email: applicationData.email
      },
      rate: applicationData.rate || 'Договорная',
      startDate: applicationData.startDate || null,
      estimatedDuration: applicationData.estimatedDuration || null,
      coverLetter: applicationData.coverLetter || '',
      team: [pmId],
      teamMembers: [pmId],
      techSpec: applicationData.techSpec || '',
      createdAt: new Date(),
      createdFrom: 'application',
      applicationId: applicationId
    };
    
    const projectRef = await db.collection('projects').add(projectData);
    
    // Создаем команду для проекта
    const teamData = {
      name: `Команда проекта: ${projectData.title}`,
      description: `Команда для проекта "${projectData.title}"`,
      projectId: projectRef.id,
      projectTitle: projectData.title,
      leaderId: pmId,
      memberIds: [pmId],
      members: [pmId],
      status: 'active',
      createdAt: new Date(),
      createdBy: userId,
      createdFrom: 'application'
    };
    
    const teamRef = await db.collection('teams').add(teamData);
    
    // Обновляем проект с ID команды
    await db.collection('projects').doc(projectRef.id).update({
      teamId: teamRef.id
    });
    
    // Обновляем заявку
    await db.collection('applications').doc(applicationId).update({
      status: 'approved',
      assignedTeamLead: pmId,
      projectId: projectRef.id,
      teamId: teamRef.id,
      approvedAt: new Date(),
      approvedBy: userId
    });
    
    // Создаем уведомление для PM
    await db.collection('users').doc(pmId).collection('notifications').add({
      type: 'project_assigned',
      title: 'Новый проект назначен',
      message: `Вам назначен проект: ${projectData.title}`,
      projectId: projectRef.id,
      teamId: teamRef.id,
      read: false,
      createdAt: new Date()
    });
    
    res.json({ 
      message: 'Application approved, project and team created',
      projectId: projectRef.id,
      teamId: teamRef.id
    });
  } catch (error) {
    console.error('Error approving application:', error);
    res.status(500).json({ error: 'Failed to approve application' });
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