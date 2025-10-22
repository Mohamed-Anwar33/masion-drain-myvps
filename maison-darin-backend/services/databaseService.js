const mongoose = require('mongoose');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

class DatabaseService {
  constructor() {
    this.isConnected = false;
    this.retryCount = 0;
    this.maxRetries = parseInt(process.env.DB_MAX_RETRIES) || 5;
    this.retryDelay = parseInt(process.env.DB_RETRY_DELAY) || 5000;
    this.healthCheckInterval = null;
    this.connectionAttempts = 0;
    this.lastHealthCheck = null;
    this.isShuttingDown = false;
    this.connectionPoolMonitor = null;
    this.circuitBreakerState = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.circuitBreakerFailures = 0;
    this.circuitBreakerThreshold = 5;
    this.circuitBreakerTimeout = 60000; // 1 minute
    this.lastCircuitBreakerReset = Date.now();
  }

  /**
   * Enhanced database connection with retry logic and monitoring
   */
  async connect() {
    try {
      this.connectionAttempts++;
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/maison-darin';
      
      const options = {
        maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE) || 10,
        minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE) || 2,
        serverSelectionTimeoutMS: parseInt(process.env.DB_SERVER_SELECTION_TIMEOUT) || 5000,
        socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT) || 45000,
        connectTimeoutMS: parseInt(process.env.DB_CONNECT_TIMEOUT) || 10000,
        bufferCommands: false,
        retryWrites: true,
        retryReads: true,
        readPreference: 'primary',
        heartbeatFrequencyMS: 10000,
        maxIdleTimeMS: 30000,
        // Enhanced resilience options
        compressors: ['zlib'],
        zlibCompressionLevel: 6,
        // Connection pool monitoring
        monitorCommands: process.env.NODE_ENV === 'development'
      };

      // Add connection timeout with circuit breaker pattern
      const connectionPromise = mongoose.connect(mongoUri, options);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout')), options.connectTimeoutMS);
      });

      await Promise.race([connectionPromise, timeoutPromise]);
      
      this.isConnected = true;
      this.retryCount = 0;
      
      logger.info('Database connected successfully', {
        database: mongoose.connection.name,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        attempt: this.connectionAttempts,
        poolSize: options.maxPoolSize
      });
      
      this.setupEventHandlers();
      this.startHealthCheckMonitoring();
      this.setupConnectionPoolMonitoring();
      
      return mongoose.connection;
    } catch (error) {
      logger.error('Database connection failed', {
        error: error.message,
        attempt: this.connectionAttempts,
        retryCount: this.retryCount,
        stack: error.stack
      });
      
      await this.handleConnectionError(error);
    }
  }

  /**
   * Setup comprehensive event handlers for database connection
   */
  setupEventHandlers() {
    mongoose.connection.on('connected', () => {
      logger.info('Mongoose connected to MongoDB');
      this.isConnected = true;
    });

    mongoose.connection.on('error', (err) => {
      logger.error('Mongoose connection error', { 
        error: err.message,
        code: err.code,
        name: err.name
      });
      this.isConnected = false;
      
      // Only attempt reconnection for retryable errors
      if (this.isRetryableError(err)) {
        this.handleConnectionError(err);
      }
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('Mongoose disconnected from MongoDB');
      this.isConnected = false;
      
      // Attempt reconnection if not in graceful shutdown
      if (!this.isShuttingDown) {
        setTimeout(() => {
          if (!this.isConnected && !this.isShuttingDown) {
            logger.info('Attempting automatic reconnection...');
            this.connect().catch(err => {
              logger.error('Automatic reconnection failed', { error: err.message });
            });
          }
        }, 5000);
      }
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('Mongoose reconnected to MongoDB');
      this.isConnected = true;
      this.retryCount = 0;
    });

    mongoose.connection.on('close', () => {
      logger.info('Mongoose connection closed');
      this.isConnected = false;
    });

    // Enhanced connection state monitoring
    mongoose.connection.on('connecting', () => {
      logger.info('Mongoose attempting to connect to MongoDB');
    });

    mongoose.connection.on('disconnecting', () => {
      logger.info('Mongoose disconnecting from MongoDB');
    });

    // Handle application termination gracefully
    process.on('SIGINT', this.gracefulShutdown.bind(this));
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
    process.on('SIGUSR2', this.gracefulShutdown.bind(this)); // nodemon restart
  }

  /**
   * Handle connection errors with exponential backoff
   */
  async handleConnectionError(error) {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      const delay = this.retryDelay * Math.pow(2, this.retryCount - 1); // Exponential backoff
      
      logger.warn('Retrying database connection', {
        attempt: this.retryCount,
        maxRetries: this.maxRetries,
        delayMs: delay,
        error: error.message
      });
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      logger.error('Max retry attempts reached for database connection', {
        maxRetries: this.maxRetries,
        error: error.message
      });
      
      // Don't throw in production, allow app to continue with degraded functionality
      if (process.env.NODE_ENV !== 'production') {
        throw new AppError('Database connection failed after maximum retries', 503, 'DATABASE_CONNECTION_FAILED');
      }
    }
  }

  /**
   * Start periodic health check monitoring
   */
  startHealthCheckMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    const interval = parseInt(process.env.DB_HEALTH_CHECK_INTERVAL) || 30000; // 30 seconds
    
    this.healthCheckInterval = setInterval(async () => {
      try {
        const health = await this.healthCheck();
        
        // Update circuit breaker state based on health
        if (health.status === 'healthy') {
          this.resetCircuitBreaker();
        } else {
          this.recordCircuitBreakerFailure();
        }
      } catch (error) {
        logger.error('Health check failed', { error: error.message });
        this.recordCircuitBreakerFailure();
      }
    }, interval);
  }

  /**
   * Setup connection pool monitoring
   */
  setupConnectionPoolMonitoring() {
    if (process.env.NODE_ENV === 'development' || process.env.DB_MONITOR_POOL === 'true') {
      // Monitor connection pool events
      mongoose.connection.on('connectionPoolCreated', (event) => {
        logger.info('Connection pool created', { 
          address: event.address,
          options: event.options 
        });
      });

      mongoose.connection.on('connectionPoolClosed', (event) => {
        logger.info('Connection pool closed', { address: event.address });
      });

      mongoose.connection.on('connectionCreated', (event) => {
        logger.debug('Connection created', { 
          connectionId: event.connectionId,
          address: event.address 
        });
      });

      mongoose.connection.on('connectionClosed', (event) => {
        logger.debug('Connection closed', { 
          connectionId: event.connectionId,
          reason: event.reason 
        });
      });

      mongoose.connection.on('connectionCheckOutStarted', (event) => {
        logger.debug('Connection checkout started', { address: event.address });
      });

      mongoose.connection.on('connectionCheckOutFailed', (event) => {
        logger.warn('Connection checkout failed', { 
          address: event.address,
          reason: event.reason 
        });
      });

      mongoose.connection.on('connectionCheckedOut', (event) => {
        logger.debug('Connection checked out', { 
          connectionId: event.connectionId,
          address: event.address 
        });
      });

      mongoose.connection.on('connectionCheckedIn', (event) => {
        logger.debug('Connection checked in', { 
          connectionId: event.connectionId,
          address: event.address 
        });
      });
    }
  }

  /**
   * Circuit breaker pattern implementation
   */
  resetCircuitBreaker() {
    if (this.circuitBreakerState !== 'CLOSED') {
      logger.info('Circuit breaker reset to CLOSED state');
      this.circuitBreakerState = 'CLOSED';
      this.circuitBreakerFailures = 0;
      this.lastCircuitBreakerReset = Date.now();
    }
  }

  recordCircuitBreakerFailure() {
    this.circuitBreakerFailures++;
    
    if (this.circuitBreakerState === 'CLOSED' && 
        this.circuitBreakerFailures >= this.circuitBreakerThreshold) {
      this.circuitBreakerState = 'OPEN';
      logger.error('Circuit breaker opened due to repeated failures', {
        failures: this.circuitBreakerFailures,
        threshold: this.circuitBreakerThreshold
      });
    }
  }

  shouldAllowOperation() {
    const now = Date.now();
    
    switch (this.circuitBreakerState) {
      case 'CLOSED':
        return true;
      case 'OPEN':
        if (now - this.lastCircuitBreakerReset > this.circuitBreakerTimeout) {
          this.circuitBreakerState = 'HALF_OPEN';
          logger.info('Circuit breaker moved to HALF_OPEN state');
          return true;
        }
        return false;
      case 'HALF_OPEN':
        return true;
      default:
        return false;
    }
  }

  /**
   * Perform comprehensive health check
   */
  async healthCheck() {
    try {
      const startTime = Date.now();
      
      // Check circuit breaker state
      if (!this.shouldAllowOperation()) {
        throw new Error(`Circuit breaker is ${this.circuitBreakerState}`);
      }
      
      if (!this.isConnected || mongoose.connection.readyState !== 1) {
        throw new Error('Database not connected');
      }

      // Ping the database with timeout
      const pingPromise = mongoose.connection.db.admin().ping();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Health check timeout')), 5000);
      });

      await Promise.race([pingPromise, timeoutPromise]);
      
      // Check connection pool status
      const poolStats = {
        totalConnections: mongoose.connection.db.serverConfig?.connections?.length || 0,
        availableConnections: mongoose.connection.db.serverConfig?.availableConnections?.length || 0
      };

      // Get additional database metrics
      const dbStats = await this.getQuickStats();

      const responseTime = Date.now() - startTime;
      
      this.lastHealthCheck = {
        status: 'healthy',
        responseTime,
        poolStats,
        dbStats,
        circuitBreaker: {
          state: this.circuitBreakerState,
          failures: this.circuitBreakerFailures
        },
        connection: this.getConnectionStatus(),
        timestamp: new Date().toISOString()
      };

      // Log slow health checks
      if (responseTime > 1000) {
        logger.warn('Slow database health check', { responseTime });
      }

      return this.lastHealthCheck;
    } catch (error) {
      this.lastHealthCheck = {
        status: 'unhealthy',
        error: error.message,
        circuitBreaker: {
          state: this.circuitBreakerState,
          failures: this.circuitBreakerFailures
        },
        connection: this.getConnectionStatus(),
        timestamp: new Date().toISOString()
      };

      logger.error('Database health check failed', { 
        error: error.message,
        circuitBreakerState: this.circuitBreakerState
      });
      return this.lastHealthCheck;
    }
  }

  /**
   * Get quick database statistics for health check
   */
  async getQuickStats() {
    try {
      const adminDb = mongoose.connection.db.admin();
      const [serverStatus, dbStats] = await Promise.allSettled([
        adminDb.serverStatus(),
        mongoose.connection.db.stats()
      ]);

      return {
        serverStatus: serverStatus.status === 'fulfilled' ? {
          uptime: serverStatus.value.uptime,
          connections: serverStatus.value.connections,
          opcounters: serverStatus.value.opcounters
        } : null,
        dbStats: dbStats.status === 'fulfilled' ? {
          collections: dbStats.value.collections,
          dataSize: dbStats.value.dataSize,
          storageSize: dbStats.value.storageSize
        } : null
      };
    } catch (error) {
      logger.debug('Failed to get quick stats', { error: error.message });
      return null;
    }
  }

  /**
   * Execute operation with transaction support and retry logic
   */
  async executeWithTransaction(operations, options = {}) {
    // Check circuit breaker before starting transaction
    if (!this.shouldAllowOperation()) {
      throw new AppError(
        `Database operations temporarily unavailable (Circuit breaker: ${this.circuitBreakerState})`,
        503,
        'CIRCUIT_BREAKER_OPEN'
      );
    }

    const session = await mongoose.startSession();
    const maxRetries = options.maxRetries || 3;
    const timeout = options.timeout || 30000;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        attempt++;
        
        // Add timeout to transaction
        const transactionPromise = session.withTransaction(async () => {
          if (typeof operations === 'function') {
            return await operations(session);
          } else if (Array.isArray(operations)) {
            const results = [];
            for (const operation of operations) {
              results.push(await operation(session));
            }
            return results;
          }
          throw new Error('Operations must be a function or array of functions');
        }, {
          readPreference: 'primary',
          readConcern: { level: 'local' },
          writeConcern: { w: 'majority' },
          maxCommitTimeMS: timeout
        });

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Transaction timeout')), timeout);
        });

        const result = await Promise.race([transactionPromise, timeoutPromise]);

        logger.info('Transaction completed successfully', { 
          attempt,
          duration: Date.now() - Date.now() // This would need proper timing
        });
        
        // Reset circuit breaker on success
        this.resetCircuitBreaker();
        
        return result;
      } catch (error) {
        logger.error('Transaction failed', {
          attempt,
          maxRetries,
          error: error.message,
          isRetryable: this.isRetryableError(error)
        });

        // Record failure for circuit breaker
        this.recordCircuitBreakerFailure();

        if (attempt >= maxRetries || !this.isRetryableError(error)) {
          throw new AppError(
            `Transaction failed after ${attempt} attempts: ${error.message}`,
            500,
            'TRANSACTION_FAILED'
          );
        }

        // Wait before retry with exponential backoff
        const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      } finally {
        if (attempt >= maxRetries || session.inTransaction()) {
          await session.endSession();
        }
      }
    }
  }

  /**
   * Execute operation with retry logic for transient errors
   */
  async executeWithRetry(operation, options = {}) {
    // Check circuit breaker before starting operation
    if (!this.shouldAllowOperation()) {
      throw new AppError(
        `Database operations temporarily unavailable (Circuit breaker: ${this.circuitBreakerState})`,
        503,
        'CIRCUIT_BREAKER_OPEN'
      );
    }

    const maxRetries = options.maxRetries || 3;
    const retryDelay = options.retryDelay || 1000;
    const timeout = options.timeout || 10000;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        attempt++;
        
        // Add timeout to operation
        const operationPromise = operation();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Operation timeout')), timeout);
        });

        const result = await Promise.race([operationPromise, timeoutPromise]);
        
        // Reset circuit breaker on success
        this.resetCircuitBreaker();
        
        return result;
      } catch (error) {
        const isRetryableError = this.isRetryableError(error);
        
        logger.error('Operation failed', {
          attempt,
          maxRetries,
          isRetryable: isRetryableError,
          error: error.message,
          circuitBreakerState: this.circuitBreakerState
        });

        // Record failure for circuit breaker
        this.recordCircuitBreakerFailure();

        if (!isRetryableError || attempt >= maxRetries) {
          throw error;
        }

        // Exponential backoff with jitter
        const baseDelay = retryDelay * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 1000; // Add randomness to prevent thundering herd
        const delay = Math.min(baseDelay + jitter, 30000); // Cap at 30 seconds
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Check if error is retryable (transient)
   */
  isRetryableError(error) {
    if (!error) return false;
    
    const retryableErrors = [
      'MongoNetworkError',
      'MongoTimeoutError',
      'MongoServerSelectionError',
      'MongoWriteConcernError'
    ];

    const retryableCodes = [
      11600, // InterruptedAtShutdown
      11602, // InterruptedDueToReplStateChange
      10107, // NotMaster
      13435, // NotMasterNoSlaveOk
      13436, // NotMasterOrSecondary
      189,   // PrimarySteppedDown
      91,    // ShutdownInProgress
      7,     // HostNotFound
      6,     // HostUnreachable
      89,    // NetworkTimeout
      9001   // SocketException
    ];

    return retryableErrors.includes(error.name) || 
           retryableCodes.includes(error.code) ||
           (error.message && error.message.includes('connection')) ||
           (error.message && error.message.includes('timeout'));
  }

  /**
   * Get detailed connection status
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      readyStateText: this.getReadyStateText(mongoose.connection.readyState),
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
      connectionAttempts: this.connectionAttempts,
      retryCount: this.retryCount,
      isShuttingDown: this.isShuttingDown,
      circuitBreaker: {
        state: this.circuitBreakerState,
        failures: this.circuitBreakerFailures,
        threshold: this.circuitBreakerThreshold,
        lastReset: new Date(this.lastCircuitBreakerReset).toISOString()
      },
      lastHealthCheck: this.lastHealthCheck
    };
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus() {
    return {
      state: this.circuitBreakerState,
      failures: this.circuitBreakerFailures,
      threshold: this.circuitBreakerThreshold,
      timeout: this.circuitBreakerTimeout,
      lastReset: new Date(this.lastCircuitBreakerReset).toISOString(),
      allowsOperations: this.shouldAllowOperation()
    };
  }

  /**
   * Get human-readable ready state text
   */
  getReadyStateText(state) {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    return states[state] || 'unknown';
  }

  /**
   * Graceful shutdown with cleanup
   */
  async gracefulShutdown(signal) {
    logger.info('Received shutdown signal, closing database connection', { signal });
    
    this.isShuttingDown = true;
    
    try {
      // Stop all monitoring intervals
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
        this.healthCheckInterval = null;
      }

      if (this.connectionPoolMonitor) {
        clearInterval(this.connectionPoolMonitor);
        this.connectionPoolMonitor = null;
      }

      // Wait for ongoing operations to complete (with timeout)
      const shutdownTimeout = parseInt(process.env.DB_SHUTDOWN_TIMEOUT) || 10000;
      const shutdownPromise = this.waitForOngoingOperations();
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(resolve, shutdownTimeout);
      });

      await Promise.race([shutdownPromise, timeoutPromise]);

      // Close database connection
      await mongoose.connection.close();
      this.isConnected = false;
      
      logger.info('Database connection closed gracefully');
      
      // Exit process
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown', { error: error.message });
      process.exit(1);
    }
  }

  /**
   * Wait for ongoing database operations to complete
   */
  async waitForOngoingOperations() {
    try {
      // Check if there are any active operations
      const activeConnections = mongoose.connection.db?.serverConfig?.connections?.length || 0;
      
      if (activeConnections > 0) {
        logger.info('Waiting for ongoing database operations to complete', {
          activeConnections
        });
        
        // Simple wait - in production, you might want more sophisticated tracking
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      logger.warn('Error checking ongoing operations', { error: error.message });
    }
  }

  /**
   * Force disconnect (for testing)
   */
  async disconnect() {
    try {
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
        this.healthCheckInterval = null;
      }

      await mongoose.connection.close();
      this.isConnected = false;
      
      logger.info('Database connection closed');
    } catch (error) {
      logger.error('Error closing database connection', { error: error.message });
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  async getStats() {
    try {
      if (!this.isConnected) {
        throw new Error('Database not connected');
      }

      const [stats, serverStatus] = await Promise.allSettled([
        mongoose.connection.db.stats(),
        mongoose.connection.db.admin().serverStatus()
      ]);
      
      const dbStats = stats.status === 'fulfilled' ? stats.value : null;
      const serverStats = serverStatus.status === 'fulfilled' ? serverStatus.value : null;

      const result = {
        database: dbStats ? {
          collections: dbStats.collections,
          dataSize: dbStats.dataSize,
          storageSize: dbStats.storageSize,
          indexes: dbStats.indexes,
          indexSize: dbStats.indexSize,
          avgObjSize: dbStats.avgObjSize,
          objects: dbStats.objects
        } : null,
        server: serverStats ? {
          version: serverStats.version,
          uptime: serverStats.uptime,
          connections: serverStats.connections,
          opcounters: serverStats.opcounters,
          mem: serverStats.mem,
          network: serverStats.network
        } : null,
        connection: this.getConnectionStatus(),
        circuitBreaker: this.getCircuitBreakerStatus()
      };

      // Check for alerts
      this.checkForAlerts(result);

      return result;
    } catch (error) {
      logger.error('Failed to get database stats', { error: error.message });
      throw new AppError('Failed to retrieve database statistics', 500, 'DATABASE_STATS_ERROR');
    }
  }

  /**
   * Check for database alerts and log warnings
   */
  checkForAlerts(stats) {
    try {
      // Check connection pool utilization
      if (stats.server?.connections) {
        const { current, available } = stats.server.connections;
        const utilization = current / (current + available);
        
        if (utilization > 0.8) {
          logger.warn('High connection pool utilization', {
            current,
            available,
            utilization: Math.round(utilization * 100) + '%'
          });
        }
      }

      // Check memory usage
      if (stats.server?.mem) {
        const { resident, virtual } = stats.server.mem;
        if (resident > 1000) { // > 1GB
          logger.warn('High database memory usage', {
            resident: `${resident}MB`,
            virtual: `${virtual}MB`
          });
        }
      }

      // Check storage size vs data size ratio
      if (stats.database?.storageSize && stats.database?.dataSize) {
        const ratio = stats.database.storageSize / stats.database.dataSize;
        if (ratio > 3) {
          logger.warn('High storage overhead detected', {
            dataSize: stats.database.dataSize,
            storageSize: stats.database.storageSize,
            ratio: Math.round(ratio * 100) / 100
          });
        }
      }

      // Check circuit breaker state
      if (stats.circuitBreaker?.state !== 'CLOSED') {
        logger.warn('Circuit breaker not in normal state', {
          state: stats.circuitBreaker.state,
          failures: stats.circuitBreaker.failures
        });
      }
    } catch (error) {
      logger.debug('Error checking database alerts', { error: error.message });
    }
  }

  /**
   * Force circuit breaker reset (for admin use)
   */
  forceCircuitBreakerReset() {
    logger.info('Forcing circuit breaker reset');
    this.circuitBreakerState = 'CLOSED';
    this.circuitBreakerFailures = 0;
    this.lastCircuitBreakerReset = Date.now();
  }
}

// Create singleton instance
const databaseService = new DatabaseService();

module.exports = databaseService;