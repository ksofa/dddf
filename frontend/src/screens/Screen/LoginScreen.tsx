import React, { useState } from "react";
import { loginUser } from "../../api/auth";

interface LoginScreenProps {
  onBack: () => void;
  onRegister: () => void;
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onBack, onRegister, onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginUser(email, password);
      onLoginSuccess();
    } catch (e: any) {
      setError(e.message || "Ошибка авторизации");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3F5F8] px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl bg-white rounded-2xl p-4 sm:p-6 md:p-8 lg:p-10 shadow flex flex-col gap-4 sm:gap-6">
        <button onClick={onBack} className="mb-2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition self-start">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <h2 className="text-xl sm:text-2xl font-semibold mb-2">Авторизация</h2>
        <div className="bg-[#F8F9FB] rounded-xl p-4 sm:p-6 md:p-8 flex flex-col gap-4 border border-[#ECECEC]">
          <div className="flex items-center border rounded-lg bg-white px-3 sm:px-4 py-2 sm:py-3">
            <svg width="20" height="20" fill="none" viewBox="0 0 20 20" className="mr-2 flex-shrink-0"><path d="M10 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="#A5A5A7" strokeWidth="1.5"/><path d="M16.667 17.5a6.667 6.667 0 1 0-13.334 0" stroke="#A5A5A7" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <input type="text" placeholder="Логин" className="flex-1 bg-transparent outline-none text-sm sm:text-base" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="flex items-center border rounded-lg bg-white px-3 sm:px-4 py-2 sm:py-3">
            <svg width="20" height="20" fill="none" viewBox="0 0 20 20" className="mr-2 flex-shrink-0"><rect x="4" y="8" width="12" height="8" rx="2" stroke="#A5A5A7" strokeWidth="1.5"/><path d="M10 12v2" stroke="#A5A5A7" strokeWidth="1.5" strokeLinecap="round"/><circle cx="10" cy="10" r="3" stroke="#A5A5A7" strokeWidth="1.5"/></svg>
            <input type="password" placeholder="Пароль" className="flex-1 bg-transparent outline-none text-sm sm:text-base" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          {error && <div className="text-red-500 text-xs sm:text-sm text-center">{error}</div>}
          <div className="text-center text-[#222] text-xs sm:text-sm mt-2 mb-3">Вход через</div>
          <div className="flex gap-2 justify-center mb-2 flex-wrap">
            <button className="flex items-center gap-2 border rounded-lg px-3 sm:px-4 py-2 bg-white hover:bg-gray-50 transition text-xs sm:text-sm"><svg width="20" height="20" viewBox="0 0 20 20" className="flex-shrink-0"><g><path d="M10 2C5.58 2 2 5.58 2 10c0 4.42 3.58 8 8 8s8-3.58 8-8c0-4.42-3.58-8-8-8Zm0 14.5c-3.59 0-6.5-2.91-6.5-6.5S6.41 3.5 10 3.5 16.5 6.41 16.5 10 13.59 16.5 10 16.5Z" fill="#222"/><path d="M13.5 10c0-1.93-1.57-3.5-3.5-3.5S6.5 8.07 6.5 10s1.57 3.5 3.5 3.5 3.5-1.57 3.5-3.5Z" fill="#222"/></g></svg>Яндекс</button>
            <button className="flex items-center gap-2 border rounded-lg px-3 sm:px-4 py-2 bg-white hover:bg-gray-50 transition text-xs sm:text-sm"><svg width="20" height="20" viewBox="0 0 20 20" className="flex-shrink-0"><circle cx="10" cy="10" r="10" fill="#222"/><path d="M7.5 10.5l2 2 3-3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>VK</button>
            <button className="flex items-center gap-2 border rounded-lg px-3 sm:px-4 py-2 bg-white hover:bg-gray-50 transition text-xs sm:text-sm"><svg width="20" height="20" viewBox="0 0 20 20" className="flex-shrink-0"><circle cx="10" cy="10" r="10" fill="#222"/><path d="M7 10l3 3 3-3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>Telegram</button>
            <button className="flex items-center gap-2 border rounded-lg px-3 sm:px-4 py-2 bg-white hover:bg-gray-50 transition text-xs sm:text-sm"><svg width="20" height="20" viewBox="0 0 20 20" className="flex-shrink-0"><circle cx="10" cy="10" r="10" fill="#fff"/><path d="M10 4v8m0 0l3-3m-3 3l-3-3" stroke="#222" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>Google</button>
          </div>
          <div className="text-center text-xs sm:text-sm text-[#222]">Еще нет профиля? <button onClick={onRegister} className="text-[#3771C8] hover:underline">Регистрация</button></div>
        </div>
        <button
          className="w-full mt-4 bg-[#5B7FC7] hover:bg-[#4070C4] text-white rounded-full py-2 sm:py-3 text-base sm:text-lg font-semibold transition disabled:opacity-60"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Вход..." : "Войти"}
        </button>
      </div>
    </div>
  );
}; 