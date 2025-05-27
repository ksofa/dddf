const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testChatFrontendIntegration() {
  try {
    console.log('🧪 Тестирование интеграции frontend-backend для чатов...\n');

    // 1. Логин PM
    console.log('1️⃣ Логин PM...');
    const pmLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'pm@test.test',
      password: 'password123'
    });
    const pmToken = pmLoginResponse.data.token;
    console.log('✅ PM залогинен');

    // 2. Получаем проекты (как это делает frontend)
    console.log('\n2️⃣ Получаем проекты PM...');
    const projectsResponse = await axios.get(`${BASE_URL}/projects`, {
      headers: { Authorization: `Bearer ${pmToken}` }
    });
    const project = projectsResponse.data[0];
    console.log(`✅ Выбран проект: ${project.title} (${project.id})`);

    // 3. Получаем участников проекта (новый эндпоинт)
    console.log('\n3️⃣ Получаем участников проекта...');
    const membersResponse = await axios.get(`${BASE_URL}/projects/${project.id}/members`, {
      headers: { Authorization: `Bearer ${pmToken}` }
    });
    console.log(`✅ Участников проекта: ${membersResponse.data.length}`);
    membersResponse.data.forEach((member, index) => {
      console.log(`   ${index + 1}. ${member.name} (${member.email}) - ${member.roles?.join(', ')}`);
    });

    // 4. Получаем чаты проекта
    console.log('\n4️⃣ Получаем чаты проекта...');
    const chatsResponse = await axios.get(`${BASE_URL}/projects/${project.id}/chats`, {
      headers: { Authorization: `Bearer ${pmToken}` }
    });
    console.log(`✅ Чатов в проекте: ${chatsResponse.data.length}`);
    
    if (chatsResponse.data.length > 0) {
      const chat = chatsResponse.data[0];
      console.log(`📋 Используем чат: ${chat.name} (${chat.id})`);
      console.log(`   Участников: ${chat.participants.length}`);
      
      // 5. Получаем сообщения чата
      console.log('\n5️⃣ Получаем сообщения чата...');
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
    }

    // 6. Тестируем создание нового чата с участниками проекта
    console.log('\n6️⃣ Создаем новый чат с участниками проекта...');
    const availableMembers = membersResponse.data.filter(m => m.id !== pmToken.split('.')[1]); // Исключаем себя
    if (availableMembers.length > 0) {
      const participantIds = availableMembers.slice(0, 2).map(m => m.id); // Берем первых 2 участников
      
      const createChatResponse = await axios.post(`${BASE_URL}/projects/${project.id}/chats`, {
        name: 'Тестовый чат с участниками проекта',
        type: 'group',
        participants: participantIds
      }, {
        headers: { Authorization: `Bearer ${pmToken}` }
      });
      
      console.log('✅ Новый чат создан:', createChatResponse.data.message);
      console.log(`   ID чата: ${createChatResponse.data.chatId}`);
      
      if (createChatResponse.data.chat) {
        console.log(`   Участников в новом чате: ${createChatResponse.data.chat.participants.length}`);
      }
    } else {
      console.log('⚠️ Недостаточно участников для создания чата');
    }

    // 7. Проверяем обновленный список чатов
    console.log('\n7️⃣ Проверяем обновленный список чатов...');
    const updatedChatsResponse = await axios.get(`${BASE_URL}/projects/${project.id}/chats`, {
      headers: { Authorization: `Bearer ${pmToken}` }
    });
    console.log(`✅ Обновленное количество чатов: ${updatedChatsResponse.data.length}`);

    // 8. Тестируем получение всех чатов пользователя (как в frontend)
    console.log('\n8️⃣ Получаем все чаты пользователя...');
    const allChatsResponse = await axios.get(`${BASE_URL}/chats`, {
      headers: { Authorization: `Bearer ${pmToken}` }
    });
    console.log(`✅ Всего чатов пользователя: ${allChatsResponse.data.length}`);
    
    const projectChats = allChatsResponse.data.filter(c => !c.isGlobal);
    const globalChats = allChatsResponse.data.filter(c => c.isGlobal);
    console.log(`   - Проектных чатов: ${projectChats.length}`);
    console.log(`   - Глобальных чатов: ${globalChats.length}`);

    console.log('\n🎉 Тестирование интеграции frontend-backend завершено успешно!');
    console.log('\n📊 Итоги:');
    console.log(`   - Проектов доступно: ${projectsResponse.data.length}`);
    console.log(`   - Участников в проекте: ${membersResponse.data.length}`);
    console.log(`   - Чатов в проекте: ${updatedChatsResponse.data.length}`);
    console.log(`   - Всего чатов пользователя: ${allChatsResponse.data.length}`);

  } catch (error) {
    console.error('❌ Ошибка в тестах:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error(`HTTP Status: ${error.response.status}`);
    }
  }
}

testChatFrontendIntegration(); 