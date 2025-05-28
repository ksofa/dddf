# 🚀 Инструкция по деплою DDDF Team Management

## ✅ Статус деплоя

### Frontend (Netlify)
- **URL**: https://dddf-team-management.netlify.app
- **Статус**: ✅ Задеплоен и работает
- **Автодеплой**: Настроен из ветки main

### Backend (Render)
- **Статус**: 🔄 Готов к деплою
- **Конфигурация**: render.yaml готов

## 📋 Пошаговая инструкция деплоя бэкенда на Render

### 1. Создание сервиса на Render

1. Перейдите на https://render.com
2. Войдите в аккаунт или зарегистрируйтесь
3. Нажмите "New +" → "Web Service"
4. Выберите "Build and deploy from a Git repository"
5. Подключите GitHub аккаунт, если не подключен
6. Найдите и выберите репозиторий: `ksofa/dddf`

### 2. Настройка сервиса

Render автоматически обнаружит `render.yaml` и предложит настройки:

- **Name**: `dddf-backend` (или любое другое)
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: Free (для тестирования)

### 3. Переменные окружения

В разделе "Environment Variables" добавьте:

```
NODE_ENV=production
PORT=10000
```

**Важно**: Также нужно добавить переменные для Firebase:
- Скопируйте содержимое файла `serviceAccountKey.json`
- Добавьте как переменную окружения или загрузите файл

### 4. Деплой

1. Нажмите "Create Web Service"
2. Render начнет автоматический деплой
3. Дождитесь завершения (обычно 2-5 минут)
4. Получите URL вашего сервиса (например: `https://dddf-backend.onrender.com`)

### 5. Обновление фронтенда

После успешного деплоя бэкенда:

1. Перейдите в Netlify: https://app.netlify.com/projects/dddf-team-management
2. Зайдите в "Site settings" → "Environment variables"
3. Обновите `VITE_API_URL` на URL вашего Render сервиса
4. Запустите новый деплой фронтенда

### 6. Проверка работы

1. Откройте ваш Render URL + `/api/health`
2. Должен вернуться JSON с статусом "OK"
3. Проверьте работу фронтенда на Netlify

## 🔧 Альтернативные платформы

### Railway
- Файл `railway.toml` уже готов
- Аналогичный процесс деплоя

### Heroku
- Файл `Procfile` уже готов
- Требует настройки buildpacks для Node.js

## 🐛 Возможные проблемы

### CORS ошибки
- Убедитесь, что Netlify URL добавлен в CORS настройки
- Проверьте файл `src/app.js`, строки 14-22

### Firebase ошибки
- Убедитесь, что переменные окружения Firebase настроены
- Проверьте права доступа к Firebase проекту

### Медленная работа на Free плане
- Free план Render "засыпает" после 15 минут неактивности
- Первый запрос может быть медленным (cold start)

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи в Render Dashboard
2. Убедитесь, что все переменные окружения настроены
3. Проверьте статус сервисов в Netlify и Render 