const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class JWTService {
  constructor() {
    // In-memory blacklist for tokens (in production, use Redis)
    this.tokenBlacklist = new Set();
  }

  // Initialize secrets when first needed
  _initializeSecrets() {
    if (!this.accessTokenSecret || !this.refreshTokenSecret) {
      this.accessTokenSecret = process.env.JWT_SECRET;
      this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET;
      this.accessTokenExpiry = process.env.JWT_EXPIRE || '15m';
      this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRE || '7d';
      
      if (!this.accessTokenSecret || !this.refreshTokenSecret) {
        throw new Error('JWT secrets must be defined in environment variables');
      }
    }
  }

  /**
   * Generate access and refresh tokens for a user
   * @param {Object} payload - User payload (id, email, role)
   * @returns {Object} - Object containing accessToken and refreshToken
   */
  generateTokens(payload) {
    this._initializeSecrets();
    try {
      const accessToken = jwt.sign(
        payload,
        this.accessTokenSecret,
        { 
          expiresIn: this.accessTokenExpiry,
          issuer: 'maison-darin-api',
          audience: 'maison-darin-client'
        }
      );

      const refreshToken = jwt.sign(
        payload,
        this.refreshTokenSecret,
        { 
          expiresIn: this.refreshTokenExpiry,
          issuer: 'maison-darin-api',
          audience: 'maison-darin-client'
        }
      );

      return { accessToken, refreshToken };
    } catch (error) {
      throw new Error(`Token generation failed: ${error.message}`);
    }
  }

  /**
   * Verify access token
   * @param {string} token - JWT access token
   * @returns {Object} - Decoded token payload
   */
  verifyAccessToken(token) {
    this._initializeSecrets();
    try {
      // Check if token is blacklisted
      if (this.isTokenBlacklisted(token)) {
        throw new Error('Token has been invalidated');
      }

      const decoded = jwt.verify(token, this.accessTokenSecret, {
        issuer: 'maison-darin-api',
        audience: 'maison-darin-client'
      });

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Access token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid access token');
      } else {
        throw new Error(`Access token verification failed: ${error.message}`);
      }
    }
  }

  /**
   * Verify refresh token
   * @param {string} token - JWT refresh token
   * @returns {Object} - Decoded token payload
   */
  verifyRefreshToken(token) {
    this._initializeSecrets();
    try {
      // Check if token is blacklisted
      if (this.isTokenBlacklisted(token)) {
        throw new Error('Token has been invalidated');
      }

      const decoded = jwt.verify(token, this.refreshTokenSecret, {
        issuer: 'maison-darin-api',
        audience: 'maison-darin-client'
      });

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Refresh token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid refresh token');
      } else {
        throw new Error(`Refresh token verification failed: ${error.message}`);
      }
    }
  }

  /**
   * Generate new access token using refresh token
   * @param {string} refreshToken - Valid refresh token
   * @returns {Object} - Object containing new accessToken
   */
  refreshAccessToken(refreshToken) {
    this._initializeSecrets();
    try {
      const decoded = this.verifyRefreshToken(refreshToken);
      
      // Create new payload without JWT specific fields
      const payload = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      };

      const accessToken = jwt.sign(
        payload,
        this.accessTokenSecret,
        { 
          expiresIn: this.accessTokenExpiry,
          issuer: 'maison-darin-api',
          audience: 'maison-darin-client'
        }
      );

      return { accessToken };
    } catch (error) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  /**
   * Blacklist a token (for logout functionality)
   * @param {string} token - Token to blacklist
   */
  blacklistToken(token) {
    try {
      // Generate a hash of the token for storage efficiency
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      this.tokenBlacklist.add(tokenHash);
      
      // In production, you would store this in Redis with TTL
      // redis.setex(tokenHash, tokenTTL, 'blacklisted');
      
      return true;
    } catch (error) {
      throw new Error(`Token blacklisting failed: ${error.message}`);
    }
  }

  /**
   * Check if a token is blacklisted
   * @param {string} token - Token to check
   * @returns {boolean} - True if token is blacklisted
   */
  isTokenBlacklisted(token) {
    try {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      return this.tokenBlacklist.has(tokenHash);
    } catch (error) {
      // If we can't check blacklist, assume token is valid
      // In production, this should be handled more carefully
      return false;
    }
  }

  /**
   * Decode token without verification (for getting token info)
   * @param {string} token - JWT token
   * @returns {Object} - Decoded token payload
   */
  decodeToken(token) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded) {
        throw new Error('Invalid token format');
      }
      return decoded;
    } catch (error) {
      throw new Error(`Token decoding failed: ${error.message}`);
    }
  }

  /**
   * Get token expiration time
   * @param {string} token - JWT token
   * @returns {Date} - Expiration date
   */
  getTokenExpiration(token) {
    try {
      const decoded = this.decodeToken(token);
      return new Date(decoded.exp * 1000);
    } catch (error) {
      throw new Error(`Failed to get token expiration: ${error.message}`);
    }
  }

  /**
   * Check if token is expired
   * @param {string} token - JWT token
   * @returns {boolean} - True if token is expired
   */
  isTokenExpired(token) {
    try {
      const expiration = this.getTokenExpiration(token);
      return expiration < new Date();
    } catch (error) {
      // If we can't decode the token, consider it expired
      return true;
    }
  }

  /**
   * Clean up expired tokens from blacklist
   * This should be called periodically to prevent memory leaks
   */
  cleanupBlacklist() {
    // In production with Redis, you would rely on TTL
    // For in-memory implementation, we can't easily clean up without storing expiration times
    // This is a limitation of the in-memory approach
    console.log('Blacklist cleanup - in production, use Redis with TTL');
  }

  /**
   * Get blacklist size (for monitoring)
   * @returns {number} - Number of blacklisted tokens
   */
  getBlacklistSize() {
    return this.tokenBlacklist.size;
  }

  /**
   * Clear all blacklisted tokens (for testing purposes)
   */
  clearBlacklist() {
    this.tokenBlacklist.clear();
  }
}

// Export singleton instance
module.exports = new JWTService();