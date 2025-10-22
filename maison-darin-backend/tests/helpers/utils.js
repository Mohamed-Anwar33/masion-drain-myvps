const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

/**
 * Test Utilities
 * Common utilities for testing
 */

class TestUtils {
  /**
   * Generate JWT token for testing
   */
  generateToken(payload = { id: 'test-user-id', email: 'test@example.com', role: 'admin' }) {
    return jwt.sign(payload, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
  }

  /**
   * Generate refresh token for testing
   */
  generateRefreshToken(payload = { id: 'test-user-id' }) {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'test-refresh-secret', { expiresIn: '7d' });
  }

  /**
   * Hash password for testing
   */
  async hashPassword(password) {
    return await bcrypt.hash(password, 12);
  }

  /**
   * Create authenticated request
   */
  authenticatedRequest(app, token = null) {
    const authToken = token || this.generateToken();
    return request(app).set('Authorization', `Bearer ${authToken}`);
  }

  /**
   * Create mock file for upload testing
   */
  createMockFile(filename = 'test.jpg', mimetype = 'image/jpeg', size = 1024) {
    return {
      fieldname: 'image',
      originalname: filename,
      encoding: '7bit',
      mimetype: mimetype,
      size: size,
      buffer: Buffer.from('fake image data'),
      filename: filename
    };
  }

  /**
   * Wait for a specified amount of time
   */
  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate random string
   */
  randomString(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate random email
   */
  randomEmail() {
    return `test-${this.randomString(8)}@example.com`;
  }

  /**
   * Generate random phone number
   */
  randomPhone() {
    return `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`;
  }

  /**
   * Validate response structure
   */
  validateApiResponse(response, expectedStatus = 200) {
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toHaveProperty('success');
    
    if (response.body.success) {
      expect(response.body).toHaveProperty('data');
    } else {
      expect(response.body).toHaveProperty('error');
    }
  }

  /**
   * Validate error response structure
   */
  validateErrorResponse(response, expectedStatus = 400) {
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('code');
    expect(response.body.error).toHaveProperty('message');
  }

  /**
   * Validate pagination response
   */
  validatePaginationResponse(response) {
    this.validateApiResponse(response);
    expect(response.body.data).toHaveProperty('pagination');
    
    const pagination = response.body.data.pagination;
    expect(pagination).toHaveProperty('currentPage');
    expect(pagination).toHaveProperty('totalPages');
    expect(pagination).toHaveProperty('totalItems');
    expect(pagination).toHaveProperty('itemsPerPage');
    expect(pagination).toHaveProperty('hasNextPage');
    expect(pagination).toHaveProperty('hasPrevPage');
  }

  /**
   * Mock Cloudinary service
   */
  mockCloudinary() {
    const mockUpload = jest.fn().mockResolvedValue({
      public_id: 'test-image-id',
      secure_url: 'https://res.cloudinary.com/test/image/upload/test-image.jpg',
      width: 800,
      height: 600,
      bytes: 1024000,
      format: 'jpg'
    });

    const mockDestroy = jest.fn().mockResolvedValue({
      result: 'ok'
    });

    return {
      uploader: {
        upload: mockUpload,
        destroy: mockDestroy
      }
    };
  }

  /**
   * Mock logger
   */
  mockLogger() {
    return {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };
  }

  /**
   * Create test environment variables
   */
  setupTestEnv() {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    process.env.JWT_EXPIRE = '15m';
    process.env.JWT_REFRESH_EXPIRE = '7d';
    process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
    process.env.CLOUDINARY_API_KEY = 'test-key';
    process.env.CLOUDINARY_API_SECRET = 'test-secret';
    process.env.MONGODB_TEST_URI = 'mongodb://localhost:27017/maison-darin-test';
  }

  /**
   * Clean up test environment
   */
  cleanupTestEnv() {
    delete process.env.JWT_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;
  }

  /**
   * Assert multilingual field structure
   */
  assertMultilingualField(field, expectedEn, expectedAr) {
    expect(field).toHaveProperty('en', expectedEn);
    expect(field).toHaveProperty('ar', expectedAr);
  }

  /**
   * Create test request with rate limiting bypass
   */
  bypassRateLimit(app) {
    // Mock rate limiter to always allow requests in tests
    return request(app).set('X-Test-Mode', 'true');
  }

  /**
   * Validate MongoDB ObjectId
   */
  isValidObjectId(id) {
    return /^[0-9a-fA-F]{24}$/.test(id);
  }

  /**
   * Create test date range
   */
  createDateRange(daysAgo = 7) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);
    
    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
  }

  /**
   * Validate timestamp fields
   */
  validateTimestamps(obj) {
    expect(obj).toHaveProperty('createdAt');
    expect(obj).toHaveProperty('updatedAt');
    expect(new Date(obj.createdAt)).toBeInstanceOf(Date);
    expect(new Date(obj.updatedAt)).toBeInstanceOf(Date);
  }
}

// Export singleton instance
module.exports = new TestUtils();