const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// PM пользователь
const PM_EMAIL = 'pm@mail.ru';
const PM_PASSWORD = '123456';

async function testCorrectTeamEndpoint() {
  try {
    console.log('🔍 Тестирование правильного endpoint команды проекта...\n');

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

    // Берем первый проект
    const testProject = projects[0];
    console.log('📋 Тестовый проект:', {
      id: testProject.id,
      title: testProject.title,
      pmId: testProject.pmId,
      manager: testProject.manager
    });

    // 3. Тестируем правильный endpoint (projects.js)
    console.log('\n3. Получение команды через /api/projects/:projectId/team...');
    const teamResponse = await axios.get(`${API_BASE}/projects/${testProject.id}/team`, { headers });
    const teamData = teamResponse.data;
    
    console.log('✅ Данные команды получены (projects.js):', {
      projectId: teamData.projectId,
      projectTitle: teamData.projectTitle,
      teamMembersCount: teamData.teamMembers.length,
      canManage: teamData.canManage
    });

    // 4. Для сравнения тестируем frontend-api endpoint
    console.log('\n4. Получение команды через /api/:projectId/team (frontend-api)...');
    try {
      const frontendTeamResponse = await axios.get(`${API_BASE}/${testProject.id}/team`, { headers });
      const frontendTeamData = frontendTeamResponse.data;
      
      console.log('✅ Данные команды получены (frontend-api):', {
        projectId: frontendTeamData.projectId,
        projectTitle: frontendTeamData.projectTitle,
        teamMembersCount: frontendTeamData.teamMembers.length,
        canManage: frontendTeamData.canManage
      });
    } catch (error) {
      console.log('❌ Frontend-api endpoint недоступен:', error.response?.status, error.response?.data?.error);
    }

    // 5. Проверяем логику разрешений для правильного endpoint
    console.log('\n5. Проверка логики разрешений для правильного endpoint...');
    const isPM = user.roles?.includes('pm') || user.roles?.includes('project_manager') || user.role === 'pm';
    const isProjectManager = teamData.canManage || user.roles?.includes('admin');
    const canInvite = isPM && isProjectManager;
    
    console.log('🔍 Проверка разрешений:', {
      userRoles: user.roles,
      isPM,
      canManageFromAPI: teamData.canManage,
      isProjectManager,
      canInvite,
      pmIdMatch: testProject.pmId === user.uid
    });

    if (!canInvite) {
      console.log('❌ PM не может приглашать исполнителей!');
      console.log('🔍 Причины:');
      console.log(`   - isPM: ${isPM}`);
      console.log(`   - isProjectManager: ${isProjectManager}`);
      console.log(`   - canManage from API: ${teamData.canManage}`);
      console.log(`   - pmId match: ${testProject.pmId === user.uid}`);
      return;
    }

    // 6. Тестируем поиск исполнителей через правильный endpoint
    console.log('\n6. Получение доступных исполнителей через /api/users/executors/search...');
    try {
      const executorsResponse = await axios.get(`${API_BASE}/users/executors/search`, { headers });
      const executors = executorsResponse.data;
      
      console.log(`✅ Найдено ${executors.length} доступных исполнителей через users endpoint`);
    } catch (error) {
      console.log('❌ Ошибка получения исполнителей через users endpoint:', error.response?.status, error.response?.data);
    }

    // 7. Тестируем поиск исполнителей через frontend-api endpoint
    console.log('\n7. Получение доступных исполнителей через /api/executors/search...');
    try {
      const frontendExecutorsResponse = await axios.get(`${API_BASE}/executors/search`, { headers });
      const frontendExecutors = frontendExecutorsResponse.data;
      
      console.log(`✅ Найдено ${frontendExecutors.length} доступных исполнителей через frontend-api endpoint`);
      
      // Показываем первых 3 исполнителей
      console.log('📋 Доступные исполнители:');
      frontendExecutors.slice(0, 3).forEach((executor, index) => {
        console.log(`   ${index + 1}. ${executor.name} (${executor.email}) - ${executor.specialization}`);
      });

      // 8. Отправляем приглашение первому исполнителю
      if (frontendExecutors.length > 0) {
        const testExecutor = frontendExecutors[0];
        console.log(`\n8. Отправка приглашения исполнителю: ${testExecutor.name}...`);
        
        const inviteResponse = await axios.post(`${API_BASE}/projects/${testProject.id}/invite`, {
          executorId: testExecutor.id,
          message: 'Тестовое приглашение в проект'
        }, { headers });
        
        console.log('✅ Приглашение отправлено:', inviteResponse.data);
      }

    } catch (error) {
      console.log('❌ Ошибка получения исполнителей через frontend-api endpoint:', error.response?.status, error.response?.data);
    }

    console.log('\n🎉 Тест завершен! Проверьте результаты выше.');

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

testCorrectTeamEndpoint(); 