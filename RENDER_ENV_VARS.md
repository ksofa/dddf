# 🔐 Переменные окружения для Render

## Обязательные переменные

При создании Web Service на Render добавьте следующие переменные окружения:

### 1. Основные настройки
```
NODE_ENV=production
PORT=10000
```

### 2. Firebase конфигурация

Вам нужно получить данные из Firebase Console:

#### Шаг 1: Получение данных Firebase
1. Перейдите в [Firebase Console](https://console.firebase.google.com/)
2. Выберите ваш проект
3. Зайдите в **Project Settings** (⚙️ → Project settings)
4. Перейдите на вкладку **Service accounts**
5. Нажмите **Generate new private key**
6. Скачается JSON файл с данными

#### Шаг 2: Извлечение данных из JSON
Из скачанного JSON файла возьмите следующие значения:

```
FIREBASE_PROJECT_ID=ваш-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@ваш-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n
```

### 3. Важные моменты

#### FIREBASE_PRIVATE_KEY
- Это самая сложная переменная
- Содержит многострочный приватный ключ
- В Render нужно вставить **весь ключ в одну строку**
- Замените все переносы строк на `\n`

**Пример правильного формата:**
```
-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n
```

#### FIREBASE_PROJECT_ID
- Обычно это короткое имя проекта
- Например: `dddf-team-management` или `my-project-12345`

#### FIREBASE_CLIENT_EMAIL
- Email сервисного аккаунта
- Формат: `firebase-adminsdk-xxxxx@project-id.iam.gserviceaccount.com`

## 📋 Полный список переменных для Render

```
NODE_ENV=production
PORT=10000
FIREBASE_PROJECT_ID=ваш-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@ваш-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n
```

## 🔧 Как добавить в Render

1. В Render Dashboard откройте ваш Web Service
2. Перейдите в **Environment**
3. Нажмите **Add Environment Variable**
4. Добавьте каждую переменную по очереди:
   - **Key**: `NODE_ENV`, **Value**: `production`
   - **Key**: `PORT`, **Value**: `10000`
   - **Key**: `FIREBASE_PROJECT_ID`, **Value**: ваш project ID
   - **Key**: `FIREBASE_CLIENT_EMAIL`, **Value**: ваш client email
   - **Key**: `FIREBASE_PRIVATE_KEY`, **Value**: ваш private key (в одну строку с \n)

5. Нажмите **Save Changes**
6. Render автоматически перезапустит сервис

## ✅ Проверка

После добавления переменных:
1. Дождитесь завершения деплоя
2. Откройте `https://ваш-сервис.onrender.com/api/health`
3. Должен вернуться JSON: `{"status":"OK","message":"Taska Backend API is running",...}`

## 🐛 Возможные проблемы

### Ошибка "Firebase project not found"
- Проверьте правильность `FIREBASE_PROJECT_ID`

### Ошибка "Invalid private key"
- Убедитесь, что `FIREBASE_PRIVATE_KEY` содержит весь ключ
- Проверьте, что переносы строк заменены на `\n`
- Ключ должен начинаться с `-----BEGIN PRIVATE KEY-----\n`
- И заканчиваться `\n-----END PRIVATE KEY-----\n`

### Ошибка "Client email not found"
- Проверьте правильность `FIREBASE_CLIENT_EMAIL`
- Убедитесь, что сервисный аккаунт активен в Firebase Console 