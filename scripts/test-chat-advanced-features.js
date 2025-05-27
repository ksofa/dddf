const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testAdvancedChatFeatures() {
  try {
    // 1. Логин пользователей
    console.log('🔐 Логин пользователей...');
    const pmLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'pm@test.test',
      password: 'password123'
    });
    const pmToken = pmLoginResponse.data.token;

    const executorLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'executor5@test.test',
      password: 'password123'
    });
    const executorToken = executorLoginResponse.data.token;

    const adminLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@admin.admin',
      password: 'password123'
    });
    const adminToken = adminLoginResponse.data.token;

    console.log('✅ Все пользователи залогинены');

    // 2. Получаем проект и чат
    console.log('\n📋 Получаем проект...');
    const projectsResponse = await axios.get(`${BASE_URL}/projects`, {
      headers: { Authorization: `Bearer ${pmToken}` }
    });
    const project = projectsResponse.data[0];

    const chatsResponse = await axios.get(`${BASE_URL}/projects/${project.id}/chats`, {
      headers: { Authorization: `Bearer ${pmToken}` }
    });
    const testChat = chatsResponse.data[0];
    console.log(`✅ Используем чат: ${testChat.name} (${testChat.id})`);

    // 3. Тестируем отметку сообщений как прочитанные
    console.log('\n📖 Executor отмечает сообщения как прочитанные...');
    try {
      const readResponse = await axios.post(`${BASE_URL}/projects/${project.id}/chats/${testChat.id}/read`, {}, {
        headers: { Authorization: `Bearer ${executorToken}` }
      });
      console.log('✅ Сообщения отмечены как прочитанные:', readResponse.data.message);
    } catch (error) {
      console.log('❌ Ошибка при отметке сообщений:', error.response?.data?.message || error.message);
    }

    // 4. Тестируем добавление участника в чат
    console.log('\n👥 PM добавляет нового участника в чат...');
    try {
      const addParticipantResponse = await axios.post(`${BASE_URL}/projects/${project.id}/chats/${testChat.id}/participants`, {
        userId: '9tFHRBCdhdNh3TDmdAdNQpT9GzY2' // executor2@test.test
      }, {
        headers: { Authorization: `Bearer ${pmToken}` }
      });
      console.log('✅ Участник добавлен:', addParticipantResponse.data.message);
    } catch (error) {
      console.log('❌ Ошибка при добавлении участника:', error.response?.data?.message || error.message);
    }

    // 5. Проверяем обновленный список участников
    console.log('\n👥 Проверяем обновленный список участников...');
    const updatedChatsResponse = await axios.get(`${BASE_URL}/projects/${project.id}/chats`, {
      headers: { Authorization: `Bearer ${pmToken}` }
    });
    const updatedChat = updatedChatsResponse.data.find(c => c.id === testChat.id);
    console.log(`✅ Участников в чате: ${updatedChat.participants.length}`);
    updatedChat.participants.forEach((participant, index) => {
      console.log(`${index + 1}. ${participant.name} (${participant.id})`);
    });

    // 6. Тестируем создание глобального чата (только админ)
    console.log('\n🌐 Admin создает глобальный чат...');
    try {
      const globalChatResponse = await axios.post(`${BASE_URL}/chats/global`, {
        name: 'Общий чат администрации',
        type: 'group',
        participants: ['5W6YYoii6HYhwWaI4zZSz15siSA3', 'QH040Apx3segNZ9zHJrLP8y4UPD2'] // PM и Executor
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Глобальный чат создан:', globalChatResponse.data.message);
      
      const globalChatId = globalChatResponse.data.chatId;

      // 7. Отправляем сообщение в глобальный чат
      console.log('\n💬 Admin отправляет сообщение в глобальный чат...');
      const globalMessageResponse = await axios.post(`${BASE_URL}/chats/global/${globalChatId}/messages`, {
        text: 'Добро пожаловать в общий чат!'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Сообщение в глобальный чат отправлено:', globalMessageResponse.data.message);

      // 8. PM читает сообщения из глобального чата
      console.log('\n📨 PM читает сообщения из глобального чата...');
      const globalMessagesResponse = await axios.get(`${BASE_URL}/chats/global/${globalChatId}/messages`, {
        headers: { Authorization: `Bearer ${pmToken}` }
      });
      console.log(`✅ PM видит ${globalMessagesResponse.data.length} сообщений в глобальном чате:`);
      globalMessagesResponse.data.forEach((msg, index) => {
        console.log(`${index + 1}. [${msg.sender?.name || 'Unknown'}]: ${msg.text}`);
      });

    } catch (error) {
      console.log('❌ Ошибка с глобальным чатом:', error.response?.data?.message || error.message);
    }

    // 9. Тестируем получение всех чатов пользователя
    console.log('\n📨 Получаем все чаты PM...');
    try {
      const allChatsResponse = await axios.get(`${BASE_URL}/chats`, {
        headers: { Authorization: `Bearer ${pmToken}` }
      });
      console.log(`✅ PM видит ${allChatsResponse.data.length} чатов всего:`);
      allChatsResponse.data.forEach((chat, index) => {
        const chatType = chat.isGlobal ? '[Глобальный]' : `[Проект: ${chat.projectTitle}]`;
        console.log(`${index + 1}. ${chat.name} ${chatType}`);
      });
    } catch (error) {
      console.log('❌ Ошибка при получении всех чатов:', error.response?.data?.message || error.message);
    }

    // 10. Тестируем статистику чата
    console.log('\n📊 Получаем статистику чата...');
    try {
      const statsResponse = await axios.get(`${BASE_URL}/projects/${project.id}/chats/${testChat.id}/statistics`, {
        headers: { Authorization: `Bearer ${pmToken}` }
      });
      console.log('✅ Статистика чата:');
      console.log(`   - Всего сообщений: ${statsResponse.data.totalMessages}`);
      console.log(`   - Среднее сообщений в день: ${statsResponse.data.averageMessagesPerDay.toFixed(1)}`);
      console.log(`   - Самые активные пользователи:`);
      statsResponse.data.mostActiveUsers.forEach((user, index) => {
        console.log(`     ${index + 1}. ${user.fullName || 'Unknown'}: ${user.count} сообщений`);
      });
    } catch (error) {
      console.log('❌ Ошибка при получении статистики:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 Тестирование расширенных функций чатов завершено!');

  } catch (error) {
    console.error('❌ Ошибка в тестах:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error(`HTTP Status: ${error.response.status}`);
    }
  }
}

testAdvancedChatFeatures(); 