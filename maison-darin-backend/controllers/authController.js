const User = require('../models/User');
const jwtService = require('../services/jwtService');

/**
 * Register new user
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, address, city, role = 'customer' } = req.body;

    console.log('📝 Registration attempt:', { firstName, lastName, email, phone, address, city, role });

    // Validate required fields for customers
    if (role === 'customer') {
      const missingFields = [];
      if (!firstName) missingFields.push('firstName');
      if (!lastName) missingFields.push('lastName');
      if (!email) missingFields.push('email');
      if (!password) missingFields.push('password');
      if (!phone) missingFields.push('phone');
      if (!address) missingFields.push('address');
      if (!city) missingFields.push('city');

      if (missingFields.length > 0) {
        console.log('❌ Missing fields:', missingFields);
        return res.status(400).json({
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}`,
          missingFields
        });
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('❌ User already exists:', email);
      return res.status(400).json({
        success: false,
        error: {
          code: 'USER_ALREADY_EXISTS',
          message: 'User with this email already exists'
        }
      });
    }

    // Validate password length
    if (password.length < 6) {
      console.log('❌ Password too short');
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      phone,
      address,
      city,
      role,
      isActive: true
    });

    await newUser.save();

    // Generate tokens
    const tokens = jwtService.generateTokens({
      id: newUser._id,
      email: newUser.email,
      role: newUser.role
    });

    // Update user with refresh token
    await User.findByIdAndUpdate(newUser._id, {
      refreshToken: tokens.refreshToken,
      lastLogin: new Date()
    });

    // Return user data without password
    const userData = {
      id: newUser._id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      phone: newUser.phone,
      address: newUser.address,
      city: newUser.city,
      role: newUser.role,
      isActive: newUser.isActive,
      createdAt: newUser.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: userData,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REGISTRATION_FAILED',
        message: 'Registration failed due to server error'
      }
    });
  }
};

/**
 * Login user and return JWT tokens
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    // Validation is now handled by middleware
    const { email, password } = req.body;

    // Find user by email with password
    const user = await User.findByEmailWithPassword(email.toLowerCase());

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: 'Account is inactive'
        }
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Generate tokens
    const tokens = jwtService.generateTokens({
      id: user._id,
      email: user.email,
      role: user.role
    });

    // Update last login
    await User.findByIdAndUpdate(user._id, {
      refreshToken: tokens.refreshToken,
      lastLogin: new Date()
    });

    // Return user data without password
    const userData = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      city: user.city,
      role: user.role,
      isActive: user.isActive,
      lastLogin: new Date()
    };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: userData,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });

  } catch (error) {
    console.error('Login error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGIN_FAILED',
        message: 'Login failed due to server error'
      }
    });
  }
};

/**
 * Logout user by blacklisting the current token
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  try {
    const token = req.token;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'No token provided for logout'
        }
      });
    }

    // Blacklist the current access token
    jwtService.blacklistToken(token);

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGOUT_FAILED',
        message: 'Logout failed due to server error'
      }
    });
  }
};

/**
 * Refresh access token using refresh token
 * POST /api/auth/refresh
 */
const refreshToken = async (req, res) => {
  try {
    // Validation is now handled by middleware
    const { refreshToken: token } = req.body;

    // Generate new access token
    const result = jwtService.refreshAccessToken(token);

    res.status(200).json({
      success: true,
      data: {
        accessToken: result.accessToken,
        expiresIn: process.env.JWT_EXPIRE || '15m'
      },
      message: 'Token refreshed successfully'
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    
    let errorCode = 'TOKEN_REFRESH_FAILED';
    let errorMessage = 'Token refresh failed';
    let statusCode = 500;

    if (error.message.includes('expired')) {
      errorCode = 'REFRESH_TOKEN_EXPIRED';
      errorMessage = 'Refresh token has expired';
      statusCode = 401;
    } else if (error.message.includes('invalid') || error.message.includes('Invalid')) {
      errorCode = 'INVALID_REFRESH_TOKEN';
      errorMessage = 'Invalid refresh token';
      statusCode = 401;
    } else if (error.message.includes('invalidated')) {
      errorCode = 'REFRESH_TOKEN_INVALIDATED';
      errorMessage = 'Refresh token has been invalidated';
      statusCode = 401;
    }

    res.status(statusCode).json({
      success: false,
      error: {
        code: errorCode,
        message: errorMessage
      }
    });
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user from database
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          lastLogin: user.lastLogin,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'PROFILE_FETCH_FAILED',
        message: 'Failed to fetch user profile'
      }
    });
  }
};

/**
 * Verify token endpoint (for frontend to check if token is valid)
 * GET /api/auth/verify
 */
const verifyToken = async (req, res) => {
  try {
    // If we reach here, the authenticate middleware has already verified the token
    res.status(200).json({
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

  } catch (error) {
    console.error('Token verification error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'TOKEN_VERIFICATION_FAILED',
        message: 'Token verification failed'
      }
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  getProfile,
  verifyToken
};