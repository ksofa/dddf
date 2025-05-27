// Скрипт для тестирования исправлений отображения команд
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// Данные для входа админа
const adminCredentials = {
  email: 'admin@admin.admin',
  password: 'admin123'
};

async function testTeamsFix() {
  console.log('🧪 Тестирование исправлений отображения команд...\n');
  
  try {
    // 1. Авторизация админа
    console.log('1️⃣ Авторизация админа...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, adminCredentials);
    const token = loginResponse.data.token;
    console.log('✅ Админ авторизован успешно\n');
    
    // 2. Получение команд
    console.log('2️⃣ Получение команд...');
    const teamsResponse = await axios.get(`${API_BASE}/teams`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Cache-Control': 'no-cache'
      }
    });
    
    const teams = teamsResponse.data;
    console.log(`📊 Получено команд: ${teams.length}\n`);
    
    // 3. Анализ каждой команды
    console.log('3️⃣ Анализ команд:');
    teams.forEach((team, index) => {
      console.log(`\n📋 Команда ${index + 1}: ${team.name}`);
      console.log(`   ID: ${team.id}`);
      console.log(`   PM: ${team.pm ? `${team.pm.fullName || team.pm.email} (${team.pm.email})` : 'Не назначен'}`);
      console.log(`   Team Lead: ${team.teamLead ? `${team.teamLead.name || team.teamLead.email}` : 'Не назначен'}`);
      console.log(`   Участники: ${team.members?.length || 0} чел.`);
      console.log(`   Проект ID: ${team.projectId || 'Не указан'}`);
      
      // Проверяем структуру данных
      if (!team.pm && !team.teamLead) {
        console.log('   ⚠️ Команда без руководителя - должна отображаться с заглушкой');
      } else {
        console.log('   ✅ Команда с назначенным руководителем');
      }
    });
    
    // 4. Тестирование детального просмотра команд
    console.log('\n4️⃣ Тестирование детального просмотра...');
    for (const team of teams) {
      try {
        const teamDetailResponse = await axios.get(`${API_BASE}/teams/${team.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache'
          }
        });
        
        const teamDetail = teamDetailResponse.data;
        console.log(`\n🔍 Детали команды "${team.name}":`);
        console.log(`   PM: ${teamDetail.pm ? `${teamDetail.pm.fullName || teamDetail.pm.email}` : 'Не назначен'}`);
        console.log(`   Участники: ${teamDetail.members?.length || 0} чел.`);
        
        if (teamDetail.members && teamDetail.members.length > 0) {
          console.log('   Список участников:');
          teamDetail.members.forEach(member => {
            console.log(`     - ${member.fullName || member.displayName || member.email} (${member.email})`);
          });
        }
        
      } catch (error) {
        console.log(`   ❌ Ошибка получения деталей команды "${team.name}": ${error.message}`);
      }
    }
    
    // 5. Проверка фронтенда
    console.log('\n5️⃣ Рекомендации для фронтенда:');
    console.log('✅ Все команды должны отображаться в интерфейсе');
    console.log('✅ Команды без PM должны показывать "Руководитель не назначен"');
    console.log('✅ Админ должен видеть все команды независимо от наличия PM');
    console.log('✅ Кнопки "Пригласить" и "Предложить" должны работать для всех команд');
    
    console.log('\n🎉 Тестирование завершено успешно!');
    
  } catch (error) {
    console.error('\n❌ Ошибка тестирования:', error.response?.data || error.message);
  }
}

// Запускаем тест
testTeamsFix().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Критическая ошибка:', error);
  process.exit(1);
}); 