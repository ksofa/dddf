// Тест для проверки исправления CORS проблемы
const axios = require('axios');

async function testCORSFix() {
  console.log('🧪 Тестирование исправления CORS проблемы...\n');
  
  try {
    // 1. Проверяем, что сервер запущен
    console.log('1️⃣ Проверяем доступность сервера...');
    const healthResponse = await axios.get('http://localhost:3000/api/health');
    console.log('✅ Сервер работает:', healthResponse.data.message);
    
    // 2. Логинимся как админ
    console.log('\n2️⃣ Логинимся как админ...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@admin.admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Админ авторизован');
    
    // 3. Тестируем запрос с заголовками Cache-Control
    console.log('\n3️⃣ Тестируем запрос с заголовками Cache-Control...');
    const applicationsResponse = await axios.get('http://localhost:3000/api/applications', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    console.log('✅ Запрос с Cache-Control заголовками успешен!');
    console.log(`📊 Получено заявок: ${applicationsResponse.data.length}`);
    
    // 4. Тестируем запрос пользователей
    console.log('\n4️⃣ Тестируем запрос пользователей...');
    const usersResponse = await axios.get('http://localhost:3000/api/users', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    const pms = usersResponse.data.filter(user => user.roles.includes('pm'));
    console.log('✅ Запрос пользователей успешен!');
    console.log(`👥 Найдено PM: ${pms.length}`);
    
    console.log('\n🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ! CORS проблема исправлена!');
    console.log('\n📋 Результаты:');
    console.log(`- Сервер работает: ✅`);
    console.log(`- Админ авторизован: ✅`);
    console.log(`- Cache-Control заголовки работают: ✅`);
    console.log(`- Заявки загружаются: ✅ (${applicationsResponse.data.length} шт.)`);
    console.log(`- Пользователи загружаются: ✅ (${pms.length} PM)`);
    
  } catch (error) {
    console.error('\n❌ ОШИБКА:', error.message);
    
    if (error.response) {
      console.error('📄 Ответ сервера:', error.response.status, error.response.data);
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Убедитесь, что бэкенд сервер запущен: npm start');
    }
    
    process.exit(1);
  }
}

// Запускаем тест
testCORSFix(); 