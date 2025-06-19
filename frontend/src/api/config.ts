// API Configuration
const isProduction = import.meta.env.PROD || 
                    import.meta.env.MODE === 'production' || 
                    window.location.hostname !== 'localhost';

// Проверяем переменные окружения для принудительного использования production API
const FORCE_PRODUCTION_API = import.meta.env.VITE_FORCE_PRODUCTION_API === 'true' || true; // Временно включено

// Получаем URL из переменной окружения или используем дефолтный
const PRODUCTION_API_URL = import.meta.env.VITE_API_URL || 'https://dddf-1.onrender.com/api';
const DEVELOPMENT_API_URL = 'http://localhost:3000/api';

const API_BASE_URL = (isProduction || FORCE_PRODUCTION_API)
  ? PRODUCTION_API_URL
  : DEVELOPMENT_API_URL;

console.log('🌍 Environment:', {
  'import.meta.env.PROD': import.meta.env.PROD,
  'import.meta.env.MODE': import.meta.env.MODE,
  'import.meta.env.VITE_API_URL': import.meta.env.VITE_API_URL,
  'import.meta.env.VITE_FORCE_PRODUCTION_API': import.meta.env.VITE_FORCE_PRODUCTION_API,
  'window.location.hostname': window.location.hostname,
  'isProduction': isProduction,
  'FORCE_PRODUCTION_API': FORCE_PRODUCTION_API,
  'API_BASE_URL': API_BASE_URL
});

export { API_BASE_URL };

// Axios instance configuration
import axios from 'axios';
import { auth } from '../config/firebase';
import { clearAuthAndRedirect, validateAndCleanToken } from '../utils/authUtils';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Export as 'api' for convenience
export const api = apiClient;

// Функция для получения свежего токена
const getValidToken = async (): Promise<string | null> => {
  try {
    // Сначала проверяем валидность сохраненного токена
    if (!validateAndCleanToken()) {
      return null;
    }
    
    // Используем сохраненный custom token
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      console.log('🔑 Используем сохраненный custom token');
      return storedToken;
    }
    
    console.log('❌ Токен не найден');
    return null;
  } catch (error) {
    console.error('❌ Ошибка получения токена:', error);
    // В случае ошибки пробуем использовать сохраненный токен
    return localStorage.getItem('authToken');
  }
};

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getValidToken();
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    console.log('Auth token:', token ? 'Present' : 'Missing');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  async (error) => {
    console.error('API Error:', error.response?.status, error.response?.data, error.config?.url);
    
    // Если получили 401, пробуем обновить токен и повторить запрос
    if (error.response?.status === 401 && !error.config._retry) {
      console.log('🔄 Получили 401, пробуем обновить токен...');
      error.config._retry = true;
      
      try {
        const freshToken = await getValidToken();
        if (freshToken) {
          error.config.headers.Authorization = `Bearer ${freshToken}`;
          console.log('🔄 Повторяем запрос с новым токеном...');
          return apiClient.request(error.config);
        }
      } catch (refreshError) {
        console.error('❌ Не удалось обновить токен:', refreshError);
      }
      
      // Если не удалось обновить токен, очищаем авторизацию
      console.log('🧹 Очищаем авторизацию из-за невозможности обновить токен');
      clearAuthAndRedirect();
    }
    
    return Promise.reject(error);
  }
); 