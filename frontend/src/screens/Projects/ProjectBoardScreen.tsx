import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DroppableStateSnapshot, DraggableProvided, DraggableStateSnapshot } from "@hello-pangea/dnd";
import { useEffect, useState } from 'react';
import { getProjectBoard, createTask, updateTaskStatus, createDefaultScrumBoardWithTasks, getUsers, deleteTask, getTaskComments, addTaskComment, deleteTaskComment } from '../../api/projects';
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { apiClient } from '../../api/config';

const columnColors = [
  "bg-[#ED533F]", // Бэклог
  "bg-[#DD8227]", // Нужно сделать
  "bg-[#2982FD]", // В работе
  "bg-[#0FB14D]", // Правки
  "bg-[#0FB14D]", // Готово
];

const priorityColors = {
  low: '#10B981',
  medium: '#F59E0B', 
  high: '#EF4444',
  critical: '#7C2D12'
};

const priorityLabels = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий', 
  critical: 'Критический'
};

type ProjectBoardScreenProps = {
  projectId: string;
};

type Task = {
  id: string;
  title: string;
  text?: string;
  description?: string;
  assignee?: {
    id: string;
    fullName: string;
    profileImage?: string;
  };
  dueDate?: string;
  color?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
};

type Column = {
  title: string;
  status: string;
  tasks: Task[];
};

type User = {
  id: string;
  uid?: string;
  displayName: string;
  email: string;
  roles: string[];
  profileImage?: string;
};

type NewTaskData = {
  title: string;
  assignee: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  color: string;
  description: string;
};

type TaskComment = {
  id: string;
  text: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  mentions?: string[];
};

export const ProjectBoardScreen = ({ projectId }: ProjectBoardScreenProps) => {
  const { user } = useAuth();
  
  // Отладочная информация о пользователе
  console.log('🔍 ProjectBoardScreen - User data:', {
    user,
    uid: user?.uid,
    roles: user?.roles,
    hasUser: !!user,
    projectId
  });
  
  const [columns, setColumns] = useState<Column[]>([]);
  const [addingTaskCol, setAddingTaskCol] = useState<number | null>(null);
  const [newTaskData, setNewTaskData] = useState<NewTaskData>({
    title: '',
    assignee: '',
    dueDate: '',
    priority: 'medium',
    color: '#3B82F6',
    description: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);

  // Проверяем права пользователя
  const [isProjectPM, setIsProjectPM] = useState(false);
  const [isProjectExecutor, setIsProjectExecutor] = useState(false);
  const [projectData, setProjectData] = useState<any>(null);

  // Состояние для модального окна задачи
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskComments, setTaskComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [addingComment, setAddingComment] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    
    loadBoard();
    loadTeamMembers();
  }, [projectId]);

  const loadBoard = async () => {
    try {
      console.log('🔄 loadBoard started for projectId:', projectId);
      console.log('👤 Current user in loadBoard:', user);
      
      setLoading(true);
      setError(null);
      
      // Создаем дефолтную доску если нужно
      await createDefaultScrumBoardWithTasks(projectId);
      
      // Загружаем данные доски
      const data = await getProjectBoard(projectId);
      setColumns(data.columns);
      
      // Проверяем права пользователя - получаем проект
      const projectResponse = await apiClient.get(`/projects/${projectId}`);
      const project = projectResponse.data;
      setProjectData(project);
      
      // Определяем роли пользователя в проекте
      console.log('🔍 Checking user permissions for project:', {
        userId: user?.uid,
        userRoles: user?.roles,
        projectManager: project.manager,
        projectPmId: project.pmId,
        projectTeamLead: project.teamLead,
        projectTeamMembers: project.teamMembers
      });
      
      // Упрощенная логика определения прав PM
      const isUserPM = user && (
        user.roles?.includes('admin') ||
        user.uid === project.manager ||
        user.uid === project.pmId ||
        user.uid === project.teamLead ||
        (user.roles?.includes('pm') && (
          user.uid === project.manager || 
          user.uid === project.pmId ||
          user.uid === project.teamLead
        ))
      );
      
      const isUserExecutor = user && (
        project.team?.includes(user.uid) ||
        project.teamMembers?.some((member: any) => member.id === user.uid || member === user.uid)
      );
      
      console.log('✅ User permissions determined:', {
        isUserPM,
        isUserExecutor,
        canCreateTasks: isUserPM || user?.roles?.includes('admin')
      });
      
      setIsProjectPM(isUserPM || false);
      setIsProjectExecutor(isUserExecutor || false);
      
    } catch (error) {
      console.error('Error loading board:', error);
      setError('Ошибка загрузки доски');
    } finally {
      setLoading(false);
    }
  };

  const loadTeamMembers = async () => {
    try {
      const users = await getUsers();
      // Фильтруем только участников команды проекта
      const projectResponse = await apiClient.get(`/projects/${projectId}`);
      const project = projectResponse.data;
      
      const members = users.filter((user: User) => 
        project.team?.includes(user.uid || user.id) ||
        project.teamMembers?.some((member: any) => member.id === (user.uid || user.id)) ||
        user.uid === project.pmId ||
        user.uid === project.teamLead ||
        user.uid === project.manager
      );
      
      setTeamMembers(members);
    } catch (error) {
      console.error('Error loading team members:', error);
    }
  };

  // Проверяем, может ли пользователь перемещать задачу
  const canMoveTask = (task: Task) => {
    if (user?.roles?.includes('admin') || isProjectPM) return true;
    if (isProjectExecutor && task.assignee?.id === user?.uid) return true;
    return false;
  };

  // Drag&Drop обработчик
  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;
    
    // Находим задачу для проверки прав
    const sourceColumn = columns[Number(source.droppableId)];
    const task = sourceColumn.tasks.find(t => t.id === draggableId);
    
    if (!task || !canMoveTask(task)) {
      setError('У вас нет прав для перемещения этой задачи');
      return;
    }
    
    try {
      const newStatus = columns[Number(destination.droppableId)].status;
      await updateTaskStatus(draggableId, newStatus, projectId);
      
      // Обновляем локальное состояние
      await loadBoard();
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Ошибка обновления задачи');
    }
  };

  // Добавление задачи (только для PM и админов)
  const handleAddTask = async (colIdx: number) => {
    if (!projectId || !newTaskData.title.trim() || (!isProjectPM && !user?.roles?.includes('admin'))) return;
    
    try {
      const status = columns[colIdx].status;
      await createTask({
        projectId: projectId,
        status: status,
        title: newTaskData.title.trim(),
        assignee: newTaskData.assignee || undefined,
        dueDate: newTaskData.dueDate || undefined,
        priority: newTaskData.priority,
        color: newTaskData.color,
        description: newTaskData.description || undefined
      });
      
      // Сбрасываем форму
      setNewTaskData({
        title: '',
        assignee: '',
        dueDate: '',
        priority: 'medium',
        color: '#3B82F6',
        description: ''
      });
      setAddingTaskCol(null);
      
      // Перезагружаем доску
      await loadBoard();
    } catch (error) {
      console.error('Error creating task:', error);
      setError('Ошибка создания задачи');
    }
  };

  const resetTaskForm = () => {
    setNewTaskData({
      title: '',
      assignee: '',
      dueDate: '',
      priority: 'medium',
      color: '#3B82F6',
      description: ''
    });
    setAddingTaskCol(null);
  };

  // Определяем заголовок в зависимости от роли
  const getBoardTitle = () => {
    if (user?.roles?.includes('admin')) return 'Скрам доска (Админ)';
    if (isProjectPM) return 'Скрам доска (PM)';
    if (isProjectExecutor) return 'Скрам доска';
    return 'Скрам доска (Просмотр)';
  };

  const getAccessDescription = () => {
    if (user?.roles?.includes('admin')) return 'Полный доступ';
    if (isProjectPM) return 'Управление проектом';
    if (isProjectExecutor) return 'Можете перемещать свои задачи';
    return 'Только для просмотра';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
  };

  const getAvatarUrl = (assignee: Task['assignee']) => {
    if (!assignee) return '';
    return assignee.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(assignee.fullName)}&background=random`;
  };

  // Функция удаления задачи
  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту задачу?')) {
      return;
    }

    try {
      await deleteTask(projectId, taskId);
      await loadBoard(); // Перезагружаем доску
      setSelectedTask(null); // Закрываем модальное окно если оно открыто
    } catch (error) {
      console.error('Error deleting task:', error);
      setError('Ошибка удаления задачи');
    }
  };

  // Функция открытия модального окна задачи
  const handleOpenTask = async (task: Task) => {
    setSelectedTask(task);
    setLoadingComments(true);
    
    try {
      const comments = await getTaskComments(projectId, task.id);
      setTaskComments(comments);
    } catch (error) {
      console.error('Error loading comments:', error);
      setTaskComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  // Функция добавления комментария
  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedTask) return;

    setAddingComment(true);
    try {
      await addTaskComment(projectId, selectedTask.id, newComment.trim());
      setNewComment('');
      
      // Перезагружаем комментарии
      const comments = await getTaskComments(projectId, selectedTask.id);
      setTaskComments(comments);
    } catch (error) {
      console.error('Error adding comment:', error);
      setError('Ошибка добавления комментария');
    } finally {
      setAddingComment(false);
    }
  };

  // Функция удаления комментария
  const handleDeleteComment = async (commentId: string) => {
    if (!selectedTask || !window.confirm('Удалить комментарий?')) return;

    try {
      await deleteTaskComment(projectId, selectedTask.id, commentId);
      
      // Перезагружаем комментарии
      const comments = await getTaskComments(projectId, selectedTask.id);
      setTaskComments(comments);
    } catch (error) {
      console.error('Error deleting comment:', error);
      setError('Ошибка удаления комментария');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main-colorsaqua mx-auto mb-4"></div>
          <p className="text-neutralneutral-60">Загрузка доски...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={loadBoard}
            className="px-4 py-2 bg-main-colorsaqua text-white rounded-lg hover:bg-[#3771C8]"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  // Отладочная информация о состоянии прав
  console.log('🎯 Render state check:', {
    isProjectPM,
    isProjectExecutor,
    userRoles: user?.roles,
    projectData: projectData ? {
      manager: projectData.manager,
      pmId: projectData.pmId,
      teamLead: projectData.teamLead
    } : null
  });

  return (
    <div className="bg-[#F6F7F9] min-h-screen flex flex-col items-center px-0 md:px-0 pt-0 md:pt-0">
      <div className="w-full max-w-full md:max-w-[1808px] flex-1 flex flex-col items-center px-0 sm:px-0 md:px-0">
        {/* Заголовок */}
        <div className="w-full max-w-full md:max-w-[1744px] bg-white rounded-t-[24px] p-4 md:p-6 border border-[#ECECEC] border-b-0 mt-4 md:mt-0">
          <div className="flex items-center justify-between">
            <h1 className="text-xl md:text-2xl font-h1-alternative text-neutralneutral-10">{getBoardTitle()}</h1>
            <span className="text-sm text-neutralneutral-60 font-paragraph-14">
              {getAccessDescription()}
            </span>
          </div>
        </div>

        {/* Доска */}
        <div className="w-full max-w-full md:max-w-[1744px] bg-white rounded-b-[24px] p-2 sm:p-4 md:p-8 flex flex-col gap-4 sm:gap-6 md:gap-10 min-h-[400px] border border-[#ECECEC] border-t-0 shadow-sm">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-3 sm:gap-5 md:gap-8 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              {columns.map((col, colIdx) => (
                <Droppable droppableId={String(colIdx)} key={col.title} isDropDisabled={!isProjectPM}>
                  {(provided: any, snapshot: any) => {
                    return (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`w-[272px] sm:w-[296px] md:w-[320px] flex-shrink-0 bg-[#F8F8FA] border border-[#ECECEC] rounded-[18px] flex flex-col p-4 gap-3 shadow-xs ${
                          snapshot.isDraggingOver ? 'bg-main-colorsaqua-10' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-3 h-3 rounded-full ${columnColors[colIdx]}`}></div>
                          <span className="text-[18px] font-semibold text-[#222] tracking-tight">{col.title}</span>
                          <span className="text-[18px] font-semibold text-[#A5A5A7]">{col.tasks.length}</span>
                          {isProjectPM && (
                            <button
                              className="w-8 h-8 flex items-center justify-center border border-[#ECECEC] rounded-full bg-white ml-auto hover:bg-[#F3F7FE] transition"
                              onClick={() => setAddingTaskCol(colIdx)}
                            >
                              <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                                <rect x="2" y="2" width="16" height="16" rx="8" fill="#222"/>
                                <path d="M10 6v8M6 10h8" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                            </button>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-2 flex-1 overflow-y-auto mt-1">
                          {col.tasks.map((task, idx) => (
                            <Draggable 
                              draggableId={task.id} 
                              index={idx} 
                              key={task.id}
                              isDragDisabled={!isProjectPM}
                            >
                              {(provided: any, snapshot: any) => {
                                return (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`w-full rounded-[10px] bg-white border border-[#E6EAF2] shadow-sm p-3 text-[15px] text-[#222] font-normal mb-1 hover:bg-[#F3F7FE] transition ${
                                      isProjectPM ? 'cursor-pointer' : 'cursor-default'
                                    } ${
                                      snapshot.isDragging ? 'shadow-lg rotate-2' : ''
                                    }`}
                                    style={{
                                      borderLeft: task.color ? `4px solid ${task.color}` : undefined,
                                      ...provided.draggableProps.style
                                    }}
                                  >
                                    {/* Заголовок задачи с кнопками действий */}
                                    <div className="flex items-start justify-between mb-2">
                                      <div 
                                        className="font-medium flex-1 cursor-pointer"
                                        onClick={() => handleOpenTask(task)}
                                      >
                                        {task.title || task.text}
                                      </div>
                                      
                                      {isProjectPM && (
                                        <div className="flex items-center gap-1 ml-2">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleOpenTask(task);
                                            }}
                                            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                            title="Просмотреть задачу"
                                          >
                                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                                              <path stroke="currentColor" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                              <path stroke="currentColor" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                            </svg>
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteTask(task.id);
                                            }}
                                            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                            title="Удалить задачу"
                                          >
                                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                                              <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                            </svg>
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Приоритет */}
                                    {task.priority && task.priority !== 'medium' && (
                                      <div className="mb-2">
                                        <span 
                                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                                          style={{
                                            backgroundColor: `${priorityColors[task.priority]}20`,
                                            color: priorityColors[task.priority]
                                          }}
                                        >
                                          {task.priority === 'critical' && '🔥'}
                                          {task.priority === 'high' && '⚡'}
                                          {task.priority === 'low' && '📋'}
                                          {priorityLabels[task.priority]}
                                        </span>
                                      </div>
                                    )}
                                    
                                    {/* Информация о задаче */}
                                    <div className="flex items-center justify-between text-xs text-neutralneutral-60">
                                      <div className="flex items-center gap-2">
                                        {task.assignee && (
                                          <div className="flex items-center gap-1">
                                            <img 
                                              src={getAvatarUrl(task.assignee)}
                                              alt={task.assignee.fullName}
                                              className="w-5 h-5 rounded-full"
                                            />
                                            <span className="truncate max-w-[80px]">
                                              {task.assignee.fullName.split(' ')[0]}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                      
                                      {task.dueDate && (
                                        <span className={`text-xs ${
                                          new Date(task.dueDate) < new Date() 
                                            ? 'text-red-600 font-medium' 
                                            : 'text-neutralneutral-60'
                                        }`}>
                                          {formatDate(task.dueDate)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              }}
                            </Draggable>
                          ))}
                          <div>{provided.placeholder}</div>
                          
                          {/* Форма добавления задачи */}
                          {addingTaskCol === colIdx && isProjectPM && (
                            <div className="bg-white border border-[#ECECEC] rounded-[12px] p-4 mt-2 shadow-sm">
                              <form
                                className="flex flex-col gap-3"
                                onSubmit={e => {
                                  e.preventDefault();
                                  handleAddTask(colIdx);
                                }}
                              >
                                {/* Название задачи */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Название задачи *
                                  </label>
                                  <textarea
                                    className="w-full border border-[#ECECEC] rounded-[8px] px-3 py-2 text-[15px] bg-white outline-none resize-none focus:border-[#2982FD] focus:ring-1 focus:ring-[#2982FD]"
                                    value={newTaskData.title}
                                    onChange={e => setNewTaskData(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Введите название задачи..."
                                    autoFocus
                                    rows={2}
                                    required
                                  />
                                </div>

                                {/* Описание */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Описание
                                  </label>
                                  <textarea
                                    className="w-full border border-[#ECECEC] rounded-[8px] px-3 py-2 text-[14px] bg-white outline-none resize-none focus:border-[#2982FD] focus:ring-1 focus:ring-[#2982FD]"
                                    value={newTaskData.description}
                                    onChange={e => setNewTaskData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Дополнительное описание задачи..."
                                    rows={2}
                                  />
                                </div>

                                {/* Исполнитель */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Исполнитель
                                  </label>
                                  <select
                                    className="w-full border border-[#ECECEC] rounded-[8px] px-3 py-2 text-[14px] bg-white outline-none focus:border-[#2982FD] focus:ring-1 focus:ring-[#2982FD]"
                                    value={newTaskData.assignee}
                                    onChange={e => setNewTaskData(prev => ({ ...prev, assignee: e.target.value }))}
                                  >
                                    <option value="">Не назначен</option>
                                    {teamMembers.map(member => (
                                      <option key={member.id} value={member.uid || member.id}>
                                        {member.displayName} ({member.email})
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {/* Приоритет и дедлайн в одной строке */}
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Приоритет
                                    </label>
                                    <select
                                      className="w-full border border-[#ECECEC] rounded-[8px] px-3 py-2 text-[14px] bg-white outline-none focus:border-[#2982FD] focus:ring-1 focus:ring-[#2982FD]"
                                      value={newTaskData.priority}
                                      onChange={e => setNewTaskData(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' | 'critical' }))}
                                    >
                                      <option value="low">Низкий</option>
                                      <option value="medium">Средний</option>
                                      <option value="high">Высокий</option>
                                      <option value="critical">Критический</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Дедлайн
                                    </label>
                                    <input
                                      type="date"
                                      className="w-full border border-[#ECECEC] rounded-[8px] px-3 py-2 text-[14px] bg-white outline-none focus:border-[#2982FD] focus:ring-1 focus:ring-[#2982FD]"
                                      value={newTaskData.dueDate}
                                      onChange={e => setNewTaskData(prev => ({ ...prev, dueDate: e.target.value }))}
                                      min={new Date().toISOString().split('T')[0]}
                                    />
                                  </div>
                                </div>

                                {/* Цвет задачи */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Цвет задачи
                                  </label>
                                  <div className="flex gap-2">
                                    {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16'].map(color => (
                                      <button
                                        key={color}
                                        type="button"
                                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                                          newTaskData.color === color 
                                            ? 'border-gray-800 scale-110' 
                                            : 'border-gray-300 hover:border-gray-500'
                                        }`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => setNewTaskData(prev => ({ ...prev, color }))}
                                      />
                                    ))}
                                  </div>
                                </div>

                                {/* Кнопки действий */}
                                <div className="flex gap-2 pt-2">
                                  <button
                                    type="submit"
                                    disabled={!newTaskData.title.trim()}
                                    className="flex-1 py-2 bg-[#2982FD] text-white rounded-[8px] font-medium text-[15px] hover:bg-[#3771C8] transition disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Создать задачу
                                  </button>
                                  <button
                                    type="button"
                                    onClick={resetTaskForm}
                                    className="px-4 py-2 border border-[#ECECEC] text-[#666] rounded-[8px] font-medium text-[15px] hover:bg-[#F8F8FA] transition"
                                  >
                                    Отмена
                                  </button>
                                </div>
                              </form>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }}
                </Droppable>
              ))}
            </div>
          </DragDropContext>
        </div>
      </div>

      {/* Модальное окно задачи */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Заголовок модального окна */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedTask.title || selectedTask.text}
              </h2>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Содержимое модального окна */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Информация о задаче */}
              <div className="mb-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {selectedTask.assignee && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Исполнитель
                      </label>
                      <div className="flex items-center gap-2">
                        <img 
                          src={getAvatarUrl(selectedTask.assignee)}
                          alt={selectedTask.assignee.fullName}
                          className="w-8 h-8 rounded-full"
                        />
                        <span className="text-sm text-gray-900">
                          {selectedTask.assignee.fullName}
                        </span>
                      </div>
                    </div>
                  )}

                  {selectedTask.dueDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Дедлайн
                      </label>
                      <span className={`text-sm ${
                        new Date(selectedTask.dueDate) < new Date() 
                          ? 'text-red-600 font-medium' 
                          : 'text-gray-900'
                      }`}>
                        {new Date(selectedTask.dueDate).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                  )}
                </div>

                {selectedTask.priority && selectedTask.priority !== 'medium' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Приоритет
                    </label>
                    <span 
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: `${priorityColors[selectedTask.priority]}20`,
                        color: priorityColors[selectedTask.priority]
                      }}
                    >
                      {selectedTask.priority === 'critical' && '🔥'}
                      {selectedTask.priority === 'high' && '⚡'}
                      {selectedTask.priority === 'low' && '📋'}
                      {priorityLabels[selectedTask.priority]}
                    </span>
                  </div>
                )}

                {(selectedTask.description || selectedTask.text) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Описание
                    </label>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                      {selectedTask.description || selectedTask.text}
                    </p>
                  </div>
                )}
              </div>

              {/* Комментарии */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Комментарии ({taskComments.length})
                </h3>

                {/* Форма добавления комментария */}
                <div className="mb-6">
                  <div className="flex gap-3">
                    <img 
                      src={user?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'User')}&background=random`}
                      alt={user?.displayName || 'User'}
                      className="w-8 h-8 rounded-full flex-shrink-0"
                    />
                    <div className="flex-1">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Добавить комментарий..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={handleAddComment}
                          disabled={!newComment.trim() || addingComment}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {addingComment ? 'Добавление...' : 'Добавить комментарий'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Список комментариев */}
                <div className="space-y-4">
                  {loadingComments ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                  ) : taskComments.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      Комментариев пока нет
                    </p>
                  ) : (
                    taskComments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <img 
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(comment.createdBy)}&background=random`}
                          alt="User"
                          className="w-8 h-8 rounded-full flex-shrink-0"
                        />
                        <div className="flex-1">
                          <div className="bg-gray-50 rounded-lg px-3 py-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-900">
                                {comment.createdBy}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">
                                  {new Date(comment.createdAt).toLocaleDateString('ru-RU', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                                {(comment.createdBy === user?.uid || isProjectPM) && (
                                  <button
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className="text-gray-400 hover:text-red-600 transition-colors"
                                    title="Удалить комментарий"
                                  >
                                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                                      <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-gray-900 whitespace-pre-wrap">
                              {comment.text}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 