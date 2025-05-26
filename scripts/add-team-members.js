const { auth, db } = require('../src/config/firebase');

async function addTeamMembers() {
  try {
    console.log('Adding team members to project...');
    
    // Получаем проект
    const projectId = 'U8QfJH4WsYJeA8zbyCYZ'; // ID тестового проекта
    const projectRef = db.collection('projects').doc(projectId);
    const projectDoc = await projectRef.get();
    
    if (!projectDoc.exists) {
      console.log('Project not found');
      return;
    }
    
    const projectData = projectDoc.data();
    console.log('Current project:', projectData.title);
    console.log('Current team members:', projectData.teamMembers);
    
    // Получаем всех проект-менеджеров
    const usersSnapshot = await db.collection('users').get();
    const projectManagers = [];
    
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      if (userData.roles && userData.roles.includes('project_manager')) {
        projectManagers.push({
          id: doc.id,
          name: userData.displayName || userData.fullName,
          email: userData.email,
          specialization: userData.specialization
        });
      }
    });
    
    console.log('Available project managers:', projectManagers.length);
    
    // Добавляем первых 3 PM в команду (если их еще нет)
    const currentMembers = projectData.teamMembers || [];
    const newMembers = [...currentMembers];
    
    for (let i = 0; i < Math.min(3, projectManagers.length); i++) {
      const pm = projectManagers[i];
      if (!newMembers.includes(pm.id)) {
        newMembers.push(pm.id);
        console.log(`Added ${pm.name} (${pm.specialization}) to team`);
      }
    }
    
    // Обновляем проект
    await projectRef.update({
      teamMembers: newMembers,
      team: newMembers, // Дублируем для совместимости
      updatedAt: new Date()
    });
    
    console.log('Team updated successfully!');
    console.log('New team members:', newMembers);
    
  } catch (error) {
    console.error('Error adding team members:', error);
  }
}

addTeamMembers().then(() => {
  console.log('Script completed');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
}); 