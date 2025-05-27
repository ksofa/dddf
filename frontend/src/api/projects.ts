import { apiClient } from './config';

export interface Project {
  id: string;
  title: string;
  description: string;
  status: string[];
  manager: string;
  client: string;
  customerId?: string;
  customerInfo?: {
    fullName: string;
    phone: string;
    email: string;
  };
  teamLead?: string;
  teamLeadInfo?: {
    id: string;
    displayName: string;
    email: string;
  };
  team: string[];
  teamMembers: string[];
  techSpec?: string;
  createdAt: string;
  createdFrom?: string;
  applicationId?: string;
}

export interface CreateProjectData {
  title: string;
  description: string;
  customerId: string;
  team?: string[];
  status?: string;
}

// Получить все проекты
export async function getProjects(params?: { status?: string; limit?: number }): Promise<Project[]> {
  const response = await apiClient.get('/projects', { params });
  return response.data;
}

// Создать проект
export async function createProject(data: CreateProjectData): Promise<{ message: string; projectId: string; data: Project }> {
  const response = await apiClient.post('/projects', data);
  return response.data;
}

// Получить проект по ID
export async function getProject(projectId: string): Promise<Project> {
  const response = await apiClient.get(`/projects/${projectId}`);
  return response.data;
}

// Обновить проект
export async function updateProject(projectId: string, data: Partial<CreateProjectData>): Promise<{ message: string }> {
  const response = await apiClient.put(`/projects/${projectId}`, data);
  return response.data;
}

// Удалить проект
export async function deleteProject(projectId: string): Promise<{ message: string }> {
  const response = await apiClient.delete(`/projects/${projectId}`);
  return response.data;
}

// Назначить тимлида проекту
export async function assignTeamLead(projectId: string, teamLeadId: string): Promise<{ message: string }> {
  const response = await apiClient.post(`/projects/${projectId}/assign-teamlead`, {
    teamLeadId
  });
  return response.data;
}

// Добавить участника в команду проекта
export async function addTeamMember(projectId: string, userId: string): Promise<{ message: string }> {
  const response = await apiClient.post(`/projects/${projectId}/add-member`, {
    userId
  });
  return response.data;
}

// Удалить участника из команды проекта
export async function removeTeamMember(projectId: string, userId: string): Promise<{ message: string }> {
  const response = await apiClient.post(`/projects/${projectId}/remove-member`, {
    userId
  });
  return response.data;
}

// Получить команду проекта
export async function getProjectTeam(projectId: string): Promise<any> {
  const response = await apiClient.get(`/projects/${projectId}/team`);
  return response.data;
}

// Получить доступных исполнителей
export async function getAvailableExecutors() {
  try {
    const response = await apiClient.get('/executors/search');
    return response.data;
  } catch (error) {
    console.error('Error getting available executors:', error);
    throw error;
  }
}

// Отправить приглашение исполнителю
export async function sendInvitationToExecutor(projectId: string, executorId: string, message?: string) {
  try {
    const response = await apiClient.post(`/projects/${projectId}/invite`, {
      executorId,
      message
    });
    return response.data;
  } catch (error) {
    console.error('Error sending invitation:', error);
    throw error;
  }
}

// Получить приглашения
export async function getInvitations(status: string = 'pending') {
  try {
    const response = await apiClient.get(`/invitations?status=${status}`);
    return response.data;
  } catch (error) {
    console.error('Error getting invitations:', error);
    throw error;
  }
}

// Принять приглашение
export async function acceptInvitation(invitationId: string) {
  try {
    const response = await apiClient.post(`/invitations/${invitationId}/accept`);
    return response.data;
  } catch (error) {
    console.error('Error accepting invitation:', error);
    throw error;
  }
}

// Отклонить приглашение
export async function declineInvitation(invitationId: string) {
  try {
    const response = await apiClient.post(`/invitations/${invitationId}/decline`);
    return response.data;
  } catch (error) {
    console.error('Error declining invitation:', error);
    throw error;
  }
}

// Старые функции для совместимости (теперь используют приглашения)
export async function addExecutorToTeam(projectId: string, executorId: string) {
  // Теперь отправляем приглашение вместо прямого добавления
  return sendInvitationToExecutor(projectId, executorId);
}

// Удалить исполнителя из команды проекта
export async function removeExecutorFromTeam(projectId: string, executorId: string): Promise<{ message: string }> {
  const response = await apiClient.post(`/projects/${projectId}/remove-executor`, {
    executorId
  });
  return response.data;
}

// Для совместимости со старым API - заглушки
export async function getProjectBoard(projectId: string) {
  try {
    const response = await apiClient.get(`/projects/${projectId}/tasks`);
    const tasks = response.data;
    
    // Определяем тип для задачи
    interface Task {
      id: any;
      title: any;
      assignee: any;
      dueDate: any;
      color: any;
    }
    
    // Определяем тип для колонки
    interface Column {
      title: string;
      status: string;
      tasks: Task[];
    }
    
    // Группируем задачи по колонкам
    const columns: Column[] = [
      { title: "Бэклог", status: "backlog", tasks: [] },
      { title: "Нужно сделать", status: "todo", tasks: [] },
      { title: "В работе", status: "in_progress", tasks: [] },
      { title: "Правки", status: "review", tasks: [] },
      { title: "Готово", status: "done", tasks: [] },
    ];

    // Распределяем задачи по колонкам
    tasks.forEach((task: any) => {
      // Сопоставляем статусы задач со статусами колонок
      let columnStatus = task.status;
      
      // Если статус задачи не соответствует ни одной колонке, помещаем в "Нужно сделать"
      const validStatuses = ['backlog', 'todo', 'in_progress', 'review', 'done'];
      if (!validStatuses.includes(columnStatus)) {
        columnStatus = 'todo';
      }
      
      const column = columns.find(col => col.status === columnStatus);
      if (column) {
        column.tasks.push({
          id: task.id,
          title: task.text || task.title || 'Без названия',
          assignee: task.assigneeDetails,
          dueDate: task.dueDate,
          color: task.color
        });
      }
    });

    return { columns };
  } catch (error) {
    console.error('Error loading project board:', error);
    // Возвращаем пустые колонки в случае ошибки
    return {
      columns: [
        { title: "Бэклог", status: "backlog", tasks: [] },
        { title: "Нужно сделать", status: "todo", tasks: [] },
        { title: "В работе", status: "in_progress", tasks: [] },
        { title: "Правки", status: "review", tasks: [] },
        { title: "Готово", status: "done", tasks: [] },
      ]
    };
  }
}

export async function getUsers() {
  try {
    const response = await apiClient.get('/users');
    return response.data;
  } catch (error) {
    console.error('Error loading users:', error);
    return [];
  }
}

export async function createTask({ 
  projectId, 
  status, 
  title, 
  assignee, 
  dueDate, 
  priority, 
  color, 
  description 
}: { 
  projectId: string; 
  status: string; 
  title: string; 
  assignee?: string;
  dueDate?: string;
  priority?: string;
  color?: string;
  description?: string;
}) {
  try {
    const response = await apiClient.post(`/projects/${projectId}/tasks`, {
      text: title,
      column: status,
      status: status,
      assignee: assignee,
      dueDate: dueDate,
      priority: priority,
      color: color,
      description: description
    });
    return response.data.taskId;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
}

export async function updateTaskStatus(taskId: string, status: string, projectId: string) {
  try {
    await apiClient.put(`/projects/${projectId}/tasks/${taskId}`, {
      status: status,
      column: status
    });
  } catch (error) {
    console.error('Error updating task status:', error);
    throw error;
  }
}

export async function createCalculationRequest(projectId: string, userId: string, data: { estimatedHours: number; rate: number; comment: string }) {
  // Заглушка для заявок на расчет
  console.log('Creating calculation request:', { projectId, userId, data });
}

export async function createSpecialistProposal(projectId: string, userId: string, data: { rate: number; coverLetter: string }) {
  // Заглушка для предложений специалистов
  console.log('Creating specialist proposal:', { projectId, userId, data });
}

export async function createDefaultScrumBoardWithTasks(projectId: string) {
  try {
    // Создаем дефолтные колонки если их нет
    const response = await apiClient.post(`/projects/${projectId}/columns`, {
      name: 'Бэклог',
      order: 0
    });
    console.log('Default scrum board created:', response.data);
  } catch (error) {
    // Игнорируем ошибку если колонки уже существуют
    console.log('Scrum board already exists or error creating:', error);
  }
}

// Удаление задачи
export async function deleteTask(projectId: string, taskId: string) {
  try {
    const response = await apiClient.delete(`/projects/${projectId}/tasks/${taskId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
}

// Получение комментариев к задаче
export async function getTaskComments(projectId: string, taskId: string) {
  try {
    const response = await apiClient.get(`/projects/${projectId}/tasks/${taskId}/comments`);
    return response.data;
  } catch (error) {
    console.error('Error fetching task comments:', error);
    throw error;
  }
}

// Добавление комментария к задаче
export async function addTaskComment(projectId: string, taskId: string, text: string, mentions: string[] = []) {
  try {
    const response = await apiClient.post(`/projects/${projectId}/tasks/${taskId}/comments`, {
      text,
      mentions
    });
    return response.data;
  } catch (error) {
    console.error('Error adding task comment:', error);
    throw error;
  }
}

// Обновление комментария
export async function updateTaskComment(projectId: string, taskId: string, commentId: string, text: string, mentions: string[] = []) {
  try {
    const response = await apiClient.put(`/projects/${projectId}/tasks/${taskId}/comments/${commentId}`, {
      text,
      mentions
    });
    return response.data;
  } catch (error) {
    console.error('Error updating task comment:', error);
    throw error;
  }
}

// Удаление комментария
export async function deleteTaskComment(projectId: string, taskId: string, commentId: string) {
  try {
    const response = await apiClient.delete(`/projects/${projectId}/tasks/${taskId}/comments/${commentId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting task comment:', error);
    throw error;
  }
} 