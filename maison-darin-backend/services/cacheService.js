const logger = require('../utils/logger');

/**
 * In-memory caching service with TTL support
 */
class CacheService {
  constructor() {
    this.cache = new Map();
    this.ttlMap = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes
    this.maxCacheSize = 1000;
    this.cleanupInterval = 60 * 1000; // 1 minute
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0
    };
    
    // Start cleanup interval
    this.startCleanupInterval();
  }

  /**
   * Set a value in cache with TTL
   */
  set(key, value, ttl = this.defaultTTL) {
    try {
      // Check cache size limit
      if (this.cache.size >= this.maxCacheSize && !this.cache.has(key)) {
        this.evictLRU();
      }

      const expiresAt = Date.now() + ttl;
      
      this.cache.set(key, {
        value,
        createdAt: Date.now(),
        accessedAt: Date.now(),
        accessCount: 0
      });
      
      this.ttlMap.set(key, expiresAt);
      this.stats.sets++;
      
      logger.debug('Cache set', { key, ttl, cacheSize: this.cache.size });
      return true;
    } catch (error) {
      logger.error('Cache set error', { key, error: error.message });
      return false;
    }
  }

  /**
   * Get a value from cache
   */
  get(key) {
    try {
      const item = this.cache.get(key);
      const expiresAt = this.ttlMap.get(key);
      
      if (!item || !expiresAt) {
        this.stats.misses++;
        return null;
      }
      
      // Check if expired
      if (Date.now() > expiresAt) {
        this.delete(key);
        this.stats.misses++;
        return null;
      }
      
      // Update access statistics
      item.accessedAt = Date.now();
      item.accessCount++;
      
      this.stats.hits++;
      logger.debug('Cache hit', { key, accessCount: item.accessCount });
      
      return item.value;
    } catch (error) {
      logger.error('Cache get error', { key, error: error.message });
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Delete a value from cache
   */
  delete(key) {
    try {
      const deleted = this.cache.delete(key);
      this.ttlMap.delete(key);
      
      if (deleted) {
        this.stats.deletes++;
        logger.debug('Cache delete', { key });
      }
      
      return deleted;
    } catch (error) {
      logger.error('Cache delete error', { key, error: error.message });
      return false;
    }
  }

  /**
   * Check if key exists in cache
   */
  has(key) {
    const exists = this.cache.has(key);
    const expiresAt = this.ttlMap.get(key);
    
    if (exists && expiresAt && Date.now() > expiresAt) {
      this.delete(key);
      return false;
    }
    
    return exists;
  }

  /**
   * Clear all cache
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.ttlMap.clear();
    
    logger.info('Cache cleared', { previousSize: size });
    return true;
  }

  /**
   * Get or set pattern - get from cache or execute function and cache result
   */
  async getOrSet(key, fn, ttl = this.defaultTTL) {
    try {
      // Try to get from cache first
      const cached = this.get(key);
      if (cached !== null) {
        return cached;
      }
      
      // Execute function and cache result
      const result = await fn();
      this.set(key, result, ttl);
      
      return result;
    } catch (error) {
      logger.error('Cache getOrSet error', { key, error: error.message });
      throw error;
    }
  }

  /**
   * Evict least recently used item
   */
  evictLRU() {
    let oldestKey = null;
    let oldestTime = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (item.accessedAt < oldestTime) {
        oldestTime = item.accessedAt;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.delete(oldestKey);
      this.stats.evictions++;
      logger.debug('Cache LRU eviction', { key: oldestKey });
    }
  }

  /**
   * Start cleanup interval to remove expired items
   */
  startCleanupInterval() {
    setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  /**
   * Clean up expired items
   */
  cleanup() {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, expiresAt] of this.ttlMap.entries()) {
      if (now > expiresAt) {
        this.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      logger.debug('Cache cleanup completed', { 
        cleanedCount, 
        remainingSize: this.cache.size 
      });
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;
    
    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      memoryUsage: this.getMemoryUsage()
    };
  }

  /**
   * Estimate memory usage
   */
  getMemoryUsage() {
    let totalSize = 0;
    
    for (const [key, item] of this.cache.entries()) {
      totalSize += JSON.stringify(key).length;
      totalSize += JSON.stringify(item.value).length;
    }
    
    return {
      estimated: `${(totalSize / 1024).toFixed(2)} KB`,
      items: this.cache.size
    };
  }

  /**
   * Get cache keys by pattern
   */
  getKeysByPattern(pattern) {
    const regex = new RegExp(pattern);
    const matchingKeys = [];
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        matchingKeys.push(key);
      }
    }
    
    return matchingKeys;
  }

  /**
   * Delete keys by pattern
   */
  deleteByPattern(pattern) {
    const keys = this.getKeysByPattern(pattern);
    let deletedCount = 0;
    
    for (const key of keys) {
      if (this.delete(key)) {
        deletedCount++;
      }
    }
    logger.info('Cache pattern delete', { pattern, deletedCount });
    return deletedCount;
  }

  /**
   * Warm up cache with common data
   */
  async warmUp(warmUpFunctions = []) {
    logger.info('Starting cache warm-up');
    
    for (const { key, fn, ttl } of warmUpFunctions) {
      try {
        await this.getOrSet(key, fn, ttl);
        logger.debug('Cache warm-up completed for key', { key });
      } catch (error) {
        logger.error('Cache warm-up failed for key', { key, error: error.message });
      }
    }
    
    logger.info('Cache warm-up completed', { size: this.cache.size });
  }

  /**
   * Health check for cache service
   */
  async healthCheck() {
    try {
      const testKey = '__health_check__';
      const testValue = { timestamp: Date.now() };
      
      // Test set operation
      const setResult = this.set(testKey, testValue, 1000);
      if (!setResult) {
        throw new Error('Cache set operation failed');
      }
      
      // Test get operation
      const getValue = this.get(testKey);
      if (!getValue || getValue.timestamp !== testValue.timestamp) {
        throw new Error('Cache get operation failed');
      }
      
      // Test delete operation
      const deleteResult = this.delete(testKey);
      if (!deleteResult) {
        throw new Error('Cache delete operation failed');
      }
      
      const stats = this.getStats();
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        stats,
        operations: {
          set: true,
          get: true,
          delete: true
        }
      };
    } catch (error) {
      logger.error('Cache health check failed', { error: error.message });
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }
}

// Create singleton instance
const cacheService = new CacheService();
module.exports = cacheService;