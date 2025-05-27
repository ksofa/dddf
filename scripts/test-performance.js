// Тест производительности загрузки заявок
const axios = require('axios');

async function testPerformance() {
  console.log('⚡ Тестирование производительности загрузки заявок...\n');
  
  try {
    // 1. Логинимся как админ
    console.log('1️⃣ Авторизация админа...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@admin.admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Админ авторизован');
    
    // 2. Тестируем скорость загрузки заявок
    console.log('\n2️⃣ Тестирование скорости загрузки заявок...');
    
    const startTime = Date.now();
    
    const applicationsResponse = await axios.get('http://localhost:3000/api/applications', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      timeout: 30000 // 30 секунд таймаут
    });
    
    const endTime = Date.now();
    const loadTime = endTime - startTime;
    
    console.log('✅ Заявки загружены успешно!');
    console.log(`📊 Количество заявок: ${applicationsResponse.data.length}`);
    console.log(`⏱️ Время загрузки: ${loadTime}ms (${(loadTime/1000).toFixed(2)}s)`);
    
    // 3. Анализ производительности
    console.log('\n📈 Анализ производительности:');
    if (loadTime < 5000) {
      console.log('🟢 Отлично! Загрузка менее 5 секунд');
    } else if (loadTime < 10000) {
      console.log('🟡 Приемлемо. Загрузка 5-10 секунд');
    } else if (loadTime < 30000) {
      console.log('🟠 Медленно. Загрузка 10-30 секунд');
    } else {
      console.log('🔴 Очень медленно! Загрузка более 30 секунд');
    }
    
    // 4. Проверяем структуру данных
    if (applicationsResponse.data.length > 0) {
      const firstApp = applicationsResponse.data[0];
      console.log('\n📋 Структура первой заявки:');
      console.log('- ID:', firstApp.id);
      console.log('- Название:', firstApp.projectTitle || 'Не указано');
      console.log('- Статус:', firstApp.status || 'Не указан');
      console.log('- Тип:', firstApp.type || 'Не указан');
    }
    
    console.log('\n🎉 Тест производительности завершен!');
    
  } catch (error) {
    console.error('\n❌ ОШИБКА:', error.message);
    
    if (error.code === 'ECONNABORTED') {
      console.error('⏰ Превышен таймаут запроса');
    }
    
    if (error.response) {
      console.error('📄 Ответ сервера:', error.response.status, error.response.data);
    }
    
    process.exit(1);
  }
}

// Запускаем тест
testPerformance(); 