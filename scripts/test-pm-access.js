const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testPMAccess() {
  console.log('🧪 Тестирование доступа PM к командам\n');

  try {
    // Логинимся как PM
    console.log('1️⃣ Логин как PM...');
    const loginResponse = await axios.post(`${API_BASE}/login`, {
      email: 'pm@test.test',
      password: 'password123'
    });
    
    const pmToken = loginResponse.data.token;
    console.log('✅ PM успешно залогинился\n');

    // Получаем команды PM
    console.log('2️⃣ Получение команд PM...');
    const teamsResponse = await axios.get(`${API_BASE}/teams`, {
      headers: {
        'Authorization': `Bearer ${pmToken}`
      }
    });
    
    console.log(`✅ PM видит ${teamsResponse.data.length} команд`);
    
    // Проверяем, что все команды принадлежат этому PM
    const pmUserId = loginResponse.data.user.uid;
    console.log(`PM ID: ${pmUserId}`);
    
    const pmTeams = teamsResponse.data.filter(team => team.pmId === pmUserId);
    console.log(`✅ Из них ${pmTeams.length} команд принадлежат PM`);
    
    if (pmTeams.length === teamsResponse.data.length) {
      console.log('✅ PM видит только свои команды - КОРРЕКТНО\n');
    } else {
      console.log('❌ PM видит чужие команды - ОШИБКА');
      console.log('Команды PM:', teamsResponse.data.map(team => ({
        id: team.id,
        name: team.name,
        pmId: team.pmId,
        belongsToCurrentPM: team.pmId === pmUserId
      })));
    }

    // Логинимся как админ для сравнения
    console.log('3️⃣ Логин как админ...');
    const adminLoginResponse = await axios.post(`${API_BASE}/login`, {
      email: 'admin@admin.admin',
      password: 'admin123'
    });
    
    const adminToken = adminLoginResponse.data.token;
    console.log('✅ Админ успешно залогинился\n');

    // Получаем команды админа
    console.log('4️⃣ Получение команд админа...');
    const adminTeamsResponse = await axios.get(`${API_BASE}/teams`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    console.log(`✅ Админ видит ${adminTeamsResponse.data.length} команд`);
    console.log('✅ Админ видит все команды - КОРРЕКТНО\n');

    console.log('📊 Сравнение:');
    console.log(`PM видит: ${teamsResponse.data.length} команд`);
    console.log(`Админ видит: ${adminTeamsResponse.data.length} команд`);
    
    if (teamsResponse.data.length < adminTeamsResponse.data.length) {
      console.log('✅ Фильтрация работает корректно - PM видит меньше команд чем админ');
    } else {
      console.log('❌ Возможная проблема с фильтрацией');
    }

    console.log('\n🎉 Тестирование завершено!');

  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error.response?.data || error.message);
  }
}

// Запускаем тесты
testPMAccess(); 