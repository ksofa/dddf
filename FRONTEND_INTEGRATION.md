# Интеграция Taska Backend с Frontend

## Обзор

Этот документ описывает интеграцию бэкенда Taska с фронтендом, развернутым на https://teal-madeleine-39fdc6.netlify.app/

## Настройка API клиента

### 1. Базовая конфигурация

```typescript
// src/api/config.ts
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-url.com/api'  // Замените на ваш продакшн URL
  : 'http://localhost:3000/api';

export const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
};
```

### 2. Axios клиент с аутентификацией

```typescript
// src/api/client.ts
import axios from 'axios';
import { apiConfig } from './config';

const apiClient = axios.create(apiConfig);

// Интерцептор для добавления токена
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Интерцептор для обработки ошибок
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

## API Endpoints для интеграции

### 1. Подача заявки на проект (без авторизации)

```typescript
// src/api/projects.ts
import apiClient from './client';

export interface ProjectRequest {
  companyName: string;
  contactPerson: string;
  email: string;
  phone?: string;
  projectTitle: string;
  projectDescription: string;
  budget?: string;
  deadline?: string;
  requirements?: string;
}

export const submitProjectRequest = async (data: ProjectRequest) => {
  const response = await fetch(`${API_BASE_URL}/projects/project-request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to submit project request');
  }
  
  return response.json();
};
```

### 2. Аутентификация

```typescript
// src/api/auth.ts
import apiClient from './client';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  displayName: string;
  position?: string;
  department?: string;
}

export const login = async (data: LoginData) => {
  const response = await apiClient.post('/auth/login', data);
  return response.data;
};

export const register = async (data: RegisterData) => {
  const response = await apiClient.post('/auth/register', data);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await apiClient.get('/users/profile');
  return response.data;
};
```

### 3. Управление проектами (для админов)

```typescript
// src/api/admin.ts
import apiClient from './client';

export const getProjectRequests = async () => {
  const response = await apiClient.get('/projects/project-requests');
  return response.data;
};

export const approveProjectRequest = async (requestId: string, teamLeadId?: string) => {
  const response = await apiClient.post(`/projects/project-requests/${requestId}/approve`, {
    teamLeadId
  });
  return response.data;
};

export const rejectProjectRequest = async (requestId: string, reason?: string) => {
  const response = await apiClient.post(`/projects/project-requests/${requestId}/reject`, {
    reason
  });
  return response.data;
};

export const getAllProjects = async () => {
  const response = await apiClient.get('/projects');
  return response.data;
};

export const getTeamLeads = async () => {
  const response = await apiClient.get('/users/teamleads');
  return response.data;
};
```

### 4. Управление пользователями

```typescript
// src/api/users.ts
import apiClient from './client';

export const getAllUsers = async () => {
  const response = await apiClient.get('/users');
  return response.data;
};

export const assignRole = async (userId: string, role: string) => {
  const response = await apiClient.post(`/users/${userId}/assign-role`, { role });
  return response.data;
};

export const removeRole = async (userId: string, role: string) => {
  const response = await apiClient.post(`/users/${userId}/remove-role`, { role });
  return response.data;
};

export const getMyTeam = async () => {
  const response = await apiClient.get('/users/my-team');
  return response.data;
};
```

## Компоненты React

### 1. Форма подачи заявки

```tsx
// src/components/ProjectRequestForm.tsx
import React, { useState } from 'react';
import { submitProjectRequest, ProjectRequest } from '../api/projects';

const ProjectRequestForm: React.FC = () => {
  const [formData, setFormData] = useState<ProjectRequest>({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    projectTitle: '',
    projectDescription: '',
    budget: '',
    deadline: '',
    requirements: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await submitProjectRequest(formData);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Ошибка при отправке заявки');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-800 mb-2">
          Заявка отправлена!
        </h3>
        <p className="text-green-700">
          Мы свяжемся с вами в ближайшее время.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Название компании *
        </label>
        <input
          type="text"
          required
          value={formData.companyName}
          onChange={(e) => setFormData({...formData, companyName: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Контактное лицо *
        </label>
        <input
          type="text"
          required
          value={formData.contactPerson}
          onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email *
        </label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Телефон
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Название проекта *
        </label>
        <input
          type="text"
          required
          value={formData.projectTitle}
          onChange={(e) => setFormData({...formData, projectTitle: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Описание проекта *
        </label>
        <textarea
          required
          rows={4}
          value={formData.projectDescription}
          onChange={(e) => setFormData({...formData, projectDescription: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Бюджет
        </label>
        <input
          type="text"
          value={formData.budget}
          onChange={(e) => setFormData({...formData, budget: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Желаемый срок
        </label>
        <input
          type="text"
          value={formData.deadline}
          onChange={(e) => setFormData({...formData, deadline: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Дополнительные требования
        </label>
        <textarea
          rows={3}
          value={formData.requirements}
          onChange={(e) => setFormData({...formData, requirements: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Отправка...' : 'Отправить заявку'}
      </button>
    </form>
  );
};

export default ProjectRequestForm;
```

### 2. Админ панель для управления заявками

```tsx
// src/components/AdminProjectRequests.tsx
import React, { useState, useEffect } from 'react';
import { getProjectRequests, approveProjectRequest, rejectProjectRequest, getTeamLeads } from '../api/admin';

interface ProjectRequest {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  projectTitle: string;
  projectDescription: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

const AdminProjectRequests: React.FC = () => {
  const [requests, setRequests] = useState<ProjectRequest[]>([]);
  const [teamLeads, setTeamLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [requestsData, teamLeadsData] = await Promise.all([
        getProjectRequests(),
        getTeamLeads()
      ]);
      setRequests(requestsData);
      setTeamLeads(teamLeadsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string, teamLeadId?: string) => {
    try {
      await approveProjectRequest(requestId, teamLeadId);
      await loadData(); // Перезагружаем данные
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleReject = async (requestId: string, reason?: string) => {
    try {
      await rejectProjectRequest(requestId, reason);
      await loadData(); // Перезагружаем данные
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Заявки на проекты</h2>
      
      {requests.length === 0 ? (
        <p className="text-gray-500">Нет заявок</p>
      ) : (
        <div className="grid gap-6">
          {requests.map((request) => (
            <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {request.projectTitle}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {request.companyName} • {request.contactPerson}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  request.status === 'approved' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {request.status === 'pending' ? 'Ожидает' :
                   request.status === 'approved' ? 'Одобрено' : 'Отклонено'}
                </span>
              </div>
              
              <p className="text-gray-700 mb-4">{request.projectDescription}</p>
              
              <div className="text-sm text-gray-500 mb-4">
                Email: {request.email} • Дата: {new Date(request.createdAt).toLocaleDateString()}
              </div>
              
              {request.status === 'pending' && (
                <div className="flex gap-2">
                  <select 
                    className="border border-gray-300 rounded px-3 py-1 text-sm"
                    onChange={(e) => {
                      if (e.target.value) {
                        handleApprove(request.id, e.target.value);
                      }
                    }}
                  >
                    <option value="">Выберите тимлида</option>
                    {teamLeads.map((lead: any) => (
                      <option key={lead.id} value={lead.id}>
                        {lead.displayName}
                      </option>
                    ))}
                  </select>
                  
                  <button
                    onClick={() => handleApprove(request.id)}
                    className="bg-green-600 text-white px-4 py-1 rounded text-sm hover:bg-green-700"
                  >
                    Одобрить
                  </button>
                  
                  <button
                    onClick={() => handleReject(request.id)}
                    className="bg-red-600 text-white px-4 py-1 rounded text-sm hover:bg-red-700"
                  >
                    Отклонить
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminProjectRequests;
```

## Роутинг и защищенные маршруты

```tsx
// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  userRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole, 
  userRoles = [] 
}) => {
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && !userRoles.includes(requiredRole)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;
```

## Использование в App.tsx

```tsx
// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProjectRequestForm from './components/ProjectRequestForm';
import AdminProjectRequests from './components/AdminProjectRequests';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Публичные маршруты */}
          <Route path="/" element={<ProjectRequestForm />} />
          <Route path="/request" element={<ProjectRequestForm />} />
          
          {/* Защищенные маршруты для админов */}
          <Route 
            path="/admin/requests" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminProjectRequests />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
```

## Переменные окружения

```env
# .env
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
```

## Тестирование интеграции

1. **Подача заявки**: Откройте https://teal-madeleine-39fdc6.netlify.app/ и заполните форму
2. **Админ панель**: Войдите как админ и проверьте заявки в разделе администрирования
3. **API endpoints**: Используйте Swagger UI на http://localhost:3000/api-docs для тестирования

## Деплой

Убедитесь, что в продакшн среде:
1. Обновите `REACT_APP_API_URL` на URL вашего бэкенда
2. Настройте CORS для продакшн домена
3. Используйте HTTPS для всех запросов 