const { db } = require('../src/config/firebase');

async function deleteUsersWithoutRoles() {
  console.log('🗑️  Deleting users without roles...');
  
  try {
    const usersSnapshot = await db.collection('users').get();
    let deletedUsers = 0;
    const usersToDelete = [];
    
    // Сначала найдем всех пользователей без ролей
    for (const doc of usersSnapshot.docs) {
      const data = doc.data();
      const roles = data.roles || [];
      
      if (roles.length === 0) {
        usersToDelete.push({
          id: doc.id,
          email: data.email || 'no-email',
          name: data.displayName || data.fullName || 'no-name'
        });
      }
    }
    
    console.log(`Found ${usersToDelete.length} users without roles:`);
    usersToDelete.forEach(user => {
      console.log(`  - ${user.email} (${user.name}) [ID: ${user.id}]`);
    });
    
    if (usersToDelete.length === 0) {
      console.log('✅ No users without roles found. Nothing to delete.');
      return;
    }
    
    // Подтверждение удаления
    console.log('\n⚠️  WARNING: This will permanently delete these users!');
    console.log('Press Ctrl+C to cancel or wait 5 seconds to proceed...');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n🗑️  Proceeding with deletion...');
    
    // Удаляем пользователей
    for (const user of usersToDelete) {
      try {
        await db.collection('users').doc(user.id).delete();
        deletedUsers++;
        console.log(`  ✓ Deleted user: ${user.email} (${user.name})`);
      } catch (error) {
        console.error(`  ❌ Failed to delete user ${user.email}:`, error.message);
      }
    }
    
    console.log(`\n✅ Successfully deleted ${deletedUsers} users without roles`);
    
    // Проверяем результат
    console.log('\n📊 Final user count:');
    const finalSnapshot = await db.collection('users').get();
    const roleStats = {
      customer: 0,
      executor: 0,
      pm: 0,
      admin: 0,
      noRoles: 0
    };
    
    finalSnapshot.docs.forEach(doc => {
      const roles = doc.data().roles || [];
      if (roles.length === 0) {
        roleStats.noRoles++;
      } else {
        roles.forEach(role => {
          if (roleStats[role] !== undefined) {
            roleStats[role]++;
          }
        });
      }
    });
    
    console.log(`Total users: ${finalSnapshot.size}`);
    Object.entries(roleStats).forEach(([role, count]) => {
      console.log(`  - ${role}: ${count} users`);
    });
    
  } catch (error) {
    console.error('❌ Error deleting users:', error);
    throw error;
  }
}

if (require.main === module) {
  deleteUsersWithoutRoles()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Deletion failed:', error);
      process.exit(1);
    });
}

module.exports = { deleteUsersWithoutRoles }; 