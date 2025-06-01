const admin = require('firebase-admin');

// Инициализация Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
}

const db = admin.firestore();

async function createTestTasks() {
  try {
    console.log('🔄 Создание тестовых задач...');

    // Получаем существующие проекты
    const projectsSnapshot = await db.collection('projects').limit(3).get();
    const projects = [];
    projectsSnapshot.forEach(doc => {
      projects.push({ id: doc.id, ...doc.data() });
    });

    if (projects.length === 0) {
      console.log('❌ Нет проектов для создания задач');
      return;
    }

    // Получаем пользователей-исполнителей
    const usersSnapshot = await db.collection('users').where('roles', 'array-contains', 'executor').limit(5).get();
    const executors = [];
    usersSnapshot.forEach(doc => {
      executors.push({ id: doc.id, ...doc.data() });
    });

    if (executors.length === 0) {
      console.log('❌ Нет исполнителей для назначения задач');
      return;
    }

    // Получаем PM пользователей
    const pmSnapshot = await db.collection('users').where('roles', 'array-contains', 'pm').limit(2).get();
    const pms = [];
    pmSnapshot.forEach(doc => {
      pms.push({ id: doc.id, ...doc.data() });
    });

    const testTasks = [
      {
        title: 'Разработка главной страницы',
        description: 'Создать адаптивную главную страницу с современным дизайном',
        status: 'todo',
        priority: 'high',
        assignedTo: executors[0]?.id || 'test-executor-1',
        projectId: projects[0]?.id || 'test-project-1',
        createdBy: pms[0]?.id || 'test-pm-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // +7 дней
      },
      {
        title: 'Настройка базы данных',
        description: 'Создать схему базы данных и настроить подключение',
        status: 'in_progress',
        priority: 'medium',
        assignedTo: executors[1]?.id || 'test-executor-2',
        projectId: projects[0]?.id || 'test-project-1',
        createdBy: pms[0]?.id || 'test-pm-1',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // -2 дня
        updatedAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() // +5 дней
      },
      {
        title: 'Тестирование API',
        description: 'Провести полное тестирование всех API эндпоинтов',
        status: 'review',
        priority: 'high',
        assignedTo: executors[2]?.id || 'test-executor-3',
        projectId: projects[1]?.id || 'test-project-2',
        createdBy: pms[0]?.id || 'test-pm-1',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // -5 дней
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // -1 день
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() // +2 дня
      },
      {
        title: 'Документация пользователя',
        description: 'Написать подробную документацию для пользователей системы',
        status: 'done',
        priority: 'low',
        assignedTo: executors[3]?.id || 'test-executor-4',
        projectId: projects[1]?.id || 'test-project-2',
        createdBy: pms[1]?.id || 'test-pm-2',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // -10 дней
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // -3 дня
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // -1 день (просрочено, но выполнено)
      },
      {
        title: 'Оптимизация производительности',
        description: 'Провести анализ и оптимизацию производительности приложения',
        status: 'todo',
        priority: 'medium',
        assignedTo: executors[0]?.id || 'test-executor-1',
        projectId: projects[2]?.id || 'test-project-3',
        createdBy: pms[1]?.id || 'test-pm-2',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // +14 дней
      },
      {
        title: 'Исправление критических багов',
        description: 'Исправить критические ошибки, найденные в процессе тестирования',
        status: 'todo',
        priority: 'high',
        assignedTo: executors[1]?.id || 'test-executor-2',
        projectId: projects[0]?.id || 'test-project-1',
        createdBy: pms[0]?.id || 'test-pm-1',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // -1 день
        updatedAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // +3 дня
      },
      {
        title: 'Интеграция с внешними сервисами',
        description: 'Настроить интеграцию с платежными системами и внешними API',
        status: 'in_progress',
        priority: 'medium',
        assignedTo: executors[2]?.id || 'test-executor-3',
        projectId: projects[2]?.id || 'test-project-3',
        createdBy: pms[1]?.id || 'test-pm-2',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // -3 дня
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // -1 день
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString() // +10 дней
      },
      {
        title: 'Просроченная задача',
        description: 'Эта задача была просрочена и требует внимания',
        status: 'todo',
        priority: 'high',
        assignedTo: executors[3]?.id || 'test-executor-4',
        projectId: projects[1]?.id || 'test-project-2',
        createdBy: pms[0]?.id || 'test-pm-1',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // -7 дней
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // -2 дня
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // -2 дня (просрочено)
      }
    ];

    console.log(`📝 Создание ${testTasks.length} тестовых задач...`);

    for (const taskData of testTasks) {
      const docRef = await db.collection('tasks').add(taskData);
      console.log(`✅ Создана задача: ${taskData.title} (ID: ${docRef.id})`);
    }

    console.log('🎉 Все тестовые задачи созданы успешно!');

    // Выводим статистику
    const tasksByStatus = testTasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📊 Статистика созданных задач:');
    Object.entries(tasksByStatus).forEach(([status, count]) => {
      const statusLabels = {
        todo: 'К выполнению',
        in_progress: 'В работе',
        review: 'На проверке',
        done: 'Выполнено'
      };
      console.log(`   ${statusLabels[status]}: ${count}`);
    });

    console.log(`\n🏗️ Проекты с задачами:`);
    projects.forEach(project => {
      const projectTasks = testTasks.filter(task => task.projectId === project.id);
      console.log(`   ${project.title}: ${projectTasks.length} задач`);
    });

  } catch (error) {
    console.error('❌ Ошибка при создании тестовых задач:', error);
  }
}

// Запуск скрипта
createTestTasks().then(() => {
  console.log('\n✨ Скрипт завершен');
  process.exit(0);
}).catch(error => {
  console.error('💥 Критическая ошибка:', error);
  process.exit(1);
}); 