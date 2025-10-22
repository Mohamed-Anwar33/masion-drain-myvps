const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_EXPIRE = '15m';
process.env.JWT_REFRESH_EXPIRE = '7d';

describe('User Model - Unit Tests', () => {
  describe('Password Validation', () => {
    it('should return true for strong password', () => {
      const strongPassword = 'SecurePass123!';
      expect(User.validatePassword(strongPassword)).toBe(true);
    });

    it('should return false for password less than 8 characters', () => {
      expect(User.validatePassword('Short1!')).toBe(false);
    });

    it('should return false for password without uppercase letter', () => {
      expect(User.validatePassword('securepass123!')).toBe(false);
    });

    it('should return false for password without lowercase letter', () => {
      expect(User.validatePassword('SECUREPASS123!')).toBe(false);
    });

    it('should return false for password without number', () => {
      expect(User.validatePassword('SecurePass!')).toBe(false);
    });

    it('should return false for password without special character', () => {
      expect(User.validatePassword('SecurePass123')).toBe(false);
    });

    it('should accept various special characters', () => {
      const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', ',', '.', '?', '"', ':', '{', '}', '|', '<', '>'];
      
      specialChars.forEach(char => {
        const password = `SecurePass123${char}`;
        expect(User.validatePassword(password)).toBe(true);
      });
    });
  });

  describe('Password Comparison Method', () => {
    it('should have comparePassword method', () => {
      const user = new User();
      expect(typeof user.comparePassword).toBe('function');
    });
  });

  describe('Token Generation Method', () => {
    it('should have generateTokens method', () => {
      const user = new User();
      expect(typeof user.generateTokens).toBe('function');
    });

    it('should generate tokens with correct structure', () => {
      const user = new User({
        _id: '507f1f77bcf86cd799439011',
        email: 'admin@maisondarin.com',
        role: 'admin'
      });

      const tokens = user.generateTokens();

      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
    });

    it('should generate valid JWT tokens', () => {
      const user = new User({
        _id: '507f1f77bcf86cd799439011',
        email: 'admin@maisondarin.com',
        role: 'admin'
      });

      const tokens = user.generateTokens();

      const accessPayload = jwt.verify(tokens.accessToken, process.env.JWT_SECRET);
      const refreshPayload = jwt.verify(tokens.refreshToken, process.env.JWT_REFRESH_SECRET);

      expect(accessPayload.id).toBe(user._id.toString());
      expect(accessPayload.email).toBe(user.email);
      expect(accessPayload.role).toBe(user.role);

      expect(refreshPayload.id).toBe(user._id.toString());
      expect(refreshPayload.email).toBe(user.email);
      expect(refreshPayload.role).toBe(user.role);
    });

    it('should set correct expiration times', () => {
      const user = new User({
        _id: '507f1f77bcf86cd799439011',
        email: 'admin@maisondarin.com',
        role: 'admin'
      });

      const tokens = user.generateTokens();

      const accessPayload = jwt.decode(tokens.accessToken);
      const refreshPayload = jwt.decode(tokens.refreshToken);

      // Access token should expire in 15 minutes (900 seconds)
      const accessExpiry = accessPayload.exp - accessPayload.iat;
      expect(accessExpiry).toBe(900);

      // Refresh token should expire in 7 days (604800 seconds)
      const refreshExpiry = refreshPayload.exp - refreshPayload.iat;
      expect(refreshExpiry).toBe(604800);
    });
  });

  describe('Schema Structure', () => {
    it('should have correct schema fields', () => {
      const user = new User();
      
      // Check that schema has required fields
      expect(user.schema.paths).toHaveProperty('email');
      expect(user.schema.paths).toHaveProperty('password');
      expect(user.schema.paths).toHaveProperty('role');
      expect(user.schema.paths).toHaveProperty('lastLogin');
      expect(user.schema.paths).toHaveProperty('isActive');
      expect(user.schema.paths).toHaveProperty('createdAt');
      expect(user.schema.paths).toHaveProperty('updatedAt');
    });

    it('should have correct default values', () => {
      const user = new User();
      
      expect(user.role).toBe('admin');
      expect(user.isActive).toBe(true);
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    it('should have email validation', () => {
      const emailPath = User.schema.paths.email;
      
      expect(emailPath.isRequired).toBe(true);
      expect(emailPath.options.unique).toBe(true);
      expect(emailPath.options.lowercase).toBe(true);
      expect(emailPath.options.trim).toBe(true);
    });

    it('should have password validation', () => {
      const passwordPath = User.schema.paths.password;
      
      expect(passwordPath.isRequired).toBe(true);
      expect(passwordPath.options.minlength[0]).toBe(8);
      expect(passwordPath.options.select).toBe(false);
    });
  });

  describe('Static Methods', () => {
    it('should have createUser static method', () => {
      expect(typeof User.createUser).toBe('function');
    });

    it('should have findByEmailWithPassword static method', () => {
      expect(typeof User.findByEmailWithPassword).toBe('function');
    });

    it('should have validatePassword static method', () => {
      expect(typeof User.validatePassword).toBe('function');
    });
  });

  describe('Instance Methods', () => {
    it('should have updateLastLogin instance method', () => {
      const user = new User();
      expect(typeof user.updateLastLogin).toBe('function');
    });

    it('should have comparePassword instance method', () => {
      const user = new User();
      expect(typeof user.comparePassword).toBe('function');
    });

    it('should have generateTokens instance method', () => {
      const user = new User();
      expect(typeof user.generateTokens).toBe('function');
    });
  });
});