const dbConnection = require('../config/database');

describe('Database Connection', () => {
  afterAll(async () => {
    await dbConnection.disconnect();
  });

  describe('Connection Management', () => {
    test('should connect to database successfully', async () => {
      const connection = await dbConnection.connect();
      expect(connection).toBeDefined();
      expect(dbConnection.isConnected).toBe(true);
    });

    test('should return connection status', () => {
      const status = dbConnection.getConnectionStatus();
      expect(status).toHaveProperty('isConnected');
      expect(status).toHaveProperty('readyState');
      expect(status).toHaveProperty('host');
      expect(status).toHaveProperty('port');
      expect(status).toHaveProperty('name');
    });

    test('should perform health check', async () => {
      const health = await dbConnection.healthCheck();
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('timestamp');
      expect(['healthy', 'unhealthy']).toContain(health.status);
    });
  });
});