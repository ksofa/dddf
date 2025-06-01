const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3000';

async function testTasksAPI() {
  try {
    console.log('🔄 Тестирование API задач...');

    // Сначала авторизуемся как PM
    console.log('\n1️⃣ Авторизация как PM...');
    const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'pm@mail.ru',
        password: 'password123'
      }),
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Авторизация успешна');

    // Получаем список задач
    console.log('\n2️⃣ Получение списка задач...');
    const tasksResponse = await fetch(`${API_BASE_URL}/api/tasks`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!tasksResponse.ok) {
      const errorData = await tasksResponse.json();
      console.log('❌ Ошибка при получении задач:', errorData);
      return;
    }

    const tasks = await tasksResponse.json();
    console.log(`✅ Получено ${tasks.length} задач`);

    if (tasks.length > 0) {
      console.log('\n📋 Первые 3 задачи:');
      tasks.slice(0, 3).forEach((task, index) => {
        console.log(`   ${index + 1}. ${task.title} (${task.status}) - ${task.priority}`);
      });
    }

    // Создаем новую задачу
    console.log('\n3️⃣ Создание новой задачи...');
    
    // Сначала получим проекты для назначения задачи
    const projectsResponse = await fetch(`${API_BASE_URL}/api/projects`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    let projectId = 'test-project-1';
    if (projectsResponse.ok) {
      const projects = await projectsResponse.json();
      if (projects.length > 0) {
        projectId = projects[0].id;
        console.log(`   Используем проект: ${projects[0].title}`);
      }
    }

    // Получим исполнителей
    const executorsResponse = await fetch(`${API_BASE_URL}/api/users/executors/search?query=`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    let assignedTo = 'test-executor-1';
    if (executorsResponse.ok) {
      const executors = await executorsResponse.json();
      if (executors.length > 0) {
        assignedTo = executors[0].id;
        console.log(`   Назначаем исполнителя: ${executors[0].name}`);
      }
    }

    const newTaskData = {
      title: 'Тестовая задача из API',
      description: 'Эта задача была создана через API для тестирования',
      assignedTo: assignedTo,
      projectId: projectId,
      priority: 'medium',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    const createTaskResponse = await fetch(`${API_BASE_URL}/api/tasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newTaskData),
    });

    if (!createTaskResponse.ok) {
      const errorData = await createTaskResponse.json();
      console.log('❌ Ошибка при создании задачи:', errorData);
    } else {
      const newTask = await createTaskResponse.json();
      console.log(`✅ Создана новая задача: ${newTask.title} (ID: ${newTask.id})`);

      // Обновляем статус задачи
      console.log('\n4️⃣ Обновление статуса задачи...');
      const updateResponse = await fetch(`${API_BASE_URL}/api/tasks/${newTask.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'in_progress'
        }),
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        console.log('❌ Ошибка при обновлении задачи:', errorData);
      } else {
        const updatedTask = await updateResponse.json();
        console.log(`✅ Статус задачи обновлен: ${updatedTask.status}`);
      }
    }

    console.log('\n🎉 Тестирование API задач завершено успешно!');

  } catch (error) {
    console.error('❌ Ошибка при тестировании API:', error.message);
  }
}

// Запуск теста
testTasksAPI().then(() => {
  console.log('\n✨ Тест завершен');
  process.exit(0);
}).catch(error => {
  console.error('💥 Критическая ошибка:', error);
  process.exit(1);
}); 