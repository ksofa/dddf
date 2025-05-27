const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testSimpleInvitation() {
  try {
    console.log('🔐 Авторизация...');
    
    // Авторизация
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@test.com',
      password: 'admin123'
    });
    const token = loginResponse.data.token;
    console.log('✅ Авторизация успешна');

    // Получаем команду
    const teamsResponse = await axios.get(`${API_BASE_URL}/teams`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const teams = teamsResponse.data;
    const testTeam = teams[0];
    console.log(`📊 Тестируем команду: ${testTeam.name} (ID: ${testTeam.id})`);

    // Получаем пользователей
    const usersResponse = await axios.get(`${API_BASE_URL}/teams/${testTeam.id}/available-users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const users = usersResponse.data;
    const testUser = users[0];
    console.log(`👤 Тестируем приглашение для: ${testUser.fullName || testUser.displayName} (${testUser.email})`);

    // Простое приглашение без файла
    console.log('\n📤 Отправка простого приглашения...');
    
    const invitationData = {
      receiverId: testUser.id,
      projectType: 'with_project',
      rate: '120000-200000',
      startDate: '2024-02-01',
      estimatedDuration: '3',
      estimatedDurationUnit: 'months',
      coverLetter: 'Тестовое приглашение'
    };

    console.log('📋 Данные приглашения:', invitationData);

    const invitationResponse = await axios.post(
      `${API_BASE_URL}/teams/${testTeam.id}/invite`,
      invitationData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Приглашение отправлено успешно!');
    console.log('📊 Результат:', invitationResponse.data);

  } catch (error) {
    console.error('❌ Ошибка тестирования:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testSimpleInvitation(); 