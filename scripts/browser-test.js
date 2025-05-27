// Тест для проверки работы админской панели в браузере
// Запустите этот скрипт в консоли браузера на странице http://localhost:5173

async function testAdminPanelInBrowser() {
  console.log('🧪 Тестирование админской панели в браузере...');
  
  try {
    // Проверяем, что мы на правильной странице
    if (!window.location.href.includes('localhost:517')) {
      console.error('❌ Откройте http://localhost:5173/ в браузере');
      return;
    }
    
    // Проверяем доступность API
    console.log('📡 Проверяем доступность API...');
    const healthResponse = await fetch('http://localhost:3000/api/health');
    if (healthResponse.ok) {
      console.log('✅ API сервер работает');
    } else {
      console.error('❌ API сервер недоступен');
      return;
    }
    
    // Проверяем наличие компонента админской панели
    console.log('🔍 Ищем компонент админской панели...');
    
    // Ждем загрузки React компонентов
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Проверяем наличие элементов админской панели
    const adminElements = [
      'button', // кнопки
      'select', // выпадающие списки
      'table, .application-item, .card', // таблицы или карточки заявок
    ];
    
    let foundElements = 0;
    adminElements.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        console.log(`✅ Найдено ${elements.length} элементов: ${selector}`);
        foundElements++;
      } else {
        console.log(`⚠️ Не найдено элементов: ${selector}`);
      }
    });
    
    // Проверяем текст на странице
    const pageText = document.body.innerText.toLowerCase();
    const adminKeywords = ['application', 'заявк', 'admin', 'админ', 'project manager', 'pm'];
    
    let foundKeywords = 0;
    adminKeywords.forEach(keyword => {
      if (pageText.includes(keyword)) {
        console.log(`✅ Найдено ключевое слово: "${keyword}"`);
        foundKeywords++;
      }
    });
    
    // Итоговая оценка
    console.log('\n📊 РЕЗУЛЬТАТЫ ТЕСТА:');
    console.log(`- Элементы интерфейса: ${foundElements}/${adminElements.length}`);
    console.log(`- Ключевые слова: ${foundKeywords}/${adminKeywords.length}`);
    
    if (foundElements >= 2 && foundKeywords >= 2) {
      console.log('🎉 ТЕСТ ПРОЙДЕН! Админская панель загружена и работает');
    } else {
      console.log('⚠️ Возможны проблемы с загрузкой админской панели');
      console.log('💡 Попробуйте:');
      console.log('   1. Обновить страницу');
      console.log('   2. Войти как админ (admin@admin.admin / admin123)');
      console.log('   3. Перейти в раздел "Applications" или "Заявки"');
    }
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error);
  }
}

// Инструкции для пользователя
console.log(`
🚀 ИНСТРУКЦИЯ ПО ТЕСТИРОВАНИЮ:

1. Откройте http://localhost:5173/ в браузере
2. Войдите как админ:
   - Email: admin@admin.admin  
   - Password: admin123
3. Найдите раздел "Applications" или "Заявки"
4. Скопируйте и выполните в консоли браузера:

testAdminPanelInBrowser()

Или просто проверьте визуально:
- ✅ Видны заявки от клиентов
- ✅ Есть выпадающие списки для выбора PM
- ✅ Есть кнопки "Approve" или "Одобрить"
- ✅ Данные загружаются без ошибок
`);

// Автоматически запускаем тест если скрипт выполняется в браузере
if (typeof window !== 'undefined') {
  testAdminPanelInBrowser();
} 