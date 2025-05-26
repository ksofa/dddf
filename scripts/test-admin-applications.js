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

async function testApplicationsAccess() {
  try {
    console.log('🔄 Генерируем токен админа...');
    const adminToken = await generateAdminToken();
    console.log('✅ Токен админа сгенерирован');

    console.log('🔄 Тестируем доступ к заявкам...');
    const response = await fetch(`${API_BASE}/applications`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Статус ответа:', response.status);
    
    if (response.ok) {
      const applications = await response.json();
      console.log('✅ Заявки успешно получены:', applications.length);
      console.log('📋 Первые 3 заявки:', applications.slice(0, 3));
    } else {
      const error = await response.text();
      console.log('❌ Ошибка при получении заявок:', error);
    }

  } catch (error) {
    console.error('❌ Ошибка тестирования:', error);
  }
}

async function createTestApplication() {
  try {
    console.log('🔄 Создаем тестовую заявку...');
    
    const testApplication = {
      type: 'client_request',
      projectTitle: 'Тестовый проект для админа',
      projectDescription: 'Описание тестового проекта',
      budget: 100000,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // через 30 дней
      status: 'pending',
      senderId: 'test-client-id',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await db.collection('applications').add(testApplication);
    
    console.log('✅ Тестовая заявка создана с ID:', docRef.id);
    return docRef.id;
    
  } catch (error) {
    console.error('❌ Ошибка создания тестовой заявки:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Начинаем тестирование доступа админа к заявкам...\n');
  
  // Создаем тестовую заявку
  await createTestApplication();
  
  // Тестируем доступ
  await testApplicationsAccess();
  
  console.log('\n✅ Тестирование завершено');
  process.exit(0);
}

main().catch(console.error); 