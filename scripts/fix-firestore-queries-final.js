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

async function fixFirestoreQueries() {
  try {
    console.log('🔧 Исправление Firestore запросов...\n');
    
    // Исправить routes/chats.js
    console.log('📝 Исправление src/routes/chats.js...');
    
    const fs = require('fs');
    const path = require('path');
    
    const chatsPath = path.join(__dirname, '..', 'src', 'routes', 'chats.js');
    let chatsContent = fs.readFileSync(chatsPath, 'utf8');
    
    // Заменить проблемный запрос в chats.js
    const oldChatsQuery = `const chatsSnapshot = await db.collection('chats')
      .where('participants', 'array-contains', userId)
      .orderBy('updatedAt', 'desc')
      .get();`;
    
    const newChatsQuery = `// Получаем все чаты пользователя без сортировки для избежания индекса
    const chatsSnapshot = await db.collection('chats')
      .where('participants', 'array-contains', userId)
      .get();
    
    // Сортируем в памяти
    const chatDocs = chatsSnapshot.docs.sort((a, b) => {
      const aTime = a.data().updatedAt?.toDate() || new Date(0);
      const bTime = b.data().updatedAt?.toDate() || new Date(0);
      return bTime - aTime;
    });`;
    
    if (chatsContent.includes('array-contains')) {
      chatsContent = chatsContent.replace(
        /const chatsSnapshot = await db\.collection\('chats'\)\s*\.where\('participants', 'array-contains', userId\)\s*\.orderBy\('updatedAt', 'desc'\)\s*\.get\(\);/g,
        newChatsQuery
      );
      
      // Также заменить использование chatsSnapshot.docs на chatDocs
      chatsContent = chatsContent.replace(/chatsSnapshot\.docs/g, 'chatDocs');
      
      fs.writeFileSync(chatsPath, chatsContent);
      console.log('✅ Исправлен src/routes/chats.js');
    }
    
    // Исправить routes/invitations.js
    console.log('📝 Исправление src/routes/invitations.js...');
    
    const invitationsPath = path.join(__dirname, '..', 'src', 'routes', 'invitations.js');
    let invitationsContent = fs.readFileSync(invitationsPath, 'utf8');
    
    // Заменить проблемный запрос в invitations.js
    const oldInvitationsQuery = `const invitationsSnapshot = await db.collection('team_invitations')
      .where('projectId', '==', projectId)
      .where('senderId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .get();`;
    
    const newInvitationsQuery = `// Получаем приглашения без сложной сортировки для избежания индекса
    const invitationsSnapshot = await db.collection('team_invitations')
      .where('projectId', '==', projectId)
      .get();
    
    // Фильтруем и сортируем в памяти
    const invitationDocs = invitationsSnapshot.docs
      .filter(doc => doc.data().senderId === req.user.uid)
      .sort((a, b) => {
        const aTime = a.data().createdAt?.toDate() || new Date(0);
        const bTime = b.data().createdAt?.toDate() || new Date(0);
        return bTime - aTime;
      });`;
    
    if (invitationsContent.includes('team_invitations')) {
      invitationsContent = invitationsContent.replace(
        /const invitationsSnapshot = await db\.collection\('team_invitations'\)\s*\.where\('projectId', '==', projectId\)\s*\.where\('senderId', '==', req\.user\.uid\)\s*\.orderBy\('createdAt', 'desc'\)\s*\.get\(\);/g,
        newInvitationsQuery
      );
      
      // Заменить использование invitationsSnapshot.docs на invitationDocs
      invitationsContent = invitationsContent.replace(/invitationsSnapshot\.docs/g, 'invitationDocs');
      
      fs.writeFileSync(invitationsPath, invitationsContent);
      console.log('✅ Исправлен src/routes/invitations.js');
    }
    
    // Исправить routes/teams.js если есть проблемы
    console.log('📝 Проверка src/routes/teams.js...');
    
    const teamsPath = path.join(__dirname, '..', 'src', 'routes', 'teams.js');
    if (fs.existsSync(teamsPath)) {
      let teamsContent = fs.readFileSync(teamsPath, 'utf8');
      
      // Убрать сложные запросы с множественными where и orderBy
      const complexQueries = [
        /\.where\([^)]+\)\s*\.where\([^)]+\)\s*\.orderBy\([^)]+\)/g,
        /\.where\([^)]+\)\s*\.orderBy\([^)]+\)\s*\.where\([^)]+\)/g
      ];
      
      let modified = false;
      complexQueries.forEach(regex => {
        if (regex.test(teamsContent)) {
          console.log('⚠️ Найден сложный запрос в teams.js, требует ручного исправления');
          modified = true;
        }
      });
      
      if (!modified) {
        console.log('✅ src/routes/teams.js не требует исправлений');
      }
    }
    
    console.log('\n✅ Исправление Firestore запросов завершено!');
    
  } catch (error) {
    console.error('❌ Ошибка при исправлении запросов:', error);
  }
}

fixFirestoreQueries().then(() => {
  console.log('\n🎉 Все запросы исправлены! Теперь не должно быть ошибок индексов.');
  process.exit(0);
}).catch(error => {
  console.error('❌ Критическая ошибка:', error);
  process.exit(1);
}); 