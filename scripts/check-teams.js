const { db } = require('../src/config/firebase');

async function checkTeams() {
  try {
    console.log('Checking teams in Firebase...');
    
    // Проверяем все команды
    const allTeamsSnapshot = await db.collection('teams').get();
    console.log('Total teams in collection:', allTeamsSnapshot.size);
    
    // Проверяем наши тестовые команды
    const testTeamsSnapshot = await db.collection('teams').where('projectId', 'in', ['project-1', 'project-2', 'project-3']).get();
    console.log('Test teams found:', testTeamsSnapshot.size);
    
    testTeamsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`Team ${doc.id}:`, {
        name: data.name,
        projectId: data.projectId,
        membersCount: data.members?.length || 0
      });
    });
    
    // Проверяем проекты
    const projectsSnapshot = await db.collection('projects').where('manager', '==', '5W6YYoii6HYhwWaI4zZSz15siSA3').get();
    console.log('PM projects found:', projectsSnapshot.size);
    
    projectsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`Project ${doc.id}:`, {
        title: data.title,
        manager: data.manager
      });
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

checkTeams(); 