import { apiClient } from './config';
import { auth } from '../config/firebase';
import { signInWithCustomToken, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone: string;
  roles: string[];
  profession?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  uid: string;
  email: string;
  name: string;
  displayName: string;
  role: string;
  roles: string[];
  categories?: string[];
}

export interface AuthResponse {
  message: string;
  token: string;
  uid: string;
  user: User;
}

// Регистрация пользователя
export async function registerUser(data: RegisterData): Promise<AuthResponse> {
  // Сначала регистрируем пользователя через backend
  const response = await apiClient.post('/auth/register', {
    email: data.email,
    password: data.password,
    displayName: data.name,
    phone: data.phone,
    roles: data.roles,
    profession: data.profession
  });
  
  // Получаем custom token от backend
  const customToken = response.data.token;
  
  // Используем custom token для входа в Firebase
  const userCredential = await signInWithCustomToken(auth, customToken);
  
  // Сохраняем CUSTOM TOKEN (не ID token) и данные пользователя
  localStorage.setItem('authToken', customToken);
  localStorage.setItem('user', JSON.stringify(response.data.user));
  
  return response.data;
}

// Вход пользователя
export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  // Сначала логинимся через backend чтобы получить custom token
  const response = await apiClient.post('/auth/login', { email, password });
  
  // Получаем custom token от backend
  const customToken = response.data.token;
  console.log('Получен custom token:', customToken);
  
  // Используем custom token для входа в Firebase
  const userCredential = await signInWithCustomToken(auth, customToken);
  console.log('Успешный вход в Firebase');
  
  // Сохраняем CUSTOM TOKEN (не ID token) и данные пользователя
  localStorage.setItem('authToken', customToken);
  localStorage.setItem('user', JSON.stringify(response.data.user));
  console.log('Custom token сохранён в localStorage');
  
  return response.data;
}

// Выход пользователя
export function logoutUser(): void {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  auth.signOut();
}

// Получить текущего пользователя
export function getCurrentUser(): User | null {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

// Получить токен авторизации
export function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

// Обновить токен авторизации
export async function refreshAuthToken(): Promise<string | null> {
  try {
    // Проверяем, есть ли сохраненный токен
    const storedToken = localStorage.getItem('authToken');
    if (!storedToken) {
      console.log('❌ Нет сохраненного токена');
      logoutUser();
      return null;
    }
    
    // Проверяем, что пользователь залогинен в Firebase
    if (!auth.currentUser) {
      console.log('❌ Нет текущего пользователя Firebase');
      // Если нет Firebase пользователя, но есть токен, возвращаем его
      return storedToken;
    }
    
    console.log('✅ Используем сохраненный custom token');
    return storedToken;
  } catch (error) {
    console.error('❌ Ошибка обновления токена:', error);
    // Очищаем устаревшие данные при ошибке
    logoutUser();
    return null;
  }
}

// Проверка авторизации
export function isAuthenticated(): boolean {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.log('No auth token found in localStorage');
      return false;
    }
    
    // Проверяем наличие данных пользователя
    const user = getCurrentUser();
    if (!user) {
      console.log('No user data found in localStorage');
      return false;
    }
    
    // Проверяем, что пользователь залогинен в Firebase
    if (!auth.currentUser) {
      console.log('No current Firebase user, clearing auth data');
      logoutUser();
      return false;
    }
    
    console.log('Auth check:', { 
      hasToken: !!token,
      hasUser: !!user,
      hasFirebaseUser: !!auth.currentUser,
      userRole: user.role,
      userRoles: user.roles
    });
    
    return true;
  } catch (error) {
    console.error('Error checking authentication:', error);
    logoutUser();
    return false;
  }
}

// Проверить роль пользователя
export function hasRole(role: string): boolean {
  const user = getCurrentUser();
  return user?.roles?.includes(role) || user?.role === role || false;
}

// Получить список пользователей (только для админов)
export async function getUsers(): Promise<User[]> {
  const response = await apiClient.get('/users');
  return response.data;
}

// Alias for compatibility
export const login = loginUser;
export const logout = logoutUser; 