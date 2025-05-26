const { db } = require('../src/config/firebase');

// Демонстрационные задачи
const demoTasks = [
  {
    text: "Создать макеты главной страницы",
    status: "backlog",
    column: "backlog",
    color: "#FF6B6B"
  },
  {
    text: "Настроить базу данных",
    status: "todo", 
    column: "todo",
    color: "#4ECDC4"
  },
  {
    text: "Разработать API авторизации",
    status: "in_progress",
    column: "in_progress",
    color: "#45B7D1"
  },
  {
    text: "Тестирование мобильной версии",
    status: "review",
    column: "review", 
    color: "#96CEB4"
  },
  {
    text: "Деплой на продакшн",
    status: "done",
    column: "done",
    color: "#FFEAA7"
  }
];

async function createDemoTasksForProject(projectId, projectData) {
  try {
    console.log(`Creating demo tasks for project: ${projectData.title}`);

    // Проверяем, есть ли уже задачи для этого проекта
    const existingTasksSnapshot = await db.collection('projects')
      .doc(projectId)
      .collection('tasks')
      .get();

    if (!existingTasksSnapshot.empty) {
      console.log(`Project ${projectId} already has tasks, skipping...`);
      return;
    }

    // Получаем участников команды для назначения задач
    const teamMembers = projectData.teamMembers || [];
    const pmId = projectData.pmId || projectData.teamLead;

    // Создаем демонстрационные задачи
    for (let i = 0; i < demoTasks.length; i++) {
      const task = demoTasks[i];
      
      // Назначаем задачу случайному участнику команды или PM
      let assignee = null;
      if (teamMembers.length > 0) {
        const randomMember = teamMembers[Math.floor(Math.random() * teamMembers.length)];
        assignee = randomMember;
      } else if (pmId) {
        assignee = pmId;
      }

      const taskData = {
        text: task.text,
        status: task.status,
        column: task.column,
        color: task.color,
        assignee: assignee,
        createdAt: new Date(),
        createdBy: pmId || 'system',
        updatedAt: new Date(),
        position: i,
        dueDate: new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000) // Через 1-5 недель
      };

      await db.collection('projects')
        .doc(projectId)
        .collection('tasks')
        .add(taskData);

      console.log(`  ✓ Created task: ${task.text}`);
    }

    console.log(`✓ Successfully created demo tasks for project ${projectId}`);
  } catch (error) {
    console.error(`Error creating demo tasks for project ${projectId}:`, error);
  }
}

async function createDemoTasksForAllProjects() {
  try {
    console.log('Creating demo tasks for projects with teams...');
    
    // Получаем проекты с командами
    const projectsSnapshot = await db.collection('projects').get();
    
    if (projectsSnapshot.empty) {
      console.log('No projects found');
      return;
    }

    let projectsWithTasks = 0;

    // Создаем задачи только для проектов с командами
    for (const projectDoc of projectsSnapshot.docs) {
      const projectData = projectDoc.data();
      
      // Создаем задачи только если есть команда или PM
      if (projectData.teamMembers?.length > 0 || projectData.pmId || projectData.teamLead) {
        await createDemoTasksForProject(projectDoc.id, projectData);
        projectsWithTasks++;
      } else {
        console.log(`Skipping project ${projectData.title} - no team members`);
      }
    }

    console.log(`\n✅ Finished creating demo tasks for ${projectsWithTasks} projects!`);
    
  } catch (error) {
    console.error('Error creating demo tasks for projects:', error);
  }
}

// Запускаем скрипт
if (require.main === module) {
  createDemoTasksForAllProjects()
    .then(() => {
      console.log('Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createDemoTasksForProject, createDemoTasksForAllProjects }; 