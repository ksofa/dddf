const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testFrontendTaskCreation() {
  try {
    console.log('🧪 Тестирование создания задач через фронтенд API...\n');

    // 1. Авторизация PM
    console.log('🔐 Авторизация PM...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'pm@mail.ru',
      password: '123456'
    });

    const token = loginResponse.data.token;
    const pmUser = loginResponse.data.user;
    console.log('✅ PM авторизован:', pmUser.email);

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 2. Получение проектов PM
    const projectsResponse = await axios.get(`${API_BASE_URL}/projects`, { headers });
    const projects = projectsResponse.data;
    
    if (projects.length === 0) {
      console.log('❌ У PM нет проектов');
      return;
    }

    const testProject = projects[0];
    console.log(`📋 Тестовый проект: ${testProject.title} (ID: ${testProject.id})`);

    // 3. Тестирование создания задачи как на фронтенде
    console.log('\n📝 Создание задачи через фронтенд API...');
    
    const taskData = {
      text: 'Тестовая задача от PM через фронтенд',
      column: 'Нужно сделать',
      status: 'todo',
      priority: 'medium',
      color: '#3B82F6',
      description: 'Описание задачи созданной через фронтенд API'
    };

    try {
      const createTaskResponse = await axios.post(
        `${API_BASE_URL}/projects/${testProject.id}/tasks`,
        taskData,
        { headers }
      );

      console.log('✅ Задача создана через фронтенд API:', createTaskResponse.data);
      
      // 4. Проверяем, что задача появилась на скрам доске
      console.log('\n📊 Проверка скрам доски...');
      const boardResponse = await axios.get(`${API_BASE_URL}/projects/${testProject.id}/board`, { headers });
      const boardData = boardResponse.data;
      
      if (boardData.board) {
        const columns = Object.keys(boardData.board);
        let totalTasks = 0;
        
        columns.forEach(column => {
          const tasks = boardData.board[column];
          totalTasks += tasks?.length || 0;
          if (tasks && tasks.length > 0) {
            console.log(`   - ${column}: ${tasks.length} задач`);
            // Показываем последнюю созданную задачу
            const lastTask = tasks[tasks.length - 1];
            if (lastTask.text === taskData.text) {
              console.log(`     ✅ Найдена наша задача: "${lastTask.text}"`);
            }
          }
        });
        
        console.log(`📈 Всего задач на доске: ${totalTasks}`);
      }

      console.log('\n🎉 Тест создания задач через фронтенд API успешен!');
      console.log('💡 PM теперь может создавать задачи на скрам доске!');

    } catch (taskError) {
      console.log('❌ Ошибка создания задачи:', taskError.response?.data?.message || taskError.message);
      console.log('   Детали ошибки:', taskError.response?.data);
    }

  } catch (error) {
    console.error('❌ Общая ошибка тестирования:', error.message);
  }
}

testFrontendTaskCreation(); 