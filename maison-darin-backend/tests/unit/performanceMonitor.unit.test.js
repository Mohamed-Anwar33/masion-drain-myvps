const EventEmitter = require('events');

// Mock the performance monitor class for testing
class MockPerformanceMonitor extends EventEmitter {
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
      responseTime: 5000,
      errorRate: 0.05,
      cpuUsage: 80,
      memoryUsage: 85,
      dbQueryTime: 1000
    };
    
    this.alertCooldown = new Map();
    this.alertCooldownPeriod = 5 * 60 * 1000;
  }

  recordRequest(responseTime, success = true) {
    this.metrics.requests.total++;
    
    if (success) {
      this.metrics.requests.successful++;
    } else {
      this.metrics.requests.failed++;
    }

    this.metrics.requests.responseTimes.push(responseTime);
    if (this.metrics.requests.responseTimes.length > 1000) {
      this.metrics.requests.responseTimes.shift();
    }

    const times = this.metrics.requests.responseTimes;
    this.metrics.requests.averageResponseTime = 
      times.reduce((sum, time) => sum + time, 0) / times.length;

    if (responseTime > this.thresholds.responseTime) {
      this.emitAlert('SLOW_RESPONSE', {
        responseTime,
        threshold: this.thresholds.responseTime,
        message: `Slow response detected: ${responseTime}ms`
      });
    }

    const errorRate = this.metrics.requests.failed / this.metrics.requests.total;
    if (errorRate > this.thresholds.errorRate && this.metrics.requests.total > 10) {
      this.emitAlert('HIGH_ERROR_RATE', {
        errorRate: errorRate * 100,
        threshold: this.thresholds.errorRate * 100,
        message: `High error rate detected: ${(errorRate * 100).toFixed(2)}%`
      });
    }
  }

  recordDatabaseQuery(queryTime) {
    this.metrics.database.queries++;
    
    this.metrics.database.queryTimes.push(queryTime);
    if (this.metrics.database.queryTimes.length > 1000) {
      this.metrics.database.queryTimes.shift();
    }

    const times = this.metrics.database.queryTimes;
    this.metrics.database.averageQueryTime = 
      times.reduce((sum, time) => sum + time, 0) / times.length;

    if (queryTime > this.thresholds.dbQueryTime) {
      this.emitAlert('SLOW_DATABASE_QUERY', {
        queryTime,
        threshold: this.thresholds.dbQueryTime,
        message: `Slow database query detected: ${queryTime}ms`
      });
    }
  }

  recordError(error, context = {}) {
    this.metrics.errors.total++;
    
    const errorType = error.name || 'UnknownError';
    this.metrics.errors.byType[errorType] = 
      (this.metrics.errors.byType[errorType] || 0) + 1;

    this.metrics.errors.recent.push({
      type: errorType,
      message: error.message,
      timestamp: new Date().toISOString(),
      context
    });
    
    if (this.metrics.errors.recent.length > 100) {
      this.metrics.errors.recent.shift();
    }

    this.emitAlert('APPLICATION_ERROR', {
      error: errorType,
      message: error.message,
      context,
      totalErrors: this.metrics.errors.total
    });
  }

  emitAlert(type, data) {
    const now = Date.now();
    const lastAlert = this.alertCooldown.get(type);
    
    if (lastAlert && (now - lastAlert) < this.alertCooldownPeriod) {
      return;
    }

    this.alertCooldown.set(type, now);
    
    const alert = {
      type,
      timestamp: new Date().toISOString(),
      severity: this.getAlertSeverity(type),
      ...data
    };

    this.emit('alert', alert);
  }

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

  getMetrics() {
    return {
      ...this.metrics,
      timestamp: new Date().toISOString(),
      thresholds: this.thresholds
    };
  }

  getPerformanceSummary() {
    const { requests, system, database, errors } = this.metrics;
    
    return {
      requests: {
        total: requests.total,
        successRate: requests.total > 0 ? 
          ((requests.successful / requests.total) * 100).toFixed(2) + '%' : '0%',
        averageResponseTime: Math.round(requests.averageResponseTime) + 'ms'
      },
      database: {
        totalQueries: database.queries,
        averageQueryTime: Math.round(database.averageQueryTime) + 'ms'
      },
      timestamp: new Date().toISOString()
    };
  }

  updateThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

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
  }
}

describe('PerformanceMonitor Unit Tests', () => {
  let performanceMonitor;

  beforeEach(() => {
    performanceMonitor = new MockPerformanceMonitor();
  });

  describe('Request Metrics', () => {
    test('should record successful requests', () => {
      performanceMonitor.recordRequest(100, true);
      performanceMonitor.recordRequest(200, true);
      
      const metrics = performanceMonitor.getMetrics();
      
      expect(metrics.requests.total).toBe(2);
      expect(metrics.requests.successful).toBe(2);
      expect(metrics.requests.failed).toBe(0);
      expect(metrics.requests.averageResponseTime).toBe(150);
    });

    test('should record failed requests', () => {
      performanceMonitor.recordRequest(100, true);
      performanceMonitor.recordRequest(200, false);
      
      const metrics = performanceMonitor.getMetrics();
      
      expect(metrics.requests.total).toBe(2);
      expect(metrics.requests.successful).toBe(1);
      expect(metrics.requests.failed).toBe(1);
    });

    test('should emit alert for slow responses', (done) => {
      performanceMonitor.once('alert', (alert) => {
        expect(alert.type).toBe('SLOW_RESPONSE');
        expect(alert.responseTime).toBe(6000);
        done();
      });

      performanceMonitor.recordRequest(6000, true);
    });

    test('should emit alert for high error rate', (done) => {
      // Record some requests to establish a baseline
      for (let i = 0; i < 10; i++) {
        performanceMonitor.recordRequest(100, true);
      }

      performanceMonitor.once('alert', (alert) => {
        expect(alert.type).toBe('HIGH_ERROR_RATE');
        done();
      });

      // Add enough failures to trigger high error rate
      for (let i = 0; i < 5; i++) {
        performanceMonitor.recordRequest(100, false);
      }
    });
  });

  describe('Database Metrics', () => {
    test('should record database queries', () => {
      performanceMonitor.recordDatabaseQuery(50);
      performanceMonitor.recordDatabaseQuery(100);
      
      const metrics = performanceMonitor.getMetrics();
      
      expect(metrics.database.queries).toBe(2);
      expect(metrics.database.averageQueryTime).toBe(75);
    });

    test('should emit alert for slow queries', (done) => {
      performanceMonitor.once('alert', (alert) => {
        expect(alert.type).toBe('SLOW_DATABASE_QUERY');
        expect(alert.queryTime).toBe(2000);
        done();
      });

      performanceMonitor.recordDatabaseQuery(2000);
    });
  });

  describe('Error Metrics', () => {
    test('should record errors', () => {
      const error1 = new Error('Test error 1');
      const error2 = new TypeError('Test error 2');
      
      performanceMonitor.recordError(error1);
      performanceMonitor.recordError(error2);
      
      const metrics = performanceMonitor.getMetrics();
      
      expect(metrics.errors.total).toBe(2);
      expect(metrics.errors.byType.Error).toBe(1);
      expect(metrics.errors.byType.TypeError).toBe(1);
      expect(metrics.errors.recent).toHaveLength(2);
    });

    test('should emit alert for errors', (done) => {
      performanceMonitor.once('alert', (alert) => {
        expect(alert.type).toBe('APPLICATION_ERROR');
        expect(alert.error).toBe('Error');
        done();
      });

      const error = new Error('Test error');
      performanceMonitor.recordError(error);
    });
  });

  describe('Performance Summary', () => {
    test('should generate performance summary', () => {
      // Add some test data
      performanceMonitor.recordRequest(100, true);
      performanceMonitor.recordRequest(200, true);
      performanceMonitor.recordRequest(300, false);
      performanceMonitor.recordDatabaseQuery(50);
      
      const summary = performanceMonitor.getPerformanceSummary();
      
      expect(summary.requests.total).toBe(3);
      expect(summary.requests.successRate).toBe('66.67%');
      expect(summary.database.totalQueries).toBe(1);
      expect(summary.timestamp).toBeDefined();
    });
  });

  describe('Thresholds', () => {
    test('should update thresholds', () => {
      const newThresholds = {
        responseTime: 3000,
        errorRate: 0.1
      };
      
      performanceMonitor.updateThresholds(newThresholds);
      
      expect(performanceMonitor.thresholds.responseTime).toBe(3000);
      expect(performanceMonitor.thresholds.errorRate).toBe(0.1);
    });
  });

  describe('Alert Cooldown', () => {
    test('should respect alert cooldown period', (done) => {
      let alertCount = 0;
      
      performanceMonitor.on('alert', () => {
        alertCount++;
      });

      // Trigger multiple slow responses quickly
      performanceMonitor.recordRequest(6000, true);
      performanceMonitor.recordRequest(6000, true);
      performanceMonitor.recordRequest(6000, true);

      setTimeout(() => {
        // Should only have one alert due to cooldown
        expect(alertCount).toBe(1);
        done();
      }, 100);
    });
  });

  describe('Metrics Reset', () => {
    test('should reset all metrics', () => {
      // Add some data
      performanceMonitor.recordRequest(100, true);
      performanceMonitor.recordDatabaseQuery(50);
      performanceMonitor.recordError(new Error('Test'));
      
      // Reset metrics
      performanceMonitor.resetMetrics();
      
      const metrics = performanceMonitor.getMetrics();
      
      expect(metrics.requests.total).toBe(0);
      expect(metrics.database.queries).toBe(0);
      expect(metrics.errors.total).toBe(0);
    });
  });
});