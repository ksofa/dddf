// Простой тест API конфигурации
const https = require('https');

const API_URL = 'https://dddf-1.onrender.com/api';

console.log('🔍 Тестирование API конфигурации...');
console.log('🌐 API URL:', API_URL);

// Тест подключения к API
const testConnection = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'dddf-1.onrender.com',
      port: 443,
      path: '/api/health',
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          body: data
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
};

// Тест приглашений
const testInvitations = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'dddf-1.onrender.com',
      port: 443,
      path: '/api/invitations?status=pending',
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          body: data
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
};

async function runTests() {
  try {
    console.log('\n1️⃣ Тест подключения к API...');
    const healthResult = await testConnection();
    console.log('✅ Health check:', healthResult.status);
    
    console.log('\n2️⃣ Тест эндпоинта приглашений...');
    const invitationsResult = await testInvitations();
    console.log('📨 Invitations:', invitationsResult.status);
    
    if (invitationsResult.status === 401) {
      console.log('ℹ️  401 - нужна авторизация (это нормально)');
    } else if (invitationsResult.status === 200) {
      console.log('✅ Успешно получены приглашения');
    } else {
      console.log('⚠️  Неожиданный статус:', invitationsResult.status);
      console.log('Ответ:', invitationsResult.body.substring(0, 200));
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

runTests(); 