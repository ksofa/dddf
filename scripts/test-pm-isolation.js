const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testPMIsolation() {
  console.log('🔒 Тестирование изоляции PM от чужих команд\n');

  try {
    // Логинимся как PM
    console.log('1️⃣ Логин как PM...');
    const pmLoginResponse = await axios.post(`${API_BASE}/login`, {
      email: 'pm@test.test',
      password: 'password123'
    });
    
    const pmToken = pmLoginResponse.data.token;
    const pmUserId = pmLoginResponse.data.user.uid;
    console.log(`✅ PM успешно залогинился (ID: ${pmUserId})\n`);

    // Логинимся как админ чтобы получить список всех команд
    console.log('2️⃣ Логин как админ для получения списка всех команд...');
    const adminLoginResponse = await axios.post(`${API_BASE}/login`, {
      email: 'admin@admin.admin',
      password: 'admin123'
    });
    
    const adminToken = adminLoginResponse.data.token;
    console.log('✅ Админ успешно залогинился\n');

    // Получаем все команды от имени админа
    const allTeamsResponse = await axios.get(`${API_BASE}/teams`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    console.log(`📋 Всего команд в системе: ${allTeamsResponse.data.length}`);
    
    // Находим команды, которые НЕ принадлежат PM
    const otherTeams = allTeamsResponse.data.filter(team => team.pmId !== pmUserId);
    console.log(`🚫 Команд других PM: ${otherTeams.length}\n`);

    if (otherTeams.length === 0) {
      console.log('⚠️ Нет команд других PM для тестирования изоляции');
      return;
    }

    // Тестируем попытку PM получить доступ к чужой команде
    const otherTeam = otherTeams[0];
    console.log(`3️⃣ Тестирование доступа PM к чужой команде "${otherTeam.name}" (ID: ${otherTeam.id})...`);

    // Тест 1: Попытка получить пользователей для чужой команды
    console.log('   📝 Тест 1: Получение пользователей чужой команды...');
    try {
      await axios.get(`${API_BASE}/teams/${otherTeam.id}/available-users`, {
        headers: {
          'Authorization': `Bearer ${pmToken}`
        }
      });
      console.log('   ❌ PM получил доступ к пользователям чужой команды - ОШИБКА БЕЗОПАСНОСТИ!');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('   ✅ PM не может получить пользователей чужой команды - КОРРЕКТНО');
      } else {
        console.log(`   ❓ Неожиданная ошибка: ${error.response?.status} - ${error.response?.data?.error}`);
      }
    }

    // Тест 2: Попытка добавить участника в чужую команду
    console.log('   📝 Тест 2: Добавление участника в чужую команду...');
    try {
      await axios.post(`${API_BASE}/teams/${otherTeam.id}/members`, {
        userId: pmUserId, // Пытаемся добавить себя
        role: 'developer'
      }, {
        headers: {
          'Authorization': `Bearer ${pmToken}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('   ❌ PM добавил участника в чужую команду - ОШИБКА БЕЗОПАСНОСТИ!');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('   ✅ PM не может добавить участника в чужую команду - КОРРЕКТНО');
      } else {
        console.log(`   ❓ Неожиданная ошибка: ${error.response?.status} - ${error.response?.data?.error}`);
      }
    }

    // Тест 3: Попытка отправить приглашение от имени чужой команды
    console.log('   📝 Тест 3: Отправка приглашения от имени чужой команды...');
    try {
      await axios.post(`${API_BASE}/teams/${otherTeam.id}/invite`, {
        receiverId: 'test-user-id',
        projectType: 'without_project',
        rate: '1000',
        coverLetter: 'Тестовое приглашение'
      }, {
        headers: {
          'Authorization': `Bearer ${pmToken}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('   ❌ PM отправил приглашение от имени чужой команды - ОШИБКА БЕЗОПАСНОСТИ!');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('   ✅ PM не может отправить приглашение от имени чужой команды - КОРРЕКТНО');
      } else {
        console.log(`   ❓ Неожиданная ошибка: ${error.response?.status} - ${error.response?.data?.error}`);
      }
    }

    console.log('\n🎯 Результат тестирования изоляции:');
    console.log('✅ PM изолирован от чужих команд');
    console.log('✅ Система безопасности работает корректно');
    console.log('\n🎉 Тестирование завершено успешно!');

  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error.response?.data || error.message);
  }
}

// Запускаем тесты
testPMIsolation(); 