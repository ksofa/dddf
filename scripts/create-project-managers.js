const { db, auth } = require('../src/config/firebase');

const projectManagers = [
  {
    email: 'pm.web@taska.com',
    password: 'pm123456',
    displayName: 'Анна Петрова',
    specialization: 'Web Development',
    categories: ['web', 'frontend', 'backend', 'fullstack'],
    experience: '5+ лет',
    description: 'Специалист по веб-разработке с опытом управления проектами на React, Node.js, Python'
  },
  {
    email: 'pm.mobile@taska.com',
    password: 'pm123456',
    displayName: 'Дмитрий Иванов',
    specialization: 'Mobile Development',
    categories: ['mobile', 'ios', 'android', 'react-native', 'flutter'],
    experience: '4+ года',
    description: 'Эксперт по мобильной разработке, управление проектами iOS/Android приложений'
  },
  {
    email: 'pm.design@taska.com',
    password: 'pm123456',
    displayName: 'Елена Смирнова',
    specialization: 'Design & UX',
    categories: ['design', 'ui', 'ux', 'branding', 'graphics'],
    experience: '6+ лет',
    description: 'Руководитель дизайн-проектов, специалист по UX/UI и брендингу'
  },
  {
    email: 'pm.data@taska.com',
    password: 'pm123456',
    displayName: 'Алексей Козлов',
    specialization: 'Data Science & AI',
    categories: ['data-science', 'machine-learning', 'ai', 'analytics'],
    experience: '7+ лет',
    description: 'Управление проектами в области анализа данных, машинного обучения и ИИ'
  },
  {
    email: 'pm.devops@taska.com',
    password: 'pm123456',
    displayName: 'Михаил Волков',
    specialization: 'DevOps & Infrastructure',
    categories: ['devops', 'cloud', 'infrastructure', 'automation'],
    experience: '5+ лет',
    description: 'Специалист по DevOps, облачной инфраструктуре и автоматизации процессов'
  },
  {
    email: 'pm.ecommerce@taska.com',
    password: 'pm123456',
    displayName: 'Ольга Новикова',
    specialization: 'E-commerce & CRM',
    categories: ['ecommerce', 'crm', 'business', 'integration'],
    experience: '4+ года',
    description: 'Управление проектами интернет-магазинов, CRM систем и бизнес-интеграций'
  }
];

async function createProjectManagers() {
  console.log('Создание проект-менеджеров...');
  
  for (const pmData of projectManagers) {
    try {
      console.log(`Создание PM: ${pmData.displayName} (${pmData.email})`);
      
      // Проверяем, существует ли уже пользователь
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(pmData.email);
        console.log(`  Пользователь уже существует: ${userRecord.uid}`);
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          // Создаем нового пользователя
          userRecord = await auth.createUser({
            email: pmData.email,
            password: pmData.password,
            displayName: pmData.displayName
          });
          console.log(`  Создан новый пользователь: ${userRecord.uid}`);
        } else {
          throw error;
        }
      }
      
      // Создаем/обновляем документ пользователя в Firestore
      const userData = {
        fullName: pmData.displayName,
        displayName: pmData.displayName,
        name: pmData.displayName,
        email: pmData.email,
        role: 'project_manager',
        roles: ['project_manager'],
        categories: pmData.categories,
        specialization: pmData.specialization,
        experience: pmData.experience,
        description: pmData.description,
        createdAt: new Date(),
        profileImage: null,
        contactInfo: {
          phone: '',
          telegram: '',
          linkedin: ''
        },
        stats: {
          projectsCompleted: 0,
          projectsActive: 0,
          averageRating: 0,
          totalReviews: 0
        },
        availability: 'available', // available, busy, unavailable
        workload: 0, // процент загруженности (0-100)
        maxProjects: 5 // максимальное количество одновременных проектов
      };

      await db.collection('users').doc(userRecord.uid).set(userData, { merge: true });
      console.log(`  Данные пользователя обновлены в Firestore`);
      
    } catch (error) {
      console.error(`Ошибка при создании PM ${pmData.displayName}:`, error);
    }
  }
  
  console.log('Создание проект-менеджеров завершено!');
}

async function listProjectManagers() {
  console.log('\nСписок проект-менеджеров:');
  
  try {
    const pmSnapshot = await db.collection('users')
      .where('roles', 'array-contains', 'project_manager')
      .get();
    
    pmSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`- ${data.displayName} (${data.email})`);
      console.log(`  Специализация: ${data.specialization}`);
      console.log(`  Категории: ${data.categories?.join(', ')}`);
      console.log(`  Опыт: ${data.experience}`);
      console.log(`  Статус: ${data.availability || 'не указан'}`);
      console.log(`  Загруженность: ${data.workload || 0}%`);
      console.log('');
    });
  } catch (error) {
    console.error('Ошибка при получении списка PM:', error);
  }
}

// Запуск скрипта
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'create') {
    createProjectManagers()
      .then(() => process.exit(0))
      .catch(error => {
        console.error('Ошибка:', error);
        process.exit(1);
      });
  } else if (command === 'list') {
    listProjectManagers()
      .then(() => process.exit(0))
      .catch(error => {
        console.error('Ошибка:', error);
        process.exit(1);
      });
  } else {
    console.log('Использование:');
    console.log('  node scripts/create-project-managers.js create  - создать PM');
    console.log('  node scripts/create-project-managers.js list    - показать список PM');
    process.exit(1);
  }
}

module.exports = { createProjectManagers, listProjectManagers }; 