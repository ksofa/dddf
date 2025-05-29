const https = require('https');

async function getAdminToken() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      email: 'admin@mail.ru',
      password: '123456'
    });

    const options = {
      hostname: 'dddf-1.onrender.com',
      port: 443,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (parsed.token) {
            resolve(parsed.token);
          } else {
            reject(new Error('No token in response: ' + responseData));
          }
        } catch (e) {
          reject(new Error('Failed to parse response: ' + responseData));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function getApplications(token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'dddf-1.onrender.com',
      port: 443,
      path: '/api/applications',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve(parsed);
        } catch (e) {
          reject(new Error('Failed to parse applications: ' + responseData));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function approveApplication(token, applicationId, pmId) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ pmId });

    const options = {
      hostname: 'dddf-1.onrender.com',
      port: 443,
      path: `/api/applications/${applicationId}/approve`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          body: responseData,
          headers: res.headers
        });
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function testApprove() {
  try {
    console.log('🔍 Тестирование approve application...\n');

    // 1. Получаем токен админа
    console.log('1. Получение токена админа...');
    const token = await getAdminToken();
    console.log('✅ Токен получен');

    // 2. Получаем список заявок
    console.log('\n2. Получение списка заявок...');
    const applications = await getApplications(token);
    console.log(`✅ Найдено заявок: ${applications.length}`);

    if (applications.length === 0) {
      console.log('❌ Нет заявок для тестирования');
      return;
    }

    // 3. Находим pending заявку
    const pendingApp = applications.find(app => app.status === 'pending');
    if (!pendingApp) {
      console.log('❌ Нет pending заявок для тестирования');
      console.log('Доступные заявки:', applications.map(app => ({
        id: app.id,
        status: app.status,
        type: app.type
      })));
      return;
    }

    console.log(`✅ Найдена pending заявка: ${pendingApp.id}`);

    // 4. Пытаемся одобрить заявку
    console.log('\n3. Попытка одобрения заявки...');
    const pmId = 'hZG4fAIUJZfKEEKczZ37mQhZFST2'; // PM user ID
    
    const result = await approveApplication(token, pendingApp.id, pmId);
    
    console.log(`Статус ответа: ${result.status}`);
    console.log(`Тело ответа: ${result.body}`);
    
    if (result.status >= 500) {
      console.log('🚨 500 ERROR DETECTED!');
      console.log('Headers:', JSON.stringify(result.headers, null, 2));
    } else if (result.status >= 400) {
      console.log('⚠️ Client error');
    } else {
      console.log('✅ Успешно!');
    }

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

testApprove(); 