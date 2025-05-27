const { db } = require('../src/config/firebase');

async function testEnhancedTaskCreation() {
  try {
    console.log('🚀 Тестируем улучшенное создание задач...\n');

    // 1. Найдем проект для тестирования
    console.log('🔍 Ищем проект для тестирования...');
    const projectsSnapshot = await db.collection('projects').limit(1).get();
    
    if (projectsSnapshot.empty) {
      console.log('❌ Нет проектов для тестирования');
      return;
    }

    const projectDoc = projectsSnapshot.docs[0];
    const projectId = projectDoc.id;
    const projectData = projectDoc.data();
    
    console.log(`✅ Найден проект: ${projectData.title} (ID: ${projectId})`);

    // 2. Найдем участников команды
    console.log('\n👥 Ищем участников команды...');
    const teamMembers = projectData.team || [];
    const pmId = projectData.pmId || projectData.teamLead;
    
    console.log(`PM: ${pmId}`);
    console.log(`Участники команды: ${teamMembers.join(', ')}`);

    // 3. Создаем тестовые задачи с разными приоритетами и параметрами
    const testTasks = [
      {
        text: 'Критическая задача - исправить баг в продакшене',
        column: 'todo',
        status: 'todo',
        priority: 'critical',
        color: '#EF4444',
        description: 'Срочно нужно исправить критический баг, который влияет на всех пользователей',
        assignee: teamMembers[0] || pmId,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // завтра
      },
      {
        text: 'Высокий приоритет - реализовать новую фичу',
        column: 'backlog',
        status: 'backlog',
        priority: 'high',
        color: '#F59E0B',
        description: 'Важная функциональность для следующего релиза',
        assignee: teamMembers[1] || teamMembers[0] || pmId,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // через неделю
      },
      {
        text: 'Средний приоритет - обновить документацию',
        column: 'todo',
        status: 'todo',
        priority: 'medium',
        color: '#3B82F6',
        description: 'Обновить техническую документацию проекта',
        assignee: null, // не назначен
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // через 2 недели
      },
      {
        text: 'Низкий приоритет - рефакторинг кода',
        column: 'backlog',
        status: 'backlog',
        priority: 'low',
        color: '#10B981',
        description: 'Улучшить качество кода в модуле аутентификации',
        assignee: teamMembers[0] || pmId,
        dueDate: null // без дедлайна
      }
    ];

    console.log('\n📝 Создаем тестовые задачи...');

    for (let i = 0; i < testTasks.length; i++) {
      const task = testTasks[i];
      
      try {
        // Получаем информацию об исполнителе если назначен
        let assigneeDetails = null;
        if (task.assignee) {
          const assigneeDoc = await db.collection('users').doc(task.assignee).get();
          if (assigneeDoc.exists) {
            const assigneeData = assigneeDoc.data();
            assigneeDetails = {};
            
            // Добавляем только определенные поля
            assigneeDetails.id = task.assignee;
            if (assigneeData.displayName) assigneeDetails.fullName = assigneeData.displayName;
            else if (assigneeData.name) assigneeDetails.fullName = assigneeData.name;
            else assigneeDetails.fullName = 'Unknown User';
            
            if (assigneeData.email) assigneeDetails.email = assigneeData.email;
            if (assigneeData.profileImage) assigneeDetails.profileImage = assigneeData.profileImage;
            else if (assigneeData.avatarUrl) assigneeDetails.profileImage = assigneeData.avatarUrl;
          }
        }

        const taskData = {
          text: task.text,
          column: task.column,
          status: task.status,
          priority: task.priority,
          createdAt: new Date(),
          createdBy: pmId || 'system',
          updatedAt: new Date(),
          updatedBy: pmId || 'system'
        };

        // Добавляем только определенные поля
        if (task.assignee) taskData.assignee = task.assignee;
        if (assigneeDetails) taskData.assigneeDetails = assigneeDetails;
        if (task.color) taskData.color = task.color;
        if (task.dueDate) taskData.dueDate = task.dueDate;
        if (task.description) taskData.description = task.description;

        const taskRef = await db.collection('projects')
          .doc(projectId)
          .collection('tasks')
          .add(taskData);

        console.log(`  ✅ Создана задача: "${task.text}" (ID: ${taskRef.id})`);
        console.log(`     - Приоритет: ${task.priority}`);
        console.log(`     - Исполнитель: ${assigneeDetails ? assigneeDetails.fullName : 'Не назначен'}`);
        console.log(`     - Дедлайн: ${task.dueDate ? task.dueDate.toLocaleDateString('ru-RU') : 'Не установлен'}`);
        console.log(`     - Цвет: ${task.color}`);

        // Создаем запись в активности проекта
        await db.collection('projects')
          .doc(projectId)
          .collection('activity')
          .add({
            type: 'task_created',
            userId: pmId || 'system',
            details: {
              taskId: taskRef.id,
              text: task.text,
              column: task.column,
              assignee: task.assignee,
              priority: task.priority
            },
            timestamp: new Date()
          });

      } catch (error) {
        console.error(`  ❌ Ошибка создания задачи "${task.text}":`, error.message);
      }
    }

    // 4. Проверяем созданные задачи
    console.log('\n🔍 Проверяем созданные задачи...');
    const tasksSnapshot = await db.collection('projects')
      .doc(projectId)
      .collection('tasks')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    console.log(`📊 Всего задач в проекте: ${tasksSnapshot.size}`);
    
    tasksSnapshot.forEach(doc => {
      const task = doc.data();
      console.log(`  📋 ${task.text}`);
      console.log(`     Приоритет: ${task.priority || 'не указан'} | Статус: ${task.status} | Исполнитель: ${task.assigneeDetails?.fullName || 'не назначен'}`);
    });

    // 5. Проверяем колонки
    console.log('\n📂 Проверяем колонки проекта...');
    const columnsSnapshot = await db.collection('projects')
      .doc(projectId)
      .collection('columns')
      .orderBy('order')
      .get();

    if (columnsSnapshot.empty) {
      console.log('⚠️ Колонки не найдены, создаем дефолтные...');
      
      const defaultColumns = [
        { name: 'Бэклог', order: 0 },
        { name: 'Нужно сделать', order: 1 },
        { name: 'В работе', order: 2 },
        { name: 'Правки', order: 3 },
        { name: 'Готово', order: 4 }
      ];

      for (const column of defaultColumns) {
        await db.collection('projects')
          .doc(projectId)
          .collection('columns')
          .add({
            ...column,
            createdAt: new Date(),
            createdBy: pmId || 'system'
          });
        console.log(`  ✅ Создана колонка: ${column.name}`);
      }
    } else {
      console.log('📂 Существующие колонки:');
      columnsSnapshot.forEach(doc => {
        const column = doc.data();
        console.log(`  - ${column.name} (порядок: ${column.order})`);
      });
    }

    console.log('\n🎉 Тестирование улучшенного создания задач завершено успешно!');

  } catch (error) {
    console.error('❌ Ошибка тестирования:', error);
  }
}

async function main() {
  await testEnhancedTaskCreation();
  process.exit(0);
}

main().catch(console.error); 