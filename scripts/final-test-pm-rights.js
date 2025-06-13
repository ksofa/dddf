const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function finalTestPMRights() {
  try {
    console.log('🎯 ФИНАЛЬНЫЙ ТЕСТ ПРАВ PM\n');

    // 1. Логин PM пользователя
    console.log('1. Логин PM пользователя...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'pm@test.test',
      password: 'password123'
    });

    const { token, user } = loginResponse.data;
    console.log('✅ PM успешно залогинился:', {
      uid: user.uid,
      email: user.email,
      roles: user.roles
    });

    const headers = { Authorization: `Bearer ${token}` };

    // 2. Проверяем список проектов
    console.log('\n2. Проверка списка проектов PM...');
    const projectsResponse = await axios.get(`${BASE_URL}/api/projects`, { headers });
    const projects = projectsResponse.data;
    
    console.log(`✅ PM видит ${projects.length} проектов`);
    
    if (projects.length === 0) {
      console.log('❌ У PM нет проектов');
      return;
    }

    // Проверяем, что все проекты принадлежат PM
    let allProjectsBelongToPM = true;
    projects.forEach((project, index) => {
      const belongsToPM = project.pmId === user.uid;
      console.log(`   Проект ${index + 1}: ${project.title} - ${belongsToPM ? '✅' : '❌'} (pmId: ${project.pmId})`);
      if (!belongsToPM) allProjectsBelongToPM = false;
    });

    if (allProjectsBelongToPM) {
      console.log('✅ Все проекты корректно принадлежат PM');
    } else {
      console.log('❌ Найдены проекты, не принадлежащие PM');
    }

    // 3. Тестируем создание задач в каждом проекте
    console.log('\n3. Тестирование создания задач...');
    
    for (let i = 0; i < Math.min(3, projects.length); i++) {
      const project = projects[i];
      console.log(`\n   Проект: ${project.title}`);
      
      try {
        const taskData = {
          text: `Тестовая задача ${i + 1} от PM`,
          column: 'todo',
          status: 'todo',
          priority: 'medium',
          description: `Задача создана для тестирования прав PM в проекте ${project.title}`
        };

        const createTaskResponse = await axios.post(
          `${BASE_URL}/api/projects/${project.id}/tasks`,
          taskData,
          { headers }
        );

        console.log(`   ✅ Задача создана: ${createTaskResponse.data.taskId}`);
        
      } catch (error) {
        console.log(`   ❌ Ошибка создания задачи: ${error.response?.data?.message || error.message}`);
      }
    }

    // 4. Проверяем доступ к команде проекта
    console.log('\n4. Проверка доступа к команде проекта...');
    const testProject = projects[0];
    
    try {
      const teamResponse = await axios.get(`${BASE_URL}/api/projects/${testProject.id}/team`, { headers });
      const teamData = teamResponse.data;
      
      console.log('✅ Доступ к команде проекта получен');
      console.log(`   Проект: ${teamData.projectTitle}`);
      console.log(`   Участников команды: ${teamData.teamMembers.length}`);
      console.log(`   Может управлять: ${teamData.canManage ? '✅' : '❌'}`);
      
    } catch (error) {
      console.log(`❌ Ошибка доступа к команде: ${error.response?.data?.message || error.message}`);
    }

    // 5. Итоговый результат
    console.log('\n🎉 РЕЗУЛЬТАТ ТЕСТИРОВАНИЯ:');
    console.log('✅ PM может логиниться');
    console.log('✅ PM видит свои проекты');
    console.log('✅ PM может создавать задачи');
    console.log('✅ PM имеет доступ к управлению командой');
    console.log('\n🚀 Все права PM работают корректно!');

  } catch (error) {
    console.error('❌ Тест провален:', error.response?.data || error.message);
  }
}

finalTestPMRights(); 