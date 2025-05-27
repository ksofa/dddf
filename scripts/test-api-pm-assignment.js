const axios = require('axios');

async function testPMAssignment() {
  try {
    // First, create a test application
    const applicationData = {
      fullName: 'Тест Клиент',
      phone: '+7 (999) 123-45-67',
      projectTitle: 'API Тест Проект',
      projectDescription: 'Тестовый проект через API',
      email: 'test@example.com',
      techSpec: 'React + Node.js'
    };

    console.log('🔄 Создаем тестовую заявку...');
    const createResponse = await axios.post('http://localhost:3001/api/applications', applicationData);
    const applicationId = createResponse.data.applicationId;
    console.log('✅ Заявка создана:', applicationId);

    // Get admin token (simulate admin login)
    console.log('🔄 Получаем токен админа...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@taska.com',
      password: 'admin123'
    });
    const adminToken = loginResponse.data.token;
    console.log('✅ Токен получен');

    // Assign PM to the application
    console.log('🔄 Назначаем PM...');
    const assignResponse = await axios.post(
      `http://localhost:3001/api/applications/${applicationId}/approve`,
      { pmId: '3zQmIv378cegrTnz5qydFi6p9JH2' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    
    console.log('✅ PM назначен успешно!');
    console.log('📋 Ответ:', assignResponse.data);

  } catch (error) {
    console.error('❌ Ошибка:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('📋 Детали ошибки:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

console.log('🚀 Тестируем назначение PM через API...\n');
testPMAssignment().then(() => {
  console.log('\n✅ Тест завершен');
  process.exit(0);
}).catch(console.error); 