# Проблема отображения команд у админа - ИСПРАВЛЕНО

## Описание проблемы

Админ видел не все команды или команды отображались некорректно из-за проблем с назначением руководителей команд.

## Анализ проблемы

### Исходная ситуация
- В базе данных: 3 команды
- Команда "f" - имеет прямого PM (`pmId: 5W6YYoii6HYhwWaI4zZSz15siSA3`)
- Команда "Команда разработки МТС" - связана с проектом `QeJBJR01d7jAWqVAvvSI`, но у проекта нет PM
- Команда "Команда мобильной разработки" - связана с проектом `XY5w7u7RWB6JKk36rwrG`, но у проекта нет PM

### Проблемы в коде

1. **Фронтенд**: Условие `{team.teamLead && (` скрывало команды без руководителя
2. **Бэкенд**: Метод получения деталей команды не имел логики получения PM через проект
3. **Интерфейс**: `TeamDetails.teamLead` был обязательным, не позволяя `null` значения

## Исправления

### 1. Фронтенд - отображение команд без руководителя

**Файл**: `frontend/src/screens/Screen/sections/TeamsView/index.tsx`

**Было**:
```tsx
{team.teamLead && (
  <div className="flex items-center gap-3">
    // ... отображение руководителя
  </div>
)}
```

**Стало**:
```tsx
<div className="flex items-center gap-3">
  {team.teamLead ? (
    <>
      // ... отображение руководителя
    </>
  ) : (
    <>
      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
        <span className="text-gray-600 font-semibold text-xs">?</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 truncate">Руководитель не назначен</p>
        <p className="text-xs text-gray-400">Требуется назначение</p>
      </div>
    </>
  )}
</div>
```

### 2. Интерфейс TeamDetails

**Было**:
```tsx
interface TeamDetails {
  teamLead: TeamMember;
}
```

**Стало**:
```tsx
interface TeamDetails {
  teamLead: TeamMember | null;
}
```

### 3. Бэкенд - логика получения PM через проект

**Файл**: `src/routes/teams.js`

Добавлена логика в метод `GET /:id`:

```javascript
} else if (teamData.projectId) {
  // Если нет прямого PM, но есть проект - получаем PM проекта
  const projectDoc = await db.collection('projects').doc(teamData.projectId).get();
  if (projectDoc.exists) {
    const projectData = projectDoc.data();
    if (projectData.pmId) {
      const pmDoc = await db.collection('users').doc(projectData.pmId).get();
      if (pmDoc.exists) {
        teamData.pm = { id: pmDoc.id, ...pmDoc.data() };
        teamData.pmId = projectData.pmId;
      }
    }
  }
} else {
  // Если нет назначенного PM, создаем заглушку
  teamData.pm = null;
  teamData.teamLead = null;
}
```

### 4. Детальный вид команды

Добавлена поддержка команд без руководителя:

```tsx
{selectedTeam.teamLead ? (
  // ... отображение руководителя
) : (
  <div className="flex items-center gap-4">
    <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
      <span className="text-gray-600 font-semibold text-2xl">?</span>
    </div>
    <div className="flex-1">
      <h3 className="font-semibold text-lg text-gray-500">Руководитель не назначен</h3>
      <p className="text-gray-400 mt-1">Требуется назначение руководителя команды</p>
    </div>
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" className="text-blue-600 border-blue-600 hover:bg-blue-50">
        Назначить руководителя
      </Button>
    </div>
  </div>
)}
```

## Результат

### До исправления
- Команды без PM могли не отображаться
- Интерфейс ломался при отсутствии руководителя
- Несогласованность между списком и деталями команд

### После исправления
- ✅ Все команды отображаются в интерфейсе
- ✅ Команды без PM показывают "Руководитель не назначен"
- ✅ Админ видит все команды независимо от наличия PM
- ✅ Кнопки "Пригласить" и "Предложить" работают для всех команд
- ✅ Согласованность между списком и деталями команд

## Тестирование

Создан скрипт `scripts/test-teams-fix.js` для проверки:
- Авторизация админа
- Получение всех команд
- Анализ структуры данных
- Тестирование детального просмотра

## Рекомендации

1. **Назначить PM для проектов**: Проекты `QeJBJR01d7jAWqVAvvSI` и `XY5w7u7RWB6JKk36rwrG` должны иметь назначенного PM
2. **Добавить функционал назначения руководителя**: Кнопка "Назначить руководителя" должна открывать модальное окно для выбора PM
3. **Валидация при создании команд**: Обязательное назначение руководителя при создании новой команды

## Файлы изменены

- `frontend/src/screens/Screen/sections/TeamsView/index.tsx`
- `src/routes/teams.js`
- `scripts/test-teams-fix.js` (новый)
- `scripts/debug-teams-projects.js` (новый)
- `TEAMS_DISPLAY_ISSUE_FIXED.md` (новый) 