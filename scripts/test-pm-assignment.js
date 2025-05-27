const { db, auth } = require('../src/config/firebase');
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000/api';

async function generateAdminToken() {
  try {
    // ID админа из базы данных
    const adminUid = 'ixClpAfDIoQQR0X8Zja8N7SM4gz2';
    const customToken = await auth.createCustomToken(adminUid);
    return customToken;
  } catch (error) {
    console.error('Error generating admin token:', error);
    throw error;
  }
}

async function findPendingApplication() {
  try {
    const applicationsSnapshot = await db.collection('applications')
      .where('status', '==', 'pending')
      .limit(1)
      .get();
    
    if (applicationsSnapshot.empty) {
      console.log('❌ Нет заявок со статусом pending');
      return null;
    }
    
    const doc = applicationsSnapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error('Error finding pending application:', error);
    return null;
  }
}

async function findProjectManager() {
  try {
    const usersSnapshot = await db.collection('users')
      .where('roles', 'array-contains', 'pm')
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      console.log('❌ Нет пользователей с ролью PM');
      return null;
    }
    
    const doc = usersSnapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error('Error finding PM:', error);
    return null;
  }
}

async function testSimpleRequest(token) {
  try {
    console.log('🔄 Тестируем простой запрос к API...');
    const response = await fetch(`${API_BASE}/applications`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Статус ответа:', response.status);
    
    if (response.ok) {
      const applications = await response.json();
      console.log('✅ Простой запрос успешен, заявок:', applications.length);
      return true;
    } else {
      const error = await response.text();
      console.log('❌ Ошибка простого запроса:', error);
      return false;
    }
  } catch (error) {
    console.error('❌ Ошибка простого запроса:', error);
    return false;
  }
}

async function testPMAssignment() {
  try {
    console.log('🔄 Генерируем токен админа...');
    const adminToken = await generateAdminToken();
    console.log('✅ Токен админа сгенерирован');

    // Тестируем простой запрос
    const simpleRequestOk = await testSimpleRequest(adminToken);
    if (!simpleRequestOk) {
      console.log('❌ Простой запрос не прошел, прерываем тестирование');
      return;
    }

    console.log('🔄 Ищем заявку со статусом pending...');
    const application = await findPendingApplication();
    if (!application) {
      console.log('❌ Не найдено заявок для тестирования');
      return;
    }
    console.log('✅ Найдена заявка:', application.id, '-', application.projectTitle);

    console.log('🔄 Ищем проект-менеджера...');
    const pm = await findProjectManager();
    if (!pm) {
      console.log('❌ Не найдено PM для тестирования');
      return;
    }
    console.log('✅ Найден PM:', pm.id, '-', pm.displayName);
    console.log('🔍 PM данные:', { id: pm.id, uid: pm.uid, roles: pm.roles });

    const pmId = pm.uid || pm.id;
    console.log('🔍 Используем pmId:', pmId);

    console.log('🔄 Назначаем PM к заявке...');
    const requestBody = { pmId: pmId };
    console.log('🔍 Тело запроса:', JSON.stringify(requestBody));
    
    const response = await fetch(`${API_BASE}/applications/${application.id}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📊 Статус ответа:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ PM успешно назначен!');
      console.log('📋 Результат:', result);
      
      // Проверяем, что заявка обновилась
      const updatedApp = await db.collection('applications').doc(application.id).get();
      if (updatedApp.exists) {
        const data = updatedApp.data();
        console.log('📊 Обновленная заявка:');
        console.log('  - Статус:', data.status);
        console.log('  - Назначенный PM:', data.assignedPM);
        console.log('  - ID проекта:', data.projectId);
      }
    } else {
      const error = await response.text();
      console.log('❌ Ошибка при назначении PM:', error);
    }

  } catch (error) {
    console.error('❌ Ошибка тестирования:', error);
  }
}

async function main() {
  console.log('🚀 Начинаем тестирование назначения PM к заявке...\n');
  
  await testPMAssignment();
  
  console.log('\n✅ Тестирование завершено');
  process.exit(0);
}

main().catch(console.error); 