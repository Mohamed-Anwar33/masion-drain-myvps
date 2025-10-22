const request = require('supertest');
const express = require('express');
const {
  performanceMiddleware,
  errorTrackingMiddleware,
  getPerformanceMetrics,
  resetPerformanceMetrics
} = require('../../middleware/performanceMiddleware');
const performanceMonitor = require('../../services/performanceMonitor');

describe('Performance Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(performanceMiddleware);
    
    // Reset metrics before each test
    performanceMonitor.resetMetrics();
  });

  describe('performanceMiddleware', () => {
    test('should track successful requests', async () => {
      app.get('/test', (req, res) => {
        res.json({ success: true });
      });

      await request(app)
        .get('/test')
        .expect(200);

      const metrics = performanceMonitor.getMetrics();
      expect(metrics.requests.total).toBe(1);
      expect(metrics.requests.successful).toBe(1);
      expect(metrics.requests.failed).toBe(0);
    });

    test('should track failed requests', async () => {
      app.get('/test', (req, res) => {
        res.status(500).json({ error: 'Server error' });
      });

      await request(app)
        .get('/test')
        .expect(500);

      const metrics = performanceMonitor.getMetrics();
      expect(metrics.requests.total).toBe(1);
      expect(metrics.requests.successful).toBe(0);
      expect(metrics.requests.failed).toBe(1);
    });

    test('should measure response times', async () => {
      app.get('/test', (req, res) => {
        setTimeout(() => {
          res.json({ success: true });
        }, 100);
      });

      await request(app)
        .get('/test')
        .expect(200);

      const metrics = performanceMonitor.getMetrics();
      expect(metrics.requests.averageResponseTime).toBeGreaterThan(90);
    });
  });

  describe('errorTrackingMiddleware', () => {
    test('should track errors', () => {
      const mockReq = {
        method: 'GET',
        originalUrl: '/test',
        get: jest.fn().mockReturnValue('test-agent'),
        ip: '127.0.0.1'
      };
      
      const mockRes = {
        statusCode: 500
      };
      
      const mockNext = jest.fn();
      const testError = new Error('Test error');

      errorTrackingMiddleware(testError, mockReq, mockRes, mockNext);

      const metrics = performanceMonitor.getMetrics();
      expect(metrics.errors.total).toBe(1);
      expect(metrics.errors.byType.Error).toBe(1);
      expect(mockNext).toHaveBeenCalledWith(testError);
    });
  });

  describe('Performance Metrics Endpoints', () => {
    test('should return performance metrics', async () => {
      // Add some test data
      performanceMonitor.recordRequest(100, true);
      performanceMonitor.recordDatabaseQuery(50);

      const mockReq = {};
      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await getPerformanceMetrics(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          metrics: expect.any(Object),
          summary: expect.any(Object),
          alerts: expect.any(Object)
        })
      });
    });

    test('should handle metrics retrieval errors', async () => {
      // Mock an error in getMetrics
      const originalGetMetrics = performanceMonitor.getMetrics;
      performanceMonitor.getMetrics = jest.fn().mockImplementation(() => {
        throw new Error('Metrics error');
      });

      const mockReq = {};
      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await getPerformanceMetrics(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'METRICS_ERROR',
          message: 'Failed to retrieve performance metrics'
        })
      });

      // Restore original method
      performanceMonitor.getMetrics = originalGetMetrics;
    });

    test('should reset performance metrics', async () => {
      // Add some test data
      performanceMonitor.recordRequest(100, true);
      
      const mockReq = {
        user: { email: 'test@example.com' },
        ip: '127.0.0.1'
      };
      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await resetPerformanceMetrics(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Performance metrics reset successfully'
      });

      // Verify metrics were reset
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.requests.total).toBe(0);
    });
  });

  describe('Integration with Express App', () => {
    test('should work with complete Express application', async () => {
      app.get('/api/test', (req, res) => {
        res.json({ message: 'Test endpoint' });
      });

      app.use(errorTrackingMiddleware);
      app.use((err, req, res, next) => {
        res.status(500).json({ error: err.message });
      });

      // Make multiple requests
      await request(app).get('/api/test').expect(200);
      await request(app).get('/api/test').expect(200);
      await request(app).get('/api/nonexistent').expect(404);

      const metrics = performanceMonitor.getMetrics();
      expect(metrics.requests.total).toBe(3);
      expect(metrics.requests.successful).toBe(2);
      expect(metrics.requests.failed).toBe(1);
    });
  });
});