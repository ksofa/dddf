const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// PM пользователь
const PM_EMAIL = 'pm@mail.ru';
const PM_PASSWORD = '123456';

async function testPMTeamInvite() {
  try {
    console.log('🔍 Тестирование функционала приглашения исполнителей PM пользователем...\n');

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
      manager: testProject.manager
    });

    // 3. Получаем команду проекта
    console.log('\n3. Получение команды проекта...');
    const teamResponse = await axios.get(`${API_BASE}/projects/${testProject.id}/team`, { headers });
    const teamData = teamResponse.data;
    
    console.log('✅ Данные команды получены:', {
      projectId: teamData.projectId,
      projectTitle: teamData.projectTitle,
      teamMembersCount: teamData.teamMembers.length,
      canManage: teamData.canManage
    });

    // 4. Проверяем логику разрешений на фронтенде
    console.log('\n4. Проверка логики разрешений...');
    const isPM = user.roles?.includes('pm') || user.roles?.includes('project_manager') || user.role === 'pm';
    const isProjectManager = teamData.canManage || user.roles?.includes('admin');
    const canInvite = isPM && isProjectManager;
    
    console.log('🔍 Проверка разрешений:', {
      userRoles: user.roles,
      isPM,
      canManageFromAPI: teamData.canManage,
      isProjectManager,
      canInvite,
      isManagerOfProject: testProject.manager === user.uid
    });

    if (!canInvite) {
      console.log('❌ PM не может приглашать исполнителей!');
      console.log('🔍 Причины:');
      console.log(`   - isPM: ${isPM}`);
      console.log(`   - isProjectManager: ${isProjectManager}`);
      console.log(`   - canManage from API: ${teamData.canManage}`);
      console.log(`   - user is manager: ${testProject.manager === user.uid}`);
      return;
    }

    // 5. Получаем доступных исполнителей (используем основной API)
    console.log('\n5. Получение доступных исполнителей...');
    const executorsResponse = await axios.get(`${API_BASE}/users/executors/search`, { headers });
    const executors = executorsResponse.data;
    
    console.log(`✅ Найдено ${executors.length} доступных исполнителей`);
    
    if (executors.length === 0) {
      console.log('❌ Нет доступных исполнителей для приглашения');
      return;
    }

    // Показываем первых 3 исполнителей
    console.log('📋 Доступные исполнители:');
    executors.slice(0, 3).forEach((executor, index) => {
      console.log(`   ${index + 1}. ${executor.name} (${executor.email}) - ${executor.specialization}`);
    });

    // 6. Отправляем приглашение первому исполнителю (используем основной API)
    const testExecutor = executors[0];
    console.log(`\n6. Отправка приглашения исполнителю: ${testExecutor.name}...`);
    
    const inviteResponse = await axios.post(`${API_BASE}/projects/${testProject.id}/invite`, {
      executorId: testExecutor.id,
      message: 'Тестовое приглашение в проект'
    }, { headers });
    
    console.log('✅ Приглашение отправлено:', inviteResponse.data);

    console.log('\n🎉 Все тесты прошли успешно! PM может приглашать исполнителей.');

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

testPMTeamInvite(); 