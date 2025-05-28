#!/bin/bash

echo "🚀 Деплой бэкенда на Render..."

# Проверяем, что мы в правильной директории
if [ ! -f "package.json" ]; then
    echo "❌ Ошибка: package.json не найден. Убедитесь, что вы в корневой директории проекта."
    exit 1
fi

# Проверяем, что все изменения закоммичены
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Есть незакоммиченные изменения. Коммичу их..."
    git add .
    git commit -m "Update for Render deployment"
fi

# Пушим в репозиторий
echo "📤 Пушим изменения в репозиторий..."
git push

echo "✅ Готово! Теперь:"
echo "1. Перейдите на https://render.com"
echo "2. Создайте новый Web Service"
echo "3. Подключите ваш GitHub репозиторий: https://github.com/ksofa/dddf"
echo "4. Render автоматически обнаружит render.yaml и настроит деплой"
echo "5. Добавьте переменные окружения для Firebase в настройках сервиса"

echo ""
echo "🌐 После деплоя обновите VITE_API_URL в Netlify на URL вашего Render сервиса" 