#!/bin/bash

echo "🔄 Принудительный редеплой на Render..."

# Добавляем небольшое изменение для триггера деплоя
echo "// Force redeploy $(date)" >> src/app.js

# Коммитим изменения
git add .
git commit -m "Force redeploy - fix missing routes"

# Пушим в репозиторий (это автоматически запустит деплой на Render)
git push origin main

echo "✅ Деплой запущен! Проверьте статус на https://dashboard.render.com/"
echo "🔗 После деплоя проверьте: https://dddf-1.onrender.com/api/applications" 