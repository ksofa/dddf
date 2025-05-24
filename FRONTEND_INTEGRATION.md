# Frontend Integration Guide

## API Base URL
- **Local Development**: `http://localhost:3000`
- **Production**: (будет настроено при деплое)

## CORS Configuration
Бэкенд настроен для работы с фронтендом на:
- `https://teal-madeleine-39fdc6.netlify.app`
- `http://localhost:3000`, `http://localhost:3001`
- `http://localhost:5173`, `http://localhost:5174` (Vite dev server)

## Health Check Endpoint
```
GET /api/health
```
Возвращает статус API для проверки соединения.

## Authentication
Все защищенные эндпоинты требуют JWT токен в заголовке:
```
Authorization: Bearer <your-jwt-token>
```

## Main API Endpoints

### Authentication
- `POST /api/auth/register` - Регистрация пользователя
- `POST /api/auth/login` - Вход в систему
- `POST /api/auth/logout` - Выход из системы

### Users
- `GET /api/users/profile` - Получить профиль пользователя
- `PUT /api/users/profile` - Обновить профиль

### Projects
- `GET /api/projects` - Получить все проекты
- `POST /api/projects` - Создать проект
- `GET /api/projects/:id` - Получить проект по ID
- `PUT /api/projects/:id` - Обновить проект
- `DELETE /api/projects/:id` - Удалить проект

### Tasks
- `GET /api/projects/:projectId/tasks` - Получить задачи проекта
- `POST /api/projects/:projectId/tasks` - Создать задачу
- `GET /api/tasks/:id` - Получить задачу по ID
- `PUT /api/tasks/:id` - Обновить задачу
- `DELETE /api/tasks/:id` - Удалить задачу

### Columns (Scrum Board)
- `GET /api/projects/:projectId/columns` - Получить колонки проекта
- `POST /api/projects/:projectId/columns` - Создать колонку
- `PUT /api/columns/:id` - Обновить колонку
- `DELETE /api/columns/:id` - Удалить колонку

### Documents
- `GET /api/projects/:projectId/documents` - Получить документы проекта
- `POST /api/projects/:projectId/documents` - Загрузить документ
- `DELETE /api/documents/:id` - Удалить документ

### Categories
- `GET /api/categories` - Получить все категории
- `POST /api/categories` - Создать категорию

## Example Frontend Code

### Axios Configuration
```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### Health Check
```javascript
const checkApiHealth = async () => {
  try {
    const response = await api.get('/api/health');
    console.log('API Status:', response.data);
    return response.data;
  } catch (error) {
    console.error('API is not available:', error);
    throw error;
  }
};
```

### Authentication Example
```javascript
const login = async (email, password) => {
  try {
    const response = await api.post('/api/auth/login', {
      email,
      password
    });
    
    const { token, user } = response.data;
    localStorage.setItem('authToken', token);
    return { token, user };
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};
```

### Fetch Projects Example
```javascript
const getProjects = async () => {
  try {
    const response = await api.get('/api/projects');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    throw error;
  }
};
```

## Error Handling
API возвращает ошибки в следующем формате:
```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

## File Upload
Для загрузки файлов используйте FormData:
```javascript
const uploadDocument = async (projectId, file) => {
  const formData = new FormData();
  formData.append('document', file);
  
  try {
    const response = await api.post(`/api/projects/${projectId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};
```

## WebSocket (Future Enhancement)
Планируется добавить WebSocket для real-time уведомлений:
- Обновления задач
- Новые сообщения в чате
- Уведомления о приглашениях

## Testing the Connection
1. Убедитесь, что бэкенд запущен на `http://localhost:3000`
2. Проверьте health endpoint: `GET http://localhost:3000/api/health`
3. Проверьте Swagger UI: `http://localhost:3000/api-docs` 