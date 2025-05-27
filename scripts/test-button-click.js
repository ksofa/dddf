const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testButtonFunctionality() {
  console.log('🧪 Тестирование функциональности кнопки приглашения...\\n');

  try {
    // 1. Проверяем, что сервер работает
    console.log('1. Проверка работы сервера...');
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log('✅ Сервер работает:', healthResponse.data);

    // 2. Логинимся как PM
    console.log('\\n2. Логин как PM...');
    const pmLogin = await axios.post(`${API_BASE}/login`, {
      email: 'pm@test.test',
      password: 'password123'
    });
    const pmToken = pmLogin.data.token;
    console.log('✅ PM авторизован');

    // 3. Получаем команды PM
    console.log('\\n3. Получение команд PM...');
    const teamsResponse = await axios.get(`${API_BASE}/teams`, {
      headers: { Authorization: `Bearer ${pmToken}` }
    });
    
    const pmTeams = teamsResponse.data;
    console.log(`✅ Найдено команд: ${pmTeams.length}`);
    
    if (pmTeams.length === 0) {
      console.log('❌ У PM нет команд для тестирования');
      return;
    }

    const testTeam = pmTeams[0];
    console.log(`📋 Тестируем команду: ${testTeam.name || testTeam.title} (ID: ${testTeam.id})`);

    // 4. Получаем доступных пользователей для команды
    console.log('\\n4. Получение доступных пользователей...');
    const usersResponse = await axios.get(`${API_BASE}/teams/${testTeam.id}/available-users`, {
      headers: { Authorization: `Bearer ${pmToken}` }
    });
    
    const availableUsers = usersResponse.data;
    console.log(`✅ Найдено доступных пользователей: ${availableUsers.length}`);
    
    if (availableUsers.length === 0) {
      console.log('❌ Нет доступных пользователей для приглашения');
      return;
    }

    // 5. Тестируем отправку приглашения
    console.log('\\n5. Тестирование отправки приглашения...');
    const testUser = availableUsers[0];
    console.log(`👤 Отправляем приглашение пользователю: ${testUser.name || testUser.email}`);
    
    const inviteResponse = await axios.post(`${API_BASE}/teams/${testTeam.id}/invite`, {
      receiverId: testUser.id || testUser.uid,
      role: 'developer',
      projectType: 'without_project',
      coverLetter: 'Тестовое приглашение в команду'
    }, {
      headers: { Authorization: `Bearer ${pmToken}` }
    });
    
    console.log('✅ Приглашение отправлено успешно:', inviteResponse.data);
    
    console.log('\\n🎉 Все тесты прошли успешно!');
    console.log('\\n📝 Результаты:');
    console.log(`   - Сервер работает: ✅`);
    console.log(`   - PM может авторизоваться: ✅`);
    console.log(`   - PM видит свои команды: ✅ (${pmTeams.length} команд)`);
    console.log(`   - PM может получить список пользователей: ✅ (${availableUsers.length} пользователей)`);
    console.log(`   - PM может отправить приглашение: ✅`);

  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error.response?.data || error.message);
    
    if (error.response) {
      console.log('\\n📊 Детали ошибки:');
      console.log(`   - Статус: ${error.response.status}`);
      console.log(`   - Сообщение: ${error.response.data?.message || error.response.data}`);
      console.log(`   - URL: ${error.config?.url}`);
    }
  }
}

testButtonFunctionality(); 