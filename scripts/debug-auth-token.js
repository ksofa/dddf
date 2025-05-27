const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function debugAuthToken() {
  console.log('🔍 Диагностика токена аутентификации...\n');

  try {
    // 1. Логинимся как админ
    console.log('1️⃣ Логинимся как админ...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@admin.admin',
      password: 'admin123'
    });

    const { token, user } = loginResponse.data;
    console.log('✅ Логин успешен');
    console.log('👤 Пользователь:', user.displayName);
    console.log('🔑 Токен (первые 50 символов):', token.substring(0, 50) + '...');
    console.log('📋 Роли:', user.roles);

    // 2. Проверяем токен через эндпоинт teams
    console.log('\n2️⃣ Проверяем доступ к командам...');
    const teamsResponse = await axios.get(`${API_BASE}/teams`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Команды загружены:', teamsResponse.data.length);

    if (teamsResponse.data.length > 0) {
      const firstTeam = teamsResponse.data[0];
      console.log('🎯 Первая команда:', firstTeam.name, 'ID:', firstTeam.id);

      // 3. Проверяем доступ к available-users
      console.log('\n3️⃣ Проверяем доступ к available-users...');
      try {
        const usersResponse = await axios.get(`${API_BASE}/teams/${firstTeam.id}/available-users`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('✅ Доступные пользователи загружены:', usersResponse.data.length);
        
        if (usersResponse.data.length > 0) {
          console.log('👥 Первый пользователь:', {
            name: usersResponse.data[0].name,
            email: usersResponse.data[0].email,
            role: usersResponse.data[0].role
          });
        }
      } catch (usersError) {
        console.error('❌ Ошибка загрузки available-users:');
        console.error('Status:', usersError.response?.status);
        console.error('Message:', usersError.response?.data?.error || usersError.message);
      }

      // 4. Проверяем детали команды
      console.log('\n4️⃣ Проверяем детали команды...');
      try {
        const teamDetailsResponse = await axios.get(`${API_BASE}/teams/${firstTeam.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('✅ Детали команды загружены');
        console.log('📊 Участников:', teamDetailsResponse.data.members?.length || 0);
      } catch (teamError) {
        console.error('❌ Ошибка загрузки деталей команды:');
        console.error('Status:', teamError.response?.status);
        console.error('Message:', teamError.response?.data?.error || teamError.message);
      }
    }

    // 5. Проверяем общий эндпоинт пользователей
    console.log('\n5️⃣ Проверяем общий эндпоинт пользователей...');
    try {
      const allUsersResponse = await axios.get(`${API_BASE}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Все пользователи загружены:', allUsersResponse.data.length);
    } catch (allUsersError) {
      console.error('❌ Ошибка загрузки всех пользователей:');
      console.error('Status:', allUsersError.response?.status);
      console.error('Message:', allUsersError.response?.data?.error || allUsersError.message);
    }

  } catch (error) {
    console.error('❌ Общая ошибка:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

debugAuthToken().catch(console.error); 