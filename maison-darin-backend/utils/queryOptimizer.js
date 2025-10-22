const mongoose = require('mongoose');
const logger = require('./logger');

/**
 * Query optimization utilities for improved database performance
 */
class QueryOptimizer {
  constructor() {
    this.queryCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.slowQueryThreshold = 1000; // 1 second
  }

  /**
   * Add database indexes for common queries
   */
  static async createOptimalIndexes() {
    try {
      const db = mongoose.connection.db;
      
      // Products collection indexes
      await db.collection('products').createIndex({ name: 'text', description: 'text' });
      await db.collection('products').createIndex({ category: 1, isActive: 1 });
      await db.collection('products').createIndex({ price: 1 });
      await db.collection('products').createIndex({ createdAt: -1 });
      await db.collection('products').createIndex({ isActive: 1, featured: 1 });
      
      // Orders collection indexes
      await db.collection('orders').createIndex({ customerId: 1, createdAt: -1 });
      await db.collection('orders').createIndex({ status: 1, createdAt: -1 });
      await db.collection('orders').createIndex({ createdAt: -1 });
      await db.collection('orders').createIndex({ 'customer.email': 1 });
      
      // Customers collection indexes
      await db.collection('customers').createIndex({ email: 1 }, { unique: true });
      await db.collection('customers').createIndex({ phone: 1 });
      await db.collection('customers').createIndex({ createdAt: -1 });
      
      // Payments collection indexes
      await db.collection('payments').createIndex({ orderId: 1 });
      await db.collection('payments').createIndex({ status: 1, createdAt: -1 });
      await db.collection('payments').createIndex({ method: 1, createdAt: -1 });
      
      logger.info('Database indexes created successfully');
    } catch (error) {
      logger.error('Failed to create database indexes', { error: error.message });
    }
  }

  /**
   * Optimize aggregation pipeline for better performance
   */
  static optimizeAggregationPipeline(pipeline) {
    const optimized = [...pipeline];
    
    // Move $match stages to the beginning
    const matchStages = optimized.filter(stage => stage.$match);
    const otherStages = optimized.filter(stage => !stage.$match);
    
    // Add $limit early if not present and no $sort
    const hasSort = otherStages.some(stage => stage.$sort);
    const hasLimit = otherStages.some(stage => stage.$limit);
    
    if (!hasLimit && !hasSort) {
      otherStages.push({ $limit: 1000 }); // Default limit
    }
    
    return [...matchStages, ...otherStages];
  }

  /**
   * Add query performance monitoring
   */
  static monitorQuery(model, operation, query = {}) {
    const startTime = Date.now();
    
    return {
      finish: (result) => {
        const duration = Date.now() - startTime;
        
        if (duration > this.slowQueryThreshold) {
          logger.warn('Slow query detected', {
            model: model.modelName,
            operation,
            duration,
            query: JSON.stringify(query),
            resultCount: Array.isArray(result) ? result.length : 1
          });
        }
        
        return result;
      }
    };
  }

  /**
   * Optimize find queries with proper field selection and population
   */
  static optimizeFindQuery(query) {
    return query
      .lean() // Return plain JavaScript objects instead of Mongoose documents
      .maxTimeMS(10000) // Set query timeout
      .hint({ _id: 1 }); // Use index hint when appropriate
  }

  /**
   * Batch operations for better performance
   */
  static async batchInsert(model, documents, batchSize = 100) {
    const results = [];
    
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      const batchResult = await model.insertMany(batch, { 
        ordered: false, // Continue on error
        rawResult: true 
      });
      results.push(batchResult);
    }
    
    return results;
  }

  /**
   * Optimize pagination queries
   */
  static optimizePagination(query, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    return query
      .skip(skip)
      .limit(Math.min(limit, 100)) // Cap limit at 100
      .lean();
  }

  /**
   * Cache frequently accessed data
   */
  async getCachedQuery(key, queryFn, ttl = this.cacheTimeout) {
    const cached = this.queryCache.get(key);
    
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
    
    const data = await queryFn();
    this.queryCache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    // Clean up expired cache entries
    this.cleanupCache();
    
    return data;
  }

  /**
   * Clean up expired cache entries
   */
  cleanupCache() {
    const now = Date.now();
    for (const [key, value] of this.queryCache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.queryCache.delete(key);
      }
    }
  }

  /**
   * Get query statistics
   */
  getStats() {
    return {
      cacheSize: this.queryCache.size,
      cacheTimeout: this.cacheTimeout,
      slowQueryThreshold: this.slowQueryThreshold
    };
  }
}

module.exports = QueryOptimizer;