const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function diagnosePMData() {
  try {
    console.log('🔍 Диагностика данных PM пользователя...\n');
    
    // Найти PM пользователя
    const usersSnapshot = await db.collection('users')
      .where('email', '==', 'pm@test.test')
      .get();
    
    if (usersSnapshot.empty) {
      console.log('❌ PM пользователь не найден');
      return;
    }
    
    const pmUser = usersSnapshot.docs[0];
    const pmData = pmUser.data();
    console.log('👤 PM пользователь найден:');
    console.log(`   ID: ${pmUser.id}`);
    console.log(`   Email: ${pmData.email}`);
    console.log(`   Роли: ${pmData.roles?.join(', ')}`);
    console.log('');
    
    // Проверить проекты где PM является PM
    console.log('📋 Проекты где пользователь является PM:');
    const projectsSnapshot = await db.collection('projects')
      .where('pm.uid', '==', pmUser.id)
      .get();
    
    console.log(`   Найдено проектов: ${projectsSnapshot.size}`);
    const projectIds = [];
    
    projectsSnapshot.forEach(doc => {
      const project = doc.data();
      projectIds.push(doc.id);
      console.log(`   - ${project.name} (ID: ${doc.id})`);
      console.log(`     Описание: ${project.description}`);
      console.log(`     PM: ${project.pm?.displayName || project.pm?.name}`);
      console.log('');
    });
    
    // Проверить команды
    console.log('👥 Все команды в системе:');
    const allTeamsSnapshot = await db.collection('teams').get();
    console.log(`   Всего команд: ${allTeamsSnapshot.size}`);
    
    allTeamsSnapshot.forEach(doc => {
      const team = doc.data();
      console.log(`   - ${team.name} (ID: ${doc.id})`);
      console.log(`     Проект: ${team.projectId || 'Не указан'}`);
      console.log(`     Участников: ${team.members?.length || 0}`);
      
      if (team.members) {
        team.members.forEach(member => {
          console.log(`       * ${member.name} (${member.role})`);
        });
      }
      console.log('');
    });
    
    // Проверить команды связанные с проектами PM
    console.log('🔗 Команды связанные с проектами PM:');
    for (const projectId of projectIds) {
      const teamsSnapshot = await db.collection('teams')
        .where('projectId', '==', projectId)
        .get();
      
      console.log(`   Проект ${projectId}: ${teamsSnapshot.size} команд`);
      teamsSnapshot.forEach(doc => {
        const team = doc.data();
        console.log(`     - ${team.name} (ID: ${doc.id})`);
      });
    }
    
    // Проверить команды где PM является участником
    console.log('\n👤 Команды где PM является участником:');
    const memberTeamsSnapshot = await db.collection('teams')
      .where('members', 'array-contains-any', [
        { uid: pmUser.id },
        { id: pmUser.id }
      ])
      .get();
    
    console.log(`   Найдено команд: ${memberTeamsSnapshot.size}`);
    memberTeamsSnapshot.forEach(doc => {
      const team = doc.data();
      console.log(`   - ${team.name} (ID: ${doc.id})`);
    });
    
    // Проверить приглашения
    console.log('\n📧 Приглашения в команды:');
    const invitationsSnapshot = await db.collection('team_invitations').get();
    console.log(`   Всего приглашений: ${invitationsSnapshot.size}`);
    
    invitationsSnapshot.forEach(doc => {
      const invitation = doc.data();
      console.log(`   - От: ${invitation.senderName} к: ${invitation.receiverName}`);
      console.log(`     Команда: ${invitation.teamName}`);
      console.log(`     Статус: ${invitation.status}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Ошибка при диагностике:', error);
  }
}

diagnosePMData().then(() => {
  console.log('✅ Диагностика завершена');
  process.exit(0);
}).catch(error => {
  console.error('❌ Критическая ошибка:', error);
  process.exit(1);
}); 