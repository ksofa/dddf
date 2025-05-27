const { db } = require('../src/config/firebase');

async function fixUsersWithoutRoles() {
  console.log('🔧 Fixing users without roles...');
  
  try {
    const usersSnapshot = await db.collection('users').get();
    let fixedUsers = 0;
    
    for (const doc of usersSnapshot.docs) {
      const data = doc.data();
      const roles = data.roles || [];
      
      if (roles.length === 0) {
        // Определяем роль по email или другим признакам
        let defaultRole = 'customer'; // По умолчанию заказчик
        
        const email = data.email || '';
        const name = data.displayName || data.fullName || '';
        
        // Определяем роль по email
        if (email.includes('pm@') || email.includes('manager') || name.toLowerCase().includes('менеджер')) {
          defaultRole = 'pm';
        } else if (email.includes('admin@') || email.includes('presale') || name.toLowerCase().includes('админ')) {
          defaultRole = 'admin';
        } else if (email.includes('executor') || email.includes('dev') || email.includes('designer') || email.includes('qa')) {
          defaultRole = 'executor';
        }
        
        // Специальные случаи для тестовых пользователей
        if (doc.id.includes('dev-') || doc.id.includes('designer-') || doc.id.includes('qa-')) {
          defaultRole = 'executor';
        } else if (doc.id.includes('teamlead-')) {
          defaultRole = 'pm';
        }
        
        await doc.ref.update({
          roles: [defaultRole],
          updatedAt: new Date()
        });
        
        fixedUsers++;
        console.log(`  ✓ Fixed user ${email || doc.id}: assigned role "${defaultRole}"`);
      }
    }
    
    console.log(`✅ Fixed ${fixedUsers} users without roles`);
    
    // Проверяем результат
    console.log('\n📊 Final role distribution:');
    const finalSnapshot = await db.collection('users').get();
    const roleStats = {
      customer: 0,
      executor: 0,
      pm: 0,
      admin: 0
    };
    
    finalSnapshot.docs.forEach(doc => {
      const roles = doc.data().roles || [];
      roles.forEach(role => {
        if (roleStats[role] !== undefined) {
          roleStats[role]++;
        }
      });
    });
    
    Object.entries(roleStats).forEach(([role, count]) => {
      console.log(`  - ${role}: ${count} users`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing users:', error);
    throw error;
  }
}

if (require.main === module) {
  fixUsersWithoutRoles()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fix failed:', error);
      process.exit(1);
    });
}

module.exports = { fixUsersWithoutRoles }; 