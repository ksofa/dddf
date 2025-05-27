const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testMemberSearch() {
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
    console.log('\n📋 Получение команд PM...');
    const teamsResponse = await axios.get(`${API_BASE}/teams`, { headers });
    const teams = teamsResponse.data;

    if (teams.length === 0) {
      console.log('❌ У PM нет команд');
      return;
    }

    const firstTeam = teams[0];
    console.log(`✅ Найдена команда: ${firstTeam.name} (ID: ${firstTeam.id})`);

    // Тестируем поиск доступных пользователей
    console.log('\n👥 Поиск доступных пользователей...');
    const usersResponse = await axios.get(`${API_BASE}/teams/${firstTeam.id}/available-users`, { headers });
    const availableUsers = usersResponse.data;

    console.log(`✅ Найдено доступных пользователей: ${availableUsers.length}`);
    
    if (availableUsers.length > 0) {
      console.log('\nПервые 3 пользователя:');
      availableUsers.slice(0, 3).forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.name || user.email} (${user.specialization || 'Не указано'})`);
      });

      // Тестируем добавление пользователя в команду
      const testUser = availableUsers[0];
      console.log(`\n➕ Добавление пользователя ${testUser.name} в команду...`);
      
      try {
        const addResponse = await axios.post(`${API_BASE}/teams/${firstTeam.id}/members`, {
          userId: testUser.id,
          role: 'developer'
        }, { headers });

        console.log('✅ Пользователь успешно добавлен в команду');
        console.log(`   Ответ: ${addResponse.data.message}`);
      } catch (addError) {
        if (addError.response?.status === 400 && addError.response?.data?.error?.includes('already a team member')) {
          console.log('ℹ️  Пользователь уже является участником команды');
        } else {
          console.log('❌ Ошибка добавления пользователя:', addError.response?.data?.error || addError.message);
        }
      }

      // Тестируем отправку приглашения
      console.log(`\n📧 Отправка приглашения пользователю ${testUser.name}...`);
      
      try {
        const inviteResponse = await axios.post(`${API_BASE}/teams/${firstTeam.id}/invite`, {
          receiverId: testUser.id,
          projectType: 'with_project',
          coverLetter: 'Приглашение в команду для тестирования'
        }, { headers });

        console.log('✅ Приглашение успешно отправлено');
        console.log(`   ID приглашения: ${inviteResponse.data.invitationId}`);
      } catch (inviteError) {
        console.log('❌ Ошибка отправки приглашения:', inviteError.response?.data?.error || inviteError.message);
      }
    }

    // Тестируем поиск с фильтром
    console.log('\n🔍 Тестирование поиска с фильтром...');
    try {
      const searchResponse = await axios.get(`${API_BASE}/teams/${firstTeam.id}/available-users?search=test`, { headers });
      console.log(`✅ Поиск по "test": найдено ${searchResponse.data.length} пользователей`);
    } catch (searchError) {
      console.log('❌ Ошибка поиска:', searchError.response?.data?.error || searchError.message);
    }

    console.log('\n✅ Тестирование функциональности поиска участников завершено');

  } catch (error) {
    console.error('❌ Ошибка тестирования:', error.response?.data || error.message);
  }
}

testMemberSearch(); 