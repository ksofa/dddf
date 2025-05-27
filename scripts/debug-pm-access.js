const { db } = require('../src/config/firebase');

async function debugPMAccess() {
  try {
    console.log('🔍 Отладка доступа PM...\n');

    // 1. Получаем PM пользователя
    const pmSnapshot = await db.collection('users').where('email', '==', 'pm@mail.ru').get();
    if (pmSnapshot.empty) {
      console.log('❌ PM пользователь не найден');
      return;
    }
    
    const pmUser = pmSnapshot.docs[0];
    const pmData = pmUser.data();
    console.log('👤 PM пользователь:', {
      id: pmUser.id,
      email: pmData.email,
      roles: pmData.roles,
      uid: pmData.uid
    });

    // 2. Получаем проекты PM
    const projectsSnapshot = await db.collection('projects').where('pmId', '==', pmUser.id).get();
    console.log(`\n📁 Найдено проектов PM: ${projectsSnapshot.size}`);
    
    if (projectsSnapshot.empty) {
      console.log('❌ У PM нет проектов');
      return;
    }

    // 3. Проверяем первый проект
    const project = projectsSnapshot.docs[0];
    const projectData = project.data();
    console.log('\n📋 Первый проект PM:', {
      id: project.id,
      title: projectData.title,
      pmId: projectData.pmId,
      manager: projectData.manager,
      teamLead: projectData.teamLead,
      teamMembers: projectData.teamMembers,
      team: projectData.team
    });

    // 4. Проверяем права доступа (логика из фронтенда)
    const isUserPM = pmUser.id === projectData.teamLead ||
                     pmUser.id === projectData.manager ||
                     pmUser.id === projectData.pmId ||
                     pmData.roles?.includes('admin') ||
                     (pmData.roles?.includes('pm') && (
                       projectData.teamLead === pmUser.id || 
                       projectData.manager === pmUser.id || 
                       projectData.pmId === pmUser.id
                     ));

    console.log('\n🔐 Проверка прав доступа:');
    console.log('- pmUser.id === projectData.teamLead:', pmUser.id === projectData.teamLead);
    console.log('- pmUser.id === projectData.manager:', pmUser.id === projectData.manager);
    console.log('- pmUser.id === projectData.pmId:', pmUser.id === projectData.pmId);
    console.log('- pmData.roles?.includes("admin"):', pmData.roles?.includes('admin'));
    console.log('- pmData.roles?.includes("pm"):', pmData.roles?.includes('pm'));
    console.log('- Итоговый результат isUserPM:', isUserPM);

    // 5. Проверяем задачи в проекте
    const tasksSnapshot = await db.collection('projects').doc(project.id).collection('tasks').get();
    console.log(`\n📝 Задач в проекте: ${tasksSnapshot.size}`);

    // 6. Проверяем колонки в проекте
    const columnsSnapshot = await db.collection('projects').doc(project.id).collection('columns').get();
    console.log(`📊 Колонок в проекте: ${columnsSnapshot.size}`);

    if (!columnsSnapshot.empty) {
      console.log('Колонки:');
      columnsSnapshot.docs.forEach(doc => {
        const columnData = doc.data();
        console.log(`  - ${columnData.name} (order: ${columnData.order})`);
      });
    }

    // 7. Проверяем команды для кнопок приглашения
    console.log('\n👥 Проверка команд для кнопок приглашения...');
    const teamsSnapshot = await db.collection('teams').get();
    console.log(`Всего команд в системе: ${teamsSnapshot.size}`);

    // Проверяем команды, где PM является участником или лидером
    let pmTeams = 0;
    teamsSnapshot.docs.forEach(doc => {
      const teamData = doc.data();
      const isPMInTeam = teamData.teamLead === pmUser.id ||
                        teamData.pm === pmUser.id ||
                        (Array.isArray(teamData.members) && teamData.members.includes(pmUser.id)) ||
                        (Array.isArray(teamData.memberIds) && teamData.memberIds.includes(pmUser.id)) ||
                        (teamData.members && typeof teamData.members === 'object' && teamData.members[pmUser.id]);
      
      if (isPMInTeam) {
        pmTeams++;
        console.log(`  ✅ PM в команде: ${teamData.name || 'Без названия'} (ID: ${doc.id})`);
      }
    });

    console.log(`\n📊 PM участвует в ${pmTeams} командах`);

    // 8. Проверяем приглашения
    const invitationsSnapshot = await db.collection('team_invitations').where('senderId', '==', pmUser.id).get();
    console.log(`📧 Отправленных приглашений PM: ${invitationsSnapshot.size}`);

  } catch (error) {
    console.error('❌ Ошибка отладки:', error);
  }
}

debugPMAccess(); 