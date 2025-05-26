const { auth } = require('../src/config/firebase');

async function testInvitationsEndpoint() {
  try {
    console.log('Testing invitations endpoint...');
    
    // Получаем исполнителя
    const executorEmail = 'executor2@test.test';
    const userRecord = await auth.getUserByEmail(executorEmail);
    
    // Создаем токен для исполнителя
    const customToken = await auth.createCustomToken(userRecord.uid);
    console.log('Created token for executor:', executorEmail);
    
    // Тестируем эндпоинт
    const response = await fetch('http://localhost:3000/api/my-invitations', {
      headers: {
        'Authorization': `Bearer ${customToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Invitations found:', data.length);
      console.log('Invitations:', JSON.stringify(data, null, 2));
    } else {
      const error = await response.text();
      console.log('Error response:', error);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testInvitationsEndpoint().catch(console.error); 