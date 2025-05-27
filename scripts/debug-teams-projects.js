// Скрипт для отладки связи команд и проектов
const { db } = require('../src/config/firebase');

async function debugTeamsProjects() {
  console.log('🔍 Отладка связи команд и проектов...\n');
  
  try {
    // 1. Получаем все команды
    console.log('1️⃣ Получение всех команд...');
    const teamsSnapshot = await db.collection('teams').get();
    console.log(`📊 Всего команд: ${teamsSnapshot.size}\n`);
    
    // 2. Получаем все проекты
    console.log('2️⃣ Получение всех проектов...');
    const projectsSnapshot = await db.collection('projects').get();
    console.log(`📊 Всего проектов: ${projectsSnapshot.size}\n`);
    
    // 3. Анализируем проекты
    console.log('3️⃣ Анализ проектов:');
    const projects = {};
    for (const doc of projectsSnapshot.docs) {
      const projectData = { id: doc.id, ...doc.data() };
      projects[doc.id] = projectData;
      
      console.log(`\n📋 Проект: ${projectData.title || 'Без названия'}`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   PM ID: ${projectData.pmId || projectData.manager || 'Не указан'}`);
      console.log(`   Создан: ${projectData.createdAt ? new Date(projectData.createdAt.seconds * 1000).toLocaleDateString() : 'Не указано'}`);
      
      // Проверяем PM
      const pmId = projectData.pmId || projectData.manager;
      if (pmId) {
        try {
          const pmDoc = await db.collection('users').doc(pmId).get();
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
    }
    
    // 4. Анализируем команды и их связь с проектами
    console.log('\n4️⃣ Анализ команд и связи с проектами:');
    for (const doc of teamsSnapshot.docs) {
      const teamData = { id: doc.id, ...doc.data() };
      
      console.log(`\n📋 Команда: ${teamData.name || 'Без названия'}`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   PM ID: ${teamData.pmId || 'Не указан'}`);
      console.log(`   Проект ID: ${teamData.projectId || 'Не указан'}`);
      
      // Если есть проект, проверяем его PM
      if (teamData.projectId && projects[teamData.projectId]) {
        const project = projects[teamData.projectId];
        const projectPmId = project.pmId || project.manager;
        console.log(`   Проект: ${project.title}`);
        console.log(`   PM проекта: ${projectPmId || 'Не указан'}`);
        
        if (projectPmId) {
          try {
            const pmDoc = await db.collection('users').doc(projectPmId).get();
            if (pmDoc.exists) {
              const pmData = pmDoc.data();
              console.log(`   ✅ PM проекта найден: ${pmData.fullName || pmData.displayName || pmData.email} (${pmData.email})`);
            } else {
              console.log(`   ❌ PM проекта не найден в базе пользователей`);
            }
          } catch (error) {
            console.log(`   ❌ Ошибка получения PM проекта: ${error.message}`);
          }
        }
      } else if (teamData.projectId) {
        console.log(`   ⚠️ Проект ${teamData.projectId} не найден`);
      }
      
      // Проверяем прямого PM команды
      if (teamData.pmId) {
        try {
          const pmDoc = await db.collection('users').doc(teamData.pmId).get();
          if (pmDoc.exists) {
            const pmData = pmDoc.data();
            console.log(`   ✅ Прямой PM команды: ${pmData.fullName || pmData.displayName || pmData.email} (${pmData.email})`);
          } else {
            console.log(`   ❌ Прямой PM команды не найден`);
          }
        } catch (error) {
          console.log(`   ❌ Ошибка получения прямого PM: ${error.message}`);
        }
      }
    }
    
    console.log('\n🎉 Отладка завершена!');
    
  } catch (error) {
    console.error('\n❌ Ошибка:', error);
  }
}

// Запускаем отладку
debugTeamsProjects().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Критическая ошибка:', error);
  process.exit(1);
}); 