const express = require('express');
const router = express.Router();
const { db, auth } = require('../config/firebase');
const { authenticate } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');

// Middleware для проверки ролей
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.roles) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    const hasRole = allowedRoles.some(role => req.user.roles.includes(role));
    if (!hasRole) {
      return res.status(403).json({ message: 'Недостаточно прав' });
    }
    
    next();
  };
};

// Настройка multer для загрузки файлов ТЗ
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/tech-specs';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'techspec-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Недопустимый тип файла'));
    }
  }
});

// ============ APPLICATIONS (ЗАЯВКИ) ============

// Создать заявку (без авторизации - для неавторизованных заказчиков)
router.post('/applications', upload.single('techSpecFile'), [
  body('fullName').notEmpty().trim(),
  body('phone').notEmpty().trim(),
  body('projectTitle').notEmpty().trim(),
  body('projectDescription').notEmpty().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('techSpec').optional().trim(), // ТЗ как текст
  body('rate').optional().trim(), // Ставка (например "Договорная")
  body('startDate').optional().isISO8601(), // Дата старта проекта
  body('estimatedDuration').optional().trim(), // Оценочное время реализации
  body('estimatedDurationUnit').optional().isIn(['days', 'weeks', 'months']), // Единица времени
  body('coverLetter').optional().trim() // Сопроводительное письмо
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const applicationData = {
      fullName: req.body.fullName,
      phone: req.body.phone,
      projectTitle: req.body.projectTitle,
      projectDescription: req.body.projectDescription,
      email: req.body.email || '',
      techSpec: req.body.techSpec || '',
      rate: req.body.rate || 'Договорная', // Ставка
      startDate: req.body.startDate ? new Date(req.body.startDate) : null, // Дата старта проекта
      estimatedDuration: req.body.estimatedDuration ? parseInt(req.body.estimatedDuration) : null, // Время реализации
      estimatedDurationUnit: req.body.estimatedDurationUnit || 'months', // Единица времени
      coverLetter: req.body.coverLetter || '', // Сопроводительное письмо
      techSpecFile: req.file ? {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype,
        uploadedAt: new Date()
      } : null,
      type: 'client_request',
      status: 'pending',
      createdAt: new Date(),
      assignedPM: null, // Назначенный проект-менеджер
      assignedTeamLead: null, // Устаревшее поле для совместимости
      teamMembers: []
    };

    const applicationRef = await db.collection('applications').add(applicationData);

    res.status(201).json({
      message: 'Заявка на проект успешно отправлена',
      applicationId: applicationRef.id,
      data: {
        id: applicationRef.id,
        ...applicationData
      }
    });
  } catch (error) {
    console.error('Create application error:', error);
    res.status(500).json({ message: 'Ошибка при создании заявки' });
  }
});

// Получить все заявки (для админов)
router.get('/applications', authenticate, async (req, res) => {
  try {
    // Проверяем права доступа
    if (!req.user.roles || !req.user.roles.includes('admin')) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    const { status, limit = 50 } = req.query;
    
    let query = db.collection('applications').orderBy('createdAt', 'desc');
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    query = query.limit(parseInt(limit));

    const applicationsSnapshot = await query.get();
    const applications = [];

    applicationsSnapshot.forEach(doc => {
      applications.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json(applications);
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ message: 'Ошибка при получении заявок' });
  }
});

// Одобрить заявку и создать проект
router.post('/applications/:applicationId/approve', authenticate, [
  body('pmId').optional().isString()
], async (req, res) => {
  try {
    // Проверяем права доступа
    if (!req.user.roles || !req.user.roles.includes('admin')) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    const { applicationId } = req.params;
    const { pmId } = req.body;

    // Проверка обязательности PM
    if (!pmId) {
      return res.status(400).json({ message: 'Не выбран проект-менеджер' });
    }

    const applicationDoc = await db.collection('applications').doc(applicationId).get();
    if (!applicationDoc.exists) {
      return res.status(404).json({ message: 'Заявка не найдена' });
    }

    const applicationData = applicationDoc.data();

    // Проверяем, что PM существует и имеет правильную роль
    const pmDoc = await db.collection('users').doc(pmId).get();
    if (!pmDoc.exists) {
      return res.status(404).json({ message: 'Проект-менеджер не найден' });
    }
    
    const pmData = pmDoc.data();
    if (!pmData.roles || !pmData.roles.includes('pm')) {
      return res.status(400).json({ message: 'Пользователь не является проект-менеджером' });
    }

    // Создаем проект на основе заявки
    // Обрабатываем customerInfo с проверкой на undefined значения
    const customerInfo = {};
    if (applicationData.fullName !== undefined) {
      customerInfo.fullName = applicationData.fullName;
    }
    if (applicationData.phone !== undefined) {
      customerInfo.phone = applicationData.phone;
    }
    if (applicationData.email !== undefined) {
      customerInfo.email = applicationData.email;
    }

    const projectData = {
      title: applicationData.projectTitle,
      description: applicationData.projectDescription,
      status: 'active',
      pmId: pmId,
      manager: pmId,
      customerId: null,
      customerInfo: Object.keys(customerInfo).length > 0 ? customerInfo : null,
      rate: applicationData.rate || 'Договорная',
      startDate: applicationData.startDate || null,
      estimatedDuration: applicationData.estimatedDuration || null,
      estimatedDurationUnit: applicationData.estimatedDurationUnit || 'months',
      coverLetter: applicationData.coverLetter || '',
      team: [pmId],
      teamMembers: [pmId],
      techSpec: applicationData.techSpec || '',
      techSpecFile: applicationData.techSpecFile || null,
      createdAt: new Date(),
      createdFrom: 'application',
      applicationId: applicationId
    };

    const projectRef = await db.collection('projects').add(projectData);

    // Обновляем статус заявки
    await db.collection('applications').doc(applicationId).update({
      status: 'approved',
      approvedAt: new Date(),
      approvedBy: req.user.uid,
      projectId: projectRef.id,
      assignedPM: pmId,
      assignedTeamLead: pmId
    });

    // Создаем уведомление для PM
    await db.collection('users').doc(pmId).collection('notifications').add({
      type: 'project_assigned',
      title: 'Новый проект назначен',
      message: `Вам назначен проект: ${projectData.title}`,
      projectId: projectRef.id,
      read: false,
      createdAt: new Date()
    });

    res.json({
      message: 'Заявка одобрена и проект создан',
      projectId: projectRef.id,
      applicationId: applicationId
    });
  } catch (error) {
    console.error('Approve application error:', error);
    res.status(500).json({ message: 'Ошибка при одобрении заявки' });
  }
});

// Назначить PM для заявки (только для админа)
router.post('/applications/:applicationId/assign-pm', authenticate, [
  body('pmId').notEmpty().isString()
], async (req, res) => {
  try {
    // Проверяем права доступа
    if (!req.user.roles || !req.user.roles.includes('admin')) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    const { applicationId } = req.params;
    const { pmId } = req.body;

    const applicationDoc = await db.collection('applications').doc(applicationId).get();
    if (!applicationDoc.exists) {
      return res.status(404).json({ message: 'Заявка не найдена' });
    }

    // Проверяем, что PM существует и имеет правильную роль
    const pmDoc = await db.collection('users').doc(pmId).get();
    if (!pmDoc.exists) {
      return res.status(404).json({ message: 'Проект-менеджер не найден' });
    }
    
    const pmData = pmDoc.data();
    if (!pmData.roles || !pmData.roles.includes('pm')) {
      return res.status(400).json({ message: 'Пользователь не является проект-менеджером' });
    }

    // Обновляем заявку
    await db.collection('applications').doc(applicationId).update({
      assignedPM: pmId,
      assignedTeamLead: pmId,
      updatedAt: new Date()
    });

    res.json({ message: 'Проект-менеджер назначен успешно' });
  } catch (error) {
    console.error('Assign PM error:', error);
    res.status(500).json({ message: 'Ошибка при назначении проект-менеджера' });
  }
});

// Отклонить заявку
router.post('/applications/:applicationId/reject', authenticate, [
  body('reason').optional().trim()
], async (req, res) => {
  try {
    // Проверяем права доступа
    if (!req.user.roles || !req.user.roles.includes('admin')) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    const { applicationId } = req.params;
    const { reason } = req.body;

    const applicationDoc = await db.collection('applications').doc(applicationId).get();
    if (!applicationDoc.exists) {
      return res.status(404).json({ message: 'Заявка не найдена' });
    }

    await db.collection('applications').doc(applicationId).update({
      status: 'rejected',
      rejectedAt: new Date(),
      rejectedBy: req.user.uid,
      rejectionReason: reason
    });

    res.json({ message: 'Заявка отклонена' });
  } catch (error) {
    console.error('Reject application error:', error);
    res.status(500).json({ message: 'Ошибка при отклонении заявки' });
  }
});

// Скачать файл технического задания из заявки
router.get('/applications/:applicationId/tech-spec-file', authenticate, async (req, res) => {
  try {
    // Проверяем права доступа (только админы)
    if (!req.user.roles || !req.user.roles.includes('admin')) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    const { applicationId } = req.params;

    // Получаем заявку
    const applicationDoc = await db.collection('applications').doc(applicationId).get();
    if (!applicationDoc.exists) {
      return res.status(404).json({ message: 'Заявка не найдена' });
    }

    const applicationData = applicationDoc.data();

    // Проверяем наличие файла
    if (!applicationData.techSpecFile) {
      return res.status(404).json({ message: 'К заявке не прикреплен файл технического задания' });
    }

    const filePath = applicationData.techSpecFile.path;
    const fs = require('fs');

    // Проверяем существование файла на диске
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Файл не найден на сервере' });
    }

    // Устанавливаем заголовки для скачивания
    res.setHeader('Content-Disposition', `attachment; filename="${applicationData.techSpecFile.originalName}"`);
    res.setHeader('Content-Type', applicationData.techSpecFile.mimetype);

    // Отправляем файл
    const path = require('path');
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    console.error('Download application tech spec file error:', error);
    res.status(500).json({ message: 'Ошибка при скачивании файла' });
  }
});

// ============ PROJECTS ============

// Получить все проекты (без авторизации)
router.get('/public/projects', async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;

    let query = db.collection('projects');

    // Без авторизации возвращаем все проекты
    query = query.orderBy('createdAt', 'desc').limit(parseInt(limit));

    const projectsSnapshot = await query.get();
    const projects = [];

    for (const doc of projectsSnapshot.docs) {
      const projectData = doc.data();
      
      // Получаем информацию о тимлиде
      let teamLeadInfo = null;
      if (projectData.teamLead) {
        const teamLeadDoc = await db.collection('users').doc(projectData.teamLead).get();
        if (teamLeadDoc.exists) {
          const teamLeadData = teamLeadDoc.data();
          teamLeadInfo = {
            id: teamLeadDoc.id,
            displayName: teamLeadData.fullName || teamLeadData.displayName,
            email: teamLeadData.email
          };
        }
      }

      projects.push({
        id: doc.id,
        ...projectData,
        teamLeadInfo
      });
    }

    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Ошибка при получении проектов' });
  }
});

// Получить проекты (с авторизацией)
router.get('/projects', authenticate, async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;

    let query = db.collection('projects');

    // Фильтрация по ролям
    if (req.user.roles && req.user.roles.includes('admin')) {
      // Админы видят все проекты
    } else if (req.user.roles && (req.user.roles.includes('project_manager') || req.user.roles.includes('pm'))) {
      // PM видят свои проекты
      query = query.where('manager', '==', req.user.uid);
    } else {
      // Обычные пользователи видят проекты где они участники
      query = query.where('teamMembers', 'array-contains', req.user.uid);
    }

    if (status) {
      query = query.where('status', 'array-contains', status);
    }

    // Добавляем сортировку только если нет фильтрации по пользователю (чтобы избежать проблем с индексами)
    if (req.user.roles && req.user.roles.includes('admin')) {
      query = query.orderBy('createdAt', 'desc');
    }
    
    query = query.limit(parseInt(limit));

    const projectsSnapshot = await query.get();
    const projects = [];

    for (const doc of projectsSnapshot.docs) {
      const projectData = doc.data();
      
      // Получаем информацию о тимлиде
      let teamLeadInfo = null;
      if (projectData.teamLead) {
        const teamLeadDoc = await db.collection('users').doc(projectData.teamLead).get();
        if (teamLeadDoc.exists) {
          const teamLeadData = teamLeadDoc.data();
          teamLeadInfo = {
            id: teamLeadDoc.id,
            displayName: teamLeadData.fullName || teamLeadData.displayName,
            email: teamLeadData.email
          };
        }
      }

      projects.push({
        id: doc.id,
        ...projectData,
        teamLeadInfo
      });
    }

    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Ошибка при получении проектов' });
  }
});

// Получить конкретный проект
router.get('/projects/:projectId', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;

    // Получаем проект
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ message: 'Проект не найден' });
    }

    const projectData = projectDoc.data();

    // Проверяем доступ к проекту
    const hasAccess = req.user.roles && req.user.roles.includes('admin') ||
                     projectData.manager === req.user.uid ||
                     (projectData.teamMembers && projectData.teamMembers.includes(req.user.uid));

    if (!hasAccess) {
      return res.status(403).json({ message: 'Доступ к проекту запрещен' });
    }

    // Получаем информацию о тимлиде
    let teamLeadInfo = null;
    if (projectData.teamLead) {
      const teamLeadDoc = await db.collection('users').doc(projectData.teamLead).get();
      if (teamLeadDoc.exists) {
        const teamLeadData = teamLeadDoc.data();
        teamLeadInfo = {
          id: teamLeadDoc.id,
          displayName: teamLeadData.fullName || teamLeadData.displayName,
          email: teamLeadData.email
        };
      }
    }

    res.json({
      id: projectDoc.id,
      ...projectData,
      teamLeadInfo
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Ошибка при получении проекта' });
  }
});

// Создать проект
router.post('/projects', authenticate, [
  body('title').notEmpty().trim(),
  body('description').notEmpty().trim(),
  body('customerId').notEmpty().trim(),
  body('status').optional().isString(),
  body('team').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Проверяем права создания проектов
    if (!req.user.roles || (!req.user.roles.includes('admin') && !req.user.roles.includes('project_manager'))) {
      return res.status(403).json({ message: 'Недостаточно прав для создания проекта' });
    }

    const projectData = {
      title: req.body.title,
      description: req.body.description,
      status: req.body.status ? [req.body.status] : ['draft'],
      manager: req.user.uid,
      client: req.body.customerId, // ФИО клиента
      customerId: req.user.uid,
      team: req.body.team || [],
      teamMembers: req.body.team || [],
      createdAt: new Date(),
      createdBy: req.user.uid
    };

    const projectRef = await db.collection('projects').add(projectData);

    res.status(201).json({
      message: 'Проект создан успешно',
      projectId: projectRef.id,
      data: {
        id: projectRef.id,
        ...projectData
      }
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Ошибка при создании проекта' });
  }
});

// Назначить проект-менеджера на проект
router.post('/projects/:projectId/assign-pm', authenticate, checkRole(['admin']), [
  body('projectManagerId').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { projectId } = req.params;
    const { projectManagerId } = req.body;

    // Проверяем что проект существует
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ message: 'Проект не найден' });
    }

    // Проверяем что пользователь существует и имеет роль project_manager
    const userDoc = await db.collection('users').doc(projectManagerId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const userData = userDoc.data();
    if (!userData.roles || !userData.roles.includes('project_manager')) {
      return res.status(400).json({ message: 'Пользователь не является проект-менеджером' });
    }

    // Обновляем проект
    await db.collection('projects').doc(projectId).update({
      manager: projectManagerId,
      assignedPM: projectManagerId,
      assignedPMName: userData.displayName || userData.fullName,
      status: ['assigned'], // Меняем статус на "назначен PM"
      updatedAt: new Date(),
      updatedBy: req.user.uid
    });

    res.json({
      message: 'Проект-менеджер назначен успешно',
      projectId,
      assignedPM: {
        id: projectManagerId,
        name: userData.displayName || userData.fullName,
        email: userData.email
      }
    });
  } catch (error) {
    console.error('Assign PM error:', error);
    res.status(500).json({ message: 'Ошибка при назначении проект-менеджера' });
  }
});

// Добавить исполнителя в команду проекта
router.post('/projects/:projectId/add-executor', authenticate, [
  body('executorId').notEmpty().trim()
], async (req, res) => {
  try {
    console.log('=== ADD EXECUTOR DEBUG ===');
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);
    console.log('User:', req.user);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { projectId } = req.params;
    const { executorId } = req.body;

    console.log('Looking for project:', projectId);
    // Проверяем что проект существует
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      console.log('Project not found');
      return res.status(404).json({ message: 'Проект не найден' });
    }

    const projectData = projectDoc.data();
    console.log('Project data:', { 
      title: projectData.title, 
      manager: projectData.manager, 
      teamMembers: projectData.teamMembers 
    });

    // Проверяем права доступа - только PM проекта или админ
    const hasAccess = req.user.roles && req.user.roles.includes('admin') ||
                     projectData.manager === req.user.uid;

    console.log('Access check:', { 
      userRoles: req.user.roles, 
      isAdmin: req.user.roles && req.user.roles.includes('admin'),
      projectManager: projectData.manager,
      currentUser: req.user.uid,
      hasAccess 
    });

    if (!hasAccess) {
      console.log('Access denied');
      return res.status(403).json({ message: 'Недостаточно прав для добавления исполнителей' });
    }

    console.log('Looking for executor:', executorId);
    // Проверяем что пользователь существует и имеет роль executor
    const userDoc = await db.collection('users').doc(executorId).get();
    if (!userDoc.exists) {
      console.log('Executor not found');
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const userData = userDoc.data();
    console.log('Executor data:', { 
      email: userData.email, 
      roles: userData.roles, 
      hasExecutorRole: userData.roles && userData.roles.includes('executor') 
    });

    if (!userData.roles || !userData.roles.includes('executor')) {
      console.log('User is not an executor');
      return res.status(400).json({ message: 'Пользователь не является исполнителем' });
    }

    // Проверяем что исполнитель еще не в команде
    const currentTeamMembers = projectData.teamMembers || [];
    console.log('Current team members:', currentTeamMembers);
    console.log('Checking if executor already in team:', currentTeamMembers.includes(executorId));

    if (currentTeamMembers.includes(executorId)) {
      console.log('Executor already in team');
      return res.status(400).json({ message: 'Исполнитель уже в команде проекта' });
    }

    // Добавляем исполнителя в команду
    const updatedTeamMembers = [...currentTeamMembers, executorId];
    console.log('Updated team members:', updatedTeamMembers);

    await db.collection('projects').doc(projectId).update({
      teamMembers: updatedTeamMembers,
      team: updatedTeamMembers, // Для совместимости
      updatedAt: new Date(),
      updatedBy: req.user.uid
    });

    // Создаем уведомление для исполнителя
    await db.collection('users').doc(executorId).collection('notifications').add({
      type: 'added_to_project',
      title: 'Добавлен в проект',
      message: `Вы добавлены в команду проекта: ${projectData.title}`,
      projectId,
      read: false,
      createdAt: new Date()
    });

    console.log('Executor added successfully');
    res.json({
      message: 'Исполнитель добавлен в команду проекта',
      projectId,
      executor: {
        id: executorId,
        name: userData.displayName || userData.fullName,
        email: userData.email
      }
    });
  } catch (error) {
    console.error('Add executor error:', error);
    res.status(500).json({ message: 'Ошибка при добавлении исполнителя' });
  }
});

// Удалить исполнителя из команды проекта
router.post('/projects/:projectId/remove-executor', authenticate, [
  body('executorId').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { projectId } = req.params;
    const { executorId } = req.body;

    // Проверяем что проект существует
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ message: 'Проект не найден' });
    }

    const projectData = projectDoc.data();

    // Проверяем права доступа - только PM проекта или админ
    const hasAccess = req.user.roles && req.user.roles.includes('admin') ||
                     projectData.manager === req.user.uid;

    if (!hasAccess) {
      return res.status(403).json({ message: 'Недостаточно прав для удаления исполнителей' });
    }

    // Проверяем что исполнитель в команде
    const currentTeamMembers = projectData.teamMembers || [];
    if (!currentTeamMembers.includes(executorId)) {
      return res.status(400).json({ message: 'Исполнитель не найден в команде проекта' });
    }

    // Удаляем исполнителя из команды
    const updatedTeamMembers = currentTeamMembers.filter(id => id !== executorId);
    await db.collection('projects').doc(projectId).update({
      teamMembers: updatedTeamMembers,
      team: updatedTeamMembers, // Для совместимости
      updatedAt: new Date(),
      updatedBy: req.user.uid
    });

    res.json({
      message: 'Исполнитель удален из команды проекта',
      projectId,
      executorId
    });
  } catch (error) {
    console.error('Remove executor error:', error);
    res.status(500).json({ message: 'Ошибка при удалении исполнителя' });
  }
});

// ============ AUTH ============

// Регистрация пользователя
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('displayName').notEmpty().trim(),
  body('roles').optional().isArray(),
  body('categories').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, displayName, roles = ['customer'], categories = [] } = req.body;

    // Создаем пользователя в Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName
    });

    // Создаем документ пользователя в Firestore
    const userData = {
      fullName: displayName,
      displayName,
      name: displayName,
      email,
      role: roles[0], // Основная роль
      roles,
      categories,
      createdAt: new Date(),
      profileImage: null,
      contactInfo: {}
    };

    await db.collection('users').doc(userRecord.uid).set(userData);

    // Создаем кастомный токен
    const customToken = await auth.createCustomToken(userRecord.uid);

    res.status(201).json({
      message: 'Пользователь зарегистрирован успешно',
      token: customToken,
      uid: userRecord.uid,
      user: {
        uid: userRecord.uid,
        email,
        name: displayName,
        displayName,
        role: roles[0],
        roles,
        categories
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
    }
    res.status(500).json({ message: 'Ошибка при регистрации пользователя' });
  }
});

// Вход пользователя (создание кастомного токена)
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Получаем пользователя по email
    const userRecord = await auth.getUserByEmail(email);
    
    // Получаем данные пользователя из Firestore
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'Данные пользователя не найдены' });
    }

    const userData = userDoc.data();

    // Создаем кастомный токен
    const customToken = await auth.createCustomToken(userRecord.uid);

    res.json({
      message: 'Вход выполнен успешно',
      token: customToken,
      uid: userRecord.uid,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        name: userData.displayName || userData.fullName,
        displayName: userData.displayName || userData.fullName,
        role: userData.role || userData.roles?.[0] || 'customer',
        roles: userData.roles || [userData.role || 'customer'],
        categories: userData.categories || []
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    if (error.code === 'auth/user-not-found') {
      return res.status(401).json({ message: 'Пользователь не найден' });
    }
    res.status(401).json({ message: 'Неверные учетные данные' });
  }
});

// ============ ADMIN - УПРАВЛЕНИЕ РОЛЯМИ ============

// Получить всех пользователей (для админов и PM)
router.get('/users', authenticate, async (req, res) => {
  try {
    // Проверяем права доступа - админы и PM могут получать список пользователей
    if (!req.user.roles || !(req.user.roles.includes('admin') || req.user.roles.includes('project_manager') || req.user.roles.includes('pm'))) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    const { limit = 100, role } = req.query;
    
    const usersSnapshot = await db.collection('users')
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit))
      .get();

    const users = [];
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      const userRoles = userData.roles || [userData.role || 'customer'];
      
      // Фильтрация по роли если указана
      if (role && !userRoles.includes(role)) {
        return;
      }
      
      users.push({
        id: doc.id,
        uid: doc.id,
        email: userData.email,
        name: userData.displayName || userData.fullName,
        displayName: userData.displayName || userData.fullName,
        role: userData.role || userData.roles?.[0] || 'customer',
        roles: userRoles,
        specialization: userData.specialization || 'Не указана',
        categories: userData.categories || [],
        createdAt: userData.createdAt
      });
    });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Ошибка при получении пользователей' });
  }
});

// Обновить роли пользователя (для админов)
router.put('/users/:userId/roles', authenticate, [
  body('roles').isArray().notEmpty(),
  body('role').optional().isString()
], async (req, res) => {
  try {
    // Проверяем права доступа
    if (!req.user.roles || !req.user.roles.includes('admin')) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const { roles, role } = req.body;

    // Проверяем валидность ролей
    const validRoles = ['admin', 'customer', 'project_manager', 'executor'];
    const invalidRoles = roles.filter(r => !validRoles.includes(r));
    if (invalidRoles.length > 0) {
      return res.status(400).json({ 
        message: `Недопустимые роли: ${invalidRoles.join(', ')}. Доступные роли: ${validRoles.join(', ')}` 
      });
    }

    // Обновляем роли пользователя
    const updateData = {
      roles,
      role: role || roles[0], // Основная роль
      updatedAt: new Date()
    };

    await db.collection('users').doc(userId).update(updateData);

    res.json({
      message: 'Роли пользователя обновлены успешно',
      userId,
      roles,
      role: role || roles[0]
    });
  } catch (error) {
    console.error('Update user roles error:', error);
    res.status(500).json({ message: 'Ошибка при обновлении ролей пользователя' });
  }
});

// ============ PROJECT MANAGERS ============

// Получить всех проект-менеджеров (для админов)
router.get('/project-managers', authenticate, async (req, res) => {
  try {
    console.log('Getting project managers for user:', req.user.uid, 'roles:', req.user.roles);
    
    // Проверяем права доступа
    if (!req.user.roles || !req.user.roles.includes('admin')) {
      console.log('Access denied - user is not admin');
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    const { limit = 100 } = req.query;
    
    console.log('Querying all users and filtering for project_manager role...');
    // Получаем всех пользователей и фильтруем на стороне приложения
    const usersSnapshot = await db.collection('users').limit(parseInt(limit)).get();
    console.log('Found total users:', usersSnapshot.size);

    const projectManagers = [];
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      // Фильтруем только тех, у кого есть роль project_manager
      if (userData.roles && userData.roles.includes('project_manager')) {
        console.log('Processing PM:', userData.email, 'roles:', userData.roles);
        projectManagers.push({
          id: doc.id,
          uid: doc.id,
          email: userData.email,
          name: userData.displayName || userData.fullName,
          displayName: userData.displayName || userData.fullName,
          fullName: userData.fullName || userData.displayName,
          specialization: userData.specialization || 'Общая разработка',
          categories: userData.categories || [],
          experience: userData.experience || 'Middle',
          availability: userData.availability || 'available',
          workload: userData.workload || 0,
          projectsCount: userData.projectsCount || 0,
          completedProjects: userData.completedProjects || 0,
          contactInfo: userData.contactInfo || {},
          profileImage: userData.profileImage,
          createdAt: userData.createdAt
        });
      }
    });

    // Сортируем на стороне приложения
    projectManagers.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return b.createdAt.toDate() - a.createdAt.toDate();
      }
      return 0;
    });

    console.log('Returning', projectManagers.length, 'project managers');
    res.json(projectManagers);
  } catch (error) {
    console.error('Get project managers error:', error);
    res.status(500).json({ message: 'Ошибка при получении проект-менеджеров' });
  }
});

// ============ TEAMS ============

// Получить все команды (проекты) где пользователь участвует
router.get('/teams', authenticate, async (req, res) => {
  try {
    const userId = req.user.uid;
    const userRoles = req.user.roles || [];
    
    console.log(`Getting teams for user ${userId} with roles:`, userRoles);
    
    let projects = [];
    
    // Если PM - получаем его проекты (используем manager вместо pmId)
    if (userRoles.includes('pm') || userRoles.includes('project_manager')) {
      try {
        const pmProjectsSnapshot = await db.collection('projects')
          .where('manager', '==', userId)
          .get();
        
        console.log(`Found ${pmProjectsSnapshot.size} PM projects`);
        
        pmProjectsSnapshot.docs.forEach(doc => {
          projects.push({
            id: doc.id,
            ...doc.data(),
            role: 'pm'
          });
        });
      } catch (error) {
        console.log('Error getting PM projects:', error.message);
        // Продолжаем выполнение, не прерываем
      }
    }
    
    // Получаем проекты где пользователь участник
    try {
      const memberProjectsSnapshot = await db.collection('projects')
        .where('teamMembers', 'array-contains', userId)
        .get();
      
      console.log(`Found ${memberProjectsSnapshot.size} member projects`);
      
      memberProjectsSnapshot.docs.forEach(doc => {
        // Избегаем дублирования если уже добавлен как PM
        if (!projects.find(p => p.id === doc.id)) {
          projects.push({
            id: doc.id,
            ...doc.data(),
            role: 'member'
          });
        }
      });
    } catch (error) {
      console.log('Error getting member projects:', error.message);
      // Продолжаем выполнение
    }
    
    console.log(`Total projects found: ${projects.length}`);
    res.json(projects);
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ error: 'Failed to get teams' });
  }
});

// Получить команду конкретного проекта
router.get('/projects/:projectId/team', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.uid;
    
    console.log(`Getting team for project ${projectId} by user ${userId}`);
    
    // Получаем проект
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      console.log('Project not found');
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const project = projectDoc.data();
    console.log('Project data:', {
      title: project.title,
      pmId: project.pmId,
      manager: project.manager,
      teamMembers: project.teamMembers
    });
    
    // Проверяем доступ (PM или участник)
    // Используем pmId как основное поле для PM, manager как fallback
    const projectManagerId = project.pmId || project.manager;
    const hasAccess = projectManagerId === userId || 
                     (project.teamMembers && project.teamMembers.includes(userId));
    
    console.log('Access check:', { 
      hasAccess, 
      isManager: projectManagerId === userId,
      pmId: project.pmId,
      manager: project.manager,
      userId 
    });
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Собираем всех участников команды
    const teamMemberIds = [
      projectManagerId, // PM
      ...(project.teamMembers && Array.isArray(project.teamMembers) 
          ? project.teamMembers.map(member => typeof member === 'string' ? member : member.id)
          : []), // Участники
      ...(project.teamLead ? [project.teamLead] : []) // Team Lead
    ].filter((id, index, arr) => id && arr.indexOf(id) === index); // убираем дубли
    
    console.log('Team member IDs:', teamMemberIds);
    
    // Получаем данные участников
    const teamMembers = [];
    for (const memberId of teamMemberIds) {
      try {
        const memberDoc = await db.collection('users').doc(memberId).get();
        if (memberDoc.exists) {
          const memberData = memberDoc.data();
          teamMembers.push({
            id: memberId,
            name: memberData.name || memberData.displayName || memberData.fullName || 'Unknown',
            email: memberData.email,
            roles: memberData.roles || [],
            avatar: memberData.avatar || memberData.photoURL || memberData.profileImage,
            role: memberId === projectManagerId ? 'pm' : 
                  memberId === project.teamLead ? 'lead' : 'member'
          });
        }
      } catch (error) {
        console.error(`Error getting user ${memberId}:`, error);
      }
    }
    
    console.log(`Found ${teamMembers.length} team members`);
    
    res.json({
      projectId,
      projectTitle: project.title,
      teamMembers,
      canManage: projectManagerId === userId // PM может управлять
    });
  } catch (error) {
    console.error('Get project team error:', error);
    res.status(500).json({ error: 'Failed to get project team' });
  }
});

// Поиск исполнителей для приглашения
router.get('/executors/search', authenticate, async (req, res) => {
  try {
    const { q = '', limit = 20 } = req.query;
    
    // Только PM и админы могут искать исполнителей
    if (!req.user.roles || !(req.user.roles.includes('pm') || req.user.roles.includes('project_manager') || req.user.roles.includes('admin'))) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Получаем всех исполнителей
    const usersSnapshot = await db.collection('users')
      .where('roles', 'array-contains', 'executor')
      .limit(parseInt(limit))
      .get();
    
    const executors = [];
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      const name = userData.name || userData.displayName || userData.fullName || '';
      const email = userData.email || '';
      
      // Фильтруем по поисковому запросу
      if (!q || name.toLowerCase().includes(q.toLowerCase()) || email.toLowerCase().includes(q.toLowerCase())) {
        executors.push({
          id: doc.id,
          name,
          email,
          specialization: userData.specialization || 'Не указана',
          avatar: userData.avatar || userData.photoURL || userData.profileImage
        });
      }
    });
    
    res.json(executors);
  } catch (error) {
    console.error('Search executors error:', error);
    res.status(500).json({ error: 'Failed to search executors' });
  }
});

// Отправить приглашение исполнителю
router.post('/projects/:projectId/invite', authenticate, [
  body('executorId').notEmpty().trim(),
  body('message').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { projectId } = req.params;
    const { executorId, message } = req.body;
    const userId = req.user.uid;

    // Получаем проект
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projectDoc.data();

    // Проверяем права (только PM проекта)
    // Используем pmId как основное поле для PM, manager как fallback
    const projectManagerId = project.pmId || project.manager;
    if (projectManagerId !== userId) {
      return res.status(403).json({ error: 'Only project manager can send invitations' });
    }

    // Проверяем что исполнитель существует
    const executorDoc = await db.collection('users').doc(executorId).get();
    if (!executorDoc.exists) {
      return res.status(404).json({ error: 'Executor not found' });
    }

    const executorData = executorDoc.data();
    if (!executorData.roles || !executorData.roles.includes('executor')) {
      return res.status(400).json({ error: 'User is not an executor' });
    }

    // Проверяем что исполнитель не в команде
    const teamMemberIds = project.teamMembers && Array.isArray(project.teamMembers) 
      ? project.teamMembers.map(member => typeof member === 'string' ? member : member.id)
      : [];
    
    if (teamMemberIds.includes(executorId)) {
      return res.status(400).json({ error: 'Executor is already in the team' });
    }

    // Создаем приглашение (без сложных индексов)
    const invitationData = {
      projectId,
      projectTitle: project.title,
      executorId,
      executorName: executorData.name || executorData.displayName || executorData.fullName,
      executorEmail: executorData.email,
      senderId: userId,
      senderName: req.user.displayName || req.user.email,
      message: message || `Приглашаем вас в проект "${project.title}"`,
      status: 'pending',
      createdAt: new Date()
    };

    const invitationRef = await db.collection('invitations').add(invitationData);

    // Уведомление исполнителю
    await db.collection('users').doc(executorId).collection('notifications').add({
      type: 'project_invitation',
      title: 'Приглашение в проект',
      message: `Вас приглашают в проект: ${project.title}`,
      projectId,
      invitationId: invitationRef.id,
      read: false,
      createdAt: new Date()
    });

    res.json({
      message: 'Invitation sent successfully',
      invitationId: invitationRef.id
    });
  } catch (error) {
    console.error('Send invitation error:', error);
    res.status(500).json({ error: 'Failed to send invitation' });
  }
});

// ============ INVITATIONS ============

// Получить приглашения для текущего исполнителя
router.get('/my-invitations', authenticate, async (req, res) => {
  try {
    const userId = req.user.uid;
    const userRoles = req.user.roles || [];
    
    console.log(`Getting invitations for user ${userId} with roles:`, userRoles);
    
    // Только исполнители могут получать приглашения
    if (!userRoles.includes('executor')) {
      return res.status(403).json({ error: 'Access denied. Only executors can view invitations.' });
    }
    
    // Получаем приглашения для данного исполнителя (без orderBy чтобы избежать проблем с индексами)
    const invitationsSnapshot = await db.collection('invitations')
      .where('executorId', '==', userId)
      .where('status', '==', 'pending')
      .get();
    
    const invitations = [];
    
    for (const doc of invitationsSnapshot.docs) {
      const invitationData = doc.data();
      
      // Получаем информацию о проекте
      const projectDoc = await db.collection('projects').doc(invitationData.projectId).get();
      const projectData = projectDoc.exists ? projectDoc.data() : null;
      
      // Получаем информацию об отправителе
      const senderDoc = await db.collection('users').doc(invitationData.senderId).get();
      const senderData = senderDoc.exists ? senderDoc.data() : null;
      
      invitations.push({
        id: doc.id,
        projectId: invitationData.projectId,
        projectTitle: projectData?.title || 'Неизвестный проект',
        senderName: senderData?.displayName || senderData?.name || 'Неизвестный отправитель',
        message: invitationData.message || '',
        status: invitationData.status,
        createdAt: invitationData.createdAt
      });
    }
    
    // Сортируем на стороне приложения
    invitations.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return b.createdAt.toDate() - a.createdAt.toDate();
      }
      return 0;
    });
    
    console.log(`Found ${invitations.length} invitations for user ${userId}`);
    res.json(invitations);
    
  } catch (error) {
    console.error('Error getting invitations:', error);
    res.status(500).json({ error: 'Failed to get invitations' });
  }
});

// Принять приглашение
router.post('/invitations/:invitationId/accept', authenticate, async (req, res) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user.uid;
    const userRoles = req.user.roles || [];
    
    console.log(`User ${userId} accepting invitation ${invitationId}`);
    
    // Только исполнители могут принимать приглашения
    if (!userRoles.includes('executor')) {
      return res.status(403).json({ error: 'Access denied. Only executors can accept invitations.' });
    }
    
    // Получаем приглашение
    const invitationDoc = await db.collection('invitations').doc(invitationId).get();
    if (!invitationDoc.exists) {
      return res.status(404).json({ error: 'Invitation not found' });
    }
    
    const invitationData = invitationDoc.data();
    
    // Проверяем, что приглашение адресовано этому пользователю
    if (invitationData.executorId !== userId) {
      return res.status(403).json({ error: 'This invitation is not for you' });
    }
    
    // Проверяем статус приглашения
    if (invitationData.status !== 'pending') {
      return res.status(400).json({ error: 'Invitation is no longer pending' });
    }
    
    // Начинаем транзакцию
    await db.runTransaction(async (transaction) => {
      // Обновляем статус приглашения
      transaction.update(db.collection('invitations').doc(invitationId), {
        status: 'accepted',
        acceptedAt: new Date()
      });
      
      // Добавляем исполнителя в команду проекта
      const projectRef = db.collection('projects').doc(invitationData.projectId);
      const projectDoc = await transaction.get(projectRef);
      
      if (projectDoc.exists) {
        const projectData = projectDoc.data();
        const currentTeam = projectData.teamMembers || [];
        
        // Добавляем исполнителя, если его еще нет в команде
        if (!currentTeam.includes(userId)) {
          transaction.update(projectRef, {
            teamMembers: [...currentTeam, userId]
          });
        }
      }
    });
    
    console.log(`Invitation ${invitationId} accepted by user ${userId}`);
    res.json({ message: 'Invitation accepted successfully' });
    
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ error: 'Failed to accept invitation' });
  }
});

// Отклонить приглашение
router.post('/invitations/:invitationId/decline', authenticate, async (req, res) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user.uid;
    const userRoles = req.user.roles || [];
    
    console.log(`User ${userId} declining invitation ${invitationId}`);
    
    // Только исполнители могут отклонять приглашения
    if (!userRoles.includes('executor')) {
      return res.status(403).json({ error: 'Access denied. Only executors can decline invitations.' });
    }
    
    // Получаем приглашение
    const invitationDoc = await db.collection('invitations').doc(invitationId).get();
    if (!invitationDoc.exists) {
      return res.status(404).json({ error: 'Invitation not found' });
    }
    
    const invitationData = invitationDoc.data();
    
    // Проверяем, что приглашение адресовано этому пользователю
    if (invitationData.executorId !== userId) {
      return res.status(403).json({ error: 'This invitation is not for you' });
    }
    
    // Проверяем статус приглашения
    if (invitationData.status !== 'pending') {
      return res.status(400).json({ error: 'Invitation is no longer pending' });
    }
    
    // Обновляем статус приглашения
    await db.collection('invitations').doc(invitationId).update({
      status: 'declined',
      declinedAt: new Date()
    });
    
    console.log(`Invitation ${invitationId} declined by user ${userId}`);
    res.json({ message: 'Invitation declined successfully' });
    
  } catch (error) {
    console.error('Error declining invitation:', error);
    res.status(500).json({ error: 'Failed to decline invitation' });
  }
});

// ============ END INVITATIONS ============

module.exports = router; 