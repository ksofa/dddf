import React, { useState, useEffect } from "react";
import { Badge } from "../../../../components/ui/badge";
import { useAuth } from "../../../../hooks/useAuth";
import { useNotifications } from "../../../../hooks/useNotifications";
import { getTasks, Task } from "../../../../api/tasks";
import { getInvitations, Invitation, acceptInvitation, declineInvitation } from "../../../../api/invitations";
import { getProjects, Project } from "../../../../api/projects";
import { getTeams, Team } from "../../../../api/teams";

interface MainMenuProps {
  onViewChange: (view: string) => void;
  activeView: string;
}

// Конфигурация меню для каждой роли
const roleMenuConfig = {
  admin: [
    { 
      id: "chats", 
      label: "Чаты", 
      icon: "💬",
      color: "bg-blue-500",
      hasNotifications: true
    },
    { 
      id: "applications", 
      label: "Заявки", 
      icon: "📋",
      color: "bg-orange-500",
      hasNotifications: false
    }
  ],
  pm: [
    { 
      id: "chats", 
      label: "Чаты", 
      icon: "💬",
      color: "bg-blue-500",
      hasNotifications: true
    },
    { 
      id: "invitations", 
      label: "Приглашения", 
      icon: "📨",
      color: "bg-purple-500",
      hasNotifications: true
    }
  ],
  executor: [
    { 
      id: "chats", 
      label: "Чаты", 
      icon: "💬",
      color: "bg-blue-500",
      hasNotifications: true
    },
    { 
      id: "invitations", 
      label: "Приглашения", 
      icon: "📨",
      color: "bg-purple-500",
      hasNotifications: true
    }
  ],
  customer: [
    { 
      id: "chats", 
      label: "Чаты", 
      icon: "💬",
      color: "bg-blue-500",
      hasNotifications: true
    }
  ]
};

export const MainMenu = ({ onViewChange, activeView }: MainMenuProps): JSX.Element => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Определяем роль пользователя для меню
  const getUserRole = () => {
    if (!user?.roles || user.roles.length === 0) return 'customer';
    
    // Приоритет ролей
    if (user.roles.includes('admin')) return 'admin';
    if (user.roles.includes('pm')) return 'pm';
    if (user.roles.includes('executor')) return 'executor';
    return 'customer';
  };

  const userRole = getUserRole();
  const menuItems = roleMenuConfig[userRole] || roleMenuConfig.customer;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const promises = [
        getTasks().catch(() => []),
        getInvitations().catch(() => []),
        getProjects().catch(() => []),
        getTeams().catch(() => [])
      ];

      const [tasksData, invitationsData, projectsData, teamsData] = await Promise.all(promises);
      
      setTasks(tasksData);
      setInvitations(invitationsData);
      setProjects(projectsData);
      setTeams(teamsData);
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      await acceptInvitation(invitationId);
      setNotification({ message: 'Приглашение принято!', type: 'success' });
      await loadData();
    } catch (error) {
      console.error('Error accepting invitation:', error);
      setNotification({ message: 'Ошибка при принятии приглашения', type: 'error' });
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      await declineInvitation(invitationId);
      setNotification({ message: 'Приглашение отклонено', type: 'success' });
      await loadData();
    } catch (error) {
      console.error('Error declining invitation:', error);
      setNotification({ message: 'Ошибка при отклонении приглашения', type: 'error' });
    }
  };

  // Автоматически скрываем уведомление через 3 секунды
  React.useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div>Загрузка...</div>
        </div>
      </div>
    );
  }

  const userName = user?.fullName || user?.displayName || 'Пользователь';
  const firstName = userName.split(' ')[0];
  const activeProjects = projects.filter(p => p.status !== 'completed').length;
  const teamCount = teams.length;
  const todayTasks = tasks.filter(task => {
    const today = new Date().toDateString();
    return new Date(task.dueDate).toDateString() === today;
  });
  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Уведомления */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Профиль пользователя */}
        <div className="bg-white rounded-2xl p-8 mb-6 shadow-sm">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-3xl shadow-lg">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-green-500 text-white text-sm font-bold px-2 py-1 rounded-full">
                8.8
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-red-100 text-red-800 text-sm px-3 py-1 rounded-full">Занят</span>
                <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">Доступен с 13 до 18</span>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Привет, {firstName} К.
              </h1>
              
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">{activeProjects}</div>
                  <div className="text-sm text-gray-600">Активные проекты</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">{teamCount}</div>
                  <div className="text-sm text-gray-600">Участник команд</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Левая колонка */}
          <div className="lg:col-span-2 space-y-6">
            {/* На сегодня */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">На сегодня:</h2>
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                  {todayTasks.length + 6}
                </span>
              </div>

              {/* Задачи */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Задачи:</h3>
                <div className="space-y-3">
                  {tasks.slice(0, 3).map((task, index) => (
                    <div key={task.id || index} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-blue-600 min-w-[50px]">
                        {new Date(task.dueDate).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-gray-800">{task.title}</span>
                    </div>
                  ))}
                  {tasks.length === 0 && (
                    <>
                      <div className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-blue-600 min-w-[50px]">10:17</span>
                        <span className="text-gray-800">Верстка диалогового окна и страницы поиска</span>
                      </div>
                      <div className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-blue-600 min-w-[50px]">12:35</span>
                        <span className="text-gray-800">Доработка ТЗ, указать время на проработку...</span>
                      </div>
                      <div className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-blue-600 min-w-[50px]">14:00</span>
                        <span className="text-gray-800">Дать обратную связь по функционалу сервису</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Конференции */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Конференции:</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-blue-600 min-w-[50px]">10:17</span>
                    <span className="text-gray-800">Обсуждение концепции</span>
                  </div>
                  <div className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-blue-600 min-w-[50px]">12:35</span>
                    <span className="text-gray-800">Планирование спринта</span>
                  </div>
                  <div className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-blue-600 min-w-[50px]">14:00</span>
                    <span className="text-gray-800">Стендап</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => onViewChange('tasks')}
                className="w-full mt-6 py-3 text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Весь список
              </button>
            </div>

            {/* Самое важное - только для исполнителей */}
            {userRole === 'executor' && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Самое важное</h2>
                  <span className="bg-red-100 text-red-800 text-sm font-medium px-3 py-1 rounded-full">7</span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 border border-red-200 rounded-lg bg-red-50">
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold">!</div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 mb-1">DasyTroon - производство подшипников</div>
                      <div className="text-sm text-gray-600">⏰ 12 часов 17 минут</div>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex items-start gap-4 p-4 border border-orange-200 rounded-lg bg-orange-50">
                    <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">!</div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 mb-1">Корпоративный мессенджер с телефонией</div>
                      <div className="text-sm text-gray-600">⏰ 12 часов 17 минут</div>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>

                <button 
                  onClick={() => onViewChange('important')}
                  className="w-full mt-6 py-3 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Смотреть все
                </button>
              </div>
            )}

            {/* Приглашения в команду */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Приглашения в команду</h2>
                <span className="bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1 rounded-full">
                  {pendingInvitations.length || 4}
                </span>
              </div>

              <div className="space-y-4">
                {pendingInvitations.length > 0 ? (
                  pendingInvitations.slice(0, 2).map((invitation, index) => (
                    <div key={invitation.id || index} className="border border-gray-200 rounded-lg p-4">
                      <div className="mb-3">
                        <span className="text-sm text-gray-600">Состав:</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Front-end</span>
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Back-end</span>
                        <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">UX/UI Дизайнер</span>
                        <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">Графический дизайнер</span>
                        <span className="bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded">Аналитик</span>
                      </div>
                      <div className="text-sm text-gray-600 mb-3">⏰ {Math.floor(Math.random() * 24)} часа {Math.floor(Math.random() * 60)} минут</div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">РП: {invitation.senderName || 'Елена В.'} ▼</span>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleAcceptInvitation(invitation.id)}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            Принять
                          </button>
                          <button 
                            onClick={() => handleDeclineInvitation(invitation.id)}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            Отклонить
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="mb-3">
                        <span className="text-sm text-gray-600">Состав:</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Front-end</span>
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Back-end</span>
                        <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">UX/UI Дизайнер</span>
                        <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">Графический дизайнер</span>
                        <span className="bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded">Аналитик</span>
                      </div>
                      <div className="text-sm text-gray-600 mb-3">⏰ 3 часа 27 минут</div>
                      <div className="text-sm text-gray-600">РП: Елена В. ▼</div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="mb-3">
                        <span className="text-sm text-gray-600">Состав:</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Front-end</span>
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Back-end</span>
                        <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">UX/UI Дизайнер</span>
                        <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">Графический дизайнер</span>
                        <span className="bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded">Аналитик</span>
                      </div>
                      <div className="text-sm text-gray-600 mb-3">⏰ 23 часа 59 минут</div>
                      <div className="text-sm text-gray-600">РП: Елена В. ▼</div>
                    </div>
                  </>
                )}
              </div>

              <button 
                onClick={() => onViewChange('invitations')}
                className="w-full mt-6 py-3 text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Смотреть все
              </button>
            </div>
          </div>

          {/* Правая колонка */}
          <div className="space-y-6">
            {/* События */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">События</h2>
                <div className="flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">12</span>
                  <select className="text-sm border border-gray-300 rounded px-2 py-1">
                    <option>Сегодня</option>
                    <option>Завтра</option>
                    <option>На неделе</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 min-w-[60px]">18:17</div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">Заказчик оставил комментарий по проекту Приложение кофейни</div>
                    <div className="text-xs text-gray-500 mt-1">Комментарии</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 min-w-[60px]">16:01</div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">Выполнен вывод средств</div>
                    <div className="text-xs text-gray-500 mt-1">Финансы</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 min-w-[60px]">15:42</div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">У вас осталось 3 дня до дедлайна</div>
                    <div className="text-xs text-gray-500 mt-1">Проекты</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 min-w-[60px]">14:33</div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">Проект был принят заказчиком</div>
                    <div className="text-xs text-gray-500 mt-1">Проекты</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 min-w-[60px]">13:58</div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">Проект вернули с правками</div>
                    <div className="text-xs text-gray-500 mt-1">Проекты</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 min-w-[60px]">12:16</div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">Дедлайн просрочен</div>
                    <div className="text-xs text-gray-500 mt-1">Проекты</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 min-w-[60px]">12:16</div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">До дедлайна осталось 2 дня</div>
                    <div className="text-xs text-gray-500 mt-1">Проекты</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Календарь событий */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Календарь событий</h2>
              <div className="bg-gray-100 rounded-lg p-8 text-center">
                <div className="text-4xl mb-4">📅</div>
                <div className="text-gray-600">Календарь будет здесь</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 