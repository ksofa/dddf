// Тест логики определения прав PM пользователя
function testPMPermissions() {
  console.log('🧪 Тестирование логики определения прав PM');
  
  // Данные пользователя PM
  const user = {
    uid: '3zQmIv378cegrTnz5qydFi6p9JH2',
    email: 'pm.data@taska.com',
    roles: ['pm']
  };
  
  // Данные проекта
  const project = {
    id: '8JHAHCKMPrctBDZviiS8',
    manager: '3zQmIv378cegrTnz5qydFi6p9JH2',
    pmId: '3zQmIv378cegrTnz5qydFi6p9JH2',
    teamLead: null
  };
  
  console.log('👤 Пользователь:', user);
  console.log('📋 Проект:', project);
  
  // Логика из frontend (упрощенная версия)
  const isUserPM = user && (
    user.roles?.includes('admin') ||
    user.uid === project.manager ||
    user.uid === project.pmId ||
    user.uid === project.teamLead ||
    (user.roles?.includes('pm') && (
      user.uid === project.manager || 
      user.uid === project.pmId ||
      user.uid === project.teamLead
    ))
  );
  
  console.log('✅ Результат проверки прав PM:', {
    isUserPM,
    canCreateTasks: isUserPM || user?.roles?.includes('admin'),
    checks: {
      isAdmin: user.roles?.includes('admin'),
      isManager: user.uid === project.manager,
      isPmId: user.uid === project.pmId,
      isTeamLead: user.uid === project.teamLead,
      hasPmRole: user.roles?.includes('pm'),
      pmRoleAndManager: user.roles?.includes('pm') && user.uid === project.manager,
      pmRoleAndPmId: user.roles?.includes('pm') && user.uid === project.pmId,
      pmRoleAndTeamLead: user.roles?.includes('pm') && user.uid === project.teamLead
    }
  });
  
  if (isUserPM) {
    console.log('🎉 PM пользователь ДОЛЖЕН видеть кнопки создания задач!');
  } else {
    console.log('❌ PM пользователь НЕ ДОЛЖЕН видеть кнопки создания задач');
  }
}

testPMPermissions(); 