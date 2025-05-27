const admin = require('firebase-admin');
const path = require('path');

// Инициализация Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://taska-4fee2-default-rtdb.firebaseio.com"
});

const db = admin.firestore();

async function createTestApplication() {
  try {
    console.log('🔄 Creating test application...');
    
    const testApplication = {
      projectTitle: 'Тестовый проект для проверки',
      projectDescription: 'Это тестовая заявка для проверки функционала админа. Нужно создать простое веб-приложение для управления задачами.',
      fullName: 'Иван Тестовый',
      phone: '+7 (999) 123-45-67',
      email: 'test@example.com',
      rate: 'Фиксированная',
      startDate: '2024-02-01',
      estimatedDuration: 30,
      estimatedDurationUnit: 'дней',
      coverLetter: 'Здравствуйте! Мне нужно создать систему управления задачами для моей команды. Бюджет ограничен, но готов обсудить детали.',
      techSpec: 'Требуется создать веб-приложение с возможностью создания, редактирования и удаления задач. Должна быть система ролей: администратор и пользователь.',
      status: 'pending',
      createdAt: new Date(),
      type: 'client_request'
    };

    const docRef = await db.collection('applications').add(testApplication);
    console.log('✅ Test application created with ID:', docRef.id);
    
    // Создаем еще одну заявку с другим статусом
    const approvedApplication = {
      ...testApplication,
      projectTitle: 'Одобренный тестовый проект',
      fullName: 'Мария Одобренная',
      phone: '+7 (999) 987-65-43',
      status: 'approved',
      approvedAt: new Date(),
      approvedBy: 'test-admin-id',
      projectId: 'test-project-id-123'
    };

    const docRef2 = await db.collection('applications').add(approvedApplication);
    console.log('✅ Approved test application created with ID:', docRef2.id);

    console.log('🎉 Test applications created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test applications:', error);
    process.exit(1);
  }
}

createTestApplication(); 