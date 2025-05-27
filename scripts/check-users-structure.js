const { db } = require('../src/config/firebase');

async function checkUsersStructure() {
  try {
    console.log('🔄 Проверяем структуру коллекции users...');
    
    // Получаем всех пользователей с ролью PM
    const usersSnapshot = await db.collection('users')
      .where('roles', 'array-contains', 'pm')
      .limit(5)
      .get();
    
    console.log('📊 Найдено PM пользователей:', usersSnapshot.size);
    
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      console.log('👤 PM пользователь:');
      console.log('  - Document ID:', doc.id);
      console.log('  - UID:', data.uid);
      console.log('  - Display Name:', data.displayName);
      console.log('  - Email:', data.email);
      console.log('  - Roles:', data.roles);
      console.log('  ---');
    });
    
    // Проверяем конкретного пользователя
    const specificUserId = '3zQmIv378cegrTnz5qydFi6p9JH2';
    console.log(`🔍 Проверяем пользователя ${specificUserId}...`);
    
    const userDoc = await db.collection('users').doc(specificUserId).get();
    if (userDoc.exists) {
      console.log('✅ Пользователь найден по document ID');
      console.log('📋 Данные:', userDoc.data());
    } else {
      console.log('❌ Пользователь НЕ найден по document ID');
      
      // Попробуем найти по UID
      const userByUidSnapshot = await db.collection('users')
        .where('uid', '==', specificUserId)
        .get();
      
      if (!userByUidSnapshot.empty) {
        console.log('✅ Пользователь найден по UID');
        userByUidSnapshot.forEach(doc => {
          console.log('📋 Document ID:', doc.id);
          console.log('📋 Данные:', doc.data());
        });
      } else {
        console.log('❌ Пользователь НЕ найден по UID');
      }
    }
    
  } catch (error) {
    console.error('❌ Ошибка проверки структуры users:', error);
  }
}

async function main() {
  console.log('🚀 Начинаем проверку структуры коллекции users...\n');
  
  await checkUsersStructure();
  
  console.log('\n✅ Проверка завершена');
  process.exit(0);
}

main().catch(console.error); 