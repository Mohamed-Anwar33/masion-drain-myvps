const HealthController = require('../../controllers/healthController');
const databaseService = require('../../services/databaseService');
const logger = require('../../utils/logger');

// Mock dependencies
jest.mock('../../services/databaseService');
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));
jest.mock('os', () => ({
  freemem: jest.fn().mockReturnValue(1024 * 1024 * 1024), // 1GB
  totalmem: jest.fn().mockReturnValue(4 * 1024 * 1024 * 1024), // 4GB
  cpus: jest.fn().mockReturnValue([{}, {}, {}, {}]), // 4 CPUs
  loadavg: jest.fn().mockReturnValue([0.5, 0.6, 0.7]),
  release: jest.fn().mockReturnValue('10.0.0'),
  platform: jest.fn().mockReturnValue('win32'),
  arch: jest.fn().mockReturnValue('x64'),
  type: jest.fn().mockReturnValue('Windows_NT'),
  hostname: jest.fn().mockReturnValue('localhost')
}));

describe('Health Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('healthCheck', () => {
    it('should return healthy status when database is healthy', async () => {
      const mockDbHealth = {
        status: 'healthy',
        responseTime: 50,
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      databaseService.healthCheck.mockResolvedValue(mockDbHealth);

      await HealthController.healthCheck(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          status: 'healthy',
          services: {
            database: mockDbHealth,
            system: expect.any(Object)
          }
        })
      });
    });

    it('should return unhealthy status when database is unhealthy', async () => {
      const mockDbHealth = {
        status: 'unhealthy',
        error: 'Connection failed',
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      databaseService.healthCheck.mockResolvedValue(mockDbHealth);

      await HealthController.healthCheck(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        data: expect.objectContaining({
          status: 'unhealthy',
          services: {
            database: mockDbHealth,
            system: expect.any(Object)
          }
        })
      });
    });

    it('should handle health check errors', async () => {
      databaseService.healthCheck.mockRejectedValue(new Error('Health check failed'));

      await HealthController.healthCheck(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'HEALTH_CHECK_FAILED',
          message: 'Health check failed',
          details: 'Health check failed'
        },
        timestamp: expect.any(String)
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('detailedHealthCheck', () => {
    it('should return detailed health information', async () => {
      const mockDbHealth = {
        status: 'healthy',
        responseTime: 50
      };

      const mockDbStats = {
        database: { collections: 5 },
        server: { version: '4.4.0' }
      };

      databaseService.healthCheck.mockResolvedValue(mockDbHealth);
      databaseService.getStats.mockResolvedValue(mockDbStats);

      await HealthController.detailedHealthCheck(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          status: 'healthy',
          services: {
            database: {
              health: mockDbHealth,
              stats: mockDbStats
            },
            system: expect.any(Object)
          }
        })
      });
    });

    it('should handle database stats failure gracefully', async () => {
      const mockDbHealth = {
        status: 'healthy',
        responseTime: 50
      };

      databaseService.healthCheck.mockResolvedValue(mockDbHealth);
      databaseService.getStats.mockRejectedValue(new Error('Stats failed'));

      await HealthController.detailedHealthCheck(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          services: {
            database: {
              health: mockDbHealth,
              stats: {
                error: 'Stats failed'
              }
            },
            system: expect.any(Object)
          }
        })
      });
    });

    it('should handle complete failure', async () => {
      databaseService.healthCheck.mockRejectedValue(new Error('Complete failure'));
      databaseService.getStats.mockRejectedValue(new Error('Stats failed'));

      await HealthController.detailedHealthCheck(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        data: expect.objectContaining({
          status: 'unhealthy',
          services: {
            database: {
              health: {
                status: 'error',
                error: 'Complete failure'
              },
              stats: {
                error: 'Stats failed'
              }
            },
            system: expect.any(Object)
          }
        })
      });
    });
  });

  describe('databaseHealthCheck', () => {
    it('should return database health when healthy', async () => {
      const mockDbHealth = {
        status: 'healthy',
        responseTime: 30
      };

      const mockConnectionStatus = {
        isConnected: true,
        readyState: 1
      };

      const mockCircuitBreakerStatus = {
        state: 'CLOSED',
        allowsOperations: true
      };

      databaseService.healthCheck.mockResolvedValue(mockDbHealth);
      databaseService.getConnectionStatus.mockReturnValue(mockConnectionStatus);
      databaseService.getCircuitBreakerStatus.mockReturnValue(mockCircuitBreakerStatus);

      await HealthController.databaseHealthCheck(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          health: mockDbHealth,
          connection: mockConnectionStatus,
          circuitBreaker: mockCircuitBreakerStatus,
          timestamp: expect.any(String)
        }
      });
    });

    it('should return 503 when database is unhealthy', async () => {
      const mockDbHealth = {
        status: 'unhealthy',
        error: 'Connection lost'
      };

      const mockCircuitBreakerStatus = {
        state: 'OPEN',
        allowsOperations: false
      };

      databaseService.healthCheck.mockResolvedValue(mockDbHealth);
      databaseService.getConnectionStatus.mockReturnValue({ isConnected: false });
      databaseService.getCircuitBreakerStatus.mockReturnValue(mockCircuitBreakerStatus);

      await HealthController.databaseHealthCheck(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        data: expect.objectContaining({
          health: mockDbHealth,
          circuitBreaker: mockCircuitBreakerStatus
        })
      });
    });

    it('should return 503 when circuit breaker is open even if database appears healthy', async () => {
      const mockDbHealth = {
        status: 'healthy',
        responseTime: 30
      };

      const mockCircuitBreakerStatus = {
        state: 'OPEN',
        allowsOperations: false
      };

      databaseService.healthCheck.mockResolvedValue(mockDbHealth);
      databaseService.getConnectionStatus.mockReturnValue({ isConnected: true });
      databaseService.getCircuitBreakerStatus.mockReturnValue(mockCircuitBreakerStatus);

      await HealthController.databaseHealthCheck(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        data: expect.objectContaining({
          health: mockDbHealth,
          circuitBreaker: mockCircuitBreakerStatus
        })
      });
    });

    it('should handle database health check errors', async () => {
      databaseService.healthCheck.mockRejectedValue(new Error('DB check failed'));

      await HealthController.databaseHealthCheck(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'DATABASE_HEALTH_CHECK_FAILED',
          message: 'Database health check failed',
          details: 'DB check failed'
        },
        timestamp: expect.any(String)
      });
    });
  });

  describe('circuitBreakerStatus', () => {
    it('should return circuit breaker status', async () => {
      const mockCircuitBreakerStatus = {
        state: 'CLOSED',
        failures: 0,
        threshold: 5,
        allowsOperations: true
      };

      databaseService.getCircuitBreakerStatus.mockReturnValue(mockCircuitBreakerStatus);

      await HealthController.circuitBreakerStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockCircuitBreakerStatus,
        timestamp: expect.any(String)
      });
    });

    it('should handle circuit breaker status errors', async () => {
      databaseService.getCircuitBreakerStatus.mockImplementation(() => {
        throw new Error('Status check failed');
      });

      await HealthController.circuitBreakerStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'CIRCUIT_BREAKER_STATUS_FAILED',
          message: 'Failed to get circuit breaker status',
          details: 'Status check failed'
        },
        timestamp: expect.any(String)
      });
    });
  });

  describe('resetCircuitBreaker', () => {
    it('should reset circuit breaker successfully', async () => {
      const mockCircuitBreakerStatus = {
        state: 'CLOSED',
        failures: 0
      };

      req.user = { email: 'admin@test.com' };
      req.ip = '127.0.0.1';

      databaseService.forceCircuitBreakerReset.mockImplementation(() => {});
      databaseService.getCircuitBreakerStatus.mockReturnValue(mockCircuitBreakerStatus);

      await HealthController.resetCircuitBreaker(req, res);

      expect(databaseService.forceCircuitBreakerReset).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Circuit breaker reset successfully',
        data: mockCircuitBreakerStatus,
        timestamp: expect.any(String)
      });
      expect(logger.info).toHaveBeenCalledWith(
        'Circuit breaker manually reset',
        expect.objectContaining({
          resetBy: 'admin@test.com',
          ip: '127.0.0.1'
        })
      );
    });

    it('should handle circuit breaker reset errors', async () => {
      req.user = { email: 'admin@test.com' };
      req.ip = '127.0.0.1';

      databaseService.forceCircuitBreakerReset.mockImplementation(() => {
        throw new Error('Reset failed');
      });

      await HealthController.resetCircuitBreaker(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'CIRCUIT_BREAKER_RESET_FAILED',
          message: 'Failed to reset circuit breaker',
          details: 'Reset failed'
        },
        timestamp: expect.any(String)
      });
      expect(logger.error).toHaveBeenCalledWith(
        'Circuit breaker reset failed',
        expect.any(Object)
      );
    });
  });

  describe('readinessProbe', () => {
    it('should return ready when database is healthy', async () => {
      databaseService.healthCheck.mockResolvedValue({ status: 'healthy' });

      await HealthController.readinessProbe(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'ready',
        timestamp: expect.any(String)
      });
    });

    it('should return not ready when database is unhealthy', async () => {
      databaseService.healthCheck.mockResolvedValue({ status: 'unhealthy' });

      await HealthController.readinessProbe(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        status: 'not ready',
        reason: 'Database not healthy',
        timestamp: expect.any(String)
      });
    });

    it('should handle readiness probe errors', async () => {
      databaseService.healthCheck.mockRejectedValue(new Error('Probe failed'));

      await HealthController.readinessProbe(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        status: 'not ready',
        reason: 'Probe failed',
        timestamp: expect.any(String)
      });
    });
  });

  describe('livenessProbe', () => {
    it('should return alive status', async () => {
      await HealthController.livenessProbe(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'alive',
        uptime: expect.any(Number),
        timestamp: expect.any(String)
      });
    });

    it('should handle liveness probe errors', async () => {
      // Mock process.uptime to throw an error
      const originalUptime = process.uptime;
      process.uptime = jest.fn().mockImplementation(() => {
        throw new Error('Uptime failed');
      });

      await HealthController.livenessProbe(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        status: 'dead',
        error: 'Uptime failed',
        timestamp: expect.any(String)
      });

      // Restore original function
      process.uptime = originalUptime;
    });
  });

  describe('System Information', () => {
    it('should include comprehensive system information in detailed health check', async () => {
      const mockDbHealth = { status: 'healthy' };
      databaseService.healthCheck.mockResolvedValue(mockDbHealth);
      databaseService.getStats.mockResolvedValue({});

      await HealthController.detailedHealthCheck(req, res);

      const responseData = res.json.mock.calls[0][0].data;
      const systemInfo = responseData.services.system;

      expect(systemInfo).toHaveProperty('uptime');
      expect(systemInfo).toHaveProperty('memory');
      expect(systemInfo.memory).toHaveProperty('free');
      expect(systemInfo.memory).toHaveProperty('total');
      expect(systemInfo).toHaveProperty('cpu');
      expect(systemInfo.cpu).toHaveProperty('count');
      expect(systemInfo.cpu).toHaveProperty('loadAvg');
      expect(systemInfo).toHaveProperty('version');
      expect(systemInfo).toHaveProperty('platform');
      expect(systemInfo).toHaveProperty('arch');
    });
  });
});