// Скрипт для проверки команд в базе данных
const { db } = require('../src/config/firebase');

async function checkTeams() {
  console.log('🔍 Проверка команд в базе данных...\n');
  
  try {
    // 1. Получаем все команды
    console.log('1️⃣ Получение всех команд...');
    const teamsSnapshot = await db.collection('teams').get();
    console.log(`📊 Всего команд в базе: ${teamsSnapshot.size}\n`);
    
    if (teamsSnapshot.empty) {
      console.log('❌ Команды не найдены!');
      return;
    }
    
    // 2. Анализируем каждую команду
    console.log('2️⃣ Анализ команд:');
    const teams = [];
    
    for (const doc of teamsSnapshot.docs) {
      const teamData = { id: doc.id, ...doc.data() };
      teams.push(teamData);
      
      console.log(`\n📋 Команда: ${teamData.name || 'Без названия'}`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   PM ID: ${teamData.pmId || 'Не указан'}`);
      console.log(`   Участники: ${teamData.memberIds?.length || 0} чел.`);
      console.log(`   Проект ID: ${teamData.projectId || 'Не указан'}`);
      console.log(`   Создана: ${teamData.createdAt ? new Date(teamData.createdAt.seconds * 1000).toLocaleDateString() : 'Не указано'}`);
      
      // Проверяем PM
      if (teamData.pmId) {
        try {
          const pmDoc = await db.collection('users').doc(teamData.pmId).get();
          if (pmDoc.exists) {
            const pmData = pmDoc.data();
            console.log(`   PM: ${pmData.fullName || pmData.displayName || pmData.email} (${pmData.email})`);
          } else {
            console.log(`   ⚠️ PM не найден в базе пользователей`);
          }
        } catch (error) {
          console.log(`   ❌ Ошибка получения PM: ${error.message}`);
        }
      }
      
      // Проверяем участников
      if (teamData.memberIds && teamData.memberIds.length > 0) {
        console.log(`   Участники:`);
        for (const memberId of teamData.memberIds) {
          try {
            const memberDoc = await db.collection('users').doc(memberId).get();
            if (memberDoc.exists) {
              const memberData = memberDoc.data();
              console.log(`     - ${memberData.fullName || memberData.displayName || memberData.email} (${memberData.email})`);
            } else {
              console.log(`     - ⚠️ Участник ${memberId} не найден`);
            }
          } catch (error) {
            console.log(`     - ❌ Ошибка получения участника ${memberId}`);
          }
        }
      }
    }
    
    // 3. Статистика по PM
    console.log('\n3️⃣ Статистика по проект-менеджерам:');
    const pmStats = {};
    
    for (const team of teams) {
      if (team.pmId) {
        if (!pmStats[team.pmId]) {
          pmStats[team.pmId] = { count: 0, teams: [] };
        }
        pmStats[team.pmId].count++;
        pmStats[team.pmId].teams.push(team.name || team.id);
      }
    }
    
    for (const [pmId, stats] of Object.entries(pmStats)) {
      try {
        const pmDoc = await db.collection('users').doc(pmId).get();
        if (pmDoc.exists) {
          const pmData = pmDoc.data();
          console.log(`👤 ${pmData.fullName || pmData.displayName || pmData.email}: ${stats.count} команд(ы)`);
          console.log(`   Команды: ${stats.teams.join(', ')}`);
        }
      } catch (error) {
        console.log(`❌ Ошибка получения PM ${pmId}: ${error.message}`);
      }
    }
    
    // 4. Проверяем админа
    console.log('\n4️⃣ Проверка доступа админа...');
    const adminDoc = await db.collection('users').where('email', '==', 'admin@admin.admin').get();
    
    if (!adminDoc.empty) {
      const adminData = adminDoc.docs[0].data();
      console.log(`✅ Админ найден: ${adminData.email}`);
      console.log(`   Роли: ${adminData.roles?.join(', ') || 'Не указаны'}`);
      console.log(`   Должен видеть все ${teams.length} команд(ы)`);
    } else {
      console.log('❌ Админ не найден!');
    }
    
    console.log('\n🎉 Проверка команд завершена!');
    
  } catch (error) {
    console.error('\n❌ Ошибка:', error);
  }
}

// Запускаем проверку
checkTeams().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Критическая ошибка:', error);
  process.exit(1);
}); 