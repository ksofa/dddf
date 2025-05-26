const { db } = require('./src/config/firebase');

async function createPMProjects() {
  try {
    const pmUsers = [
      "5W6YYoii6HYhwWaI4zZSz15siSA3", // pm@test.test
      "FggZKBQWlXYCEpRt57ILVioasm32", // pm@test.com (Софья)
    ];

    const projectTemplates = [
      {
        title: "Разработка веб-приложения для управления задачами",
        description: "Создание современного веб-приложения для управления проектами и задачами с использованием React и Node.js",
        status: "active",
        clientCompany: "ООО Технологии",
        clientContact: "Иван Петров",
        clientEmail: "ivan@tech.com",
        clientPhone: "+7 (999) 123-45-67"
      },
      {
        title: "Мобильное приложение для доставки еды",
        description: "Разработка мобильного приложения для заказа и доставки еды с интеграцией платежных систем",
        status: "active", 
        clientCompany: "Быстрая Доставка",
        clientContact: "Мария Сидорова",
        clientEmail: "maria@delivery.com",
        clientPhone: "+7 (999) 987-65-43"
      }
    ];

    for (let i = 0; i < pmUsers.length; i++) {
      const pmId = pmUsers[i];
      const template = projectTemplates[i % projectTemplates.length];
      
      const projectData = {
        ...template,
        pmId: pmId,
        teamLead: pmId,
        manager: pmId,
        teamMembers: [pmId],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: pmId
      };

      const projectRef = await db.collection('projects').add(projectData);
      console.log(`✅ Created project "${template.title}" for PM ${pmId}: ${projectRef.id}`);

      // Создаем дефолтные колонки для проекта
      const defaultColumns = [
        { name: "Бэклог", order: 0 },
        { name: "Нужно сделать", order: 1 },
        { name: "В работе", order: 2 },
        { name: "Правки", order: 3 },
        { name: "Готово", order: 4 },
      ];

      for (const column of defaultColumns) {
        await db.collection('projects')
          .doc(projectRef.id)
          .collection('columns')
          .add({
            ...column,
            createdAt: new Date(),
            createdBy: pmId
          });
      }

      // Создаем несколько тестовых задач
      const demoTasks = [
        {
          text: "Настройка проекта и инфраструктуры",
          status: "done",
          column: "done"
        },
        {
          text: "Дизайн главной страницы",
          status: "done", 
          column: "done"
        },
        {
          text: "Разработка API авторизации",
          status: "in_progress",
          column: "in_progress"
        },
        {
          text: "Верстка каталога товаров",
          status: "todo",
          column: "todo"
        },
        {
          text: "Интеграция с платежной системой",
          status: "backlog",
          column: "backlog"
        }
      ];

      for (const task of demoTasks) {
        await db.collection('projects')
          .doc(projectRef.id)
          .collection('tasks')
          .add({
            ...task,
            assignee: pmId,
            createdAt: new Date(),
            createdBy: pmId,
            updatedAt: new Date()
          });
      }

      console.log(`  📋 Created columns and tasks for project ${projectRef.id}`);
    }

    console.log('\n🎉 Successfully created test projects for PM users!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating projects:', error);
    process.exit(1);
  }
}

createPMProjects(); 