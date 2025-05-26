const { auth, db } = require('../src/config/firebase');

async function createAdmin() {
  try {
    console.log('Создание администратора...');

    const adminData = {
      email: 'admin@example.com',
      password: 'admin123',
      displayName: 'Администратор',
      fullName: 'Администратор Системы'
    };

    // Создаем пользователя в Firebase Auth
    let userRecord;
    try {
      userRecord = await auth.createUser({
        email: adminData.email,
        password: adminData.password,
        displayName: adminData.displayName
      });
      console.log('✓ Пользователь создан в Firebase Auth:', userRecord.uid);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log('Пользователь уже существует, получаем его данные...');
        userRecord = await auth.getUserByEmail(adminData.email);
        console.log('✓ Найден существующий пользователь:', userRecord.uid);
      } else {
        throw error;
      }
    }

    // Создаем/обновляем документ пользователя в Firestore
    const userData = {
      email: adminData.email,
      displayName: adminData.displayName,
      fullName: adminData.fullName,
      roles: ['admin'],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('users').doc(userRecord.uid).set(userData, { merge: true });
    console.log('✓ Данные пользователя сохранены в Firestore');

    console.log('\n=== АДМИНИСТРАТОР СОЗДАН ===');
    console.log('Email:', adminData.email);
    console.log('Password:', adminData.password);
    console.log('UID:', userRecord.uid);
    console.log('Роли:', userData.roles);

  } catch (error) {
    console.error('Ошибка при создании администратора:', error);
    process.exit(1);
  }
}

// Запускаем создание админа
createAdmin()
  .then(() => {
    console.log('\nАдминистратор успешно создан!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Ошибка:', error);
    process.exit(1);
  }); 