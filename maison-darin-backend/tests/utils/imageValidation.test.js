const ImageValidation = require('../../utils/imageValidation');

// Mock logger
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

describe('ImageValidation', () => {
  describe('validateFileType', () => {
    it('should accept valid JPEG file', () => {
      const file = {
        mimetype: 'image/jpeg',
        originalname: 'test.jpg',
        buffer: Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46])
      };

      const result = ImageValidation.validateFileType(file);
      expect(result.valid).toBe(true);
    });

    it('should accept valid PNG file', () => {
      const file = {
        mimetype: 'image/png',
        originalname: 'test.png',
        buffer: Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
      };

      const result = ImageValidation.validateFileType(file);
      expect(result.valid).toBe(true);
    });

    it('should accept valid WebP file', () => {
      const file = {
        mimetype: 'image/webp',
        originalname: 'test.webp',
        buffer: Buffer.from([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50])
      };

      const result = ImageValidation.validateFileType(file);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid MIME type', () => {
      const file = {
        mimetype: 'image/gif',
        originalname: 'test.gif',
        buffer: Buffer.from([0x47, 0x49, 0x46, 0x38])
      };

      const result = ImageValidation.validateFileType(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file type');
    });

    it('should reject invalid file extension', () => {
      const file = {
        mimetype: 'image/jpeg',
        originalname: 'test.gif',
        buffer: Buffer.from([0xFF, 0xD8, 0xFF, 0xE0])
      };

      const result = ImageValidation.validateFileType(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file extension');
    });

    it('should reject file with wrong signature', () => {
      const file = {
        mimetype: 'image/jpeg',
        originalname: 'test.jpg',
        buffer: Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]) // PNG signature with JPEG mimetype
      };

      const result = ImageValidation.validateFileType(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File signature does not match');
    });
  });

  describe('validateFileSignature', () => {
    it('should validate JPEG signature correctly', () => {
      const buffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46]);
      const result = ImageValidation.validateFileSignature(buffer, 'image/jpeg');
      expect(result.valid).toBe(true);
    });

    it('should validate PNG signature correctly', () => {
      const buffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      const result = ImageValidation.validateFileSignature(buffer, 'image/png');
      expect(result.valid).toBe(true);
    });

    it('should validate WebP signature correctly', () => {
      const buffer = Buffer.from([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]);
      const result = ImageValidation.validateFileSignature(buffer, 'image/webp');
      expect(result.valid).toBe(true);
    });

    it('should reject invalid WebP without WEBP signature', () => {
      const buffer = Buffer.from([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
      const result = ImageValidation.validateFileSignature(buffer, 'image/webp');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('missing WebP signature');
    });

    it('should reject buffer with insufficient data', () => {
      const buffer = Buffer.from([0xFF, 0xD8]);
      const result = ImageValidation.validateFileSignature(buffer, 'image/jpeg');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('insufficient data');
    });

    it('should reject unsupported MIME type', () => {
      const buffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46]);
      const result = ImageValidation.validateFileSignature(buffer, 'image/gif');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unsupported MIME type');
    });
  });

  describe('validateFileSize', () => {
    it('should accept valid file size', () => {
      const result = ImageValidation.validateFileSize(1024 * 1024); // 1MB
      expect(result.valid).toBe(true);
    });

    it('should reject file size exceeding limit', () => {
      const result = ImageValidation.validateFileSize(6 * 1024 * 1024); // 6MB (default limit is 5MB)
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File size too large');
    });

    it('should reject zero or negative file size', () => {
      const result = ImageValidation.validateFileSize(0);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('file appears to be empty');
    });

    it('should accept custom size limit', () => {
      const result = ImageValidation.validateFileSize(2 * 1024 * 1024, 1024 * 1024); // 2MB with 1MB limit
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File size too large');
    });
  });

  describe('validateImageDimensions', () => {
    it('should accept valid dimensions', () => {
      const result = ImageValidation.validateImageDimensions(800, 600);
      expect(result.valid).toBe(true);
    });

    it('should reject dimensions below minimum', () => {
      const result = ImageValidation.validateImageDimensions(0, 0);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('dimensions too small');
    });

    it('should reject dimensions above maximum', () => {
      const result = ImageValidation.validateImageDimensions(15000, 15000);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('dimensions too large');
    });

    it('should reject images with too many pixels', () => {
      const result = ImageValidation.validateImageDimensions(10000, 10000); // 100MP
      expect(result.valid).toBe(false);
      expect(result.error).toContain('resolution too high');
    });

    it('should accept custom dimension limits', () => {
      const options = {
        minWidth: 100,
        minHeight: 100,
        maxWidth: 500,
        maxHeight: 500
      };
      
      const result = ImageValidation.validateImageDimensions(800, 600, options);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('dimensions too large');
    });
  });

  describe('validateFilename', () => {
    it('should accept valid filename', () => {
      const result = ImageValidation.validateFilename('test-image.jpg');
      expect(result.valid).toBe(true);
    });

    it('should reject filename with dangerous characters', () => {
      const result = ImageValidation.validateFilename('test<script>.jpg');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('dangerous characters');
    });

    it('should reject reserved system names', () => {
      const result = ImageValidation.validateFilename('CON.jpg');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('reserved system name');
    });

    it('should reject filename that is too long', () => {
      const longName = 'a'.repeat(256) + '.jpg';
      const result = ImageValidation.validateFilename(longName);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('filename too long');
    });

    it('should reject hidden files', () => {
      const result = ImageValidation.validateFilename('.hidden.jpg');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('hidden files');
    });

    it('should reject relative paths', () => {
      const result = ImageValidation.validateFilename('test/../file.jpg');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('relative paths');
    });

    it('should reject empty or invalid filename', () => {
      const result = ImageValidation.validateFilename('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('filename is required');
    });
  });

  describe('scanForMaliciousContent', () => {
    it('should accept clean image buffer', () => {
      // Create a buffer with only safe bytes (no null bytes or random patterns)
      const buffer = Buffer.alloc(10000, 0x42); // Fill with 'B' character
      buffer[0] = 0xFF;
      buffer[1] = 0xD8;
      buffer[2] = 0xFF;
      buffer[3] = 0xE0;
      
      const result = ImageValidation.scanForMaliciousContent(buffer);
      expect(result.valid).toBe(true);
    });

    it('should detect script tags', () => {
      const buffer = Buffer.from('<script>alert("xss")</script>');
      const result = ImageValidation.scanForMaliciousContent(buffer);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('malicious content');
    });

    it('should detect iframe tags', () => {
      const buffer = Buffer.from('<iframe src="evil.com"></iframe>');
      const result = ImageValidation.scanForMaliciousContent(buffer);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('malicious content');
    });

    it('should detect javascript protocol', () => {
      const buffer = Buffer.from('javascript:alert(1)');
      const result = ImageValidation.scanForMaliciousContent(buffer);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('malicious content');
    });

    it('should detect null bytes', () => {
      const buffer = Buffer.from([0xFF, 0xD8, 0x00, 0xFF, 0xE0]);
      const result = ImageValidation.scanForMaliciousContent(buffer);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('malicious content');
    });

    it('should detect PE executable headers', () => {
      const buffer = Buffer.from('MZ\x90\x00');
      const result = ImageValidation.scanForMaliciousContent(buffer);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('malicious content');
    });

    it('should reject invalid buffer', () => {
      const result = ImageValidation.scanForMaliciousContent(null);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid buffer');
    });
  });

  describe('validateFile', () => {
    const createValidFile = () => {
      // Create a buffer with only safe bytes (no null bytes or random patterns)
      const buffer = Buffer.alloc(10000, 0x42); // Fill with 'B' character
      buffer[0] = 0xFF;
      buffer[1] = 0xD8;
      buffer[2] = 0xFF;
      buffer[3] = 0xE0;
      
      return {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024 * 1024, // 1MB
        buffer: buffer
      };
    };

    it('should validate a completely valid file', () => {
      const file = createValidFile();
      const result = ImageValidation.validateFile(file);
      expect(result.valid).toBe(true);
    });

    it('should reject file with invalid filename', () => {
      const file = createValidFile();
      file.originalname = 'test<script>.jpg';
      
      const result = ImageValidation.validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('dangerous characters');
    });

    it('should reject file with invalid type', () => {
      const file = createValidFile();
      file.mimetype = 'image/gif';
      
      const result = ImageValidation.validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file type');
    });

    it('should reject file that is too large', () => {
      const file = createValidFile();
      file.size = 10 * 1024 * 1024; // 10MB
      
      const result = ImageValidation.validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File size too large');
    });

    it('should reject file with malicious content', () => {
      const file = createValidFile();
      // Create buffer with JPEG signature but malicious content
      const maliciousBuffer = Buffer.alloc(1000);
      maliciousBuffer[0] = 0xFF;
      maliciousBuffer[1] = 0xD8;
      maliciousBuffer[2] = 0xFF;
      maliciousBuffer[3] = 0xE0;
      Buffer.from('<script>alert("xss")</script>').copy(maliciousBuffer, 10);
      file.buffer = maliciousBuffer;
      
      const result = ImageValidation.validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('malicious content');
    });

    it('should use custom options', () => {
      const file = createValidFile();
      file.size = 2 * 1024 * 1024; // 2MB
      
      const options = { maxSize: 1024 * 1024 }; // 1MB limit
      const result = ImageValidation.validateFile(file, options);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File size too large');
    });
  });

  describe('validateProcessedImage', () => {
    const createValidCloudinaryResult = () => ({
      success: true,
      data: {
        publicId: 'test/image',
        url: 'https://res.cloudinary.com/test/image.jpg',
        width: 800,
        height: 600,
        format: 'jpg',
        size: 150000
      }
    });

    it('should validate a valid processed image', () => {
      const cloudinaryResult = createValidCloudinaryResult();
      const result = ImageValidation.validateProcessedImage(cloudinaryResult);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid Cloudinary result', () => {
      const result = ImageValidation.validateProcessedImage(null);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid Cloudinary result');
    });

    it('should reject image with invalid dimensions', () => {
      const cloudinaryResult = createValidCloudinaryResult();
      cloudinaryResult.data.width = 15000;
      cloudinaryResult.data.height = 15000;
      
      const result = ImageValidation.validateProcessedImage(cloudinaryResult);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('dimensions too large');
    });

    it('should reject image with invalid format', () => {
      const cloudinaryResult = createValidCloudinaryResult();
      cloudinaryResult.data.format = 'gif';
      
      const result = ImageValidation.validateProcessedImage(cloudinaryResult);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid processed image format');
    });

    it('should use custom validation options', () => {
      const cloudinaryResult = createValidCloudinaryResult();
      cloudinaryResult.data.width = 1000;
      
      const options = { maxWidth: 500 };
      const result = ImageValidation.validateProcessedImage(cloudinaryResult, options);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('dimensions too large');
    });
  });

  describe('calculateMetadataRatio', () => {
    it('should calculate metadata ratio for JPEG', () => {
      // Simple JPEG with EXIF marker
      const buffer = Buffer.from([
        0xFF, 0xD8, // JPEG start
        0xFF, 0xE1, 0x00, 0x10, // EXIF marker with 16 bytes
        ...Array(12).fill(0x00), // EXIF data
        0xFF, 0xDA, // Start of scan
        ...Array(100).fill(0x00) // Image data
      ]);
      
      const ratio = ImageValidation.calculateMetadataRatio(buffer);
      expect(ratio).toBeGreaterThan(0);
      expect(ratio).toBeLessThan(1);
    });

    it('should return conservative estimate for non-JPEG', () => {
      const buffer = Buffer.from([0x89, 0x50, 0x4E, 0x47]); // PNG
      const ratio = ImageValidation.calculateMetadataRatio(buffer);
      expect(ratio).toBe(0.1);
    });
  });
});