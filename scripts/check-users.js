const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// Тестовые данные админа
const ADMIN_CREDENTIALS = {
  email: 'admin@admin.admin',
  password: 'password123'
};

async function checkUsers() {
  try {
    console.log('🔍 Проверка пользователей в системе\n');

    // Авторизация админа
    console.log('1. Авторизация админа...');
    const adminLoginResponse = await axios.post(`${API_BASE}/auth/login`, ADMIN_CREDENTIALS);
    const adminToken = adminLoginResponse.data.token;
    console.log('✅ Админ успешно авторизован');

    // Получение списка пользователей
    console.log('\n2. Получение списка пользователей...');
    const usersResponse = await axios.get(`${API_BASE}/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const users = usersResponse.data;
    console.log(`✅ Найдено ${users.length} пользователей:\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.displayName || user.fullName || 'Без имени'}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   UID: ${user.uid || user.id}`);
      console.log(`   Роли: ${user.roles ? user.roles.join(', ') : 'Не указаны'}`);
      console.log('');
    });

    // Ищем PM и исполнителей
    const pmUsers = users.filter(user => user.roles && user.roles.includes('pm'));
    const executorUsers = users.filter(user => user.roles && user.roles.includes('executor'));

    console.log(`📊 Статистика:`);
    console.log(`   PM: ${pmUsers.length}`);
    console.log(`   Исполнители: ${executorUsers.length}`);

    if (pmUsers.length > 0) {
      console.log(`\n👨‍💼 PM пользователи:`);
      pmUsers.forEach(pm => {
        console.log(`   - ${pm.displayName || pm.fullName} (${pm.email})`);
      });
    }

    if (executorUsers.length > 0) {
      console.log(`\n👨‍💻 Исполнители:`);
      executorUsers.forEach(executor => {
        console.log(`   - ${executor.displayName || executor.fullName} (${executor.email})`);
      });
    } else {
      console.log(`\n⚠️  Исполнители не найдены. Нужно создать тестового исполнителя.`);
    }

  } catch (error) {
    console.error('❌ Ошибка:', error.response?.data || error.message);
  }
}

// Запуск проверки
checkUsers(); 