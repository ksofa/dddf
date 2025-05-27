const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function createPMTeam() {
  console.log('🏗️ Создание команды для PM\n');

  try {
    // Логинимся как PM
    console.log('1️⃣ Логин как PM...');
    const loginResponse = await axios.post(`${API_BASE}/login`, {
      email: 'pm@test.test',
      password: 'password123'
    });
    
    const pmToken = loginResponse.data.token;
    const pmUserId = loginResponse.data.user.uid;
    console.log(`✅ PM успешно залогинился (ID: ${pmUserId})\n`);

    // Создаем команду
    console.log('2️⃣ Создание команды...');
    const teamData = {
      name: 'PM Test Team',
      description: 'Тестовая команда для проверки прав доступа PM',
      projectId: null
    };

    const createResponse = await axios.post(`${API_BASE}/teams`, teamData, {
      headers: {
        'Authorization': `Bearer ${pmToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Команда создана с ID: ${createResponse.data.id}`);
    console.log(`✅ Название: ${createResponse.data.name}\n`);

    // Проверяем, что PM теперь видит свою команду
    console.log('3️⃣ Проверка видимости команды...');
    const teamsResponse = await axios.get(`${API_BASE}/teams`, {
      headers: {
        'Authorization': `Bearer ${pmToken}`
      }
    });
    
    console.log(`✅ PM теперь видит ${teamsResponse.data.length} команд`);
    
    const pmTeams = teamsResponse.data.filter(team => team.pmId === pmUserId);
    console.log(`✅ Из них ${pmTeams.length} команд принадлежат PM`);
    
    if (pmTeams.length === teamsResponse.data.length) {
      console.log('✅ PM видит только свои команды - КОРРЕКТНО\n');
    } else {
      console.log('❌ PM видит чужие команды - ОШИБКА\n');
    }

    // Тестируем доступ к available-users для своей команды
    console.log('4️⃣ Тестирование доступа к пользователям своей команды...');
    try {
      const usersResponse = await axios.get(`${API_BASE}/teams/${createResponse.data.id}/available-users`, {
        headers: {
          'Authorization': `Bearer ${pmToken}`
        }
      });
      
      console.log(`✅ PM может получить ${usersResponse.data.length} доступных пользователей для своей команды\n`);
    } catch (error) {
      console.log(`❌ Ошибка при получении пользователей: ${error.response?.data?.error}\n`);
    }

    // Логинимся как другой PM для проверки изоляции
    console.log('5️⃣ Проверка изоляции - логин как другой пользователь...');
    try {
      const adminLoginResponse = await axios.post(`${API_BASE}/login`, {
        email: 'admin@admin.admin',
        password: 'admin123'
      });
      
      const adminToken = adminLoginResponse.data.token;
      
      // Пытаемся получить пользователей для команды PM от имени админа
      const adminUsersResponse = await axios.get(`${API_BASE}/teams/${createResponse.data.id}/available-users`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      
      console.log(`✅ Админ может получить ${adminUsersResponse.data.length} пользователей (админ имеет доступ ко всем командам)\n`);
    } catch (error) {
      console.log(`❌ Ошибка при проверке доступа админа: ${error.response?.data?.error}\n`);
    }

    console.log('🎉 Тестирование завершено успешно!');
    console.log(`📝 Создана команда: ${createResponse.data.name} (ID: ${createResponse.data.id})`);

  } catch (error) {
    console.error('❌ Ошибка:', error.response?.data || error.message);
  }
}

// Запускаем создание команды
createPMTeam(); 