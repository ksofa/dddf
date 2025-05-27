const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testPMTeamsAPI() {
  try {
    console.log('🔐 Авторизация PM пользователя...');
    
    // Авторизация PM
    const loginResponse = await axios.post(`${API_BASE}/login`, {
      email: 'pm@test.test',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ PM авторизован');
    
    // Получение команд
    console.log('\n📋 Получение команд PM...');
    const teamsResponse = await axios.get(`${API_BASE}/teams`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const teams = teamsResponse.data;
    console.log(`Найдено команд: ${teams.length}`);
    
    teams.forEach((team, index) => {
      console.log(`\nКоманда ${index + 1}:`);
      console.log(`  ID: ${team.id}`);
      console.log(`  Название: ${team.name}`);
      console.log(`  Проект ID: ${team.projectId || 'Не указан'}`);
      console.log(`  PM ID: ${team.pmId || 'Не указан'}`);
      console.log(`  Участников: ${team.members ? team.members.length : 0}`);
      
      if (team.members && team.members.length > 0) {
        console.log('  Участники:');
        team.members.forEach(member => {
          console.log(`    - ${member.name || member.email} (${member.role || 'member'})`);
        });
      }
    });
    
    // Проверка доступных пользователей для первой команды
    if (teams.length > 0) {
      console.log(`\n👥 Проверка доступных пользователей для команды "${teams[0].name}"...`);
      
      try {
        const availableUsersResponse = await axios.get(`${API_BASE}/teams/${teams[0].id}/available-users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const availableUsers = availableUsersResponse.data;
        console.log(`Доступно пользователей для приглашения: ${availableUsers.length}`);
        
        if (availableUsers.length > 0) {
          console.log('Первые 3 пользователя:');
          availableUsers.slice(0, 3).forEach(user => {
            console.log(`  - ${user.fullName || user.displayName || user.email} (${user.profession || 'Не указано'})`);
          });
        }
      } catch (error) {
        console.log(`❌ Ошибка получения доступных пользователей: ${error.response?.data?.error || error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.response?.data || error.message);
  }
}

testPMTeamsAPI().then(() => {
  console.log('\n✅ Тестирование завершено');
  process.exit(0);
}).catch(error => {
  console.error('❌ Критическая ошибка:', error);
  process.exit(1);
}); 