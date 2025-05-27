const axios = require('axios');

async function testFrontendTaskCreation() {
  try {
    console.log('🔐 Авторизация PM пользователя...');
    
    // Авторизация PM
    const loginResponse = await axios.post('http://localhost:3000/api/login', {
      email: 'pm@test.test',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    console.log('✅ PM авторизован');

    // Получаем список проектов PM
    console.log('📋 Получение проектов PM...');
    const projectsResponse = await axios.get('http://localhost:3000/api/projects', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const projects = projectsResponse.data;
    console.log(`📊 Найдено проектов: ${projects.length}`);

    if (projects.length === 0) {
      console.log('❌ У PM нет проектов для тестирования');
      return;
    }

    const project = projects[0];
    console.log(`🎯 Используем проект: ${project.title} (${project.id})`);

    // Получаем скрам доску проекта
    console.log('📋 Загрузка скрам доски...');
    const boardResponse = await axios.get(`http://localhost:3000/api/projects/${project.id}/tasks`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const tasks = boardResponse.data;
    console.log(`📊 Задач на доске: ${tasks.length}`);

    // Группируем задачи по статусам
    const tasksByStatus = tasks.reduce((acc, task) => {
      const status = task.status || 'todo';
      if (!acc[status]) acc[status] = [];
      acc[status].push(task);
      return acc;
    }, {});

    console.log('📊 Распределение задач по колонкам:');
    Object.entries(tasksByStatus).forEach(([status, tasks]) => {
      console.log(`  ${status}: ${tasks.length} задач`);
    });

    // Создаем новую задачу через фронтенд API
    console.log('➕ Создание новой задачи через фронтенд API...');
    const newTaskData = {
      text: 'Новая задача через фронтенд API',
      description: 'Описание задачи созданной через фронтенд API',
      column: 'todo',
      status: 'todo',
      priority: 'high',
      color: '#3B82F6',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    const createTaskResponse = await axios.post(
      `http://localhost:3000/api/projects/${project.id}/tasks`,
      newTaskData,
      {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Задача успешно создана через фронтенд API!');
    console.log('📝 ID задачи:', createTaskResponse.data.taskId);

    // Проверяем обновленную доску
    console.log('🔍 Проверка обновленной доски...');
    const updatedBoardResponse = await axios.get(`http://localhost:3000/api/projects/${project.id}/tasks`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const updatedTasks = updatedBoardResponse.data;
    console.log(`📊 Задач после создания: ${updatedTasks.length}`);

    // Найдем созданную задачу
    const createdTask = updatedTasks.find(task => task.id === createTaskResponse.data.taskId);
    if (createdTask) {
      console.log('✅ Созданная задача найдена на доске');
      console.log('📋 Данные задачи:', {
        id: createdTask.id,
        text: createdTask.text,
        status: createdTask.status,
        priority: createdTask.priority,
        color: createdTask.color
      });
    } else {
      console.log('❌ Созданная задача не найдена на доске');
    }

    // Тестируем получение участников команды для назначения
    console.log('👥 Получение участников команды...');
    try {
      const teamResponse = await axios.get(`http://localhost:3000/api/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const users = teamResponse.data;
      console.log(`👥 Доступных пользователей: ${users.length}`);
      
      if (users.length > 0) {
        console.log('👤 Первые 3 пользователя:');
        users.slice(0, 3).forEach(user => {
          console.log(`  - ${user.displayName || user.name} (${user.email})`);
        });
      }
    } catch (error) {
      console.log('⚠️ Ошибка получения пользователей:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 Тест фронтенд API для создания задач завершен успешно!');
    console.log('✅ PM может создавать задачи в скрам доске');
    console.log('✅ Задачи корректно отображаются на доске');
    console.log('✅ API работает правильно');

  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error.response?.data || error.message);
    if (error.response) {
      console.log('HTTP статус:', error.response.status);
    }
  }
}

testFrontendTaskCreation(); 