const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { errorHandler } = require('./middleware/errorHandler');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
require('dotenv').config();

const app = express();

// CORS configuration
const corsOptions = {
  origin: [
    'https://dddf-team-management.netlify.app',
    'https://teal-madeleine-39fdc6.netlify.app',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5176'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Cache-Control',
    'Pragma',
    'Expires'
  ]
};

// Middleware
app.use(helmet());
app.use(cors(corsOptions));

// Explicit OPTIONS handler for all routes
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/teams', require('./routes/teams'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/invites', require('./routes/invites'));
app.use('/api', require('./routes/invitations'));
app.use('/api', require('./routes/chats'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api', require('./routes/documents'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api', require('./routes/columns'));

// Frontend integration API
app.use('/api/frontend', require('./routes/frontend-api'));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'DDDF Team Management API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      docs: '/api-docs',
      auth: '/api/auth',
      projects: '/api/projects',
      teams: '/api/teams',
      users: '/api/users'
    },
    message: 'Welcome to DDDF Team Management API'
  });
});

// Test endpoint for frontend connection
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'DDDF Team Management API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Firebase test endpoint
app.get('/api/firebase-test', (req, res) => {
  res.json({
    status: 'Firebase Config Check',
    hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
    hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
    hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
    projectId: process.env.FIREBASE_PROJECT_ID || 'NOT_SET',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 404 handler for unknown routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    availableEndpoints: {
      root: '/',
      health: '/api/health',
      'firebase-test': '/api/firebase-test',
      docs: '/api-docs',
      auth: '/api/auth',
      users: '/api/users',
      teams: '/api/teams',
      applications: '/api/applications',
      projects: '/api/projects',
      invites: '/api/invites',
      invitations: '/api/invitations',
      chats: '/api/chats',
      notifications: '/api/notifications',
      tasks: '/api/tasks',
      documents: '/api/documents',
      categories: '/api/categories',
      columns: '/api/columns',
      frontend: '/api/frontend'
    }
  });
});

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app; 