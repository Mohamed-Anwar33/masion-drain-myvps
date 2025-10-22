const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const { apiLimiter, corsOptions, helmetOptions } = require('./config/security');
const { 
  globalErrorHandler, 
  handleUnhandledRejection, 
  handleUncaughtException,
  handleGracefulShutdown 
} = require('./middleware/errorHandler');
const { NotFoundError } = require('./utils/errors');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet(helmetOptions));

// CORS configuration
app.use(cors(corsOptions));

// Rate limiting for API routes
app.use('/api/', apiLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware (only in non-test environments)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Health check routes
const healthRoutes = require('./routes/health');
app.use('/api/health', healthRoutes);

// Legacy health check endpoint for backward compatibility
app.get('/health', async (req, res) => {
  try {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: { status: 'healthy' }
    });
  } catch (error) {
    res.status(503).json({
      status: 'Service Unavailable',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: 'unhealthy',
        error: error.message
      }
    });
  }
});

// API routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const mediaRoutes = require('./routes/media');
const contentRoutes = require('./routes/content');
const orderRoutes = require('./routes/orders');
const sampleRoutes = require('./routes/samples');
const contactRoutes = require('./routes/contact');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/samples', sampleRoutes);
app.use('/api/contact', contactRoutes);

// API routes placeholder
app.get('/api', (req, res) => {
  res.json({
    message: 'Maison Darin API Server',
    version: '1.0.0',
    status: 'running',
    documentation: '/api-docs'
  });
});

// 404 handler - convert to NotFoundError
app.use('*', (req, res, next) => {
  next(new NotFoundError(`Route ${req.originalUrl} not found`));
});

// Global error handler
app.use(globalErrorHandler);

module.exports = app;