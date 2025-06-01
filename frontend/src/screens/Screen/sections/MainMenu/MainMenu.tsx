import React from "react";
import { Badge } from "../../../../components/ui/badge";
import { useAuth } from "../../../../hooks/useAuth";
import { useNotifications } from "../../../../hooks/useNotifications";

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

  return (
    <div className="flex flex-col items-center gap-8 p-8 bg-white min-h-screen">
      {/* Приветствие */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg mb-4 mx-auto">
          {(user?.fullName || user?.displayName || 'У').charAt(0).toUpperCase()}
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Привет, {user?.fullName?.split(' ')[0] || user?.displayName || 'Пользователь'}!
        </h1>
        <p className="text-gray-600">
          {userRole === 'admin' && 'Администратор системы'}
          {userRole === 'pm' && 'Руководитель проекта'}
          {userRole === 'executor' && 'Исполнитель'}
          {userRole === 'customer' && 'Заказчик'}
        </p>
      </div>

      {/* Меню действий */}
      <div className="w-full max-w-md">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">Быстрые действия</h2>
        <div className="grid grid-cols-1 gap-3">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`relative flex items-center justify-between p-4 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg ${
                activeView === item.id 
                  ? `${item.color} text-white shadow-lg` 
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </div>

              {/* Уведомления */}
              {item.hasNotifications && unreadCount > 0 && (
                <Badge className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}

              {/* Стрелка */}
              <svg 
                className="w-5 h-5 opacity-70" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* Дополнительные разделы */}
      <div className="w-full max-w-md mt-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">Дополнительно</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onViewChange('projects')}
            className="flex flex-col items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-105"
          >
            <span className="text-2xl mb-2">📁</span>
            <span className="text-sm font-medium text-gray-700">Проекты</span>
          </button>
          
          <button
            onClick={() => onViewChange('teams')}
            className="flex flex-col items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-105"
          >
            <span className="text-2xl mb-2">👥</span>
            <span className="text-sm font-medium text-gray-700">Команды</span>
          </button>
        </div>
      </div>

      {/* Календарь событий */}
      <div className="w-full max-w-md mt-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">На сегодня</h2>
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-800">Верстка диалогового окна</div>
                <div className="text-xs text-gray-600">10:17</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-800">Доработка T3, указать время</div>
                <div className="text-xs text-gray-600">12:35</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-800">Дать обратную связь</div>
                <div className="text-xs text-gray-600">14:00</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Конференции */}
      <div className="w-full max-w-md mt-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">Конференции</h2>
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-800">Обсуждение концепции</div>
                <div className="text-xs text-gray-600">10:17</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-800">Планирование спринта</div>
                <div className="text-xs text-gray-600">12:35</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-800">Стендап</div>
                <div className="text-xs text-gray-600">14:00</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 