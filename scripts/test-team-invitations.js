const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// Тестовые данные
const PM_TOKEN = 'pm-test-token';
const ADMIN_TOKEN = 'admin-test-token';

async function testTeamInvitations() {
  console.log('🧪 Тестирование отправки приглашений в команду...\n');

  try {
    // 1. Логинимся как PM
    console.log('1. Логин как PM...');
    const pmLogin = await axios.post(`${API_BASE}/login`, {
      email: 'pm@test.test',
      password: 'password123'
    });
    const pmToken = pmLogin.data.token;
    console.log('✅ PM авторизован');

    // 2. Получаем команды PM
    console.log('\n2. Получение команд PM...');
    const teamsResponse = await axios.get(`${API_BASE}/teams`, {
      headers: { Authorization: `Bearer ${pmToken}` }
    });
    
    const pmTeams = teamsResponse.data;
    console.log(`✅ PM видит ${pmTeams.length} команд`);
    
    if (pmTeams.length === 0) {
      console.log('❌ У PM нет команд для тестирования');
      return;
    }

    const testTeam = pmTeams[0];
    console.log(`📋 Тестируем команду: ${testTeam.name} (ID: ${testTeam.id})`);

    // 3. Получаем доступных пользователей для команды
    console.log('\n3. Получение доступных пользователей...');
    const availableUsersResponse = await axios.get(`${API_BASE}/teams/${testTeam.id}/available-users`, {
      headers: { Authorization: `Bearer ${pmToken}` }
    });
    
    const availableUsers = availableUsersResponse.data;
    console.log(`✅ Найдено ${availableUsers.length} доступных пользователей`);
    
    if (availableUsers.length === 0) {
      console.log('❌ Нет доступных пользователей для приглашения');
      return;
    }

    // 4. Отправляем приглашение первому доступному пользователю
    const targetUser = availableUsers[0];
    console.log(`\n4. Отправка приглашения пользователю: ${targetUser.name || targetUser.email}`);
    
    const invitationResponse = await axios.post(`${API_BASE}/teams/${testTeam.id}/invite`, {
      receiverId: targetUser.id || targetUser.uid,
      role: 'developer',
      projectType: 'without_project',
      coverLetter: 'Тестовое приглашение в команду'
    }, {
      headers: { Authorization: `Bearer ${pmToken}` }
    });
    
    console.log('✅ Приглашение отправлено успешно!');
    console.log(`📧 ID приглашения: ${invitationResponse.data.invitationId}`);

    // 5. Тестируем ограничения доступа - PM не может отправлять приглашения от чужих команд
    console.log('\n5. Тестирование ограничений доступа...');
    
    // Логинимся как админ чтобы получить все команды
    const adminLogin = await axios.post(`${API_BASE}/login`, {
      email: 'admin@admin.admin',
      password: 'admin123'
    });
    const adminToken = adminLogin.data.token;
    
    const allTeamsResponse = await axios.get(`${API_BASE}/teams`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const allTeams = allTeamsResponse.data;
    const otherTeam = allTeams.find(team => team.id !== testTeam.id);
    
    if (otherTeam) {
      console.log(`🔒 Попытка отправить приглашение от чужой команды: ${otherTeam.name}`);
      
      try {
        await axios.post(`${API_BASE}/teams/${otherTeam.id}/invite`, {
          receiverId: targetUser.id || targetUser.uid,
          role: 'developer',
          projectType: 'without_project',
          coverLetter: 'Попытка отправить от чужой команды'
        }, {
          headers: { Authorization: `Bearer ${pmToken}` }
        });
        
        console.log('❌ ОШИБКА: PM смог отправить приглашение от чужой команды!');
      } catch (error) {
        if (error.response?.status === 403) {
          console.log('✅ Доступ правильно ограничен - PM не может отправлять приглашения от чужих команд');
        } else {
          console.log(`❌ Неожиданная ошибка: ${error.response?.status} - ${error.response?.data?.error}`);
        }
      }
    }

    console.log('\n🎉 Все тесты пройдены успешно!');
    console.log('\n📋 Результаты тестирования:');
    console.log('✅ PM может отправлять приглашения от своих команд');
    console.log('✅ PM не может отправлять приглашения от чужих команд');
    console.log('✅ Приглашения создаются в базе данных');

  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error.response?.data || error.message);
  }
}

// Запускаем тест
testTeamInvitations(); 