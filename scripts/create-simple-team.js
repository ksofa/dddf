const { db } = require('../src/config/firebase');

async function createSimpleTeam() {
  try {
    console.log('🚀 Создание простой тестовой команды...');
    
    // Получаем PM пользователя
    const pmSnapshot = await db.collection('users').where('email', '==', 'pm@test.test').get();
    
    if (pmSnapshot.empty) {
      console.log('❌ PM пользователь не найден');
      return;
    }
    
    const pmDoc = pmSnapshot.docs[0];
    const pmId = pmDoc.id;
    const pmData = pmDoc.data();
    
    console.log(`✅ Найден PM: ${pmData.email} (${pmId})`);
    
    // Создаем простую команду
    const teamData = {
      name: 'Тестовая команда для приглашений',
      description: 'Команда для тестирования функции приглашений',
      pmId: pmId,
      memberIds: [], // Пустая команда для начала
      projectId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const teamRef = await db.collection('teams').add(teamData);
    console.log(`✅ Создана команда: ${teamRef.id}`);
    console.log(`📝 Название: ${teamData.name}`);
    console.log(`👤 PM: ${pmData.displayName || pmData.email}`);
    
    console.log('🎉 Тестовая команда успешно создана!');
    console.log('Теперь можно тестировать кнопки приглашения в интерфейсе.');
    
  } catch (error) {
    console.error('❌ Ошибка при создании команды:', error);
  }
  
  process.exit(0);
}

createSimpleTeam(); 