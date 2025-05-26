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

async function createTestTeams() {
  try {
    // Получаем всех пользователей
    const usersSnapshot = await db.collection('users').get();
    const users = {};
    
    usersSnapshot.docs.forEach(doc => {
      const userData = doc.data();
      users[userData.email] = doc.id;
    });

    console.log('Found users:', Object.keys(users));

    // Создаем тестовые команды с участниками
    const teams = [
      {
        name: 'Разработка личного кабинета МТС и сервиса',
        description: 'Команда для разработки личного кабинета МТС',
        pmId: users['pm@example.com'] || users['admin@example.com'],
        memberIds: [
          users['frontend@example.com'],
          users['backend@example.com'],
          users['tester@example.com']
        ].filter(Boolean),
        projectId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Корпоративный сайт дочерней компании',
        description: 'Разработка корпоративного сайта',
        pmId: users['pm2@example.com'] || users['admin@example.com'],
        memberIds: [
          users['frontend@example.com'],
          users['designer@example.com']
        ].filter(Boolean),
        projectId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Сервис автоматической аналитики клиентской базы',
        description: 'Аналитический сервис для клиентов',
        pmId: users['pm@example.com'] || users['admin@example.com'],
        memberIds: [
          users['backend@example.com'],
          users['analyst@example.com'],
          users['tester@example.com']
        ].filter(Boolean),
        projectId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Сервис логистического планирования для АЗС',
        description: 'Система планирования логистики',
        pmId: users['pm2@example.com'] || users['admin@example.com'],
        memberIds: [
          users['backend@example.com'],
          users['frontend@example.com'],
          users['analyst@example.com'],
          users['designer@example.com']
        ].filter(Boolean),
        projectId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Мобильное приложение для доставки',
        description: 'Разработка мобильного приложения',
        pmId: users['pm@example.com'] || users['admin@example.com'],
        memberIds: [
          users['frontend@example.com'],
          users['designer@example.com'],
          users['tester@example.com']
        ].filter(Boolean),
        projectId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Удаляем старые команды
    const existingTeams = await db.collection('teams').get();
    for (const doc of existingTeams.docs) {
      await doc.ref.delete();
    }

    for (const team of teams) {
      await db.collection('teams').add(team);
      console.log('Created team:', team.name, 'with', team.memberIds.length, 'members');
    }

    console.log('Test teams created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating test teams:', error);
    process.exit(1);
  }
}

createTestTeams(); 