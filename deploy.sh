#!/bin/bash

echo "🚀 Деплой на Netlify..."

# Переходим в папку frontend
cd frontend

# Устанавливаем зависимости
echo "📦 Устанавливаем зависимости..."
npm install

# Собираем проект
echo "🔨 Собираем проект..."
npm run build

# Возвращаемся в корень
cd ..

# Деплоим на Netlify
echo "🌐 Деплоим на Netlify..."
netlify deploy --dir=frontend/dist --prod --open

echo "✅ Деплой завершен!" 