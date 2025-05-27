const admin = require('firebase-admin');
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

async function checkTeamsStructure() {
  try {
    console.log('🔍 Проверка структуры команд...\n');
    
    const teamsSnapshot = await db.collection('teams').get();
    
    console.log(`Найдено команд: ${teamsSnapshot.docs.length}\n`);
    
    teamsSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`Команда ${index + 1}:`);
      console.log(`  ID: ${doc.id}`);
      console.log(`  Название: ${data.name || 'Не указано'}`);
      console.log(`  Поля в документе:`, Object.keys(data));
      console.log(`  pmId: ${data.pmId || 'НЕТ'}`);
      console.log(`  createdBy: ${data.createdBy || 'НЕТ'}`);
      console.log(`  projectId: ${data.projectId || 'НЕТ'}`);
      console.log(`  memberIds: ${data.memberIds ? JSON.stringify(data.memberIds) : 'НЕТ'}`);
      console.log(`  members: ${data.members ? 'ЕСТЬ' : 'НЕТ'}`);
      console.log('  ---');
    });
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}

checkTeamsStructure().then(() => {
  console.log('\n✅ Проверка завершена');
  process.exit(0);
}).catch(error => {
  console.error('❌ Критическая ошибка:', error);
  process.exit(1);
}); 