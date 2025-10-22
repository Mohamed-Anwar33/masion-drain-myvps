const jwtService = require('../services/jwtService');
const User = require('../models/User');

/**
 * Authentication middleware to verify JWT tokens with enhanced security
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Access token is required'
        }
      });
    }

    // Check if header starts with 'Bearer '
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN_FORMAT',
          message: 'Token must be in Bearer format'
        }
      });
    }

    // Extract token from header
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Access token is required'
        }
      });
    }

    // Verify token
    const decoded = jwtService.verifyAccessToken(token);

    // Get user from database to ensure user still exists and is active
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_INACTIVE',
          message: 'User account is inactive'
        }
      });
    }

    // Enhanced security: Check for session validity
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.iat && (currentTime - decoded.iat) > (24 * 60 * 60)) { // 24 hours max session
      return res.status(401).json({
        success: false,
        error: {
          code: 'SESSION_EXPIRED',
          message: 'Session has expired, please login again'
        }
      });
    }

    // Log authentication for security monitoring
    console.log(`Authentication successful for user: ${user.email} at ${new Date().toISOString()}`);

    // Add user and token info to request object
    req.user = {
      id: user._id,
      email: user.email,
      role: user.role,
      lastLogin: user.lastLogin,
      sessionStart: decoded.iat
    };
    req.token = token;

    next();
  } catch (error) {
    // Enhanced error logging for security monitoring
    console.error(`Authentication failed: ${error.message} at ${new Date().toISOString()}`);
    
    // Handle different types of token errors
    let errorCode = 'AUTHENTICATION_FAILED';
    let errorMessage = 'Authentication failed';

    if (error.message.includes('expired')) {
      errorCode = 'TOKEN_EXPIRED';
      errorMessage = 'Access token has expired';
    } else if (error.message.includes('invalidated')) {
      errorCode = 'TOKEN_INVALIDATED';
      errorMessage = 'Token has been invalidated';
    } else if (error.message.includes('invalid') || error.message.includes('Invalid')) {
      errorCode = 'INVALID_TOKEN';
      errorMessage = 'Invalid access token';
    }

    return res.status(401).json({
      success: false,
      error: {
        code: errorCode,
        message: errorMessage
      }
    });
  }
};

/**
 * Authorization middleware to check user roles
 * @param {Array} allowedRoles - Array of allowed roles
 * @returns {Function} - Express middleware function
 */
const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required'
          }
        });
      }

      // If no roles specified, allow any authenticated user
      if (allowedRoles.length === 0) {
        return next();
      }

      // Check if user has required role
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Insufficient permissions to access this resource'
          }
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Authorization check failed'
        }
      });
    }
  };
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 * Useful for endpoints that work for both authenticated and unauthenticated users
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    // If no auth header, continue without authentication
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return next();
    }

    try {
      // Try to verify token
      const decoded = jwtService.verifyAccessToken(token);
      
      // Get user from database
      const user = await User.findById(decoded.id);
      
      if (user && user.isActive) {
        req.user = {
          id: user._id,
          email: user.email,
          role: user.role,
          lastLogin: user.lastLogin
        };
        req.token = token;
      }
    } catch (error) {
      // If token verification fails, continue without authentication
      // This allows the endpoint to work for unauthenticated users
    }

    next();
  } catch (error) {
    // If any other error occurs, continue without authentication
    next();
  }
};

/**
 * Middleware to require authentication
 * Alias for authenticate function for better readability
 */
const requireAuth = authenticate;

/**
 * Middleware to require admin role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireAdmin = (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required'
        }
      });
    }

    // Check if user has admin role
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ADMIN_ACCESS_REQUIRED',
          message: 'Admin access required'
        }
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'AUTHORIZATION_ERROR',
        message: 'Authorization check failed'
      }
    });
  }
};

/**
 * Middleware to require super admin role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireSuperAdmin = (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required'
        }
      });
    }

    // Check if user has super admin role
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'SUPER_ADMIN_ACCESS_REQUIRED',
          message: 'Super admin access required'
        }
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'AUTHORIZATION_ERROR',
        message: 'Authorization check failed'
      }
    });
  }
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
  requireAuth,
  requireAdmin,
  requireSuperAdmin
};