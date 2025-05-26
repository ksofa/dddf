import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useEffect, useState } from 'react';
import { getProjectBoard, createTask, updateTaskStatus, createDefaultScrumBoardWithTasks } from '../../api/projects';
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

type ProjectBoardScreenProps = {
  projectId: string;
};

type Task = {
  id: string;
  title: string;
  assignee?: {
    id: string;
    fullName: string;
    profileImage?: string;
  };
  dueDate?: string;
  color?: string;
};

type Column = {
  title: string;
  status: string;
  tasks: Task[];
};

export const ProjectBoardScreen = ({ projectId }: ProjectBoardScreenProps) => {
  const { user } = useAuth();
  const [columns, setColumns] = useState<Column[]>([]);
  const [addingTaskCol, setAddingTaskCol] = useState<number | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Проверяем права пользователя
  const [isProjectPM, setIsProjectPM] = useState(false);
  const [isProjectExecutor, setIsProjectExecutor] = useState(false);
  const [projectData, setProjectData] = useState<any>(null);

  useEffect(() => {
    if (!projectId) return;
    
    loadBoard();
  }, [projectId]);

  const loadBoard = async () => {
    try {
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
      const isUserPM = user && (
        user.uid === project.teamLead ||
        user.uid === project.manager ||
        user.uid === project.pmId ||
        user.roles?.includes('admin') ||
        (user.roles?.includes('pm') && (
          project.teamLead === user.uid || 
          project.manager === user.uid || 
          project.pmId === user.uid
        ))
      );
      
      const isUserExecutor = user && (
        project.team?.includes(user.uid) ||
        project.teamMembers?.some((member: any) => member.id === user.uid)
      );
      
      setIsProjectPM(isUserPM || false);
      setIsProjectExecutor(isUserExecutor || false);
      
    } catch (error) {
      console.error('Error loading board:', error);
      setError('Ошибка загрузки доски');
    } finally {
      setLoading(false);
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
    if (!projectId || !newTaskTitle.trim() || (!isProjectPM && !user?.roles?.includes('admin'))) return;
    
    try {
      const status = columns[colIdx].status;
      await createTask({
        projectId: projectId,
        status: status,
        title: newTaskTitle.trim(),
      });
      
      setNewTaskTitle("");
      setAddingTaskCol(null);
      
      // Перезагружаем доску
      await loadBoard();
    } catch (error) {
      console.error('Error creating task:', error);
      setError('Ошибка создания задачи');
    }
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

  if (loading) {
    return (
      <div className="bg-[#F6F7F9] min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main-colorsaqua"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#F6F7F9] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={loadBoard}
            className="px-4 py-2 bg-main-colorsaqua text-white rounded-lg hover:bg-[#3771C8] transition-colors"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

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
                                    <div className="mb-2">
                                      {task.title}
                                    </div>
                                    
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
                                        <span className="text-xs text-neutralneutral-60">
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
                            <form
                              className="flex flex-col gap-2 mt-2"
                              onSubmit={e => {
                                e.preventDefault();
                                handleAddTask(colIdx);
                              }}
                            >
                              <textarea
                                className="flex-1 border border-[#ECECEC] rounded-[8px] px-3 py-2 text-[15px] bg-white outline-none resize-none"
                                value={newTaskTitle}
                                onChange={e => setNewTaskTitle(e.target.value)}
                                placeholder="Описание задачи..."
                                autoFocus
                                rows={3}
                              />
                              <div className="flex gap-2">
                                <button
                                  type="submit"
                                  disabled={!newTaskTitle.trim()}
                                  className="flex-1 py-2 bg-[#2982FD] text-white rounded-[8px] font-medium text-[15px] hover:bg-[#3771C8] transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Добавить
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAddingTaskCol(null);
                                    setNewTaskTitle("");
                                  }}
                                  className="px-4 py-2 border border-[#ECECEC] text-[#666] rounded-[8px] font-medium text-[15px] hover:bg-[#F8F8FA] transition"
                                >
                                  Отмена
                                </button>
                              </div>
                            </form>
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
    </div>
  );
}; 