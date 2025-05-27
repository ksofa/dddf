const axios = require('axios');

async function testAdminApplications() {
  const baseURL = 'http://localhost:3000/api';
  
  try {
    console.log('🔍 Тестирование админской панели заявок...\n');
    
    // 1. Проверяем здоровье API
    console.log('1. Проверка здоровья API...');
    const healthResponse = await axios.get(`${baseURL}/health`);
    console.log('✅ API работает:', healthResponse.data.message);
    
    // 2. Логинимся как админ
    console.log('\n2. Авторизация как админ...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@admin.admin',
      password: 'admin123'
    });
    
    const adminToken = loginResponse.data.token;
    console.log('✅ Админ авторизован');
    
    // 3. Получаем заявки с отключенным кэшем
    console.log('\n3. Получение заявок (с отключенным кэшем)...');
    const applicationsResponse = await axios.get(`${baseURL}/applications`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    const applications = applicationsResponse.data;
    console.log(`✅ Получено ${applications.length} заявок`);
    
    // Показываем заявки от клиентов
    const clientApplications = applications.filter(app => 
      !app.type || app.type === 'client_request' || app.projectTitle
    );
    
    console.log(`📋 Заявки от клиентов: ${clientApplications.length}`);
    clientApplications.forEach((app, index) => {
      console.log(`   ${index + 1}. ${app.projectTitle || 'Без названия'} - ${app.status} (ID: ${app.id})`);
      console.log(`      Клиент: ${app.fullName || 'Не указан'}`);
      console.log(`      Email: ${app.email || 'Не указан'}`);
      console.log(`      Телефон: ${app.phone || 'Не указан'}`);
      if (app.assignedTeamLead) {
        console.log(`      Назначен PM: ${app.assignedTeamLead}`);
      }
      console.log('');
    });
    
    // 4. Получаем список PM
    console.log('4. Получение списка проект-менеджеров...');
    const usersResponse = await axios.get(`${baseURL}/users`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    const users = usersResponse.data;
    const projectManagers = users.filter(user => user.roles && user.roles.includes('pm'));
    
    console.log(`✅ Найдено ${projectManagers.length} проект-менеджеров:`);
    projectManagers.forEach((pm, index) => {
      console.log(`   ${index + 1}. ${pm.fullName || pm.name} (${pm.email}) - ID: ${pm.id}`);
    });
    
    // 5. Тестируем назначение PM для первой pending заявки
    const pendingApplications = clientApplications.filter(app => app.status === 'pending' && !app.assignedTeamLead);
    
    if (pendingApplications.length > 0 && projectManagers.length > 0) {
      const testApp = pendingApplications[0];
      const testPM = projectManagers[0];
      
      console.log(`\n5. Тестирование одобрения заявки "${testApp.projectTitle}" с назначением PM "${testPM.fullName}"...`);
      
      try {
        const approveResponse = await axios.post(`${baseURL}/applications/${testApp.id}/approve`, {
          pmId: testPM.id
        }, {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('✅ Заявка успешно одобрена:', approveResponse.data.message);
        if (approveResponse.data.projectId) {
          console.log(`✅ Создан проект с ID: ${approveResponse.data.projectId}`);
        }
        
      } catch (error) {
        console.log('❌ Ошибка при одобрении заявки:', error.response?.data?.error || error.message);
      }
    } else {
      console.log('\n5. ⚠️  Нет pending заявок или PM для тестирования одобрения');
    }
    
    // 6. Проверяем обновленный список заявок
    console.log('\n6. Проверка обновленного списка заявок...');
    const updatedResponse = await axios.get(`${baseURL}/applications`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    const updatedApplications = updatedResponse.data;
    const updatedClientApps = updatedApplications.filter(app => 
      !app.type || app.type === 'client_request' || app.projectTitle
    );
    
    console.log('📊 Статистика заявок:');
    const stats = {
      pending: updatedClientApps.filter(app => app.status === 'pending').length,
      approved: updatedClientApps.filter(app => app.status === 'approved').length,
      rejected: updatedClientApps.filter(app => app.status === 'rejected').length,
      withPM: updatedClientApps.filter(app => app.assignedTeamLead).length
    };
    
    console.log(`   Ожидают: ${stats.pending}`);
    console.log(`   Одобрены: ${stats.approved}`);
    console.log(`   Отклонены: ${stats.rejected}`);
    console.log(`   С назначенным PM: ${stats.withPM}`);
    
    console.log('\n✅ Тестирование завершено успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error(`HTTP статус: ${error.response.status}`);
    }
  }
}

testAdminApplications(); 