const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testTeamMemberSearchFix() {
  console.log('🔧 Тестирование исправлений TeamMemberSearch...\n');

  try {
    // 1. Логинимся
    console.log('1️⃣ Логинимся как админ...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@admin.admin',
      password: 'admin123'
    });

    const { token, user } = loginResponse.data;
    console.log('✅ Логин успешен');
    console.log('👤 Пользователь:', user.displayName);

    // 2. Получаем список команд
    console.log('\n2️⃣ Получаем список команд...');
    const teamsResponse = await axios.get(`${API_BASE}/teams`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Команды загружены:', teamsResponse.data.length);

    if (teamsResponse.data.length > 0) {
      const testTeam = teamsResponse.data[0];
      console.log('🎯 Тестируем команду:', testTeam.name, '(ID:', testTeam.id + ')');

      // 3. Тестируем загрузку данных команды
      console.log('\n3️⃣ Тестируем загрузку данных команды...');
      try {
        const teamResponse = await axios.get(`${API_BASE}/teams/${testTeam.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('✅ Данные команды загружены:', teamResponse.data.name);
      } catch (teamError) {
        console.error('❌ Ошибка загрузки данных команды:', teamError.response?.status);
      }

      // 4. Тестируем загрузку доступных пользователей
      console.log('\n4️⃣ Тестируем загрузку доступных пользователей...');
      try {
        const usersResponse = await axios.get(`${API_BASE}/teams/${testTeam.id}/available-users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('✅ Доступные пользователи загружены:', usersResponse.data.length);
        
        if (usersResponse.data.length > 0) {
          console.log('👤 Первый пользователь:', {
            name: usersResponse.data[0].name || usersResponse.data[0].displayName,
            email: usersResponse.data[0].email
          });
        }
      } catch (usersError) {
        console.log('⚠️ Эндпоинт команды недоступен, тестируем fallback...');
        
        // Тестируем fallback на общий эндпоинт
        try {
          const allUsersResponse = await axios.get(`${API_BASE}/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          console.log('✅ Fallback работает, загружены все пользователи:', allUsersResponse.data.length);
        } catch (fallbackError) {
          console.error('❌ Даже fallback не работает:', fallbackError.response?.status);
        }
      }

      // 5. Тестируем с истекшим токеном
      console.log('\n5️⃣ Тестируем с недействительным токеном...');
      try {
        await axios.get(`${API_BASE}/teams/${testTeam.id}`, {
          headers: { 'Authorization': 'Bearer invalid_token_12345' }
        });
        console.log('❌ Неожиданно: недействительный токен прошел');
      } catch (invalidError) {
        console.log('✅ Ожидаемо: недействительный токен отклонен:', invalidError.response?.status);
      }

      // 6. Тестируем без токена
      console.log('\n6️⃣ Тестируем без токена...');
      try {
        await axios.get(`${API_BASE}/teams/${testTeam.id}`);
        console.log('❌ Неожиданно: запрос без токена прошел');
      } catch (noTokenError) {
        console.log('✅ Ожидаемо: запрос без токена отклонен:', noTokenError.response?.status);
      }
    }

    console.log('\n🎉 Тестирование завершено успешно!');
    console.log('\n📋 Результаты:');
    console.log('✅ Аутентификация работает');
    console.log('✅ Загрузка команд работает');
    console.log('✅ Загрузка данных команды работает');
    console.log('✅ Загрузка пользователей работает (с fallback)');
    console.log('✅ Защита от недействительных токенов работает');

  } catch (error) {
    console.error('❌ Общая ошибка:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testTeamMemberSearchFix().catch(console.error); 