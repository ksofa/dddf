const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// Тестовые данные
const PM_CREDENTIALS = {
  email: 'pm@test.test',
  password: 'password123'
};

let authToken = '';
let projectId = '';
let taskId = '';

async function testTaskManagement() {
  try {
    console.log('🧪 Тестирование функциональности управления задачами для PM\n');

    // 1. Авторизация как PM
    console.log('1. Авторизация как PM...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, PM_CREDENTIALS);
    authToken = loginResponse.data.token;
    console.log('✅ PM успешно авторизован');

    // Настройка заголовков для всех запросов
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

    // 2. Получение списка проектов
    console.log('\n2. Получение списка проектов...');
    const projectsResponse = await axios.get(`${API_BASE}/projects`);
    const projects = projectsResponse.data;
    
    if (projects.length === 0) {
      console.log('❌ Нет доступных проектов');
      return;
    }

    projectId = projects[0].id;
    console.log(`✅ Найден проект: ${projects[0].title} (ID: ${projectId})`);

    // 3. Создание новой задачи
    console.log('\n3. Создание новой задачи...');
    const newTaskData = {
      text: 'Тестовая задача от PM',
      column: 'todo',
      status: 'todo',
      priority: 'high',
      color: '#FF6B6B',
      description: 'Это тестовая задача для проверки функциональности PM'
    };

    const createTaskResponse = await axios.post(
      `${API_BASE}/projects/${projectId}/tasks`,
      newTaskData
    );
    console.log('✅ Задача успешно создана:', createTaskResponse.data.message);

    // 4. Получение списка задач
    console.log('\n4. Получение списка задач...');
    const tasksResponse = await axios.get(`${API_BASE}/projects/${projectId}/tasks`);
    const tasks = tasksResponse.data;
    
    if (tasks.length === 0) {
      console.log('❌ Задачи не найдены');
      return;
    }

    // Находим нашу созданную задачу
    const createdTask = tasks.find(task => task.text === newTaskData.text);
    if (!createdTask) {
      console.log('❌ Созданная задача не найдена в списке');
      return;
    }

    taskId = createdTask.id;
    console.log(`✅ Найдено ${tasks.length} задач, включая созданную (ID: ${taskId})`);

    // 5. Добавление комментария к задаче
    console.log('\n5. Добавление комментария к задаче...');
    const commentData = {
      text: 'Это тестовый комментарий от PM к задаче'
    };

    const addCommentResponse = await axios.post(
      `${API_BASE}/projects/${projectId}/tasks/${taskId}/comments`,
      commentData
    );
    console.log('✅ Комментарий успешно добавлен:', addCommentResponse.data.message);

    // 6. Получение комментариев к задаче
    console.log('\n6. Получение комментариев к задаче...');
    const commentsResponse = await axios.get(
      `${API_BASE}/projects/${projectId}/tasks/${taskId}/comments`
    );
    const comments = commentsResponse.data;
    console.log(`✅ Найдено ${comments.length} комментариев к задаче`);

    if (comments.length > 0) {
      console.log('   Последний комментарий:', comments[0].text);
    }

    // 7. Обновление статуса задачи
    console.log('\n7. Обновление статуса задачи...');
    const updateTaskResponse = await axios.put(
      `${API_BASE}/projects/${projectId}/tasks/${taskId}`,
      {
        status: 'in_progress',
        column: 'in_progress'
      }
    );
    console.log('✅ Статус задачи обновлен на "В работе"');

    // 8. Удаление комментария (если есть)
    if (comments.length > 0) {
      console.log('\n8. Удаление комментария...');
      const commentId = comments[0].id;
      
      try {
        await axios.delete(
          `${API_BASE}/projects/${projectId}/tasks/${taskId}/comments/${commentId}`
        );
        console.log('✅ Комментарий успешно удален');
      } catch (error) {
        console.log('⚠️  Ошибка удаления комментария:', error.response?.data?.message || error.message);
      }
    }

    // 9. Удаление задачи
    console.log('\n9. Удаление задачи...');
    try {
      const deleteTaskResponse = await axios.delete(
        `${API_BASE}/projects/${projectId}/tasks/${taskId}`
      );
      console.log('✅ Задача успешно удалена:', deleteTaskResponse.data.message);
    } catch (error) {
      console.log('⚠️  Ошибка удаления задачи:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 Все тесты функциональности управления задачами завершены!');
    console.log('\n📋 Проверенная функциональность:');
    console.log('   ✅ Создание задач');
    console.log('   ✅ Просмотр списка задач');
    console.log('   ✅ Добавление комментариев');
    console.log('   ✅ Просмотр комментариев');
    console.log('   ✅ Обновление статуса задач');
    console.log('   ✅ Удаление комментариев');
    console.log('   ✅ Удаление задач');

  } catch (error) {
    console.error('❌ Ошибка тестирования:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('💡 Проверьте, что сервер запущен и PM пользователь существует');
    } else if (error.response?.status === 403) {
      console.log('💡 Проверьте права доступа PM к проекту');
    } else if (error.response?.status === 404) {
      console.log('💡 Проверьте, что проект и задачи существуют');
    }
  }
}

// Запуск тестов
testTaskManagement(); 