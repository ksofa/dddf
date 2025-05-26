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
const auth = admin.auth();

async function createTestUsers() {
  try {
    // Создаем PM пользователя
    const pmUser = await auth.createUser({
      email: 'pm@example.com',
      password: '123456',
      displayName: 'Анна Петрова'
    });

    await db.collection('users').doc(pmUser.uid).set({
      name: 'Анна Петрова',
      email: 'pm@example.com',
      phone: '+7 (999) 123-45-67',
      roles: ['pm'],
      profession: 'Project Manager',
      avatarUrl: 'https://ui-avatars.com/api/?name=Анна+Петрова&background=4F46E5&color=fff',
      rating: 9.2,
      experienceYears: 5,
      projectsCount: 12,
      teamsCount: 3,
      avgRate: 2500,
      workTime: '09:00-18:00',
      timezone: 'UTC+3',
      workDays: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'],
      verified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('Created PM user:', pmUser.uid);

    // Создаем исполнителей
    const executors = [
      {
        email: 'frontend@example.com',
        name: 'Дмитрий Иванов',
        profession: 'Frontend разработчик',
        phone: '+7 (999) 234-56-78',
        rating: 8.8,
        experienceYears: 3,
        avgRate: 2000
      },
      {
        email: 'tester@example.com',
        name: 'Елена Сидорова',
        profession: 'Тестировщик',
        phone: '+7 (999) 345-67-89',
        rating: 9.0,
        experienceYears: 4,
        avgRate: 1800
      },
      {
        email: 'backend@example.com',
        name: 'Алексей Козлов',
        profession: 'Backend разработчик',
        phone: '+7 (999) 456-78-90',
        rating: 9.5,
        experienceYears: 6,
        avgRate: 2800
      },
      {
        email: 'analyst@example.com',
        name: 'Мария Новикова',
        profession: 'Аналитик',
        phone: '+7 (999) 567-89-01',
        rating: 8.7,
        experienceYears: 2,
        avgRate: 1600
      },
      {
        email: 'designer@example.com',
        name: 'Артем Волков',
        profession: 'Дизайнер',
        phone: '+7 (999) 678-90-12',
        rating: 9.1,
        experienceYears: 4,
        avgRate: 2200
      }
    ];

    for (const executor of executors) {
      const user = await auth.createUser({
        email: executor.email,
        password: '123456',
        displayName: executor.name
      });

      await db.collection('users').doc(user.uid).set({
        name: executor.name,
        email: executor.email,
        phone: executor.phone,
        roles: ['executor'],
        profession: executor.profession,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(executor.name)}&background=random&color=fff`,
        rating: executor.rating,
        experienceYears: executor.experienceYears,
        projectsCount: Math.floor(Math.random() * 10) + 1,
        teamsCount: Math.floor(Math.random() * 5) + 1,
        avgRate: executor.avgRate,
        workTime: '10:00-19:00',
        timezone: 'UTC+3',
        workDays: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'],
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log('Created executor:', user.uid, executor.name);
    }

    // Создаем еще одного PM
    const pm2User = await auth.createUser({
      email: 'pm2@example.com',
      password: '123456',
      displayName: 'Сергей Морозов'
    });

    await db.collection('users').doc(pm2User.uid).set({
      name: 'Сергей Морозов',
      email: 'pm2@example.com',
      phone: '+7 (999) 789-01-23',
      roles: ['pm'],
      profession: 'Senior Project Manager',
      avatarUrl: 'https://ui-avatars.com/api/?name=Сергей+Морозов&background=059669&color=fff',
      rating: 9.6,
      experienceYears: 8,
      projectsCount: 25,
      teamsCount: 7,
      avgRate: 3000,
      workTime: '09:00-18:00',
      timezone: 'UTC+3',
      workDays: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'],
      verified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('Created PM2 user:', pm2User.uid);

    console.log('\nTest users created successfully!');
    console.log('PM: pm@example.com / 123456');
    console.log('PM2: pm2@example.com / 123456');
    console.log('Frontend: frontend@example.com / 123456');
    console.log('Tester: tester@example.com / 123456');
    console.log('Backend: backend@example.com / 123456');
    console.log('Analyst: analyst@example.com / 123456');
    console.log('Designer: designer@example.com / 123456');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test users:', error);
    process.exit(1);
  }
}

createTestUsers(); 