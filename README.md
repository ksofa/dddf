# Taska Backend API

Backend API for the Taska platform - a digital team aggregator platform.

## Features

- User authentication and authorization
- Project management
- Team management
- Task management with Scrum board
- Real-time chat system
- File management
- Notifications system
- Activity logging

## Prerequisites

- Node.js >= 14.0.0
- npm or yarn
- Firebase project with Firestore database

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd taska-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# JWT Configuration
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=24h

# File Upload Configuration
MAX_FILE_SIZE=10485760 # 10MB in bytes
UPLOAD_DIR=uploads
```

4. Set up Firebase:
   - Create a new Firebase project
   - Enable Firestore database
   - Generate a new private key for service account
   - Update the Firebase configuration in `src/config/firebase.js`

## Running the Application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Documentation

### Authentication
- POST /api/auth/register - Register a new user
- POST /api/auth/login - Login user
- GET /api/auth/profile - Get current user profile

### Users
- GET /api/users - Get list of users
- GET /api/users/:userId - Get user details
- PUT /api/users/:userId - Update user
- GET /api/users/statistics - Get user statistics

### Projects
- POST /api/projects - Create new project
- GET /api/projects - Get list of projects
- GET /api/projects/:projectId - Get project details
- PUT /api/projects/:projectId - Update project
- DELETE /api/projects/:projectId - Delete project

### Tasks
- GET /api/projects/:projectId/tasks - Get project tasks
- POST /api/projects/:projectId/tasks - Create new task
- PUT /api/projects/:projectId/tasks/:taskId - Update task
- DELETE /api/projects/:projectId/tasks/:taskId - Delete task

### Chats
- GET /api/projects/:projectId/chats - Get project chats
- POST /api/projects/:projectId/chats - Create new chat
- GET /api/projects/:projectId/chats/:chatId/messages - Get chat messages
- POST /api/projects/:projectId/chats/:chatId/messages - Send message
- POST /api/projects/:projectId/chats/:chatId/read - Mark messages as read

### Documents
- GET /api/projects/:projectId/documents - Get project documents
- POST /api/projects/:projectId/documents - Upload document
- DELETE /api/projects/:projectId/documents/:documentId - Delete document

### Notifications
- GET /api/notifications - Get user notifications
- POST /api/notifications/mark-read - Mark notifications as read

## Error Handling

The API uses standard HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Security

- All routes are protected with authentication middleware
- Role-based access control for different user types
- Input validation using express-validator
- Helmet for security headers
- CORS configuration
- Rate limiting (to be implemented)

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the ISC License. 