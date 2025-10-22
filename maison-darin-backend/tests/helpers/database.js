const mongoose = require('mongoose');

/**
 * Database Test Helper
 * Provides utilities for setting up and tearing down test databases
 */

class DatabaseTestHelper {
  constructor() {
    this.connection = null;
    this.originalUri = null;
  }

  /**
   * Connect to test database
   */
  async connect() {
    // Close existing connection if any
    await this.disconnect();

    // Use test database URI
    const testUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/maison-darin-test';
    
    try {
      // Connect mongoose to the test database
      this.connection = await mongoose.connect(testUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });

      return this.connection;
    } catch (error) {
      console.warn('Failed to connect to MongoDB for testing. Using mock mode.');
      return null;
    }
  }

  /**
   * Disconnect and cleanup
   */
  async disconnect() {
    if (this.connection && mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      this.connection = null;
    }
  }

  /**
   * Clear all collections in the database
   */
  async clearDatabase() {
    if (!this.connection) {
      throw new Error('Database not connected');
    }

    const collections = mongoose.connection.collections;
    
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }

  /**
   * Drop the entire database
   */
  async dropDatabase() {
    if (!this.connection) {
      throw new Error('Database not connected');
    }

    await mongoose.connection.dropDatabase();
  }

  /**
   * Get connection status
   */
  isConnected() {
    return mongoose.connection.readyState === 1;
  }

  /**
   * Setup database for testing (connect and clear)
   */
  async setup() {
    await this.connect();
    await this.clearDatabase();
  }

  /**
   * Teardown database after testing
   */
  async teardown() {
    await this.clearDatabase();
    await this.disconnect();
  }

  /**
   * Create indexes for better test performance
   */
  async createIndexes() {
    if (!this.connection) {
      throw new Error('Database not connected');
    }

    // Get all models and ensure indexes
    const models = mongoose.models;
    
    for (const modelName in models) {
      const model = models[modelName];
      try {
        await model.createIndexes();
      } catch (error) {
        console.warn(`Failed to create indexes for ${modelName}:`, error.message);
      }
    }
  }

  /**
   * Get database statistics
   */
  async getStats() {
    if (!this.connection) {
      throw new Error('Database not connected');
    }

    const stats = await mongoose.connection.db.stats();
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    return {
      ...stats,
      collections: collections.map(col => col.name),
      connectionState: mongoose.connection.readyState
    };
  }
}

// Export singleton instance
const dbHelper = new DatabaseTestHelper();

module.exports = dbHelper;