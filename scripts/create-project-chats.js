const { db } = require('../src/config/firebase');

// Функция для создания чатов проекта
async function createProjectChats(projectId, projectData) {
  try {
    const teamMembers = projectData.teamMembers || [];
    const pmId = projectData.teamLead || projectData.pmId;
    
    if (teamMembers.length === 0) {
      console.log(`No team members for project ${projectId}`);
      return;
    }

    // Проверяем, есть ли уже чаты для этого проекта
    const existingChatsSnapshot = await db.collection('projects')
      .doc(projectId)
      .collection('chats')
      .get();

    if (!existingChatsSnapshot.empty) {
      console.log(`Project ${projectId} already has chats, skipping...`);
      return;
    }

    console.log(`Creating chats for project: ${projectData.title}`);

    // 1. Создаем общий чат команды
    const teamChatData = {
      name: `Общий чат команды - ${projectData.title}`,
      type: 'group',
      participants: teamMembers,
      createdBy: pmId,
      createdAt: new Date(),
      updatedAt: new Date(),
      isTeamChat: true
    };

    const teamChatRef = await db.collection('projects')
      .doc(projectId)
      .collection('chats')
      .add(teamChatData);

    console.log(`  ✓ Created team chat: ${teamChatRef.id}`);

    // 2. Создаем приватные чаты PM с каждым участником
    if (pmId) {
      for (const memberId of teamMembers) {
        if (memberId !== pmId) {
          // Получаем информацию о участнике
          const memberDoc = await db.collection('users').doc(memberId).get();
          const memberData = memberDoc.exists ? memberDoc.data() : null;
          const memberName = memberData ? (memberData.displayName || memberData.fullName || 'Участник') : 'Участник';

          const privateChatData = {
            name: `Чат с ${memberName}`,
            type: 'direct',
            participants: [pmId, memberId],
            createdBy: pmId,
            createdAt: new Date(),
            updatedAt: new Date(),
            isPrivateChat: true
          };

          const privateChatRef = await db.collection('projects')
            .doc(projectId)
            .collection('chats')
            .add(privateChatData);

          console.log(`  ✓ Created private chat with ${memberName}: ${privateChatRef.id}`);
        }
      }
    }

    console.log(`✓ Successfully created chats for project ${projectId}`);
  } catch (error) {
    console.error(`Error creating chats for project ${projectId}:`, error);
  }
}

async function createChatsForAllProjects() {
  try {
    console.log('Creating chats for all existing projects...');
    
    // Получаем все проекты
    const projectsSnapshot = await db.collection('projects').get();
    
    if (projectsSnapshot.empty) {
      console.log('No projects found');
      return;
    }

    console.log(`Found ${projectsSnapshot.size} projects`);

    // Создаем чаты для каждого проекта
    for (const projectDoc of projectsSnapshot.docs) {
      const projectData = projectDoc.data();
      await createProjectChats(projectDoc.id, projectData);
    }

    console.log('\n✅ Finished creating chats for all projects!');
    
  } catch (error) {
    console.error('Error creating chats for projects:', error);
  }
}

// Запускаем скрипт
if (require.main === module) {
  createChatsForAllProjects()
    .then(() => {
      console.log('Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createProjectChats, createChatsForAllProjects }; 