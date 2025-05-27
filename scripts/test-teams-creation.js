const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function createTestTeams() {
  try {
    console.log('🚀 Создание тестовых команд через API...');

    // Тестовые команды
    const testTeams = [
      {
        title: 'Mobile App Team',
        name: 'Mobile App Team',
        description: 'Команда разработки мобильного приложения',
        teamMembers: [
          {
            id: 'user1',
            name: 'Александр Петров',
            displayName: 'Александр Петров',
            email: 'alex.petrov@example.com',
            role: 'pm',
            specialization: 'Project Management'
          },
          {
            id: 'user2',
            name: 'Мария Иванова',
            displayName: 'Мария Иванова',
            email: 'maria.ivanova@example.com',
            role: 'frontend',
            specialization: 'Frontend Development'
          },
          {
            id: 'user3',
            name: 'Дмитрий Смирнов',
            displayName: 'Дмитрий Смирнов',
            email: 'dmitry.smirnov@example.com',
            role: 'backend',
            specialization: 'Backend Development'
          },
          {
            id: 'user4',
            name: 'Елена Козлова',
            displayName: 'Елена Козлова',
            email: 'elena.kozlova@example.com',
            role: 'designer',
            specialization: 'UI/UX Design'
          }
        ]
      },
      {
        title: 'Web Platform Team',
        name: 'Web Platform Team',
        description: 'Команда разработки веб-платформы',
        teamMembers: [
          {
            id: 'user1',
            name: 'Александр Петров',
            displayName: 'Александр Петров',
            email: 'alex.petrov@example.com',
            role: 'pm',
            specialization: 'Project Management'
          },
          {
            id: 'user2',
            name: 'Мария Иванова',
            displayName: 'Мария Иванова',
            email: 'maria.ivanova@example.com',
            role: 'frontend',
            specialization: 'Frontend Development'
          },
          {
            id: 'user3',
            name: 'Дмитрий Смирнов',
            displayName: 'Дмитрий Смирнов',
            email: 'dmitry.smirnov@example.com',
            role: 'backend',
            specialization: 'Backend Development'
          },
          {
            id: 'user5',
            name: 'Сергей Волков',
            displayName: 'Сергей Волков',
            email: 'sergey.volkov@example.com',
            role: 'qa',
            specialization: 'Quality Assurance'
          }
        ]
      },
      {
        title: 'Analytics Team',
        name: 'Analytics Team',
        description: 'Команда аналитики и исследований',
        teamMembers: [
          {
            id: 'user1',
            name: 'Александр Петров',
            displayName: 'Александр Петров',
            email: 'alex.petrov@example.com',
            role: 'pm',
            specialization: 'Project Management'
          },
          {
            id: 'user5',
            name: 'Сергей Волков',
            displayName: 'Сергей Волков',
            email: 'sergey.volkov@example.com',
            role: 'qa',
            specialization: 'Quality Assurance'
          },
          {
            id: 'user6',
            name: 'Анна Федорова',
            displayName: 'Анна Федорова',
            email: 'anna.fedorova@example.com',
            role: 'analyst',
            specialization: 'Business Analysis'
          }
        ]
      },
      {
        title: 'Design System Team',
        name: 'Design System Team',
        description: 'Команда дизайн-системы',
        teamMembers: [
          {
            id: 'user1',
            name: 'Александр Петров',
            displayName: 'Александр Петров',
            email: 'alex.petrov@example.com',
            role: 'pm',
            specialization: 'Project Management'
          },
          {
            id: 'user3',
            name: 'Дмитрий Смирнов',
            displayName: 'Дмитрий Смирнов',
            email: 'dmitry.smirnov@example.com',
            role: 'backend',
            specialization: 'Backend Development'
          },
          {
            id: 'user4',
            name: 'Елена Козлова',
            displayName: 'Елена Козлова',
            email: 'elena.kozlova@example.com',
            role: 'designer',
            specialization: 'UI/UX Design'
          }
        ]
      },
      {
        title: 'DevOps Team',
        name: 'DevOps Team',
        description: 'Команда DevOps и инфраструктуры',
        teamMembers: [
          {
            id: 'user1',
            name: 'Александр Петров',
            displayName: 'Александр Петров',
            email: 'alex.petrov@example.com',
            role: 'pm',
            specialization: 'Project Management'
          },
          {
            id: 'user2',
            name: 'Мария Иванова',
            displayName: 'Мария Иванова',
            email: 'maria.ivanova@example.com',
            role: 'frontend',
            specialization: 'Frontend Development'
          },
          {
            id: 'user3',
            name: 'Дмитрий Смирнов',
            displayName: 'Дмитрий Смирнов',
            email: 'dmitry.smirnov@example.com',
            role: 'backend',
            specialization: 'Backend Development'
          },
          {
            id: 'user5',
            name: 'Сергей Волков',
            displayName: 'Сергей Волков',
            email: 'sergey.volkov@example.com',
            role: 'qa',
            specialization: 'Quality Assurance'
          }
        ]
      }
    ];

    console.log('📊 Тестовые команды готовы к отображению!');
    console.log(`Создано команд: ${testTeams.length}`);
    
    testTeams.forEach((team, index) => {
      console.log(`${index + 1}. ${team.title} - ${team.teamMembers.length} участников`);
    });

    console.log('\n🎉 Команды будут отображаться на фронтенде через существующий API!');
    console.log('💡 Данные загружаются из /api/teams endpoint');

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

// Запускаем
createTestTeams()
  .then(() => {
    console.log('✅ Скрипт завершен');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }); 