const { db } = require('../src/config/firebase');

async function createTestInvitations() {
  console.log('Creating test invitations...');

  try {
    // Получаем проекты и исполнителей
    const projectsSnapshot = await db.collection('projects').limit(3).get();
    const executorsSnapshot = await db.collection('users')
      .where('roles', 'array-contains', 'executor')
      .limit(5)
      .get();

    if (projectsSnapshot.empty) {
      console.log('No projects found. Please create projects first.');
      return;
    }

    if (executorsSnapshot.empty) {
      console.log('No executors found. Please create executors first.');
      return;
    }

    const projects = [];
    projectsSnapshot.forEach(doc => {
      projects.push({ id: doc.id, ...doc.data() });
    });

    const executors = [];
    executorsSnapshot.forEach(doc => {
      executors.push({ id: doc.id, ...doc.data() });
    });

    console.log(`Found ${projects.length} projects and ${executors.length} executors`);

    // Создаем приглашения
    let invitationCount = 0;
    for (const project of projects) {
      for (const executor of executors.slice(0, 2)) { // По 2 приглашения на проект
        try {
          const invitationData = {
            projectId: project.id,
            projectTitle: project.title,
            executorId: executor.id,
            executorName: executor.name || executor.displayName || 'Unknown',
            executorEmail: executor.email,
            senderId: project.manager || 'unknown',
            senderName: 'Project Manager',
            message: `Приглашаем вас принять участие в проекте "${project.title}". Ваши навыки будут очень полезны для нашей команды!`,
            status: 'pending',
            createdAt: new Date()
          };

          const invitationRef = await db.collection('invitations').add(invitationData);
          console.log(`Created invitation ${invitationRef.id} for executor ${executor.email} to project ${project.title}`);
          invitationCount++;
        } catch (error) {
          console.error(`Error creating invitation for ${executor.email}:`, error);
        }
      }
    }

    console.log(`Successfully created ${invitationCount} test invitations!`);
  } catch (error) {
    console.error('Error creating test invitations:', error);
  }
}

createTestInvitations().catch(console.error); 