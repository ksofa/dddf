// Скрипт для анализа проектов без команд
const { db } = require('../src/config/firebase');

async function analyzeProjectsWithoutTeams() {
  console.log('🔍 Анализ проектов без команд...\n');
  
  try {
    // 1. Получаем все проекты
    console.log('1️⃣ Получение всех проектов...');
    const projectsSnapshot = await db.collection('projects').get();
    console.log(`📊 Всего проектов: ${projectsSnapshot.size}\n`);
    
    // 2. Получаем все команды
    console.log('2️⃣ Получение всех команд...');
    const teamsSnapshot = await db.collection('teams').get();
    console.log(`📊 Всего команд: ${teamsSnapshot.size}\n`);
    
    // 3. Создаем карту команд по projectId
    const teamsByProject = {};
    for (const doc of teamsSnapshot.docs) {
      const teamData = doc.data();
      if (teamData.projectId) {
        teamsByProject[teamData.projectId] = {
          id: doc.id,
          name: teamData.name,
          pmId: teamData.pmId
        };
      }
    }
    
    console.log('3️⃣ Команды, привязанные к проектам:');
    Object.entries(teamsByProject).forEach(([projectId, team]) => {
      console.log(`   📋 Проект ${projectId} -> Команда "${team.name}" (${team.id})`);
    });
    console.log();
    
    // 4. Анализируем проекты без команд
    console.log('4️⃣ Проекты без команд:');
    const projectsWithoutTeams = [];
    
    for (const doc of projectsSnapshot.docs) {
      const projectData = { id: doc.id, ...doc.data() };
      
      if (!teamsByProject[doc.id]) {
        projectsWithoutTeams.push(projectData);
        
        console.log(`\n📋 Проект без команды: ${projectData.title || 'Без названия'}`);
        console.log(`   ID: ${doc.id}`);
        console.log(`   PM: ${projectData.pmId || projectData.manager || 'Не назначен'}`);
        console.log(`   Создан: ${projectData.createdAt ? new Date(projectData.createdAt.seconds * 1000).toLocaleDateString() : 'Не указано'}`);
        
        // Проверяем PM
        const pmId = projectData.pmId || projectData.manager;
        if (pmId) {
          try {
            const pmDoc = await db.collection('users').doc(pmId).get();
            if (pmDoc.exists) {
              const pmData = pmDoc.data();
              console.log(`   PM данные: ${pmData.fullName || pmData.displayName || pmData.email} (${pmData.email})`);
            } else {
              console.log(`   ⚠️ PM не найден в базе пользователей`);
            }
          } catch (error) {
            console.log(`   ❌ Ошибка получения PM: ${error.message}`);
          }
        }
      }
    }
    
    console.log(`\n📊 Статистика:`);
    console.log(`   Всего проектов: ${projectsSnapshot.size}`);
    console.log(`   Проектов с командами: ${Object.keys(teamsByProject).length}`);
    console.log(`   Проектов без команд: ${projectsWithoutTeams.length}`);
    
    // 5. Рекомендации
    console.log('\n5️⃣ Рекомендации:');
    if (projectsWithoutTeams.length > 0) {
      console.log(`✅ Создать команды для ${projectsWithoutTeams.length} проектов`);
      console.log('✅ Автоматически назначить PM проекта как PM команды');
      console.log('✅ Использовать название проекта как название команды');
    } else {
      console.log('✅ Все проекты уже имеют команды');
    }
    
    return projectsWithoutTeams;
    
  } catch (error) {
    console.error('\n❌ Ошибка:', error);
    return [];
  }
}

// Запускаем анализ
if (require.main === module) {
  analyzeProjectsWithoutTeams().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Критическая ошибка:', error);
    process.exit(1);
  });
}

module.exports = { analyzeProjectsWithoutTeams }; 