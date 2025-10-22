const mongoose = require('mongoose');
const databaseService = require('../../services/databaseService');
const logger = require('../../utils/logger');

// Mock logger to avoid console output during tests
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

describe('Database Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset database service state
    databaseService.isConnected = false;
    databaseService.retryCount = 0;
    databaseService.connectionAttempts = 0;
  });

  afterEach(async () => {
    // Clean up any connections
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    
    // Clear any intervals
    if (databaseService.healthCheckInterval) {
      clearInterval(databaseService.healthCheckInterval);
      databaseService.healthCheckInterval = null;
    }
  });

  describe('Connection Management', () => {
    it('should connect to database successfully', async () => {
      // Mock successful connection
      const mockConnect = jest.spyOn(mongoose, 'connect').mockResolvedValue(mongoose.connection);
      
      await databaseService.connect();
      
      expect(mockConnect).toHaveBeenCalled();
      expect(databaseService.isConnected).toBe(true);
      expect(logger.info).toHaveBeenCalledWith(
        'Database connected successfully',
        expect.any(Object)
      );
      
      mockConnect.mockRestore();
    });

    it('should handle connection errors with retry logic', async () => {
      const mockConnect = jest.spyOn(mongoose, 'connect')
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce(mongoose.connection);
      
      // Mock setTimeout to execute immediately
      jest.spyOn(global, 'setTimeout').mockImplementation((fn) => fn());
      
      await databaseService.connect();
      
      expect(mockConnect).toHaveBeenCalledTimes(2);
      expect(databaseService.retryCount).toBe(0); // Reset after successful connection
      expect(logger.error).toHaveBeenCalled();
      
      mockConnect.mockRestore();
      global.setTimeout.mockRestore();
    });

    it('should get connection status', () => {
      const status = databaseService.getConnectionStatus();
      
      expect(status).toHaveProperty('isConnected');
      expect(status).toHaveProperty('readyState');
      expect(status).toHaveProperty('readyStateText');
      expect(status).toHaveProperty('connectionAttempts');
      expect(status).toHaveProperty('retryCount');
    });

    it('should convert ready state to text correctly', () => {
      expect(databaseService.getReadyStateText(0)).toBe('disconnected');
      expect(databaseService.getReadyStateText(1)).toBe('connected');
      expect(databaseService.getReadyStateText(2)).toBe('connecting');
      expect(databaseService.getReadyStateText(3)).toBe('disconnecting');
      expect(databaseService.getReadyStateText(99)).toBe('unknown');
    });
  });

  describe('Health Checks', () => {
    it('should perform health check when connected', async () => {
      databaseService.isConnected = true;
      databaseService.circuitBreakerState = 'CLOSED';
      
      // Mock mongoose connection
      const mockPing = jest.fn().mockResolvedValue({});
      const mockStats = jest.fn().mockResolvedValue({});
      const mockServerStatus = jest.fn().mockResolvedValue({});
      
      mongoose.connection.readyState = 1;
      mongoose.connection.db = {
        admin: () => ({ 
          ping: mockPing,
          serverStatus: mockServerStatus
        }),
        stats: mockStats
      };
      
      const health = await databaseService.healthCheck();
      
      expect(health.status).toBe('healthy');
      expect(health).toHaveProperty('responseTime');
      expect(health).toHaveProperty('timestamp');
      expect(mockPing).toHaveBeenCalled();
    });

    it('should return unhealthy when not connected', async () => {
      databaseService.isConnected = false;
      mongoose.connection.readyState = 0;
      
      const health = await databaseService.healthCheck();
      
      expect(health.status).toBe('unhealthy');
      expect(health.error).toBe('Database not connected');
    });

    it('should handle ping failures', async () => {
      databaseService.isConnected = true;
      mongoose.connection.readyState = 1;
      
      const mockPing = jest.fn().mockRejectedValue(new Error('Ping failed'));
      mongoose.connection.db = {
        admin: () => ({ ping: mockPing })
      };
      
      const health = await databaseService.healthCheck();
      
      expect(health.status).toBe('unhealthy');
      expect(health.error).toBe('Ping failed');
    });
  });

  describe('Transaction Support', () => {
    it('should execute operations with transaction', async () => {
      databaseService.circuitBreakerState = 'CLOSED';
      
      // Mock session and transaction
      const mockSession = {
        withTransaction: jest.fn().mockImplementation(async (fn) => {
          return await fn();
        }),
        endSession: jest.fn(),
        inTransaction: jest.fn().mockReturnValue(false)
      };
      
      jest.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession);
      
      const mockOperation = jest.fn().mockResolvedValue('success');
      
      const result = await databaseService.executeWithTransaction(mockOperation);
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledWith(mockSession);
      expect(mockSession.withTransaction).toHaveBeenCalled();
    });

    it('should retry failed transactions', async () => {
      databaseService.circuitBreakerState = 'CLOSED';
      
      // Create a retryable error
      const retryableError = new Error('Transaction failed');
      retryableError.name = 'MongoNetworkError';
      
      const mockSession = {
        withTransaction: jest.fn()
          .mockRejectedValueOnce(retryableError)
          .mockResolvedValueOnce('success'),
        endSession: jest.fn(),
        inTransaction: jest.fn().mockReturnValue(false)
      };
      
      jest.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession);
      jest.spyOn(global, 'setTimeout').mockImplementation((fn) => fn());
      
      const mockOperation = jest.fn().mockResolvedValue('success');
      
      const result = await databaseService.executeWithTransaction(mockOperation, { maxRetries: 2 });
      
      expect(result).toBe('success');
      expect(mockSession.withTransaction).toHaveBeenCalledTimes(2);
      
      global.setTimeout.mockRestore();
    });

    it('should handle array of operations', async () => {
      databaseService.circuitBreakerState = 'CLOSED';
      
      const mockSession = {
        withTransaction: jest.fn().mockImplementation(async (fn) => {
          return await fn();
        }),
        endSession: jest.fn(),
        inTransaction: jest.fn().mockReturnValue(false)
      };
      
      jest.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession);
      
      const operation1 = jest.fn().mockResolvedValue('result1');
      const operation2 = jest.fn().mockResolvedValue('result2');
      
      const result = await databaseService.executeWithTransaction([operation1, operation2]);
      
      expect(result).toEqual(['result1', 'result2']);
      expect(operation1).toHaveBeenCalledWith(mockSession);
      expect(operation2).toHaveBeenCalledWith(mockSession);
    });
  });

  describe('Retry Logic', () => {
    it('should execute operation with retry on retryable errors', async () => {
      const networkError = new Error('Connection failed');
      networkError.name = 'MongoNetworkError';
      
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce('success');
      
      jest.spyOn(global, 'setTimeout').mockImplementation((fn) => fn());
      
      const result = await databaseService.executeWithRetry(mockOperation);
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(2);
      
      global.setTimeout.mockRestore();
    });

    it('should not retry non-retryable errors', async () => {
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      
      const mockOperation = jest.fn().mockRejectedValue(validationError);
      
      await expect(databaseService.executeWithRetry(mockOperation)).rejects.toThrow('Validation failed');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should identify retryable errors correctly', () => {
      // Network errors
      expect(databaseService.isRetryableError({ name: 'MongoNetworkError' })).toBe(true);
      expect(databaseService.isRetryableError({ name: 'MongoTimeoutError' })).toBe(true);
      
      // Error codes
      expect(databaseService.isRetryableError({ code: 11600 })).toBe(true);
      expect(databaseService.isRetryableError({ code: 10107 })).toBe(true);
      
      // Connection-related messages
      expect(databaseService.isRetryableError({ message: 'connection timeout' })).toBe(true);
      expect(databaseService.isRetryableError({ message: 'network timeout' })).toBe(true);
      
      // Non-retryable errors
      expect(databaseService.isRetryableError({ name: 'ValidationError' })).toBe(false);
      expect(databaseService.isRetryableError({ code: 11000 })).toBe(false);
      
      // Null/undefined errors
      expect(databaseService.isRetryableError(null)).toBe(false);
      expect(databaseService.isRetryableError(undefined)).toBe(false);
    });
  });

  describe('Statistics', () => {
    it('should get database statistics when connected', async () => {
      databaseService.isConnected = true;
      
      const mockStats = {
        collections: 5,
        dataSize: 1024,
        storageSize: 2048,
        indexes: 10,
        indexSize: 512,
        avgObjSize: 100,
        objects: 50
      };
      
      const mockServerStatus = {
        version: '4.4.0',
        uptime: 3600,
        connections: { current: 5, available: 995 },
        opcounters: { insert: 100, query: 200 },
        mem: { resident: 500, virtual: 1000 },
        network: { bytesIn: 1000, bytesOut: 2000 }
      };
      
      mongoose.connection.db = {
        stats: jest.fn().mockResolvedValue(mockStats),
        admin: () => ({
          serverStatus: jest.fn().mockResolvedValue(mockServerStatus)
        })
      };
      
      const stats = await databaseService.getStats();
      
      expect(stats.database).toMatchObject({
        collections: mockStats.collections,
        dataSize: mockStats.dataSize,
        storageSize: mockStats.storageSize
      });
      expect(stats.server).toMatchObject({
        version: mockServerStatus.version,
        uptime: mockServerStatus.uptime,
        connections: mockServerStatus.connections
      });
      expect(stats.connection).toBeDefined();
      expect(stats.circuitBreaker).toBeDefined();
    });

    it('should handle partial stats failures gracefully', async () => {
      databaseService.isConnected = true;
      
      mongoose.connection.db = {
        stats: jest.fn().mockRejectedValue(new Error('Stats failed')),
        admin: () => ({
          serverStatus: jest.fn().mockResolvedValue({ version: '4.4.0' })
        })
      };
      
      const stats = await databaseService.getStats();
      
      expect(stats.database).toBeNull();
      expect(stats.server).toMatchObject({ version: '4.4.0' });
    });

    it('should throw error when getting stats while disconnected', async () => {
      databaseService.isConnected = false;
      
      await expect(databaseService.getStats()).rejects.toThrow('Failed to retrieve database statistics');
    });

    it('should check for alerts in statistics', async () => {
      const mockStats = {
        server: {
          connections: { current: 90, available: 10 }, // High utilization
          mem: { resident: 1500, virtual: 2000 } // High memory
        },
        database: {
          dataSize: 1000,
          storageSize: 4000 // High storage overhead
        },
        circuitBreaker: {
          state: 'OPEN' // Circuit breaker open
        }
      };

      databaseService.checkForAlerts(mockStats);
      
      expect(logger.warn).toHaveBeenCalledWith(
        'High connection pool utilization',
        expect.any(Object)
      );
      expect(logger.warn).toHaveBeenCalledWith(
        'High database memory usage',
        expect.any(Object)
      );
      expect(logger.warn).toHaveBeenCalledWith(
        'High storage overhead detected',
        expect.any(Object)
      );
      expect(logger.warn).toHaveBeenCalledWith(
        'Circuit breaker not in normal state',
        expect.any(Object)
      );
    });
  });

  describe('Graceful Shutdown', () => {
    it('should handle graceful shutdown', async () => {
      const mockClose = jest.spyOn(mongoose.connection, 'close').mockResolvedValue();
      const mockExit = jest.spyOn(process, 'exit').mockImplementation();
      
      databaseService.healthCheckInterval = setInterval(() => {}, 1000);
      
      await databaseService.gracefulShutdown('SIGTERM');
      
      expect(mockClose).toHaveBeenCalled();
      expect(databaseService.isConnected).toBe(false);
      expect(databaseService.healthCheckInterval).toBeNull();
      expect(mockExit).toHaveBeenCalledWith(0);
      
      mockClose.mockRestore();
      mockExit.mockRestore();
    });

    it('should handle shutdown errors', async () => {
      const mockClose = jest.spyOn(mongoose.connection, 'close')
        .mockRejectedValue(new Error('Close failed'));
      const mockExit = jest.spyOn(process, 'exit').mockImplementation();
      
      await databaseService.gracefulShutdown('SIGTERM');
      
      expect(logger.error).toHaveBeenCalledWith(
        'Error during graceful shutdown',
        expect.any(Object)
      );
      expect(mockExit).toHaveBeenCalledWith(1);
      
      mockClose.mockRestore();
      mockExit.mockRestore();
    });
  });

  describe('Health Check Monitoring', () => {
    it('should start health check monitoring', () => {
      const mockSetInterval = jest.spyOn(global, 'setInterval').mockReturnValue('interval-id');
      
      databaseService.startHealthCheckMonitoring();
      
      expect(mockSetInterval).toHaveBeenCalled();
      expect(databaseService.healthCheckInterval).toBe('interval-id');
      
      mockSetInterval.mockRestore();
    });

    it('should clear existing interval before starting new one', () => {
      const mockClearInterval = jest.spyOn(global, 'clearInterval');
      const mockSetInterval = jest.spyOn(global, 'setInterval').mockReturnValue('new-interval');
      
      databaseService.healthCheckInterval = 'existing-interval';
      databaseService.startHealthCheckMonitoring();
      
      expect(mockClearInterval).toHaveBeenCalledWith('existing-interval');
      expect(databaseService.healthCheckInterval).toBe('new-interval');
      
      mockClearInterval.mockRestore();
      mockSetInterval.mockRestore();
    });
  });

  describe('Circuit Breaker', () => {
    beforeEach(() => {
      // Reset circuit breaker state
      databaseService.circuitBreakerState = 'CLOSED';
      databaseService.circuitBreakerFailures = 0;
      databaseService.lastCircuitBreakerReset = Date.now();
    });

    it('should allow operations when circuit breaker is closed', () => {
      expect(databaseService.shouldAllowOperation()).toBe(true);
    });

    it('should record failures and open circuit breaker', () => {
      // Record failures up to threshold
      for (let i = 0; i < databaseService.circuitBreakerThreshold; i++) {
        databaseService.recordCircuitBreakerFailure();
      }
      
      expect(databaseService.circuitBreakerState).toBe('OPEN');
      expect(databaseService.shouldAllowOperation()).toBe(false);
    });

    it('should move to half-open after timeout', () => {
      // Open the circuit breaker
      databaseService.circuitBreakerState = 'OPEN';
      databaseService.lastCircuitBreakerReset = Date.now() - 70000; // 70 seconds ago
      
      expect(databaseService.shouldAllowOperation()).toBe(true);
      expect(databaseService.circuitBreakerState).toBe('HALF_OPEN');
    });

    it('should reset circuit breaker on success', () => {
      databaseService.circuitBreakerState = 'HALF_OPEN';
      databaseService.circuitBreakerFailures = 3;
      
      databaseService.resetCircuitBreaker();
      
      expect(databaseService.circuitBreakerState).toBe('CLOSED');
      expect(databaseService.circuitBreakerFailures).toBe(0);
    });

    it('should get circuit breaker status', () => {
      const status = databaseService.getCircuitBreakerStatus();
      
      expect(status).toHaveProperty('state');
      expect(status).toHaveProperty('failures');
      expect(status).toHaveProperty('threshold');
      expect(status).toHaveProperty('allowsOperations');
    });

    it('should force reset circuit breaker', () => {
      databaseService.circuitBreakerState = 'OPEN';
      databaseService.circuitBreakerFailures = 5;
      
      databaseService.forceCircuitBreakerReset();
      
      expect(databaseService.circuitBreakerState).toBe('CLOSED');
      expect(databaseService.circuitBreakerFailures).toBe(0);
    });
  });

  describe('Enhanced Operations', () => {
    it('should reject operations when circuit breaker is open', async () => {
      databaseService.circuitBreakerState = 'OPEN';
      
      const mockOperation = jest.fn();
      
      await expect(databaseService.executeWithRetry(mockOperation))
        .rejects.toThrow('Circuit breaker: OPEN');
      
      expect(mockOperation).not.toHaveBeenCalled();
    });

    it('should reject transactions when circuit breaker is open', async () => {
      databaseService.circuitBreakerState = 'OPEN';
      
      const mockOperation = jest.fn();
      jest.spyOn(mongoose, 'startSession').mockResolvedValue({
        endSession: jest.fn()
      });
      
      await expect(databaseService.executeWithTransaction(mockOperation))
        .rejects.toThrow('Circuit breaker: OPEN');
      
      expect(mockOperation).not.toHaveBeenCalled();
    });

    it('should handle operation timeout in executeWithRetry', async () => {
      databaseService.circuitBreakerState = 'CLOSED';
      
      const slowOperation = () => new Promise(resolve => setTimeout(resolve, 15000));
      
      await expect(databaseService.executeWithRetry(slowOperation, { timeout: 1000 }))
        .rejects.toThrow('Operation timeout');
    });

    it('should use exponential backoff with jitter', async () => {
      databaseService.circuitBreakerState = 'CLOSED';
      
      const networkError = new Error('Connection failed');
      networkError.name = 'MongoNetworkError';
      
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce('success');
      
      jest.spyOn(global, 'setTimeout').mockImplementation((fn) => fn());
      jest.spyOn(Math, 'random').mockReturnValue(0.5);
      
      const result = await databaseService.executeWithRetry(mockOperation);
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(3);
      
      global.setTimeout.mockRestore();
      Math.random.mockRestore();
    });
  });

  describe('Connection Pool Monitoring', () => {
    it('should setup connection pool monitoring in development', () => {
      process.env.NODE_ENV = 'development';
      
      const mockOn = jest.spyOn(mongoose.connection, 'on');
      
      databaseService.setupConnectionPoolMonitoring();
      
      expect(mockOn).toHaveBeenCalledWith('connectionPoolCreated', expect.any(Function));
      expect(mockOn).toHaveBeenCalledWith('connectionPoolClosed', expect.any(Function));
      
      mockOn.mockRestore();
    });

    it('should not setup monitoring in production by default', () => {
      process.env.NODE_ENV = 'production';
      process.env.DB_MONITOR_POOL = undefined;
      
      const mockOn = jest.spyOn(mongoose.connection, 'on');
      
      databaseService.setupConnectionPoolMonitoring();
      
      expect(mockOn).not.toHaveBeenCalled();
      
      mockOn.mockRestore();
    });
  });
});