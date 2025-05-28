const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// PM пользователь
const PM_USER = {
  email: 'pm@example.com',
  password: 'password123'
};

async function debugTaskAssignee() {
  try {
    console.log('🔍 Debugging Task Assignee Issue...\n');

    // 1. Логин PM пользователя
    console.log('1. Logging in PM user...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, PM_USER);
    const token = loginResponse.data.token;
    const pmUser = loginResponse.data.user;
    console.log('✅ PM user logged in:', {
      uid: pmUser.uid,
      email: pmUser.email,
      roles: pmUser.roles
    });

    const headers = { Authorization: `Bearer ${token}` };

    // 2. Получаем проекты
    console.log('\n2. Getting projects...');
    const projectsResponse = await axios.get(`${BASE_URL}/api/projects`, { headers });
    const projects = projectsResponse.data;
    const project = projects[0];
    console.log('Project details:', {
      id: project.id,
      name: project.name,
      pmId: project.pmId,
      manager: project.manager,
      team: project.team,
      teamMembers: project.teamMembers
    });

    // 3. Получаем всех пользователей
    console.log('\n3. Getting all users...');
    const usersResponse = await axios.get(`${BASE_URL}/api/users`, { headers });
    const users = usersResponse.data;
    console.log(`Found ${users.length} users:`);
    
    users.forEach(user => {
      console.log(`- ${user.id}: ${user.email || 'no email'} (roles: ${user.roles?.join(', ') || 'none'})`);
    });

    // 4. Найдем исполнителя
    const executor = users.find(u => u.roles && u.roles.includes('executor'));
    console.log('\n4. Executor details:', executor);

    // 5. Проверим, есть ли исполнитель в команде проекта
    console.log('\n5. Checking if executor is in project team...');
    const isInTeam = project.team && project.team.includes(executor.id);
    const isInTeamMembers = project.teamMembers && project.teamMembers.includes(executor.id);
    console.log(`Executor in project.team: ${isInTeam}`);
    console.log(`Executor in project.teamMembers: ${isInTeamMembers}`);

    // 6. Создаем задачу с детальным логированием
    console.log('\n6. Creating task with detailed logging...');
    const taskData = {
      text: 'Debug task for assignee testing',
      column: 'todo',
      assignee: executor.id,
      status: 'todo',
      priority: 'high',
      description: 'Testing assignee assignment'
    };

    console.log('Sending task data:', JSON.stringify(taskData, null, 2));

    const createTaskResponse = await axios.post(
      `${BASE_URL}/api/projects/${project.id}/tasks`,
      taskData,
      { headers }
    );

    console.log('✅ Task creation response:', createTaskResponse.data);

    // 7. Получаем созданную задачу
    console.log('\n7. Fetching created task...');
    const tasksResponse = await axios.get(
      `${BASE_URL}/api/projects/${project.id}/tasks`,
      { headers }
    );

    const tasks = tasksResponse.data;
    const createdTask = tasks.find(t => t.text === taskData.text);
    
    if (createdTask) {
      console.log('Created task details:', JSON.stringify(createdTask, null, 2));
      
      // Проверим, есть ли assigneeDetails
      if (createdTask.assigneeDetails) {
        console.log('✅ Assignee details found:', createdTask.assigneeDetails);
      } else {
        console.log('❌ No assignee details in task');
      }
    } else {
      console.log('❌ Task not found');
    }

    // 8. Попробуем добавить исполнителя в команду, если его там нет
    if (!isInTeam && !isInTeamMembers) {
      console.log('\n8. Adding executor to project team...');
      try {
        // Обновим проект, добавив исполнителя в команду
        const updateProjectData = {
          team: [...(project.team || []), executor.id]
        };
        
        await axios.put(
          `${BASE_URL}/api/projects/${project.id}`,
          updateProjectData,
          { headers }
        );
        
        console.log('✅ Executor added to project team');
        
        // Попробуем создать задачу снова
        console.log('\n9. Creating task again after adding executor to team...');
        const taskData2 = {
          text: 'Debug task after team update',
          column: 'todo',
          assignee: executor.id,
          status: 'todo',
          priority: 'high',
          description: 'Testing assignee assignment after team update'
        };

        const createTaskResponse2 = await axios.post(
          `${BASE_URL}/api/projects/${project.id}/tasks`,
          taskData2,
          { headers }
        );

        console.log('✅ Second task creation response:', createTaskResponse2.data);
        
      } catch (updateError) {
        console.log('❌ Error updating project team:', updateError.response?.data || updateError.message);
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.response?.data || error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Headers:', error.response.headers);
    }
  }
}

// Запускаем отладку
debugTaskAssignee(); 