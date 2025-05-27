// Скрипт для создания команд для всех проектов
const { db } = require('../src/config/firebase');
const { analyzeProjectsWithoutTeams } = require('./analyze-projects-without-teams');

async function createTeamsForProjects() {
  console.log('🚀 Создание команд для всех проектов...\n');
  
  try {
    // 1. Получаем проекты без команд
    const projectsWithoutTeams = await analyzeProjectsWithoutTeams();
    
    if (projectsWithoutTeams.length === 0) {
      console.log('✅ Все проекты уже имеют команды!');
      return;
    }
    
    console.log(`\n6️⃣ Создание команд для ${projectsWithoutTeams.length} проектов...\n`);
    
    const createdTeams = [];
    const errors = [];
    
    // 2. Создаем команды для каждого проекта
    for (const project of projectsWithoutTeams) {
      try {
        console.log(`📋 Создание команды для проекта: ${project.title || 'Без названия'}`);
        
        // Определяем название команды
        const teamName = project.title ? `Команда "${project.title}"` : `Команда проекта ${project.id.substring(0, 8)}`;
        
        // Определяем PM команды
        const pmId = project.pmId || project.manager || null;
        
        // Создаем данные команды
        const teamData = {
          name: teamName,
          description: project.description || `Команда для проекта "${project.title || 'Без названия'}"`,
          projectId: project.id,
          pmId: pmId,
          memberIds: [],
          members: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          // Добавляем метаданные
          autoCreated: true,
          createdFrom: 'project'
        };
        
        // Если есть PM, добавляем его как teamLead
        if (pmId) {
          try {
            const pmDoc = await db.collection('users').doc(pmId).get();
            if (pmDoc.exists) {
              const pmData = pmDoc.data();
              teamData.teamLead = {
                uid: pmId,
                name: pmData.fullName || pmData.displayName || pmData.email,
                email: pmData.email,
                role: 'pm'
              };
              console.log(`   ✅ PM назначен: ${pmData.fullName || pmData.email}`);
            }
          } catch (error) {
            console.log(`   ⚠️ Ошибка получения PM: ${error.message}`);
          }
        } else {
          console.log(`   ⚠️ PM не назначен для проекта`);
        }
        
        // Создаем команду в базе данных
        const teamRef = await db.collection('teams').add(teamData);
        
        createdTeams.push({
          id: teamRef.id,
          name: teamName,
          projectId: project.id,
          projectTitle: project.title,
          pmId: pmId
        });
        
        console.log(`   ✅ Команда создана: ${teamRef.id}`);
        
      } catch (error) {
        console.error(`   ❌ Ошибка создания команды для проекта ${project.id}: ${error.message}`);
        errors.push({
          projectId: project.id,
          projectTitle: project.title,
          error: error.message
        });
      }
    }
    
    // 3. Отчет о результатах
    console.log('\n📊 Результаты создания команд:');
    console.log(`   ✅ Успешно создано: ${createdTeams.length} команд`);
    console.log(`   ❌ Ошибок: ${errors.length}`);
    
    if (createdTeams.length > 0) {
      console.log('\n✅ Созданные команды:');
      createdTeams.forEach((team, index) => {
        console.log(`   ${index + 1}. "${team.name}" (${team.id})`);
        console.log(`      Проект: ${team.projectTitle || 'Без названия'} (${team.projectId})`);
        console.log(`      PM: ${team.pmId || 'Не назначен'}`);
      });
    }
    
    if (errors.length > 0) {
      console.log('\n❌ Ошибки:');
      errors.forEach((error, index) => {
        console.log(`   ${index + 1}. Проект: ${error.projectTitle || 'Без названия'} (${error.projectId})`);
        console.log(`      Ошибка: ${error.error}`);
      });
    }
    
    console.log('\n🎉 Создание команд завершено!');
    
    return { createdTeams, errors };
    
  } catch (error) {
    console.error('\n❌ Критическая ошибка:', error);
    throw error;
  }
}

// Запускаем создание команд
if (require.main === module) {
  createTeamsForProjects().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Критическая ошибка:', error);
    process.exit(1);
  });
}

module.exports = { createTeamsForProjects }; 