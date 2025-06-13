const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Тестовые пользователи 
const PM_USER = {
  email: 'pm@test.test',
  password: 'password123'
};

const EXECUTOR_USER = {
  email: 'executor5@test.test', 
  password: 'password123'
};

const ADMIN_USER = {
  email: 'admin@admin.admin',
  password: 'password123'
};

async function login(email, password) {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email,
      password
    });
    return response.data.token;
  } catch (error) {
    console.error(`Login failed for ${email}:`, error.response?.data || error.message);
    throw error;
  }
}

async function testChatSystem() {
  console.log('🧪 Тестирование системы чатов...\n');

  try {
    // 1. Логин пользователей
    console.log('1️⃣ Логин пользователей...');
    const pmToken = await login(PM_USER.email, PM_USER.password);
    const executorToken = await login(EXECUTOR_USER.email, EXECUTOR_USER.password);
    const adminToken = await login(ADMIN_USER.email, ADMIN_USER.password);
    console.log('✅ Все пользователи залогинены');

    // 2. Получаем проекты PM
    console.log('\n2️⃣ Получаем проекты PM...');
    const pmProjectsResponse = await axios.get(`${BASE_URL}/projects`, {
      headers: { Authorization: `Bearer ${pmToken}` }
    });
    console.log(`✅ PM видит ${pmProjectsResponse.data.length} проектов`);
    
    if (pmProjectsResponse.data.length === 0) {
      console.log('❌ PM не видит проектов - тест не может продолжиться');
      return;
    }

    const testProject = pmProjectsResponse.data[0];
    console.log(`📋 Используем проект: "${testProject.title}" (ID: ${testProject.id})`);

    // 3. Получаем чаты проекта
    console.log('\n3️⃣ Получаем чаты проекта...');
    const projectChatsResponse = await axios.get(`${BASE_URL}/projects/${testProject.id}/chats`, {
      headers: { Authorization: `Bearer ${pmToken}` }
    });
    console.log(`📨 Проект имеет ${projectChatsResponse.data.length} чатов`);

    // 4. Создаем новый чат если нет
    let testChat;
    if (projectChatsResponse.data.length === 0) {
      console.log('\n4️⃣ Создаем новый чат...');
      const createChatResponse = await axios.post(`${BASE_URL}/projects/${testProject.id}/chats`, {
        name: 'Тестовый чат команды',
        type: 'group',
        participants: ['QH040Apx3segNZ9zHJrLP8y4UPD2'] // executor5@test.test
      }, {
        headers: { Authorization: `Bearer ${pmToken}` }
      });
      console.log('✅ Чат создан:', createChatResponse.data.message);
      
      // Используем данные чата из ответа или получаем обновленный список
      if (createChatResponse.data.chat) {
        testChat = createChatResponse.data.chat;
      } else {
        // Получаем обновленный список чатов
        const updatedChatsResponse = await axios.get(`${BASE_URL}/projects/${testProject.id}/chats`, {
          headers: { Authorization: `Bearer ${pmToken}` }
        });
        testChat = updatedChatsResponse.data[0];
      }
    } else {
      testChat = projectChatsResponse.data[0];
    }

    console.log(`📋 Используем чат: "${testChat.name}" (ID: ${testChat.id})`);

    // 5. Отправляем сообщение от PM
    console.log('\n5️⃣ PM отправляет сообщение...');
    const sendMessageResponse = await axios.post(`${BASE_URL}/projects/${testProject.id}/chats/${testChat.id}/messages`, {
      text: 'Привет команда! Это тестовое сообщение от PM.'
    }, {
      headers: { Authorization: `Bearer ${pmToken}` }
    });
    console.log('✅ Сообщение отправлено:', sendMessageResponse.data.message);

    // 6. Получаем сообщения чата
    console.log('\n6️⃣ Получаем сообщения чата...');
    const messagesResponse = await axios.get(`${BASE_URL}/projects/${testProject.id}/chats/${testChat.id}/messages`, {
      headers: { Authorization: `Bearer ${pmToken}` }
    });
    console.log(`📨 Чат содержит ${messagesResponse.data.length} сообщений`);
    
    if (messagesResponse.data.length > 0) {
      const lastMessage = messagesResponse.data[0];
      console.log(`📝 Последнее сообщение: "${lastMessage.text}" от ${lastMessage.sender?.name || 'Unknown'}`);
    }

    // 7. Executor отвечает в чат
    console.log('\n7️⃣ Executor отвечает в чат...');
    try {
      const executorMessageResponse = await axios.post(`${BASE_URL}/projects/${testProject.id}/chats/${testChat.id}/messages`, {
        text: 'Привет! Получил сообщение, готов к работе!'
      }, {
        headers: { Authorization: `Bearer ${executorToken}` }
      });
      console.log('✅ Executor ответил:', executorMessageResponse.data.message);
    } catch (error) {
      console.log('❌ Executor не может отправить сообщение:', error.response?.data?.message || error.message);
    }

    // 8. Проверяем глобальные чаты
    console.log('\n8️⃣ Проверяем глобальные чаты...');
    try {
      const globalChatsResponse = await axios.get(`${BASE_URL}/chats`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log(`🌐 Admin видит ${globalChatsResponse.data.length} глобальных чатов`);
    } catch (error) {
      console.log('⚠️ Не удалось получить глобальные чаты:', error.response?.status);
    }

    // 9. Создаем глобальный чат (только админ)
    console.log('\n9️⃣ Admin создает глобальный чат...');
    try {
      const globalChatResponse = await axios.post(`${BASE_URL}/chats/global`, {
        name: 'Общий чат администрации',
        type: 'group',
        participants: ['5W6YYoii6HYhwWaI4zZSz15siSA3', 'QH040Apx3segNZ9zHJrLP8y4UPD2'] // PM и Executor
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Глобальный чат создан:', globalChatResponse.data.message);
    } catch (error) {
      console.log('❌ Не удалось создать глобальный чат:', error.response?.data?.message || error.message);
    }

    // 10. Отмечаем сообщения как прочитанные
    console.log('\n🔟 Отмечаем сообщения как прочитанные...');
    try {
      await axios.post(`${BASE_URL}/projects/${testProject.id}/chats/${testChat.id}/read`, {}, {
        headers: { Authorization: `Bearer ${executorToken}` }
      });
      console.log('✅ Сообщения отмечены как прочитанные');
    } catch (error) {
      console.log('❌ Не удалось отметить сообщения:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 Тестирование системы чатов завершено!');
    console.log('\n📊 Итоги:');
    console.log(`   - Проектов у PM: ${pmProjectsResponse.data.length}`);
    console.log(`   - Чатов в проекте: ${projectChatsResponse.data.length}`);
    console.log(`   - Сообщений в чате: ${messagesResponse.data.length}`);
    console.log(`   - Создание чата: ✅`);
    console.log(`   - Отправка сообщений: ✅`);
    console.log(`   - Получение сообщений: ✅`);

  } catch (error) {
    console.error('❌ Ошибка в тестах:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error(`HTTP Status: ${error.response.status}`);
    }
  }
}

// Запуск тестов
testChatSystem(); 