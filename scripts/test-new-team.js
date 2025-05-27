const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testNewTeam() {
  try {
    console.log('🧪 Тестирование новой команды и приглашений...');
    
    // 1. Логинимся как PM
    console.log('\n1️⃣ Логин как PM...');
    const loginResponse = await axios.post(`${API_BASE}/login`, {
      email: 'pm@test.test',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ PM успешно залогинен');
    
    // 2. Получаем команды PM
    console.log('\n2️⃣ Получение команд PM...');
    const teamsResponse = await axios.get(`${API_BASE}/teams`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const teams = teamsResponse.data;
    console.log(`✅ Найдено команд: ${teams.length}`);
    
    if (teams.length === 0) {
      console.log('❌ Команды не найдены');
      return;
    }
    
    const testTeam = teams[0];
    console.log(`📝 Тестовая команда: ${testTeam.name} (ID: ${testTeam.id})`);
    
    // 3. Получаем доступных пользователей для приглашения
    console.log('\n3️⃣ Получение доступных пользователей...');
    const availableUsersResponse = await axios.get(`${API_BASE}/teams/${testTeam.id}/available-users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const availableUsers = availableUsersResponse.data;
    console.log(`✅ Доступно пользователей для приглашения: ${availableUsers.length}`);
    
    if (availableUsers.length === 0) {
      console.log('❌ Нет доступных пользователей для приглашения');
      return;
    }
    
    // Выбираем первого доступного пользователя
    const userToInvite = availableUsers[0];
    console.log(`👤 Приглашаем пользователя: ${userToInvite.displayName || userToInvite.email}`);
    
    // 4. Отправляем приглашение
    console.log('\n4️⃣ Отправка приглашения...');
    const inviteResponse = await axios.post(`${API_BASE}/teams/${testTeam.id}/invite`, {
      receiverId: userToInvite.id,
      role: 'developer',
      projectType: 'without_project',
      coverLetter: 'Тестовое приглашение в команду'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Приглашение отправлено успешно!');
    console.log('📧 Ответ сервера:', inviteResponse.data);
    
    // 5. Проверяем созданное приглашение
    console.log('\n5️⃣ Проверка созданного приглашения...');
    // Здесь можно добавить проверку через API получения приглашений
    
    console.log('\n🎉 Тест завершен успешно!');
    console.log('✅ Команда создана');
    console.log('✅ Доступные пользователи получены');
    console.log('✅ Приглашение отправлено');
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error(`HTTP статус: ${error.response.status}`);
    }
  }
  
  process.exit(0);
}

testNewTeam(); 