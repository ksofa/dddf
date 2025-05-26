# Firestore Collections Structure for Taska

## users
- id (uid)
- name
- email
- telegramId
- role: ["customer", "executor", "manager", "presale"]
- avatarUrl
- categories: ["designer", "developer", ...]
- createdAt

## projects
- id
- title
- description
- customerId (userId)
- team: [userId]
- status: ["draft", "in_progress", "done", ...]
- createdAt
- updatedAt

## applications (заявки)
- id
- projectId
- userId (кто подал)
- status: ["created", "waiting_executor", "accepted", ...]
- createdAt

## chats
- id
- members: [userId]
- projectId (optional)
- type: "private" | "group"
- createdAt

## messages
- id
- chatId
- senderId
- text
- createdAt
- attachments: [url]

## scrum_boards
- id
- projectId
- tasks: [taskId]

## tasks
- id
- scrumBoardId
- title
- description
- assigneeId
- status: ["todo", "in_progress", "review", "done"]
- priority
- dueDate

---

**Можно расширять по мере необходимости!** 