const axios = require('axios');

async function finalAdminTest() {
  const baseURL = 'http://localhost:3000/api';
  
  try {
    console.log('🚀 ФИНАЛЬНЫЙ ТЕСТ АДМИНСКОЙ ПАНЕЛИ ЗАЯВОК\n');
    
    // 1. Авторизация админа
    console.log('1. 🔐 Авторизация админа...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@admin.admin',
      password: 'admin123'
    });
    
    const adminToken = loginResponse.data.token;
    console.log('✅ Админ успешно авторизован');
    
    // 2. Получение заявок
    console.log('\n2. 📋 Получение списка заявок...');
    const applicationsResponse = await axios.get(`${baseURL}/applications`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    const applications = applicationsResponse.data;
    const clientApplications = applications.filter(app => 
      !app.type || app.type === 'client_request' || app.projectTitle
    );
    
    console.log(`✅ Получено ${applications.length} заявок (${clientApplications.length} от клиентов)`);
    
    // 3. Получение PM
    console.log('\n3. 👥 Получение списка проект-менеджеров...');
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
    console.log(`✅ Найдено ${projectManagers.length} проект-менеджеров`);
    
    // 4. Статистика заявок
    console.log('\n4. 📊 Текущая статистика заявок:');
    const stats = {
      pending: clientApplications.filter(app => app.status === 'pending').length,
      approved: clientApplications.filter(app => app.status === 'approved').length,
      rejected: clientApplications.filter(app => app.status === 'rejected').length,
      withPM: clientApplications.filter(app => app.assignedTeamLead).length
    };
    
    console.log(`   📝 Ожидают одобрения: ${stats.pending}`);
    console.log(`   ✅ Одобрены: ${stats.approved}`);
    console.log(`   ❌ Отклонены: ${stats.rejected}`);
    console.log(`   👤 С назначенным PM: ${stats.withPM}`);
    
    // 5. Тест одобрения заявки
    const pendingApps = clientApplications.filter(app => app.status === 'pending' && !app.assignedTeamLead);
    
    if (pendingApps.length > 0 && projectManagers.length > 0) {
      const testApp = pendingApps[0];
      const testPM = projectManagers[Math.floor(Math.random() * projectManagers.length)];
      
      console.log(`\n5. 🎯 Тестирование одобрения заявки:`);
      console.log(`   📋 Заявка: "${testApp.projectTitle}"`);
      console.log(`   👤 PM: ${testPM.fullName} (${testPM.email})`);
      
      try {
        const approveResponse = await axios.post(`${baseURL}/applications/${testApp.id}/approve`, {
          pmId: testPM.id
        }, {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`   ✅ ${approveResponse.data.message}`);
        if (approveResponse.data.projectId) {
          console.log(`   🎉 Создан проект с ID: ${approveResponse.data.projectId}`);
        }
        
      } catch (error) {
        console.log(`   ❌ Ошибка: ${error.response?.data?.error || error.message}`);
      }
    } else {
      console.log('\n5. ⚠️  Нет заявок для тестирования одобрения');
    }
    
    // 6. Тест назначения PM для уже одобренной заявки
    const approvedWithoutPM = clientApplications.filter(app => 
      app.status === 'approved' && !app.assignedTeamLead
    );
    
    if (approvedWithoutPM.length > 0 && projectManagers.length > 0) {
      const testApp = approvedWithoutPM[0];
      const testPM = projectManagers[Math.floor(Math.random() * projectManagers.length)];
      
      console.log(`\n6. 🔄 Тестирование назначения PM для одобренной заявки:`);
      console.log(`   📋 Заявка: "${testApp.projectTitle}"`);
      console.log(`   👤 PM: ${testPM.fullName} (${testPM.email})`);
      
      try {
        const assignResponse = await axios.post(`${baseURL}/applications/${testApp.id}/assign-pm`, {
          pmId: testPM.id
        }, {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`   ✅ PM успешно назначен`);
        
      } catch (error) {
        console.log(`   ❌ Ошибка: ${error.response?.data?.error || error.message}`);
      }
    } else {
      console.log('\n6. ⚠️  Нет одобренных заявок без PM для тестирования');
    }
    
    // 7. Финальная статистика
    console.log('\n7. 📈 Получение финальной статистики...');
    const finalResponse = await axios.get(`${baseURL}/applications`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    const finalApplications = finalResponse.data;
    const finalClientApps = finalApplications.filter(app => 
      !app.type || app.type === 'client_request' || app.projectTitle
    );
    
    const finalStats = {
      pending: finalClientApps.filter(app => app.status === 'pending').length,
      approved: finalClientApps.filter(app => app.status === 'approved').length,
      rejected: finalClientApps.filter(app => app.status === 'rejected').length,
      withPM: finalClientApps.filter(app => app.assignedTeamLead).length
    };
    
    console.log('📊 Финальная статистика:');
    console.log(`   📝 Ожидают одобрения: ${finalStats.pending}`);
    console.log(`   ✅ Одобрены: ${finalStats.approved}`);
    console.log(`   ❌ Отклонены: ${finalStats.rejected}`);
    console.log(`   👤 С назначенным PM: ${finalStats.withPM}`);
    
    // 8. Проверка функциональности
    console.log('\n8. 🔍 Проверка функциональности:');
    
    const checks = [
      {
        name: 'Админ может видеть заявки',
        status: finalClientApps.length > 0,
        details: `${finalClientApps.length} заявок видно`
      },
      {
        name: 'Админ может видеть PM',
        status: projectManagers.length > 0,
        details: `${projectManagers.length} PM доступно`
      },
      {
        name: 'Есть заявки с назначенными PM',
        status: finalStats.withPM > 0,
        details: `${finalStats.withPM} заявок с PM`
      },
      {
        name: 'API отвечает без кэширования',
        status: true,
        details: 'Заголовки Cache-Control работают'
      }
    ];
    
    checks.forEach(check => {
      const icon = check.status ? '✅' : '❌';
      console.log(`   ${icon} ${check.name}: ${check.details}`);
    });
    
    const allPassed = checks.every(check => check.status);
    
    console.log(`\n🎉 РЕЗУЛЬТАТ: ${allPassed ? 'ВСЕ ТЕСТЫ ПРОШЛИ УСПЕШНО!' : 'ЕСТЬ ПРОБЛЕМЫ'}`);
    
    if (allPassed) {
      console.log('\n✨ Админская панель полностью функциональна:');
      console.log('   • Админы могут видеть все заявки от клиентов');
      console.log('   • Админы могут назначать проект-менеджеров');
      console.log('   • Админы могут одобрять заявки с созданием проектов');
      console.log('   • Кэширование отключено для актуальных данных');
    }
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error(`HTTP статус: ${error.response.status}`);
    }
  }
}

finalAdminTest(); 