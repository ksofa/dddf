const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testChatFix() {
  try {
    console.log('🧪 Тестирование исправления чатов...\n');

    // 1. Логин PM
    console.log('1️⃣ Логин PM...');
    const pmLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'pm@test.test',
      password: 'password123'
    });
    const pmToken = pmLoginResponse.data.token;
    console.log('✅ PM залогинен');

    // 2. Получаем проекты
    console.log('\n2️⃣ Получаем проекты...');
    const projectsResponse = await axios.get(`${BASE_URL}/projects`, {
      headers: { Authorization: `Bearer ${pmToken}` }
    });
    const project = projectsResponse.data[0];
    console.log(`✅ Выбран проект: ${project.title} (${project.id})`);

    // 3. Получаем чаты проекта
    console.log('\n3️⃣ Получаем чаты проекта...');
    const chatsResponse = await axios.get(`${BASE_URL}/projects/${project.id}/chats`, {
      headers: { Authorization: `Bearer ${pmToken}` }
    });
    console.log(`✅ Чатов в проекте: ${chatsResponse.data.length}`);
    
    if (chatsResponse.data.length > 0) {
      const chat = chatsResponse.data[0];
      console.log(`📋 Тестируем чат: ${chat.name} (${chat.id})`);
      
      // 4. Получаем сообщения чата (это должно работать теперь)
      console.log('\n4️⃣ Получаем сообщения чата...');
      const messagesResponse = await axios.get(`${BASE_URL}/projects/${project.id}/chats/${chat.id}/messages`, {
        headers: { Authorization: `Bearer ${pmToken}` }
      });
      console.log(`✅ Сообщений в чате: ${messagesResponse.data.length}`);
      
      if (messagesResponse.data.length > 0) {
        console.log('📝 Последние 3 сообщения:');
        messagesResponse.data.slice(0, 3).forEach((msg, index) => {
          console.log(`   ${index + 1}. [${msg.sender?.name || 'Unknown'}]: ${msg.text}`);
        });
      }
      
      // 5. Отправляем тестовое сообщение
      console.log('\n5️⃣ Отправляем тестовое сообщение...');
      const sendMessageResponse = await axios.post(`${BASE_URL}/projects/${project.id}/chats/${chat.id}/messages`, {
        text: `Тестовое сообщение от PM - ${new Date().toLocaleTimeString()}`
      }, {
        headers: { Authorization: `Bearer ${pmToken}` }
      });
      console.log('✅ Сообщение отправлено:', sendMessageResponse.data.message);
      
      // 6. Проверяем, что сообщение появилось
      console.log('\n6️⃣ Проверяем обновленные сообщения...');
      const updatedMessagesResponse = await axios.get(`${BASE_URL}/projects/${project.id}/chats/${chat.id}/messages`, {
        headers: { Authorization: `Bearer ${pmToken}` }
      });
      console.log(`✅ Обновленное количество сообщений: ${updatedMessagesResponse.data.length}`);
      
      const lastMessage = updatedMessagesResponse.data[0];
      if (lastMessage) {
        console.log(`📝 Последнее сообщение: [${lastMessage.sender?.name || 'Unknown'}]: ${lastMessage.text}`);
      }
    } else {
      console.log('⚠️ Нет чатов для тестирования');
    }

    console.log('\n🎉 Тестирование исправления завершено успешно!');

  } catch (error) {
    console.error('❌ Ошибка в тестах:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error(`HTTP Status: ${error.response.status}`);
    }
  }
}

// Ждем 3 секунды для запуска сервера
setTimeout(testChatFix, 3000); 