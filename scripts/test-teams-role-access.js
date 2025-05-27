const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Тестовые пользователи
const PM_USER = {
  email: 'pm@test.test',
  password: 'password123'
};

const EXECUTOR_USER = {
  email: 'executor5@test.test', 
  password: 'password123'
};

const ADMIN_USER = {
  email: 'admin@admin.admin',
  password: 'password123'
};

async function login(email, password) {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email,
      password
    });
    return response.data.token;
  } catch (error) {
    console.error(`Login failed for ${email}:`, error.response?.data || error.message);
    throw error;
  }
}

async function testTeamsRoleAccess() {
  console.log('🧪 Тестирование доступа к командам по ролям...\n');

  try {
    // 1. Тест для PM
    console.log('1️⃣ Тестирование доступа PM...');
    const pmToken = await login(PM_USER.email, PM_USER.password);
    
    const pmTeamsResponse = await axios.get(`${BASE_URL}/teams`, {
      headers: { Authorization: `Bearer ${pmToken}` }
    });
    
    console.log(`✅ PM видит ${pmTeamsResponse.data.length} команд(ы)`);
    pmTeamsResponse.data.forEach(team => {
      console.log(`   - ${team.name} (участников: ${team.members?.length || 0})`);
    });
    console.log();

    // 2. Тест для Executor
    console.log('2️⃣ Тестирование доступа Executor...');
    const executorToken = await login(EXECUTOR_USER.email, EXECUTOR_USER.password);
    
    const executorTeamsResponse = await axios.get(`${BASE_URL}/teams`, {
      headers: { Authorization: `Bearer ${executorToken}` }
    });
    
    console.log(`✅ Executor видит ${executorTeamsResponse.data.length} команд(ы)`);
    executorTeamsResponse.data.forEach(team => {
      console.log(`   - ${team.name} (участников: ${team.members?.length || 0})`);
    });
    console.log();

    // 3. Тест для Admin
    console.log('3️⃣ Тестирование доступа Admin...');
    const adminToken = await login(ADMIN_USER.email, ADMIN_USER.password);
    
    const adminTeamsResponse = await axios.get(`${BASE_URL}/teams`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log(`✅ Admin видит ${adminTeamsResponse.data.length} команд(ы)`);
    adminTeamsResponse.data.forEach(team => {
      console.log(`   - ${team.name} (участников: ${team.members?.length || 0})`);
    });
    console.log();

    // 4. Сравнение результатов
    console.log('📊 Сравнение доступа:');
    console.log(`   PM: ${pmTeamsResponse.data.length} команд`);
    console.log(`   Executor: ${executorTeamsResponse.data.length} команд`);
    console.log(`   Admin: ${adminTeamsResponse.data.length} команд`);
    
    // Проверяем логику
    if (adminTeamsResponse.data.length >= pmTeamsResponse.data.length) {
      console.log('✅ Admin видит больше или равно команд, чем PM - корректно');
    } else {
      console.log('❌ Admin должен видеть больше команд, чем PM');
    }
    
    if (executorTeamsResponse.data.length <= pmTeamsResponse.data.length) {
      console.log('✅ Executor видит меньше или равно команд, чем PM - корректно');
    } else {
      console.log('❌ Executor не должен видеть больше команд, чем PM');
    }

    console.log('\n🎉 Тестирование завершено!');

  } catch (error) {
    console.error('❌ Ошибка в тестах:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error(`HTTP Status: ${error.response.status}`);
    }
  }
}

// Запуск тестов
testTeamsRoleAccess(); 