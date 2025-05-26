const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function createTestApplications() {
  try {
    // Получаем всех пользователей
    const usersSnapshot = await db.collection('users').get();
    const users = {};
    
    usersSnapshot.docs.forEach(doc => {
      const userData = doc.data();
      users[userData.email] = { id: doc.id, ...userData };
    });

    console.log('Found users:', Object.keys(users));

    // Получаем команды
    const teamsSnapshot = await db.collection('teams').get();
    const teams = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log('Found teams:', teams.length);

    // Создаем тестовые заявки
    const applications = [
      {
        type: 'team_invitation',
        senderId: users['pm@example.com']?.id,
        receiverId: users['frontend@example.com']?.id,
        teamId: teams[0]?.id,
        rate: 2500,
        startDate: new Date('2024-02-01'),
        estimatedDuration: '3 месяца',
        coverLetter: 'Приглашаем вас присоединиться к нашей команде для разработки личного кабинета МТС. Ваш опыт в React и TypeScript будет очень полезен.',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'team_invitation',
        senderId: users['pm@example.com']?.id,
        receiverId: users['designer@example.com']?.id,
        teamId: teams[1]?.id,
        rate: 2200,
        startDate: new Date('2024-02-15'),
        estimatedDuration: '2 месяца',
        coverLetter: 'Ищем талантливого дизайнера для создания современного корпоративного сайта. Проект включает UX/UI дизайн и создание дизайн-системы.',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'team_invitation',
        senderId: users['pm2@example.com']?.id,
        receiverId: users['backend@example.com']?.id,
        teamId: teams[2]?.id,
        rate: 3000,
        startDate: new Date('2024-01-20'),
        estimatedDuration: '4 месяца',
        coverLetter: 'Приглашаем опытного backend разработчика для создания сервиса аналитики. Технологии: Node.js, PostgreSQL, Redis.',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'team_invitation',
        senderId: users['pm@example.com']?.id,
        receiverId: users['tester@example.com']?.id,
        teamId: teams[0]?.id,
        rate: 1800,
        startDate: new Date('2024-02-10'),
        estimatedDuration: '3 месяца',
        coverLetter: 'Нужен QA инженер для тестирования личного кабинета МТС. Опыт автоматизации тестирования приветствуется.',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'team_invitation',
        senderId: users['pm2@example.com']?.id,
        receiverId: users['analyst@example.com']?.id,
        teamId: teams[3]?.id,
        rate: 1600,
        startDate: new Date('2024-01-25'),
        estimatedDuration: '2 месяца',
        coverLetter: 'Ищем бизнес-аналитика для проекта логистического планирования АЗС. Требуется опыт работы с большими данными.',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Удаляем старые заявки
    const existingApplications = await db.collection('applications').get();
    for (const doc of existingApplications.docs) {
      await doc.ref.delete();
    }

    for (const application of applications) {
      if (application.senderId && application.receiverId && application.teamId) {
        await db.collection('applications').add(application);
        console.log('Created application from', users[Object.keys(users).find(email => users[email].id === application.senderId)]?.name, 'to', users[Object.keys(users).find(email => users[email].id === application.receiverId)]?.name);
      }
    }

    console.log('Test applications created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating test applications:', error);
    process.exit(1);
  }
}

createTestApplications(); 