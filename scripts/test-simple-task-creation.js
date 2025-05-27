const { db } = require('../src/config/firebase');

async function testSimpleTaskCreation() {
  try {
    console.log('🚀 Простой тест создания задач...\n');

    // Найдем первый проект
    const projectsSnapshot = await db.collection('projects').limit(1).get();
    if (projectsSnapshot.empty) {
      console.log('❌ Нет проектов');
      return;
    }

    const projectDoc = projectsSnapshot.docs[0];
    const projectId = projectDoc.id;
    const projectData = projectDoc.data();
    
    console.log(`✅ Проект: ${projectData.title}`);

    // Создаем простую задачу
    const taskData = {
      text: 'Тестовая задача с приоритетом',
      column: 'todo',
      status: 'todo',
      priority: 'high',
      color: '#F59E0B',
      description: 'Описание тестовой задачи',
      createdAt: new Date(),
      createdBy: 'test',
      updatedAt: new Date(),
      updatedBy: 'test'
    };

    const taskRef = await db.collection('projects')
      .doc(projectId)
      .collection('tasks')
      .add(taskData);

    console.log(`✅ Задача создана: ${taskRef.id}`);
    console.log(`   Приоритет: ${taskData.priority}`);
    console.log(`   Цвет: ${taskData.color}`);
    console.log(`   Описание: ${taskData.description}`);

    // Проверим созданную задачу
    const createdTask = await taskRef.get();
    const createdData = createdTask.data();
    
    console.log('\n📋 Проверка созданной задачи:');
    console.log(`   Текст: ${createdData.text}`);
    console.log(`   Приоритет: ${createdData.priority}`);
    console.log(`   Статус: ${createdData.status}`);
    console.log(`   Цвет: ${createdData.color}`);
    console.log(`   Описание: ${createdData.description}`);

    console.log('\n🎉 Тест завершен успешно!');

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

testSimpleTaskCreation().then(() => process.exit(0)); 