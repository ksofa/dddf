# 📋 Обновленная система Invites и Applications

## 🎯 Логика системы

### 1️⃣ **Invites (Приглашения)**
- **Кто отправляет:** PM (проект-менеджер) исполнителю
- **Цель:** Пригласить исполнителя в существующий проект
- **Процесс:** PM → Executor → PM (двухэтапное подтверждение)
- **Коллекция:** `invites`

### 2️⃣ **Applications (Заявки)**
- **Кто отправляет:** Неавторизованный заказчик
- **Цель:** Создать новый проект
- **Процесс:** Customer → Admin → PM assignment → Project creation
- **Коллекция:** `applications`

---

## 📊 Структура данных

### 🔗 Invites Collection

```javascript
{
  // Основная информация
  projectId: "string",           // ID проекта
  projectTitle: "string",        // Название проекта
  executorId: "string",          // ID исполнителя
  executorName: "string",        // Имя исполнителя
  executorEmail: "string",       // Email исполнителя
  
  // Роль и описание
  role: "executor",              // Роль в проекте
  description: "string",         // Описание приглашения
  
  // Новые поля из скриншота
  rate: "Договорная",            // Ставка (Договорная/Фиксированная/Почасовая)
  startDate: Date,               // Дата старта проекта
  estimatedDuration: 6,          // Оценочное время реализации
  estimatedDurationUnit: "months", // Единица времени (days/weeks/months)
  coverLetter: "string",         // Сопроводительное письмо
  
  // Файл технического задания
  techSpecFile: {
    filename: "string",          // Имя файла на сервере
    originalName: "string",      // Оригинальное имя файла
    path: "string",             // Путь к файлу
    size: 1234567,              // Размер файла в байтах
    mimetype: "string",         // MIME тип
    uploadedAt: Date            // Дата загрузки
  },
  
  // Метаданные
  status: "pending",             // pending/accepted_by_executor/declined_by_executor/accepted_by_pm/declined_by_pm
  createdBy: "string",          // ID создателя (PM)
  createdByName: "string",      // Имя создателя
  createdAt: Date,              // Дата создания
  updatedAt: Date,              // Дата обновления
  
  // Ответы
  responseAt: Date,             // Дата ответа исполнителя
  responseComment: "string",    // Комментарий исполнителя
  pmResponseAt: Date,           // Дата ответа PM
  pmResponseComment: "string"   // Комментарий PM
}
```

### 📝 Applications Collection

```javascript
{
  // Информация о заказчике
  fullName: "string",           // ФИО заказчика
  phone: "string",              // Телефон
  email: "string",              // Email (необязательно)
  
  // Информация о проекте
  projectTitle: "string",       // Название проекта
  projectDescription: "string", // Описание проекта
  techSpec: "string",           // Техническое задание (текст)
  
  // Новые поля из скриншота
  rate: "Договорная",           // Ставка
  startDate: Date,              // Дата старта проекта
  estimatedDuration: 6,         // Оценочное время реализации
  estimatedDurationUnit: "months", // Единица времени
  coverLetter: "string",        // Сопроводительное письмо
  
  // Файл технического задания
  techSpecFile: {
    filename: "string",
    originalName: "string",
    path: "string",
    size: 1234567,
    mimetype: "string",
    uploadedAt: Date
  },
  
  // Метаданные
  type: "client_request",       // Тип заявки
  status: "pending",            // pending/approved/rejected
  createdAt: Date,              // Дата создания
  
  // Обработка админом
  assignedPM: "string",         // ID назначенного PM
  assignedTeamLead: "string",   // Устаревшее поле для совместимости
  approvedAt: Date,             // Дата одобрения
  approvedBy: "string",         // ID админа, одобрившего заявку
  rejectedAt: Date,             // Дата отклонения
  rejectedBy: "string",         // ID админа, отклонившего заявку
  rejectionReason: "string",    // Причина отклонения
  projectId: "string"           // ID созданного проекта (после одобрения)
}
```

---

## 🛠 API Endpoints

### 📨 Invites API

#### Создать приглашение
```http
POST /api/invites/projects/:projectId/team/invite
Authorization: Bearer <pm_token>
Content-Type: multipart/form-data

{
  "executorId": "string",
  "role": "executor",
  "description": "string",
  "rate": "Договорная",
  "startDate": "2025-02-17",
  "estimatedDuration": "6",
  "estimatedDurationUnit": "months",
  "coverLetter": "string",
  "techSpecFile": File
}
```

#### Получить приглашения исполнителя
```http
GET /api/invites
Authorization: Bearer <executor_token>
```

#### Ответить на приглашение (исполнитель)
```http
PUT /api/invites/:inviteId/respond
Authorization: Bearer <executor_token>

{
  "response": "accept|decline",
  "comment": "string"
}
```

#### Принять/отклонить приглашение (PM)
```http
PUT /api/invites/:inviteId/accept
Authorization: Bearer <pm_token>

{
  "action": "accept|decline",
  "comment": "string"
}
```

#### Скачать файл ТЗ из приглашения
```http
GET /api/invites/:inviteId/tech-spec-file
Authorization: Bearer <token>
```

### 📝 Applications API

#### Создать заявку (без авторизации)
```http
POST /api/applications
Content-Type: multipart/form-data

{
  "fullName": "string",
  "phone": "string",
  "email": "string",
  "projectTitle": "string",
  "projectDescription": "string",
  "rate": "Договорная",
  "startDate": "2025-02-17",
  "estimatedDuration": "6",
  "estimatedDurationUnit": "months",
  "techSpec": "string",
  "coverLetter": "string",
  "techSpecFile": File
}
```

#### Получить все заявки (админ)
```http
GET /api/applications
Authorization: Bearer <admin_token>
```

#### Одобрить заявку (админ)
```http
POST /api/applications/:applicationId/approve
Authorization: Bearer <admin_token>

{
  "pmId": "string"
}
```

#### Отклонить заявку (админ)
```http
POST /api/applications/:applicationId/reject
Authorization: Bearer <admin_token>

{
  "reason": "string"
}
```

#### Скачать файл ТЗ из заявки
```http
GET /api/applications/:applicationId/tech-spec-file
Authorization: Bearer <admin_token>
```

---

## 🔄 Процессы

### 📨 Процесс Invites

1. **PM создает приглашение**
   - Выбирает проект и исполнителя
   - Заполняет поля: ставка, дата старта, время реализации
   - Прикрепляет файл ТЗ (опционально)
   - Пишет сопроводительное письмо
   - Статус: `pending`

2. **Исполнитель получает уведомление**
   - Видит все детали приглашения
   - Может скачать файл ТЗ
   - Принимает или отклоняет
   - Статус: `accepted_by_executor` или `declined_by_executor`

3. **PM принимает финальное решение**
   - Если исполнитель принял, PM может одобрить или отклонить
   - При одобрении исполнитель добавляется в команду проекта
   - Статус: `accepted_by_pm` или `declined_by_pm`

### 📝 Процесс Applications

1. **Неавторизованный заказчик создает заявку**
   - Заполняет контактную информацию
   - Описывает проект
   - Указывает ставку, дату старта, время реализации
   - Прикрепляет файл ТЗ (опционально)
   - Пишет сопроводительное письмо
   - Статус: `pending`

2. **Админ рассматривает заявку**
   - Видит все детали заявки
   - Может скачать файл ТЗ
   - Выбирает PM для назначения
   - Одобряет или отклоняет заявку

3. **При одобрении создается проект**
   - Автоматически создается новый проект
   - PM назначается менеджером проекта
   - PM получает уведомление
   - Статус: `approved`

---

## 📁 Файловая система

### Структура папок
```
uploads/
├── tech-specs/          # Файлы ТЗ для приглашений
└── applications/        # Файлы ТЗ для заявок (если нужно разделить)
```

### Поддерживаемые форматы файлов
- **Документы:** PDF, DOC, DOCX, TXT
- **Изображения:** JPG, JPEG, PNG, GIF
- **Максимальный размер:** 10 MB

---

## 🧪 Тестирование

### Тестовый файл
Создан файл `test-invites-applications.html` для тестирования всей функциональности:

1. **Applications Tab**
   - Создание заявки без авторизации
   - Все новые поля из скриншота

2. **Invites Tab**
   - Авторизация PM
   - Создание приглашения с файлом ТЗ

3. **Admin Tab**
   - Авторизация админа
   - Просмотр и обработка заявок
   - Назначение PM

### Запуск тестов
```bash
# Запустить сервер
npm start

# Открыть в браузере
open test-invites-applications.html
```

---

## ✅ Реализованные улучшения

### 🆕 Новые поля (согласно скриншоту)
- ✅ **Ставка** - выпадающий список (Договорная/Фиксированная/Почасовая)
- ✅ **Дата старта проекта** - поле даты
- ✅ **Оценочное время реализации** - число + единица времени
- ✅ **Файл ТЗ** - загрузка файлов с валидацией
- ✅ **Сопроводительное письмо** - текстовое поле

### 🔧 Технические улучшения
- ✅ Поддержка загрузки файлов (multer)
- ✅ Валидация типов файлов
- ✅ Безопасное скачивание файлов
- ✅ Обновленная структура данных
- ✅ Правильные роли (pm вместо teamlead)
- ✅ Комплексное тестирование

### 🎯 Логическая корректность
- ✅ Четкое разделение Invites vs Applications
- ✅ Правильные права доступа
- ✅ Двухэтапное подтверждение для приглашений
- ✅ Автоматическое создание проектов из заявок
- ✅ Уведомления для всех участников

---

## 🚀 Готово к использованию

Система полностью обновлена согласно требованиям и скриншоту. Все поля из формы "Предложение" учтены и реализованы как для invites, так и для applications. 