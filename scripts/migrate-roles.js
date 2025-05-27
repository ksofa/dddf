const { db } = require('../src/config/firebase');

async function migrateRoles() {
  console.log('🚀 Starting role migration...');
  
  try {
    // 1. Миграция ролей пользователей
    console.log('\n📝 Migrating user roles...');
    const usersSnapshot = await db.collection('users').get();
    let userUpdates = 0;
    
    for (const doc of usersSnapshot.docs) {
      const data = doc.data();
      let roles = data.roles || [];
      const originalRoles = [...roles];
      
      // Замены ролей
      roles = roles.map(role => {
        if (role === 'presale' || role === 'super-admin') return 'admin';
        if (role === 'project_manager') return 'pm';
        return role;
      });
      
      // Убираем недопустимые роли и дубликаты
      const validRoles = ['customer', 'executor', 'pm', 'admin'];
      roles = [...new Set(roles.filter(role => validRoles.includes(role)))];
      
      // Обновляем если есть изменения
      if (JSON.stringify(roles) !== JSON.stringify(originalRoles)) {
        await doc.ref.update({ 
          roles,
          updatedAt: new Date()
        });
        userUpdates++;
        console.log(`  ✓ Updated user ${data.email || doc.id}: ${originalRoles.join(',')} → ${roles.join(',')}`);
      }
    }
    
    console.log(`✅ Updated ${userUpdates} users`);
    
    // 2. Миграция проектов (presaleId → adminId)
    console.log('\n📝 Migrating project fields...');
    const projectsSnapshot = await db.collection('projects').get();
    let projectUpdates = 0;
    
    for (const doc of projectsSnapshot.docs) {
      const data = doc.data();
      const updates = {};
      
      // Переименовываем presaleId в adminId
      if (data.presaleId) {
        updates.adminId = data.presaleId;
        updates.presaleId = null; // Удаляем старое поле
        updates.updatedAt = new Date();
      }
      
      if (Object.keys(updates).length > 0) {
        await doc.ref.update(updates);
        projectUpdates++;
        console.log(`  ✓ Updated project ${data.title || doc.id}: added adminId`);
      }
    }
    
    console.log(`✅ Updated ${projectUpdates} projects`);
    
    // 3. Проверка целостности данных
    console.log('\n🔍 Validating data integrity...');
    
    // Проверяем что все пользователи имеют валидные роли
    const invalidUsers = [];
    const usersCheck = await db.collection('users').get();
    
    usersCheck.docs.forEach(doc => {
      const data = doc.data();
      const roles = data.roles || [];
      const validRoles = ['customer', 'executor', 'pm', 'admin'];
      
      if (roles.length === 0) {
        invalidUsers.push(`${doc.id}: no roles`);
      } else if (!roles.every(role => validRoles.includes(role))) {
        invalidUsers.push(`${doc.id}: invalid roles ${roles.join(',')}`);
      }
    });
    
    if (invalidUsers.length > 0) {
      console.log('❌ Found invalid users:');
      invalidUsers.forEach(user => console.log(`  - ${user}`));
    } else {
      console.log('✅ All users have valid roles');
    }
    
    // Проверяем проекты
    const invalidProjects = [];
    const projectsCheck = await db.collection('projects').get();
    
    for (const doc of projectsCheck.docs) {
      const data = doc.data();
      
      // Проверяем что adminId существует если есть
      if (data.adminId) {
        const adminDoc = await db.collection('users').doc(data.adminId).get();
        if (!adminDoc.exists) {
          invalidProjects.push(`${doc.id}: adminId ${data.adminId} not found`);
        } else {
          const adminData = adminDoc.data();
          if (!adminData.roles?.includes('admin')) {
            invalidProjects.push(`${doc.id}: adminId ${data.adminId} is not admin`);
          }
        }
      }
      
      // Проверяем PM
      if (data.pmId) {
        const pmDoc = await db.collection('users').doc(data.pmId).get();
        if (!pmDoc.exists) {
          invalidProjects.push(`${doc.id}: pmId ${data.pmId} not found`);
        } else {
          const pmData = pmDoc.data();
          if (!pmData.roles?.includes('pm')) {
            invalidProjects.push(`${doc.id}: pmId ${data.pmId} is not pm`);
          }
        }
      }
    }
    
    if (invalidProjects.length > 0) {
      console.log('❌ Found invalid projects:');
      invalidProjects.forEach(project => console.log(`  - ${project}`));
    } else {
      console.log('✅ All projects have valid references');
    }
    
    // 4. Статистика
    console.log('\n📊 Migration statistics:');
    const finalStats = await db.collection('users').get();
    const roleStats = {
      customer: 0,
      executor: 0,
      pm: 0,
      admin: 0
    };
    
    finalStats.docs.forEach(doc => {
      const roles = doc.data().roles || [];
      roles.forEach(role => {
        if (roleStats[role] !== undefined) {
          roleStats[role]++;
        }
      });
    });
    
    console.log('Role distribution:');
    Object.entries(roleStats).forEach(([role, count]) => {
      console.log(`  - ${role}: ${count} users`);
    });
    
    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Запуск миграции
if (require.main === module) {
  migrateRoles()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateRoles }; 