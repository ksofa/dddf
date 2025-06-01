import { logoutUser } from '../api/auth';

// Очистить все данные авторизации и перенаправить на логин
export function clearAuthAndRedirect(): void {
  console.log('🧹 Очищаем данные авторизации и перенаправляем на логин');
  
  // Очищаем localStorage
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  
  // Выходим из Firebase
  logoutUser();
  
  // Перенаправляем на страницу логина
  window.location.href = '/';
}

// Проверить, не устарел ли токен
export function isTokenExpired(token: string): boolean {
  try {
    // Простая проверка структуры JWT токена
    const parts = token.split('.');
    if (parts.length !== 3) {
      return true;
    }
    
    // Декодируем payload
    const payload = JSON.parse(atob(parts[1]));
    
    // Проверяем срок действия
    if (payload.exp) {
      const now = Math.floor(Date.now() / 1000);
      return payload.exp < now;
    }
    
    return false;
  } catch (error) {
    console.error('Ошибка проверки токена:', error);
    return true;
  }
}

// Проверить валидность токена и очистить если нужно
export function validateAndCleanToken(): boolean {
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    return false;
  }
  
  if (isTokenExpired(token)) {
    console.log('🕐 Токен устарел, очищаем данные');
    clearAuthAndRedirect();
    return false;
  }
  
  return true;
} 