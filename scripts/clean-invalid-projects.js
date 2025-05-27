const { db } = require('../src/config/firebase');

async function cleanInvalidProjects() {
  console.log('🧹 Cleaning invalid projects...');
  
  try {
    const projectsSnapshot = await db.collection('projects').get();
    let deletedProjects = 0;
    let fixedProjects = 0;
    const projectsToDelete = [];
    const projectsToFix = [];
    
    console.log(`\n📝 Analyzing ${projectsSnapshot.size} projects...`);
    
    for (const doc of projectsSnapshot.docs) {
      const data = doc.data();
      let hasIssues = false;
      let canBeFixed = true;
      const issues = [];
      
      // Проверяем customerId
      if (data.customerId) {
        const customerDoc = await db.collection('users').doc(data.customerId).get();
        if (!customerDoc.exists) {
          issues.push(`customerId ${data.customerId} not found`);
          hasIssues = true;
          canBeFixed = false; // Нельзя исправить проект без заказчика
        } else {
          const customerData = customerDoc.data();
          if (!customerData.roles?.includes('customer')) {
            issues.push(`customerId ${data.customerId} is not customer`);
            hasIssues = true;
            canBeFixed = false; // Нельзя исправить если пользователь не заказчик
          }
        }
      }
      
      // Проверяем pmId
      if (data.pmId) {
        const pmDoc = await db.collection('users').doc(data.pmId).get();
        if (!pmDoc.exists) {
          issues.push(`pmId ${data.pmId} not found`);
          hasIssues = true;
          // PM можно удалить из проекта
        } else {
          const pmData = pmDoc.data();
          if (!pmData.roles?.includes('pm')) {
            issues.push(`pmId ${data.pmId} is not pm`);
            hasIssues = true;
            // PM можно удалить из проекта
          }
        }
      }
      
      // Проверяем adminId
      if (data.adminId) {
        const adminDoc = await db.collection('users').doc(data.adminId).get();
        if (!adminDoc.exists) {
          issues.push(`adminId ${data.adminId} not found`);
          hasIssues = true;
          // Admin можно удалить из проекта
        } else {
          const adminData = adminDoc.data();
          if (!adminData.roles?.includes('admin')) {
            issues.push(`adminId ${data.adminId} is not admin`);
            hasIssues = true;
            // Admin можно удалить из проекта
          }
        }
      }
      
      // Проверяем teamMembers
      const invalidTeamMembers = [];
      if (data.teamMembers && Array.isArray(data.teamMembers)) {
        for (const memberId of data.teamMembers) {
          const memberDoc = await db.collection('users').doc(memberId).get();
          if (!memberDoc.exists) {
            issues.push(`team member ${memberId} not found`);
            invalidTeamMembers.push(memberId);
            hasIssues = true;
          } else {
            const memberData = memberDoc.data();
            if (!memberData.roles?.includes('executor')) {
              issues.push(`team member ${memberId} is not executor`);
              invalidTeamMembers.push(memberId);
              hasIssues = true;
            }
          }
        }
      }
      
      if (hasIssues) {
        const projectInfo = {
          id: doc.id,
          title: data.title || 'Untitled',
          issues: issues,
          data: data,
          invalidTeamMembers: invalidTeamMembers
        };
        
        if (canBeFixed) {
          projectsToFix.push(projectInfo);
        } else {
          projectsToDelete.push(projectInfo);
        }
      }
    }
    
    console.log(`\n📊 Analysis results:`);
    console.log(`  - Projects to delete: ${projectsToDelete.length}`);
    console.log(`  - Projects to fix: ${projectsToFix.length}`);
    console.log(`  - Valid projects: ${projectsSnapshot.size - projectsToDelete.length - projectsToFix.length}`);
    
    // Показываем проекты для удаления
    if (projectsToDelete.length > 0) {
      console.log(`\n🗑️  Projects to DELETE (unfixable):`);
      projectsToDelete.forEach(project => {
        console.log(`  - "${project.title}" [${project.id}]`);
        project.issues.forEach(issue => console.log(`    ❌ ${issue}`));
      });
    }
    
    // Показываем проекты для исправления
    if (projectsToFix.length > 0) {
      console.log(`\n🔧 Projects to FIX:`);
      projectsToFix.forEach(project => {
        console.log(`  - "${project.title}" [${project.id}]`);
        project.issues.forEach(issue => console.log(`    ⚠️  ${issue}`));
      });
    }
    
    if (projectsToDelete.length === 0 && projectsToFix.length === 0) {
      console.log('✅ No invalid projects found. Nothing to clean.');
      return;
    }
    
    // Подтверждение
    console.log('\n⚠️  WARNING: This will modify/delete projects!');
    console.log('Press Ctrl+C to cancel or wait 5 seconds to proceed...');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n🧹 Proceeding with cleanup...');
    
    // Удаляем проекты, которые нельзя исправить
    for (const project of projectsToDelete) {
      try {
        // Удаляем подколлекции проекта
        const batch = db.batch();
        
        // Удаляем tasks
        const tasksSnapshot = await db.collection('projects')
          .doc(project.id)
          .collection('tasks')
          .get();
        tasksSnapshot.forEach(taskDoc => {
          batch.delete(taskDoc.ref);
        });
        
        // Удаляем activity
        const activitySnapshot = await db.collection('projects')
          .doc(project.id)
          .collection('activity')
          .get();
        activitySnapshot.forEach(activityDoc => {
          batch.delete(activityDoc.ref);
        });
        
        // Удаляем documents
        const documentsSnapshot = await db.collection('projects')
          .doc(project.id)
          .collection('documents')
          .get();
        documentsSnapshot.forEach(docDoc => {
          batch.delete(docDoc.ref);
        });
        
        // Удаляем chats
        const chatsSnapshot = await db.collection('projects')
          .doc(project.id)
          .collection('chats')
          .get();
        chatsSnapshot.forEach(chatDoc => {
          batch.delete(chatDoc.ref);
        });
        
        // Удаляем сам проект
        batch.delete(db.collection('projects').doc(project.id));
        
        await batch.commit();
        deletedProjects++;
        console.log(`  ✓ Deleted project: "${project.title}"`);
      } catch (error) {
        console.error(`  ❌ Failed to delete project "${project.title}":`, error.message);
      }
    }
    
    // Исправляем проекты, которые можно починить
    for (const project of projectsToFix) {
      try {
        const updateData = {};
        let needsUpdate = false;
        
        // Удаляем некорректного PM
        if (project.data.pmId) {
          const pmDoc = await db.collection('users').doc(project.data.pmId).get();
          if (!pmDoc.exists || !pmDoc.data().roles?.includes('pm')) {
            updateData.pmId = null;
            needsUpdate = true;
            console.log(`    - Removed invalid PM from "${project.title}"`);
          }
        }
        
        // Удаляем некорректного admin
        if (project.data.adminId) {
          const adminDoc = await db.collection('users').doc(project.data.adminId).get();
          if (!adminDoc.exists || !adminDoc.data().roles?.includes('admin')) {
            updateData.adminId = null;
            needsUpdate = true;
            console.log(`    - Removed invalid admin from "${project.title}"`);
          }
        }
        
        // Очищаем команду от некорректных участников
        if (project.invalidTeamMembers.length > 0) {
          const validTeamMembers = (project.data.teamMembers || []).filter(
            memberId => !project.invalidTeamMembers.includes(memberId)
          );
          updateData.teamMembers = validTeamMembers;
          needsUpdate = true;
          console.log(`    - Removed ${project.invalidTeamMembers.length} invalid team members from "${project.title}"`);
        }
        
        if (needsUpdate) {
          updateData.updatedAt = new Date().toISOString();
          await db.collection('projects').doc(project.id).update(updateData);
          fixedProjects++;
          console.log(`  ✓ Fixed project: "${project.title}"`);
        }
      } catch (error) {
        console.error(`  ❌ Failed to fix project "${project.title}":`, error.message);
      }
    }
    
    console.log(`\n✅ Cleanup completed:`);
    console.log(`  - Deleted projects: ${deletedProjects}`);
    console.log(`  - Fixed projects: ${fixedProjects}`);
    
    // Финальная проверка
    console.log('\n📊 Final project count:');
    const finalSnapshot = await db.collection('projects').get();
    console.log(`Total projects: ${finalSnapshot.size}`);
    
  } catch (error) {
    console.error('❌ Error cleaning projects:', error);
    throw error;
  }
}

if (require.main === module) {
  cleanInvalidProjects()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Cleanup failed:', error);
      process.exit(1);
    });
}

module.exports = { cleanInvalidProjects }; 