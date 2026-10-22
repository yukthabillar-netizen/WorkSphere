const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const config = require('./config/env');
const errorHandler = require('./middleware/error');
const { apiLimiter } = require('./middleware/rateLimit');
const auth = require('./middleware/auth');
const { requireWorkspaceMember } = require('./middleware/role');

// Routes
const authRoutes = require('./routes/authRoutes');
const workspaceRoutes = require('./routes/workspaceRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const commentRoutes = require('./routes/commentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const searchRoutes = require('./routes/searchRoutes');
const inviteRoutes = require('./routes/inviteRoutes');
const dashboardController = require('./controllers/dashboardController');

const app = express();

// Security HTTP headers
app.use(helmet());

// Logging
if (config.env !== 'test') {
  app.use(morgan('dev'));
}

// CORS setup
app.use(
  cors({
    origin: [config.clientUrl, 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body and cookie parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Global API Rate Limiter
app.use('/api', apiLimiter);

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API v1 Routes
const apiV1 = express.Router();

apiV1.use('/auth', authRoutes);
apiV1.use('/workspaces', workspaceRoutes);
// Mount projects under workspace as well
apiV1.use('/workspaces/:wid/projects', projectRoutes);
// Dashboard route under workspace
apiV1.get('/workspaces/:id/dashboard', auth, requireWorkspaceMember(), dashboardController.getWorkspaceDashboard);

apiV1.use('/projects', projectRoutes);
// Mount tasks under project
apiV1.use('/projects/:pid/tasks', taskRoutes);

apiV1.use('/tasks', taskRoutes);
apiV1.use('/comments', commentRoutes);
apiV1.use('/notifications', notificationRoutes);
apiV1.use('/search', searchRoutes);
apiV1.use('/invites', inviteRoutes);

app.use('/api/v1', apiV1);

// 404 handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found`,
  });
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
