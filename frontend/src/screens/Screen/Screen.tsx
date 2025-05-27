import React, { useState, useEffect } from "react";
import { FrameByAnima } from "./sections/FrameByAnima/FrameByAnima";
import { HeaderByAnima } from "./sections/HeaderByAnima";
import { LeftMenuByAnima } from "./sections/LeftMenuByAnima";
import { ProjectsView } from "./sections/ProjectsView";
import { TeamsView } from "./sections/TeamsView";
import { ChatsView } from "./sections/ChatsView";
import { ApplicationsView } from "./sections/ApplicationsView";
import { UniversalInvitationsScreen } from "../Invitations/UniversalInvitationsScreen";
import { StartScreen } from "./StartScreen";
import { LoginScreen } from "./LoginScreen";
import { RegisterScreen } from "./RegisterScreen";
import { CreateProjectScreen } from "./CreateProjectScreen";
import TeamMemberSearch from "./sections/TeamsView/TeamMemberSearch";
import { isAuthenticated } from "../../api/auth";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";

// Типы экранов
const SCREENS = {
  START: "start",
  LOGIN: "login",
  REGISTER: "register",
  CREATE_PROJECT: "createProject",
  DASHBOARD: "dashboard",
  TEAM_MEMBER_SEARCH: "teamMemberSearch",
} as const;
type ScreenType = keyof typeof SCREENS;

export const Screen = (): JSX.Element => {
  console.log('Screen component rendering...');
  
  const [activeView, setActiveView] = React.useState("dashboard");
  const [currentScreen, setCurrentScreen] = React.useState<ScreenType>("START");
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedTeamId, setSelectedTeamId] = React.useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);

  console.log('Current screen:', currentScreen);
  console.log('Active view:', activeView);

  // Проверяем авторизацию при загрузке
  React.useEffect(() => {
    console.log('Checking authentication...');
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      console.log('Is authenticated:', authenticated);
      if (authenticated) {
        console.log('User is authenticated, setting screen to DASHBOARD');
        setCurrentScreen("DASHBOARD");
      } else {
        console.log('User is not authenticated, staying on START screen');
        setCurrentScreen("START");
      }
      setIsLoading(false);
    };
    
    checkAuth();
    
    // Слушаем изменения в localStorage
    const handleStorageChange = () => {
      console.log('Storage changed, rechecking authentication...');
      checkAuth();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleStartSelect = (action: "login" | "register" | "createProject") => {
    if (action === "login") setCurrentScreen("LOGIN");
    else if (action === "register") setCurrentScreen("REGISTER");
    else if (action === "createProject") setCurrentScreen("CREATE_PROJECT");
  };

  // Обработчики возврата и перехода
  const handleBackToStart = () => setCurrentScreen("START");
  const handleGoToRegister = () => setCurrentScreen("REGISTER");
  const handleGoToLogin = () => setCurrentScreen("LOGIN");
  const handleProjectSuccess = () => alert("Проект отправлен! (здесь будет модалка)");
  const handleLoginSuccess = () => {
    console.log('Login success, redirecting to dashboard...');
    setCurrentScreen("DASHBOARD");
  };

  const handleLogout = () => {
    console.log('Logout, redirecting to start screen...');
    setCurrentScreen("START");
  };

  const handleTeamMemberSearch = (teamId: string) => {
    setSelectedTeamId(teamId);
    setCurrentScreen("TEAM_MEMBER_SEARCH");
  };

  const handleBackToDashboard = () => {
    setCurrentScreen("DASHBOARD");
    setSelectedTeamId(null);
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  const handleMobileViewChange = (view: string) => {
    setActiveView(view);
    closeMobileSidebar();
  };

  const renderView = () => {
    console.log('Rendering view:', activeView);
    switch (activeView) {
      case "projects":
        console.log('Rendering ProjectsView');
        return <ProjectsView />;
      case "teams":
        return <TeamsView onTeamMemberSearch={handleTeamMemberSearch} />;
      case "chats":
        return <ChatsView />;
      case "applications":
        return <ApplicationsView />;
      case "invitations":
        return <UniversalInvitationsScreen />;
      default:
        console.log('Rendering default FrameByAnima');
        return <FrameByAnima />;
    }
  };

  // Рендер по текущему экрану
  if (isLoading) {
    console.log('Loading state, showing nothing');
    return <div></div>;
  }

  if (currentScreen === "START") {
    console.log('Rendering START screen');
    return <StartScreen onSelect={handleStartSelect} />;
  }
  if (currentScreen === "LOGIN") {
    console.log('Rendering LOGIN screen');
    return <LoginScreen onBack={handleBackToStart} onRegister={handleGoToRegister} onLoginSuccess={handleLoginSuccess} />;
  }
  if (currentScreen === "REGISTER") {
    console.log('Rendering REGISTER screen');
    return <RegisterScreen onBack={handleBackToStart} onLogin={handleGoToLogin} />;
  }
  if (currentScreen === "CREATE_PROJECT") {
    console.log('Rendering CREATE_PROJECT screen');
    return <CreateProjectScreen onBack={handleBackToStart} onSuccess={handleProjectSuccess} />;
  }
  if (currentScreen === "TEAM_MEMBER_SEARCH") {
    console.log('Rendering TEAM_MEMBER_SEARCH screen');
    return <TeamMemberSearch teamId={selectedTeamId} onBack={handleBackToDashboard} />;
  }

  console.log('Rendering DASHBOARD screen');

  // Мобильные пункты меню
  const mobileMenuItems = [
    { id: 'dashboard', label: 'Главная', icon: '🏠' },
    { id: 'projects', label: 'Проекты', icon: '📋' },
    { id: 'teams', label: 'Команды', icon: '👥' },
    { id: 'chats', label: 'Чаты', icon: '💬' },
    { id: 'applications', label: 'Заявки', icon: '📝' },
  ];

  // Десктопная версия
  return (
    <div className="flex h-screen w-full bg-main-colorsbackground-alt overflow-hidden">
      {/* Десктопное левое меню */}
      <div className="mobile-hidden">
        <LeftMenuByAnima 
          onViewChange={setActiveView} 
          activeView={activeView} 
          onLogout={handleLogout} 
        />
      </div>

      {/* Мобильная боковая панель */}
      <div className={`mobile-sidebar-overlay ${isMobileSidebarOpen ? 'open' : ''}`} onClick={closeMobileSidebar}></div>
      <div className={`mobile-sidebar ${isMobileSidebarOpen ? 'open' : ''}`}>
        <div className="mobile-sidebar-header">
          <h3 className="text-lg font-semibold">Меню</h3>
          <button className="mobile-sidebar-close" onClick={closeMobileSidebar}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="mobile-sidebar-content">
          {mobileMenuItems.map((item) => (
            <div
              key={item.id}
              className={`mobile-sidebar-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => handleMobileViewChange(item.id)}
            >
              <span className="mobile-sidebar-item-icon">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
          <div className="mobile-sidebar-item" onClick={handleLogout}>
            <span className="mobile-sidebar-item-icon">🚪</span>
            <span>Выход</span>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="flex flex-col flex-1 overflow-hidden main-content">
        {/* Заголовок */}
        <div className="header">
          {/* Кнопка мобильного меню */}
          <button className="mobile-header-menu" onClick={toggleMobileSidebar}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <HeaderByAnima onLogout={handleLogout} />
        </div>

        {/* Основной контент */}
        <main className="flex-1 overflow-auto p-responsive">
          {renderView()}
        </main>
      </div>

      {/* Мобильное нижнее меню */}
      <div className="mobile-menu">
        {mobileMenuItems.map((item) => (
          <div
            key={item.id}
            className={`mobile-menu-item ${activeView === item.id ? 'active' : ''}`}
            onClick={() => setActiveView(item.id)}
          >
            <div className="mobile-menu-icon">{item.icon}</div>
            <div className="mobile-menu-label">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};