const { db } = require('../src/config/firebase');

async function createTestChats() {
  try {
    console.log('🚀 Создание тестовых чатов...');

    // Получаем проект project-1
    const projectDoc = await db.collection('projects').doc('project-1').get();
    if (!projectDoc.exists) {
      console.log('❌ Проект project-1 не найден');
      return;
    }

    const projectData = projectDoc.data();
    console.log('📋 Проект найден:', projectData.title);
    console.log('👥 Участники команды:', projectData.teamMembers);

    // Проверяем, есть ли уже чаты
    const existingChatsSnapshot = await db.collection('projects')
      .doc('project-1')
      .collection('chats')
      .get();

    if (!existingChatsSnapshot.empty) {
      console.log('💬 Чаты уже существуют, удаляем старые...');
      const batch = db.batch();
      existingChatsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }

    const teamMembers = projectData.teamMembers || [];
    const pmId = projectData.manager || projectData.pmId;

    if (teamMembers.length === 0) {
      console.log('❌ Нет участников команды для создания чатов');
      return;
    }

    // 1. Создаем общий чат команды
    console.log('💬 Создаем общий чат команды...');
    const teamChatData = {
      name: `Общий чат - ${projectData.title}`,
      type: 'group',
      participants: teamMembers,
      createdBy: pmId,
      createdAt: new Date(),
      updatedAt: new Date(),
      isTeamChat: true
    };

    const teamChatRef = await db.collection('projects')
      .doc('project-1')
      .collection('chats')
      .add(teamChatData);

    console.log(`✅ Создан общий чат: ${teamChatRef.id}`);

    // 2. Создаем приватные чаты PM с каждым участником
    if (pmId) {
      console.log('💬 Создаем приватные чаты PM с участниками...');
      
      for (const memberId of teamMembers) {
        if (memberId !== pmId) {
          // Получаем информацию о участнике
          const memberDoc = await db.collection('users').doc(memberId).get();
          const memberData = memberDoc.exists ? memberDoc.data() : null;
          const memberName = memberData ? (memberData.displayName || memberData.fullName || 'Участник') : 'Участник';

          const privateChatData = {
            name: `Чат с ${memberName}`,
            type: 'direct',
            participants: [pmId, memberId],
            createdBy: pmId,
            createdAt: new Date(),
            updatedAt: new Date(),
            isPrivateChat: true
          };

          const privateChatRef = await db.collection('projects')
            .doc('project-1')
            .collection('chats')
            .add(privateChatData);

          console.log(`✅ Создан приватный чат с ${memberName}: ${privateChatRef.id}`);
        }
      }
    }

    // 3. Создаем тестовые сообщения в общем чате
    console.log('💬 Добавляем тестовые сообщения...');
    
    const testMessages = [
      {
        text: 'Добро пожаловать в общий чат проекта!',
        senderId: pmId,
        timestamp: new Date(Date.now() - 3600000), // 1 час назад
        type: 'text',
        readBy: [pmId]
      },
      {
        text: 'Привет всем! Готов к работе 💪',
        senderId: teamMembers[1] || teamMembers[0],
        timestamp: new Date(Date.now() - 1800000), // 30 минут назад
        type: 'text',
        readBy: [teamMembers[1] || teamMembers[0]]
      },
      {
        text: 'Отлично! Давайте обсудим план работы на эту неделю',
        senderId: pmId,
        timestamp: new Date(Date.now() - 900000), // 15 минут назад
        type: 'text',
        readBy: [pmId]
      }
    ];

    for (const messageData of testMessages) {
      await db.collection('projects')
        .doc('project-1')
        .collection('chats')
        .doc(teamChatRef.id)
        .collection('messages')
        .add(messageData);
    }

    // Обновляем последнее сообщение в чате
    await db.collection('projects')
      .doc('project-1')
      .collection('chats')
      .doc(teamChatRef.id)
      .update({
        lastMessage: testMessages[testMessages.length - 1].text,
        lastMessageAt: testMessages[testMessages.length - 1].timestamp,
        lastMessageBy: testMessages[testMessages.length - 1].senderId,
        updatedAt: new Date()
      });

    console.log('✅ Тестовые сообщения добавлены');

    console.log('🎉 Тестовые чаты успешно созданы!');
    console.log('📊 Статистика:');
    console.log(`   - Общий чат команды: 1`);
    console.log(`   - Приватные чаты: ${teamMembers.length - 1}`);
    console.log(`   - Тестовые сообщения: ${testMessages.length}`);

  } catch (error) {
    console.error('❌ Ошибка при создании тестовых чатов:', error);
  }
}

// Запускаем скрипт
createTestChats().then(() => {
  console.log('✅ Скрипт завершен');
  process.exit(0);
}).catch(error => {
  console.error('❌ Ошибка:', error);
  process.exit(1);
}); 