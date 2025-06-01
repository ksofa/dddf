import React from "react";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import { useAuth } from "../../../../hooks/useAuth";
import { useNotifications } from "../../../../hooks/useNotifications";

interface HeaderByAnimaProps {
  className?: string;
  onHomeClick?: () => void;
  onMobileMenuToggle?: () => void;
  onNotificationsClick?: () => void;
  onProfileClick?: () => void;
}

export const HeaderByAnima = ({ 
  className = "", 
  onHomeClick, 
  onMobileMenuToggle,
  onNotificationsClick,
  onProfileClick 
}: HeaderByAnimaProps): JSX.Element => {
  const { user } = useAuth();
  const { unreadCount, markAsRead } = useNotifications();

  // Получаем текущую дату и время
  const now = new Date();
  const dateInfo = {
    date: now.toLocaleDateString('ru-RU', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    }),
    time: now.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  };

  const handleNotificationClick = () => {
    // Помечаем все уведомления как прочитанные при клике
    if (unreadCount > 0) {
      markAsRead(undefined, true);
    }
    // Открываем страницу уведомлений
    if (onNotificationsClick) {
      onNotificationsClick();
    }
  };

  const handleProfileClick = () => {
    // Открываем профиль пользователя
    if (onProfileClick) {
      onProfileClick();
    }
  };

  const handleLogoClick = () => {
    if (onHomeClick) {
      onHomeClick();
    }
  };

  return (
    <header className={`w-full bg-white border-b border-gray-200 ${className}`}>
      {/* Компактная шапка */}
      <div className="flex items-center justify-between px-3 py-2">
        {/* Left section - Mobile menu + Logo */}
        <div className="flex items-center gap-2">
          {/* Mobile menu button */}
          {onMobileMenuToggle && (
            <button 
              className="sm:hidden p-1.5 hover:bg-gray-100 rounded-md transition-colors" 
              onClick={onMobileMenuToggle}
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          <button 
            onClick={handleLogoClick}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
          >
            {/* Logo icon - компактный */}
            <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">📋</span>
            </div>
            
            {/* Brand name - только на больших экранах */}
            <span className="hidden sm:block text-lg font-semibold text-blue-600">Taska</span>
          </button>
        </div>

        {/* Right section - компактный блок */}
        <div className="flex items-center gap-2">
          {/* Notification button */}
          <div className="relative">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full border-gray-200 hover:bg-gray-50 transition-colors"
              onClick={handleNotificationClick}
            >
              <span className="text-sm">🔔</span>
            </Button>

            {/* Notification badge */}
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 min-w-[16px] h-[16px] p-0 flex items-center justify-center bg-red-500 text-white text-xs rounded-full border-2 border-white animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </div>

          {/* User profile - компактный блок */}
          <button 
            onClick={handleProfileClick}
            className="flex items-center gap-1.5 hover:bg-gray-50 rounded-lg p-1.5 transition-colors cursor-pointer"
          >
            {/* User name - только на больших экранах */}
            <div className="hidden sm:flex flex-col items-end">
              <div className="text-xs font-medium text-gray-900 truncate max-w-[60px]">
                {user?.fullName?.split(' ')[0] || user?.displayName || 'User'}
              </div>
              <div className="text-xs text-gray-500">
                {user?.roles?.includes('admin') ? 'Admin' :
                 user?.roles?.includes('pm') ? 'PM' : 
                 user?.roles?.includes('executor') ? 'Exec' : 'User'}
              </div>
            </div>
            
            {/* User avatar - компактный */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold shadow-sm">
              <span className="text-sm">
                {(user?.fullName || user?.displayName || 'У').charAt(0).toUpperCase()}
              </span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
