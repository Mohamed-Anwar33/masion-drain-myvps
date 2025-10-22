/**
 * Tests for Error Handling Middleware
 * Tests comprehensive error handling with proper status codes and structured responses
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

describe('Error Handler Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('globalErrorHandler', () => {
    beforeEach(() => {
      app.use(globalErrorHandler);
    });

    it('should handle AppError with proper status code and structure', (done) => {
      app.get('/test-app-error', (req, res, next) => {
        next(new AppError('Test error message', 400, 'TEST_ERROR'));
      });

      request(app)
        .get('/test-app-error')
        .expect(400)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error.code).toBe('TEST_ERROR');
          expect(res.body.error.message).toBe('Test error message');
          expect(res.body.timestamp).toBeDefined();
          expect(res.body.path).toBe('/test-app-error');
          expect(res.body.method).toBe('GET');
        })
        .end(done);
    });

    it('should handle ValidationError with details', (done) => {
      const details = [
        { field: 'email', message: 'Email is required' },
        { field: 'password', message: 'Password is too short' }
      ];
      
      app.get('/test-validation-error', (req, res, next) => {
        next(new ValidationError('Validation failed', details));
      });

      request(app)
        .get('/test-validation-error')
        .expect(400)
        .expect((res) => {
          expect(res.body.error.code).toBe('VALIDATION_ERROR');
          expect(res.body.error.details).toEqual(details);
        })
        .end(done);
    });

    it('should handle AuthenticationError', (done) => {
      app.get('/test-auth-error', (req, res, next) => {
        next(new AuthenticationError('Invalid credentials'));
      });

      request(app)
        .get('/test-auth-error')
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

      app.get('/test-cast-error', (req, res, next) => {
        next(castError);
      });

      request(app)
        .get('/test-cast-error')
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

      app.get('/test-duplicate-error', (req, res, next) => {
        next(duplicateError);
      });

      request(app)
        .get('/test-duplicate-error')
        .expect(409)
        .expect((res) => {
          expect(res.body.error.code).toBe('DUPLICATE_FIELD');
          expect(res.body.error.message).toContain('email \'test@example.com\' already exists');
        })
        .end(done);
    });

    it('should handle MongoDB ValidationError', (done) => {
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      validationError.errors = {
        email: {
          path: 'email',
          message: 'Email is required',
          value: undefined
        },
        password: {
          path: 'password',
          message: 'Password is required',
          value: undefined
        }
      };

      app.get('/test-mongo-validation', (req, res, next) => {
        next(validationError);
      });

      request(app)
        .get('/test-mongo-validation')
        .expect(400)
        .expect((res) => {
          expect(res.body.error.code).toBe('VALIDATION_ERROR');
          expect(res.body.error.details).toHaveLength(2);
          expect(res.body.error.details[0].field).toBe('email');
          expect(res.body.error.details[1].field).toBe('password');
        })
        .end(done);
    });

    it('should handle JWT errors', (done) => {
      const jwtError = new Error('Invalid token');
      jwtError.name = 'JsonWebTokenError';

      app.get('/test-jwt-error', (req, res, next) => {
        next(jwtError);
      });

      request(app)
        .get('/test-jwt-error')
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

      app.get('/test-jwt-expired', (req, res, next) => {
        next(expiredError);
      });

      request(app)
        .get('/test-jwt-expired')
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

      app.get('/test-multer-error', (req, res, next) => {
        next(multerError);
      });

      request(app)
        .get('/test-multer-error')
        .expect(400)
        .expect((res) => {
          expect(res.body.error.code).toBe('FILE_UPLOAD_ERROR');
          expect(res.body.error.message).toBe('File too large');
          expect(res.body.error.details[0].field).toBe('file');
        })
        .end(done);
    });

    it('should handle generic errors with 500 status', (done) => {
      app.get('/test-generic-error', (req, res, next) => {
        next(new Error('Something went wrong'));
      });

      request(app)
        .get('/test-generic-error')
        .expect(500)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error.message).toBe('Something went wrong');
        })
        .end(done);
    });

    describe('Environment-specific behavior', () => {
      const originalEnv = process.env.NODE_ENV;

      afterEach(() => {
        process.env.NODE_ENV = originalEnv;
      });

      it('should include stack trace in development', (done) => {
        process.env.NODE_ENV = 'development';
        
        app.get('/test-dev-error', (req, res, next) => {
          next(new AppError('Development error', 400));
        });

        request(app)
          .get('/test-dev-error')
          .expect(400)
          .expect((res) => {
            expect(res.body.error.stack).toBeDefined();
            expect(res.body.ip).toBeDefined();
            expect(res.body.userAgent).toBeDefined();
          })
          .end(done);
      });

      it('should not include stack trace in production for operational errors', (done) => {
        process.env.NODE_ENV = 'production';
        
        app.get('/test-prod-error', (req, res, next) => {
          next(new AppError('Production error', 400));
        });

        request(app)
          .get('/test-prod-error')
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
        
        app.get('/test-non-operational', (req, res, next) => {
          next(nonOperationalError);
        });

        request(app)
          .get('/test-non-operational')
          .expect(500)
          .expect((res) => {
            expect(res.body.error.code).toBe('INTERNAL_ERROR');
            expect(res.body.error.message).toBe('Something went wrong');
          })
          .end(done);
      });
    });
  });

  describe('catchAsync', () => {
    beforeEach(() => {
      app.use(globalErrorHandler);
    });

    it('should catch async errors and pass to error handler', (done) => {
      const asyncRoute = catchAsync(async (req, res, next) => {
        throw new AppError('Async error', 400, 'ASYNC_ERROR');
      });

      app.get('/test-async', asyncRoute);

      request(app)
        .get('/test-async')
        .expect(400)
        .expect((res) => {
          expect(res.body.error.code).toBe('ASYNC_ERROR');
          expect(res.body.error.message).toBe('Async error');
        })
        .end(done);
    });

    it('should handle async promise rejections', (done) => {
      const asyncRoute = catchAsync(async (req, res, next) => {
        await Promise.reject(new ValidationError('Promise rejection'));
      });

      app.get('/test-promise-rejection', asyncRoute);

      request(app)
        .get('/test-promise-rejection')
        .expect(400)
        .expect((res) => {
          expect(res.body.error.code).toBe('VALIDATION_ERROR');
          expect(res.body.error.message).toBe('Promise rejection');
        })
        .end(done);
    });

    it('should pass successful responses through unchanged', (done) => {
      const asyncRoute = catchAsync(async (req, res, next) => {
        res.json({ success: true, message: 'Success' });
      });

      app.get('/test-success', asyncRoute);

      request(app)
        .get('/test-success')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toBe('Success');
        })
        .end(done);
    });
  });

  describe('Error response structure', () => {
    beforeEach(() => {
      app.use(globalErrorHandler);
    });

    it('should always include required fields in error response', (done) => {
      app.get('/test-structure', (req, res, next) => {
        next(new AppError('Test error', 400));
      });

      request(app)
        .get('/test-structure')
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
});