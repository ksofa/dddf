const { db, auth } = require('../src/config/firebase');

async function createTestExecutors() {
  console.log('Creating test executors...');

  const executors = [
    {
      email: 'executor1@test.test',
      password: 'test123',
      displayName: 'Алексей Иванов',
      specialization: 'Frontend разработчик',
      roles: ['executor']
    },
    {
      email: 'executor2@test.test',
      password: 'test123',
      displayName: 'Мария Петрова',
      specialization: 'Backend разработчик',
      roles: ['executor']
    },
    {
      email: 'executor3@test.test',
      password: 'test123',
      displayName: 'Дмитрий Сидоров',
      specialization: 'Fullstack разработчик',
      roles: ['executor']
    },
    {
      email: 'executor4@test.test',
      password: 'test123',
      displayName: 'Анна Козлова',
      specialization: 'UI/UX дизайнер',
      roles: ['executor']
    },
    {
      email: 'executor5@test.test',
      password: 'test123',
      displayName: 'Сергей Морозов',
      specialization: 'DevOps инженер',
      roles: ['executor']
    }
  ];

  for (const executor of executors) {
    try {
      // Проверяем, существует ли пользователь
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(executor.email);
        console.log(`User ${executor.email} already exists`);
      } catch (error) {
        // Создаем пользователя в Firebase Auth
        userRecord = await auth.createUser({
          email: executor.email,
          password: executor.password,
          displayName: executor.displayName
        });
        console.log(`Created user ${executor.email}`);
      }

      // Создаем/обновляем документ в Firestore
      const userData = {
        email: executor.email,
        name: executor.displayName,
        displayName: executor.displayName,
        fullName: executor.displayName,
        specialization: executor.specialization,
        roles: executor.roles,
        role: 'executor',
        createdAt: new Date(),
        availability: 'available',
        workload: Math.floor(Math.random() * 80), // 0-80% загрузка
        experience: ['Junior', 'Middle', 'Senior'][Math.floor(Math.random() * 3)]
      };

      await db.collection('users').doc(userRecord.uid).set(userData, { merge: true });
      console.log(`Created/updated executor document for ${executor.email}`);

    } catch (error) {
      console.error(`Error creating executor ${executor.email}:`, error);
    }
  }

  console.log('Test executors creation completed!');
}

createTestExecutors().catch(console.error); 