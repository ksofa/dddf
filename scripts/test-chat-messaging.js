const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testChatMessaging() {
  try {
    // 1. Логин PM
    console.log('🔐 Логин PM...');
    const pmLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'pm@test.test',
      password: 'password123'
    });
    const pmToken = pmLoginResponse.data.token;
    console.log('✅ PM залогинен');

    // 2. Логин Executor
    console.log('\n🔐 Логин Executor...');
    const executorLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'executor5@test.test',
      password: 'password123'
    });
    const executorToken = executorLoginResponse.data.token;
    console.log('✅ Executor залогинен');

    // 3. Получаем проекты PM
    console.log('\n📋 Получаем проекты PM...');
    const projectsResponse = await axios.get(`${BASE_URL}/projects`, {
      headers: { Authorization: `Bearer ${pmToken}` }
    });
    const project = projectsResponse.data[0];
    console.log(`✅ Используем проект: ${project.title} (${project.id})`);

    // 4. Получаем чаты проекта
    console.log('\n💬 Получаем чаты проекта...');
    const chatsResponse = await axios.get(`${BASE_URL}/projects/${project.id}/chats`, {
      headers: { Authorization: `Bearer ${pmToken}` }
    });
    
    let testChat = chatsResponse.data[0];
    if (!testChat) {
      console.log('📝 Создаем новый чат...');
      const createChatResponse = await axios.post(`${BASE_URL}/projects/${project.id}/chats`, {
        name: 'Test Messaging Chat',
        type: 'group',
        participants: ['QH040Apx3segNZ9zHJrLP8y4UPD2']
      }, {
        headers: { Authorization: `Bearer ${pmToken}` }
      });
      testChat = createChatResponse.data.chat;
    }
    
    console.log(`✅ Используем чат: ${testChat.name} (${testChat.id})`);

    // 5. PM отправляет сообщение
    console.log('\n📤 PM отправляет сообщение...');
    const pmMessageResponse = await axios.post(`${BASE_URL}/projects/${project.id}/chats/${testChat.id}/messages`, {
      text: 'Привет! Это сообщение от PM',
      type: 'text'
    }, {
      headers: { Authorization: `Bearer ${pmToken}` }
    });
    console.log('✅ Сообщение от PM отправлено:', pmMessageResponse.data.message);

    // 6. Executor отправляет сообщение
    console.log('\n📤 Executor отправляет сообщение...');
    const executorMessageResponse = await axios.post(`${BASE_URL}/projects/${project.id}/chats/${testChat.id}/messages`, {
      text: 'Привет! Это ответ от Executor',
      type: 'text'
    }, {
      headers: { Authorization: `Bearer ${executorToken}` }
    });
    console.log('✅ Сообщение от Executor отправлено:', executorMessageResponse.data.message);

    // 7. Получаем сообщения чата (PM)
    console.log('\n📨 PM получает сообщения чата...');
    const pmMessagesResponse = await axios.get(`${BASE_URL}/projects/${project.id}/chats/${testChat.id}/messages`, {
      headers: { Authorization: `Bearer ${pmToken}` }
    });
    console.log(`✅ PM видит ${pmMessagesResponse.data.length} сообщений:`);
    pmMessagesResponse.data.forEach((msg, index) => {
      console.log(`${index + 1}. [${msg.sender?.name || 'Unknown'}]: ${msg.text}`);
    });

    // 8. Получаем сообщения чата (Executor)
    console.log('\n📨 Executor получает сообщения чата...');
    const executorMessagesResponse = await axios.get(`${BASE_URL}/projects/${project.id}/chats/${testChat.id}/messages`, {
      headers: { Authorization: `Bearer ${executorToken}` }
    });
    console.log(`✅ Executor видит ${executorMessagesResponse.data.length} сообщений:`);
    executorMessagesResponse.data.forEach((msg, index) => {
      console.log(`${index + 1}. [${msg.sender?.name || 'Unknown'}]: ${msg.text}`);
    });

    // 9. Проверяем обновленный список чатов с последними сообщениями
    console.log('\n🔄 Проверяем обновленный список чатов...');
    const updatedChatsResponse = await axios.get(`${BASE_URL}/projects/${project.id}/chats`, {
      headers: { Authorization: `Bearer ${pmToken}` }
    });
    
    console.log(`✅ Найдено ${updatedChatsResponse.data.length} чатов:`);
    updatedChatsResponse.data.forEach((chat, index) => {
      const lastMsg = chat.lastMessage;
      console.log(`${index + 1}. ${chat.name} - Последнее сообщение: ${lastMsg ? `"${lastMsg.text}" от ${lastMsg.sender?.name}` : 'Нет сообщений'}`);
    });

    console.log('\n🎉 Тестирование чатов завершено успешно!');

  } catch (error) {
    console.error('❌ Ошибка:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error(`HTTP Status: ${error.response.status}`);
    }
  }
}

testChatMessaging(); 