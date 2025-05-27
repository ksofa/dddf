const { db } = require('../src/config/firebase');

async function deleteAllTeams() {
  try {
    console.log('🗑️ Удаление всех команд...');
    
    // Получаем все команды
    const teamsSnapshot = await db.collection('teams').get();
    console.log(`Найдено команд: ${teamsSnapshot.size}`);
    
    if (teamsSnapshot.empty) {
      console.log('✅ Команды не найдены');
      return;
    }
    
    // Удаляем команды батчами
    const batch = db.batch();
    let count = 0;
    
    teamsSnapshot.docs.forEach(doc => {
      console.log(`Удаляем команду: ${doc.data().name || doc.id}`);
      batch.delete(doc.ref);
      count++;
    });
    
    await batch.commit();
    console.log(`✅ Удалено команд: ${count}`);
    
    // Также удаляем приглашения в команды
    console.log('🗑️ Удаление приглашений в команды...');
    const invitationsSnapshot = await db.collection('team_invitations').get();
    console.log(`Найдено приглашений: ${invitationsSnapshot.size}`);
    
    if (!invitationsSnapshot.empty) {
      const invitationsBatch = db.batch();
      let invitationsCount = 0;
      
      invitationsSnapshot.docs.forEach(doc => {
        invitationsBatch.delete(doc.ref);
        invitationsCount++;
      });
      
      await invitationsBatch.commit();
      console.log(`✅ Удалено приглашений: ${invitationsCount}`);
    }
    
    console.log('🎉 Все команды и приглашения успешно удалены!');
    
  } catch (error) {
    console.error('❌ Ошибка при удалении команд:', error);
  }
  
  process.exit(0);
}

deleteAllTeams(); 