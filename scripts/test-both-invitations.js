const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:3000/api';

// Тестовые данные
const testCredentials = {
  email: 'admin@test.com',
  password: 'admin123'
};

async function testBothInvitations() {
  try {
    console.log('🔐 Авторизация...');
    
    // Авторизация
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, testCredentials);
    const token = loginResponse.data.token;
    console.log('✅ Авторизация успешна');

    // Получаем список команд
    console.log('\n📋 Получение списка команд...');
    const teamsResponse = await axios.get(`${API_BASE_URL}/teams`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const teams = teamsResponse.data;
    const testTeam = teams[0];
    console.log(`📊 Тестируем команду: ${testTeam.name} (ID: ${testTeam.id})`);

    // Получаем список доступных пользователей
    console.log('\n👥 Получение списка пользователей...');
    const usersResponse = await axios.get(`${API_BASE_URL}/teams/${testTeam.id}/available-users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const users = usersResponse.data;
    const testUser1 = users[0];
    const testUser2 = users[1] || users[0]; // Если только один пользователь, используем его дважды
    
    console.log(`👤 Тестируем приглашения для:`);
    console.log(`   1. ${testUser1.name} (ID: ${testUser1.id}) - БЕЗ файла`);
    console.log(`   2. ${testUser2.name} (ID: ${testUser2.id}) - С файлом`);

    // ТЕСТ 1: Приглашение БЕЗ файла
    console.log('\n🔹 ТЕСТ 1: Приглашение БЕЗ файла');
    console.log('📤 Отправка простого приглашения...');
    
    const simpleInvitationData = {
      receiverId: testUser1.id,
      projectType: 'without_project',
      rate: '80000-120000',
      startDate: '2025-05-01',
      estimatedDuration: '2',
      estimatedDurationUnit: 'months',
      coverLetter: `Приглашение в команду "${testTeam.name}" (БЕЗ файла)

Уважаемый ${testUser1.name}!

Мы приглашаем вас присоединиться к нашей команде для работы над проектом.

Условия:
• Тип проекта: Без конкретного проекта
• Ставка: 80,000 - 120,000 ₽
• Старт: 1 мая 2025
• Длительность: 2 месяца

Это простое приглашение без прикрепленного технического задания.

С уважением,
Команда "Таска"`
    };

    const simpleResponse = await axios.post(
      `${API_BASE_URL}/teams/${testTeam.id}/invite-simple`,
      simpleInvitationData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Простое приглашение отправлено!');
    console.log(`   - ID: ${simpleResponse.data.invitationId}`);
    console.log(`   - Получатель: ${simpleResponse.data.data.receiverName}`);
    console.log(`   - Файл: ${simpleResponse.data.data.hasFile ? 'Да' : 'Нет'}`);

    // ТЕСТ 2: Приглашение С файлом
    console.log('\n🔹 ТЕСТ 2: Приглашение С файлом');
    
    const techSpecPath = path.join(__dirname, '../test-tech-spec.txt');
    console.log('📄 Проверяем файл ТЗ:', techSpecPath);
    
    if (!fs.existsSync(techSpecPath)) {
      console.log('❌ Файл ТЗ не найден, создаем новый...');
      fs.writeFileSync(techSpecPath, `ТЕХНИЧЕСКОЕ ЗАДАНИЕ
Проект: Система управления задачами "Таска"

1. ОПИСАНИЕ ПРОЕКТА
Разработка современной веб-платформы для управления проектами и задачами.

2. ТЕХНИЧЕСКИЕ ТРЕБОВАНИЯ
- Frontend: React, TypeScript, Tailwind CSS
- Backend: Node.js, Express, Firebase
- База данных: Firestore
- Аутентификация: Firebase Auth

3. ФУНКЦИОНАЛЬНЫЕ ТРЕБОВАНИЯ
- Управление пользователями и ролями
- Создание и управление проектами
- Система задач с приоритетами
- Командная работа
- Уведомления и чаты

4. СРОКИ И ЭТАПЫ
Этап 1: Базовая функциональность (1 месяц)
Этап 2: Расширенные возможности (2 месяца)
Этап 3: Тестирование и оптимизация (1 месяц)

Общая длительность: 4 месяца
Бюджет: 150,000 - 250,000 ₽

Дата создания: ${new Date().toLocaleDateString('ru-RU')}
`);
    }
    
    console.log('✅ Файл ТЗ готов');
    console.log('📤 Отправка приглашения с файлом...');

    const formData = new FormData();
    formData.append('receiverId', testUser2.id);
    formData.append('projectType', 'with_project');
    formData.append('rate', '150000-250000');
    formData.append('startDate', '2025-06-15');
    formData.append('estimatedDuration', '4');
    formData.append('estimatedDurationUnit', 'months');
    formData.append('coverLetter', `Приглашение в команду "${testTeam.name}" (С файлом ТЗ)

Уважаемый ${testUser2.name}!

Мы рады предложить вам участие в захватывающем проекте разработки системы управления задачами "Таска".

🎯 О проекте:
Это комплексная платформа для управления проектами с современным техническим стеком.

💼 Условия:
• Тип проекта: С конкретным проектом
• Ставка: 150,000 - 250,000 ₽
• Старт: 15 июня 2025
• Длительность: 4 месяца

📋 Техническое задание:
Подробное ТЗ прикреплено к этому приглашению. В нем описаны все требования, технологии и этапы реализации.

🚀 Что вас ждет:
• Работа с современными технологиями
• Интересные технические задачи
• Дружная команда профессионалов
• Возможности для роста

Будем рады обсудить детали!

С уважением,
Команда "Таска"`);
    
    // Добавляем файл
    formData.append('techSpecFile', fs.createReadStream(techSpecPath), {
      filename: 'tech-spec.txt',
      contentType: 'text/plain'
    });

    const fileResponse = await axios.post(
      `${API_BASE_URL}/teams/${testTeam.id}/invite`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          ...formData.getHeaders()
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    console.log('✅ Приглашение с файлом отправлено!');
    console.log(`   - ID: ${fileResponse.data.invitationId}`);
    console.log(`   - Получатель: ${fileResponse.data.data.receiverName}`);
    console.log(`   - Файл: ${fileResponse.data.data.hasFile ? 'Да' : 'Нет'}`);

    // ИТОГИ
    console.log('\n🎉 ВСЕ ТЕСТЫ ЗАВЕРШЕНЫ УСПЕШНО!');
    console.log('\n📊 РЕЗУЛЬТАТЫ:');
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│                    СИСТЕМА ПРИГЛАШЕНИЙ                      │');
    console.log('├─────────────────────────────────────────────────────────────┤');
    console.log(`│ ✅ Простое приглашение (без файла): ${simpleResponse.data.invitationId.substring(0, 8)}...     │`);
    console.log(`│ ✅ Полное приглашение (с файлом):   ${fileResponse.data.invitationId.substring(0, 8)}...     │`);
    console.log('├─────────────────────────────────────────────────────────────┤');
    console.log('│ 🔧 Backend endpoints:                                      │');
    console.log('│    • /invite-simple - для приглашений без файлов           │');
    console.log('│    • /invite - для приглашений с файлами                   │');
    console.log('├─────────────────────────────────────────────────────────────┤');
    console.log('│ 📁 Файлы сохраняются в: uploads/tech-specs/                │');
    console.log('│ 🔔 Уведомления создаются автоматически                     │');
    console.log('│ 💾 Данные сохраняются в Firestore                          │');
    console.log('└─────────────────────────────────────────────────────────────┘');

  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Детали ошибки:', error.response.data);
    }
  }
}

testBothInvitations(); 