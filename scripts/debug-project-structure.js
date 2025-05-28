const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// PM пользователь
const PM_EMAIL = 'pm@mail.ru';
const PM_PASSWORD = '123456';

async function debugProjectStructure() {
  try {
    console.log('🔍 Отладка структуры проекта...\n');

    // 1. Логин PM пользователя
    console.log('1. Логин PM пользователя...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: PM_EMAIL,
      password: PM_PASSWORD
    });

    const { token, user } = loginResponse.data;
    console.log('✅ PM успешно залогинился:', {
      uid: user.uid,
      email: user.email,
      roles: user.roles
    });

    const headers = { Authorization: `Bearer ${token}` };

    // 2. Получаем проекты PM
    console.log('\n2. Получение проектов PM...');
    const projectsResponse = await axios.get(`${API_BASE}/projects`, { headers });
    const projects = projectsResponse.data;
    
    console.log(`✅ Найдено ${projects.length} проектов`);
    
    if (projects.length === 0) {
      console.log('❌ У PM нет проектов для тестирования');
      return;
    }

    // Показываем структуру первого проекта
    const testProject = projects[0];
    console.log('\n📋 Структура первого проекта:');
    console.log(JSON.stringify(testProject, null, 2));

    // 3. Проверяем разные поля менеджера
    console.log('\n🔍 Проверка полей менеджера:');
    console.log('project.manager:', testProject.manager);
    console.log('project.pmId:', testProject.pmId);
    console.log('project.managerId:', testProject.managerId);
    console.log('project.pm:', testProject.pm);
    console.log('user.uid:', user.uid);
    
    // Проверяем соответствие
    console.log('\n🔍 Проверка соответствия:');
    console.log('manager === user.uid:', testProject.manager === user.uid);
    console.log('pmId === user.uid:', testProject.pmId === user.uid);
    console.log('managerId === user.uid:', testProject.managerId === user.uid);
    console.log('pm === user.uid:', testProject.pm === user.uid);

    // 4. Пробуем получить команду проекта с логированием
    console.log('\n4. Получение команды проекта...');
    try {
      const teamResponse = await axios.get(`${API_BASE}/projects/${testProject.id}/team`, { headers });
      const teamData = teamResponse.data;
      
      console.log('✅ Данные команды получены:');
      console.log(JSON.stringify(teamData, null, 2));
    } catch (error) {
      console.error('❌ Ошибка получения команды:', error.response?.data || error.message);
    }

    // 5. Проверяем все проекты
    console.log('\n5. Проверка всех проектов PM...');
    projects.forEach((project, index) => {
      console.log(`\nПроект ${index + 1}: ${project.title}`);
      console.log(`  ID: ${project.id}`);
      console.log(`  manager: ${project.manager}`);
      console.log(`  pmId: ${project.pmId}`);
      console.log(`  managerId: ${project.managerId}`);
      console.log(`  pm: ${project.pm}`);
      console.log(`  Соответствие pmId: ${project.pmId === user.uid}`);
      console.log(`  Соответствие manager: ${project.manager === user.uid}`);
    });

  } catch (error) {
    console.error('❌ Ошибка при отладке:', error.response?.data || error.message);
  }
}

debugProjectStructure(); 