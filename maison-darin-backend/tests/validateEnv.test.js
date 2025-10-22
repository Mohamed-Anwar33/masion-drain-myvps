const { validateEnv, getConfig } = require('../utils/validateEnv');

describe('Environment Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('validateEnv', () => {
    test('should validate with minimum required environment variables', () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);

      expect(() => validateEnv()).not.toThrow();
    });

    test('should throw error when MONGODB_URI is missing', () => {
      delete process.env.MONGODB_URI;
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);

      expect(() => validateEnv()).toThrow('MONGODB_URI is required');
    });

    test('should throw error when JWT_SECRET is too short', () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      process.env.JWT_SECRET = 'short';
      process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);

      expect(() => validateEnv()).toThrow('JWT_SECRET must be at least 32 characters long');
    });

    test('should use default values for optional variables', () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);

      const result = validateEnv();
      
      expect(result.NODE_ENV).toBe('development');
      expect(result.PORT).toBe(5000);
      expect(result.JWT_EXPIRE).toBe('15m');
    });
  });

  describe('getConfig', () => {
    test('should return structured configuration object', () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);
      process.env.PORT = '3000';

      const config = getConfig();

      expect(config).toHaveProperty('server');
      expect(config).toHaveProperty('database');
      expect(config).toHaveProperty('jwt');
      expect(config).toHaveProperty('cloudinary');
      expect(config).toHaveProperty('security');
      expect(config).toHaveProperty('frontend');

      expect(config.server.port).toBe(3000);
      expect(config.database.uri).toBe('mongodb://localhost:27017/test');
    });
  });
});