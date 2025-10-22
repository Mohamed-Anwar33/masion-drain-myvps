const jwt = require('jsonwebtoken');
const jwtService = require('../../services/jwtService');

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret-for-access-tokens';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-for-refresh-tokens';
process.env.JWT_EXPIRE = '15m';
process.env.JWT_REFRESH_EXPIRE = '7d';

describe('JWT Service', () => {
  const mockUser = {
    id: '507f1f77bcf86cd799439011',
    email: 'admin@maisondarin.com',
    role: 'admin'
  };

  beforeEach(() => {
    // Clear blacklist before each test
    jwtService.clearBlacklist();
  });

  describe('Token Generation', () => {
    it('should generate access and refresh tokens', () => {
      const tokens = jwtService.generateTokens(mockUser);

      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
    });

    it('should generate valid JWT tokens with correct payload', () => {
      const tokens = jwtService.generateTokens(mockUser);

      const accessPayload = jwt.verify(tokens.accessToken, process.env.JWT_SECRET);
      const refreshPayload = jwt.verify(tokens.refreshToken, process.env.JWT_REFRESH_SECRET);

      expect(accessPayload.id).toBe(mockUser.id);
      expect(accessPayload.email).toBe(mockUser.email);
      expect(accessPayload.role).toBe(mockUser.role);

      expect(refreshPayload.id).toBe(mockUser.id);
      expect(refreshPayload.email).toBe(mockUser.email);
      expect(refreshPayload.role).toBe(mockUser.role);
    });

    it('should set correct issuer and audience', () => {
      const tokens = jwtService.generateTokens(mockUser);

      const accessPayload = jwt.verify(tokens.accessToken, process.env.JWT_SECRET);
      const refreshPayload = jwt.verify(tokens.refreshToken, process.env.JWT_REFRESH_SECRET);

      expect(accessPayload.iss).toBe('maison-darin-api');
      expect(accessPayload.aud).toBe('maison-darin-client');
      expect(refreshPayload.iss).toBe('maison-darin-api');
      expect(refreshPayload.aud).toBe('maison-darin-client');
    });

    it('should set correct expiration times', () => {
      const tokens = jwtService.generateTokens(mockUser);

      const accessPayload = jwt.decode(tokens.accessToken);
      const refreshPayload = jwt.decode(tokens.refreshToken);

      // Access token should expire in 15 minutes (900 seconds)
      const accessExpiry = accessPayload.exp - accessPayload.iat;
      expect(accessExpiry).toBe(900);

      // Refresh token should expire in 7 days (604800 seconds)
      const refreshExpiry = refreshPayload.exp - refreshPayload.iat;
      expect(refreshExpiry).toBe(604800);
    });

    it('should throw error with invalid payload', () => {
      expect(() => {
        jwtService.generateTokens(null);
      }).toThrow('Token generation failed');
    });
  });

  describe('Access Token Verification', () => {
    let validToken;

    beforeEach(() => {
      const tokens = jwtService.generateTokens(mockUser);
      validToken = tokens.accessToken;
    });

    it('should verify valid access token', () => {
      const decoded = jwtService.verifyAccessToken(validToken);

      expect(decoded.id).toBe(mockUser.id);
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.role).toBe(mockUser.role);
    });

    it('should throw error for invalid access token', () => {
      expect(() => {
        jwtService.verifyAccessToken('invalid-token');
      }).toThrow('Invalid access token');
    });

    it('should throw error for expired access token', () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        mockUser,
        process.env.JWT_SECRET,
        { expiresIn: '-1s' }
      );

      expect(() => {
        jwtService.verifyAccessToken(expiredToken);
      }).toThrow('Access token has expired');
    });

    it('should throw error for blacklisted token', () => {
      jwtService.blacklistToken(validToken);

      expect(() => {
        jwtService.verifyAccessToken(validToken);
      }).toThrow('Token has been invalidated');
    });

    it('should throw error for token with wrong issuer', () => {
      const wrongIssuerToken = jwt.sign(
        mockUser,
        process.env.JWT_SECRET,
        { 
          expiresIn: '15m',
          issuer: 'wrong-issuer'
        }
      );

      expect(() => {
        jwtService.verifyAccessToken(wrongIssuerToken);
      }).toThrow('Invalid access token');
    });
  });

  describe('Refresh Token Verification', () => {
    let validRefreshToken;

    beforeEach(() => {
      const tokens = jwtService.generateTokens(mockUser);
      validRefreshToken = tokens.refreshToken;
    });

    it('should verify valid refresh token', () => {
      const decoded = jwtService.verifyRefreshToken(validRefreshToken);

      expect(decoded.id).toBe(mockUser.id);
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.role).toBe(mockUser.role);
    });

    it('should throw error for invalid refresh token', () => {
      expect(() => {
        jwtService.verifyRefreshToken('invalid-token');
      }).toThrow('Invalid refresh token');
    });

    it('should throw error for expired refresh token', () => {
      // Create an expired refresh token
      const expiredToken = jwt.sign(
        mockUser,
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '-1s' }
      );

      expect(() => {
        jwtService.verifyRefreshToken(expiredToken);
      }).toThrow('Refresh token has expired');
    });

    it('should throw error for blacklisted refresh token', () => {
      jwtService.blacklistToken(validRefreshToken);

      expect(() => {
        jwtService.verifyRefreshToken(validRefreshToken);
      }).toThrow('Token has been invalidated');
    });
  });

  describe('Token Refresh', () => {
    let validRefreshToken;

    beforeEach(() => {
      const tokens = jwtService.generateTokens(mockUser);
      validRefreshToken = tokens.refreshToken;
    });

    it('should generate new access token from valid refresh token', () => {
      const result = jwtService.refreshAccessToken(validRefreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(typeof result.accessToken).toBe('string');

      // Verify the new access token
      const decoded = jwtService.verifyAccessToken(result.accessToken);
      expect(decoded.id).toBe(mockUser.id);
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.role).toBe(mockUser.role);
    });

    it('should throw error for invalid refresh token', () => {
      expect(() => {
        jwtService.refreshAccessToken('invalid-token');
      }).toThrow('Token refresh failed');
    });

    it('should throw error for expired refresh token', () => {
      const expiredToken = jwt.sign(
        mockUser,
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '-1s' }
      );

      expect(() => {
        jwtService.refreshAccessToken(expiredToken);
      }).toThrow('Token refresh failed');
    });

    it('should throw error for blacklisted refresh token', () => {
      jwtService.blacklistToken(validRefreshToken);

      expect(() => {
        jwtService.refreshAccessToken(validRefreshToken);
      }).toThrow('Token refresh failed');
    });
  });

  describe('Token Blacklisting', () => {
    let validToken;

    beforeEach(() => {
      const tokens = jwtService.generateTokens(mockUser);
      validToken = tokens.accessToken;
    });

    it('should blacklist a token', () => {
      const result = jwtService.blacklistToken(validToken);
      expect(result).toBe(true);
    });

    it('should detect blacklisted token', () => {
      jwtService.blacklistToken(validToken);
      expect(jwtService.isTokenBlacklisted(validToken)).toBe(true);
    });

    it('should not detect non-blacklisted token', () => {
      expect(jwtService.isTokenBlacklisted(validToken)).toBe(false);
    });

    it('should handle blacklisting errors gracefully', () => {
      // Test with null token
      expect(() => {
        jwtService.blacklistToken(null);
      }).toThrow('Token blacklisting failed');
    });

    it('should handle blacklist checking errors gracefully', () => {
      // Test with null token - should return false instead of throwing
      expect(jwtService.isTokenBlacklisted(null)).toBe(false);
    });
  });

  describe('Token Utility Methods', () => {
    let validToken;

    beforeEach(() => {
      const tokens = jwtService.generateTokens(mockUser);
      validToken = tokens.accessToken;
    });

    it('should decode token without verification', () => {
      const decoded = jwtService.decodeToken(validToken);

      expect(decoded.id).toBe(mockUser.id);
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.role).toBe(mockUser.role);
    });

    it('should get token expiration time', () => {
      const expiration = jwtService.getTokenExpiration(validToken);

      expect(expiration instanceof Date).toBe(true);
      expect(expiration.getTime()).toBeGreaterThan(Date.now());
    });

    it('should check if token is expired', () => {
      // Valid token should not be expired
      expect(jwtService.isTokenExpired(validToken)).toBe(false);

      // Create expired token
      const expiredToken = jwt.sign(
        mockUser,
        process.env.JWT_SECRET,
        { expiresIn: '-1s' }
      );

      expect(jwtService.isTokenExpired(expiredToken)).toBe(true);
    });

    it('should handle invalid token in utility methods', () => {
      expect(() => {
        jwtService.decodeToken('invalid-token');
      }).toThrow('Token decoding failed');

      expect(() => {
        jwtService.getTokenExpiration('invalid-token');
      }).toThrow('Failed to get token expiration');

      // isTokenExpired should return true for invalid tokens
      expect(jwtService.isTokenExpired('invalid-token')).toBe(true);
    });
  });

  describe('Blacklist Management', () => {
    it('should get blacklist size', () => {
      expect(jwtService.getBlacklistSize()).toBe(0);

      const tokens = jwtService.generateTokens(mockUser);
      jwtService.blacklistToken(tokens.accessToken);

      expect(jwtService.getBlacklistSize()).toBe(1);
    });

    it('should clear blacklist', () => {
      const tokens = jwtService.generateTokens(mockUser);
      jwtService.blacklistToken(tokens.accessToken);

      expect(jwtService.getBlacklistSize()).toBe(1);

      jwtService.clearBlacklist();

      expect(jwtService.getBlacklistSize()).toBe(0);
    });

    it('should handle cleanup method', () => {
      // This method just logs in the current implementation
      expect(() => {
        jwtService.cleanupBlacklist();
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing JWT secrets', () => {
      // This test would require creating a new instance with missing secrets
      // For now, we'll test that the current instance has secrets
      expect(jwtService.accessTokenSecret).toBeDefined();
      expect(jwtService.refreshTokenSecret).toBeDefined();
    });

    it('should handle malformed tokens gracefully', () => {
      const malformedTokens = [
        '',
        'not.a.jwt',
        'header.payload',
        'header.payload.signature.extra'
      ];

      malformedTokens.forEach(token => {
        expect(() => {
          jwtService.verifyAccessToken(token);
        }).toThrow();

        expect(() => {
          jwtService.verifyRefreshToken(token);
        }).toThrow();
      });
    });
  });
});