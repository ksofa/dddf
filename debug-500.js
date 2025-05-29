const https = require('https');

const API_URL = 'https://dddf-1.onrender.com';

// Тестируем различные эндпоинты
const tests = [
  {
    name: 'Health Check',
    method: 'GET',
    path: '/api/health'
  },
  {
    name: 'Firebase Test',
    method: 'GET',
    path: '/api/firebase-test'
  },
  {
    name: 'Login',
    method: 'POST',
    path: '/api/auth/login',
    data: JSON.stringify({
      email: 'pm@mail.ru',
      password: '123456'
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  },
  {
    name: 'Applications (no auth)',
    method: 'GET',
    path: '/api/applications'
  },
  {
    name: 'Projects (no auth)',
    method: 'GET',
    path: '/api/projects'
  },
  {
    name: 'Teams (no auth)',
    method: 'GET',
    path: '/api/teams'
  },
  {
    name: 'Root',
    method: 'GET',
    path: '/'
  },
  {
    name: 'Non-existent endpoint',
    method: 'GET',
    path: '/api/nonexistent'
  }
];

function makeRequest(test) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'dddf-1.onrender.com',
      port: 443,
      path: test.path,
      method: test.method,
      headers: test.headers || {}
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          name: test.name,
          status: res.statusCode,
          headers: res.headers,
          body: data.substring(0, 200) + (data.length > 200 ? '...' : ''),
          success: res.statusCode < 500
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        name: test.name,
        status: 'ERROR',
        error: err.message,
        success: false
      });
    });

    if (test.data) {
      req.write(test.data);
    }
    
    req.end();
  });
}

async function runDiagnostics() {
  console.log('🔍 Диагностика 500 ошибок...\n');
  
  for (const test of tests) {
    const result = await makeRequest(test);
    const status = result.success ? '✅' : '❌';
    const statusCode = result.status;
    
    console.log(`${status} ${test.name}: ${statusCode}`);
    
    if (statusCode >= 500) {
      console.log(`   🚨 500 ERROR DETAILS:`);
      console.log(`   Body: ${result.body}`);
      console.log(`   Headers: ${JSON.stringify(result.headers, null, 2)}`);
    } else if (statusCode >= 400) {
      console.log(`   ⚠️  Client error: ${result.body.substring(0, 100)}`);
    }
    
    console.log('');
  }
  
  console.log('🎯 Диагностика завершена!');
}

runDiagnostics(); 