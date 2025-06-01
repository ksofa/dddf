const { auth, db } = require('../src/config/firebase');

async function createExecutor2() {
  try {
    // Создаем пользователя в Firebase Auth
    const userRecord = await auth.createUser({
      email: 'executor2@test.test',
      password: 'password123',
      displayName: 'Исполнитель 2'
    });

    console.log('✅ User created in Firebase Auth:', userRecord.uid);

    // Сохраняем в Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email: 'executor2@test.test',
      displayName: 'Исполнитель 2',
      fullName: 'Исполнитель Второй',
      roles: ['executor'],
      specialization: 'Backend разработчик',
      profession: 'Backend разработчик',
      rating: '9.2',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ User saved to Firestore');
    console.log('User ID:', userRecord.uid);
    console.log('Email:', 'executor2@test.test');
    console.log('Password:', 'password123');

  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log('⚠️ User already exists, getting existing user...');
      const userRecord = await auth.getUserByEmail('executor2@test.test');
      console.log('Existing user ID:', userRecord.uid);
    } else {
      console.error('❌ Error creating user:', error);
    }
  }
}

createExecutor2().then(() => {
  console.log('✅ Script completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
}); 