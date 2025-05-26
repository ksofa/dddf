const { db } = require('../src/config/firebase');

async function createClientApplications() {
  try {
    console.log('Creating client applications...');

    const applications = [
      {
        fullName: 'Анна Петрова',
        phone: '+7 (495) 123-45-67',
        email: 'anna.petrova@example.com',
        projectTitle: 'Интернет-магазин косметики',
        projectDescription: 'Нужно создать современный интернет-магазин для продажи косметики с каталогом товаров, корзиной, системой оплаты и личным кабинетом клиента.',
        techSpec: 'React, Node.js, PostgreSQL, интеграция с платежными системами, адаптивный дизайн',
        type: 'client_request',
        status: 'pending',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 дня назад
        assignedTeamLead: null,
        teamMembers: []
      },
      {
        fullName: 'Михаил Сидоров',
        phone: '+7 (812) 987-65-43',
        email: 'mikhail.sidorov@company.ru',
        projectTitle: 'Корпоративный портал для сотрудников',
        projectDescription: 'Требуется разработка внутреннего портала для компании с модулями HR, документооборота, новостей и чата между сотрудниками.',
        techSpec: 'Vue.js, Laravel, MySQL, система авторизации через Active Directory',
        type: 'client_request',
        status: 'pending',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 день назад
        assignedTeamLead: null,
        teamMembers: []
      },
      {
        fullName: 'Елена Козлова',
        phone: '+7 (903) 555-12-34',
        email: 'elena.kozlova@startup.io',
        projectTitle: 'Мобильное приложение для фитнеса',
        projectDescription: 'Создание мобильного приложения для iOS и Android с трекингом тренировок, планами питания и социальными функциями.',
        techSpec: 'React Native, Firebase, интеграция с Apple Health и Google Fit',
        type: 'client_request',
        status: 'pending',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 часов назад
        assignedTeamLead: null,
        teamMembers: []
      },
      {
        fullName: 'Дмитрий Волков',
        phone: '+7 (926) 777-88-99',
        email: 'dmitry.volkov@restaurant.com',
        projectTitle: 'Система управления рестораном',
        projectDescription: 'Веб-приложение для управления рестораном: заказы, меню, склад, персонал, аналитика продаж.',
        techSpec: 'Angular, Spring Boot, PostgreSQL, система печати чеков',
        type: 'client_request',
        status: 'pending',
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 часа назад
        assignedTeamLead: null,
        teamMembers: []
      },
      {
        fullName: 'Ольга Морозова',
        phone: '+7 (499) 333-22-11',
        email: 'olga.morozova@school.edu',
        projectTitle: 'Платформа онлайн-образования',
        projectDescription: 'Образовательная платформа для школы с видеоуроками, тестами, домашними заданиями и системой оценок.',
        techSpec: 'React, Node.js, MongoDB, WebRTC для видеозвонков, система прокторинга',
        type: 'client_request',
        status: 'pending',
        createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 минут назад
        assignedTeamLead: null,
        teamMembers: []
      }
    ];

    for (const application of applications) {
      const docRef = await db.collection('applications').add(application);
      console.log(`✓ Created application "${application.projectTitle}" with ID: ${docRef.id}`);
    }

    console.log(`\n✅ Successfully created ${applications.length} client applications!`);
    console.log('\nThese applications will be visible to PM users in the Applications section.');

  } catch (error) {
    console.error('Error creating client applications:', error);
  }
}

// Запускаем скрипт
createClientApplications().then(() => {
  console.log('Script completed');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
}); 