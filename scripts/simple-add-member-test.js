const axios = require('axios');

async function simpleAddMemberTest() {
  try {
    console.log('🔐 Авторизация...');
    
    // Авторизация PM
    const loginResponse = await axios.post('http://localhost:3000/api/login', {
      email: 'pm@test.test',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Авторизован');

    // Простой запрос на добавление участника
    console.log('➕ Добавление участника...');
    
    const addMemberResponse = await axios.post(
      'http://localhost:3000/api/teams/ZxSdXUtJjGIn5TNNCC3z/members',
      {
        userId: '3zQmIv378cegrTnz5qydFi6p9JH2',
        role: 'developer'
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Участник добавлен:', addMemberResponse.data);

  } catch (error) {
    console.error('❌ Ошибка:', error.response?.data || error.message);
    if (error.response) {
      console.error('Статус:', error.response.status);
      console.error('Заголовки:', error.response.headers);
    }
  }
}

simpleAddMemberTest(); 