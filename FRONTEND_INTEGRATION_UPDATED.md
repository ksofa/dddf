# Интеграция Frontend с Backend API

## Обзор

Данная документация описывает интеграцию вашего React фронтенда (https://github.com/ksofa/task_jira) с backend API для системы управления проектами Taska.

## Базовый URL API

```
Production: https://dddf-production.up.railway.app/api
Development: http://localhost:3000/api
```

## Основные эндпоинты

### 1. Создание заявки на проект (без авторизации)

**Endpoint:** `POST /api/applications`

**Описание:** Позволяет неавторизованным заказчикам подавать заявки на проекты

**Поля формы:**
- `fullName` (string, required) - ФИО заказчика
- `phone` (string, required) - Номер телефона
- `projectTitle` (string, required) - Название проекта
- `projectDescription` (string, required) - Описание проекта
- `email` (string, optional) - Email заказчика
- `techSpec` (string, optional) - Техническое задание (текст)
- `techSpecFile` (file, optional) - Файл ТЗ (PDF, DOC, DOCX, TXT, JPG, PNG до 10MB)

**Пример запроса (JavaScript):**

```javascript
const formData = new FormData();
formData.append('fullName', 'Иван Иванов');
formData.append('phone', '+7 999 123-45-67');
formData.append('projectTitle', 'Разработка веб-приложения');
formData.append('projectDescription', 'Нужно создать современное веб-приложение для управления задачами');
formData.append('email', 'ivan@test.com');
formData.append('techSpec', 'React, Node.js, PostgreSQL');
// Если есть файл:
// formData.append('techSpecFile', fileInput.files[0]);

const response = await fetch('/api/applications', {
  method: 'POST',
  body: formData
});

const result = await response.json();
```

**Ответ:**
```json
{
  "message": "Заявка на проект успешно отправлена",
  "applicationId": "5Rr8fVSteGX8C5mmIyHw",
  "data": {
    "id": "5Rr8fVSteGX8C5mmIyHw",
    "fullName": "Иван Иванов",
    "phone": "+7 999 123-45-67",
    "projectTitle": "Разработка веб-приложения",
    "projectDescription": "Нужно создать современное веб-приложение для управления задачами",
    "email": "ivan@test.com",
    "techSpec": "React, Node.js, PostgreSQL",
    "techSpecFile": null,
    "status": "pending",
    "createdAt": "2025-05-24T17:34:38.089Z"
  }
}
```

### 2. Получение заявок (для админов)

**Endpoint:** `GET /api/applications`

**Авторизация:** Требуется токен админа

**Параметры запроса:**
- `status` (optional) - Фильтр по статусу (pending, approved, rejected)
- `limit` (optional) - Количество записей (по умолчанию 50)

**Пример запроса:**
```javascript
const response = await fetch('/api/applications?status=pending', {
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
});

const applications = await response.json();
```

### 3. Одобрение заявки (для админов)

**Endpoint:** `POST /api/applications/:applicationId/approve`

**Авторизация:** Требуется токен админа

**Тело запроса:**
```json
{
  "teamLeadId": "optional-teamlead-id"
}
```

**Пример запроса:**
```javascript
const response = await fetch(`/api/applications/${applicationId}/approve`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    teamLeadId: 'teamlead-user-id' // опционально
  })
});
```

### 4. Отклонение заявки (для админов)

**Endpoint:** `POST /api/applications/:applicationId/reject`

**Авторизация:** Требуется токен админа

**Тело запроса:**
```json
{
  "reason": "Причина отклонения (опционально)"
}
```

## Интеграция с React компонентами

### Компонент формы заявки

```jsx
import React, { useState } from 'react';

const ApplicationForm = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    projectTitle: '',
    projectDescription: '',
    email: '',
    techSpec: ''
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          submitData.append(key, formData[key]);
        }
      });
      
      if (file) {
        submitData.append('techSpecFile', file);
      }

      const response = await fetch('/api/applications', {
        method: 'POST',
        body: submitData
      });

      const result = await response.json();

      if (response.ok) {
        alert('Заявка успешно отправлена!');
        setFormData({
          fullName: '',
          phone: '',
          projectTitle: '',
          projectDescription: '',
          email: '',
          techSpec: ''
        });
        setFile(null);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      alert('Ошибка: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          ФИО *
        </label>
        <input
          type="text"
          required
          value={formData.fullName}
          onChange={(e) => setFormData({...formData, fullName: e.target.value})}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Номер телефона *
        </label>
        <input
          type="tel"
          required
          value={formData.phone}
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Название проекта *
        </label>
        <input
          type="text"
          required
          value={formData.projectTitle}
          onChange={(e) => setFormData({...formData, projectTitle: e.target.value})}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Описание проекта *
        </label>
        <textarea
          required
          rows={4}
          value={formData.projectDescription}
          onChange={(e) => setFormData({...formData, projectDescription: e.target.value})}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Техническое задание (текст)
        </label>
        <textarea
          rows={3}
          value={formData.techSpec}
          onChange={(e) => setFormData({...formData, techSpec: e.target.value})}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Прикрепить ТЗ (файл)
        </label>
        <input
          type="file"
          accept=".pdf,.doc,.docx,.txt,.jpg,.png"
          onChange={(e) => setFile(e.target.files[0])}
          className="mt-1 block w-full"
        />
        <p className="text-xs text-gray-500 mt-1">
          Поддерживаемые форматы: PDF, DOC, DOCX, TXT, JPG, PNG (до 10MB)
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Отправка...' : 'Отправить заявку'}
      </button>
    </form>
  );
};

export default ApplicationForm;
```

### Компонент админ панели

```jsx
import React, { useState, useEffect } from 'react';

const AdminApplications = ({ adminToken }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/applications', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setApplications(data);
      } else {
        throw new Error('Ошибка при загрузке заявок');
      }
    } catch (error) {
      alert('Ошибка: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const approveApplication = async (applicationId) => {
    try {
      const response = await fetch(`/api/applications/${applicationId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('Заявка одобрена!');
        loadApplications();
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error) {
      alert('Ошибка: ' + error.message);
    }
  };

  const rejectApplication = async (applicationId) => {
    const reason = prompt('Причина отклонения (необязательно):');
    
    try {
      const response = await fetch(`/api/applications/${applicationId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        alert('Заявка отклонена!');
        loadApplications();
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error) {
      alert('Ошибка: ' + error.message);
    }
  };

  useEffect(() => {
    if (adminToken) {
      loadApplications();
    }
  }, [adminToken]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Заявки на проекты</h2>
        <button
          onClick={loadApplications}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? 'Загрузка...' : 'Обновить'}
        </button>
      </div>

      {applications.map(app => (
        <div key={app.id} className="bg-white p-4 rounded-lg shadow border">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold">{app.projectTitle}</h3>
            <span className={`px-2 py-1 rounded text-xs ${
              app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              app.status === 'approved' ? 'bg-green-100 text-green-800' :
              'bg-red-100 text-red-800'
            }`}>
              {app.status}
            </span>
          </div>
          
          <div className="text-sm text-gray-600 mb-2">
            <p><strong>ФИО:</strong> {app.fullName}</p>
            <p><strong>Телефон:</strong> {app.phone}</p>
            {app.email && <p><strong>Email:</strong> {app.email}</p>}
          </div>
          
          <p className="text-sm mb-2">{app.projectDescription}</p>
          
          {app.techSpec && (
            <p className="text-xs text-gray-500 mb-1">
              <strong>ТЗ:</strong> {app.techSpec}
            </p>
          )}
          
          {app.techSpecFile && (
            <p className="text-xs text-gray-500 mb-1">
              <strong>Файл:</strong> {app.techSpecFile.originalName}
            </p>
          )}
          
          <p className="text-xs text-gray-400 mt-2">
            Создано: {new Date(app.createdAt).toLocaleString()}
          </p>

          {app.status === 'pending' && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => approveApplication(app.id)}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
              >
                Одобрить
              </button>
              <button
                onClick={() => rejectApplication(app.id)}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
              >
                Отклонить
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default AdminApplications;
```

## Настройка CORS

Backend уже настроен для работы с вашим фронтендом:

```javascript
// В src/app.js уже настроено:
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001', 
    'https://teal-madeleine-39fdc6.netlify.app'
  ],
  credentials: true
}));
```

## Тестирование

1. Откройте `frontend-integration-demo.html` в браузере
2. Заполните форму заявки и отправьте
3. Используйте админ токен для просмотра и управления заявками

## Статусы заявок

- `pending` - Ожидает рассмотрения
- `approved` - Одобрена (создан проект)
- `rejected` - Отклонена

## Обработка ошибок

Все эндпоинты возвращают стандартные HTTP коды:
- `200` - Успех
- `201` - Создано
- `400` - Ошибка валидации
- `401` - Не авторизован
- `403` - Доступ запрещен
- `404` - Не найдено
- `500` - Ошибка сервера

Формат ошибки:
```json
{
  "message": "Описание ошибки",
  "errors": [/* детали валидации */]
}
``` 