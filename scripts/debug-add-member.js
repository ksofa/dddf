const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function debugAddMember() {
  try {
    console.log('🔐 Авторизация PM пользователя...');
    
    // Авторизация PM
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'pm@test.test',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    console.log('✅ PM авторизован');

    // Получаем команды PM
    const teamsResponse = await axios.get(`${API_BASE}/teams`, { headers });
    const teams = teamsResponse.data;
    const firstTeam = teams[0];

    console.log(`📋 Команда: ${firstTeam.name} (ID: ${firstTeam.id})`);

    // Получаем доступных пользователей
    const usersResponse = await axios.get(`${API_BASE}/teams/${firstTeam.id}/available-users`, { headers });
    const availableUsers = usersResponse.data;
    
    if (availableUsers.length === 0) {
      console.log('❌ Нет доступных пользователей');
      return;
    }

    const testUser = availableUsers[0];
    console.log(`👤 Тестовый пользователь: ${testUser.name} (ID: ${testUser.id})`);

    // Получаем детали команды перед добавлением
    console.log('\n📊 Состояние команды до добавления:');
    try {
      const teamDetailsResponse = await axios.get(`${API_BASE}/teams/${firstTeam.id}`, { headers });
      const teamDetails = teamDetailsResponse.data;
      console.log(`   Участников: ${(teamDetails.members || []).length}`);
      console.log(`   PM ID: ${teamDetails.pmId}`);
      console.log(`   Team Lead: ${teamDetails.teamLead || 'Не указан'}`);
    } catch (error) {
      console.log('❌ Ошибка получения деталей команды:', error.response?.data || error.message);
    }

    // Пытаемся добавить пользователя
    console.log('\n➕ Попытка добавления пользователя...');
    try {
      const addResponse = await axios.post(`${API_BASE}/teams/${firstTeam.id}/members`, {
        userId: testUser.id,
        role: 'developer'
      }, { headers });

      console.log('✅ Пользователь успешно добавлен');
      console.log('   Ответ:', JSON.stringify(addResponse.data, null, 2));
    } catch (addError) {
      console.log('❌ Ошибка добавления пользователя:');
      console.log('   Статус:', addError.response?.status);
      console.log('   Данные:', JSON.stringify(addError.response?.data, null, 2));
      console.log('   Заголовки:', JSON.stringify(addError.response?.headers, null, 2));
      
      // Дополнительная диагностика
      if (addError.response?.status === 500) {
        console.log('\n🔍 Дополнительная диагностика:');
        console.log('   - Проверьте логи сервера');
        console.log('   - Возможно проблема с Firestore');
        console.log('   - Проверьте структуру данных пользователя');
      }
    }

  } catch (error) {
    console.error('❌ Общая ошибка:', error.response?.data || error.message);
  }
}

debugAddMember(); 