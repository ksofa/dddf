const { db } = require('../src/config/firebase');

async function createPMProjectsAndChats() {
  try {
    console.log('🚀 Creating projects and chats for PM user...');

    // Находим PM пользователя
    const pmSnapshot = await db.collection('users').where('email', '==', 'pm@mail.ru').get();
    if (pmSnapshot.empty) {
      console.error('❌ PM user pm@mail.ru not found');
      return;
    }

    const pmUser = { id: pmSnapshot.docs[0].id, ...pmSnapshot.docs[0].data() };
    console.log(`✅ Found PM user: ${pmUser.fullName} (${pmUser.email})`);

    // Получаем всех пользователей для команд
    const usersSnapshot = await db.collection('users').get();
    const allUsers = [];
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      allUsers.push({
        id: doc.id,
        ...userData
      });
    });

    const executors = allUsers.filter(u => u.roles?.includes('executor'));
    const customers = allUsers.filter(u => u.roles?.includes('customer'));
    const admins = allUsers.filter(u => u.roles?.includes('admin'));

    console.log(`Found ${executors.length} executors, ${customers.length} customers, ${admins.length} admins`);

    // Создаем проекты для PM
    const projectsToCreate = [
      {
        title: 'Интернет-магазин электроники',
        description: 'Разработка современного интернет-магазина с каталогом товаров, корзиной и системой оплаты',
        status: 'active',
        priority: 'high',
        budget: 850000,
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 дней
        customerId: customers[0]?.id || pmUser.id,
        pmId: pmUser.id,
        teamMembers: executors.slice(0, 4).map(e => e.id),
        technologies: ['React', 'Node.js', 'PostgreSQL', 'Stripe'],
        category: 'web-development'
      },
      {
        title: 'Мобильное приложение для доставки',
        description: 'iOS и Android приложение для заказа и отслеживания доставки еды',
        status: 'planning',
        priority: 'medium',
        budget: 1200000,
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 дней
        customerId: customers[1]?.id || pmUser.id,
        pmId: pmUser.id,
        teamMembers: executors.slice(2, 6).map(e => e.id),
        technologies: ['React Native', 'Firebase', 'Google Maps API'],
        category: 'mobile-development'
      },
      {
        title: 'CRM система для малого бизнеса',
        description: 'Система управления клиентами с аналитикой и автоматизацией процессов',
        status: 'active',
        priority: 'high',
        budget: 650000,
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 дней
        customerId: customers[2]?.id || pmUser.id,
        pmId: pmUser.id,
        teamMembers: executors.slice(1, 4).map(e => e.id),
        technologies: ['Vue.js', 'Laravel', 'MySQL', 'Chart.js'],
        category: 'web-development'
      },
      {
        title: 'Система онлайн-обучения',
        description: 'Платформа для создания и проведения онлайн-курсов с видеоконференциями',
        status: 'completed',
        priority: 'medium',
        budget: 950000,
        deadline: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // завершен 30 дней назад
        customerId: customers[3]?.id || pmUser.id,
        pmId: pmUser.id,
        teamMembers: executors.slice(0, 5).map(e => e.id),
        technologies: ['Angular', 'Spring Boot', 'WebRTC', 'AWS'],
        category: 'web-development'
      },
      {
        title: 'Корпоративный портал',
        description: 'Внутренний портал компании с HR-модулями и документооборотом',
        status: 'active',
        priority: 'low',
        budget: 750000,
        deadline: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 120 дней
        customerId: customers[4]?.id || pmUser.id,
        pmId: pmUser.id,
        teamMembers: executors.slice(3, 7).map(e => e.id),
        technologies: ['React', 'Express.js', 'MongoDB', 'Redis'],
        category: 'web-development'
      }
    ];

    console.log(`Creating ${projectsToCreate.length} projects...`);

    const createdProjects = [];
    for (const projectData of projectsToCreate) {
      try {
        const projectRef = await db.collection('projects').add({
          ...projectData,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        createdProjects.push({
          id: projectRef.id,
          ...projectData
        });

        console.log(`✅ Created project: ${projectData.title}`);
      } catch (error) {
        console.error(`❌ Error creating project ${projectData.title}:`, error.message);
      }
    }

    // Создаем чаты для каждого проекта
    console.log('\n📱 Creating chats for projects...');

    for (const project of createdProjects) {
      try {
        // 1. Командный чат проекта
        const teamChatRef = await db.collection('projects')
          .doc(project.id)
          .collection('chats')
          .add({
            name: `Команда проекта: ${project.title}`,
            type: 'group',
            participants: [project.pmId, ...project.teamMembers],
            createdBy: project.pmId,
            createdAt: new Date(),
            updatedAt: new Date(),
            isTeamChat: true
          });

        // Приветственное сообщение в командном чате
        await db.collection('projects')
          .doc(project.id)
          .collection('chats')
          .doc(teamChatRef.id)
          .collection('messages')
          .add({
            text: `Добро пожаловать в командный чат проекта "${project.title}"! 🚀\n\nДавайте работать эффективно и достигать целей вместе! 💪`,
            senderId: project.pmId,
            timestamp: new Date(),
            readBy: [project.pmId],
            type: 'text'
          });

        // 2. Приватные чаты PM с каждым участником команды
        for (const memberId of project.teamMembers) {
          const member = allUsers.find(u => u.id === memberId);
          if (member) {
            const privateChatRef = await db.collection('projects')
              .doc(project.id)
              .collection('chats')
              .add({
                name: `${pmUser.fullName} - ${member.fullName || member.displayName}`,
                type: 'direct',
                participants: [project.pmId, memberId],
                createdBy: project.pmId,
                createdAt: new Date(),
                updatedAt: new Date(),
                isPrivateChat: true
              });

            // Приветственное сообщение в приватном чате
            await db.collection('projects')
              .doc(project.id)
              .collection('chats')
              .doc(privateChatRef.id)
              .collection('messages')
              .add({
                text: `Привет! Это наш приватный чат по проекту "${project.title}". Если есть вопросы или нужна помощь - пиши сюда! 😊`,
                senderId: project.pmId,
                timestamp: new Date(),
                readBy: [project.pmId],
                type: 'text'
              });
          }
        }

        // 3. Чат с заказчиком (если заказчик не PM)
        if (project.customerId !== project.pmId) {
          const customer = allUsers.find(u => u.id === project.customerId);
          if (customer) {
            const customerChatRef = await db.collection('projects')
              .doc(project.id)
              .collection('chats')
              .add({
                name: `PM - Заказчик: ${project.title}`,
                type: 'direct',
                participants: [project.pmId, project.customerId],
                createdBy: project.pmId,
                createdAt: new Date(),
                updatedAt: new Date(),
                isCustomerChat: true
              });

            // Приветственное сообщение заказчику
            await db.collection('projects')
              .doc(project.id)
              .collection('chats')
              .doc(customerChatRef.id)
              .collection('messages')
              .add({
                text: `Здравствуйте! Это чат по проекту "${project.title}". Здесь мы будем обсуждать все вопросы по проекту. Готов ответить на любые ваши вопросы! 👋`,
                senderId: project.pmId,
                timestamp: new Date(),
                readBy: [project.pmId],
                type: 'text'
              });
          }
        }

        console.log(`✅ Created chats for project: ${project.title}`);
      } catch (error) {
        console.error(`❌ Error creating chats for project ${project.title}:`, error.message);
      }
    }

    // Создаем колонки для скрам-досок
    console.log('\n📋 Creating scrum board columns...');

    const defaultColumns = [
      { name: 'Бэклог', order: 0, color: '#6B7280' },
      { name: 'Нужно сделать', order: 1, color: '#3B82F6' },
      { name: 'В работе', order: 2, color: '#F59E0B' },
      { name: 'Правки', order: 3, color: '#EF4444' },
      { name: 'Готово', order: 4, color: '#10B981' }
    ];

    for (const project of createdProjects) {
      for (const column of defaultColumns) {
        try {
          await db.collection('projects')
            .doc(project.id)
            .collection('columns')
            .add({
              ...column,
              createdAt: new Date(),
              updatedAt: new Date()
            });
        } catch (error) {
          console.error(`❌ Error creating column for project ${project.title}:`, error.message);
        }
      }
    }

    // Создаем демо-задачи
    console.log('\n📝 Creating demo tasks...');

    const demoTasks = [
      {
        title: 'Настройка проекта и инфраструктуры',
        description: 'Создание репозитория, настройка CI/CD, подготовка окружений',
        priority: 'high',
        status: 'Готово',
        estimatedHours: 16,
        tags: ['setup', 'devops']
      },
      {
        title: 'Дизайн главной страницы',
        description: 'Создание макетов главной страницы в Figma',
        priority: 'high',
        status: 'Готово',
        estimatedHours: 24,
        tags: ['design', 'ui/ux']
      },
      {
        title: 'Разработка API авторизации',
        description: 'Реализация регистрации, входа и восстановления пароля',
        priority: 'high',
        status: 'В работе',
        estimatedHours: 32,
        tags: ['backend', 'auth']
      },
      {
        title: 'Верстка каталога товаров',
        description: 'Адаптивная верстка страницы каталога с фильтрами',
        priority: 'medium',
        status: 'Нужно сделать',
        estimatedHours: 40,
        tags: ['frontend', 'catalog']
      },
      {
        title: 'Интеграция с платежной системой',
        description: 'Подключение Stripe для обработки платежей',
        priority: 'medium',
        status: 'Бэклог',
        estimatedHours: 24,
        tags: ['backend', 'payments']
      }
    ];

    for (const project of createdProjects.slice(0, 3)) { // Создаем задачи только для первых 3 проектов
      for (let i = 0; i < demoTasks.length; i++) {
        const task = demoTasks[i];
        const assigneeId = project.teamMembers[i % project.teamMembers.length];

        try {
          await db.collection('projects')
            .doc(project.id)
            .collection('tasks')
            .add({
              ...task,
              assigneeId,
              projectId: project.id,
              createdBy: project.pmId,
              createdAt: new Date(),
              updatedAt: new Date(),
              dueDate: new Date(Date.now() + (7 + i * 3) * 24 * 60 * 60 * 1000) // разные дедлайны
            });
        } catch (error) {
          console.error(`❌ Error creating task for project ${project.title}:`, error.message);
        }
      }
      console.log(`✅ Created ${demoTasks.length} tasks for project: ${project.title}`);
    }

    console.log('\n🎉 Successfully created PM projects and chats!');
    console.log('\n📊 Summary:');
    console.log(`- Projects created: ${createdProjects.length}`);
    console.log(`- Chats created: ~${createdProjects.length * 3} (team + private + customer chats)`);
    console.log(`- Tasks created: ${demoTasks.length * 3}`);
    console.log(`- Columns created: ${defaultColumns.length * createdProjects.length}`);

    console.log('\n🔑 Login credentials:');
    console.log('Email: pm@mail.ru');
    console.log('Password: 123456');

  } catch (error) {
    console.error('❌ Error creating PM projects and chats:', error);
  }
}

// Запускаем скрипт
if (require.main === module) {
  createPMProjectsAndChats()
    .then(() => {
      console.log('✅ PM projects and chats creation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createPMProjectsAndChats }; 