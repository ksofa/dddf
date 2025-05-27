const { db } = require('../src/config/firebase');

async function debugFrontendPM() {
  try {
    console.log('🔍 Отладка состояния PM для фронтенда...\n');

    // 1. Получаем PM пользователя
    const pmSnapshot = await db.collection('users').where('email', '==', 'pm@mail.ru').get();
    if (pmSnapshot.empty) {
      console.log('❌ PM пользователь не найден');
      return;
    }
    
    const pmUser = pmSnapshot.docs[0];
    const pmData = pmUser.data();
    console.log('👤 PM пользователь для фронтенда:');
    console.log('   ID:', pmUser.id);
    console.log('   UID:', pmData.uid);
    console.log('   Email:', pmData.email);
    console.log('   Роли:', pmData.roles);
    console.log('   Имя:', pmData.displayName || pmData.fullName);

    // 2. Получаем проекты PM
    const projectsSnapshot = await db.collection('projects').where('pmId', '==', pmUser.id).get();
    console.log(`\n📁 Проектов PM: ${projectsSnapshot.size}`);

    if (projectsSnapshot.empty) {
      console.log('❌ У PM нет проектов');
      return;
    }

    // 3. Проверяем каждый проект
    for (const projectDoc of projectsSnapshot.docs) {
      const projectData = projectDoc.data();
      console.log(`\n📋 Проект: ${projectData.title}`);
      console.log('   ID:', projectDoc.id);
      console.log('   pmId:', projectData.pmId);
      console.log('   manager:', projectData.manager);
      console.log('   teamLead:', projectData.teamLead);
      console.log('   teamMembers:', projectData.teamMembers?.length || 0);

      // Проверяем логику фронтенда
      const user = { uid: pmUser.id, roles: pmData.roles };
      const project = projectData;

      const isUserPM = user && (
        user.uid === project.teamLead ||
        user.uid === project.manager ||
        user.uid === project.pmId ||
        user.roles?.includes('admin') ||
        (user.roles?.includes('pm') && (
          project.teamLead === user.uid || 
          project.manager === user.uid || 
          project.pmId === user.uid
        ))
      );

      console.log('\n🔐 Проверка прав доступа (логика фронтенда):');
      console.log('   user.uid === project.teamLead:', user.uid === project.teamLead);
      console.log('   user.uid === project.manager:', user.uid === project.manager);
      console.log('   user.uid === project.pmId:', user.uid === project.pmId);
      console.log('   user.roles?.includes("admin"):', user.roles?.includes('admin'));
      console.log('   user.roles?.includes("pm"):', user.roles?.includes('pm'));
      console.log('   Итоговый isUserPM:', isUserPM);

      // Проверяем задачи
      const tasksSnapshot = await db.collection('projects').doc(projectDoc.id).collection('tasks').get();
      console.log(`\n📝 Задач в проекте: ${tasksSnapshot.size}`);

      // Проверяем колонки
      const columnsSnapshot = await db.collection('projects').doc(projectDoc.id).collection('columns').get();
      console.log(`📊 Колонок в проекте: ${columnsSnapshot.size}`);

      if (!columnsSnapshot.empty) {
        console.log('   Колонки:');
        columnsSnapshot.docs.forEach(doc => {
          const columnData = doc.data();
          console.log(`     - ${columnData.name} (order: ${columnData.order})`);
        });
      }

      break; // Проверяем только первый проект
    }

    // 4. Проверяем команды PM
    console.log('\n👥 Команды PM:');
    const teamsSnapshot = await db.collection('teams').get();
    let pmTeamsCount = 0;

    teamsSnapshot.docs.forEach(doc => {
      const teamData = doc.data();
      const isPMInTeam = teamData.teamLead === pmUser.id ||
                        teamData.pm === pmUser.id ||
                        (Array.isArray(teamData.members) && teamData.members.includes(pmUser.id)) ||
                        (Array.isArray(teamData.memberIds) && teamData.memberIds.includes(pmUser.id)) ||
                        (teamData.members && typeof teamData.members === 'object' && teamData.members[pmUser.id]);
      
      if (isPMInTeam) {
        pmTeamsCount++;
        console.log(`   ✅ ${teamData.name || 'Без названия'} (ID: ${doc.id})`);
      }
    });

    console.log(`\n📊 Итого PM участвует в ${pmTeamsCount} командах`);

    // 5. Рекомендации
    console.log('\n💡 Рекомендации для фронтенда:');
    console.log('   1. Убедитесь, что PM авторизован с правильным uid');
    console.log('   2. Проверьте, что проект загружается с правильным pmId');
    console.log('   3. Убедитесь, что роли пользователя включают "pm"');
    console.log('   4. Проверьте консоль браузера на ошибки');

  } catch (error) {
    console.error('❌ Ошибка отладки:', error);
  }
}

debugFrontendPM(); 