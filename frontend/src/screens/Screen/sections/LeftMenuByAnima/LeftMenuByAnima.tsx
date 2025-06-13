import React from "react";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { logoutUser } from "../../../../api/auth";
import { useAuth } from "../../../../hooks/useAuth";
import { useNotifications } from "../../../../hooks/useNotifications";

interface LeftMenuByAnimaProps {
  onViewChange: (view: string) => void;
  activeView: string;
  onLogout?: () => void;
}

const menuItems = [
  { 
    id: "projects", 
    icon: "/project.svg", 
    label: "Проекты", 
    alt: "Projects", 
    roles: ["pm", "executor", "admin"],
    fallbackIcon: "📁"
  },
  { 
    id: "teams", 
    icon: "/team.svg", 
    label: "Команды", 
    alt: "Team", 
    roles: ["pm", "executor", "admin"],
    fallbackIcon: "👥"
  },
  {
    id: "chats",
    icon: "/chat.svg",
    label: "Чаты",
    alt: "Chat",
    hasNotification: true,
    roles: ["pm", "executor", "admin"],
    fallbackIcon: "💬"
  },
  { 
    id: "invitations", 
    icon: "/applications.svg", 
    label: "Приглашения", 
    alt: "Invitations",
    roles: ["pm", "executor"],
    fallbackIcon: "📨"
  },
  { 
    id: "applications", 
    icon: "/applications.svg", 
    label: "Заявки", 
    alt: "Applications", 
    roles: ["admin"],
    fallbackIcon: "📋"
  }
];

// Компонент для иконки с fallback
const MenuIcon = ({ item, isActive }: { item: any; isActive: boolean }) => {
  const [imageError, setImageError] = React.useState(false);

  if (imageError) {
    return (
      <span className={`text-xl ${isActive ? "filter brightness-0 invert" : ""}`}>
        {item.fallbackIcon}
      </span>
    );
  }

  return (
    <img 
      className={`w-6 h-6 ${isActive ? "filter brightness-0 invert" : ""}`} 
      alt={item.alt} 
      src={item.icon}
      onError={() => setImageError(true)}
      onLoad={() => setImageError(false)}
    />
  );
};

export const LeftMenuByAnima = ({ onViewChange, activeView, onLogout }: LeftMenuByAnimaProps): JSX.Element => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  
  const handleLogout = () => {
    logoutUser();
    if (onLogout) {
      onLogout();
    }
  };

  // Фильтруем пункты меню по ролям пользователя
  const filteredMenuItems = menuItems.filter(item => {
    if (!item.roles) return true; // Показываем всем, если роли не указаны
    return item.roles.some(role => user?.roles?.includes(role));
  });

  return (
    <nav className="flex flex-col h-full items-center justify-between p-6 bg-neutralneutral-100 border-r border-[#ececec] min-w-[120px]">
      <div className="flex flex-col items-center gap-6 w-full">
        {filteredMenuItems.map((item) => (
          <div 
            key={item.id} 
            className="flex flex-col items-center gap-2 cursor-pointer transition-transform hover:scale-105 w-full"
            onClick={() => onViewChange(item.id)}
          >
            <div className="relative">
              <Button
                variant={activeView === item.id ? "default" : "outline"}
                size="icon"
                className={`w-12 h-12 rounded-[100px] transition-all duration-200 ${
                  activeView === item.id 
                    ? "bg-main-colorsaqua border-main-colorsaqua shadow-lg" 
                    : "border border-solid border-[#dededf] bg-neutralneutral-100 hover:bg-gray-50"
                } p-0`}
              >
                <MenuIcon item={item} isActive={activeView === item.id} />
              </Button>

              {/* Показываем уведомления для чатов и приглашений */}
              {((item.id === "chats" && unreadCount > 0) || 
                (item.id === "invitations" && unreadCount > 0)) && (
                <Badge className="absolute -top-1 -right-1 min-w-[20px] h-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs rounded-full border-[1.5px] border-solid border-[#f4f4f4] animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </div>

            <span className={`font-left-menu font-[number:var(--left-menu-font-weight)] text-center transition-colors duration-200 text-xs max-w-[80px] leading-tight ${
              activeView === item.id ? "text-main-colorsaqua font-semibold" : "text-neutralneutral-10 hover:text-main-colorsaqua"
            }`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-2 mt-auto">
        <Button
          variant="outline"
          size="icon"
          className="w-12 h-12 rounded-[100px] border border-solid border-[#dededf] bg-neutralneutral-100 hover:bg-red-50 hover:border-red-300 transition-all duration-200 p-0"
          onClick={handleLogout}
        >
          <img className="w-6 h-6" alt="Logout" src="/frame.svg" onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
            (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-xl">🚪</span>';
          }} />
        </Button>

        <span className="font-left-menu font-[number:var(--left-menu-font-weight)] text-neutralneutral-20 hover:text-red-500 transition-colors duration-200 text-xs text-center max-w-[80px] leading-tight">
          Выйти
        </span>
      </div>
    </nav>
  );
};