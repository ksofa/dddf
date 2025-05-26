import React from "react";

interface StartScreenProps {
  onSelect: (action: "login" | "register" | "createProject") => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onSelect }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3f5f8]">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-xl">
        <h2 className="text-2xl font-semibold mb-8 text-gray-800 text-left">Выберите способ входа</h2>
        <div className="space-y-4">
          {/* Авторизация */}
          <button
            onClick={() => onSelect("login")}
            className="flex items-center w-full bg-[#f6f8fc] hover:bg-blue-50 transition rounded-xl px-4 py-4 text-left group"
          >
            <span className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mr-4">
              {/* Иконка входа */}
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#5B7FC7" strokeWidth="2"><path d="M15 12H3m0 0l4-4m-4 4l4 4" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </span>
            <span className="flex-1">
              <span className="block text-lg font-medium text-gray-900">Авторизация</span>
              <span className="block text-sm text-gray-500">Войдите в систему под своим логином и паролем</span>
            </span>
            <span className="ml-4 text-blue-500 group-hover:translate-x-1 transition-transform">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
          </button>
          {/* Регистрация */}
          <button
            onClick={() => onSelect("register")}
            className="flex items-center w-full bg-[#f6f8fc] hover:bg-blue-50 transition rounded-xl px-4 py-4 text-left group"
          >
            <span className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg mr-4">
              {/* Иконка регистрации */}
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#5B7FC7" strokeWidth="2"><path d="M16 21v-2a4 4 0 00-8 0v2"/><circle cx="12" cy="7" r="4"/></svg>
            </span>
            <span className="flex-1">
              <span className="block text-lg font-medium text-gray-900">Регистрация</span>
              <span className="block text-sm text-gray-500">Создайте нового пользователя: Физическое или Юридическое лицо</span>
            </span>
            <span className="ml-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-transform">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
          </button>
          {/* Создать проект */}
          <button
            onClick={() => onSelect("createProject")}
            className="flex items-center w-full bg-[#f6f8fc] hover:bg-blue-50 transition rounded-xl px-4 py-4 text-left group"
          >
            <span className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg mr-4">
              {/* Иконка лампочки */}
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#5B7FC7" strokeWidth="2"><path d="M12 2a7 7 0 00-7 7c0 3.53 2.61 6.43 6 6.92V19h2v-3.08c3.39-.49 6-3.39 6-6.92a7 7 0 00-7-7z"/><path d="M9 21h6"/></svg>
            </span>
            <span className="flex-1">
              <span className="block text-lg font-medium text-gray-900">Создать проект</span>
              <span className="block text-sm text-gray-500">Для не авторизованного или зарегистрированного пользователя</span>
            </span>
            <span className="ml-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-transform">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}; 