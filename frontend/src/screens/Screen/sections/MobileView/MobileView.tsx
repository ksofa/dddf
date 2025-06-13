import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../hooks/useAuth";
import { getTasks, Task } from "../../../../api/tasks";
import { getInvitations, Invitation, acceptInvitation, declineInvitation } from "../../../../api/invitations";
import { getProjects, Project } from "../../../../api/projects";
import { getTeams, Team } from "../../../../api/teams";

interface MobileViewProps {
  onViewChange?: (view: string) => void;
}

// Конфигурация меню для каждой роли
const menuItems = {
  admin: [
    { id: 'dashboard', title: 'Главная', icon: '🏠' },
    { id: 'applications', title: 'Заявки', icon: '📋' },
    { id: 'projects', title: 'Проекты', icon: '🏗️' },
    { id: 'users', title: 'Пользователи', icon: '👥' },
    { id: 'analytics', title: 'Аналитика', icon: '📊' },
    { id: 'chats', title: 'Чаты', icon: '💬' },
    { id: 'notifications', title: 'Уведомления', icon: '🔔' },
    { id: 'profile', title: 'Профиль', icon: '👤' }
  ],
  pm: [
    { id: 'dashboard', title: 'Главная', icon: '🏠' },
    { id: 'tasks', title: 'Задачи', icon: '✅' },
    { id: 'projects', title: 'Мои проекты', icon: '🏗️' },
    { id: 'teams', title: 'Команды', icon: '👥' },
    { id: 'invitations', title: 'Приглашения', icon: '📨' },
    { id: 'chats', title: 'Чаты', icon: '💬' },
    { id: 'notifications', title: 'Уведомления', icon: '🔔' },
    { id: 'profile', title: 'Профиль', icon: '👤' }
  ],
  executor: [
    { id: 'dashboard', title: 'Главная', icon: '🏠' },
    { id: 'tasks', title: 'Задачи', icon: '✅' },
    { id: 'important', title: 'Самое важное', icon: '⭐' },
    { id: 'events', title: 'События', icon: '📅' },
    { id: 'invitations', title: 'Приглашения', icon: '📨' },
    { id: 'chats', title: 'Чаты', icon: '💬' },
    { id: 'notifications', title: 'Уведомления', icon: '🔔' },
    { id: 'profile', title: 'Профиль', icon: '👤' }
  ],
  customer: [
    { id: 'dashboard', title: 'Главная', icon: '🏠' },
    { id: 'projects', title: 'Мои проекты', icon: '🏗️' },
    { id: 'progress', title: 'Прогресс', icon: '📈' },
    { id: 'chats', title: 'Чаты с командой', icon: '💬' },
    { id: 'payments', title: 'Финансы', icon: '💳' },
    { id: 'profile', title: 'Профиль', icon: '👤' }
  ]
};

// Компонент мобильного меню
const MobileMenu: React.FC<{ isOpen: boolean; onClose: () => void; onNavigate: (view: string) => void; onLogout: () => void; userRole: string; userName: string }> = ({ 
  isOpen, 
  onClose, 
  onNavigate,
  onLogout,
  userRole,
  userName
}) => {
  if (!isOpen) return null;

  const currentMenuItems = menuItems[userRole] || menuItems.customer;

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin': return 'Администратор';
      case 'pm': return 'Руководитель проекта';
      case 'executor': return 'Исполнитель';
      case 'customer': return 'Заказчик';
      default: return 'Пользователь';
    }
  };

  return (
    <>
      <div className="mobile-sidebar-overlay open" onClick={onClose}></div>
      <div className="mobile-sidebar open">
        <div className="mobile-sidebar-header">
          <div className="mobile-sidebar-user">
            <div className="mobile-sidebar-avatar">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="mobile-sidebar-user-info">
              <div className="mobile-sidebar-user-name">{userName}</div>
              <div className="mobile-sidebar-user-role">{getRoleName(userRole)}</div>
            </div>
          </div>
          <button className="mobile-sidebar-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="mobile-sidebar-content">
          {currentMenuItems.map((item) => (
            <div 
              key={item.id}
              className={`mobile-sidebar-item ${item.id === 'dashboard' ? 'active' : ''}`} 
              onClick={() => { onNavigate(item.id); onClose(); }}
            >
              <span className="mobile-sidebar-item-icon">{item.icon}</span>
              <span>{item.title}</span>
            </div>
          ))}
          <div className="mobile-sidebar-divider"></div>
          <div className="mobile-sidebar-item" onClick={() => { onLogout(); onClose(); }}>
            <span className="mobile-sidebar-item-icon">🚪</span>
            <span>Выход</span>
          </div>
        </div>
      </div>
    </>
  );
};

// Конфигурация секций для каждой роли
const roleSectionsConfig = {
  admin: [
    { id: 'applications', title: 'Заявки', icon: '📋', priority: 1 },
    { id: 'projects', title: 'Проекты', icon: '🏗️', priority: 2 },
    { id: 'users', title: 'Пользователи', icon: '👥', priority: 3 },
    { id: 'analytics', title: 'Аналитика', icon: '📊', priority: 4 }
  ],
  pm: [
    { id: 'tasks', title: 'Задачи', icon: '✅', priority: 1 },
    { id: 'projects', title: 'Мои проекты', icon: '🏗️', priority: 2 },
    { id: 'teams', title: 'Команды', icon: '👥', priority: 3 },
    { id: 'invitations', title: 'Приглашения в команду', icon: '📨', priority: 4 }
  ],
  executor: [
    { id: 'tasks', title: 'Задачи', icon: '✅', priority: 1 },
    { id: 'important', title: 'Самое важное', icon: '⭐', priority: 2 },
    { id: 'events', title: 'События', icon: '📅', priority: 3 },
    { id: 'invitations', title: 'Приглашения в команду', icon: '📨', priority: 4 }
  ],
  customer: [
    { id: 'projects', title: 'Мои проекты', icon: '🏗️', priority: 1 },
    { id: 'progress', title: 'Прогресс', icon: '📈', priority: 2 },
    { id: 'chats', title: 'Чаты с командой', icon: '💬', priority: 3 },
    { id: 'payments', title: 'Финансы', icon: '💳', priority: 4 }
  ]
};

export const MobileView: React.FC<MobileViewProps> = ({ onViewChange }) => {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Определяем роль пользователя
  const getUserRole = () => {
    if (!user?.roles || user.roles.length === 0) return 'customer';
    if (user.roles.includes('admin')) return 'admin';
    if (user.roles.includes('pm')) return 'pm';
    if (user.roles.includes('executor')) return 'executor';
    return 'customer';
  };

  const userRole = getUserRole();
  const sections = roleSectionsConfig[userRole] || roleSectionsConfig.customer;

  // Отладочная информация
  console.log('🔍 Debug info:', {
    user: user,
    userRoles: user?.roles,
    detectedRole: userRole,
    availableSections: sections,
    menuItems: menuItems[userRole] || menuItems.customer
  });

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString('ru-RU', { month: 'short' })
    };
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'status-todo';
      case 'in_progress': return 'status-in-progress';
      case 'review': return 'status-review';
      case 'done': return 'status-done';
      default: return 'status-todo';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'todo': return 'К выполнению';
      case 'in_progress': return 'В работе';
      case 'review': return 'На проверке';
      case 'done': return 'Выполнено';
      default: return status;
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin': return 'Администратор';
      case 'pm': return 'Руководитель проекта';
      case 'executor': return 'Исполнитель';
      case 'customer': return 'Заказчик';
      default: return 'Пользователь';
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      if (onViewChange) {
        onViewChange('login');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleViewAllTasks = () => {
    if (onViewChange) {
      onViewChange('tasks');
    }
  };

  const handleViewAllInvitations = () => {
    if (onViewChange) {
      onViewChange('invitations');
    }
  };

  const handleNavigate = (view: string) => {
    if (onViewChange) {
      onViewChange(view);
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      await acceptInvitation(invitationId);
      setNotification({ message: 'Приглашение принято!', type: 'success' });
      // Перезагружаем данные после принятия приглашения
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
      // Перезагружаем данные после отклонения приглашения
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
      <div className="mobile-dashboard-container">
        <div className="mobile-loading">
          <div className="mobile-spinner"></div>
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
    <div className="mobile-dashboard-container">
      {/* Уведомления */}
      {notification && (
        <div className={`mobile-notification ${notification.type}`}>
          <div style={{ fontWeight: '500' }}>{notification.message}</div>
        </div>
      )}

      {/* Мобильное меню */}
      <MobileMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        userRole={userRole}
        userName={userName}
      />

      {/* Верхний заголовок */}
      <div className="mobile-top-header">
        <div className="mobile-user-info">
          <div className="mobile-user-avatar-small">👤</div>
          <span className="mobile-user-name">{firstName}</span>
          <svg className="mobile-chevron" width="6" height="10" viewBox="0 0 6 10" fill="none">
            <path d="M1 1L5 5L1 9" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="mobile-header-actions">
          <div className="mobile-notification-icon" onClick={() => handleNavigate('notifications')}>🔔</div>
          <div className="mobile-menu-icon" onClick={() => setIsMenuOpen(true)}>☰</div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="mobile-main-content">
        {/* Профиль с аватаром и рейтингом */}
        <div className="mobile-profile-section">
          <div className="mobile-profile-avatar">
            <div className="mobile-avatar-image">
              {(user?.fullName || user?.displayName || 'У').charAt(0).toUpperCase()}
            </div>
            <div className="mobile-rating-badge">8.8</div>
          </div>
          
          <div className="mobile-status-badges">
            <span className="mobile-status-busy">Занят</span>
            <span className="mobile-status-available">Доступен с 13 до 18</span>
          </div>
          
          <h1 className="mobile-greeting">Привет, {firstName} К.</h1>
          
          <div className="mobile-stats">
            <div className="mobile-stat-item">
              <div className="mobile-stat-number">{activeProjects}</div>
              <div className="mobile-stat-label">Активные проекты</div>
            </div>
            <div className="mobile-stat-item">
              <div className="mobile-stat-number">{teamCount}</div>
              <div className="mobile-stat-label">Участник команд</div>
            </div>
          </div>
        </div>

        {/* Секция "На сегодня" */}
        <div className="mobile-today-section">
          <div className="mobile-section-header-new">
            <h2 className="mobile-section-title-new">На сегодня</h2>
            <span className="mobile-section-count-new">{todayTasks.length + 3}</span>
          </div>

          {/* Задачи */}
          <div className="mobile-tasks-group">
            <h3 className="mobile-group-title">Задачи:</h3>
            <div className="mobile-task-list">
              {tasks.slice(0, 6).map((task, index) => (
                <div key={task.id || index} className="mobile-task-item-new">
                  <span className="mobile-task-time">{new Date(task.dueDate).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="mobile-task-text">{task.title}</span>
                </div>
              ))}
              {tasks.length === 0 && (
                <>
                  <div className="mobile-task-item-new">
                    <span className="mobile-task-time">10:17</span>
                    <span className="mobile-task-text">Верстка диалогового окна и ст...</span>
                  </div>
                  <div className="mobile-task-item-new">
                    <span className="mobile-task-time">12:35</span>
                    <span className="mobile-task-text">Доработка ТЗ, указать время н...</span>
                  </div>
                  <div className="mobile-task-item-new">
                    <span className="mobile-task-time">14:00</span>
                    <span className="mobile-task-text">Дать обратную связь по функц...</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Конференции */}
          <div className="mobile-conferences-group">
            <h3 className="mobile-group-title">Конференции:</h3>
            <div className="mobile-task-list">
              <div className="mobile-task-item-new">
                <span className="mobile-task-time">10:17</span>
                <span className="mobile-task-text">Обсуждение концепции</span>
              </div>
              <div className="mobile-task-item-new">
                <span className="mobile-task-time">12:35</span>
                <span className="mobile-task-text">Планирование спринта</span>
              </div>
              <div className="mobile-task-item-new">
                <span className="mobile-task-time">14:00</span>
                <span className="mobile-task-text">Стендап</span>
              </div>
            </div>
          </div>

          <button className="mobile-view-all-button" onClick={handleViewAllTasks}>
            Весь список
          </button>
        </div>

        {/* Секция "Приглашения в команду" */}
        <div className="mobile-invitations-section">
          <div className="mobile-section-header-new">
            <h2 className="mobile-section-title-new">Приглашения в команду</h2>
            <span className="mobile-section-count-new">{pendingInvitations.length}</span>
          </div>

          {pendingInvitations.length > 0 ? (
            pendingInvitations.slice(0, 2).map((invitation, index) => (
              <div key={invitation.id || index} className="mobile-invitation-card-new">
                <div className="mobile-invitation-header-new">
                  <span className="mobile-invitation-label">Состав:</span>
                </div>
                <div className="mobile-invitation-roles">
                  <span className="mobile-role-tag">Front-end</span>
                  <span className="mobile-role-tag">Back-end</span>
                  <span className="mobile-role-tag">UX/UI Дизайнер</span>
                  <span className="mobile-role-tag">Графический дизайнер</span>
                  <span className="mobile-role-tag">Аналитик</span>
                </div>
                <div className="mobile-invitation-time">⏰ {Math.floor(Math.random() * 24)} часа {Math.floor(Math.random() * 60)} минут</div>
                <div className="mobile-invitation-sender">РП: {invitation.senderName || 'Елена В.'} ▼</div>
                <div className="mobile-invitation-actions-new">
                  <button 
                    className="mobile-btn-accept-new" 
                    onClick={() => handleAcceptInvitation(invitation.id)}
                  >
                    Принять
                  </button>
                  <button 
                    className="mobile-btn-decline-new" 
                    onClick={() => handleDeclineInvitation(invitation.id)}
                  >
                    Отклонить
                  </button>
                </div>
              </div>
            ))
          ) : (
            <>
              <div className="mobile-invitation-card-new">
                <div className="mobile-invitation-header-new">
                  <span className="mobile-invitation-label">Состав:</span>
                </div>
                <div className="mobile-invitation-roles">
                  <span className="mobile-role-tag">Front-end</span>
                  <span className="mobile-role-tag">Back-end</span>
                  <span className="mobile-role-tag">UX/UI Дизайнер</span>
                  <span className="mobile-role-tag">Графический дизайнер</span>
                  <span className="mobile-role-tag">Аналитик</span>
                </div>
                <div className="mobile-invitation-time">⏰ 3 часа 27 минут</div>
                <div className="mobile-invitation-sender">РП: Елена В. ▼</div>
              </div>

              <div className="mobile-invitation-card-new">
                <div className="mobile-invitation-header-new">
                  <span className="mobile-invitation-label">Состав:</span>
                </div>
                <div className="mobile-invitation-roles">
                  <span className="mobile-role-tag">Front-end</span>
                  <span className="mobile-role-tag">Back-end</span>
                  <span className="mobile-role-tag">UX/UI Дизайнер</span>
                  <span className="mobile-role-tag">Графический дизайнер</span>
                  <span className="mobile-role-tag">Аналитик</span>
                </div>
                <div className="mobile-invitation-time">⏰ 23 часа 59 минут</div>
                <div className="mobile-invitation-sender">РП: Елена В. ▼</div>
              </div>
            </>
          )}

          <button className="mobile-view-all-button" onClick={handleViewAllInvitations}>
            Смотреть все
          </button>
        </div>

        {/* Секция "Самое важное" - только для исполнителей */}
        {userRole === 'executor' && (
          <div className="mobile-important-section">
            <div className="mobile-section-header-new">
              <h2 className="mobile-section-title-new">Самое важное</h2>
              <span className="mobile-section-count-new">3</span>
            </div>

            <div className="mobile-important-list">
              <div className="mobile-important-item">
                <div className="mobile-important-priority high">!</div>
                <div className="mobile-important-content">
                  <div className="mobile-important-title">Критическая ошибка в API</div>
                  <div className="mobile-important-meta">
                    <span className="mobile-important-project">Проект Alpha</span>
                    <span className="mobile-important-deadline">До 18:00</span>
                  </div>
                </div>
              </div>

              <div className="mobile-important-item">
                <div className="mobile-important-priority medium">!</div>
                <div className="mobile-important-content">
                  <div className="mobile-important-title">Ревью кода перед релизом</div>
                  <div className="mobile-important-meta">
                    <span className="mobile-important-project">Проект Beta</span>
                    <span className="mobile-important-deadline">Завтра</span>
                  </div>
                </div>
              </div>

              <div className="mobile-important-item">
                <div className="mobile-important-priority low">!</div>
                <div className="mobile-important-content">
                  <div className="mobile-important-title">Обновить документацию</div>
                  <div className="mobile-important-meta">
                    <span className="mobile-important-project">Проект Gamma</span>
                    <span className="mobile-important-deadline">На неделе</span>
                  </div>
                </div>
              </div>
            </div>

            <button className="mobile-view-all-button" onClick={() => handleNavigate('important')}>
              Смотреть все
            </button>
          </div>
        )}

        {/* Секция "События" - только для исполнителей */}
        {userRole === 'executor' && (
          <div className="mobile-events-section">
            <div className="mobile-section-header-new">
              <h2 className="mobile-section-title-new">События</h2>
              <span className="mobile-section-count-new">5</span>
            </div>

            <div className="mobile-events-list">
              <div className="mobile-event-item-new">
                <div className="mobile-event-time-new">10:00</div>
                <div className="mobile-event-content">
                  <div className="mobile-event-title-new">Стендап команды</div>
                  <div className="mobile-event-location">Zoom</div>
                </div>
                <div className="mobile-event-status upcoming">Скоро</div>
              </div>

              <div className="mobile-event-item-new">
                <div className="mobile-event-time-new">14:30</div>
                <div className="mobile-event-content">
                  <div className="mobile-event-title-new">Демо для клиента</div>
                  <div className="mobile-event-location">Конференц-зал</div>
                </div>
                <div className="mobile-event-status scheduled">Запланировано</div>
              </div>

              <div className="mobile-event-item-new">
                <div className="mobile-event-time-new">16:00</div>
                <div className="mobile-event-content">
                  <div className="mobile-event-title-new">Ретроспектива спринта</div>
                  <div className="mobile-event-location">Zoom</div>
                </div>
                <div className="mobile-event-status scheduled">Запланировано</div>
              </div>
            </div>

            <button className="mobile-view-all-button" onClick={() => handleNavigate('events')}>
              Смотреть все
            </button>
          </div>
        )}

        {/* Секция "Заявки" - только для админов */}
        {userRole === 'admin' && (
          <div className="mobile-applications-section">
            <div className="mobile-section-header-new">
              <h2 className="mobile-section-title-new">Новые заявки</h2>
              <span className="mobile-section-count-new">4</span>
            </div>

            <div className="mobile-applications-list">
              <div className="mobile-application-item">
                <div className="mobile-application-status new">Новая</div>
                <div className="mobile-application-content">
                  <div className="mobile-application-title">Разработка интернет-магазина</div>
                  <div className="mobile-application-meta">
                    <span className="mobile-application-client">ООО "Торговый дом"</span>
                    <span className="mobile-application-budget">от 500 000 ₽</span>
                  </div>
                </div>
              </div>

              <div className="mobile-application-item">
                <div className="mobile-application-status review">На рассмотрении</div>
                <div className="mobile-application-content">
                  <div className="mobile-application-title">Мобильное приложение для доставки</div>
                  <div className="mobile-application-meta">
                    <span className="mobile-application-client">ИП Иванов</span>
                    <span className="mobile-application-budget">от 300 000 ₽</span>
                  </div>
                </div>
              </div>

              <div className="mobile-application-item">
                <div className="mobile-application-status urgent">Срочно</div>
                <div className="mobile-application-content">
                  <div className="mobile-application-title">Доработка CRM системы</div>
                  <div className="mobile-application-meta">
                    <span className="mobile-application-client">ООО "Бизнес Решения"</span>
                    <span className="mobile-application-budget">от 150 000 ₽</span>
                  </div>
                </div>
              </div>
            </div>

            <button className="mobile-view-all-button" onClick={() => handleNavigate('applications')}>
              Смотреть все
            </button>
          </div>
        )}

        {/* Секция "Мои проекты" - для PM и заказчиков */}
        {(userRole === 'pm' || userRole === 'customer') && (
          <div className="mobile-projects-section">
            <div className="mobile-section-header-new">
              <h2 className="mobile-section-title-new">Мои проекты</h2>
              <span className="mobile-section-count-new">{activeProjects}</span>
            </div>

            <div className="mobile-projects-list">
              {projects.slice(0, 3).map((project, index) => (
                <div key={project.id || index} className="mobile-project-item">
                  <div className="mobile-project-status active">Активный</div>
                  <div className="mobile-project-content">
                    <div className="mobile-project-title">{project.name || `Проект ${index + 1}`}</div>
                    <div className="mobile-project-meta">
                      <span className="mobile-project-progress">Прогресс: {Math.floor(Math.random() * 100)}%</span>
                      <span className="mobile-project-deadline">До {new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ru-RU')}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {projects.length === 0 && (
                <>
                  <div className="mobile-project-item">
                    <div className="mobile-project-status active">Активный</div>
                    <div className="mobile-project-content">
                      <div className="mobile-project-title">Интернет-магазин "Модный стиль"</div>
                      <div className="mobile-project-meta">
                        <span className="mobile-project-progress">Прогресс: 75%</span>
                        <span className="mobile-project-deadline">До 15.02.2024</span>
                      </div>
                    </div>
                  </div>

                  <div className="mobile-project-item">
                    <div className="mobile-project-status planning">Планирование</div>
                    <div className="mobile-project-content">
                      <div className="mobile-project-title">CRM система для автосалона</div>
                      <div className="mobile-project-meta">
                        <span className="mobile-project-progress">Прогресс: 15%</span>
                        <span className="mobile-project-deadline">До 28.02.2024</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button className="mobile-view-all-button" onClick={() => handleNavigate('projects')}>
              Смотреть все
            </button>
          </div>
        )}

        {/* Секция "Финансы" - только для заказчиков */}
        {userRole === 'customer' && (
          <div className="mobile-finances-section">
            <div className="mobile-section-header-new">
              <h2 className="mobile-section-title-new">Финансы</h2>
              <span className="mobile-section-count-new">2</span>
            </div>

            <div className="mobile-finances-summary">
              <div className="mobile-finance-card">
                <div className="mobile-finance-label">Общий бюджет</div>
                <div className="mobile-finance-amount total">850 000 ₽</div>
              </div>
              <div className="mobile-finance-card">
                <div className="mobile-finance-label">Потрачено</div>
                <div className="mobile-finance-amount spent">425 000 ₽</div>
              </div>
              <div className="mobile-finance-card">
                <div className="mobile-finance-label">Остаток</div>
                <div className="mobile-finance-amount remaining">425 000 ₽</div>
              </div>
            </div>

            <div className="mobile-payments-list">
              <div className="mobile-payment-item">
                <div className="mobile-payment-status paid">Оплачено</div>
                <div className="mobile-payment-content">
                  <div className="mobile-payment-title">Этап 1: Дизайн и прототипирование</div>
                  <div className="mobile-payment-amount">150 000 ₽</div>
                </div>
              </div>

              <div className="mobile-payment-item">
                <div className="mobile-payment-status pending">Ожидает оплаты</div>
                <div className="mobile-payment-content">
                  <div className="mobile-payment-title">Этап 2: Разработка MVP</div>
                  <div className="mobile-payment-amount">275 000 ₽</div>
                </div>
              </div>
            </div>

            <button className="mobile-view-all-button" onClick={() => handleNavigate('payments')}>
              Смотреть все
            </button>
          </div>
        )}
      </div>

      {/* Нижняя навигация */}
      <div className="mobile-bottom-navigation">
        <div 
          className={`mobile-nav-item ${userRole === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleNavigate('dashboard')}
        >
          <div className="mobile-nav-icon">🏠</div>
          <div className="mobile-nav-label">Главная</div>
        </div>

        {userRole === 'admin' && (
          <div 
            className="mobile-nav-item"
            onClick={() => handleNavigate('applications')}
          >
            <div className="mobile-nav-icon">📋</div>
            <div className="mobile-nav-label">Заявки</div>
          </div>
        )}

        {(userRole === 'pm' || userRole === 'executor') && (
          <div 
            className="mobile-nav-item"
            onClick={() => handleNavigate('tasks')}
          >
            <div className="mobile-nav-icon">✅</div>
            <div className="mobile-nav-label">Задачи</div>
          </div>
        )}

        {(userRole === 'pm' || userRole === 'customer' || userRole === 'admin') && (
          <div 
            className="mobile-nav-item"
            onClick={() => handleNavigate('projects')}
          >
            <div className="mobile-nav-icon">🏗️</div>
            <div className="mobile-nav-label">Проекты</div>
          </div>
        )}

        <div 
          className="mobile-nav-item"
          onClick={() => handleNavigate('chats')}
        >
          <div className="mobile-nav-icon">💬</div>
          <div className="mobile-nav-label">Чаты</div>
        </div>

        <div 
          className="mobile-nav-item"
          onClick={() => handleNavigate('profile')}
        >
          <div className="mobile-nav-icon">👤</div>
          <div className="mobile-nav-label">Профиль</div>
        </div>
      </div>
    </div>
  );
}; 