const { db } = require('../src/config/firebase');

async function checkUsers() {
  try {
    console.log('Checking users in Firebase...');
    
    const usersSnapshot = await db.collection('users').get();
    console.log('Total users found:', usersSnapshot.size);
    
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`User: ${data.email} | Roles: ${JSON.stringify(data.roles)} | UID: ${doc.id}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

checkUsers(); 