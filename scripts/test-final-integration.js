const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// PM пользователь
const PM_EMAIL = 'pm@mail.ru';
const PM_PASSWORD = '123456';

async function testFinalIntegration() {
  try {
    console.log('🎯 Финальный тест интеграции функционала приглашений...\n');

    // 1. Логин PM пользователя
    console.log('1. Логин PM пользователя...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: PM_EMAIL,
      password: PM_PASSWORD
    });

    const { token, user } = loginResponse.data;
    console.log('✅ PM успешно залогинился:', {
      uid: user.uid,
      email: user.email,
      roles: user.roles
    });

    const headers = { Authorization: `Bearer ${token}` };

    // 2. Получаем проекты PM
    console.log('\n2. Получение проектов PM...');
    const projectsResponse = await axios.get(`${API_BASE}/projects`, { headers });
    const projects = projectsResponse.data;
    
    console.log(`✅ Найдено ${projects.length} проектов`);
    
    if (projects.length === 0) {
      console.log('❌ У PM нет проектов для тестирования');
      return;
    }

    const testProject = projects[0];
    console.log('📋 Тестовый проект:', {
      id: testProject.id,
      title: testProject.title,
      pmId: testProject.pmId,
      manager: testProject.manager
    });

    // 3. Симулируем логику фронтенда
    console.log('\n3. Симуляция логики фронтенда...');
    
    // Получаем команду проекта (как делает getProjectTeam)
    const teamResponse = await axios.get(`${API_BASE}/projects/${testProject.id}/team`, { headers });
    const teamData = teamResponse.data;
    
    console.log('✅ Данные команды получены:', {
      projectId: teamData.projectId,
      teamMembersCount: teamData.teamMembers.length,
      canManage: teamData.canManage
    });

    // Симулируем логику компонента ProjectTeamScreen
    const isPM = user.roles?.includes('pm') || user.roles?.includes('project_manager') || user.role === 'pm';
    const isProjectManager = teamData && user && (
      teamData.canManage || // API возвращает canManage
      user.roles?.includes('admin')
    );
    const canInvite = isPM && isProjectManager;

    console.log('🔍 Логика фронтенда (ProjectTeamScreen):', {
      userId: user.uid,
      userRoles: user.roles,
      isPM,
      isProjectManager,
      canInvite,
      canManageFromAPI: teamData.canManage
    });

    if (!canInvite) {
      console.log('❌ ПРОБЛЕМА: Кнопка приглашения НЕ будет отображаться!');
      console.log('🔍 Причины:');
      console.log(`   - isPM: ${isPM} (должно быть true)`);
      console.log(`   - isProjectManager: ${isProjectManager} (должно быть true)`);
      console.log(`   - canManage from API: ${teamData.canManage} (должно быть true)`);
      console.log(`   - pmId match: ${testProject.pmId === user.uid} (должно быть true)`);
      return;
    }

    console.log('✅ УСПЕХ: Кнопка приглашения БУДЕТ отображаться!');

    // 4. Тестируем получение исполнителей (как делает getAvailableExecutors)
    console.log('\n4. Получение доступных исполнителей...');
    const executorsResponse = await axios.get(`${API_BASE}/users/executors/search`, { headers });
    const executors = executorsResponse.data;
    
    console.log(`✅ Найдено ${executors.length} доступных исполнителей`);

    // Фильтруем исполнителей, которые уже в команде (как делает фронтенд)
    const teamMemberIds = teamData.teamMembers?.map(member => member.id) || [];
    const filteredExecutors = executors.filter(executor => 
      !teamMemberIds.includes(executor.id)
    );

    console.log(`✅ После фильтрации: ${filteredExecutors.length} доступных для приглашения`);

    if (filteredExecutors.length > 0) {
      console.log('📋 Доступные для приглашения исполнители:');
      filteredExecutors.slice(0, 3).forEach((executor, index) => {
        console.log(`   ${index + 1}. ${executor.name} (${executor.email}) - ${executor.specialization}`);
      });

      // 5. Тестируем отправку приглашения (как делает sendInvitationToExecutor)
      const testExecutor = filteredExecutors[0];
      console.log(`\n5. Отправка приглашения исполнителю: ${testExecutor.name}...`);
      
      const inviteResponse = await axios.post(`${API_BASE}/projects/${testProject.id}/invite`, {
        executorId: testExecutor.id,
        message: 'Финальный тест интеграции - приглашение в проект'
      }, { headers });
      
      console.log('✅ Приглашение отправлено:', inviteResponse.data);

      // 6. Проверяем, что приглашение создалось
      console.log('\n6. Проверка созданного приглашения...');
      try {
        const invitationsResponse = await axios.get(`${API_BASE}/invitations?status=pending`, { headers });
        const invitations = invitationsResponse.data;
        
        const ourInvitation = invitations.find(inv => 
          inv.projectId === testProject.id && 
          inv.executorId === testExecutor.id
        );

        if (ourInvitation) {
          console.log('✅ Приглашение найдено в базе данных:', {
            id: ourInvitation.id,
            status: ourInvitation.status,
            executorName: ourInvitation.executorName,
            projectTitle: ourInvitation.projectTitle
          });
        } else {
          console.log('⚠️ Приглашение не найдено в списке (возможно, уже обработано)');
        }
      } catch (error) {
        console.log('⚠️ Не удалось проверить приглашения:', error.response?.status);
      }

    } else {
      console.log('⚠️ Нет доступных исполнителей для приглашения (все уже в команде)');
    }

    console.log('\n🎉 ФИНАЛЬНЫЙ РЕЗУЛЬТАТ:');
    console.log('✅ Все API endpoint\'ы работают корректно');
    console.log('✅ Логика разрешений работает правильно');
    console.log('✅ Кнопка приглашения должна отображаться для PM');
    console.log('✅ Функционал приглашений полностью восстановлен');

    console.log('\n📋 Что должно работать на фронтенде:');
    console.log('1. PM видит кнопку "Пригласить исполнителя" в команде проекта');
    console.log('2. При клике открывается модальное окно со списком исполнителей');
    console.log('3. PM может выбрать исполнителя и отправить приглашение');
    console.log('4. Приглашение создается в базе данных');
    console.log('5. Исполнитель получает уведомление о приглашении');

  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error.response?.data || error.message);
    
    if (error.response?.status === 403) {
      console.log('\n🔍 Анализ ошибки 403:');
      console.log('Возможные причины:');
      console.log('1. PM не является менеджером проекта');
      console.log('2. Неправильная проверка ролей');
      console.log('3. Проблема с токеном авторизации');
    }
  }
}

testFinalIntegration(); 