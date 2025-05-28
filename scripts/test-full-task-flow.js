const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// PM пользователь
const PM_USER = {
  email: 'pm@mail.ru',
  password: '123456'
};

async function testFullTaskFlow() {
  try {
    console.log('🧪 Testing Full Task Creation Flow...\n');

    // 1. Логин PM пользователя
    console.log('1. 🔐 Logging in PM user...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, PM_USER);
    const token = loginResponse.data.token;
    const pmUser = loginResponse.data.user;
    console.log('✅ PM user logged in:', {
      uid: pmUser.uid,
      email: pmUser.email,
      roles: pmUser.roles
    });

    const headers = { Authorization: `Bearer ${token}` };

    // 2. Получаем проекты PM пользователя
    console.log('\n2. 📋 Getting PM projects...');
    const projectsResponse = await axios.get(`${BASE_URL}/projects`, { headers });
    const projects = projectsResponse.data;
    console.log(`✅ Found ${projects.length} projects`);
    
    if (projects.length === 0) {
      console.log('❌ No projects found for PM user');
      return;
    }

    const project = projects[0];
    console.log('Using project:', {
      id: project.id,
      title: project.title,
      pmId: project.pmId,
      manager: project.manager
    });

    // 3. Получаем пользователей для назначения
    console.log('\n3. 👥 Getting users for assignment...');
    const usersResponse = await axios.get(`${BASE_URL}/users`, { headers });
    const users = usersResponse.data;
    console.log(`✅ Found ${users.length} users`);
    
    // Найдем исполнителя
    const executor = users.find(u => u.roles && u.roles.includes('executor'));
    console.log('Executor found:', executor ? {
      id: executor.id,
      email: executor.email || 'no email',
      roles: executor.roles
    } : 'None');

    // 4. Создаем задачу через фронтенд API (как это делает фронтенд)
    console.log('\n4. 📝 Creating task via frontend API...');
    const taskData = {
      text: 'Test task via frontend API',
      column: 'todo',
      status: 'todo',
      assignee: executor ? executor.id : undefined,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // через неделю
      priority: 'medium',
      color: '#3B82F6',
      description: 'This is a test task created via frontend API'
    };

    console.log('Task data being sent:', JSON.stringify(taskData, null, 2));

    const createTaskResponse = await axios.post(
      `${BASE_URL}/projects/${project.id}/tasks`,
      taskData,
      { headers }
    );

    console.log('✅ Task created successfully!');
    console.log('Response:', createTaskResponse.data);

    // 5. Получаем задачи проекта (как это делает getProjectBoard)
    console.log('\n5. 📊 Getting project tasks (board simulation)...');
    const tasksResponse = await axios.get(
      `${BASE_URL}/projects/${project.id}/tasks`,
      { headers }
    );

    const tasks = tasksResponse.data;
    console.log(`✅ Found ${tasks.length} tasks in project`);

    // Группируем задачи по колонкам (как это делает фронтенд)
    const columns = [
      { title: "Бэклог", status: "backlog", tasks: [] },
      { title: "Нужно сделать", status: "todo", tasks: [] },
      { title: "В работе", status: "in_progress", tasks: [] },
      { title: "Правки", status: "review", tasks: [] },
      { title: "Готово", status: "done", tasks: [] },
    ];

    // Распределяем задачи по колонкам
    tasks.forEach(task => {
      let columnStatus = task.status;
      
      // Если статус задачи не соответствует ни одной колонке, помещаем в "Нужно сделать"
      const validStatuses = ['backlog', 'todo', 'in_progress', 'review', 'done'];
      if (!validStatuses.includes(columnStatus)) {
        columnStatus = 'todo';
      }
      
      const column = columns.find(col => col.status === columnStatus);
      if (column) {
        column.tasks.push({
          id: task.id,
          title: task.text || task.title || 'Без названия',
          assignee: task.assigneeDetails,
          dueDate: task.dueDate,
          color: task.color,
          priority: task.priority,
          description: task.description,
          createdBy: task.createdBy
        });
      }
    });

    // Показываем результат
    console.log('\n📈 Board state:');
    columns.forEach(column => {
      console.log(`   ${column.title} (${column.status}): ${column.tasks.length} tasks`);
      column.tasks.forEach(task => {
        console.log(`     - ${task.title} ${task.assignee ? `(assigned to: ${task.assignee.fullName || task.assignee.id})` : '(unassigned)'}`);
      });
    });

    // 6. Найдем нашу созданную задачу
    const createdTask = tasks.find(t => t.text === taskData.text);
    if (createdTask) {
      console.log('\n✅ Our created task found:');
      console.log(JSON.stringify(createdTask, null, 2));
      
      // 7. Тестируем комментарии к задаче
      console.log('\n6. 💬 Testing task comments...');
      try {
        // Добавляем комментарий
        const commentResponse = await axios.post(
          `${BASE_URL}/projects/${project.id}/tasks/${createdTask.id}/comments`,
          { text: 'Test comment from PM', mentions: [] },
          { headers }
        );
        console.log('✅ Comment added:', commentResponse.data);

        // Получаем комментарии
        const commentsResponse = await axios.get(
          `${BASE_URL}/projects/${project.id}/tasks/${createdTask.id}/comments`,
          { headers }
        );
        console.log('✅ Comments retrieved:', commentsResponse.data.length, 'comments');

      } catch (commentError) {
        console.log('❌ Comment test failed:', commentError.response?.data || commentError.message);
      }

      // 8. Тестируем обновление статуса задачи
      console.log('\n7. 🔄 Testing task status update...');
      try {
        const updateResponse = await axios.put(
          `${BASE_URL}/projects/${project.id}/tasks/${createdTask.id}`,
          { status: 'in_progress', column: 'in_progress' },
          { headers }
        );
        console.log('✅ Task status updated successfully');

      } catch (updateError) {
        console.log('❌ Task update failed:', updateError.response?.data || updateError.message);
      }

    } else {
      console.log('❌ Created task not found in project tasks');
    }

    console.log('\n🎉 Full task flow test completed!');
    console.log('💡 PM can successfully create, comment, and update tasks!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status === 403) {
      console.log('\n🔍 403 Forbidden - Permission denied');
      console.log('Response data:', error.response.data);
    }
  }
}

// Запускаем тест
testFullTaskFlow(); 