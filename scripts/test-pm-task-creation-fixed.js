const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testPMTaskCreation() {
  try {
    console.log('🧪 Тестирование создания задач PM после исправлений...\n');

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

    // 2. Получаем проекты PM
    console.log('\n2. Получение проектов PM...');
    const projectsResponse = await axios.get(`${BASE_URL}/api/projects`, { headers });
    const projects = projectsResponse.data;
    
    console.log(`✅ Найдено ${projects.length} проектов для PM`);
    
    if (projects.length === 0) {
      console.log('❌ У PM нет проектов для тестирования');
      return;
    }

    const project = projects[0];
    console.log(`📋 Тестируем проект: ${project.title} (ID: ${project.id})`);
    console.log(`   PM ID в проекте: ${project.pmId}`);
    console.log(`   Соответствие: ${project.pmId === user.uid}`);

    // 3. Получаем доску проекта
    console.log('\n3. Получение доски проекта...');
    try {
      const boardResponse = await axios.get(`${BASE_URL}/api/projects/${project.id}/board`, { headers });
      console.log('✅ Доска проекта получена успешно');
    } catch (error) {
      console.log('❌ Ошибка получения доски:', error.response?.data || error.message);
    }

    // 4. Создаем задачу
    console.log('\n4. Создание задачи...');
    const taskData = {
      text: 'Тестовая задача от PM (после исправлений)',
      column: 'todo',
      status: 'todo',
      priority: 'medium',
      description: 'Эта задача создана для тестирования прав PM после исправления логики'
    };

    try {
      const createTaskResponse = await axios.post(
        `${BASE_URL}/api/projects/${project.id}/tasks`,
        taskData,
        { headers }
      );

      console.log('✅ Задача создана успешно!');
      console.log('Response:', createTaskResponse.data);
      
      // 5. Проверяем, что задача появилась на доске
      console.log('\n5. Проверка задачи на доске...');
      const updatedBoardResponse = await axios.get(`${BASE_URL}/api/projects/${project.id}/board`, { headers });
      const board = updatedBoardResponse.data;
      
      let taskFound = false;
      board.columns.forEach(column => {
        column.tasks.forEach(task => {
          if (task.text === taskData.text) {
            taskFound = true;
            console.log('✅ Задача найдена на доске:', task.text);
          }
        });
      });
      
      if (!taskFound) {
        console.log('⚠️ Задача не найдена на доске');
      }

    } catch (error) {
      console.error('❌ Ошибка создания задачи:', error.response?.data || error.message);
      if (error.response?.status === 403) {
        console.log('\n🔍 Отладка ошибки 403...');
        console.log('Response data:', error.response.data);
        console.log('Это означает, что PM все еще не имеет прав на создание задач');
      }
    }

  } catch (error) {
    console.error('❌ Тест провален:', error.response?.data || error.message);
  }
}

testPMTaskCreation(); 