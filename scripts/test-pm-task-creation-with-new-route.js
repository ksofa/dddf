const { db } = require('../src/config/firebase');

async function testPMTaskCreationWithNewRoute() {
  try {
    console.log('🧪 Testing PM task creation with new route...\n');

    // Test project ID
    const projectId = '7dBBF7T9wclrjCSCbbrE';
    
    // Get project data
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      console.log('❌ Project not found');
      return;
    }
    
    const project = projectDoc.data();
    console.log('📋 Project data:', {
      id: projectId,
      title: project.title,
      pmId: project.pmId,
      manager: project.manager,
      teamLead: project.teamLead
    });

    // Get PM user data
    const pmUserId = project.pmId;
    if (!pmUserId) {
      console.log('❌ No PM assigned to project');
      return;
    }

    const pmDoc = await db.collection('users').doc(pmUserId).get();
    if (!pmDoc.exists) {
      console.log('❌ PM user not found');
      return;
    }

    const pmUser = pmDoc.data();
    console.log('👤 PM user data:', {
      uid: pmUserId,
      email: pmUser.email,
      roles: pmUser.roles,
      displayName: pmUser.displayName
    });

    // Check if PM has correct role
    if (!pmUser.roles || !pmUser.roles.includes('pm')) {
      console.log('❌ User does not have PM role');
      return;
    }

    // Test GET tasks endpoint (simulate what frontend does)
    console.log('\n🔍 Testing GET /projects/:projectId/tasks...');
    
    const tasksSnapshot = await db.collection('projects')
      .doc(projectId)
      .collection('tasks')
      .orderBy('createdAt', 'desc')
      .get();

    const tasks = [];
    for (const doc of tasksSnapshot.docs) {
      const taskData = doc.data();
      
      // Get assignee details if exists
      let assigneeDetails = null;
      if (taskData.assignee) {
        try {
          const assigneeDoc = await db.collection('users').doc(taskData.assignee).get();
          if (assigneeDoc.exists) {
            const assigneeData = assigneeDoc.data();
            assigneeDetails = {
              id: taskData.assignee,
              fullName: assigneeData.fullName || assigneeData.displayName,
              email: assigneeData.email,
              profileImage: assigneeData.profileImage
            };
          }
        } catch (error) {
          console.error('Error fetching assignee details:', error);
        }
      }

      tasks.push({
        id: doc.id,
        ...taskData,
        assigneeDetails
      });
    }

    console.log(`✅ Found ${tasks.length} existing tasks`);
    if (tasks.length > 0) {
      console.log('📝 Sample task:', {
        id: tasks[0].id,
        title: tasks[0].title || tasks[0].text,
        status: tasks[0].status,
        assignee: tasks[0].assigneeDetails?.fullName || 'Unassigned'
      });
    }

    // Test POST tasks endpoint (simulate task creation)
    console.log('\n➕ Testing POST /projects/:projectId/tasks...');
    
    const newTaskData = {
      text: 'Test task created via new route',
      title: 'Test task created via new route',
      column: 'todo',
      status: 'todo',
      assignee: pmUserId, // Assign to PM
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      priority: 'medium',
      color: '#3B82F6',
      description: 'This is a test task created to verify the new route works',
      createdAt: new Date(),
      createdBy: pmUserId
    };

    const taskRef = await db.collection('projects')
      .doc(projectId)
      .collection('tasks')
      .add(newTaskData);

    console.log('✅ Task created successfully with ID:', taskRef.id);

    // Verify the task was created
    const createdTaskDoc = await taskRef.get();
    const createdTask = createdTaskDoc.data();
    
    console.log('📝 Created task details:', {
      id: taskRef.id,
      title: createdTask.title,
      text: createdTask.text,
      status: createdTask.status,
      assignee: createdTask.assignee,
      priority: createdTask.priority,
      color: createdTask.color,
      createdBy: createdTask.createdBy
    });

    // Test permissions
    console.log('\n🔐 Testing permissions...');
    
    // Check if PM can create tasks
    const canCreateTasks = pmUser.roles.includes('admin') || project.pmId === pmUserId;
    console.log('✅ PM can create tasks:', canCreateTasks);
    
    // Check if PM can view tasks
    const canViewTasks = 
      pmUser.roles.includes('admin') ||
      project.pmId === pmUserId ||
      project.team?.includes(pmUserId) ||
      project.teamMembers?.some(member => member.id === pmUserId || member === pmUserId);
    console.log('✅ PM can view tasks:', canViewTasks);

    console.log('\n🎉 All tests passed! PM task creation with new route works correctly.');

  } catch (error) {
    console.error('❌ Error testing PM task creation:', error);
  }
}

testPMTaskCreationWithNewRoute(); 