const compression = require('compression');
const helmet = require('helmet');
const cacheService = require('../services/cacheService');
const QueryOptimizer = require('../utils/queryOptimizer');
const logger = require('../utils/logger');

/**
 * Performance optimization middleware
 */
class PerformanceOptimization {
  /**
   * Compression middleware with custom configuration
   */
  static getCompressionMiddleware() {
    return compression({
      // Compression level (1-9, 6 is default)
      level: 6,
      // Minimum response size to compress (in bytes)
      threshold: 1024,
      // Filter function to determine what to compress
      filter: (req, res) => {
        // Don't compress if client doesn't support it
        if (req.headers['x-no-compression']) {
          return false;
        }
        
        // Use compression filter function
        return compression.filter(req, res);
      }
      // Remove strategy option as it may not be available in all versions
    });
  }

  /**
   * Response caching middleware
   */
  static getCacheMiddleware(defaultTTL = 300000) { // 5 minutes default
    return (req, res, next) => {
      // Only cache GET requests
      if (req.method !== 'GET') {
        return next();
      }

      // Skip caching for admin routes or authenticated requests
      if (req.path.includes('/admin') || req.headers.authorization) {
        return next();
      }

      const cacheKey = `response:${req.originalUrl}`;
      const cached = cacheService.get(cacheKey);

      if (cached) {
        logger.debug('Serving cached response', { url: req.originalUrl });
        res.set(cached.headers);
        res.set('X-Cache', 'HIT');
        return res.status(cached.status).json(cached.data);
      }

      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function(data) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const cacheData = {
            status: res.statusCode,
            headers: res.getHeaders(),
            data
          };
          
          // Determine TTL based on route
          let ttl = defaultTTL;
          if (req.path.includes('/products')) {
            ttl = 600000; // 10 minutes for products
          } else if (req.path.includes('/dashboard')) {
            ttl = 60000; // 1 minute for dashboard
          }
          
          cacheService.set(cacheKey, cacheData, ttl);
          logger.debug('Response cached', { url: req.originalUrl, ttl });
        }
        
        res.set('X-Cache', 'MISS');
        return originalJson.call(this, data);
      };

      next();
    };
  }

  /**
   * Request optimization middleware
   */
  static getRequestOptimizationMiddleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      
      // Add request ID for tracking
      req.requestId = Math.random().toString(36).substr(2, 9);
      
      // Set response headers for optimization
      res.set({
        'X-Request-ID': req.requestId,
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
      });

      // Override res.end to log performance metrics
      const originalEnd = res.end;
      res.end = function(...args) {
        const duration = Date.now() - startTime;
        
        // Log slow requests
        if (duration > 1000) {
          logger.warn('Slow request detected', {
            requestId: req.requestId,
            method: req.method,
            url: req.originalUrl,
            duration,
            statusCode: res.statusCode,
            userAgent: req.get('User-Agent')
          });
        }
        
        // Add performance headers
        res.set('X-Response-Time', `${duration}ms`);
        
        return originalEnd.apply(this, args);
      };

      next();
    };
  }

  /**
   * Database query optimization middleware
   */
  static getDatabaseOptimizationMiddleware() {
    return (req, res, next) => {
      // Add query optimizer to request object
      req.queryOptimizer = QueryOptimizer;
      
      // Monitor database operations
      const originalQuery = req.query;
      req.query = new Proxy(originalQuery, {
        get(target, prop) {
          if (prop === 'limit') {
            // Ensure reasonable limits
            const limit = parseInt(target[prop]) || 20;
            return Math.min(limit, 100);
          }
          if (prop === 'page') {
            // Ensure positive page numbers
            const page = parseInt(target[prop]) || 1;
            return Math.max(page, 1);
          }
          return target[prop];
        }
      });

      next();
    };
  }

  /**
   * Memory usage monitoring middleware
   */
  static getMemoryMonitoringMiddleware() {
    let requestCount = 0;
    
    return (req, res, next) => {
      requestCount++;
      
      // Check memory usage every 100 requests
      if (requestCount % 100 === 0) {
        const memUsage = process.memoryUsage();
        const memUsageMB = {
          rss: Math.round(memUsage.rss / 1024 / 1024),
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
          external: Math.round(memUsage.external / 1024 / 1024)
        };
        
        logger.info('Memory usage check', {
          requestCount,
          memoryUsage: memUsageMB,
          cacheStats: cacheService.getStats()
        });
        
        // Warn if memory usage is high
        if (memUsageMB.heapUsed > 500) { // 500MB threshold
          logger.warn('High memory usage detected', { memoryUsage: memUsageMB });
          
          // Force garbage collection if available
          if (global.gc) {
            global.gc();
            logger.info('Garbage collection triggered');
          }
        }
      }

      next();
    };
  }

  /**
   * Static file optimization middleware
   */
  static getStaticFileOptimizationMiddleware() {
    return (req, res, next) => {
      // Set cache headers for static files
      if (req.path.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
        // Cache static files for 1 year
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        
        // Add ETag for better caching
        res.set('ETag', `"${Date.now()}"`);
        
        // Handle conditional requests
        if (req.headers['if-none-match'] === res.get('ETag')) {
          return res.status(304).end();
        }
      }

      next();
    };
  }

  /**
   * API rate limiting with performance considerations
   */
  static getSmartRateLimitingMiddleware() {
    const requestCounts = new Map();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxRequests = 1000; // per window
    
    return (req, res, next) => {
      const clientId = req.ip || req.connection.remoteAddress;
      const now = Date.now();
      const windowStart = now - windowMs;
      
      // Clean old entries
      for (const [id, requests] of requestCounts.entries()) {
        const filteredRequests = requests.filter(time => time > windowStart);
        if (filteredRequests.length === 0) {
          requestCounts.delete(id);
        } else {
          requestCounts.set(id, filteredRequests);
        }
      }
      
      // Check current client
      const clientRequests = requestCounts.get(clientId) || [];
      const recentRequests = clientRequests.filter(time => time > windowStart);
      
      if (recentRequests.length >= maxRequests) {
        logger.warn('Rate limit exceeded', {
          clientId,
          requests: recentRequests.length,
          maxRequests,
          windowMs
        });
        
        return res.status(429).json({
          error: 'Too many requests',
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }
      
      // Add current request
      recentRequests.push(now);
      requestCounts.set(clientId, recentRequests);
      
      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': maxRequests,
        'X-RateLimit-Remaining': maxRequests - recentRequests.length,
        'X-RateLimit-Reset': new Date(now + windowMs).toISOString()
      });

      next();
    };
  }

  /**
   * Get all performance middleware in correct order
   */
  static getAllMiddleware() {
    return [
      this.getCompressionMiddleware(),
      this.getRequestOptimizationMiddleware(),
      this.getDatabaseOptimizationMiddleware(),
      this.getMemoryMonitoringMiddleware(),
      this.getStaticFileOptimizationMiddleware(),
      this.getCacheMiddleware(),
      this.getSmartRateLimitingMiddleware()
    ];
  }

  /**
   * Get performance statistics
   */
  static getPerformanceStats() {
    const memUsage = process.memoryUsage();
    
    return {
      uptime: process.uptime(),
      memoryUsage: {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024)
      },
      cacheStats: cacheService.getStats(),
      cpuUsage: process.cpuUsage(),
      nodeVersion: process.version,
      platform: process.platform
    };
  }
}

module.exports = PerformanceOptimization;