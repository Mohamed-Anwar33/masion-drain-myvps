const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_EXPIRE = '15m';
process.env.JWT_REFRESH_EXPIRE = '7d';

describe('User Model', () => {
  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/maison-darin-test';
    await mongoose.connect(mongoUri);
  });

  beforeEach(async () => {
    // Clear users collection before each test
    await User.deleteMany({});
  });

  afterAll(async () => {
    // Clean up and close connection
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  describe('User Schema Validation', () => {
    it('should create a valid user with required fields', async () => {
      const userData = {
        email: 'admin@maisondarin.com',
        password: 'SecurePass123!'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.email).toBe(userData.email.toLowerCase());
      expect(savedUser.role).toBe('admin');
      expect(savedUser.isActive).toBe(true);
      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.updatedAt).toBeDefined();
    });

    it('should require email field', async () => {
      const user = new User({
        password: 'SecurePass123!'
      });

      await expect(user.save()).rejects.toThrow('Email is required');
    });

    it('should require password field', async () => {
      const user = new User({
        email: 'admin@maisondarin.com'
      });

      await expect(user.save()).rejects.toThrow('Password is required');
    });

    it('should validate email format', async () => {
      const user = new User({
        email: 'invalid-email',
        password: 'SecurePass123!'
      });

      await expect(user.save()).rejects.toThrow('Please provide a valid email address');
    });

    it('should enforce unique email constraint', async () => {
      const userData = {
        email: 'admin@maisondarin.com',
        password: 'SecurePass123!'
      };

      await User.create(userData);

      const duplicateUser = new User(userData);
      await expect(duplicateUser.save()).rejects.toThrow();
    });

    it('should convert email to lowercase', async () => {
      const user = new User({
        email: 'ADMIN@MAISONDARIN.COM',
        password: 'SecurePass123!'
      });

      const savedUser = await user.save();
      expect(savedUser.email).toBe('admin@maisondarin.com');
    });

    it('should trim email whitespace', async () => {
      const user = new User({
        email: '  admin@maisondarin.com  ',
        password: 'SecurePass123!'
      });

      const savedUser = await user.save();
      expect(savedUser.email).toBe('admin@maisondarin.com');
    });

    it('should enforce minimum password length', async () => {
      const user = new User({
        email: 'admin@maisondarin.com',
        password: 'short'
      });

      await expect(user.save()).rejects.toThrow('Password must be at least 8 characters long');
    });

    it('should set default role to admin', async () => {
      const user = new User({
        email: 'admin@maisondarin.com',
        password: 'SecurePass123!'
      });

      const savedUser = await user.save();
      expect(savedUser.role).toBe('admin');
    });

    it('should set default isActive to true', async () => {
      const user = new User({
        email: 'admin@maisondarin.com',
        password: 'SecurePass123!'
      });

      const savedUser = await user.save();
      expect(savedUser.isActive).toBe(true);
    });
  });

  describe('Password Hashing', () => {
    it('should hash password before saving', async () => {
      const plainPassword = 'SecurePass123!';
      const user = new User({
        email: 'admin@maisondarin.com',
        password: plainPassword
      });

      const savedUser = await user.save();
      
      // Password should be hashed, not plain text
      expect(savedUser.password).not.toBe(plainPassword);
      expect(savedUser.password).toMatch(/^\$2[aby]\$12\$/); // bcrypt hash pattern
    });

    it('should not rehash password if not modified', async () => {
      const user = await User.create({
        email: 'admin@maisondarin.com',
        password: 'SecurePass123!'
      });

      const originalHash = user.password;
      
      // Update non-password field
      user.lastLogin = new Date();
      await user.save();

      expect(user.password).toBe(originalHash);
    });

    it('should use salt rounds of 12', async () => {
      const user = new User({
        email: 'admin@maisondarin.com',
        password: 'SecurePass123!'
      });

      const savedUser = await user.save();
      
      // Check if hash uses 12 rounds (appears as $2a$12$ in hash)
      expect(savedUser.password).toMatch(/^\$2[aby]\$12\$/);
    });
  });

  describe('Password Comparison', () => {
    let user;

    beforeEach(async () => {
      user = await User.create({
        email: 'admin@maisondarin.com',
        password: 'SecurePass123!'
      });
    });

    it('should return true for correct password', async () => {
      const isMatch = await user.comparePassword('SecurePass123!');
      expect(isMatch).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const isMatch = await user.comparePassword('WrongPassword');
      expect(isMatch).toBe(false);
    });

    it('should handle empty password', async () => {
      const isMatch = await user.comparePassword('');
      expect(isMatch).toBe(false);
    });

    it('should throw error for invalid comparison', async () => {
      // Mock bcrypt.compare to throw error
      const originalCompare = bcrypt.compare;
      bcrypt.compare = jest.fn().mockRejectedValue(new Error('Comparison failed'));

      await expect(user.comparePassword('test')).rejects.toThrow('Password comparison failed');

      // Restore original function
      bcrypt.compare = originalCompare;
    });
  });

  describe('Token Generation', () => {
    let user;

    beforeEach(async () => {
      user = await User.create({
        email: 'admin@maisondarin.com',
        password: 'SecurePass123!'
      });
    });

    it('should generate access and refresh tokens', () => {
      const tokens = user.generateTokens();

      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
    });

    it('should generate valid JWT tokens', () => {
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

  describe('Static Methods', () => {
    describe('findByEmailWithPassword', () => {
      beforeEach(async () => {
        await User.create({
          email: 'admin@maisondarin.com',
          password: 'SecurePass123!'
        });
      });

      it('should find user by email and include password', async () => {
        const user = await User.findByEmailWithPassword('admin@maisondarin.com');

        expect(user).toBeTruthy();
        expect(user.email).toBe('admin@maisondarin.com');
        expect(user.password).toBeDefined();
      });

      it('should return null for non-existent email', async () => {
        const user = await User.findByEmailWithPassword('nonexistent@example.com');
        expect(user).toBeNull();
      });
    });

    describe('createUser', () => {
      it('should create user with valid data', async () => {
        const userData = {
          email: 'admin@maisondarin.com',
          password: 'SecurePass123!'
        };

        const user = await User.createUser(userData);

        expect(user.email).toBe(userData.email);
        expect(user.password).not.toBe(userData.password); // Should be hashed
      });

      it('should throw error for duplicate email', async () => {
        const userData = {
          email: 'admin@maisondarin.com',
          password: 'SecurePass123!'
        };

        await User.create(userData);

        await expect(User.createUser(userData))
          .rejects.toThrow('User with this email already exists');
      });

      it('should throw error for weak password', async () => {
        const userData = {
          email: 'admin@maisondarin.com',
          password: 'weakpass'
        };

        await expect(User.createUser(userData))
          .rejects.toThrow('Password does not meet security requirements');
      });
    });

    describe('validatePassword', () => {
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
    });
  });

  describe('Instance Methods', () => {
    let user;

    beforeEach(async () => {
      user = await User.create({
        email: 'admin@maisondarin.com',
        password: 'SecurePass123!'
      });
    });

    describe('updateLastLogin', () => {
      it('should update lastLogin timestamp', async () => {
        const originalLastLogin = user.lastLogin;
        
        await user.updateLastLogin();
        
        expect(user.lastLogin).toBeDefined();
        expect(user.lastLogin).not.toBe(originalLastLogin);
        expect(user.lastLogin instanceof Date).toBe(true);
      });

      it('should save the updated user', async () => {
        await user.updateLastLogin();
        
        const updatedUser = await User.findById(user._id);
        expect(updatedUser.lastLogin).toBeDefined();
      });
    });
  });

  describe('Middleware', () => {
    it('should update updatedAt field on save', async () => {
      const user = await User.create({
        email: 'admin@maisondarin.com',
        password: 'SecurePass123!'
      });

      const originalUpdatedAt = user.updatedAt;
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      user.lastLogin = new Date();
      await user.save();

      expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});