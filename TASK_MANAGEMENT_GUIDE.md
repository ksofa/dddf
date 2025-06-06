# 📋 Руководство по управлению задачами в Taska

## 🚀 Как получить доступ к управлению задачами

### 1. **Откройте приложение**
- Фронтенд: `http://localhost:5175`
- Бэкенд: `http://localhost:3000`

### 2. **Войдите в систему**
Используйте тестовые аккаунты:
- **PM**: `pm@test.test` / `password123`
- **Исполнитель**: `executor1@test.test` / `password123`

### 3. **Перейдите к проектам**
1. В левом меню нажмите **"Проекты"**
2. Выберите любой проект из списка
3. **Кликните на карточку проекта**

### 4. **Откроется Scrum-доска**
Автоматически откроется доска задач с колонками:
- 🔴 **Бэклог** - новые задачи
- 🟠 **Нужно сделать** - готовые к работе
- 🔵 **В работе** - выполняются
- 🟢 **Правки** - на проверке
- 🟢 **Готово** - завершенные

## 🎯 Функционал управления задачами

### **Для PM (Проект-менеджеров):**
- ✅ **Создание задач** - кнопка "+" в любой колонке
- ✅ **Редактирование задач** - клик на задачу
- ✅ **Назначение исполнителей** - выбор из команды
- ✅ **Установка приоритетов** - низкий/средний/высокий/критический
- ✅ **Установка дедлайнов** - календарь
- ✅ **Перемещение задач** - drag & drop между колонками
- ✅ **Удаление задач** - кнопка удаления
- ✅ **Комментарии** - обсуждение задач
- ✅ **Полный доступ** ко всем задачам проекта

### **Для исполнителей:**
- ✅ **Просмотр задач** - все задачи проекта
- ✅ **Перемещение своих задач** - только назначенные на вас
- ✅ **Комментарии** - обсуждение задач
- ✅ **Обновление статуса** - своих задач
- ❌ Создание/удаление задач (только PM)

### **Для админов:**
- ✅ **Полный доступ** ко всем функциям
- ✅ **Управление всеми проектами**

## 🔧 Технические возможности

### **Drag & Drop**
- Перетаскивайте задачи между колонками
- Автоматическое обновление статуса
- Проверка прав доступа

### **Система комментариев**
- Добавление комментариев к задачам
- Упоминания пользователей (@username)
- История обсуждений

### **Приоритеты и метки**
- 4 уровня приоритета с цветовой кодировкой
- Настраиваемые цвета задач
- Дедлайны с визуальными индикаторами

### **Команда проекта**
- Автоматическая загрузка участников команды
- Назначение задач только участникам
- Аватары и профили пользователей

## 📊 API Endpoints для задач

| Метод | Endpoint | Описание |
|-------|----------|----------|
| `GET` | `/api/projects/{id}/board` | Получить доску задач |
| `POST` | `/api/projects/{id}/tasks` | Создать задачу |
| `PUT` | `/api/projects/{id}/tasks/{taskId}` | Обновить задачу |
| `DELETE` | `/api/projects/{id}/tasks/{taskId}` | Удалить задачу |
| `POST` | `/api/projects/{id}/tasks/{taskId}/comments` | Добавить комментарий |

## 🎨 Интерфейс

### **Цветовая схема колонок:**
- 🔴 Бэклог: `#ED533F`
- 🟠 Нужно сделать: `#DD8227`
- 🔵 В работе: `#2982FD`
- 🟢 Правки/Готово: `#0FB14D`

### **Приоритеты:**
- 🟢 Низкий: `#10B981`
- 🟡 Средний: `#F59E0B`
- 🔴 Высокий: `#EF4444`
- ⚫ Критический: `#7C2D12`

## 🚀 Быстрый старт

1. **Войдите как PM**: `pm@test.test`
2. **Перейдите в "Проекты"**
3. **Кликните на любой проект**
4. **Создайте задачу**: нажмите "+" в колонке "Бэклог"
5. **Заполните форму**:
   - Название задачи
   - Описание
   - Исполнитель (из команды)
   - Дедлайн
   - Приоритет
6. **Сохраните** - задача появится на доске
7. **Перетащите** задачу в другую колонку для изменения статуса

## ✅ Статус: ПОЛНОСТЬЮ РАБОТАЕТ

Все функции управления задачами протестированы и работают корректно:
- ✅ Создание и редактирование задач
- ✅ Drag & Drop перемещение
- ✅ Система комментариев
- ✅ Права доступа по ролям
- ✅ Назначение исполнителей
- ✅ Приоритеты и дедлайны
- ✅ Автоматическое создание дефолтной доски

**Система готова к использованию!** 🎯 