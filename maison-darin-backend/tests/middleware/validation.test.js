const { validate, sanitizeInput, preventMongoInjection } = require('../../middleware/validation');
const { authSchemas, productSchemas } = require('../../validation/schemas');
const { AppError } = require('../../utils/errors');

describe('Validation Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      query: {},
      params: {},
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('test-user-agent')
    };
    res = {};
    next = jest.fn();
  });

  describe('validate middleware', () => {
    it('should pass validation with valid data', () => {
      req.body = {
        email: 'test@example.com',
        password: 'password123'
      };

      const middleware = validate(authSchemas.login);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.body.email).toBe('test@example.com');
    });

    it('should fail validation with invalid data', () => {
      req.body = {
        email: 'invalid-email',
        password: '123' // too short
      };

      const middleware = validate(authSchemas.login);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toHaveLength(2);
    });

    it('should strip unknown properties', () => {
      req.body = {
        email: 'test@example.com',
        password: 'password123',
        unknownField: 'should be removed'
      };

      const middleware = validate(authSchemas.login);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.body.unknownField).toBeUndefined();
    });

    it('should convert data types', () => {
      req.query = {
        page: '2',
        limit: '10',
        featured: 'true'
      };

      const middleware = validate(productSchemas.query, 'query');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.query.page).toBe(2);
      expect(req.query.limit).toBe(10);
      expect(req.query.featured).toBe(true);
    });

    it('should validate params', () => {
      req.params = {
        id: '507f1f77bcf86cd799439011'
      };

      const middleware = validate(productSchemas.params, 'params');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should fail with invalid ObjectId', () => {
      req.params = {
        id: 'invalid-id'
      };

      const middleware = validate(productSchemas.params, 'params');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('sanitizeInput middleware', () => {
    it('should sanitize XSS attempts in body', () => {
      req.body = {
        name: '<script>alert("xss")</script>Normal text',
        description: 'javascript:alert("xss")',
        onclick: 'onclick=alert("xss")'
      };

      sanitizeInput(req, res, next);

      expect(req.body.name).toBe('Normal text');
      expect(req.body.description).toBe('alert("xss")');
      expect(req.body.onclick).toBe('alert("xss")');
      expect(next).toHaveBeenCalledWith();
    });

    it('should sanitize nested objects', () => {
      req.body = {
        user: {
          name: '<script>alert("xss")</script>',
          profile: {
            bio: 'javascript:void(0)'
          }
        }
      };

      sanitizeInput(req, res, next);

      expect(req.body.user.name).toBe('');
      expect(req.body.user.profile.bio).toBe('void(0)');
      expect(next).toHaveBeenCalledWith();
    });

    it('should sanitize arrays', () => {
      req.body = {
        tags: ['<script>alert("xss")</script>', 'normal-tag', 'onclick=alert("xss")']
      };

      sanitizeInput(req, res, next);

      expect(req.body.tags[0]).toBe('');
      expect(req.body.tags[1]).toBe('normal-tag');
      expect(req.body.tags[2]).toBe('alert("xss")');
      expect(next).toHaveBeenCalledWith();
    });

    it('should sanitize query parameters', () => {
      req.query = {
        search: '<script>alert("xss")</script>',
        category: 'normal'
      };

      sanitizeInput(req, res, next);

      expect(req.query.search).toBe('');
      expect(req.query.category).toBe('normal');
      expect(next).toHaveBeenCalledWith();
    });

    it('should handle null and undefined values', () => {
      req.body = {
        name: null,
        description: undefined,
        value: 0,
        active: false
      };

      sanitizeInput(req, res, next);

      expect(req.body.name).toBeNull();
      expect(req.body.description).toBeUndefined();
      expect(req.body.value).toBe(0);
      expect(req.body.active).toBe(false);
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('preventMongoInjection middleware', () => {
    it('should allow normal data', () => {
      req.body = {
        email: 'test@example.com',
        name: 'John Doe',
        age: 25
      };

      preventMongoInjection(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should block MongoDB operators in body', () => {
      req.body = {
        email: { $ne: null },
        password: 'test'
      };

      preventMongoInjection(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('INVALID_REQUEST');
    });

    it('should block MongoDB operators in query', () => {
      req.query = {
        price: { $gt: 0 }
      };

      preventMongoInjection(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should block MongoDB operators in params', () => {
      req.params = {
        id: '$where'
      };

      preventMongoInjection(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should block nested MongoDB operators', () => {
      req.body = {
        user: {
          profile: {
            settings: { $set: { admin: true } }
          }
        }
      };

      preventMongoInjection(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should block MongoDB operators in arrays', () => {
      req.body = {
        tags: ['normal', { $regex: '.*' }]
      };

      preventMongoInjection(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should allow strings that contain $ but are not operators', () => {
      req.body = {
        description: 'Price is $100',
        currency: 'USD$'
      };

      preventMongoInjection(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should handle null and undefined values', () => {
      req.body = {
        name: null,
        description: undefined
      };

      preventMongoInjection(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('combined middleware usage', () => {
    it('should work together in sequence', () => {
      req.body = {
        email: 'test@example.com',
        password: 'password123',
        extraField: 'should be removed'
      };

      // Simulate middleware chain
      sanitizeInput(req, res, () => {
        preventMongoInjection(req, res, () => {
          const validateMiddleware = validate(authSchemas.login);
          validateMiddleware(req, res, next);
        });
      });

      expect(req.body.extraField).toBeUndefined();
      expect(next).toHaveBeenCalledWith();
    });

    it('should stop on injection attempt even after sanitization', () => {
      req.body = {
        email: 'test@example.com',
        filter: { $ne: null }
      };

      sanitizeInput(req, res, () => {
        preventMongoInjection(req, res, next);
      });

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });
  });
});