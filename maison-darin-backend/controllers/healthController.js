const databaseService = require('../services/databaseService');
const logger = require('../utils/logger');

/**
 * Health check controller for monitoring system status
 */
class HealthController {
  /**
   * Basic health check endpoint
   * GET /api/health
   */
  static async healthCheck(req, res) {
    try {
      const startTime = Date.now();
      
      // Check database health
      const dbHealth = await databaseService.healthCheck();
      
      // Check system resources
      const systemHealth = {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        version: process.version,
        platform: process.platform
      };

      const responseTime = Date.now() - startTime;
      const isHealthy = dbHealth.status === 'healthy';

      const healthStatus = {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime,
        services: {
          database: dbHealth,
          system: systemHealth
        },
        environment: process.env.NODE_ENV || 'development'
      };

      // Return appropriate status code
      const statusCode = isHealthy ? 200 : 503;
      
      res.status(statusCode).json({
        success: isHealthy,
        data: healthStatus
      });

    } catch (error) {
      logger.error('Health check failed', { error: error.message });
      
      res.status(503).json({
        success: false,
        error: {
          code: 'HEALTH_CHECK_FAILED',
          message: 'Health check failed',
          details: error.message
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Detailed health check with database statistics
   * GET /api/health/detailed
   */
  static async detailedHealthCheck(req, res) {
    try {
      const startTime = Date.now();
      
      // Get comprehensive database health and stats
      const [dbHealth, dbStats] = await Promise.allSettled([
        databaseService.healthCheck(),
        databaseService.getStats()
      ]);

      // System information
      const systemInfo = {
        uptime: process.uptime(),
        memory: {
          ...process.memoryUsage(),
          free: require('os').freemem(),
          total: require('os').totalmem()
        },
        cpu: {
          usage: process.cpuUsage(),
          count: require('os').cpus().length,
          loadAvg: require('os').loadavg()
        },
        version: process.version,
        platform: process.platform,
        arch: process.arch,
        nodeEnv: process.env.NODE_ENV
      };

      const responseTime = Date.now() - startTime;
      const isDatabaseHealthy = dbHealth.status === 'fulfilled' && dbHealth.value.status === 'healthy';

      const detailedHealth = {
        status: isDatabaseHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime,
        services: {
          database: {
            health: dbHealth.status === 'fulfilled' ? dbHealth.value : { 
              status: 'error', 
              error: dbHealth.reason?.message 
            },
            stats: dbStats.status === 'fulfilled' ? dbStats.value : {
              error: dbStats.reason?.message
            }
          },
          system: systemInfo
        },
        environment: process.env.NODE_ENV || 'development'
      };

      const statusCode = isDatabaseHealthy ? 200 : 503;
      
      res.status(statusCode).json({
        success: isDatabaseHealthy,
        data: detailedHealth
      });

    } catch (error) {
      logger.error('Detailed health check failed', { error: error.message });
      
      res.status(503).json({
        success: false,
        error: {
          code: 'DETAILED_HEALTH_CHECK_FAILED',
          message: 'Detailed health check failed',
          details: error.message
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Database-specific health check
   * GET /api/health/database
   */
  static async databaseHealthCheck(req, res) {
    try {
      const dbHealth = await databaseService.healthCheck();
      const connectionStatus = databaseService.getConnectionStatus();
      const circuitBreakerStatus = databaseService.getCircuitBreakerStatus();

      const isHealthy = dbHealth.status === 'healthy' && circuitBreakerStatus.allowsOperations;
      const statusCode = isHealthy ? 200 : 503;

      res.status(statusCode).json({
        success: isHealthy,
        data: {
          health: dbHealth,
          connection: connectionStatus,
          circuitBreaker: circuitBreakerStatus,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Database health check failed', { error: error.message });
      
      res.status(503).json({
        success: false,
        error: {
          code: 'DATABASE_HEALTH_CHECK_FAILED',
          message: 'Database health check failed',
          details: error.message
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Circuit breaker status endpoint
   * GET /api/health/circuit-breaker
   */
  static async circuitBreakerStatus(req, res) {
    try {
      const circuitBreakerStatus = databaseService.getCircuitBreakerStatus();
      
      res.status(200).json({
        success: true,
        data: circuitBreakerStatus,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Circuit breaker status check failed', { error: error.message });
      
      res.status(500).json({
        success: false,
        error: {
          code: 'CIRCUIT_BREAKER_STATUS_FAILED',
          message: 'Failed to get circuit breaker status',
          details: error.message
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Reset circuit breaker (admin endpoint)
   * POST /api/health/circuit-breaker/reset
   */
  static async resetCircuitBreaker(req, res) {
    try {
      databaseService.forceCircuitBreakerReset();
      const circuitBreakerStatus = databaseService.getCircuitBreakerStatus();
      
      logger.info('Circuit breaker manually reset', {
        resetBy: req.user?.email || 'unknown',
        ip: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'Circuit breaker reset successfully',
        data: circuitBreakerStatus,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Circuit breaker reset failed', { error: error.message });
      
      res.status(500).json({
        success: false,
        error: {
          code: 'CIRCUIT_BREAKER_RESET_FAILED',
          message: 'Failed to reset circuit breaker',
          details: error.message
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Readiness probe for Kubernetes/Docker
   * GET /api/health/ready
   */
  static async readinessProbe(req, res) {
    try {
      const dbHealth = await databaseService.healthCheck();
      const isReady = dbHealth.status === 'healthy';

      if (isReady) {
        res.status(200).json({
          status: 'ready',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(503).json({
          status: 'not ready',
          reason: 'Database not healthy',
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      res.status(503).json({
        status: 'not ready',
        reason: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Liveness probe for Kubernetes/Docker
   * GET /api/health/live
   */
  static async livenessProbe(req, res) {
    try {
      // Simple check that the application is running
      res.status(200).json({
        status: 'alive',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(503).json({
        status: 'dead',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = HealthController;