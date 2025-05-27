# План миграции ролей в системе Taska

## Проблемы для исправления

### 1. Устаревшие роли в коде
- `presale` → `admin` 
- `super-admin` → `admin`
- `teamlead` → убрать (это категория, не роль)
- `project_manager` → `pm`

### 2. Файлы требующие изменений

#### Backend (src/routes/):
- `projects.js` - 17 вхождений presale/super-admin
- `users.js` - 8 вхождений  
- `tasks.js` - 24 вхождения
- `invites.js` - 4 вхождения
- `chats.js` - 8 вхождений
- `documents.js` - 6 вхождений
- `categories.js` - 3 вхождения
- `columns.js` - 2 вхождения

#### Frontend:
- `RegisterScreen.tsx` - роли в форме регистрации
- `AdminPanel.tsx` - роли в админке
- `LeftMenuByAnima.tsx` - роли в меню
- `frontend-api.js` - роли в API

#### Конфигурация:
- `openapi.yaml` - схема API
- `swagger.ts` - документация API

## Этапы миграции

### Этап 1: Обновление схемы проектов
```javascript
// Добавить поле adminId в существующие проекты
db.collection('projects').get().then(snapshot => {
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    if (data.presaleId) {
      doc.ref.update({
        adminId: data.presaleId,
        presaleId: admin.firestore.FieldValue.delete()
      });
    }
  });
});
```

### Этап 2: Обновление ролей пользователей
```javascript
// Заменить устаревшие роли
db.collection('users').get().then(snapshot => {
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    let roles = data.roles || [];
    
    // Замены ролей
    roles = roles.map(role => {
      if (role === 'presale' || role === 'super-admin') return 'admin';
      if (role === 'project_manager') return 'pm';
      return role;
    });
    
    // Убираем недопустимые роли
    roles = roles.filter(role => 
      ['customer', 'executor', 'pm', 'admin'].includes(role)
    );
    
    if (JSON.stringify(roles) !== JSON.stringify(data.roles)) {
      doc.ref.update({ roles });
    }
  });
});
```

### Этап 3: Обновление middleware авторизации
```javascript
// src/middleware/auth.js
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    // Нормализация ролей для обратной совместимости
    const normalizedRoles = allowedRoles.map(role => {
      if (role === 'presale' || role === 'super-admin') return 'admin';
      if (role === 'project_manager') return 'pm';
      return role;
    });
    
    const userRoles = req.user.roles || [];
    const hasRole = normalizedRoles.some(role => userRoles.includes(role));
    
    if (!hasRole) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};
```

### Этап 4: Обновление фронтенда
- Заменить все `project_manager` на `pm`
- Убрать `teamlead` из ролей
- Обновить формы регистрации и админки

## Скрипты для выполнения

### 1. Скрипт миграции БД
```bash
node scripts/migrate-roles.js
```

### 2. Скрипт проверки целостности
```bash
node scripts/validate-roles.js
```

### 3. Обновление индексов Firestore
```json
{
  "indexes": [
    {
      "collectionGroup": "projects",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "adminId", "order": "ASCENDING"},
        {"fieldPath": "status", "order": "ASCENDING"},
        {"fieldPath": "createdAt", "order": "DESCENDING"}
      ]
    }
  ]
}
```

## Тестирование после миграции

1. Проверить авторизацию для всех ролей
2. Убедиться что проекты корректно фильтруются
3. Проверить работу приглашений
4. Тестировать создание/редактирование проектов
5. Проверить админские функции

## Откат в случае проблем

1. Восстановить поле `presaleId` из `adminId`
2. Вернуть старые роли в коллекции users
3. Откатить изменения в коде через git 