# 🔐 Руководство по аутентификации

## Обзор

В проекте Taska используется централизованная система аутентификации на основе Firebase с автоматическим обновлением токенов и fallback механизмами.

## Правильное использование API

### ✅ Правильно - используйте apiClient

```typescript
import { apiClient } from '../api/config';

// Загрузка данных
const response = await apiClient.get('/teams');
const teams = response.data;

// Отправка данных
const response = await apiClient.post('/teams', {
  name: 'Новая команда',
  description: 'Описание команды'
});

// Обновление данных
const response = await apiClient.put('/teams/123', {
  name: 'Обновленное название'
});

// Удаление данных
await apiClient.delete('/teams/123');
```

### ❌ Неправильно - не используйте прямые fetch вызовы

```typescript
// НЕ ДЕЛАЙТЕ ТАК!
const token = localStorage.getItem('token'); // Неправильный ключ
const response = await fetch(`${API_BASE_URL}/teams`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

## Преимущества использования apiClient

### 1. Автоматическое обновление токенов
- Токены Firebase автоматически обновляются при истечении
- Нет необходимости вручную обрабатывать истекшие токены

### 2. Автоматический retry при ошибках 401
- При получении 401 ошибки запрос автоматически повторяется с новым токеном
- Пользователь не видит технических ошибок

### 3. Централизованная обработка ошибок
- Все ошибки аутентификации обрабатываются в одном месте
- Консистентное поведение во всех компонентах

### 4. Подробное логирование
- Все API запросы логируются в консоль
- Легко отслеживать проблемы с аутентификацией

## Обработка ошибок

### Базовая обработка

```typescript
try {
  const response = await apiClient.get('/teams');
  setTeams(response.data);
} catch (error: any) {
  console.error('Ошибка загрузки команд:', error);
  
  if (error.response?.status === 401) {
    setError('Ошибка авторизации. Попробуйте перезайти в систему.');
  } else if (error.response?.status === 403) {
    setError('Недостаточно прав для выполнения операции.');
  } else {
    setError('Произошла ошибка. Попробуйте позже.');
  }
}
```

### Fallback механизм

```typescript
const loadUsers = async () => {
  try {
    // Пробуем специальный эндпоинт
    const response = await apiClient.get(`/teams/${teamId}/available-users`);
    setUsers(response.data);
  } catch (error: any) {
    if (error.response?.status === 404) {
      // Используем fallback на общий эндпоинт
      try {
        const fallbackResponse = await apiClient.get('/users');
        setUsers(fallbackResponse.data);
        console.log('Использован fallback эндпоинт');
      } catch (fallbackError) {
        setError('Не удалось загрузить пользователей');
      }
    } else {
      setError('Ошибка загрузки пользователей');
    }
  }
};
```

## Токены аутентификации

### Правильное хранение токенов

```typescript
// ✅ Правильно - токен сохраняется автоматически в apiClient
// Вам не нужно вручную работать с токенами

// ❌ Неправильно - не работайте с токенами напрямую
localStorage.setItem('token', token); // НЕ ДЕЛАЙТЕ ТАК!
```

### Проверка аутентификации

```typescript
import { auth } from '../config/firebase';

// Проверка, авторизован ли пользователь
const isAuthenticated = !!auth.currentUser;

// Получение данных текущего пользователя
const currentUser = auth.currentUser;
if (currentUser) {
  console.log('Пользователь:', currentUser.email);
}
```

## Логирование

### Что логируется автоматически

- 📡 Все API запросы (метод, URL)
- 🔑 Статус токенов (присутствует/отсутствует)
- ✅ Успешные ответы (статус, URL)
- ❌ Ошибки (статус, данные ошибки, URL)
- 🔄 Процесс обновления токенов
- ⚠️ Fallback сценарии

### Пример логов в консоли

```
🔄 Обновляем токен через Firebase...
✅ Токен обновлен
📡 API Request: GET /teams
🔑 Auth token: Present
✅ API Response: 200 /teams
📡 Загружаем доступных пользователей для команды: 6afobivW1iR7iAIdSb6m
🎯 Пробуем эндпоинт команды: /teams/6afobivW1iR7iAIdSb6m/available-users
✅ Эндпоинт команды работает, получено пользователей: 47
```

## Миграция существующего кода

### Шаг 1: Замените импорты

```typescript
// Было
import { API_BASE_URL } from '../api/config';

// Стало
import { apiClient } from '../api/config';
```

### Шаг 2: Замените fetch вызовы

```typescript
// Было
const token = localStorage.getItem('token');
const response = await fetch(`${API_BASE_URL}/endpoint`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const data = await response.json();

// Стало
const response = await apiClient.get('/endpoint');
const data = response.data;
```

### Шаг 3: Обновите обработку ошибок

```typescript
// Было
if (!response.ok) {
  const errorData = await response.json();
  throw new Error(errorData.message);
}

// Стало
try {
  const response = await apiClient.get('/endpoint');
  // Обработка успешного ответа
} catch (error: any) {
  const errorMessage = error.response?.data?.message || 'Произошла ошибка';
  // Обработка ошибки
}
```

## Тестирование

### Тестовые скрипты

```bash
# Основной тест аутентификации
node scripts/test-auth-fix.js

# Тест компонента TeamMemberSearch
node scripts/test-team-member-search-fix.js
```

### Интерактивное тестирование

Откройте `test-frontend-auth.html` в браузере для интерактивного тестирования аутентификации.

## Часто задаваемые вопросы

### Q: Что делать, если получаю ошибку 401?
A: apiClient автоматически обновит токен и повторит запрос. Если ошибка повторяется, проверьте, что пользователь авторизован.

### Q: Как добавить fallback для нового эндпоинта?
A: Используйте try-catch блоки и вызывайте альтернативный эндпоинт в catch блоке.

### Q: Нужно ли мне вручную обновлять токены?
A: Нет, apiClient делает это автоматически.

### Q: Как отладить проблемы с аутентификацией?
A: Проверьте консоль браузера - все API запросы и ошибки логируются автоматически.

## Поддержка

При возникновении проблем с аутентификацией:

1. Проверьте консоль браузера на наличие ошибок
2. Убедитесь, что используете apiClient вместо прямых fetch вызовов
3. Проверьте, что пользователь авторизован в Firebase
4. Запустите тестовые скрипты для диагностики

## Заключение

Следуя этому руководству, вы обеспечите:
- ✅ Надежную аутентификацию
- ✅ Автоматическое восстановление при ошибках
- ✅ Консистентное поведение
- ✅ Легкую отладку проблем 