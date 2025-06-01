const { auth, db } = require('../src/config/firebase');

async function createTestUsers() {
  const users = [
    { email: 'admin@test.test', password: 'password123', roles: ['admin'], displayName: 'Админ Тестовый' },
    { email: 'pm@test.test', password: 'password123', roles: ['pm'], displayName: 'ПМ Тестовый' },
    { email: 'executor@test.test', password: 'password123', roles: ['executor'], displayName: 'Исполнитель Тестовый' },
    { email: 'customer@test.test', password: 'password123', roles: ['customer'], displayName: 'Клиент Тестовый' }
  ];

  for (const userData of users) {
    try {
      // Создаем пользователя в Firebase Auth
      const userRecord = await auth.createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.displayName
      });

      // Сохраняем в Firestore
      await db.collection('users').doc(userRecord.uid).set({
        email: userData.email,
        displayName: userData.displayName,
        fullName: userData.displayName,
        roles: userData.roles,
        createdAt: new Date(),
        isActive: true
      });

      console.log(`✅ Created user: ${userData.email} (${userData.roles.join(', ')})`);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log(`⚠️ User already exists: ${userData.email}`);
      } else {
        console.error(`❌ Error creating ${userData.email}:`, error.message);
      }
    }
  }
}

createTestUsers().then(() => {
  console.log('✅ Test users creation completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
}); 