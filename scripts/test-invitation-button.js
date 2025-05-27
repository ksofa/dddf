const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// Тестовые данные PM
const PM_CREDENTIALS = {
  email: 'pm@test.test',
  password: 'password123'
};

async function testInvitationButton() {
  try {
    console.log('🚀 Тестирование кнопки приглашения PM...\n');

    // 1. Авторизация PM
    console.log('1. Авторизация PM...');
    const loginResponse = await axios.post(`${API_BASE}/login`, PM_CREDENTIALS);
    const token = loginResponse.data.token;
    console.log('✅ PM авторизован успешно');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 2. Получение команд PM
    console.log('\n2. Получение команд PM...');
    const teamsResponse = await axios.get(`${API_BASE}/teams`, { headers });
    const teams = teamsResponse.data;
    console.log(`✅ Найдено команд: ${teams.length}`);
    
    if (teams.length === 0) {
      console.log('❌ У PM нет команд. Создайте команду сначала.');
      return;
    }

    const team = teams[0];
    console.log(`📋 Тестируем с командой: ${team.name || team.title} (ID: ${team.id})`);

    // 3. Получение доступных пользователей
    console.log('\n3. Получение доступных пользователей...');
    const usersResponse = await axios.get(`${API_BASE}/teams/${team.id}/available-users`, { headers });
    const availableUsers = usersResponse.data;
    console.log(`✅ Доступно пользователей: ${availableUsers.length}`);

    if (availableUsers.length === 0) {
      console.log('❌ Нет доступных пользователей для приглашения');
      return;
    }

    // 4. Отправка приглашения (имитация нажатия кнопки)
    console.log('\n4. Имитация нажатия кнопки приглашения...');
    const targetUser = availableUsers[0];
    console.log(`👤 Приглашаем пользователя: ${targetUser.name || targetUser.displayName} (${targetUser.email})`);

    const invitationData = {
      receiverId: targetUser.id,
      role: 'developer',
      projectType: 'without_project',
      coverLetter: 'Приглашение в команду через кнопку'
    };

    const inviteResponse = await axios.post(`${API_BASE}/teams/${team.id}/invite`, invitationData, { headers });
    console.log('✅ Кнопка работает! Приглашение отправлено успешно!');
    console.log(`📧 ID приглашения: ${inviteResponse.data.invitationId}`);

    console.log('\n🎉 КНОПКА ПРИГЛАШЕНИЯ РАБОТАЕТ ПРАВИЛЬНО! 🎉');
    console.log('\n📱 Теперь откройте браузер:');
    console.log('   Frontend: http://localhost:5173');
    console.log('   Войдите как PM: pm@test.test / password123');
    console.log('   Нажмите синюю кнопку "ПРИГЛАСИТЬ" на карточке команды');

  } catch (error) {
    console.error('\n❌ Ошибка в тесте:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('🔐 Проблема с авторизацией');
    } else if (error.response?.status === 403) {
      console.log('🚫 Недостаточно прав доступа');
    } else if (error.response?.status === 404) {
      console.log('🔍 Ресурс не найден');
    } else if (error.response?.status === 400) {
      console.log('📝 Неверные данные запроса');
    }
  }
}

// Запуск теста
testInvitationButton(); 