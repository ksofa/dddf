const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function debugChatCreation() {
  try {
    // 1. Логин PM
    console.log('🔐 Логин PM...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'pm@test.test',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ PM залогинен');

    // 2. Получаем проекты
    console.log('\n📋 Получаем проекты...');
    const projectsResponse = await axios.get(`${BASE_URL}/projects`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const project = projectsResponse.data[0];
    console.log(`✅ Используем проект: ${project.title} (${project.id})`);

    // 3. Создаем чат
    console.log('\n💬 Создаем чат...');
    const createChatResponse = await axios.post(`${BASE_URL}/projects/${project.id}/chats`, {
      name: 'Debug Test Chat',
      type: 'group',
      participants: ['QH040Apx3segNZ9zHJrLP8y4UPD2']
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Ответ сервера:');
    console.log(JSON.stringify(createChatResponse.data, null, 2));

    // 4. Получаем список чатов
    console.log('\n📨 Получаем список чатов...');
    const chatsResponse = await axios.get(`${BASE_URL}/projects/${project.id}/chats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ Найдено ${chatsResponse.data.length} чатов:`);
    chatsResponse.data.forEach((chat, index) => {
      console.log(`${index + 1}. ${chat.name} (ID: ${chat.id})`);
    });

  } catch (error) {
    console.error('❌ Ошибка:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error(`HTTP Status: ${error.response.status}`);
    }
  }
}

debugChatCreation(); 