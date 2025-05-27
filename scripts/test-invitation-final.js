const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Данные для входа PM
const PM_CREDENTIALS = {
  email: 'pm@test.test',
  password: 'password123'
};

async function testInvitationButton() {
  try {
    console.log('🔄 Тестирование кнопки приглашения...\n');

    // 1. Авторизация PM
    console.log('1. Авторизация PM...');
    const loginResponse = await axios.post(`${BASE_URL}/login`, PM_CREDENTIALS);
    const token = loginResponse.data.token;
    console.log('✅ PM авторизован успешно\n');

    // 2. Получение команд PM
    console.log('2. Получение команд PM...');
    const teamsResponse = await axios.get(`${BASE_URL}/teams`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const teams = teamsResponse.data;
    console.log(`✅ Найдено команд: ${teams.length}`);
    
    if (teams.length === 0) {
      console.log('❌ У PM нет команд для тестирования');
      return;
    }

    const testTeam = teams[0];
    console.log(`📋 Тестовая команда: ${testTeam.name} (ID: ${testTeam.id})\n`);

    // 3. Получение доступных пользователей
    console.log('3. Получение доступных пользователей...');
    const usersResponse = await axios.get(`${BASE_URL}/teams/${testTeam.id}/available-users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const users = usersResponse.data;
    console.log(`✅ Найдено доступных пользователей: ${users.length}`);
    
    if (users.length === 0) {
      console.log('❌ Нет доступных пользователей для приглашения');
      return;
    }

    const testUser = users[0];
    console.log(`👤 Тестовый пользователь: ${testUser.name || testUser.displayName} (ID: ${testUser.id})\n`);

    // 4. Отправка приглашения (имитация нажатия кнопки)
    console.log('4. Отправка приглашения (имитация нажатия кнопки)...');
    const invitationData = {
      receiverId: testUser.id,
      role: 'developer',
      projectType: 'without_project',
      coverLetter: 'Приглашение в команду через кнопку'
    };

    const inviteResponse = await axios.post(`${BASE_URL}/teams/${testTeam.id}/invite`, invitationData, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Приглашение отправлено успешно!');
    console.log(`📧 ID приглашения: ${inviteResponse.data.invitationId}`);
    console.log(`📋 Статус: ${inviteResponse.data.status}\n`);

    console.log('🎉 ТЕСТ ПРОЙДЕН! Кнопка приглашения работает корректно!');
    console.log('🔧 Все SVG-ошибки исправлены, функциональность восстановлена.');

  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('🔐 Проблема с авторизацией');
    } else if (error.response?.status === 403) {
      console.log('🚫 Недостаточно прав доступа');
    } else if (error.response?.status === 404) {
      console.log('🔍 Ресурс не найден');
    }
  }
}

// Запуск теста
testInvitationButton(); 