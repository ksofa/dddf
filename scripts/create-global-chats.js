const { db } = require('../src/config/firebase');

async function createGlobalChats() {
  try {
    console.log('🚀 Creating global chats...');

    // Получаем всех пользователей
    const usersSnapshot = await db.collection('users').get();
    const users = [];
    
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      users.push({
        id: doc.id,
        ...userData
      });
    });

    console.log(`Found ${users.length} users`);

    // Группируем пользователей по ролям
    const adminUsers = users.filter(u => u.roles?.includes('admin'));
    const pmUsers = users.filter(u => u.roles?.includes('pm'));
    const executorUsers = users.filter(u => u.roles?.includes('executor'));
    const customerUsers = users.filter(u => u.roles?.includes('customer'));

    console.log(`Admins: ${adminUsers.length}, PMs: ${pmUsers.length}, Executors: ${executorUsers.length}, Customers: ${customerUsers.length}`);

    const chatsToCreate = [];

    // 1. Чат всех админов
    if (adminUsers.length > 1) {
      chatsToCreate.push({
        name: 'Администраторы',
        type: 'group',
        participants: adminUsers.map(u => u.id),
        createdBy: adminUsers[0].id,
        isGlobal: true,
        description: 'Общий чат администраторов'
      });
    }

    // 2. Чат всех PM
    if (pmUsers.length > 1) {
      chatsToCreate.push({
        name: 'Проект-менеджеры',
        type: 'group',
        participants: pmUsers.map(u => u.id),
        createdBy: pmUsers[0].id,
        isGlobal: true,
        description: 'Общий чат проект-менеджеров'
      });
    }

    // 3. Чат всех исполнителей
    if (executorUsers.length > 1) {
      chatsToCreate.push({
        name: 'Исполнители',
        type: 'group',
        participants: executorUsers.map(u => u.id),
        createdBy: executorUsers[0].id,
        isGlobal: true,
        description: 'Общий чат исполнителей'
      });
    }

    // 4. Общий чат команды (все роли кроме заказчиков)
    const teamUsers = [...adminUsers, ...pmUsers, ...executorUsers];
    if (teamUsers.length > 1) {
      chatsToCreate.push({
        name: 'Общий чат команды',
        type: 'group',
        participants: teamUsers.map(u => u.id),
        createdBy: adminUsers[0]?.id || pmUsers[0]?.id,
        isGlobal: true,
        description: 'Общий чат всей команды'
      });
    }

    // 5. Приватные чаты между админами и PM
    for (const admin of adminUsers) {
      for (const pm of pmUsers) {
        if (admin.id !== pm.id) {
          chatsToCreate.push({
            name: `${admin.displayName || admin.fullName} - ${pm.displayName || pm.fullName}`,
            type: 'direct',
            participants: [admin.id, pm.id],
            createdBy: admin.id,
            isGlobal: true,
            description: 'Приватный чат админа и PM'
          });
        }
      }
    }

    // 6. Приватные чаты между PM и исполнителями (первые 3 для демо)
    for (const pm of pmUsers) {
      for (let i = 0; i < Math.min(3, executorUsers.length); i++) {
        const executor = executorUsers[i];
        if (pm.id !== executor.id) {
          chatsToCreate.push({
            name: `${pm.displayName || pm.fullName} - ${executor.displayName || executor.fullName}`,
            type: 'direct',
            participants: [pm.id, executor.id],
            createdBy: pm.id,
            isGlobal: true,
            description: 'Приватный чат PM и исполнителя'
          });
        }
      }
    }

    // 7. Приватные чаты между исполнителями (первые 5 пар для демо)
    for (let i = 0; i < Math.min(5, executorUsers.length); i++) {
      for (let j = i + 1; j < Math.min(i + 3, executorUsers.length); j++) {
        const executor1 = executorUsers[i];
        const executor2 = executorUsers[j];
        chatsToCreate.push({
          name: `${executor1.displayName || executor1.fullName} - ${executor2.displayName || executor2.fullName}`,
          type: 'direct',
          participants: [executor1.id, executor2.id],
          createdBy: executor1.id,
          isGlobal: true,
          description: 'Приватный чат между исполнителями'
        });
      }
    }

    console.log(`Creating ${chatsToCreate.length} global chats...`);

    // Создаем чаты
    let createdCount = 0;
    for (const chatData of chatsToCreate) {
      try {
        const chatRef = await db.collection('global-chats').add({
          ...chatData,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        // Добавляем приветственное сообщение
        await db.collection('global-chats')
          .doc(chatRef.id)
          .collection('messages')
          .add({
            text: chatData.type === 'group' 
              ? `Добро пожаловать в ${chatData.name}! 👋`
              : 'Привет! Как дела? 👋',
            senderId: chatData.createdBy,
            timestamp: new Date(),
            readBy: [chatData.createdBy],
            type: 'text'
          });

        createdCount++;
        console.log(`✅ Created chat: ${chatData.name}`);
      } catch (error) {
        console.error(`❌ Error creating chat ${chatData.name}:`, error.message);
      }
    }

    console.log(`\n🎉 Successfully created ${createdCount} global chats!`);

    // Статистика
    console.log('\n📊 Chat Statistics:');
    console.log(`- Group chats: ${chatsToCreate.filter(c => c.type === 'group').length}`);
    console.log(`- Direct chats: ${chatsToCreate.filter(c => c.type === 'direct').length}`);
    console.log(`- Total participants: ${new Set(chatsToCreate.flatMap(c => c.participants)).size}`);

  } catch (error) {
    console.error('❌ Error creating global chats:', error);
  }
}

// Запускаем скрипт
if (require.main === module) {
  createGlobalChats()
    .then(() => {
      console.log('✅ Global chats creation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createGlobalChats }; 