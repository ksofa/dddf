const { db, admin } = require('../src/config/firebase');

async function checkAndCreateProjects() {
  try {
    console.log('🔍 Проверка проектов в базе данных...');

    // Получаем все проекты
    const projectsSnapshot = await db.collection('projects').get();
    console.log(`📊 Всего проектов в базе: ${projectsSnapshot.size}`);

    if (projectsSnapshot.size > 0) {
      console.log('\n📋 Существующие проекты:');
      projectsSnapshot.forEach(doc => {
        const project = doc.data();
        console.log(`- ID: ${doc.id}`);
        console.log(`  Название: ${project.title || 'Без названия'}`);
        console.log(`  PM ID: ${project.pmId || 'не назначен'}`);
        console.log(`  Team Lead: ${project.teamLead || 'не назначен'}`);
        console.log(`  Команда: ${project.teamMembers?.length || 0} участников`);
        console.log(`  Статус: ${project.status || 'не указан'}`);
        console.log('');
      });
    }

    // Получаем ID пользователя PM
    const pmEmail = 'pm@test.test';
    const pmUser = await admin.auth().getUserByEmail(pmEmail);
    const pmId = pmUser.uid;
    console.log(`👤 PM пользователь: ${pmEmail} (ID: ${pmId})`);

    // Проверяем, есть ли проекты для этого PM
    const pmProjectsSnapshot = await db.collection('projects')
      .where('pmId', '==', pmId)
      .get();
    
    console.log(`📊 Проектов для PM: ${pmProjectsSnapshot.size}`);

    if (pmProjectsSnapshot.size === 0) {
      console.log('\n🔧 Создаем тестовый проект для PM...');
      
      const projectData = {
        title: 'Тестовый проект для PM',
        description: 'Проект для тестирования функционала PM',
        status: 'active',
        stage: 'development',
        pmId: pmId,
        teamLead: pmId,
        teamMembers: [pmId],
        clientCompany: 'Тестовая компания',
        clientContact: 'Тестовый клиент',
        clientEmail: 'client@test.com',
        budget: '100000',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: pmId
      };

      const projectRef = await db.collection('projects').add(projectData);
      console.log(`✅ Создан проект с ID: ${projectRef.id}`);

      // Создаем чаты для проекта
      console.log('💬 Создаем чаты для проекта...');
      
      const teamChatData = {
        name: `Общий чат команды - ${projectData.title}`,
        type: 'group',
        participants: [pmId],
        createdBy: pmId,
        createdAt: new Date(),
        updatedAt: new Date(),
        isTeamChat: true
      };

      const teamChatRef = await db.collection('projects')
        .doc(projectRef.id)
        .collection('chats')
        .add(teamChatData);

      console.log(`✅ Создан командный чат: ${teamChatRef.id}`);
    }

    // Проверяем еще раз
    console.log('\n🔄 Повторная проверка проектов для PM...');
    const finalCheck = await db.collection('projects')
      .where('pmId', '==', pmId)
      .get();
    
    console.log(`📊 Итого проектов для PM: ${finalCheck.size}`);

  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}

checkAndCreateProjects(); 