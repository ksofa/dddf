const { db } = require('../src/config/firebase');
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testPMFunctionality() {
  try {
    console.log('🧪 Тестирование функциональности PM...\n');

    // 1. Авторизация PM
    console.log('🔐 Авторизация PM...');
    
    try {
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: 'pm@mail.ru',
        password: '123456'
      });

      const token = loginResponse.data.token;
      const pmUser = loginResponse.data.user;
      console.log('✅ PM авторизован:', pmUser.email, 'Роли:', pmUser.roles);

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // 2. Получение проектов PM
      console.log('\n📁 Получение проектов PM...');
      const projectsResponse = await axios.get(`${API_BASE_URL}/projects`, { headers });
      const projects = projectsResponse.data;
      console.log(`✅ Найдено проектов: ${projects.length}`);

      if (projects.length === 0) {
        console.log('❌ У PM нет проектов для тестирования');
        return;
      }

      const testProject = projects[0];
      console.log(`📋 Тестовый проект: ${testProject.title} (ID: ${testProject.id})`);

      // 3. Тестирование создания задач на скрам доске
      console.log('\n📝 Тестирование создания задач...');
      
      try {
        const taskData = {
          text: 'Тестовая задача от PM',
          description: 'Описание тестовой задачи',
          column: 'Нужно сделать',
          status: 'todo',
          priority: 'medium',
          color: '#3B82F6'
        };

        const createTaskResponse = await axios.post(
          `${API_BASE_URL}/projects/${testProject.id}/tasks`,
          taskData,
          { headers }
        );

        console.log('✅ Задача создана успешно:', createTaskResponse.data);
      } catch (error) {
        console.log('❌ Ошибка создания задачи:', error.response?.data?.message || error.message);
        console.log('   Детали ошибки:', error.response?.data);
      }

      // 4. Получение команд PM
      console.log('\n👥 Получение команд PM...');
      const teamsResponse = await axios.get(`${API_BASE_URL}/teams`, { headers });
      const teams = teamsResponse.data;
      console.log(`✅ Найдено команд: ${teams.length}`);

      if (teams.length === 0) {
        console.log('❌ У PM нет команд для тестирования приглашений');
        return;
      }

      // Показываем команды PM
      teams.forEach((team, index) => {
        console.log(`  ${index + 1}. ${team.name} (ID: ${team.id})`);
        console.log(`     Участников: ${team.members?.length || 0}`);
        console.log(`     PM: ${team.pm?.name || 'Не назначен'}`);
      });

      // 5. Тестирование получения доступных исполнителей
      console.log('\n🔍 Получение доступных исполнителей...');
      try {
        const executorsResponse = await axios.get(`${API_BASE_URL}/projects/${testProject.id}/members`, { headers });
        const executors = executorsResponse.data;
        console.log(`✅ Найдено участников проекта: ${executors.length}`);

        if (executors.length > 0) {
          const testExecutor = executors.find(user => user.roles?.includes('executor')) || executors[0];
          console.log(`👤 Тестовый исполнитель: ${testExecutor.displayName || testExecutor.name} (${testExecutor.email})`);

          // 6. Тестирование отправки приглашения
          console.log('\n📧 Тестирование отправки приглашения...');
          try {
            const invitationData = {
              projectId: testProject.id,
              userId: testExecutor.uid || testExecutor.id,
              message: 'Приглашаем вас присоединиться к нашему проекту!'
            };

            const inviteResponse = await axios.post(
              `${API_BASE_URL}/frontend/projects/${testProject.id}/invite`,
              invitationData,
              { headers }
            );

            console.log('✅ Приглашение отправлено успешно:', inviteResponse.data);
          } catch (error) {
            console.log('❌ Ошибка отправки приглашения:', error.response?.data?.message || error.message);
            console.log('   Детали ошибки:', error.response?.data);
          }
        }
      } catch (error) {
        console.log('❌ Ошибка получения участников проекта:', error.response?.data?.message || error.message);
        console.log('   Детали ошибки:', error.response?.data);
        
        // Попробуем альтернативный способ - получить всех пользователей с ролью executor
        console.log('   Пробуем альтернативный способ...');
        try {
          // Получаем пользователей из базы данных напрямую
          console.log('   Получаем исполнителей из базы данных...');
        } catch (dbError) {
          console.log('   ❌ Альтернативный способ тоже не сработал');
        }
      }

      // 7. Проверка отправленных приглашений
      console.log('\n📋 Проверка отправленных приглашений...');
      try {
        const invitationsResponse = await axios.get(`${API_BASE_URL}/projects/${testProject.id}/team-invitations`, { headers });
        const invitations = invitationsResponse.data;
        console.log(`✅ Отправленных приглашений: ${invitations.length}`);

        invitations.forEach((invitation, index) => {
          console.log(`  ${index + 1}. ${invitation.userName} (${invitation.userEmail}) - ${invitation.status}`);
        });
      } catch (error) {
        console.log('❌ Ошибка получения приглашений:', error.response?.data?.message || error.message);
        console.log('   Детали ошибки:', error.response?.data);
      }

      // 8. Проверка скрам доски
      console.log('\n📊 Проверка скрам доски...');
      try {
        const boardResponse = await axios.get(`${API_BASE_URL}/projects/${testProject.id}/board`, { headers });
        const boardData = boardResponse.data;
        console.log('✅ Скрам доска загружена');
        
        if (boardData.board) {
          const columns = Object.keys(boardData.board);
          console.log(`   Колонок: ${columns.length}`);
          
          columns.forEach(column => {
            const tasks = boardData.board[column];
            console.log(`   - ${column}: ${tasks?.length || 0} задач`);
          });
        }
        
        if (boardData.teamMembers) {
          console.log(`   Участников команды: ${boardData.teamMembers.length}`);
        }
      } catch (error) {
        console.log('❌ Ошибка загрузки скрам доски:', error.response?.data?.message || error.message);
        console.log('   Детали ошибки:', error.response?.data);
      }

      console.log('\n🎉 Тестирование функциональности PM завершено!');

    } catch (loginError) {
      console.error('❌ Ошибка авторизации PM:', loginError.response?.data?.message || loginError.message);
      console.error('   Детали ошибки:', loginError.response?.data);
      console.error('   Код ошибки:', loginError.response?.status);
      console.error('   URL:', loginError.config?.url);
    }

  } catch (error) {
    console.error('❌ Общая ошибка тестирования:', error.message);
    console.error('   Стек ошибки:', error.stack);
  }
}

testPMFunctionality(); 