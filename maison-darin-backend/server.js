// Load environment variables first
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const dbConnection = require('./config/database');
const databaseService = require('./services/databaseService');
const { apiLimiter, corsOptions, helmetOptions } = require('./config/security');
const { validateEnv } = require('./utils/validateEnv');
const { 
  globalErrorHandler, 
  handleUnhandledRejection, 
  handleUncaughtException,
  handleGracefulShutdown 
} = require('./middleware/errorHandler');
const { 
  setupPerformanceMonitoring,
  errorTrackingMiddleware 
} = require('./middleware/performanceMiddleware');
const PerformanceOptimization = require('./middleware/performanceOptimization');
const QueryOptimizer = require('./utils/queryOptimizer');
const cacheService = require('./services/cacheService');
const { NotFoundError } = require('./utils/errors');
const { specs, swaggerUi, swaggerOptions } = require('./config/swagger');

// Validate environment variables on startup
try {
  validateEnv();
  console.log('✅ Environment variables validated successfully');
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
} catch (error) {
  console.error('❌ Environment validation failed:', error.message);
  process.exit(1);
}

const app = express();

// Performance optimization middleware (must be first)
app.use(PerformanceOptimization.getCompressionMiddleware());
app.use(PerformanceOptimization.getRequestOptimizationMiddleware());

// Security middleware
app.use(helmet(helmetOptions));

// CORS configuration
console.log('🔧 CORS configuration loaded for environment:', process.env.NODE_ENV || 'development');
app.use(cors(corsOptions));

// Rate limiting for API routes
app.use('/api/', apiLimiter);

// Body parsing middleware - Increased limits for image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb', parameterLimit: 10000 }));

// Additional performance middleware
app.use(PerformanceOptimization.getDatabaseOptimizationMiddleware());
app.use(PerformanceOptimization.getMemoryMonitoringMiddleware());
app.use(PerformanceOptimization.getStaticFileOptimizationMiddleware());
app.use(PerformanceOptimization.getCacheMiddleware());

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Setup performance monitoring
setupPerformanceMonitoring(app, mongoose);

// Health check routes
const statusRoutes = require('./routes/status');
app.use('/api/status', statusRoutes);

// Legacy health check endpoint for backward compatibility
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await databaseService.healthCheck();
    const cacheHealth = await cacheService.healthCheck();
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbHealth
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
const categoryRoutes = require('./routes/categories');
const mediaRoutes = require('./routes/media');
const orderRoutes = require('./routes/orders');
const customerRoutes = require('./routes/customers');
const paymentRoutes = require('./routes/payments');
const paypalRoutes = require('./routes/paypal');
const siteSettingsRoutes = require('./routes/siteSettings');
const contentRoutes = require('./routes/content');
const dashboardRoutes = require('./routes/dashboard');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/paypal', paypalRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/contact', require('./routes/contact'));
app.use('/api/samples', require('./routes/samples'));
app.use('/api/media', mediaRoutes);
app.use('/api/homepage', require('./routes/homePageRoutes'));
app.use('/api/site-settings', siteSettingsRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/public', require('./routes/publicSettings'));
app.use('/api/admin/dashboard', dashboardRoutes);

// Performance monitoring endpoint
app.get('/api/admin/performance', (req, res) => {
  try {
    const stats = PerformanceOptimization.getPerformanceStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Swagger API Documentation
if (process.env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));
  
  // Redirect /docs to /api-docs for convenience
  app.get('/docs', (req, res) => {
    res.redirect('/api-docs');
  });
}

// API routes placeholder
app.get('/api', (req, res) => {
  res.json({
    message: 'Maison Darin API Server',
    version: '1.0.0',
    status: 'running',
    documentation: process.env.NODE_ENV !== 'production' ? '/api-docs' : 'Contact admin for API documentation'
  });
});

// 404 handler - convert to NotFoundError
app.use('*', (req, res, next) => {
  next(new NotFoundError(`Route ${req.originalUrl} not found`));
});

// Error tracking middleware
app.use(errorTrackingMiddleware);

// Global error handler
app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;

// Set up process error handlers
handleUnhandledRejection();
handleUncaughtException();

// Initialize database connection and start server
async function startServer() {
  try {
    // Connect to database using enhanced service
    await databaseService.connect();
    
    // Initialize database indexes for performance
    await QueryOptimizer.createOptimalIndexes();
    
    // Warm up cache with common data
    await warmUpCache();
    
    if (process.env.NODE_ENV !== 'test') {
      const server = app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`📡 Health check: http://localhost:${PORT}/health`);
        console.log(`⚡ Performance optimizations enabled`);
      });

      // Set up graceful shutdown handlers
      handleGracefulShutdown(server);
      
      return server;
    }
  } catch (error) {
    console.error('💥 Failed to start server:', error);
    process.exit(1);
  }
}

// Warm up cache with frequently accessed data
async function warmUpCache() {
  try {
    const Product = require('./models/Product');
    const Customer = require('./models/Customer');
    const Order = require('./models/Order');
    
    const warmUpFunctions = [
      {
        key: 'dashboard:stats',
        fn: async () => {
          const [productCount, customerCount, orderCount] = await Promise.all([
            Product.countDocuments({ isActive: true }),
            Customer.countDocuments(),
            Order.countDocuments()
          ]);
          return { productCount, customerCount, orderCount };
        },
        ttl: 300000 // 5 minutes
      },
      {
        key: 'products:featured',
        fn: async () => Product.find({ isActive: true, featured: true }).limit(10).lean(),
        ttl: 600000 // 10 minutes
      },
      {
        key: 'categories:active',
        fn: async () => {
          const Category = require('./models/Category');
          return Category.find({ isActive: true }).lean();
        },
        ttl: 900000 // 15 minutes
      }
    ];
    
    await cacheService.warmUp(warmUpFunctions);
    console.log('✅ Cache warmed up successfully');
  } catch (error) {
    console.error('⚠️ Cache warm-up failed:', error.message);
  }
}

// Start the server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;