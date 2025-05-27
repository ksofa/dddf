# Система приглашений в команды - Полное руководство

## 📋 Обзор

Система приглашений позволяет отправлять детальные приглашения участникам для присоединения к командам. Система поддерживает два типа приглашений:

1. **Простые приглашения** - без прикрепления файлов
2. **Полные приглашения** - с прикреплением технических заданий

## 🎯 Функциональность

### Поля формы приглашения

- **Тип предложения**: "Без проекта" / "С проектом"
- **Ставка**: Диапазон оплаты
- **Дата старта проекта**: Планируемая дата начала
- **Оценочное время реализации**: Длительность + единица времени (дни/недели/месяцы)
- **Сопроводительное письмо**: Детальное описание предложения
- **Техническое задание**: Файл с ТЗ (опционально)

### Поддерживаемые форматы файлов

- PDF (.pdf)
- Microsoft Word (.doc, .docx)
- Текстовые файлы (.txt)
- Максимальный размер: 10 МБ

## 🔧 Backend API

### Endpoints

#### 1. Простое приглашение (без файла)
```
POST /api/teams/:teamId/invite-simple
Content-Type: application/json
Authorization: Bearer <token>
```

**Тело запроса:**
```json
{
  "receiverId": "string",
  "projectType": "with_project" | "without_project",
  "rate": "string",
  "startDate": "YYYY-MM-DD",
  "estimatedDuration": "string",
  "estimatedDurationUnit": "days" | "weeks" | "months",
  "coverLetter": "string"
}
```

#### 2. Полное приглашение (с файлом)
```
POST /api/teams/:teamId/invite
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

**Поля формы:**
- `receiverId`: ID получателя
- `projectType`: Тип проекта
- `rate`: Ставка
- `startDate`: Дата старта
- `estimatedDuration`: Длительность
- `estimatedDurationUnit`: Единица времени
- `coverLetter`: Сопроводительное письмо
- `techSpecFile`: Файл ТЗ

### Ответ API

```json
{
  "success": true,
  "invitationId": "string",
  "message": "Приглашение отправлено успешно",
  "data": {
    "teamName": "string",
    "receiverName": "string",
    "projectType": "string",
    "rate": "string",
    "hasFile": boolean
  }
}
```

## 🎨 Frontend компонент

### Основной компонент
`frontend/src/screens/Screen/sections/TeamsView/TeamMemberSearch.tsx`

### Ключевые функции

#### 1. Состояние формы
```typescript
interface InvitationFormData {
  projectType: 'with_project' | 'without_project';
  rate: string;
  startDate: string;
  estimatedDuration: string;
  estimatedDurationUnit: 'days' | 'weeks' | 'months';
  coverLetter: string;
  techSpecFile?: File;
}
```

#### 2. Отправка приглашения
Функция `handleSubmitInvitation` автоматически определяет тип запроса:
- Если файл прикреплен → использует `/invite` с FormData
- Если файла нет → использует `/invite-simple` с JSON

#### 3. Валидация файлов
- Проверка типа файла
- Проверка размера (до 10 МБ)
- Drag & drop поддержка

## 💾 Хранение данных

### База данных (Firestore)
Приглашения сохраняются в коллекции `invitations` со следующей структурой:

```javascript
{
  id: "auto-generated",
  teamId: "string",
  senderId: "string",
  receiverId: "string",
  projectType: "string",
  rate: "string",
  startDate: "string",
  estimatedDuration: "string",
  estimatedDurationUnit: "string",
  coverLetter: "string",
  techSpecFile: {
    filename: "string",
    originalName: "string",
    size: number,
    uploadDate: "timestamp"
  },
  status: "pending",
  createdAt: "timestamp"
}
```

### Файловая система
Файлы ТЗ сохраняются в:
```
uploads/tech-specs/
├── tech-spec-{timestamp}-{random}.{ext}
└── ...
```

## 🧪 Тестирование

### Тестовые скрипты

1. **`scripts/test-invitation-simple.js`** - Тест простых приглашений
2. **`scripts/test-invitation-form.js`** - Тест приглашений с файлами
3. **`scripts/test-both-invitations.js`** - Комплексный тест обеих систем

### Запуск тестов

```bash
# Простое приглашение
node scripts/test-invitation-simple.js

# Приглашение с файлом
node scripts/test-invitation-form.js

# Оба типа приглашений
node scripts/test-both-invitations.js
```

## 🔒 Безопасность

### Аутентификация
- Все endpoints требуют Bearer token
- Проверка прав доступа к команде

### Валидация файлов
- Проверка MIME-типов
- Ограничение размера файлов
- Фильтрация расширений

### Валидация данных
- Проверка обязательных полей
- Санитизация входных данных
- Проверка существования пользователей

## 📱 UI/UX особенности

### Модальное окно приглашения
- Адаптивный дизайн
- Пошаговое заполнение формы
- Индикаторы загрузки
- Обработка ошибок

### Drag & Drop для файлов
- Визуальная обратная связь
- Предпросмотр выбранного файла
- Возможность замены файла

### Валидация в реальном времени
- Проверка формата даты
- Валидация ставки
- Проверка файлов

## 🚀 Развертывание

### Требования
- Node.js 16+
- Firebase проект
- Настроенная Firestore база данных

### Переменные окружения
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
```

### Создание папки для файлов
```bash
mkdir -p uploads/tech-specs
chmod 755 uploads/tech-specs
```

## 📊 Мониторинг

### Логирование
Система логирует:
- Отправку приглашений
- Загрузку файлов
- Ошибки валидации
- Проблемы с базой данных

### Метрики
- Количество отправленных приглашений
- Размер загруженных файлов
- Время обработки запросов

## 🔧 Настройка

### Multer конфигурация
```javascript
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/tech-specs/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'tech-spec-' + uniqueSuffix + ext);
  }
});
```

### Ограничения файлов
```javascript
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: function (req, file, cb) {
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Разрешены только файлы PDF, DOC, DOCX, TXT'));
    }
  }
});
```

## 🎯 Результаты тестирования

✅ **Все функции работают корректно:**

- Простые приглашения без файлов
- Полные приглашения с файлами ТЗ
- Валидация данных и файлов
- Сохранение в базу данных
- Создание уведомлений
- Обработка ошибок

## 📞 Поддержка

При возникновении проблем:

1. Проверьте логи сервера
2. Убедитесь в корректности токена авторизации
3. Проверьте права доступа к папке uploads
4. Убедитесь в работоспособности Firebase

---

*Документация обновлена: 27 мая 2025* 