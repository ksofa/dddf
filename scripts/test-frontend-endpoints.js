const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// PM пользователь
const PM_EMAIL = 'pm@mail.ru';
const PM_PASSWORD = '123456';

async function testFrontendEndpoints() {
  try {
    console.log('🔍 Тестирование всех endpoint\'ов фронтенда...\n');

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
      title: testProject.title
    });

    // 3. Тестируем getProjectTeam endpoint
    console.log('\n3. Тестирование getProjectTeam: /api/projects/:projectId/team...');
    try {
      const teamResponse = await axios.get(`${API_BASE}/projects/${testProject.id}/team`, { headers });
      const teamData = teamResponse.data;
      
      console.log('✅ getProjectTeam работает:', {
        projectId: teamData.projectId,
        teamMembersCount: teamData.teamMembers.length,
        canManage: teamData.canManage
      });

      // Проверяем логику кнопки приглашения
      const isPM = user.roles?.includes('pm') || user.roles?.includes('project_manager');
      const canInvite = isPM && teamData.canManage;
      
      console.log('🔍 Логика кнопки приглашения:', {
        isPM,
        canManage: teamData.canManage,
        canInvite
      });

      if (!canInvite) {
        console.log('❌ Кнопка приглашения НЕ должна отображаться!');
        return;
      } else {
        console.log('✅ Кнопка приглашения ДОЛЖНА отображаться!');
      }

    } catch (error) {
      console.log('❌ getProjectTeam не работает:', error.response?.status, error.response?.data?.error);
      return;
    }

    // 4. Тестируем getAvailableExecutors endpoint (исправленный)
    console.log('\n4. Тестирование getAvailableExecutors: /api/users/executors/search...');
    try {
      const executorsResponse = await axios.get(`${API_BASE}/users/executors/search`, { headers });
      const executors = executorsResponse.data;
      
      console.log(`✅ getAvailableExecutors работает: найдено ${executors.length} исполнителей`);
      
      if (executors.length > 0) {
        console.log('📋 Первые 3 исполнителя:');
        executors.slice(0, 3).forEach((executor, index) => {
          console.log(`   ${index + 1}. ${executor.name} (${executor.email})`);
        });
      }

    } catch (error) {
      console.log('❌ getAvailableExecutors не работает:', error.response?.status, error.response?.data?.error);
    }

    // 5. Тестируем sendInvitationToExecutor endpoint
    console.log('\n5. Тестирование sendInvitationToExecutor: /api/projects/:projectId/invite...');
    try {
      // Сначала получаем исполнителей
      const executorsResponse = await axios.get(`${API_BASE}/users/executors/search`, { headers });
      const executors = executorsResponse.data;
      
      if (executors.length > 0) {
        const testExecutor = executors[0];
        console.log(`Отправляем приглашение исполнителю: ${testExecutor.name}...`);
        
        const inviteResponse = await axios.post(`${API_BASE}/projects/${testProject.id}/invite`, {
          executorId: testExecutor.id,
          message: 'Тестовое приглашение через фронтенд API'
        }, { headers });
        
        console.log('✅ sendInvitationToExecutor работает:', inviteResponse.data);
      } else {
        console.log('⚠️ Нет доступных исполнителей для тестирования приглашения');
      }

    } catch (error) {
      console.log('❌ sendInvitationToExecutor не работает:', error.response?.status, error.response?.data?.error);
    }

    // 6. Проверяем старый endpoint (который не работал)
    console.log('\n6. Проверка старого endpoint: /api/executors/search...');
    try {
      const oldExecutorsResponse = await axios.get(`${API_BASE}/executors/search`, { headers });
      console.log('⚠️ Старый endpoint все еще работает (неожиданно)');
    } catch (error) {
      console.log('✅ Старый endpoint не работает (как и ожидалось):', error.response?.status);
    }

    console.log('\n🎉 Тестирование завершено!');
    console.log('\n📋 Резюме:');
    console.log('- getProjectTeam: должен работать и возвращать canManage: true');
    console.log('- getAvailableExecutors: исправлен на правильный endpoint');
    console.log('- sendInvitationToExecutor: должен работать');
    console.log('- Логика кнопки: isPM && canManage = должна отображаться');

  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error.response?.data || error.message);
  }
}

testFrontendEndpoints(); 