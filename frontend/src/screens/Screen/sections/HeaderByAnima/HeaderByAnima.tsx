import React from "react";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import { useAuth } from "../../../../hooks/useAuth";
import { useNotifications } from "../../../../hooks/useNotifications";

interface HeaderByAnimaProps {
  className?: string;
}

export const HeaderByAnima = ({ className = "" }: HeaderByAnimaProps): JSX.Element => {
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
  };

  return (
    <header className={`flex items-center justify-between w-full px-4 sm:px-6 py-4 bg-white border-b border-[#ececec] ${className}`}>
      {/* Left section - Date and time */}
      <div className="flex flex-col items-start gap-1">
        <div className="flex items-center gap-2">
          <div className="text-neutralneutral-10 font-paragraph-16-medium text-[length:var(--paragraph-16-medium-font-size)] leading-[var(--paragraph-16-medium-line-height)]">
            {dateInfo.date}
          </div>
          <div className="text-neutralneutral-10 font-paragraph-16-medium text-[length:var(--paragraph-16-medium-font-size)] leading-[var(--paragraph-16-medium-line-height)]">
            {dateInfo.time}
          </div>
        </div>
      </div>

      {/* Middle section - Hidden breadcrumbs (opacity-0 in original) */}
      <div className="hidden lg:flex items-center opacity-0 gap-1">
        <div className="flex justify-center gap-2.5 rounded-sm items-center">
          <div className="text-neutralneutral-10 font-paragraph-16 text-[length:var(--paragraph-16-font-size)] leading-[var(--paragraph-16-line-height)]">
            Проекты
          </div>
        </div>
        <img className="w-5 h-5" alt="Chevron right" />
        <div className="font-paragraph-16-medium text-neutralneutral-10 text-[length:var(--paragraph-16-medium-font-size)] leading-[var(--paragraph-16-medium-line-height)]">
          Разработка личного кабинета МТС и сервиса
        </div>
        <img className="w-5 h-5" alt="Chevron right" />
        <div className="font-paragraph-16-medium text-neutralneutral-60 text-[length:var(--paragraph-16-medium-font-size)] leading-[var(--paragraph-16-medium-line-height)]">
          Команда
        </div>
      </div>

      {/* Right section - Controls and user info */}
      <div className="flex items-center gap-2">
        {/* Notification button */}
        <div className="relative">
          <Button
            variant="outline"
            size="icon"
            className="h-12 rounded-full border-[#dededf] hover:bg-gray-50 transition-colors"
            onClick={handleNotificationClick}
          >
            <img className="w-6 h-6" alt="Notifications" src="/frame-2.svg" onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-xl">🔔</span>';
            }} />
          </Button>

          {/* Notification badge */}
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 min-w-[20px] h-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs rounded-full border-[1.5px] border-solid border-white animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </div>

        {/* Settings button - скрываем на мобильных */}
        <Button
          variant="outline"
          size="icon"
          className="hidden sm:flex h-12 rounded-full border-[#dededf] hover:bg-gray-50 transition-colors"
        >
          <img className="w-6 h-6" alt="Settings" src="/frame-1.svg" onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
            (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-xl">⚙️</span>';
          }} />
        </Button>

        {/* User avatar and info */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <div className="text-neutralneutral-10 font-paragraph-16-medium text-[length:var(--paragraph-16-medium-font-size)] leading-[var(--paragraph-16-medium-line-height)]">
              {user?.fullName || user?.displayName || 'Пользователь'}
            </div>
            <div className="text-neutralneutral-60 font-paragraph-14 text-[length:var(--paragraph-14-font-size)] leading-[var(--paragraph-14-line-height)]">
              {user?.roles?.includes('pm') ? 'Руководитель проекта' : 
               user?.roles?.includes('executor') ? 'Исполнитель' :
               user?.roles?.includes('admin') ? 'Администратор' : 'Пользователь'}
            </div>
          </div>
          
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-lg shadow-lg">
            {(user?.fullName || user?.displayName || 'У').charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
};
