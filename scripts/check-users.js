const axios = require('axios');

async function checkUsers() {
  try {
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@admin.admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    const usersResponse = await axios.get('http://localhost:3000/api/users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const users = usersResponse.data;
    const pms = users.filter(user => user.roles && user.roles.includes('pm'));
    
    console.log('Всего пользователей:', users.length);
    console.log('PM пользователей:', pms.length);
    console.log('\nПервый PM:');
    console.log(JSON.stringify(pms[0], null, 2));
    
    console.log('\nВсе поля первого PM:');
    Object.keys(pms[0]).forEach(key => {
      console.log(`${key}: ${pms[0][key]}`);
    });
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

checkUsers(); 