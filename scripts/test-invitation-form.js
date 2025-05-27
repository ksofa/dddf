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

async function testInvitationForm() {
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
    const testUser = users[0];
    console.log(`👤 Тестируем приглашение для: ${testUser.name} (ID: ${testUser.id})`);

    // Подготавливаем файл для загрузки
    const techSpecPath = path.join(__dirname, '../test-tech-spec.txt');
    console.log('\n📄 Проверяем файл ТЗ:', techSpecPath);
    
    if (!fs.existsSync(techSpecPath)) {
      console.log('❌ Файл ТЗ не найден');
      return;
    }
    
    console.log('✅ Файл ТЗ найден');

    // Отправляем приглашение с полной формой и файлом
    console.log('\n📤 Отправка приглашения с полной формой и файлом...');
    
    const formData = new FormData();
    formData.append('receiverId', testUser.id);
    formData.append('projectType', 'with_project');
    formData.append('rate', '150000-250000');
    formData.append('startDate', '2025-07-01');
    formData.append('estimatedDuration', '6');
    formData.append('estimatedDurationUnit', 'months');
    formData.append('coverLetter', `Приглашение в команду "${testTeam.name}"

Уважаемый ${testUser.name}!

Мы рады предложить вам присоединиться к нашей команде для работы над захватывающим проектом системы управления задачами "Таска".

🎯 О проекте:
Мы разрабатываем современную платформу для управления проектами и задачами, которая поможет командам работать более эффективно и организованно.

💼 Что мы предлагаем:
• Конкурентную заработную плату: 150,000 - 250,000 ₽
• Работу с современными технологиями (React, TypeScript, Node.js)
• Гибкий график и возможность удаленной работы
• Дружную команду профессионалов
• Интересные технические задачи

📋 Техническое задание:
Подробное ТЗ прикреплено к этому приглашению. В нем описаны все требования к проекту, технический стек и этапы реализации.

⏰ Сроки:
Планируемый старт проекта: 1 июля 2025 года
Длительность: 6 месяцев

Мы уверены, что ваши навыки и опыт будут очень ценными для нашего проекта. Будем рады обсудить детали сотрудничества!

С уважением,
Команда "Таска"`);
    
    // Добавляем файл
    formData.append('techSpecFile', fs.createReadStream(techSpecPath), {
      filename: 'tech-spec.txt',
      contentType: 'text/plain'
    });

    console.log('📋 Отправляем данные формы...');

    const response = await axios.post(
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

    console.log('✅ Приглашение с файлом отправлено успешно!');
    console.log('📊 Результат:', response.data);
    
    console.log('\n📋 Детали приглашения:');
    console.log(`   - Команда: ${response.data.data.teamName}`);
    console.log(`   - Получатель: ${response.data.data.receiverName}`);
    console.log(`   - Тип проекта: ${response.data.data.projectType}`);
    console.log(`   - Ставка: ${response.data.data.rate}`);
    console.log(`   - Файл прикреплен: ${response.data.data.hasFile ? 'Да' : 'Нет'}`);
    console.log(`   - ID приглашения: ${response.data.invitationId}`);

    console.log('\n🎉 Тест полной формы с файлом завершен успешно!');

  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Детали ошибки:', error.response.data);
    }
  }
}

testInvitationForm(); 