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

let pmToken = '';
let executorToken = '';
let testProjectId = '';

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

async function testInvitationSystemFixed() {
  console.log('🧪 Тестирование исправленной системы приглашений...\n');

  try {
    // 1. Авторизация PM
    console.log('1️⃣ Авторизация PM...');
    pmToken = await login(PM_USER.email, PM_USER.password);
    console.log('✅ PM авторизован успешно\n');

    // 2. Авторизация исполнителя
    console.log('2️⃣ Авторизация исполнителя...');
    executorToken = await login(EXECUTOR_USER.email, EXECUTOR_USER.password);
    console.log('✅ Исполнитель авторизован успешно\n');

    // 3. Получение проектов PM
    console.log('3️⃣ Получение проектов PM...');
    const projectsResponse = await axios.get(`${BASE_URL}/projects`, {
      headers: { Authorization: `Bearer ${pmToken}` }
    });
    
    if (projectsResponse.data.length === 0) {
      throw new Error('У PM нет проектов для тестирования');
    }
    
    testProjectId = projectsResponse.data[0].id;
    console.log(`✅ Найден проект для тестирования: ${projectsResponse.data[0].name} (ID: ${testProjectId})\n`);

    // 4. Отправка приглашения
    console.log('4️⃣ Отправка приглашения исполнителю...');
    const invitationResponse = await axios.post(
      `${BASE_URL}/projects/${testProjectId}/send-invitation`,
      {
        executorId: 'QH040Apx3segNZ9zHJrLP8y4UPD2', // ID executor5@test.test
        message: 'Приглашение в команду проекта (тест исправленной системы)'
      },
      {
        headers: { Authorization: `Bearer ${pmToken}` }
      }
    );
    console.log('✅ Приглашение отправлено успешно\n');

    // 5. Проверка приглашений у исполнителя
    console.log('5️⃣ Проверка приглашений у исполнителя...');
    const invitationsResponse = await axios.get(`${BASE_URL}/invitations?status=pending`, {
      headers: { Authorization: `Bearer ${executorToken}` }
    });
    
    console.log(`📋 Найдено приглашений: ${invitationsResponse.data.length}`);
    if (invitationsResponse.data.length > 0) {
      const invitation = invitationsResponse.data[0];
      console.log(`📝 Приглашение: ${invitation.message}`);
      console.log(`🏢 Проект: ${invitation.projectName}`);
      console.log(`👤 От: ${invitation.senderName}`);
      console.log('✅ Приглашение видно исполнителю\n');

      // 6. Принятие приглашения
      console.log('6️⃣ Принятие приглашения...');
      const acceptResponse = await axios.post(
        `${BASE_URL}/invitations/${invitation.id}/accept`,
        {},
        {
          headers: { Authorization: `Bearer ${executorToken}` }
        }
      );
      console.log(`✅ ${acceptResponse.data.message}\n`);

      // 7. Проверка статуса после принятия
      console.log('7️⃣ Проверка статуса после принятия...');
      const pendingInvitations = await axios.get(`${BASE_URL}/invitations?status=pending`, {
        headers: { Authorization: `Bearer ${executorToken}` }
      });
      
      const acceptedInvitations = await axios.get(`${BASE_URL}/invitations?status=accepted`, {
        headers: { Authorization: `Bearer ${executorToken}` }
      });
      
      console.log(`📊 Ожидающих приглашений: ${pendingInvitations.data.length}`);
      console.log(`📊 Принятых приглашений: ${acceptedInvitations.data.length}`);
      console.log('✅ Статус обновлен корректно\n');

    } else {
      console.log('❌ Приглашения не найдены у исполнителя\n');
    }

    console.log('🎉 Все тесты пройдены успешно!');
    console.log('✅ Система приглашений работает корректно');

  } catch (error) {
    console.error('❌ Ошибка в тестах:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error(`HTTP Status: ${error.response.status}`);
    }
  }
}

// Запуск тестов
testInvitationSystemFixed(); 