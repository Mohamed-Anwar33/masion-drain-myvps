const { authenticate, authorize, optionalAuth } = require('../../middleware/auth');
const jwtService = require('../../services/jwtService');
const User = require('../../models/User');

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

// Mock User model
jest.mock('../../models/User');

describe('Authentication Middleware', () => {
  let req, res, next;
  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'admin@maisondarin.com',
    role: 'admin',
    isActive: true,
    lastLogin: new Date()
  };

  beforeEach(() => {
    req = {
      headers: {},
      user: null,
      token: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    
    // Clear all mocks
    jest.clearAllMocks();
    jwtService.clearBlacklist();
  });

  describe('authenticate middleware', () => {
    it('should authenticate user with valid token', async () => {
      const tokens = jwtService.generateTokens({
        id: mockUser._id,
        email: mockUser.email,
        role: mockUser.role
      });

      req.headers.authorization = `Bearer ${tokens.accessToken}`;
      User.findById.mockResolvedValue(mockUser);

      await authenticate(req, res, next);

      expect(User.findById).toHaveBeenCalledWith(mockUser._id);
      expect(req.user).toEqual({
        id: mockUser._id,
        email: mockUser.email,
        role: mockUser.role,
        lastLogin: mockUser.lastLogin
      });
      expect(req.token).toBe(tokens.accessToken);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject request without authorization header', async () => {
      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Access token is required'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token format', async () => {
      req.headers.authorization = 'InvalidFormat token';

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_TOKEN_FORMAT',
          message: 'Token must be in Bearer format'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with empty token', async () => {
      req.headers.authorization = 'Bearer ';

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Access token is required'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', async () => {
      req.headers.authorization = 'Bearer invalid-token';

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid access token'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request when user not found', async () => {
      const tokens = jwtService.generateTokens({
        id: mockUser._id,
        email: mockUser.email,
        role: mockUser.role
      });

      req.headers.authorization = `Bearer ${tokens.accessToken}`;
      User.findById.mockResolvedValue(null);

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request when user is inactive', async () => {
      const tokens = jwtService.generateTokens({
        id: mockUser._id,
        email: mockUser.email,
        role: mockUser.role
      });

      req.headers.authorization = `Bearer ${tokens.accessToken}`;
      User.findById.mockResolvedValue({ ...mockUser, isActive: false });

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'USER_INACTIVE',
          message: 'User account is inactive'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject blacklisted token', async () => {
      const tokens = jwtService.generateTokens({
        id: mockUser._id,
        email: mockUser.email,
        role: mockUser.role
      });

      jwtService.blacklistToken(tokens.accessToken);
      req.headers.authorization = `Bearer ${tokens.accessToken}`;

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'TOKEN_INVALIDATED',
          message: 'Token has been invalidated'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('authorize middleware', () => {
    beforeEach(() => {
      req.user = {
        id: mockUser._id,
        email: mockUser.email,
        role: 'admin'
      };
    });

    it('should allow access with correct role', () => {
      const middleware = authorize(['admin']);
      
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow access when no roles specified', () => {
      const middleware = authorize();
      
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny access with incorrect role', () => {
      const middleware = authorize(['superadmin']);
      
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Insufficient permissions to access this resource'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should deny access when user not authenticated', () => {
      req.user = null;
      const middleware = authorize(['admin']);
      
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow access with multiple roles', () => {
      const middleware = authorize(['admin', 'user']);
      
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth middleware', () => {
    it('should continue without authentication when no token provided', async () => {
      await optionalAuth(req, res, next);

      expect(req.user).toBeNull();
      expect(req.token).toBeNull();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should authenticate user when valid token provided', async () => {
      const tokens = jwtService.generateTokens({
        id: mockUser._id,
        email: mockUser.email,
        role: mockUser.role
      });

      req.headers.authorization = `Bearer ${tokens.accessToken}`;
      User.findById.mockResolvedValue(mockUser);

      await optionalAuth(req, res, next);

      expect(req.user).toEqual({
        id: mockUser._id,
        email: mockUser.email,
        role: mockUser.role,
        lastLogin: mockUser.lastLogin
      });
      expect(req.token).toBe(tokens.accessToken);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should continue without authentication when invalid token provided', async () => {
      req.headers.authorization = 'Bearer invalid-token';

      await optionalAuth(req, res, next);

      expect(req.user).toBeNull();
      expect(req.token).toBeNull();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should continue without authentication when user not found', async () => {
      const tokens = jwtService.generateTokens({
        id: mockUser._id,
        email: mockUser.email,
        role: mockUser.role
      });

      req.headers.authorization = `Bearer ${tokens.accessToken}`;
      User.findById.mockResolvedValue(null);

      await optionalAuth(req, res, next);

      expect(req.user).toBeNull();
      expect(req.token).toBeNull();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should continue without authentication when user is inactive', async () => {
      const tokens = jwtService.generateTokens({
        id: mockUser._id,
        email: mockUser.email,
        role: mockUser.role
      });

      req.headers.authorization = `Bearer ${tokens.accessToken}`;
      User.findById.mockResolvedValue({ ...mockUser, isActive: false });

      await optionalAuth(req, res, next);

      expect(req.user).toBeNull();
      expect(req.token).toBeNull();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});