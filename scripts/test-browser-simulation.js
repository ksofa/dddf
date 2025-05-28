const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// PM пользователь
const PM_EMAIL = 'pm@mail.ru';
const PM_PASSWORD = '123456';

async function testBrowserSimulation() {
  try {
    console.log('🌐 Симуляция поведения браузера для отладки кнопки приглашения...\n');

    // 1. Логин PM пользователя (как делает фронтенд)
    console.log('1. Логин PM пользователя...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: PM_EMAIL,
      password: PM_PASSWORD
    });

    const { token, user } = loginResponse.data;
    console.log('✅ PM успешно залогинился:', {
      uid: user.uid,
      email: user.email,
      roles: user.roles,
      role: user.role // проверяем и это поле тоже
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

    // 3. Вызываем getProjectTeam (точно как фронтенд)
    console.log('\n3. Вызов getProjectTeam (как фронтенд)...');
    const teamResponse = await axios.get(`${API_BASE}/projects/${testProject.id}/team`, { headers });
    const team = teamResponse.data;
    
    console.log('✅ Данные команды получены:', {
      projectId: team.projectId,
      projectTitle: team.projectTitle,
      teamMembersCount: team.teamMembers?.length || 0,
      canManage: team.canManage,
      teamLead: team.teamLead,
      customerInfo: team.customerInfo
    });

    // 4. Точная симуляция логики ProjectTeamScreen.tsx
    console.log('\n4. Симуляция логики ProjectTeamScreen.tsx...');
    
    // Строка 152: const isPM = user?.roles?.includes('pm') || user?.roles?.includes('project_manager') || user?.role === 'pm';
    const isPM = user?.roles?.includes('pm') || user?.roles?.includes('project_manager') || user?.role === 'pm';
    
    // Строки 155-158: const isProjectManager = team && user && (team.canManage || user.roles?.includes('admin'));
    const isProjectManager = team && user && (
      team.canManage || // API возвращает canManage: project.manager === userId
      user.roles?.includes('admin')
    );
    
    // Строка 160: const canInvite = isPM && isProjectManager;
    const canInvite = isPM && isProjectManager;

    console.log('🔍 Детальная проверка логики (точно как в ProjectTeamScreen):', {
      'user?.uid': user?.uid,
      'user?.roles': user?.roles,
      'user?.role': user?.role,
      'team?.canManage': team?.canManage,
      'user?.roles?.includes("admin")': user?.roles?.includes('admin'),
      '---': '---',
      'isPM': isPM,
      'isProjectManager': isProjectManager,
      'canInvite': canInvite
    });

    // 5. Проверяем каждое условие отдельно
    console.log('\n5. Пошаговая проверка условий...');
    
    const condition1 = user?.roles?.includes('pm');
    const condition2 = user?.roles?.includes('project_manager');
    const condition3 = user?.role === 'pm';
    const condition4 = team?.canManage;
    const condition5 = user?.roles?.includes('admin');

    console.log('📋 Проверка каждого условия:');
    console.log(`   user?.roles?.includes('pm'): ${condition1}`);
    console.log(`   user?.roles?.includes('project_manager'): ${condition2}`);
    console.log(`   user?.role === 'pm': ${condition3}`);
    console.log(`   team?.canManage: ${condition4}`);
    console.log(`   user?.roles?.includes('admin'): ${condition5}`);
    console.log('---');
    console.log(`   isPM = (${condition1} || ${condition2} || ${condition3}) = ${isPM}`);
    console.log(`   isProjectManager = (${condition4} || ${condition5}) = ${isProjectManager}`);
    console.log(`   canInvite = ${isPM} && ${isProjectManager} = ${canInvite}`);

    // 6. Проверяем, что происходит с кнопкой
    console.log('\n6. Результат для отображения кнопки...');
    if (canInvite) {
      console.log('✅ КНОПКА ДОЛЖНА ОТОБРАЖАТЬСЯ!');
      console.log('   В JSX: {canInvite && (<button>+ Пригласить исполнителя</button>)}');
    } else {
      console.log('❌ КНОПКА НЕ БУДЕТ ОТОБРАЖАТЬСЯ!');
      console.log('🔍 Возможные причины:');
      if (!isPM) {
        console.log('   - Пользователь не является PM');
      }
      if (!isProjectManager) {
        console.log('   - Пользователь не является менеджером проекта');
      }
    }

    // 7. Тестируем getAvailableExecutors (может быть проблема там)
    console.log('\n7. Тестирование getAvailableExecutors...');
    try {
      const executorsResponse = await axios.get(`${API_BASE}/users/executors/search`, { headers });
      const executors = executorsResponse.data;
      
      console.log(`✅ getAvailableExecutors работает: найдено ${executors.length} исполнителей`);
      
      if (executors.length === 0) {
        console.log('⚠️ Нет доступных исполнителей - это может влиять на отображение кнопки');
      }

    } catch (error) {
      console.log('❌ getAvailableExecutors НЕ работает:', error.response?.status, error.response?.data?.error);
      console.log('   Это может быть причиной проблемы!');
    }

    // 8. Проверяем, есть ли ошибки в консоли (симулируем)
    console.log('\n8. Проверка возможных ошибок...');
    
    // Проверяем, что все необходимые поля есть
    const requiredFields = {
      'user.uid': user?.uid,
      'user.roles': user?.roles,
      'team.canManage': team?.canManage,
      'team.projectId': team?.projectId,
      'team.teamMembers': team?.teamMembers
    };

    console.log('📋 Проверка обязательных полей:');
    Object.entries(requiredFields).forEach(([field, value]) => {
      if (value === undefined || value === null) {
        console.log(`   ❌ ${field}: ${value} (отсутствует!)`);
      } else {
        console.log(`   ✅ ${field}: ${typeof value === 'object' ? JSON.stringify(value) : value}`);
      }
    });

    console.log('\n🎯 ИТОГОВЫЙ ДИАГНОЗ:');
    if (canInvite) {
      console.log('✅ Логика работает правильно - кнопка ДОЛЖНА отображаться');
      console.log('🔍 Возможные причины, почему кнопка не видна:');
      console.log('   1. Фронтенд не обновился после изменений в API');
      console.log('   2. Кэширование в браузере');
      console.log('   3. Ошибка в консоли браузера');
      console.log('   4. CSS скрывает кнопку');
      console.log('   5. Условие в JSX написано неправильно');
    } else {
      console.log('❌ Логика НЕ работает - кнопка правильно НЕ отображается');
      console.log('   Нужно исправить логику разрешений');
    }

  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error.response?.data || error.message);
  }
}

testBrowserSimulation(); 