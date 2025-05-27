const { db, auth } = require('../src/config/firebase');

async function debugPMAssignment() {
  try {
    console.log('🔄 Отладка назначения PM...');
    
    // 1. Найдем заявку
    const applicationsSnapshot = await db.collection('applications')
      .where('status', '==', 'pending')
      .limit(1)
      .get();
    
    if (applicationsSnapshot.empty) {
      console.log('❌ Нет заявок со статусом pending');
      return;
    }
    
    const applicationDoc = applicationsSnapshot.docs[0];
    const applicationData = applicationDoc.data();
    console.log('✅ Найдена заявка:', applicationDoc.id);
    console.log('📋 Данные заявки:', {
      projectTitle: applicationData.projectTitle,
      status: applicationData.status
    });
    
    // 2. Найдем PM
    const pmSnapshot = await db.collection('users')
      .where('roles', 'array-contains', 'pm')
      .limit(1)
      .get();
    
    if (pmSnapshot.empty) {
      console.log('❌ Нет PM пользователей');
      return;
    }
    
    const pmDoc = pmSnapshot.docs[0];
    const pmData = pmDoc.data();
    console.log('✅ Найден PM:', pmDoc.id);
    console.log('📋 Данные PM:', {
      displayName: pmData.displayName,
      email: pmData.email,
      roles: pmData.roles
    });
    
    // 3. Проверим, что PM существует по ID
    const pmCheckDoc = await db.collection('users').doc(pmDoc.id).get();
    if (!pmCheckDoc.exists) {
      console.log('❌ PM не найден по document ID');
      return;
    }
    console.log('✅ PM найден по document ID');
    
    // 4. Попробуем создать проект вручную
    console.log('🔄 Создаем тестовый проект...');
    
    // Обрабатываем customerInfo с проверкой на undefined значения
    const customerInfo = {};
    if (applicationData.fullName !== undefined) {
      customerInfo.fullName = applicationData.fullName;
    }
    if (applicationData.phone !== undefined) {
      customerInfo.phone = applicationData.phone;
    }
    if (applicationData.email !== undefined) {
      customerInfo.email = applicationData.email;
    }
    
    const projectData = {
      title: applicationData.projectTitle,
      description: applicationData.projectDescription,
      status: 'active',
      pmId: pmDoc.id,
      manager: pmDoc.id,
      customerId: null,
      customerInfo: Object.keys(customerInfo).length > 0 ? customerInfo : null,
      rate: applicationData.rate || 'Договорная',
      startDate: applicationData.startDate || null,
      estimatedDuration: applicationData.estimatedDuration || null,
      estimatedDurationUnit: applicationData.estimatedDurationUnit || 'months',
      coverLetter: applicationData.coverLetter || '',
      team: [pmDoc.id],
      teamMembers: [pmDoc.id],
      techSpec: applicationData.techSpec || '',
      techSpecFile: applicationData.techSpecFile || null,
      createdAt: new Date(),
      createdFrom: 'application',
      applicationId: applicationDoc.id
    };
    
    const projectRef = await db.collection('projects').add(projectData);
    console.log('✅ Проект создан:', projectRef.id);
    
    // 5. Обновим заявку
    console.log('🔄 Обновляем заявку...');
    
    await db.collection('applications').doc(applicationDoc.id).update({
      status: 'approved',
      approvedAt: new Date(),
      approvedBy: 'test-admin-uid',
      projectId: projectRef.id,
      assignedPM: pmDoc.id,
      assignedTeamLead: pmDoc.id
    });
    
    console.log('✅ Заявка обновлена');
    
    // 6. Создадим уведомление
    console.log('🔄 Создаем уведомление...');
    
    await db.collection('users').doc(pmDoc.id).collection('notifications').add({
      type: 'project_assigned',
      title: 'Новый проект назначен',
      message: `Вам назначен проект: ${projectData.title}`,
      projectId: projectRef.id,
      read: false,
      createdAt: new Date()
    });
    
    console.log('✅ Уведомление создано');
    console.log('🎉 Все операции выполнены успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка отладки:', error);
    console.error('📋 Детали ошибки:', error.message);
    console.error('📋 Stack trace:', error.stack);
  }
}

async function main() {
  console.log('🚀 Начинаем отладку назначения PM...\n');
  
  await debugPMAssignment();
  
  console.log('\n✅ Отладка завершена');
  process.exit(0);
}

main().catch(console.error); 