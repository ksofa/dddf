const axios = require('axios');

async function testTaskCreation() {
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

    // Получаем текущие задачи
    console.log('📋 Получение текущих задач...');
    const tasksResponse = await axios.get(`http://localhost:3000/api/projects/${project.id}/tasks`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log(`📊 Текущих задач: ${tasksResponse.data.length}`);

    // Создаем новую задачу
    console.log('➕ Создание новой задачи...');
    const newTaskData = {
      text: 'Тестовая задача из API',
      description: 'Описание тестовой задачи, созданной через API',
      column: 'todo',
      status: 'todo',
      priority: 'high',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // через неделю
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

    console.log('✅ Задача успешно создана!');
    console.log('📝 Данные задачи:', createTaskResponse.data.task);

    // Проверяем, что задача появилась в списке
    console.log('🔍 Проверка обновленного списка задач...');
    const updatedTasksResponse = await axios.get(`http://localhost:3000/api/projects/${project.id}/tasks`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log(`📊 Задач после создания: ${updatedTasksResponse.data.length}`);
    
    // Найдем созданную задачу
    const createdTask = updatedTasksResponse.data.find(task => task.id === createTaskResponse.data.taskId);
    if (createdTask) {
      console.log('✅ Созданная задача найдена в списке');
      console.log('📋 Задача:', {
        id: createdTask.id,
        title: createdTask.title,
        status: createdTask.status,
        priority: createdTask.priority
      });
    } else {
      console.log('❌ Созданная задача не найдена в списке');
    }

    console.log('\n🎉 Тест создания задач завершен успешно!');

  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error.response?.data || error.message);
    if (error.response) {
      console.log('HTTP статус:', error.response.status);
    }
  }
}

testTaskCreation(); 