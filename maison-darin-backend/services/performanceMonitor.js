const EventEmitter = require('events');
const os = require('os');
const logger = require('../utils/logger');

class PerformanceMonitor extends EventEmitter {
  constructor() {
    super();
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        averageResponseTime: 0,
        responseTimes: []
      },
      system: {
        cpu: 0,
        memory: 0,
        uptime: 0
      },
      database: {
        connections: 0,
        queries: 0,
        averageQueryTime: 0,
        queryTimes: []
      },
      errors: {
        total: 0,
        byType: {},
        recent: []
      }
    };
    
    this.thresholds = {
      responseTime: 5000, // 5 seconds
      errorRate: 0.05,    // 5%
      cpuUsage: 80,       // 80%
      memoryUsage: 85,    // 85%
      dbQueryTime: 1000   // 1 second
    };
    
    this.alertCooldown = new Map();
    this.alertCooldownPeriod = 5 * 60 * 1000; // 5 minutes
    
    this.startSystemMonitoring();
  }

  /**
   * Start system resource monitoring
   */
  startSystemMonitoring() {
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000); // Every 30 seconds
  }

  /**
   * Collect system metrics
   */
  collectSystemMetrics() {
    try {
      // CPU usage
      const cpus = os.cpus();
      let totalIdle = 0;
      let totalTick = 0;

      cpus.forEach(cpu => {
        for (const type in cpu.times) {
          totalTick += cpu.times[type];
        }
        totalIdle += cpu.times.idle;
      });

      const idle = totalIdle / cpus.length;
      const total = totalTick / cpus.length;
      const cpuUsage = 100 - ~~(100 * idle / total);

      // Memory usage
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const memoryUsage = (usedMem / totalMem) * 100;

      // Update metrics
      this.metrics.system = {
        cpu: cpuUsage,
        memory: memoryUsage,
        uptime: process.uptime(),
        loadAverage: os.loadavg(),
        totalMemory: Math.round(totalMem / 1024 / 1024), // MB
        freeMemory: Math.round(freeMem / 1024 / 1024),   // MB
        usedMemory: Math.round(usedMem / 1024 / 1024)    // MB
      };

      // Check thresholds and emit alerts
      this.checkSystemThresholds();

    } catch (error) {
      logger.error('Failed to collect system metrics', { error: error.message });
    }
  }

  /**
   * Check system thresholds and emit alerts
   */
  checkSystemThresholds() {
    const { cpu, memory } = this.metrics.system;

    if (cpu > this.thresholds.cpuUsage) {
      this.emitAlert('HIGH_CPU_USAGE', {
        current: cpu,
        threshold: this.thresholds.cpuUsage,
        message: `High CPU usage detected: ${cpu.toFixed(2)}%`
      });
    }

    if (memory > this.thresholds.memoryUsage) {
      this.emitAlert('HIGH_MEMORY_USAGE', {
        current: memory,
        threshold: this.thresholds.memoryUsage,
        message: `High memory usage detected: ${memory.toFixed(2)}%`
      });
    }
  }

  /**
   * Record API request metrics
   */
  recordRequest(responseTime, success = true) {
    this.metrics.requests.total++;
    
    if (success) {
      this.metrics.requests.successful++;
    } else {
      this.metrics.requests.failed++;
    }

    // Update response times (keep last 1000)
    this.metrics.requests.responseTimes.push(responseTime);
    if (this.metrics.requests.responseTimes.length > 1000) {
      this.metrics.requests.responseTimes.shift();
    }

    // Calculate average response time
    const times = this.metrics.requests.responseTimes;
    this.metrics.requests.averageResponseTime = 
      times.reduce((sum, time) => sum + time, 0) / times.length;

    // Check response time threshold
    if (responseTime > this.thresholds.responseTime) {
      this.emitAlert('SLOW_RESPONSE', {
        responseTime,
        threshold: this.thresholds.responseTime,
        message: `Slow response detected: ${responseTime}ms`
      });
    }

    // Check error rate
    const errorRate = this.metrics.requests.failed / this.metrics.requests.total;
    if (errorRate > this.thresholds.errorRate && this.metrics.requests.total > 10) {
      this.emitAlert('HIGH_ERROR_RATE', {
        errorRate: errorRate * 100,
        threshold: this.thresholds.errorRate * 100,
        message: `High error rate detected: ${(errorRate * 100).toFixed(2)}%`
      });
    }
  }

  /**
   * Record database query metrics
   */
  recordDatabaseQuery(queryTime) {
    this.metrics.database.queries++;
    
    // Update query times (keep last 1000)
    this.metrics.database.queryTimes.push(queryTime);
    if (this.metrics.database.queryTimes.length > 1000) {
      this.metrics.database.queryTimes.shift();
    }

    // Calculate average query time
    const times = this.metrics.database.queryTimes;
    this.metrics.database.averageQueryTime = 
      times.reduce((sum, time) => sum + time, 0) / times.length;

    // Check query time threshold
    if (queryTime > this.thresholds.dbQueryTime) {
      this.emitAlert('SLOW_DATABASE_QUERY', {
        queryTime,
        threshold: this.thresholds.dbQueryTime,
        message: `Slow database query detected: ${queryTime}ms`
      });
    }
  }

  /**
   * Record error metrics
   */
  recordError(error, context = {}) {
    this.metrics.errors.total++;
    
    const errorType = error.name || 'UnknownError';
    this.metrics.errors.byType[errorType] = 
      (this.metrics.errors.byType[errorType] || 0) + 1;

    // Keep recent errors (last 100)
    this.metrics.errors.recent.push({
      type: errorType,
      message: error.message,
      timestamp: new Date().toISOString(),
      context
    });
    
    if (this.metrics.errors.recent.length > 100) {
      this.metrics.errors.recent.shift();
    }

    // Emit error alert
    this.emitAlert('APPLICATION_ERROR', {
      error: errorType,
      message: error.message,
      context,
      totalErrors: this.metrics.errors.total
    });
  }

  /**
   * Emit alert with cooldown mechanism
   */
  emitAlert(type, data) {
    const now = Date.now();
    const lastAlert = this.alertCooldown.get(type);
    
    // Check cooldown period
    if (lastAlert && (now - lastAlert) < this.alertCooldownPeriod) {
      return; // Skip alert due to cooldown
    }

    this.alertCooldown.set(type, now);
    
    const alert = {
      type,
      timestamp: new Date().toISOString(),
      severity: this.getAlertSeverity(type),
      ...data
    };

    logger.warn('Performance alert triggered', alert);
    this.emit('alert', alert);
  }

  /**
   * Get alert severity level
   */
  getAlertSeverity(type) {
    const severityMap = {
      'HIGH_CPU_USAGE': 'warning',
      'HIGH_MEMORY_USAGE': 'warning',
      'SLOW_RESPONSE': 'warning',
      'HIGH_ERROR_RATE': 'critical',
      'SLOW_DATABASE_QUERY': 'warning',
      'APPLICATION_ERROR': 'error'
    };
    
    return severityMap[type] || 'info';
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      timestamp: new Date().toISOString(),
      thresholds: this.thresholds
    };
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const { requests, system, database, errors } = this.metrics;
    
    return {
      requests: {
        total: requests.total,
        successRate: requests.total > 0 ? 
          ((requests.successful / requests.total) * 100).toFixed(2) + '%' : '0%',
        averageResponseTime: Math.round(requests.averageResponseTime) + 'ms',
        p95ResponseTime: this.calculatePercentile(requests.responseTimes, 95) + 'ms',
        p99ResponseTime: this.calculatePercentile(requests.responseTimes, 99) + 'ms'
      },
      system: {
        cpuUsage: system.cpu.toFixed(2) + '%',
        memoryUsage: system.memory.toFixed(2) + '%',
        uptime: this.formatUptime(system.uptime),
        loadAverage: system.loadAverage?.map(l => l.toFixed(2)).join(', ')
      },
      database: {
        totalQueries: database.queries,
        averageQueryTime: Math.round(database.averageQueryTime) + 'ms',
        p95QueryTime: this.calculatePercentile(database.queryTimes, 95) + 'ms'
      },
      errors: {
        total: errors.total,
        errorRate: requests.total > 0 ? 
          ((errors.total / requests.total) * 100).toFixed(2) + '%' : '0%',
        topErrors: this.getTopErrors()
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calculate percentile from array of values
   */
  calculatePercentile(values, percentile) {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return Math.round(sorted[index] || 0);
  }

  /**
   * Get top error types
   */
  getTopErrors() {
    return Object.entries(this.metrics.errors.byType)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));
  }

  /**
   * Format uptime in human readable format
   */
  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  /**
   * Reset metrics (for testing or periodic reset)
   */
  resetMetrics() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        averageResponseTime: 0,
        responseTimes: []
      },
      system: {
        cpu: 0,
        memory: 0,
        uptime: 0
      },
      database: {
        connections: 0,
        queries: 0,
        averageQueryTime: 0,
        queryTimes: []
      },
      errors: {
        total: 0,
        byType: {},
        recent: []
      }
    };
    
    logger.info('Performance metrics reset');
  }

  /**
   * Update thresholds
   */
  updateThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    logger.info('Performance thresholds updated', { thresholds: this.thresholds });
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

module.exports = performanceMonitor;