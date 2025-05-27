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

async function fixPMProjects() {
  try {
    console.log('🔧 Исправление проектов и команд PM...\n');
    
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
    console.log('👤 PM пользователь найден:', pmData.email);
    
    // Проверить все проекты
    console.log('\n📋 Все проекты в системе:');
    const allProjectsSnapshot = await db.collection('projects').get();
    console.log(`   Всего проектов: ${allProjectsSnapshot.size}`);
    
    allProjectsSnapshot.forEach(doc => {
      const project = doc.data();
      console.log(`   - ${project.name} (ID: ${doc.id})`);
      console.log(`     PM: ${project.pm?.displayName || project.pm?.name || 'Не указан'}`);
      console.log(`     PM UID: ${project.pm?.uid || 'Не указан'}`);
      console.log('');
    });
    
    // Создать 2 тестовых проекта для PM
    console.log('🏗️ Создание проектов для PM...');
    
    const project1Data = {
      name: 'Разработка личного кабинета МТС и сервиса',
      description: 'Проект по разработке личного кабинета для клиентов МТС с интеграцией различных сервисов',
      status: 'active',
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      pm: {
        uid: pmUser.id,
        name: pmData.displayName || pmData.name || 'PM User',
        displayName: pmData.displayName || pmData.name || 'PM User',
        email: pmData.email,
        role: 'pm'
      },
      budget: 1500000,
      deadline: admin.firestore.Timestamp.fromDate(new Date('2024-12-31')),
      priority: 'high',
      tags: ['web', 'mobile', 'integration'],
      teamSize: 5,
      technologies: ['React', 'Node.js', 'PostgreSQL', 'Docker']
    };
    
    const project2Data = {
      name: 'Мобильное приложение для управления услугами',
      description: 'Разработка мобильного приложения для управления телекоммуникационными услугами',
      status: 'active',
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      pm: {
        uid: pmUser.id,
        name: pmData.displayName || pmData.name || 'PM User',
        displayName: pmData.displayName || pmData.name || 'PM User',
        email: pmData.email,
        role: 'pm'
      },
      budget: 2000000,
      deadline: admin.firestore.Timestamp.fromDate(new Date('2025-06-30')),
      priority: 'medium',
      tags: ['mobile', 'ios', 'android'],
      teamSize: 4,
      technologies: ['React Native', 'Firebase', 'Redux']
    };
    
    // Создать проекты
    const project1Ref = await db.collection('projects').add(project1Data);
    console.log(`✅ Создан проект 1: ${project1Data.name} (ID: ${project1Ref.id})`);
    
    const project2Ref = await db.collection('projects').add(project2Data);
    console.log(`✅ Создан проект 2: ${project2Data.name} (ID: ${project2Ref.id})`);
    
    // Создать команды для проектов
    console.log('\n👥 Создание команд для проектов...');
    
    const team1Data = {
      name: 'Команда разработки МТС',
      description: 'Основная команда разработки личного кабинета МТС',
      projectId: project1Ref.id,
      projectName: project1Data.name,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      members: [{
        uid: pmUser.id,
        id: pmUser.id,
        name: pmData.displayName || pmData.name || 'PM User',
        displayName: pmData.displayName || pmData.name || 'PM User',
        email: pmData.email,
        role: 'pm',
        joinedAt: admin.firestore.Timestamp.now()
      }],
      teamLead: {
        uid: pmUser.id,
        name: pmData.displayName || pmData.name || 'PM User',
        email: pmData.email,
        role: 'pm'
      },
      status: 'active',
      maxMembers: 8
    };
    
    const team2Data = {
      name: 'Команда мобильной разработки',
      description: 'Команда разработки мобильного приложения',
      projectId: project2Ref.id,
      projectName: project2Data.name,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      members: [{
        uid: pmUser.id,
        id: pmUser.id,
        name: pmData.displayName || pmData.name || 'PM User',
        displayName: pmData.displayName || pmData.name || 'PM User',
        email: pmData.email,
        role: 'pm',
        joinedAt: admin.firestore.Timestamp.now()
      }],
      teamLead: {
        uid: pmUser.id,
        name: pmData.displayName || pmData.name || 'PM User',
        email: pmData.email,
        role: 'pm'
      },
      status: 'active',
      maxMembers: 6
    };
    
    // Удалить старую команду без проекта
    console.log('\n🗑️ Удаление старой команды...');
    const oldTeamsSnapshot = await db.collection('teams')
      .where('projectId', '==', null)
      .get();
    
    for (const doc of oldTeamsSnapshot.docs) {
      await doc.ref.delete();
      console.log(`✅ Удалена команда: ${doc.data().name}`);
    }
    
    // Создать новые команды
    const team1Ref = await db.collection('teams').add(team1Data);
    console.log(`✅ Создана команда 1: ${team1Data.name} (ID: ${team1Ref.id})`);
    
    const team2Ref = await db.collection('teams').add(team2Data);
    console.log(`✅ Создана команда 2: ${team2Data.name} (ID: ${team2Ref.id})`);
    
    // Очистить старые приглашения
    console.log('\n🧹 Очистка старых приглашений...');
    const oldInvitationsSnapshot = await db.collection('team_invitations').get();
    for (const doc of oldInvitationsSnapshot.docs) {
      await doc.ref.delete();
    }
    console.log(`✅ Удалено ${oldInvitationsSnapshot.size} старых приглашений`);
    
    console.log('\n✅ Исправление завершено!');
    console.log('📊 Итоговое состояние:');
    console.log(`   - Проектов PM: 2`);
    console.log(`   - Команд: 2`);
    console.log(`   - Приглашений: 0`);
    
  } catch (error) {
    console.error('❌ Ошибка при исправлении:', error);
  }
}

fixPMProjects().then(() => {
  console.log('\n🎉 Все готово! Теперь PM должен видеть свои проекты и команды.');
  process.exit(0);
}).catch(error => {
  console.error('❌ Критическая ошибка:', error);
  process.exit(1);
}); 