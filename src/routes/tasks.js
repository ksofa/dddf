const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const admin = require('firebase-admin');

const db = admin.firestore();

// Получить все задачи пользователя
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.uid;
    const userRoles = req.user.roles || [];

    let tasksQuery;
    
    // Если админ или PM - показываем все задачи
    if (userRoles.includes('admin') || userRoles.includes('pm')) {
      tasksQuery = db.collection('tasks');
    } else {
      // Для исполнителей - только их задачи
      tasksQuery = db.collection('tasks').where('assignedTo', '==', userId);
    }

    const tasksSnapshot = await tasksQuery.get();
    const tasks = [];

    for (const doc of tasksSnapshot.docs) {
      const taskData = doc.data();
      
      // Получаем информацию о проекте
      let projectTitle = 'Неизвестный проект';
      if (taskData.projectId) {
        try {
          const projectDoc = await db.collection('projects').doc(taskData.projectId).get();
          if (projectDoc.exists) {
            projectTitle = projectDoc.data().title || 'Неизвестный проект';
          }
        } catch (error) {
          console.error('Error fetching project:', error);
        }
      }

      tasks.push({
        id: doc.id,
        ...taskData,
        projectTitle
      });
    }

    // Сортируем по дате создания (новые сначала)
    tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Ошибка при получении задач' });
  }
});

// Создать новую задачу
router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.uid;
    const userRoles = req.user.roles || [];
    
    // Только PM и админы могут создавать задачи
    if (!userRoles.includes('pm') && !userRoles.includes('admin')) {
      return res.status(403).json({ error: 'Недостаточно прав для создания задач' });
    }

    const {
      title,
      description,
      assignedTo,
      projectId,
      priority = 'medium',
      dueDate
    } = req.body;

    if (!title || !assignedTo || !projectId) {
      return res.status(400).json({ error: 'Заполните все обязательные поля' });
    }

    const taskData = {
      title,
      description: description || '',
      assignedTo,
      projectId,
      priority,
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // +7 дней по умолчанию
      status: 'todo',
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await db.collection('tasks').add(taskData);
    
    res.status(201).json({
      id: docRef.id,
      ...taskData
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Ошибка при создании задачи' });
  }
});

// Обновить задачу
router.put('/:taskId', authenticate, async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.uid;
    const userRoles = req.user.roles || [];
    const updates = req.body;

    // Получаем текущую задачу
    const taskDoc = await db.collection('tasks').doc(taskId).get();
    if (!taskDoc.exists) {
      return res.status(404).json({ error: 'Задача не найдена' });
    }

    const taskData = taskDoc.data();

    // Проверяем права на изменение
    const canEdit = userRoles.includes('admin') || 
                   userRoles.includes('pm') || 
                   taskData.assignedTo === userId;

    if (!canEdit) {
      return res.status(403).json({ error: 'Недостаточно прав для изменения задачи' });
    }

    // Исполнители могут менять только статус
    if (!userRoles.includes('admin') && !userRoles.includes('pm') && taskData.assignedTo === userId) {
      const allowedFields = ['status'];
      const updateKeys = Object.keys(updates);
      const hasDisallowedFields = updateKeys.some(key => !allowedFields.includes(key));
      
      if (hasDisallowedFields) {
        return res.status(403).json({ error: 'Исполнители могут изменять только статус задачи' });
      }
    }

    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await db.collection('tasks').doc(taskId).update(updateData);

    res.json({
      id: taskId,
      ...taskData,
      ...updateData
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Ошибка при обновлении задачи' });
  }
});

// Удалить задачу
router.delete('/:taskId', authenticate, async (req, res) => {
  try {
    const { taskId } = req.params;
    const userRoles = req.user.roles || [];

    // Только PM и админы могут удалять задачи
    if (!userRoles.includes('pm') && !userRoles.includes('admin')) {
      return res.status(403).json({ error: 'Недостаточно прав для удаления задач' });
    }

    const taskDoc = await db.collection('tasks').doc(taskId).get();
    if (!taskDoc.exists) {
      return res.status(404).json({ error: 'Задача не найдена' });
    }

    await db.collection('tasks').doc(taskId).delete();
    
    res.json({ message: 'Задача удалена' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Ошибка при удалении задачи' });
  }
});

module.exports = router; 