const https = require('https');

async function getUsers() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'dddf-1.onrender.com',
      port: 443,
      path: '/api/users',
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve(parsed);
        } catch (e) {
          reject(new Error('Failed to parse users: ' + responseData));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function checkUsers() {
  try {
    console.log('🔍 Проверка пользователей в системе...\n');
    
    const users = await getUsers();
    console.log(`Найдено пользователей: ${users.length}\n`);
    
    users.forEach(user => {
      console.log(`ID: ${user.id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Роли: ${JSON.stringify(user.roles)}`);
      console.log(`---`);
    });
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

checkUsers(); 