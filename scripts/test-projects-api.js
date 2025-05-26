const axios = require('axios');

async function testProjectsAPI() {
  try {
    console.log('🔍 Тестирование API проектов...');

    // Сначала авторизуемся как PM
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'pm@test.test',
      password: '123456'
    });

    if (!loginResponse.data.token) {
      console.error('❌ Ошибка авторизации');
      return;
    }

    const token = loginResponse.data.token;
    console.log('✅ Авторизация успешна');
    console.log('👤 Пользователь:', loginResponse.data.user.email);
    console.log('🔑 Роли:', loginResponse.data.user.roles);

    // Тестируем получение проектов
    console.log('\n📋 Получение проектов...');
    const projectsResponse = await axios.get('http://localhost:3000/api/projects', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Проекты получены успешно');
    console.log('📊 Количество проектов:', projectsResponse.data.length);
    
    if (projectsResponse.data.length > 0) {
      console.log('\n📝 Первые 3 проекта:');
      projectsResponse.data.slice(0, 3).forEach((project, index) => {
        console.log(`${index + 1}. ${project.title || project.id}`);
        console.log(`   ID: ${project.id}`);
        console.log(`   Статус: ${project.status}`);
        console.log(`   PM: ${project.pmId || 'не назначен'}`);
        console.log(`   Команда: ${project.teamMembers?.length || 0} участников`);
        console.log('');
      });
    } else {
      console.log('📭 Проектов не найдено');
    }

  } catch (error) {
    console.error('❌ Ошибка:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error('📊 Статус:', error.response.status);
    }
  }
}

testProjectsAPI(); 