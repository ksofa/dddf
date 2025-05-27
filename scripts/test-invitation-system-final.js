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

async function testInvitationSystemEndToEnd() {
  console.log('🧪 Полное тестирование системы приглашений...\n');

  try {
    // 1. Логин PM
    console.log('1️⃣ Логин PM...');
    const pmToken = await login(PM_USER.email, PM_USER.password);
    console.log('✅ PM залогинен');

    // 2. Логин Executor
    console.log('\n2️⃣ Логин Executor...');
    const executorToken = await login(EXECUTOR_USER.email, EXECUTOR_USER.password);
    console.log('✅ Executor залогинен');

    // 3. PM проверяет свои команды
    console.log('\n3️⃣ PM проверяет доступные команды...');
    const pmTeamsResponse = await axios.get(`${BASE_URL}/teams`, {
      headers: { Authorization: `Bearer ${pmToken}` }
    });
    console.log(`✅ PM видит ${pmTeamsResponse.data.length} команд`);
    
    if (pmTeamsResponse.data.length === 0) {
      console.log('❌ PM не видит команд - тест не может продолжиться');
      return;
    }

    const testTeam = pmTeamsResponse.data[0];
    console.log(`📋 Используем команду: "${testTeam.name}" (ID: ${testTeam.id})`);

    // 4. Executor проверяет свои команды ДО приглашения
    console.log('\n4️⃣ Executor проверяет команды ДО приглашения...');
    const executorTeamsBefore = await axios.get(`${BASE_URL}/teams`, {
      headers: { Authorization: `Bearer ${executorToken}` }
    });
    console.log(`📊 Executor видит ${executorTeamsBefore.data.length} команд ДО приглашения`);

    // 5. Executor проверяет приглашения ДО отправки
    console.log('\n5️⃣ Executor проверяет приглашения ДО отправки...');
    const invitationsBefore = await axios.get(`${BASE_URL}/invitations?status=pending`, {
      headers: { Authorization: `Bearer ${executorToken}` }
    });
    console.log(`📨 Executor имеет ${invitationsBefore.data.length} приглашений ДО отправки`);

    // 6. PM отправляет приглашение
    console.log('\n6️⃣ PM отправляет приглашение...');
    const invitationData = {
      receiverId: 'QH040Apx3segNZ9zHJrLP8y4UPD2', // executor5@test.test
      projectType: 'with_project',
      rate: 'Договорная',
      startDate: '2025-06-01',
      estimatedDuration: '3',
      estimatedDurationUnit: 'months',
      coverLetter: 'Приглашаем вас в команду для работы над проектом!'
    };

    const inviteResponse = await axios.post(`${BASE_URL}/teams/${testTeam.id}/invite-simple`, invitationData, {
      headers: { Authorization: `Bearer ${pmToken}` }
    });
    
    console.log('✅ Приглашение отправлено:', inviteResponse.data.message);

    // 7. Executor проверяет приглашения ПОСЛЕ отправки
    console.log('\n7️⃣ Executor проверяет приглашения ПОСЛЕ отправки...');
    const invitationsAfter = await axios.get(`${BASE_URL}/invitations?status=pending`, {
      headers: { Authorization: `Bearer ${executorToken}` }
    });
    console.log(`📨 Executor имеет ${invitationsAfter.data.length} приглашений ПОСЛЕ отправки`);
    
    if (invitationsAfter.data.length > invitationsBefore.data.length) {
      console.log('✅ Новое приглашение появилось в списке!');
      const newInvitation = invitationsAfter.data.find(inv => 
        inv.teamId === testTeam.id && inv.status === 'pending'
      );
      if (newInvitation) {
        console.log(`📋 Детали приглашения:`);
        console.log(`   - Команда: ${newInvitation.teamName}`);
        console.log(`   - От: ${newInvitation.senderName}`);
        console.log(`   - Тип проекта: ${newInvitation.projectType}`);
        console.log(`   - Ставка: ${newInvitation.rate}`);
      }
    } else {
      console.log('❌ Новое приглашение НЕ появилось в списке');
    }

    // 8. Проверяем уведомления
    console.log('\n8️⃣ Проверяем уведомления...');
    try {
      const notificationsResponse = await axios.get(`${BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${executorToken}` }
      });
      console.log(`🔔 Executor имеет ${notificationsResponse.data.length} уведомлений`);
      
      const teamInviteNotifications = notificationsResponse.data.filter(n => 
        n.type === 'team_invitation' && !n.read
      );
      console.log(`📨 Из них ${teamInviteNotifications.length} - приглашения в команды`);
    } catch (error) {
      console.log('⚠️ Не удалось получить уведомления:', error.response?.status);
    }

    console.log('\n🎉 Тестирование системы приглашений завершено!');
    console.log('\n📊 Итоги:');
    console.log(`   - PM команд: ${pmTeamsResponse.data.length}`);
    console.log(`   - Executor команд ДО: ${executorTeamsBefore.data.length}`);
    console.log(`   - Executor приглашений ДО: ${invitationsBefore.data.length}`);
    console.log(`   - Executor приглашений ПОСЛЕ: ${invitationsAfter.data.length}`);
    console.log(`   - Приглашение отправлено: ✅`);
    console.log(`   - Приглашение получено: ${invitationsAfter.data.length > invitationsBefore.data.length ? '✅' : '❌'}`);

  } catch (error) {
    console.error('❌ Ошибка в тестах:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error(`HTTP Status: ${error.response.status}`);
    }
  }
}

// Запуск тестов
testInvitationSystemEndToEnd(); 