const { db } = require('../src/config/firebase');

async function fixPMTeams() {
  try {
    console.log('🔧 Исправление команд для PM...\n');

    // 1. Получаем PM пользователя
    const pmSnapshot = await db.collection('users').where('email', '==', 'pm@mail.ru').get();
    if (pmSnapshot.empty) {
      console.log('❌ PM пользователь не найден');
      return;
    }
    
    const pmUser = pmSnapshot.docs[0];
    const pmData = pmUser.data();
    console.log('👤 PM пользователь:', pmUser.id);

    // 2. Получаем проекты PM
    const projectsSnapshot = await db.collection('projects').where('pmId', '==', pmUser.id).get();
    console.log(`📁 Проектов PM: ${projectsSnapshot.size}`);

    // 3. Создаем команды для каждого проекта PM
    for (const projectDoc of projectsSnapshot.docs) {
      const projectData = projectDoc.data();
      console.log(`\n📋 Обрабатываем проект: ${projectData.title}`);

      // Проверяем, есть ли уже команда для этого проекта
      const existingTeamSnapshot = await db.collection('teams')
        .where('projectId', '==', projectDoc.id)
        .get();

      if (!existingTeamSnapshot.empty) {
        console.log('  ✅ Команда уже существует');
        continue;
      }

      // Создаем команду для проекта
      const teamData = {
        name: `Команда проекта: ${projectData.title}`,
        description: `Команда разработки проекта "${projectData.title}"`,
        projectId: projectDoc.id,
        projectName: projectData.title,
        teamLead: pmUser.id,
        pm: pmUser.id,
        members: [pmUser.id, ...(projectData.teamMembers || [])],
        memberIds: [pmUser.id, ...(projectData.teamMembers || [])],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: pmUser.id,
        status: 'active'
      };

      const teamRef = await db.collection('teams').add(teamData);
      console.log(`  ✅ Создана команда: ${teamRef.id}`);
    }

    // 4. Также добавим PM в несколько существующих команд
    const existingTeamsSnapshot = await db.collection('teams').limit(3).get();
    console.log(`\n👥 Добавляем PM в существующие команды...`);

    let addedToTeams = 0;
    for (const teamDoc of existingTeamsSnapshot.docs) {
      const teamData = teamDoc.data();
      
      // Проверяем, не является ли PM уже участником
      const isPMInTeam = teamData.teamLead === pmUser.id ||
                        teamData.pm === pmUser.id ||
                        (Array.isArray(teamData.members) && teamData.members.includes(pmUser.id)) ||
                        (Array.isArray(teamData.memberIds) && teamData.memberIds.includes(pmUser.id));

      if (isPMInTeam) {
        console.log(`  ⏭️  PM уже в команде: ${teamData.name || 'Без названия'}`);
        continue;
      }

      // Добавляем PM в команду
      const updateData = {};
      
      if (Array.isArray(teamData.members)) {
        updateData.members = [...teamData.members, pmUser.id];
      } else if (teamData.members && typeof teamData.members === 'object') {
        updateData.members = { ...teamData.members, [pmUser.id]: { role: 'pm', joinedAt: new Date() } };
      } else {
        updateData.members = [pmUser.id];
      }

      if (Array.isArray(teamData.memberIds)) {
        updateData.memberIds = [...teamData.memberIds, pmUser.id];
      } else {
        updateData.memberIds = [pmUser.id];
      }

      updateData.updatedAt = new Date();

      await db.collection('teams').doc(teamDoc.id).update(updateData);
      console.log(`  ✅ Добавлен в команду: ${teamData.name || 'Без названия'}`);
      addedToTeams++;

      if (addedToTeams >= 3) break; // Добавляем максимум в 3 команды
    }

    // 5. Проверяем результат
    console.log('\n🔍 Проверка результата...');
    const allTeamsSnapshot = await db.collection('teams').get();
    let pmTeamsCount = 0;

    allTeamsSnapshot.docs.forEach(doc => {
      const teamData = doc.data();
      const isPMInTeam = teamData.teamLead === pmUser.id ||
                        teamData.pm === pmUser.id ||
                        (Array.isArray(teamData.members) && teamData.members.includes(pmUser.id)) ||
                        (Array.isArray(teamData.memberIds) && teamData.memberIds.includes(pmUser.id)) ||
                        (teamData.members && typeof teamData.members === 'object' && teamData.members[pmUser.id]);
      
      if (isPMInTeam) {
        pmTeamsCount++;
        console.log(`  ✅ PM в команде: ${teamData.name || 'Без названия'}`);
      }
    });

    console.log(`\n📊 Итого PM участвует в ${pmTeamsCount} командах`);
    console.log('🎉 Исправление команд завершено!');

  } catch (error) {
    console.error('❌ Ошибка исправления команд:', error);
  }
}

fixPMTeams(); 