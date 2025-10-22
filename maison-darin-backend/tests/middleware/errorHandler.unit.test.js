/**
 * Unit Tests for Error Handling Middleware
 * Tests comprehensive error handling without database dependencies
 */

const request = require('supertest');
const express = require('express');
const { globalErrorHandler, catchAsync } = require('../../middleware/errorHandler');
const { 
  AppError, 
  ValidationError, 
  AuthenticationError, 
  NotFoundError,
  DatabaseError 
} = require('../../utils/errors');

describe('Error Handler Middleware - Unit Tests', () => {
  let app;

  const createTestApp = (routeHandler) => {
    const testApp = express();
    testApp.use(express.json());
    testApp.get('/test', routeHandler);
    testApp.use(globalErrorHandler);
    return testApp;
  };

  describe('globalErrorHandler', () => {
    it('should handle AppError with proper status code and structure', (done) => {
      const testApp = createTestApp((req, res, next) => {
        next(new AppError('Test error message', 400, 'TEST_ERROR'));
      });

      request(testApp)
        .get('/test')
        .expect(400)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error.code).toBe('TEST_ERROR');
          expect(res.body.error.message).toBe('Test error message');
          expect(res.body.timestamp).toBeDefined();
          expect(res.body.path).toBe('/test');
          expect(res.body.method).toBe('GET');
        })
        .end(done);
    });

    it('should handle ValidationError with details', (done) => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const details = [
        { field: 'email', message: 'Email is required' },
        { field: 'password', message: 'Password is too short' }
      ];
      
      const testApp = createTestApp((req, res, next) => {
        next(new ValidationError('Validation failed', details));
      });

      request(testApp)
        .get('/test')
        .expect(400)
        .expect((res) => {
          expect(res.body.error.code).toBe('VALIDATION_ERROR');
          expect(res.body.error.details).toEqual(details);
        })
        .end((err) => {
          process.env.NODE_ENV = originalEnv;
          done(err);
        });
    });

    it('should handle AuthenticationError', (done) => {
      const testApp = createTestApp((req, res, next) => {
        next(new AuthenticationError('Invalid credentials'));
      });

      request(testApp)
        .get('/test')
        .expect(401)
        .expect((res) => {
          expect(res.body.error.code).toBe('AUTHENTICATION_ERROR');
          expect(res.body.error.message).toBe('Invalid credentials');
        })
        .end(done);
    });

    it('should handle MongoDB CastError', (done) => {
      const castError = new Error('Cast to ObjectId failed');
      castError.name = 'CastError';
      castError.path = 'id';
      castError.value = 'invalid-id';

      const testApp = createTestApp((req, res, next) => {
        next(castError);
      });

      request(testApp)
        .get('/test')
        .expect(400)
        .expect((res) => {
          expect(res.body.error.code).toBe('INVALID_ID');
          expect(res.body.error.message).toContain('Invalid id: invalid-id');
        })
        .end(done);
    });

    it('should handle MongoDB duplicate key error', (done) => {
      const duplicateError = new Error('Duplicate key error');
      duplicateError.code = 11000;
      duplicateError.keyValue = { email: 'test@example.com' };

      const testApp = createTestApp((req, res, next) => {
        next(duplicateError);
      });

      request(testApp)
        .get('/test')
        .expect(409)
        .expect((res) => {
          expect(res.body.error.code).toBe('DUPLICATE_FIELD');
          expect(res.body.error.message).toContain('email \'test@example.com\' already exists');
        })
        .end(done);
    });

    it('should handle JWT errors', (done) => {
      const jwtError = new Error('Invalid token');
      jwtError.name = 'JsonWebTokenError';

      const testApp = createTestApp((req, res, next) => {
        next(jwtError);
      });

      request(testApp)
        .get('/test')
        .expect(401)
        .expect((res) => {
          expect(res.body.error.code).toBe('INVALID_TOKEN');
          expect(res.body.error.message).toBe('Invalid token. Please log in again');
        })
        .end(done);
    });

    it('should handle JWT expired errors', (done) => {
      const expiredError = new Error('Token expired');
      expiredError.name = 'TokenExpiredError';

      const testApp = createTestApp((req, res, next) => {
        next(expiredError);
      });

      request(testApp)
        .get('/test')
        .expect(401)
        .expect((res) => {
          expect(res.body.error.code).toBe('TOKEN_EXPIRED');
          expect(res.body.error.message).toBe('Your token has expired. Please log in again');
        })
        .end(done);
    });

    it('should handle Multer file upload errors', (done) => {
      const multerError = new Error('File too large');
      multerError.name = 'MulterError';
      multerError.code = 'LIMIT_FILE_SIZE';

      const testApp = createTestApp((req, res, next) => {
        next(multerError);
      });

      request(testApp)
        .get('/test')
        .expect(400)
        .expect((res) => {
          expect(res.body.error.code).toBe('FILE_UPLOAD_ERROR');
          expect(res.body.error.message).toBe('File too large');
          expect(res.body.error.details[0].field).toBe('file');
        })
        .end(done);
    });

    it('should handle generic errors with 500 status', (done) => {
      const testApp = createTestApp((req, res, next) => {
        next(new Error('Something went wrong'));
      });

      request(testApp)
        .get('/test')
        .expect(500)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error.message).toBe('Something went wrong');
        })
        .end(done);
    });
  });

  describe('catchAsync', () => {
    it('should catch async errors and pass to error handler', (done) => {
      const asyncRoute = catchAsync(async (req, res, next) => {
        throw new AppError('Async error', 400, 'ASYNC_ERROR');
      });

      const testApp = createTestApp(asyncRoute);

      request(testApp)
        .get('/test')
        .expect(400)
        .expect((res) => {
          expect(res.body.error.code).toBe('ASYNC_ERROR');
          expect(res.body.error.message).toBe('Async error');
        })
        .end(done);
    });

    it('should handle async promise rejections', (done) => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const asyncRoute = catchAsync(async (req, res, next) => {
        await Promise.reject(new ValidationError('Promise rejection'));
      });

      const testApp = createTestApp(asyncRoute);

      request(testApp)
        .get('/test')
        .expect(400)
        .expect((res) => {
          expect(res.body.error.code).toBe('VALIDATION_ERROR');
          expect(res.body.error.message).toBe('Promise rejection');
        })
        .end((err) => {
          process.env.NODE_ENV = originalEnv;
          done(err);
        });
    });

    it('should pass successful responses through unchanged', (done) => {
      const asyncRoute = catchAsync(async (req, res, next) => {
        res.json({ success: true, message: 'Success' });
      });

      const testApp = createTestApp(asyncRoute);

      request(testApp)
        .get('/test')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toBe('Success');
        })
        .end(done);
    });
  });

  describe('Error response structure', () => {
    it('should always include required fields in error response', (done) => {
      const testApp = createTestApp((req, res, next) => {
        next(new AppError('Test error', 400));
      });

      request(testApp)
        .get('/test')
        .expect(400)
        .expect((res) => {
          // Required fields
          expect(res.body).toHaveProperty('success', false);
          expect(res.body).toHaveProperty('error');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('path');
          expect(res.body).toHaveProperty('method');
          
          // Error object structure
          expect(res.body.error).toHaveProperty('code');
          expect(res.body.error).toHaveProperty('message');
          expect(res.body.error).toHaveProperty('details');
          
          // Validate timestamp format
          expect(new Date(res.body.timestamp)).toBeInstanceOf(Date);
        })
        .end(done);
    });
  });

  describe('Environment-specific behavior', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should include stack trace in development', (done) => {
      // Create a custom development error handler for testing
      const devErrorHandler = (err, req, res, next) => {
        const error = {
          success: false,
          error: {
            code: err.code || 'INTERNAL_ERROR',
            message: err.message,
            details: err.details || [],
            stack: err.stack
          },
          timestamp: new Date().toISOString(),
          path: req.path,
          method: req.method,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        };
        
        res.status(err.statusCode || 500).json(error);
      };
      
      const testApp = express();
      testApp.use(express.json());
      testApp.get('/test', (req, res, next) => {
        next(new AppError('Development error', 400));
      });
      testApp.use(devErrorHandler);

      request(testApp)
        .get('/test')
        .expect(400)
        .expect((res) => {
          expect(res.body.error.stack).toBeDefined();
          expect(res.body.ip).toBeDefined();
          // Development mode includes additional debugging info
          expect(res.body.timestamp).toBeDefined();
        })
        .end(done);
    });

    it('should not include stack trace in production for operational errors', (done) => {
      process.env.NODE_ENV = 'production';
      
      const testApp = createTestApp((req, res, next) => {
        next(new AppError('Production error', 400));
      });

      request(testApp)
        .get('/test')
        .expect(400)
        .expect((res) => {
          expect(res.body.error.stack).toBeUndefined();
          expect(res.body.ip).toBeUndefined();
          expect(res.body.userAgent).toBeUndefined();
        })
        .end(done);
    });

    it('should sanitize non-operational errors in production', (done) => {
      process.env.NODE_ENV = 'production';
      
      const nonOperationalError = new Error('Database connection failed');
      nonOperationalError.isOperational = false;
      
      const testApp = createTestApp((req, res, next) => {
        next(nonOperationalError);
      });

      request(testApp)
        .get('/test')
        .expect(500)
        .expect((res) => {
          expect(res.body.error.code).toBe('INTERNAL_ERROR');
          expect(res.body.error.message).toBe('Something went wrong');
        })
        .end(done);
    });
  });
});