const { admin } = require('../src/config/firebase');

async function testAddMemberFlow() {
  try {
    console.log('🧪 Тестирование функциональности добавления участников...\n');
    
    // 1. Создаем токен для PM пользователя
    const pmToken = await admin.auth().createCustomToken('5W6YYoii6HYhwWaI4zZSz15siSA3');
    console.log('✅ PM токен создан');
    
    // 2. Тестируем получение пользователей
    const usersResponse = await fetch('http://localhost:3000/api/users', {
      headers: {
        'Authorization': `Bearer ${pmToken}`
      }
    });
    
    if (usersResponse.ok) {
      const users = await usersResponse.json();
      console.log(`✅ Получено ${users.length} пользователей`);
      
      // Показываем исполнителей
      const executors = users.filter(u => 
        u.roles && (
          u.roles.includes('developer') || 
          u.roles.includes('designer') || 
          u.roles.includes('qa') || 
          u.roles.includes('team_lead') ||
          u.roles.includes('executor')
        )
      );
      console.log(`📋 Доступно ${executors.length} исполнителей:`);
      executors.slice(0, 5).forEach(user => {
        console.log(`   - ${user.displayName} (${user.email}) - ${user.roles.join(', ')}`);
      });
      
      // 3. Тестируем добавление участника
      if (executors.length > 0) {
        const testUser = executors[0];
        console.log(`\n🔄 Тестируем добавление ${testUser.displayName} в проект project-1...`);
        
        const addMemberResponse = await fetch('http://localhost:3000/api/projects/project-1/add-member', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${pmToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: testUser.uid
          })
        });
        
        if (addMemberResponse.ok) {
          const result = await addMemberResponse.json();
          console.log('✅ Участник успешно добавлен:', result.message);
        } else {
          const error = await addMemberResponse.json();
          console.log('⚠️ Ошибка при добавлении:', error.error || error.message);
        }
      }
      
    } else {
      console.log('❌ Ошибка при получении пользователей:', usersResponse.status);
    }
    
    console.log('\n🎯 Тестирование завершено!');
    console.log('\n📝 Инструкции для тестирования в браузере:');
    console.log('1. Откройте http://localhost:5173');
    console.log('2. Войдите под pm@test.test / password123');
    console.log('3. Перейдите в раздел "Проекты"');
    console.log('4. Нажмите кнопку "Команда" у любого проекта');
    console.log('5. Нажмите кнопку "Добавить участника"');
    console.log('6. Выберите участника и добавьте его в команду');
    
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error);
  }
  
  process.exit(0);
}

testAddMemberFlow(); 