import React, { useState, useEffect } from "react";
import { FrameByAnima } from "./sections/FrameByAnima/FrameByAnima";
import { HeaderByAnima } from "./sections/HeaderByAnima";
import { LeftMenuByAnima } from "./sections/LeftMenuByAnima";
import { ProjectsView } from "./sections/ProjectsView";
import { TeamsView } from "./sections/TeamsView";
import { ChatsView } from "./sections/ChatsView";
import { ApplicationsView } from "./sections/ApplicationsView";
import { ProjectManagersView } from "./sections/ProjectManagersView";
import { UniversalInvitationsScreen } from "../Invitations/UniversalInvitationsScreen";
import { StartScreen } from "./StartScreen";
import { LoginScreen } from "./LoginScreen";
import { RegisterScreen } from "./RegisterScreen";
import { CreateProjectScreen } from "./CreateProjectScreen";
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
} as const;
type ScreenType = keyof typeof SCREENS;

export const Screen = (): JSX.Element => {
  console.log('Screen component rendering...');
  
  const [activeView, setActiveView] = React.useState("dashboard");
  const [currentScreen, setCurrentScreen] = React.useState<ScreenType>("START");
  const [isLoading, setIsLoading] = React.useState(true);

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

  const renderView = () => {
    console.log('Rendering view:', activeView);
    switch (activeView) {
      case "projects":
        console.log('Rendering ProjectsView');
        return <ProjectsView />;
      case "teams":
        return <TeamsView />;
      case "chats":
        return <ChatsView />;
      case "applications":
        return <ApplicationsView />;
      case "project-managers":
        return <ProjectManagersView />;
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

  console.log('Rendering DASHBOARD screen');
  return (
    <div className="flex h-screen w-full bg-main-colorsbackground-alt overflow-hidden">
      <LeftMenuByAnima onViewChange={setActiveView} activeView={activeView} onLogout={handleLogout} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <HeaderByAnima onLogout={handleLogout} />
        <main className="flex-1 overflow-auto">
          {renderView()}
        </main>
      </div>
    </div>
  );
};