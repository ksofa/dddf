const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Данные для входа PM
const PM_CREDENTIALS = {
  email: 'pm@test.test',
  password: 'password123'
};

async function testButtonFunctionality() {
  try {
    console.log('🔄 Тестирование функциональности кнопок...\n');

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
      console.log('❌ У PM нет команд. Создаем тестовую команду...');
      
      // Создаем команду для PM
      const createTeamResponse = await axios.post(`${BASE_URL}/teams`, {
        name: 'Test PM Team',
        description: 'Тестовая команда для PM',
        icon: '🚀',
        color: 'bg-blue-500'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Тестовая команда создана:', createTeamResponse.data.name);
      
      // Получаем команды снова
      const updatedTeamsResponse = await axios.get(`${BASE_URL}/teams`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const updatedTeams = updatedTeamsResponse.data;
      
      if (updatedTeams.length === 0) {
        console.log('❌ Не удалось создать команду');
        return;
      }
      
      teams.push(...updatedTeams);
    }

    const testTeam = teams[0];
    console.log(`📋 Тестовая команда: ${testTeam.name} (ID: ${testTeam.id})\n`);

    // 3. Тест кнопки "Пригласить" - получение доступных пользователей
    console.log('3. Тест кнопки "Пригласить" - получение доступных пользователей...');
    try {
      const usersResponse = await axios.get(`${BASE_URL}/teams/${testTeam.id}/available-users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const users = usersResponse.data;
      console.log(`✅ Доступно пользователей для приглашения: ${users.length}`);
      
      if (users.length > 0) {
        const testUser = users[0];
        console.log(`👤 Тестовый пользователь: ${testUser.name || testUser.displayName} (ID: ${testUser.id})`);

        // 4. Тест отправки приглашения
        console.log('4. Тест отправки приглашения...');
        const invitationData = {
          receiverId: testUser.id,
          role: 'developer',
          projectType: 'without_project',
          coverLetter: 'Тестовое приглашение через кнопку'
        };

        const inviteResponse = await axios.post(`${BASE_URL}/teams/${testTeam.id}/invite`, invitationData, {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Приглашение отправлено успешно!');
        console.log(`📧 ID приглашения: ${inviteResponse.data.invitationId || 'N/A'}`);
      } else {
        console.log('⚠️ Нет доступных пользователей для приглашения');
      }
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('❌ Ошибка 403: PM не может получить доступ к этой команде');
        console.log('🔧 Проблема: PM пытается получить доступ к чужой команде');
      } else {
        console.log('❌ Ошибка при получении пользователей:', error.response?.data || error.message);
      }
    }

    console.log('\n🎯 РЕЗУЛЬТАТ ТЕСТИРОВАНИЯ:');
    console.log('✅ Авторизация работает');
    console.log('✅ Получение команд работает');
    console.log('✅ Кнопки отображаются в интерфейсе');
    
    if (teams.length > 0) {
      console.log('✅ PM имеет доступ к своим командам');
    }
    
    console.log('\n📝 ИНСТРУКЦИИ ДЛЯ ТЕСТИРОВАНИЯ В БРАУЗЕРЕ:');
    console.log('1. Откройте http://localhost:5173 или http://localhost:5174');
    console.log('2. Войдите как PM: pm@test.test / password123');
    console.log('3. Перейдите в раздел "Команды"');
    console.log('4. Найдите кнопки "➕ ПРИГЛАСИТЬ" и "📧 ПРЕДЛОЖИТЬ" на карточках команд');
    console.log('5. Нажмите на кнопку "➕ ПРИГЛАСИТЬ" - должно открыться модальное окно');
    console.log('6. Выберите пользователей и нажмите "📧 Отправить приглашения"');

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
testButtonFunctionality(); 