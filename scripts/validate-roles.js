const { db } = require('../src/config/firebase');

async function validateRoles() {
  console.log('🔍 Validating roles after migration...');
  
  try {
    const validRoles = ['customer', 'executor', 'pm', 'admin'];
    let totalUsers = 0;
    let invalidUsers = 0;
    let totalProjects = 0;
    let invalidProjects = 0;
    
    // 1. Проверяем пользователей
    console.log('\n📝 Checking users...');
    const usersSnapshot = await db.collection('users').get();
    totalUsers = usersSnapshot.size;
    
    const roleStats = {
      customer: 0,
      executor: 0,
      pm: 0,
      admin: 0,
      invalid: 0
    };
    
    for (const doc of usersSnapshot.docs) {
      const data = doc.data();
      const roles = data.roles || [];
      
      if (roles.length === 0) {
        console.log(`❌ User ${data.email || doc.id}: no roles`);
        invalidUsers++;
        roleStats.invalid++;
        continue;
      }
      
      const hasInvalidRole = roles.some(role => !validRoles.includes(role));
      if (hasInvalidRole) {
        console.log(`❌ User ${data.email || doc.id}: invalid roles ${roles.join(',')}`);
        invalidUsers++;
        roleStats.invalid++;
        continue;
      }
      
      // Считаем статистику
      roles.forEach(role => {
        if (roleStats[role] !== undefined) {
          roleStats[role]++;
        }
      });
    }
    
    console.log(`✅ Users validation: ${totalUsers - invalidUsers}/${totalUsers} valid`);
    console.log('Role distribution:');
    Object.entries(roleStats).forEach(([role, count]) => {
      console.log(`  - ${role}: ${count} users`);
    });
    
    // 2. Проверяем проекты
    console.log('\n📝 Checking projects...');
    const projectsSnapshot = await db.collection('projects').get();
    totalProjects = projectsSnapshot.size;
    
    for (const doc of projectsSnapshot.docs) {
      const data = doc.data();
      let hasIssues = false;
      
      // Проверяем adminId
      if (data.adminId) {
        const adminDoc = await db.collection('users').doc(data.adminId).get();
        if (!adminDoc.exists) {
          console.log(`❌ Project ${data.title || doc.id}: adminId ${data.adminId} not found`);
          hasIssues = true;
        } else {
          const adminData = adminDoc.data();
          if (!adminData.roles?.includes('admin')) {
            console.log(`❌ Project ${data.title || doc.id}: adminId ${data.adminId} is not admin`);
            hasIssues = true;
          }
        }
      }
      
      // Проверяем pmId
      if (data.pmId) {
        const pmDoc = await db.collection('users').doc(data.pmId).get();
        if (!pmDoc.exists) {
          console.log(`❌ Project ${data.title || doc.id}: pmId ${data.pmId} not found`);
          hasIssues = true;
        } else {
          const pmData = pmDoc.data();
          if (!pmData.roles?.includes('pm')) {
            console.log(`❌ Project ${data.title || doc.id}: pmId ${data.pmId} is not pm`);
            hasIssues = true;
          }
        }
      }
      
      // Проверяем customerId
      if (data.customerId) {
        const customerDoc = await db.collection('users').doc(data.customerId).get();
        if (!customerDoc.exists) {
          console.log(`❌ Project ${data.title || doc.id}: customerId ${data.customerId} not found`);
          hasIssues = true;
        } else {
          const customerData = customerDoc.data();
          if (!customerData.roles?.includes('customer')) {
            console.log(`❌ Project ${data.title || doc.id}: customerId ${data.customerId} is not customer`);
            hasIssues = true;
          }
        }
      }
      
      // Проверяем teamMembers
      if (data.teamMembers && Array.isArray(data.teamMembers)) {
        for (const memberId of data.teamMembers) {
          const memberDoc = await db.collection('users').doc(memberId).get();
          if (!memberDoc.exists) {
            console.log(`❌ Project ${data.title || doc.id}: team member ${memberId} not found`);
            hasIssues = true;
          } else {
            const memberData = memberDoc.data();
            if (!memberData.roles?.includes('executor')) {
              console.log(`❌ Project ${data.title || doc.id}: team member ${memberId} is not executor`);
              hasIssues = true;
            }
          }
        }
      }
      
      if (hasIssues) {
        invalidProjects++;
      }
    }
    
    console.log(`✅ Projects validation: ${totalProjects - invalidProjects}/${totalProjects} valid`);
    
    // 3. Проверяем приглашения
    console.log('\n📝 Checking invites...');
    const invitesSnapshot = await db.collection('invites').get();
    let totalInvites = invitesSnapshot.size;
    let invalidInvites = 0;
    
    for (const doc of invitesSnapshot.docs) {
      const data = doc.data();
      let hasIssues = false;
      
      // Проверяем executorId
      if (data.executorId) {
        const executorDoc = await db.collection('users').doc(data.executorId).get();
        if (!executorDoc.exists) {
          console.log(`❌ Invite ${doc.id}: executorId ${data.executorId} not found`);
          hasIssues = true;
        } else {
          const executorData = executorDoc.data();
          if (!executorData.roles?.includes('executor')) {
            console.log(`❌ Invite ${doc.id}: executorId ${data.executorId} is not executor`);
            hasIssues = true;
          }
        }
      }
      
      // Проверяем pmId
      if (data.pmId) {
        const pmDoc = await db.collection('users').doc(data.pmId).get();
        if (!pmDoc.exists) {
          console.log(`❌ Invite ${doc.id}: pmId ${data.pmId} not found`);
          hasIssues = true;
        } else {
          const pmData = pmDoc.data();
          if (!pmData.roles?.includes('pm')) {
            console.log(`❌ Invite ${doc.id}: pmId ${data.pmId} is not pm`);
            hasIssues = true;
          }
        }
      }
      
      if (hasIssues) {
        invalidInvites++;
      }
    }
    
    console.log(`✅ Invites validation: ${totalInvites - invalidInvites}/${totalInvites} valid`);
    
    // 4. Итоговый отчет
    console.log('\n📊 Validation Summary:');
    console.log(`Users: ${totalUsers - invalidUsers}/${totalUsers} valid (${((totalUsers - invalidUsers) / totalUsers * 100).toFixed(1)}%)`);
    console.log(`Projects: ${totalProjects - invalidProjects}/${totalProjects} valid (${((totalProjects - invalidProjects) / totalProjects * 100).toFixed(1)}%)`);
    console.log(`Invites: ${totalInvites - invalidInvites}/${totalInvites} valid (${((totalInvites - invalidInvites) / totalInvites * 100).toFixed(1)}%)`);
    
    const totalIssues = invalidUsers + invalidProjects + invalidInvites;
    if (totalIssues === 0) {
      console.log('\n🎉 All data is valid! Migration completed successfully.');
    } else {
      console.log(`\n⚠️  Found ${totalIssues} issues that need attention.`);
    }
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
    throw error;
  }
}

if (require.main === module) {
  validateRoles()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Validation failed:', error);
      process.exit(1);
    });
}

module.exports = { validateRoles }; 