const { db, admin } = require('../src/config/firebase');

// ID PM пользователя
const PM_UID = '5W6YYoii6HYhwWaI4zZSz15siSA3';

async function createTestData() {
  console.log('Creating test data for PM user...');

  try {
    // 1. Создаем проекты для PM
    const projects = [
      {
        id: 'project-1',
        title: 'Интернет-магазин электроники',
        client: 'ООО "ТехноМир"',
        manager: PM_UID,
        assignedPM: PM_UID,
        assignedPMName: 'PM Test User',
        status: ['assigned', 'in_progress'],
        description: 'Разработка современного интернет-магазина с каталогом товаров',
        budget: 500000,
        deadline: new Date('2024-06-01'),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        id: 'project-2', 
        title: 'Мобильное приложение доставки',
        client: 'ИП Иванов А.А.',
        manager: PM_UID,
        assignedPM: PM_UID,
        assignedPMName: 'PM Test User',
        status: ['assigned'],
        description: 'iOS и Android приложение для службы доставки еды',
        budget: 800000,
        deadline: new Date('2024-08-15'),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        id: 'project-3',
        title: 'CRM система для автосалона',
        client: 'ООО "АвтоПремиум"',
        manager: PM_UID,
        assignedPM: PM_UID,
        assignedPMName: 'PM Test User',
        status: ['assigned', 'in_progress'],
        description: 'Система управления клиентами и продажами автомобилей',
        budget: 1200000,
        deadline: new Date('2024-09-30'),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }
    ];

    // Создаем проекты
    for (const project of projects) {
      await db.collection('projects').doc(project.id).set(project);
      console.log(`Created project: ${project.title}`);
    }

    // 2. Создаем пользователей (участников команд)
    const users = [
      {
        uid: 'dev-frontend-1',
        email: 'frontend1@test.com',
        displayName: 'Анна Фронтендова',
        roles: ['developer'],
        specialization: 'Frontend Developer',
        avatar: null
      },
      {
        uid: 'dev-backend-1',
        email: 'backend1@test.com',
        displayName: 'Иван Бэкендов',
        roles: ['developer'],
        specialization: 'Backend Developer',
        avatar: null
      },
      {
        uid: 'designer-1',
        email: 'designer1@test.com',
        displayName: 'Мария Дизайнерова',
        roles: ['designer'],
        specialization: 'UI/UX Designer',
        avatar: null
      },
      {
        uid: 'qa-1',
        email: 'qa1@test.com',
        displayName: 'Петр Тестеров',
        roles: ['qa'],
        specialization: 'QA Engineer',
        avatar: null
      },
      {
        uid: 'dev-mobile-1',
        email: 'mobile1@test.com',
        displayName: 'Елена Мобайлова',
        roles: ['developer'],
        specialization: 'Mobile Developer',
        avatar: null
      },
      {
        uid: 'teamlead-1',
        email: 'teamlead1@test.com',
        displayName: 'Алексей Лидеров',
        roles: ['team_lead'],
        specialization: 'Team Lead',
        avatar: null
      }
    ];

    // Создаем пользователей
    for (const user of users) {
      await db.collection('users').doc(user.uid).set(user);
      console.log(`Created user: ${user.displayName}`);
    }

    // 3. Создаем команды для проектов
    const teams = [
      {
        id: 'team-project-1',
        name: 'Команда интернет-магазина',
        project: 'Интернет-магазин электроники',
        projectId: 'project-1',
        manager: PM_UID,
        teamLead: {
          id: 'teamlead-1',
          displayName: 'Алексей Лидеров',
          email: 'teamlead1@test.com'
        },
        members: [
          {
            id: 'dev-frontend-1',
            name: 'Анна Фронтендова',
            email: 'frontend1@test.com',
            role: 'Frontend Developer'
          },
          {
            id: 'dev-backend-1',
            name: 'Иван Бэкендов',
            email: 'backend1@test.com',
            role: 'Backend Developer'
          },
          {
            id: 'designer-1',
            name: 'Мария Дизайнерова',
            email: 'designer1@test.com',
            role: 'UI/UX Designer'
          }
        ],
        status: ['active'],
        customerInfo: {
          fullName: 'Сергей Петрович Технов',
          phone: '+7 (495) 123-45-67',
          email: 'techno@technomir.ru'
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        id: 'team-project-2',
        name: 'Команда мобильного приложения',
        project: 'Мобильное приложение доставки',
        projectId: 'project-2',
        manager: PM_UID,
        teamLead: {
          id: 'teamlead-1',
          displayName: 'Алексей Лидеров',
          email: 'teamlead1@test.com'
        },
        members: [
          {
            id: 'dev-mobile-1',
            name: 'Елена Мобайлова',
            email: 'mobile1@test.com',
            role: 'Mobile Developer'
          },
          {
            id: 'dev-backend-1',
            name: 'Иван Бэкендов',
            email: 'backend1@test.com',
            role: 'Backend Developer'
          },
          {
            id: 'designer-1',
            name: 'Мария Дизайнерова',
            email: 'designer1@test.com',
            role: 'UI/UX Designer'
          },
          {
            id: 'qa-1',
            name: 'Петр Тестеров',
            email: 'qa1@test.com',
            role: 'QA Engineer'
          }
        ],
        status: ['active'],
        customerInfo: {
          fullName: 'Андрей Александрович Иванов',
          phone: '+7 (926) 555-12-34',
          email: 'ivanov@delivery.com'
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        id: 'team-project-3',
        name: 'Команда CRM системы',
        project: 'CRM система для автосалона',
        projectId: 'project-3',
        manager: PM_UID,
        teamLead: {
          id: 'teamlead-1',
          displayName: 'Алексей Лидеров',
          email: 'teamlead1@test.com'
        },
        members: [
          {
            id: 'dev-frontend-1',
            name: 'Анна Фронтендова',
            email: 'frontend1@test.com',
            role: 'Frontend Developer'
          },
          {
            id: 'dev-backend-1',
            name: 'Иван Бэкендов',
            email: 'backend1@test.com',
            role: 'Backend Developer'
          }
        ],
        status: ['active'],
        customerInfo: {
          fullName: 'Дмитрий Владимирович Автомобилев',
          phone: '+7 (495) 777-88-99',
          email: 'auto@autopremium.ru'
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }
    ];

    // Создаем команды
    for (const team of teams) {
      await db.collection('teams').doc(team.id).set(team);
      console.log(`Created team: ${team.name}`);
    }

    console.log('\n✅ Test data created successfully!');
    console.log(`\nCreated for PM user (${PM_UID}):`);
    console.log(`- ${projects.length} projects`);
    console.log(`- ${users.length} team members`);
    console.log(`- ${teams.length} teams`);
    
    process.exit(0);

  } catch (error) {
    console.error('Error creating test data:', error);
    process.exit(1);
  }
}

createTestData(); 