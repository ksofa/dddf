const admin = require('firebase-admin');
const fetch = require('node-fetch');

// Инициализация Firebase Admin
const serviceAccount = require('../src/config/serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://taska-app-default-rtdb.firebaseio.com"
  });
}

const API_BASE = 'http://localhost:3000/api';

async function generateToken(uid) {
  try {
    const customToken = await admin.auth().createCustomToken(uid);
    return customToken;
  } catch (error) {
    console.error('Error generating token:', error);
    throw error;
  }
}

async function testInvitationSystem() {
  console.log('🧪 Тестирование системы заявок...\n');

  try {
    // 1. Генерируем токены
    console.log('1. Генерация токенов...');
    const pmToken = await generateToken('5W6YYoii6HYhwWaI4zZSz15siSA3'); // PM
    const executorToken = await generateToken('frontend1_uid'); // Исполнитель
    console.log('✅ Токены сгенерированы\n');

    // 2. Отправляем заявку от PM к исполнителю
    console.log('2. Отправка заявки от PM к исполнителю...');
    const inviteResponse = await fetch(`${API_BASE}/projects/project-1/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${pmToken}`
      },
      body: JSON.stringify({
        userId: 'frontend1_uid',
        message: 'Приглашаем вас присоединиться к проекту! Ваши навыки frontend разработки будут очень полезны.'
      })
    });

    if (inviteResponse.ok) {
      const inviteResult = await inviteResponse.json();
      console.log('✅ Заявка отправлена:', inviteResult);
    } else {
      const error = await inviteResponse.json();
      console.log('❌ Ошибка отправки заявки:', error);
    }
    console.log('');

    // 3. Получаем заявки для исполнителя
    console.log('3. Получение заявок для исполнителя...');
    const invitationsResponse = await fetch(`${API_BASE}/invitations?status=pending`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${executorToken}`
      }
    });

    if (invitationsResponse.ok) {
      const invitations = await invitationsResponse.json();
      console.log('✅ Заявки получены:', invitations.length, 'шт.');
      
      if (invitations.length > 0) {
        const invitation = invitations[0];
        console.log('📋 Первая заявка:', {
          id: invitation.id,
          projectName: invitation.projectName,
          senderName: invitation.senderName,
          message: invitation.message,
          status: invitation.status
        });

        // 4. Принимаем заявку
        console.log('\n4. Принятие заявки...');
        const respondResponse = await fetch(`${API_BASE}/invitations/${invitation.id}/respond`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${executorToken}`
          },
          body: JSON.stringify({
            action: 'accept'
          })
        });

        if (respondResponse.ok) {
          const respondResult = await respondResponse.json();
          console.log('✅ Заявка принята:', respondResult);
        } else {
          const error = await respondResponse.json();
          console.log('❌ Ошибка принятия заявки:', error);
        }
      }
    } else {
      const error = await invitationsResponse.json();
      console.log('❌ Ошибка получения заявок:', error);
    }
    console.log('');

    // 5. Проверяем отправленные заявки для PM
    console.log('5. Получение отправленных заявок для PM...');
    const projectInvitationsResponse = await fetch(`${API_BASE}/projects/project-1/invitations`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${pmToken}`
      }
    });

    if (projectInvitationsResponse.ok) {
      const projectInvitations = await projectInvitationsResponse.json();
      console.log('✅ Отправленные заявки:', projectInvitations.length, 'шт.');
      projectInvitations.forEach((inv, index) => {
        console.log(`📤 Заявка ${index + 1}:`, {
          userName: inv.userName,
          status: inv.status,
          message: inv.message.substring(0, 50) + '...'
        });
      });
    } else {
      const error = await projectInvitationsResponse.json();
      console.log('❌ Ошибка получения отправленных заявок:', error);
    }

    console.log('\n🎉 Тестирование завершено!');

  } catch (error) {
    console.error('❌ Ошибка тестирования:', error);
  }
}

// Запускаем тест
testInvitationSystem(); 