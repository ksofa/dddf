const { db } = require('../src/config/firebase');

async function testPMAssignmentComplete() {
  try {
    console.log('🚀 Тестируем полный цикл назначения PM...\n');

    // 1. Создаем заявку с полными данными клиента
    console.log('🔄 Создаем заявку с полными данными клиента...');
    const fullApplicationData = {
      fullName: 'Иван Петров',
      phone: '+7 (495) 123-45-67',
      email: 'ivan.petrov@example.com',
      projectTitle: 'Полный тест проект',
      projectDescription: 'Тестовый проект с полными данными клиента',
      techSpec: 'React, Node.js, PostgreSQL',
      type: 'client_request',
      status: 'pending',
      createdAt: new Date(),
      assignedPM: null,
      teamMembers: []
    };

    const fullAppRef = await db.collection('applications').add(fullApplicationData);
    console.log('✅ Заявка с полными данными создана:', fullAppRef.id);

    // 2. Создаем заявку с минимальными данными (как в тестах)
    console.log('🔄 Создаем заявку с минимальными данными...');
    const minimalApplicationData = {
      type: 'client_request',
      projectTitle: 'Минимальный тест проект',
      projectDescription: 'Тестовый проект с минимальными данными',
      budget: 50000,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 дней
      status: 'pending',
      senderId: 'test-client-id',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const minimalAppRef = await db.collection('applications').add(minimalApplicationData);
    console.log('✅ Заявка с минимальными данными создана:', minimalAppRef.id);

    // 3. Найдем PM
    const pmSnapshot = await db.collection('users')
      .where('roles', 'array-contains', 'pm')
      .limit(1)
      .get();

    if (pmSnapshot.empty) {
      console.log('❌ Нет PM пользователей');
      return;
    }

    const pmDoc = pmSnapshot.docs[0];
    console.log('✅ Найден PM:', pmDoc.id);

    // 4. Тестируем назначение PM для заявки с полными данными
    console.log('\n🔄 Тестируем назначение PM для заявки с полными данными...');
    
    const fullAppData = fullApplicationData;
    
    // Обрабатываем customerInfo с проверкой на undefined значения
    const customerInfo = {};
    if (fullAppData.fullName !== undefined) {
      customerInfo.fullName = fullAppData.fullName;
    }
    if (fullAppData.phone !== undefined) {
      customerInfo.phone = fullAppData.phone;
    }
    if (fullAppData.email !== undefined) {
      customerInfo.email = fullAppData.email;
    }

    const fullProjectData = {
      title: fullAppData.projectTitle,
      description: fullAppData.projectDescription,
      status: 'active',
      pmId: pmDoc.id,
      manager: pmDoc.id,
      customerId: null,
      customerInfo: Object.keys(customerInfo).length > 0 ? customerInfo : null,
      rate: fullAppData.rate || 'Договорная',
      startDate: fullAppData.startDate || null,
      estimatedDuration: fullAppData.estimatedDuration || null,
      estimatedDurationUnit: fullAppData.estimatedDurationUnit || 'months',
      coverLetter: fullAppData.coverLetter || '',
      team: [pmDoc.id],
      teamMembers: [pmDoc.id],
      techSpec: fullAppData.techSpec || '',
      techSpecFile: fullAppData.techSpecFile || null,
      createdAt: new Date(),
      createdFrom: 'application',
      applicationId: fullAppRef.id
    };

    const fullProjectRef = await db.collection('projects').add(fullProjectData);
    console.log('✅ Проект с полными данными создан:', fullProjectRef.id);
    console.log('📋 customerInfo:', fullProjectData.customerInfo);

    // 5. Тестируем назначение PM для заявки с минимальными данными
    console.log('\n🔄 Тестируем назначение PM для заявки с минимальными данными...');
    
    const minimalAppData = minimalApplicationData;
    
    // Обрабатываем customerInfo с проверкой на undefined значения
    const minimalCustomerInfo = {};
    if (minimalAppData.fullName !== undefined) {
      minimalCustomerInfo.fullName = minimalAppData.fullName;
    }
    if (minimalAppData.phone !== undefined) {
      minimalCustomerInfo.phone = minimalAppData.phone;
    }
    if (minimalAppData.email !== undefined) {
      minimalCustomerInfo.email = minimalAppData.email;
    }

    const minimalProjectData = {
      title: minimalAppData.projectTitle,
      description: minimalAppData.projectDescription,
      status: 'active',
      pmId: pmDoc.id,
      manager: pmDoc.id,
      customerId: null,
      customerInfo: Object.keys(minimalCustomerInfo).length > 0 ? minimalCustomerInfo : null,
      rate: minimalAppData.rate || 'Договорная',
      startDate: minimalAppData.startDate || null,
      estimatedDuration: minimalAppData.estimatedDuration || null,
      estimatedDurationUnit: minimalAppData.estimatedDurationUnit || 'months',
      coverLetter: minimalAppData.coverLetter || '',
      team: [pmDoc.id],
      teamMembers: [pmDoc.id],
      techSpec: minimalAppData.techSpec || '',
      techSpecFile: minimalAppData.techSpecFile || null,
      createdAt: new Date(),
      createdFrom: 'application',
      applicationId: minimalAppRef.id
    };

    const minimalProjectRef = await db.collection('projects').add(minimalProjectData);
    console.log('✅ Проект с минимальными данными создан:', minimalProjectRef.id);
    console.log('📋 customerInfo:', minimalProjectData.customerInfo);

    // 6. Обновляем статусы заявок
    console.log('\n🔄 Обновляем статусы заявок...');
    
    await db.collection('applications').doc(fullAppRef.id).update({
      status: 'approved',
      approvedAt: new Date(),
      approvedBy: 'test-admin-uid',
      projectId: fullProjectRef.id,
      assignedPM: pmDoc.id
    });

    await db.collection('applications').doc(minimalAppRef.id).update({
      status: 'approved',
      approvedAt: new Date(),
      approvedBy: 'test-admin-uid',
      projectId: minimalProjectRef.id,
      assignedPM: pmDoc.id
    });

    console.log('✅ Статусы заявок обновлены');

    console.log('\n🎉 Все тесты прошли успешно!');
    console.log('📊 Результаты:');
    console.log('- Заявка с полными данными: проект создан с customerInfo');
    console.log('- Заявка с минимальными данными: проект создан с customerInfo = null');
    console.log('- Оба случая обработаны без ошибок Firestore');

  } catch (error) {
    console.error('❌ Ошибка тестирования:', error);
    console.error('📋 Детали ошибки:', error.message);
  }
}

async function main() {
  await testPMAssignmentComplete();
  console.log('\n✅ Тестирование завершено');
  process.exit(0);
}

main().catch(console.error); 