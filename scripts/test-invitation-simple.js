const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testSimpleInvitation() {
  try {
    console.log('🔐 Авторизация...');
    
    // Авторизация
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@test.com',
      password: 'admin123'
    });
    const token = loginResponse.data.token;
    console.log('✅ Авторизация успешна');

    // Получаем команду
    const teamsResponse = await axios.get(`${API_BASE_URL}/teams`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const teams = teamsResponse.data;
    const testTeam = teams[0];
    console.log(`📊 Тестируем команду: ${testTeam.name} (ID: ${testTeam.id})`);

    // Получаем пользователей
    const usersResponse = await axios.get(`${API_BASE_URL}/teams/${testTeam.id}/available-users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const users = usersResponse.data;
    const testUser = users[0];
    console.log(`👤 Тестируем приглашение для: ${testUser.name} (ID: ${testUser.id})`);

    // Отправляем полное приглашение через простой endpoint
    console.log('\n📤 Отправка полного приглашения...');
    
    const invitationData = {
      receiverId: testUser.id,
      projectType: 'with_project',
      rate: '120000-200000',
      startDate: '2025-06-01',
      estimatedDuration: '3',
      estimatedDurationUnit: 'months',
      coverLetter: `Приглашаем вас присоединиться к команде "${testTeam.name}"! 

Мы ищем талантливого специалиста для работы над интересным проектом. Ваши навыки будут очень полезны для нашей команды.

Проект предполагает:
- Разработку современного веб-приложения
- Работу в дружной команде профессионалов
- Использование актуальных технологий
- Гибкий график работы

Мы предлагаем:
- Конкурентную оплату (120,000 - 200,000 ₽)
- Интересные задачи
- Возможности для профессионального роста
- Комфортные условия работы

Будем рады видеть вас в нашей команде!`
    };

    console.log('📋 Данные приглашения:', {
      ...invitationData,
      coverLetter: `${invitationData.coverLetter.substring(0, 100)}...`
    });

    const response = await axios.post(
      `${API_BASE_URL}/teams/${testTeam.id}/invite-simple`,
      invitationData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Приглашение отправлено успешно!');
    console.log('📊 Результат:', response.data);
    
    console.log('\n📋 Детали приглашения:');
    console.log(`   - Команда: ${response.data.data.teamName}`);
    console.log(`   - Получатель: ${response.data.data.receiverName}`);
    console.log(`   - Тип проекта: ${response.data.data.projectType}`);
    console.log(`   - Ставка: ${response.data.data.rate}`);
    console.log(`   - ID приглашения: ${response.data.invitationId}`);

    console.log('\n🎉 Тест полного приглашения завершен успешно!');

  } catch (error) {
    console.error('❌ Ошибка:', error.response?.data || error.message);
  }
}

testSimpleInvitation(); 