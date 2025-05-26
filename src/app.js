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
    'https://teal-madeleine-39fdc6.netlify.app',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5176'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
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
app.use('/api', require('./routes/tasks'));
app.use('/api', require('./routes/documents'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api', require('./routes/columns'));

// Frontend integration API (должен быть последним для правильной обработки)
app.use('/api', require('./routes/frontend-api'));

// Test endpoint for frontend connection
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Taska Backend API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app; 