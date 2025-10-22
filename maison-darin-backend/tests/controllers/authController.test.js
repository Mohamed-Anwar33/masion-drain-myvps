const authController = require('../../controllers/authController');
const User = require('../../models/User');
const jwtService = require('../../services/jwtService');

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_EXPIRE = '15m';

// Mock User model
jest.mock('../../models/User');

describe('Auth Controller', () => {
  let req, res;
  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'admin@maisondarin.com',
    role: 'admin',
    isActive: true,
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    comparePassword: jest.fn(),
    generateTokens: jest.fn(),
    updateLastLogin: jest.fn()
  };

  beforeEach(() => {
    req = {
      body: {},
      user: null,
      token: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    // Clear all mocks
    jest.clearAllMocks();
    jwtService.clearBlacklist();
  });

  describe('login', () => {
    const validLoginData = {
      email: 'admin@maisondarin.com',
      password: 'SecurePass123!'
    };

    it('should login user with valid credentials', async () => {
      req.body = validLoginData;
      
      const mockTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      };

      User.findByEmailWithPassword.mockResolvedValue(mockUser);
      mockUser.comparePassword.mockResolvedValue(true);
      mockUser.generateTokens.mockReturnValue(mockTokens);
      mockUser.updateLastLogin.mockResolvedValue();

      await authController.login(req, res);

      expect(User.findByEmailWithPassword).toHaveBeenCalledWith('admin@maisondarin.com');
      expect(mockUser.comparePassword).toHaveBeenCalledWith('SecurePass123!');
      expect(mockUser.generateTokens).toHaveBeenCalled();
      expect(mockUser.updateLastLogin).toHaveBeenCalled();
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: {
            id: mockUser._id,
            email: mockUser.email,
            role: mockUser.role,
            lastLogin: mockUser.lastLogin
          },
          tokens: {
            accessToken: mockTokens.accessToken,
            refreshToken: mockTokens.refreshToken,
            expiresIn: '15m'
          }
        },
        message: 'Login successful'
      });
    });

    it('should reject login with invalid email format', async () => {
      req.body = { ...validLoginData, email: 'invalid-email' };

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'email',
              message: 'Please provide a valid email address'
            })
          ])
        }
      });
    });

    it('should reject login with missing password', async () => {
      req.body = { email: validLoginData.email };

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'password',
              message: 'Password is required'
            })
          ])
        }
      });
    });

    it('should reject login with non-existent user', async () => {
      req.body = validLoginData;
      User.findByEmailWithPassword.mockResolvedValue(null);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    });

    it('should reject login with inactive user', async () => {
      req.body = validLoginData;
      User.findByEmailWithPassword.mockResolvedValue({ ...mockUser, isActive: false });

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: 'Account is inactive'
        }
      });
    });

    it('should reject login with invalid password', async () => {
      req.body = validLoginData;
      User.findByEmailWithPassword.mockResolvedValue(mockUser);
      mockUser.comparePassword.mockResolvedValue(false);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    });

    it('should handle server errors during login', async () => {
      req.body = validLoginData;
      User.findByEmailWithPassword.mockRejectedValue(new Error('Database error'));

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'LOGIN_FAILED',
          message: 'Login failed due to server error'
        }
      });
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      req.token = 'valid-access-token';

      await authController.logout(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logout successful'
      });
    });

    it('should handle logout without token', async () => {
      req.token = null;

      await authController.logout(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'No token provided for logout'
        }
      });
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const mockRefreshToken = jwtService.generateTokens({
        id: mockUser._id,
        email: mockUser.email,
        role: mockUser.role
      }).refreshToken;

      req.body = { refreshToken: mockRefreshToken };

      await authController.refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          accessToken: expect.any(String),
          expiresIn: '15m'
        },
        message: 'Token refreshed successfully'
      });
    });

    it('should reject refresh with missing token', async () => {
      req.body = {};

      await authController.refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'refreshToken',
              message: 'Refresh token is required'
            })
          ])
        }
      });
    });

    it('should reject refresh with invalid token', async () => {
      req.body = { refreshToken: 'invalid-token' };

      await authController.refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid refresh token'
        }
      });
    });
  });

  describe('getProfile', () => {
    beforeEach(() => {
      req.user = {
        id: mockUser._id,
        email: mockUser.email,
        role: mockUser.role
      };
    });

    it('should get user profile successfully', async () => {
      User.findById.mockResolvedValue(mockUser);

      await authController.getProfile(req, res);

      expect(User.findById).toHaveBeenCalledWith(mockUser._id);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: {
            id: mockUser._id,
            email: mockUser.email,
            role: mockUser.role,
            lastLogin: mockUser.lastLogin,
            isActive: mockUser.isActive,
            createdAt: mockUser.createdAt,
            updatedAt: mockUser.updatedAt
          }
        }
      });
    });

    it('should handle user not found', async () => {
      User.findById.mockResolvedValue(null);

      await authController.getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    });

    it('should handle server errors', async () => {
      User.findById.mockRejectedValue(new Error('Database error'));

      await authController.getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'PROFILE_FETCH_FAILED',
          message: 'Failed to fetch user profile'
        }
      });
    });
  });

  describe('verifyToken', () => {
    beforeEach(() => {
      req.user = {
        id: mockUser._id,
        email: mockUser.email,
        role: mockUser.role
      };
    });

    it('should verify token successfully', async () => {
      await authController.verifyToken(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          valid: true,
          user: {
            id: req.user.id,
            email: req.user.email,
            role: req.user.role
          }
        },
        message: 'Token is valid'
      });
    });
  });
});