const { db } = require('../src/config/firebase');

async function fixFirestoreQueries() {
  try {
    console.log('🔧 Исправление проблемных запросов Firestore...');
    
    // 1. Исправляем запросы чатов - убираем сложные составные запросы
    console.log('\n1️⃣ Исправление запросов чатов...');
    
    // Получаем все проекты
    const projectsSnapshot = await db.collection('projects').get();
    console.log(`Найдено проектов: ${projectsSnapshot.size}`);
    
    for (const projectDoc of projectsSnapshot.docs) {
      const projectId = projectDoc.id;
      const projectData = projectDoc.data();
      
      console.log(`\n📋 Обрабатываем проект: ${projectData.title || projectId}`);
      
      // Получаем чаты проекта простым запросом (без составных индексов)
      const chatsSnapshot = await db.collection('projects')
        .doc(projectId)
        .collection('chats')
        .get();
      
      console.log(`  💬 Найдено чатов: ${chatsSnapshot.size}`);
      
      // Обновляем структуру чатов для упрощения запросов
      for (const chatDoc of chatsSnapshot.docs) {
        const chatData = chatDoc.data();
        
        // Добавляем поля для упрощения поиска
        const updateData = {
          searchableParticipants: chatData.participants || [],
          lastActivity: chatData.updatedAt || chatData.createdAt || new Date(),
          participantCount: (chatData.participants || []).length
        };
        
        await db.collection('projects')
          .doc(projectId)
          .collection('chats')
          .doc(chatDoc.id)
          .update(updateData);
        
        console.log(`    ✅ Обновлен чат: ${chatData.name || chatDoc.id}`);
      }
    }
    
    // 2. Исправляем запросы приглашений в команды
    console.log('\n2️⃣ Исправление запросов приглашений...');
    
    const invitationsSnapshot = await db.collection('team_invitations').get();
    console.log(`Найдено приглашений: ${invitationsSnapshot.size}`);
    
    for (const inviteDoc of invitationsSnapshot.docs) {
      const inviteData = inviteDoc.data();
      
      // Добавляем поля для упрощения поиска
      const updateData = {
        searchKey: `${inviteData.projectId}_${inviteData.senderId}_${inviteData.status}`,
        createdAtTimestamp: inviteData.createdAt || new Date(),
        statusUpdatedAt: inviteData.updatedAt || inviteData.createdAt || new Date()
      };
      
      await db.collection('team_invitations').doc(inviteDoc.id).update(updateData);
      console.log(`  ✅ Обновлено приглашение: ${inviteDoc.id}`);
    }
    
    // 3. Создаем упрощенные коллекции для быстрого доступа
    console.log('\n3️⃣ Создание упрощенных коллекций...');
    
    // Создаем коллекцию активных чатов пользователей
    const usersSnapshot = await db.collection('users').get();
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      // Собираем все чаты пользователя
      const userChats = [];
      
      // Проходим по всем проектам и ищем чаты с участием пользователя
      for (const projectDoc of projectsSnapshot.docs) {
        const projectId = projectDoc.id;
        
        const chatsSnapshot = await db.collection('projects')
          .doc(projectId)
          .collection('chats')
          .get();
        
        for (const chatDoc of chatsSnapshot.docs) {
          const chatData = chatDoc.data();
          
          if (chatData.participants && chatData.participants.includes(userId)) {
            userChats.push({
              chatId: chatDoc.id,
              projectId: projectId,
              chatName: chatData.name,
              lastActivity: chatData.updatedAt || chatData.createdAt || new Date(),
              type: chatData.type || 'group'
            });
          }
        }
      }
      
      // Сохраняем список чатов пользователя
      if (userChats.length > 0) {
        await db.collection('user_chats').doc(userId).set({
          userId: userId,
          chats: userChats,
          updatedAt: new Date()
        });
        
        console.log(`  ✅ Создан список чатов для пользователя: ${userData.email || userId} (${userChats.length} чатов)`);
      }
    }
    
    console.log('\n✅ Исправление запросов Firestore завершено!');
    
  } catch (error) {
    console.error('❌ Ошибка при исправлении запросов:', error);
  }
}

// Запускаем исправление
if (require.main === module) {
  fixFirestoreQueries()
    .then(() => {
      console.log('🎉 Скрипт завершен успешно!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Ошибка выполнения скрипта:', error);
      process.exit(1);
    });
}

module.exports = { fixFirestoreQueries }; 