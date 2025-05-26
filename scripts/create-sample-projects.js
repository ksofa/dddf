const { auth, db } = require('../src/config/firebase');

async function createSampleProjects() {
  try {
    console.log('Creating sample projects with teams...');
    
    // Получаем всех проект-менеджеров
    const usersSnapshot = await db.collection('users').get();
    const projectManagers = [];
    
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      if (userData.roles && userData.roles.includes('project_manager')) {
        projectManagers.push({
          id: doc.id,
          name: userData.displayName || userData.fullName,
          email: userData.email,
          specialization: userData.specialization
        });
      }
    });
    
    console.log('Available project managers:', projectManagers.length);
    
    // Создаем несколько тестовых проектов
    const sampleProjects = [
      {
        title: "Мобильное приложение для доставки",
        description: "Разработка iOS и Android приложения для службы доставки еды",
        client: "ООО Быстрая Доставка",
        customerInfo: {
          fullName: "Иван Петров",
          phone: "+79123456789",
          email: "ivan@delivery.com"
        },
        techSpec: "Нативные приложения с интеграцией карт, платежей и push-уведомлений",
        status: ["active"],
        teamSize: 3
      },
      {
        title: "Корпоративный веб-портал",
        description: "Создание внутреннего портала для управления сотрудниками",
        client: "ТехноКорп",
        customerInfo: {
          fullName: "Мария Сидорова",
          phone: "+79987654321",
          email: "maria@technocorp.ru"
        },
        techSpec: "React + Node.js, интеграция с Active Directory",
        status: ["in_progress"],
        teamSize: 2
      },
      {
        title: "Система аналитики данных",
        description: "Платформа для анализа больших данных и машинного обучения",
        client: "DataTech Solutions",
        customerInfo: {
          fullName: "Алексей Волков",
          phone: "+79555123456",
          email: "alexey@datatech.com"
        },
        techSpec: "Python, TensorFlow, Apache Spark, веб-интерфейс",
        status: ["pending"],
        teamSize: 4
      }
    ];
    
    for (let i = 0; i < sampleProjects.length; i++) {
      const project = sampleProjects[i];
      
      // Выбираем случайных PM для команды
      const teamMembers = [];
      const shuffledPMs = [...projectManagers].sort(() => 0.5 - Math.random());
      
      for (let j = 0; j < Math.min(project.teamSize, shuffledPMs.length); j++) {
        teamMembers.push(shuffledPMs[j].id);
      }
      
      const teamLead = teamMembers[0]; // Первый участник - тимлид
      
      // Создаем проект
      const projectData = {
        title: project.title,
        description: project.description,
        status: project.status,
        client: project.client,
        customerInfo: project.customerInfo,
        techSpec: project.techSpec,
        teamLead: teamLead,
        teamMembers: teamMembers,
        team: teamMembers,
        manager: teamLead,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Получаем информацию о тимлиде
      const teamLeadDoc = await db.collection('users').doc(teamLead).get();
      if (teamLeadDoc.exists) {
        const teamLeadData = teamLeadDoc.data();
        projectData.teamLeadInfo = {
          id: teamLead,
          displayName: teamLeadData.displayName || teamLeadData.fullName,
          email: teamLeadData.email
        };
      }
      
      const docRef = await db.collection('projects').add(projectData);
      console.log(`✓ Created project "${project.title}" with ID: ${docRef.id}`);
      console.log(`  Team: ${teamMembers.length} members`);
      console.log(`  Team Lead: ${projectData.teamLeadInfo?.displayName}`);
    }
    
    console.log('\nSample projects created successfully!');
    
  } catch (error) {
    console.error('Error creating sample projects:', error);
  }
}

createSampleProjects().then(() => {
  console.log('Script completed');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
}); 