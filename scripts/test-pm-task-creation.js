const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// PM пользователь
const PM_USER = {
  email: 'pm@example.com',
  password: 'password123'
};

async function testPMTaskCreation() {
  try {
    console.log('🧪 Testing PM Task Creation...\n');

    // 1. Логин PM пользователя
    console.log('1. Logging in PM user...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, PM_USER);
    const token = loginResponse.data.token;
    console.log('✅ PM user logged in successfully');
    console.log('User data:', {
      uid: loginResponse.data.user.uid,
      email: loginResponse.data.user.email,
      roles: loginResponse.data.user.roles
    });

    const headers = { Authorization: `Bearer ${token}` };

    // 2. Получаем проекты PM пользователя
    console.log('\n2. Getting PM projects...');
    const projectsResponse = await axios.get(`${BASE_URL}/api/projects`, { headers });
    const projects = projectsResponse.data;
    console.log(`✅ Found ${projects.length} projects`);
    
    if (projects.length === 0) {
      console.log('❌ No projects found for PM user');
      return;
    }

    const project = projects[0];
    console.log('Using project:', {
      id: project.id,
      name: project.name,
      pmId: project.pmId,
      manager: project.manager
    });

    // 3. Получаем пользователей для назначения
    console.log('\n3. Getting users for assignment...');
    try {
      const usersResponse = await axios.get(`${BASE_URL}/api/users`, { headers });
      const users = usersResponse.data;
      console.log(`✅ Found ${users.length} users`);
      
      // Найдем исполнителя
      const executor = users.find(u => u.roles && u.roles.includes('executor'));
      console.log('Executor found:', executor ? {
        id: executor.id,
        email: executor.email,
        roles: executor.roles
      } : 'None');

      // 4. Создаем задачу
      console.log('\n4. Creating task...');
      const taskData = {
        text: 'Test task created by PM',
        column: 'todo',
        assignee: executor ? executor.id : null,
        status: 'todo',
        priority: 'medium',
        description: 'This is a test task created by PM user'
      };

      console.log('Task data:', taskData);

      const createTaskResponse = await axios.post(
        `${BASE_URL}/api/projects/${project.id}/tasks`,
        taskData,
        { headers }
      );

      console.log('✅ Task created successfully!');
      console.log('Response:', createTaskResponse.data);

      // 5. Проверяем, что задача создалась
      console.log('\n5. Verifying task creation...');
      const tasksResponse = await axios.get(
        `${BASE_URL}/api/projects/${project.id}/tasks`,
        { headers }
      );

      const tasks = tasksResponse.data;
      const createdTask = tasks.find(t => t.text === taskData.text);
      
      if (createdTask) {
        console.log('✅ Task verified in project tasks');
        console.log('Created task:', {
          id: createdTask.id,
          text: createdTask.text,
          column: createdTask.column,
          assignee: createdTask.assignee,
          createdBy: createdTask.createdBy
        });
      } else {
        console.log('❌ Task not found in project tasks');
      }

    } catch (usersError) {
      console.log('❌ Error getting users:', usersError.response?.data || usersError.message);
      
      // Попробуем создать задачу без назначения
      console.log('\n4. Creating task without assignee...');
      const taskData = {
        text: 'Test task created by PM (no assignee)',
        column: 'todo',
        status: 'todo',
        priority: 'medium',
        description: 'This is a test task created by PM user without assignee'
      };

      const createTaskResponse = await axios.post(
        `${BASE_URL}/api/projects/${project.id}/tasks`,
        taskData,
        { headers }
      );

      console.log('✅ Task created successfully without assignee!');
      console.log('Response:', createTaskResponse.data);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status === 403) {
      console.log('\n🔍 Debugging 403 error...');
      console.log('Response data:', error.response.data);
      console.log('This suggests PM user does not have permission to create tasks');
    }
  }
}

// Запускаем тест
testPMTaskCreation(); 