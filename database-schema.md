# Обновленная схема БД для Taska

## Роли системы
- `customer` (Заказчик) - создает проекты, отслеживает прогресс
- `executor` (Исполнитель) - выполняет задачи, принимает приглашения  
- `pm` (Project Manager) - управляет проектами и командами
- `admin` (Пресейл-менеджер) - назначает PM, курирует старт проектов

## Коллекция users
```javascript
{
  uid: string,
  fullName: string,
  email: string,
  phone: string,
  roles: ["customer" | "executor" | "pm" | "admin"], // Основные роли
  categories: string[], // Для executor: ["frontend", "backend", "designer", "qa", "devops"]
  specialization: string, // Детальная специализация
  profileImage: string,
  contactInfo: {
    telegram: string,
    phone: string
  },
  rating: number, // Для executor
  experienceYears: number, // Для executor
  verified: boolean,
  createdAt: timestamp,
  updatedAt: timestamp
}

// Подколлекции:
// - notifications: уведомления пользователя
```

## Коллекция projects
```javascript
{
  id: string,
  title: string,
  description: string,
  status: "pre_project" | "in_progress" | "completed" | "cancelled",
  stage: number, // Этап проекта (1-5)
  
  // Участники
  customerId: string, // ID заказчика (customer)
  adminId: string, // ID админа, курирующего проект (admin) 
  pmId: string, // ID назначенного PM (pm)
  teamMembers: string[], // Массив ID исполнителей (executor)
  
  // Метаданные
  budget: number,
  deadline: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp,
  createdBy: string,
  
  // Дополнительная информация
  techSpec: string,
  clientInfo: {
    company: string,
    contact: string,
    email: string,
    phone: string
  }
}

// Подколлекции:
// - tasks: задачи проекта (Kanban)
// - documents: документы проекта  
// - activity: лог активности
// - columns: колонки Kanban доски
// - chats: чаты проекта
```

## Коллекция invites
```javascript
{
  id: string,
  projectId: string,
  executorId: string, // Кого приглашают (executor)
  pmId: string, // Кто приглашает (pm)
  
  role: string, // Роль в проекте
  description: string,
  estimatedHours: number,
  hourlyRate: number,
  
  status: "pending" | "accepted_by_executor" | "accepted_by_pm" | "declined_by_executor" | "declined_by_pm",
  
  executorResponseAt: timestamp,
  executorResponseComment: string,
  pmResponseAt: timestamp, 
  pmResponseComment: string,
  
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Коллекция categories
```javascript
{
  id: string,
  name: string, // "Frontend разработчик", "UI/UX дизайнер"
  type: "technical" | "design" | "management" | "other",
  description: string,
  createdAt: timestamp,
  createdBy: string // admin who created
}
```

## Права доступа по ролям

### customer (Заказчик)
- Создание проектов
- Просмотр своих проектов
- Общение в чатах своих проектов
- Просмотр прогресса и документов
- Управление финансами

### executor (Исполнитель)  
- Просмотр приглашений
- Принятие/отклонение приглашений
- Работа с задачами в назначенных проектах
- Общение в чатах команды
- Загрузка документов

### pm (Project Manager)
- Управление назначенными проектами
- Приглашение исполнителей в команду
- Создание и управление задачами
- Общение во всех чатах проекта
- Управление документами проекта

### admin (Пресейл-менеджер)
- Просмотр всех проектов
- Назначение PM на проекты
- Управление пользователями и ролями
- Управление категориями исполнителей
- Доступ ко всей аналитике 