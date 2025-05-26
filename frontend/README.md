# Taska

Taska — платформа для управления проектами, заявками и чатами с real-time функционалом на базе Firebase и современным UI (React + Tailwind).

## Стек
- **Frontend:** React, TailwindCSS
- **Backend:** Firebase (Firestore, Auth)
- **Real-time:** Firestore subscriptions
- **Интеграция с Figma:** MCP server (опционально)

---

## Быстрый старт

```bash
# Клонируйте репозиторий
 git clone <ВАШ_РЕПО>
 cd taska-1

# Установите зависимости
npm install

# Запустите dev-сервер
npm run dev
```

---

## Деплой

Для деплоя на Vercel, Netlify или любой другой хостинг:
1. Соберите проект:
   ```bash
   npm run build
   ```
2. Залейте содержимое папки `dist/` на ваш хостинг.

---

## Интеграция с Figma MCP

1. Получите Figma API Key ([инструкция](https://www.figma.com/developers/api#access-tokens)).
2. Клонируйте и запустите MCP сервер:
   ```bash
   git clone https://github.com/GLips/Figma-Context-MCP.git
   cd Figma-Context-MCP
   npm install
   npx -y figma-developer-mcp --figma-api-key=ВАШ_ТОКЕН --port=1981
   ```
3. Используйте Cursor или curl для получения компонентов из Figma.

---

## Основные команды npm

- `npm run dev` — запуск dev-сервера
- `npm run build` — сборка production-версии

---

## Swagger (OpenAPI) — основные методы

### Auth
- `POST /api/register` — регистрация пользователя
- `POST /api/login` — вход пользователя

### Projects
- `POST /api/projects` — создать проект
- `GET /api/projects` — получить список проектов

### Applications
- `POST /api/applications` — создать заявку
- `GET /api/applications` — получить список заявок

### Chats
- `POST /api/chats` — создать чат
- `POST /api/messages` — отправить сообщение
- `GET /api/chats` — получить список чатов
- `GET /api/messages?chatId=...` — получить сообщения чата

> **Примечание:** Все методы реализованы через Firestore и доступны через соответствующие API-модули в `src/api/`.

---

## Инструкции по запуску и разработке

1. Настройте файл `src/firebase.ts` с вашими ключами Firebase.
2. Запустите проект (`npm run dev`).
3. Для интеграции с Figma — настройте MCP сервер и используйте Cursor или curl.

---

## Контакты
- [Figma макет](https://www.figma.com/design/sDEo5isuWUhCJs3VZ1dV16/%D0%9E%D1%82%D0%BC%D1%8B%D1%87%D0%BA%D0%B0---Taska--Copy-?node-id=0-1)
- [MCP сервер](https://github.com/GLips/Figma-Context-MCP)