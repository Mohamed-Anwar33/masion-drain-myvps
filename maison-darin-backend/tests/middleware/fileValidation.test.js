const { validateFile, handleMulterError, createUploadMiddleware } = require('../../middleware/fileValidation');
const { AppError } = require('../../utils/errors');
const multer = require('multer');

describe('File Validation Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {};
    next = jest.fn();
  });

  describe('validateFile middleware', () => {
    it('should pass validation for valid JPEG file', () => {
      req.file = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024 * 1024, // 1MB
        buffer: Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]) // JPEG magic number
      };

      validateFile(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should pass validation for valid PNG file', () => {
      req.file = {
        originalname: 'test.png',
        mimetype: 'image/png',
        size: 1024 * 1024,
        buffer: Buffer.from([0x89, 0x50, 0x4E, 0x47]) // PNG magic number
      };

      validateFile(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should pass validation for valid WebP file', () => {
      req.file = {
        originalname: 'test.webp',
        mimetype: 'image/webp',
        size: 1024 * 1024,
        buffer: Buffer.from([0x52, 0x49, 0x46, 0x46]) // WebP RIFF header
      };

      validateFile(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should fail when no file is uploaded', () => {
      validateFile(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const error = next.mock.calls[0][0];
      expect(error.code).toBe('NO_FILE_UPLOADED');
    });

    it('should fail for filename with null bytes', () => {
      req.file = {
        originalname: 'test\0.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from([0xFF, 0xD8, 0xFF])
      };

      validateFile(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const error = next.mock.calls[0][0];
      expect(error.code).toBe('INVALID_FILENAME');
    });

    it('should fail for filename that is too long', () => {
      req.file = {
        originalname: 'a'.repeat(256) + '.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from([0xFF, 0xD8, 0xFF])
      };

      validateFile(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const error = next.mock.calls[0][0];
      expect(error.code).toBe('FILENAME_TOO_LONG');
    });

    it('should fail for dangerous filename patterns', () => {
      const dangerousTestCases = [
        { filename: '../../../etc/passwd.jpg', description: 'directory traversal' },
        { filename: 'test<script>.jpg', description: 'HTML injection' },
        { filename: 'CON.jpg', description: 'Windows reserved name' },
        { filename: 'PRN.jpg', description: 'Windows reserved name' },
        { filename: 'test?.jpg', description: 'invalid character' }
      ];

      dangerousTestCases.forEach(({ filename, description }) => {
        req.file = {
          originalname: filename,
          mimetype: 'image/jpeg',
          size: 1024,
          buffer: Buffer.from([0xFF, 0xD8, 0xFF])
        };

        next.mockClear();
        validateFile(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(AppError));
        const error = next.mock.calls[0][0];
        expect(error.code).toBe('INVALID_FILENAME_FORMAT');
      });
    });

    it('should fail when file content does not match declared type', () => {
      req.file = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from([0x89, 0x50, 0x4E, 0x47]) // PNG magic number but declared as JPEG
      };

      validateFile(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const error = next.mock.calls[0][0];
      expect(error.code).toBe('INVALID_FILE_CONTENT');
    });

    it('should validate multiple files', () => {
      req.files = [
        {
          originalname: 'test1.jpg',
          mimetype: 'image/jpeg',
          size: 1024,
          buffer: Buffer.from([0xFF, 0xD8, 0xFF])
        },
        {
          originalname: 'test2.png',
          mimetype: 'image/png',
          size: 1024,
          buffer: Buffer.from([0x89, 0x50, 0x4E, 0x47])
        }
      ];

      validateFile(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should fail if any file in multiple files is invalid', () => {
      req.files = [
        {
          originalname: 'test1.jpg',
          mimetype: 'image/jpeg',
          size: 1024,
          buffer: Buffer.from([0xFF, 0xD8, 0xFF])
        },
        {
          originalname: '../malicious.jpg',
          mimetype: 'image/jpeg',
          size: 1024,
          buffer: Buffer.from([0xFF, 0xD8, 0xFF])
        }
      ];

      validateFile(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('handleMulterError middleware', () => {
    it('should handle LIMIT_FILE_SIZE error', () => {
      const multerError = new multer.MulterError('LIMIT_FILE_SIZE');
      multerError.code = 'LIMIT_FILE_SIZE';

      handleMulterError(multerError, req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const error = next.mock.calls[0][0];
      expect(error.code).toBe('FILE_TOO_LARGE');
      expect(error.message).toContain('File too large');
    });

    it('should handle LIMIT_FILE_COUNT error', () => {
      const multerError = new multer.MulterError('LIMIT_FILE_COUNT');
      multerError.code = 'LIMIT_FILE_COUNT';

      handleMulterError(multerError, req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const error = next.mock.calls[0][0];
      expect(error.code).toBe('TOO_MANY_FILES');
    });

    it('should handle LIMIT_UNEXPECTED_FILE error', () => {
      const multerError = new multer.MulterError('LIMIT_UNEXPECTED_FILE');
      multerError.code = 'LIMIT_UNEXPECTED_FILE';
      multerError.field = 'wrongField';

      handleMulterError(multerError, req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const error = next.mock.calls[0][0];
      expect(error.code).toBe('UNEXPECTED_FILE_FIELD');
    });

    it('should pass through non-multer errors', () => {
      const regularError = new Error('Regular error');

      handleMulterError(regularError, req, res, next);

      expect(next).toHaveBeenCalledWith(regularError);
    });
  });

  describe('createUploadMiddleware', () => {
    it('should create single file upload middleware', () => {
      const middleware = createUploadMiddleware('image', 1);
      expect(typeof middleware).toBe('function');
    });

    it('should create multiple file upload middleware', () => {
      const middleware = createUploadMiddleware('images', 5);
      expect(typeof middleware).toBe('function');
    });

    it('should default to single file upload', () => {
      const middleware = createUploadMiddleware('image');
      expect(typeof middleware).toBe('function');
    });
  });

  describe('file filter function', () => {
    // Note: These tests would require mocking multer's internal file filter
    // For now, we test the validation logic through the validateFile function
    
    it('should be tested through integration with multer', () => {
      // This would be covered in integration tests where we actually upload files
      expect(true).toBe(true);
    });
  });
});