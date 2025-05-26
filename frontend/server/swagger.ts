import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Taska API',
      version: '1.0.0',
      description: 'API для управления проектами и задачами',
    },
    servers: [
      {
        url: 'https://taskjira-production.up.railway.app',
        description: 'Production API сервер',
      },
      {
        url: 'http://localhost:3000',
        description: 'Local API сервер',
      }
    ],
    components: {
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Уникальный идентификатор пользователя',
            },
            telegramId: {
              type: 'string',
              description: 'Telegram ID пользователя',
            },
            username: {
              type: 'string',
              description: 'Имя пользователя в Telegram',
            },
            firstName: {
              type: 'string',
              description: 'Имя пользователя',
            },
            lastName: {
              type: 'string',
              description: 'Фамилия пользователя',
            },
            role: {
              type: 'string',
              enum: ['CUSTOMER', 'EXECUTOR', 'PRESALE_MANAGER', 'PROJECT_MANAGER', 'SUPER_ADMIN'],
              description: 'Роль пользователя',
            },
            executorCategory: {
              type: 'string',
              enum: ['DEVELOPER', 'DESIGNER', 'QA', 'DEVOPS', 'OTHER'],
              description: 'Категория исполнителя (если роль EXECUTOR)',
            },
            balance: {
              type: 'number',
              description: 'Баланс пользователя',
            },
            rating: {
              type: 'number',
              description: 'Рейтинг пользователя',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Дата создания',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Дата обновления',
            },
          },
          required: ['id', 'telegramId', 'username', 'firstName', 'role'],
        },
        Project: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Уникальный идентификатор проекта',
            },
            name: {
              type: 'string',
              description: 'Название проекта',
            },
            description: {
              type: 'string',
              description: 'Описание проекта',
            },
            customerId: {
              type: 'string',
              description: 'ID заказчика',
            },
            presaleManagerId: {
              type: 'string',
              description: 'ID пресейл менеджера',
            },
            projectManagerId: {
              type: 'string',
              description: 'ID проектного менеджера',
            },
            status: {
              type: 'string',
              enum: ['DRAFT', 'PRESALE', 'TEAM_SELECTION', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
              description: 'Статус проекта',
            },
            budget: {
              type: 'number',
              description: 'Бюджет проекта',
            },
            deadline: {
              type: 'string',
              format: 'date-time',
              description: 'Срок завершения проекта',
            },
            team: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  executorId: {
                    type: 'string',
                    description: 'ID исполнителя',
                  },
                  role: {
                    type: 'string',
                    enum: ['DEVELOPER', 'DESIGNER', 'QA', 'DEVOPS', 'OTHER'],
                    description: 'Роль в команде',
                  },
                  rate: {
                    type: 'number',
                    description: 'Ставка исполнителя',
                  },
                  status: {
                    type: 'string',
                    enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
                    description: 'Статус участия в проекте',
                  },
                },
              },
              description: 'Команда проекта',
            },
            stages: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                    description: 'Название этапа',
                  },
                  description: {
                    type: 'string',
                    description: 'Описание этапа',
                  },
                  budget: {
                    type: 'number',
                    description: 'Бюджет этапа',
                  },
                  deadline: {
                    type: 'string',
                    format: 'date-time',
                    description: 'Срок завершения этапа',
                  },
                  status: {
                    type: 'string',
                    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
                    description: 'Статус этапа',
                  },
                },
              },
              description: 'Этапы проекта',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Дата создания',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Дата обновления',
            },
          },
          required: ['id', 'name', 'customerId', 'presaleManagerId', 'status'],
        },
        Task: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Уникальный идентификатор задачи',
            },
            projectId: {
              type: 'string',
              description: 'ID проекта',
            },
            title: {
              type: 'string',
              description: 'Название задачи',
            },
            description: {
              type: 'string',
              description: 'Описание задачи',
            },
            status: {
              type: 'string',
              enum: ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'],
              description: 'Статус задачи',
            },
            priority: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH'],
              description: 'Приоритет задачи',
            },
            assignedTo: {
              type: 'string',
              description: 'ID исполнителя',
            },
            stage: {
              type: 'string',
              description: 'Этап проекта',
            },
            attachments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                    description: 'Название файла',
                  },
                  url: {
                    type: 'string',
                    description: 'URL файла',
                  },
                  type: {
                    type: 'string',
                    description: 'Тип файла',
                  },
                },
              },
              description: 'Вложения',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Дата создания',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Дата обновления',
            },
          },
          required: ['id', 'projectId', 'title', 'status'],
        },
      },
    },
  },
  apis: ['./server/api/routes.ts'],
};

export const swaggerSpec = swaggerJsdoc(options); 