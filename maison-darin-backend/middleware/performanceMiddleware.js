const performanceMonitor = require('../services/performanceMonitor');
const alertingService = require('../services/alertingService');
const logger = require('../utils/logger');

/**
 * Performance monitoring middleware
 */
function performanceMiddleware(req, res, next) {
  const startTime = Date.now();
  
  // Track request start
  req.startTime = startTime;
  
  // Override res.end to capture response metrics
  const originalEnd = res.end;
  res.end = function(...args) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    const success = res.statusCode < 400;
    
    // Record request metrics
    performanceMonitor.recordRequest(responseTime, success);
    
    // Log slow requests
    if (responseTime > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.originalUrl,
        responseTime,
        statusCode: res.statusCode,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
    }
    
    // Call original end method
    originalEnd.apply(this, args);
  };
  
  next();
}

/**
 * Database query performance middleware
 */
function createDatabaseMiddleware(mongoose) {
  // Monitor database queries
  mongoose.set('debug', (collectionName, method, query, doc, options) => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Database query', {
        collection: collectionName,
        method,
        query: JSON.stringify(query),
        options: JSON.stringify(options)
      });
    }
  });

  // Add query timing hooks
  mongoose.plugin(function(schema) {
    schema.pre(/^find/, function() {
      this.startTime = Date.now();
    });

    schema.post(/^find/, function() {
      if (this.startTime) {
        const queryTime = Date.now() - this.startTime;
        performanceMonitor.recordDatabaseQuery(queryTime);
      }
    });

    schema.pre('save', function() {
      this.startTime = Date.now();
    });

    schema.post('save', function() {
      if (this.startTime) {
        const queryTime = Date.now() - this.startTime;
        performanceMonitor.recordDatabaseQuery(queryTime);
      }
    });

    schema.pre('updateOne', function() {
      this.startTime = Date.now();
    });

    schema.post('updateOne', function() {
      if (this.startTime) {
        const queryTime = Date.now() - this.startTime;
        performanceMonitor.recordDatabaseQuery(queryTime);
      }
    });

    schema.pre('deleteOne', function() {
      this.startTime = Date.now();
    });

    schema.post('deleteOne', function() {
      if (this.startTime) {
        const queryTime = Date.now() - this.startTime;
        performanceMonitor.recordDatabaseQuery(queryTime);
      }
    });
  });
}

/**
 * Error tracking middleware
 */
function errorTrackingMiddleware(err, req, res, next) {
  // Record error metrics
  performanceMonitor.recordError(err, {
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    statusCode: res.statusCode
  });
  
  next(err);
}

/**
 * Setup performance monitoring
 */
function setupPerformanceMonitoring(app, mongoose) {
  // Add performance middleware
  app.use(performanceMiddleware);
  
  // Setup database monitoring
  if (mongoose) {
    createDatabaseMiddleware(mongoose);
  }
  
  // Setup alert handling
  performanceMonitor.on('alert', async (alert) => {
    try {
      await alertingService.sendAlert(alert);
    } catch (error) {
      logger.error('Failed to send performance alert', { 
        error: error.message,
        alert: alert.type 
      });
    }
  });
  
  logger.info('Performance monitoring setup completed');
}

/**
 * Get performance metrics endpoint handler
 */
async function getPerformanceMetrics(req, res) {
  try {
    const metrics = performanceMonitor.getMetrics();
    const summary = performanceMonitor.getPerformanceSummary();
    const alertStats = alertingService.getAlertStats();
    
    res.json({
      success: true,
      data: {
        metrics,
        summary,
        alerts: alertStats
      }
    });
  } catch (error) {
    logger.error('Failed to get performance metrics', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'METRICS_ERROR',
        message: 'Failed to retrieve performance metrics'
      }
    });
  }
}

/**
 * Get alert history endpoint handler
 */
async function getAlertHistory(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const severity = req.query.severity;
    
    const history = alertingService.getAlertHistory(limit, severity);
    const stats = alertingService.getAlertStats();
    
    res.json({
      success: true,
      data: {
        alerts: history,
        stats
      }
    });
  } catch (error) {
    logger.error('Failed to get alert history', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'ALERT_HISTORY_ERROR',
        message: 'Failed to retrieve alert history'
      }
    });
  }
}

/**
 * Reset performance metrics endpoint handler
 */
async function resetPerformanceMetrics(req, res) {
  try {
    performanceMonitor.resetMetrics();
    
    logger.info('Performance metrics reset', {
      resetBy: req.user?.email || 'unknown',
      ip: req.ip
    });
    
    res.json({
      success: true,
      message: 'Performance metrics reset successfully'
    });
  } catch (error) {
    logger.error('Failed to reset performance metrics', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'METRICS_RESET_ERROR',
        message: 'Failed to reset performance metrics'
      }
    });
  }
}

/**
 * Update performance thresholds endpoint handler
 */
async function updatePerformanceThresholds(req, res) {
  try {
    const { thresholds } = req.body;
    
    if (!thresholds || typeof thresholds !== 'object') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_THRESHOLDS',
          message: 'Invalid thresholds provided'
        }
      });
    }
    
    performanceMonitor.updateThresholds(thresholds);
    
    logger.info('Performance thresholds updated', {
      thresholds,
      updatedBy: req.user?.email || 'unknown',
      ip: req.ip
    });
    
    res.json({
      success: true,
      message: 'Performance thresholds updated successfully',
      data: {
        thresholds: performanceMonitor.thresholds
      }
    });
  } catch (error) {
    logger.error('Failed to update performance thresholds', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'THRESHOLDS_UPDATE_ERROR',
        message: 'Failed to update performance thresholds'
      }
    });
  }
}

module.exports = {
  performanceMiddleware,
  errorTrackingMiddleware,
  setupPerformanceMonitoring,
  getPerformanceMetrics,
  getAlertHistory,
  resetPerformanceMetrics,
  updatePerformanceThresholds
};