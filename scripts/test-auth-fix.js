const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testAuthFix() {
  console.log('🔧 Тестирование исправлений аутентификации...\n');

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
    console.log('🔑 Токен получен');

    // 2. Тестируем команды
    console.log('\n2️⃣ Тестируем загрузку команд...');
    const teamsResponse = await axios.get(`${API_BASE}/teams`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Команды загружены:', teamsResponse.data.length);

    if (teamsResponse.data.length > 0) {
      const firstTeam = teamsResponse.data[0];
      console.log('🎯 Тестируем команду:', firstTeam.name);

      // 3. Тестируем available-users
      console.log('\n3️⃣ Тестируем available-users...');
      try {
        const usersResponse = await axios.get(`${API_BASE}/teams/${firstTeam.id}/available-users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('✅ Доступные пользователи загружены:', usersResponse.data.length);
        
        if (usersResponse.data.length > 0) {
          console.log('👥 Первый пользователь:', {
            name: usersResponse.data[0].name || usersResponse.data[0].displayName,
            email: usersResponse.data[0].email
          });
        }
      } catch (usersError) {
        console.error('❌ Ошибка available-users:', usersError.response?.status, usersError.response?.data);
      }

      // 4. Тестируем с недействительным токеном
      console.log('\n4️⃣ Тестируем с недействительным токеном...');
      try {
        await axios.get(`${API_BASE}/teams/${firstTeam.id}/available-users`, {
          headers: { 'Authorization': 'Bearer invalid_token' }
        });
        console.log('❌ Неожиданно: запрос с недействительным токеном прошел');
      } catch (invalidTokenError) {
        console.log('✅ Ожидаемо: недействительный токен отклонен:', invalidTokenError.response?.status);
      }

      // 5. Тестируем без токена
      console.log('\n5️⃣ Тестируем без токена...');
      try {
        await axios.get(`${API_BASE}/teams/${firstTeam.id}/available-users`);
        console.log('❌ Неожиданно: запрос без токена прошел');
      } catch (noTokenError) {
        console.log('✅ Ожидаемо: запрос без токена отклонен:', noTokenError.response?.status);
      }
    }

    // 6. Тестируем общий эндпоинт пользователей
    console.log('\n6️⃣ Тестируем общий эндпоинт пользователей...');
    try {
      const allUsersResponse = await axios.get(`${API_BASE}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ Все пользователи загружены:', allUsersResponse.data.length);
    } catch (allUsersError) {
      console.error('❌ Ошибка загрузки всех пользователей:', allUsersError.response?.status);
    }

    console.log('\n🎉 Тестирование завершено!');

  } catch (error) {
    console.error('❌ Общая ошибка:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testAuthFix().catch(console.error); 