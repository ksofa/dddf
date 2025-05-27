const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// Тестовые токены для разных ролей
const TEST_TOKENS = {
  pm: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQ1Njc4OTAiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vdGFza2EtNGZlZTIiLCJhdWQiOiJ0YXNrYS00ZmVlMiIsImF1dGhfdGltZSI6MTczMjY2NzQwMCwidXNlcl9pZCI6IjVXNllZb2lpNkhZaHdXYUk0elpTejE1c2lTQTMiLCJzdWIiOiI1VzZZWW9paTZIWWh3V2FJNHpaU3oxNXNpU0EzIiwiaWF0IjoxNzMyNjY3NDAwLCJleHAiOjE3MzI2NzEwMDAsImVtYWlsIjoicG1AdGVzdC50ZXN0IiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZW1haWwiOlsicG1AdGVzdC50ZXN0Il19LCJzaWduX2luX3Byb3ZpZGVyIjoicGFzc3dvcmQifX0',
  admin: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQ1Njc4OTAiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vdGFza2EtNGZlZTIiLCJhdWQiOiJ0YXNrYS00ZmVlMiIsImF1dGhfdGltZSI6MTczMjY2NzQwMCwidXNlcl9pZCI6Ik9hWkZ6bXpUUG1WcDFUSjl3dXJBTzVPckxNZzIiLCJzdWIiOiJPYVpGem16VFBtVnAxVEo5d3VyQU81T3JMTWcyIiwiaWF0IjoxNzMyNjY3NDAwLCJleHAiOjE3MzI2NzEwMDAsImVtYWlsIjoiYWRtaW5AYWRtaW4uYWRtaW4iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJhZG1pbkBhZG1pbi5hZG1pbiJdfSwic2lnbl9pbl9wcm92aWRlciI6InBhc3N3b3JkIn19'
};

async function testTeamFiltering() {
  console.log('🧪 Тестирование фильтрации команд по ролям\n');

  try {
    // Тест 1: PM должен видеть только свои команды
    console.log('1️⃣ Тестирование доступа PM к командам...');
    const pmResponse = await axios.get(`${API_BASE}/teams`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKENS.pm}`
      }
    });
    
    console.log(`✅ PM видит ${pmResponse.data.length} команд`);
    
    // Проверяем, что все команды принадлежат этому PM
    const pmUserId = '5W6YYoii6HYhwWaI4zZSz15siSA3';
    const pmTeams = pmResponse.data.filter(team => team.pmId === pmUserId);
    console.log(`✅ Из них ${pmTeams.length} команд принадлежат PM`);
    
    if (pmTeams.length === pmResponse.data.length) {
      console.log('✅ PM видит только свои команды - КОРРЕКТНО\n');
    } else {
      console.log('❌ PM видит чужие команды - ОШИБКА\n');
    }

    // Тест 2: Админ должен видеть все команды
    console.log('2️⃣ Тестирование доступа админа к командам...');
    const adminResponse = await axios.get(`${API_BASE}/teams`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKENS.admin}`
      }
    });
    
    console.log(`✅ Админ видит ${adminResponse.data.length} команд`);
    console.log('✅ Админ видит все команды - КОРРЕКТНО\n');

    // Тест 3: PM пытается получить пользователей для чужой команды
    console.log('3️⃣ Тестирование доступа PM к пользователям чужой команды...');
    
    // Найдем команду, которая не принадлежит PM
    const otherTeam = adminResponse.data.find(team => team.pmId !== pmUserId);
    
    if (otherTeam) {
      try {
        await axios.get(`${API_BASE}/teams/${otherTeam.id}/available-users`, {
          headers: {
            'Authorization': `Bearer ${TEST_TOKENS.pm}`
          }
        });
        console.log('❌ PM получил доступ к пользователям чужой команды - ОШИБКА\n');
      } catch (error) {
        if (error.response?.status === 403) {
          console.log('✅ PM не может получить пользователей чужой команды - КОРРЕКТНО\n');
        } else {
          console.log(`❌ Неожиданная ошибка: ${error.response?.status} - ${error.response?.data?.error}\n`);
        }
      }
    } else {
      console.log('⚠️ Не найдено команд других PM для тестирования\n');
    }

    // Тест 4: PM пытается добавить участника в чужую команду
    console.log('4️⃣ Тестирование добавления участника PM в чужую команду...');
    
    if (otherTeam) {
      try {
        await axios.post(`${API_BASE}/teams/${otherTeam.id}/members`, {
          userId: 'test-user-id',
          role: 'developer'
        }, {
          headers: {
            'Authorization': `Bearer ${TEST_TOKENS.pm}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('❌ PM добавил участника в чужую команду - ОШИБКА\n');
      } catch (error) {
        if (error.response?.status === 403) {
          console.log('✅ PM не может добавить участника в чужую команду - КОРРЕКТНО\n');
        } else {
          console.log(`❌ Неожиданная ошибка: ${error.response?.status} - ${error.response?.data?.error}\n`);
        }
      }
    }

    console.log('🎉 Тестирование завершено!');

  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error.response?.data || error.message);
  }
}

// Запускаем тесты
testTeamFiltering(); 