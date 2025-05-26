const { db } = require('../src/config/firebase');

// Дефолтные колонки для скрам доски
const defaultColumns = [
  { name: "Бэклог", order: 0 },
  { name: "Нужно сделать", order: 1 },
  { name: "В работе", order: 2 },
  { name: "Правки", order: 3 },
  { name: "Готово", order: 4 },
];

async function createDefaultColumnsForProject(projectId, projectData) {
  try {
    console.log(`Creating default columns for project: ${projectData.title}`);

    // Проверяем, есть ли уже колонки для этого проекта
    const existingColumnsSnapshot = await db.collection('projects')
      .doc(projectId)
      .collection('columns')
      .get();

    if (!existingColumnsSnapshot.empty) {
      console.log(`Project ${projectId} already has columns, skipping...`);
      return;
    }

    // Создаем дефолтные колонки
    for (const column of defaultColumns) {
      const columnData = {
        name: column.name,
        order: column.order,
        createdAt: new Date(),
        createdBy: projectData.pmId || projectData.teamLead || 'system'
      };

      await db.collection('projects')
        .doc(projectId)
        .collection('columns')
        .add(columnData);

      console.log(`  ✓ Created column: ${column.name}`);
    }

    console.log(`✓ Successfully created columns for project ${projectId}`);
  } catch (error) {
    console.error(`Error creating columns for project ${projectId}:`, error);
  }
}

async function createDefaultColumnsForAllProjects() {
  try {
    console.log('Creating default columns for all existing projects...');
    
    // Получаем все проекты
    const projectsSnapshot = await db.collection('projects').get();
    
    if (projectsSnapshot.empty) {
      console.log('No projects found');
      return;
    }

    console.log(`Found ${projectsSnapshot.size} projects`);

    // Создаем колонки для каждого проекта
    for (const projectDoc of projectsSnapshot.docs) {
      const projectData = projectDoc.data();
      await createDefaultColumnsForProject(projectDoc.id, projectData);
    }

    console.log('\n✅ Finished creating default columns for all projects!');
    
  } catch (error) {
    console.error('Error creating default columns for projects:', error);
  }
}

// Запускаем скрипт
if (require.main === module) {
  createDefaultColumnsForAllProjects()
    .then(() => {
      console.log('Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createDefaultColumnsForProject, createDefaultColumnsForAllProjects }; 