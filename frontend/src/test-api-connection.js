// Простой тест подключения к API
async function testConnection() {
  console.log('🔍 Тестирование подключения к API...');
  
  const baseURL = 'http://localhost:3000/api';
  console.log('🌐 Base URL:', baseURL);
  
  try {
    // Тест 1: Проверка доступности сервера
    console.log('\n1️⃣ Проверка доступности сервера...');
    const healthResponse = await fetch(`${baseURL}/health`);
    console.log('Health check status:', healthResponse.status);
    
    // Тест 2: Авторизация
    console.log('\n2️⃣ Тестирование авторизации...');
    const loginResponse = await fetch(`${baseURL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'pm@test.test',
        password: '123456'
      })
    });
    
    console.log('Login status:', loginResponse.status);
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    
    if (loginData.token) {
      console.log('✅ Токен получен');
      
      // Тест 3: Получение проектов
      console.log('\n3️⃣ Получение проектов...');
      const projectsResponse = await fetch(`${baseURL}/projects`, {
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
          'Content-Type': 'application/json',
        }
      });
      
      console.log('Projects status:', projectsResponse.status);
      const projectsData = await projectsResponse.json();
      console.log('Projects data:', projectsData);
      console.log('Projects count:', projectsData.length);
    } else {
      console.error('❌ Токен не получен');
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}

// Запускаем тест
testConnection(); 