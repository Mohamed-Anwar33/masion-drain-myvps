// Set up environment variables before requiring the service
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-key';
process.env.CLOUDINARY_API_SECRET = 'test-secret';

const cloudinary = require('cloudinary').v2;

// Mock Cloudinary
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn(),
      upload_stream: jest.fn(),
      destroy: jest.fn(),
      add_tag: jest.fn()
    },
    api: {
      ping: jest.fn(),
      resource: jest.fn(),
      delete_resources: jest.fn()
    },
    search: {
      expression: jest.fn().mockReturnThis(),
      sort_by: jest.fn().mockReturnThis(),
      execute: jest.fn()
    },
    url: jest.fn()
  }
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

const cloudinaryService = require('../../services/cloudinaryService');

describe('CloudinaryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;
  });

  describe('Configuration', () => {
    it('should have required environment variables set', () => {
      expect(process.env.CLOUDINARY_CLOUD_NAME).toBe('test-cloud');
      expect(process.env.CLOUDINARY_API_KEY).toBe('test-key');
      expect(process.env.CLOUDINARY_API_SECRET).toBe('test-secret');
    });

    it('should validate configuration on instantiation', () => {
      // Since the service is already instantiated, we test that it doesn't throw
      expect(cloudinaryService).toBeDefined();
      expect(typeof cloudinaryService.uploadImage).toBe('function');
      expect(typeof cloudinaryService.deleteImage).toBe('function');
    });
  });

  describe('uploadImage', () => {
    const mockUploadResult = {
      public_id: 'test-image-id',
      secure_url: 'https://res.cloudinary.com/test/image/upload/test-image-id.jpg',
      width: 800,
      height: 600,
      format: 'jpg',
      bytes: 150000,
      created_at: '2024-01-15T10:30:00Z'
    };

    it('should upload image from file path successfully', async () => {
      cloudinary.uploader.upload.mockResolvedValue(mockUploadResult);
      cloudinary.url.mockReturnValue('https://optimized-url.jpg');

      const result = await cloudinaryService.uploadImage('/path/to/image.jpg');

      expect(cloudinary.uploader.upload).toHaveBeenCalledWith('/path/to/image.jpg', expect.objectContaining({
        folder: 'maison-darin',
        resource_type: 'image',
        format: 'auto',
        quality: 'auto:good'
      }));

      expect(result.success).toBe(true);
      expect(result.data.publicId).toBe('test-image-id');
      expect(result.data.url).toBe(mockUploadResult.secure_url);
      expect(result.data.variants).toHaveProperty('thumbnail');
      expect(result.data.variants).toHaveProperty('medium');
      expect(result.data.variants).toHaveProperty('large');
      expect(result.data.variants).toHaveProperty('extraLarge');
    });

    it('should upload image from buffer successfully', async () => {
      const mockBuffer = Buffer.from('fake image data');
      const mockStream = {
        end: jest.fn()
      };
      
      cloudinary.uploader.upload_stream.mockImplementation((options, callback) => {
        callback(null, mockUploadResult);
        return mockStream;
      });
      cloudinary.url.mockReturnValue('https://optimized-url.jpg');

      const result = await cloudinaryService.uploadImage(mockBuffer);

      expect(cloudinary.uploader.upload_stream).toHaveBeenCalled();
      expect(mockStream.end).toHaveBeenCalledWith(mockBuffer);
      expect(result.success).toBe(true);
      expect(result.data.publicId).toBe('test-image-id');
    });

    it('should handle upload errors', async () => {
      const uploadError = new Error('Upload failed');
      cloudinary.uploader.upload.mockRejectedValue(uploadError);

      await expect(cloudinaryService.uploadImage('/path/to/image.jpg'))
        .rejects.toThrow('Image upload failed: Upload failed');
    });

    it('should use custom options when provided', async () => {
      cloudinary.uploader.upload.mockResolvedValue(mockUploadResult);
      cloudinary.url.mockReturnValue('https://optimized-url.jpg');

      const customOptions = {
        folder: 'custom-folder',
        publicId: 'custom-id',
        tags: ['tag1', 'tag2']
      };

      await cloudinaryService.uploadImage('/path/to/image.jpg', customOptions);

      expect(cloudinary.uploader.upload).toHaveBeenCalledWith('/path/to/image.jpg', expect.objectContaining({
        folder: 'custom-folder',
        publicId: 'custom-id',
        tags: ['tag1', 'tag2']
      }));
    });
  });

  describe('deleteImage', () => {
    it('should delete image successfully', async () => {
      cloudinary.uploader.destroy.mockResolvedValue({ result: 'ok' });

      const result = await cloudinaryService.deleteImage('test-image-id');

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('test-image-id');
      expect(result.success).toBe(true);
      expect(result.message).toBe('Image deleted successfully');
    });

    it('should handle image not found', async () => {
      cloudinary.uploader.destroy.mockResolvedValue({ result: 'not found' });

      const result = await cloudinaryService.deleteImage('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Image not found');
    });

    it('should handle deletion errors', async () => {
      const deleteError = new Error('Deletion failed');
      cloudinary.uploader.destroy.mockRejectedValue(deleteError);

      await expect(cloudinaryService.deleteImage('test-image-id'))
        .rejects.toThrow('Image deletion failed: Deletion failed');
    });
  });

  describe('getOptimizedUrl', () => {
    it('should generate optimized URL with default transformations', () => {
      cloudinary.url.mockReturnValue('https://optimized-url.jpg');

      const url = cloudinaryService.getOptimizedUrl('test-image-id');

      expect(cloudinary.url).toHaveBeenCalledWith('test-image-id', {
        secure: true,
        quality: 'auto:good',
        fetch_format: 'auto',
        flags: 'progressive'
      });
      expect(url).toBe('https://optimized-url.jpg');
    });

    it('should generate optimized URL with custom transformations', () => {
      cloudinary.url.mockReturnValue('https://custom-optimized-url.jpg');

      const customTransformations = {
        width: 300,
        height: 200,
        crop: 'fill'
      };

      const url = cloudinaryService.getOptimizedUrl('test-image-id', customTransformations);

      expect(cloudinary.url).toHaveBeenCalledWith('test-image-id', {
        secure: true,
        quality: 'auto:good',
        fetch_format: 'auto',
        flags: 'progressive',
        width: 300,
        height: 200,
        crop: 'fill'
      });
      expect(url).toBe('https://custom-optimized-url.jpg');
    });

    it('should handle URL generation errors', () => {
      cloudinary.url.mockImplementation(() => {
        throw new Error('URL generation failed');
      });

      expect(() => cloudinaryService.getOptimizedUrl('test-image-id'))
        .toThrow('Failed to generate optimized URL: URL generation failed');
    });
  });

  describe('bulkDelete', () => {
    it('should delete multiple images successfully', async () => {
      const mockResult = {
        deleted: {
          'image1': 'deleted',
          'image2': 'deleted',
          'image3': 'not_found'
        }
      };
      cloudinary.api.delete_resources.mockResolvedValue(mockResult);

      const result = await cloudinaryService.bulkDelete(['image1', 'image2', 'image3']);

      expect(cloudinary.api.delete_resources).toHaveBeenCalledWith(['image1', 'image2', 'image3']);
      expect(result.success).toBe(true);
      expect(result.deleted).toEqual(['image1', 'image2']);
      expect(result.failed).toEqual([{ publicId: 'image3', reason: 'not_found' }]);
    });

    it('should handle empty array', async () => {
      const result = await cloudinaryService.bulkDelete([]);

      expect(result.success).toBe(true);
      expect(result.deleted).toEqual([]);
      expect(result.failed).toEqual([]);
    });

    it('should handle bulk deletion errors', async () => {
      const deleteError = new Error('Bulk deletion failed');
      cloudinary.api.delete_resources.mockRejectedValue(deleteError);

      await expect(cloudinaryService.bulkDelete(['image1', 'image2']))
        .rejects.toThrow('Bulk deletion failed: Bulk deletion failed');
    });
  });

  describe('getImageDetails', () => {
    it('should get image details successfully', async () => {
      const mockDetails = {
        public_id: 'test-image-id',
        secure_url: 'https://res.cloudinary.com/test/image/upload/test-image-id.jpg',
        width: 800,
        height: 600,
        format: 'jpg',
        bytes: 150000,
        created_at: '2024-01-15T10:30:00Z',
        tags: ['tag1', 'tag2']
      };
      cloudinary.api.resource.mockResolvedValue(mockDetails);

      const result = await cloudinaryService.getImageDetails('test-image-id');

      expect(cloudinary.api.resource).toHaveBeenCalledWith('test-image-id');
      expect(result.success).toBe(true);
      expect(result.data.publicId).toBe('test-image-id');
      expect(result.data.tags).toEqual(['tag1', 'tag2']);
    });

    it('should handle image not found', async () => {
      const notFoundError = new Error('Not found');
      notFoundError.http_code = 404;
      cloudinary.api.resource.mockRejectedValue(notFoundError);

      const result = await cloudinaryService.getImageDetails('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Image not found');
    });
  });

  describe('testConnection', () => {
    it('should return true for successful connection', async () => {
      cloudinary.api.ping.mockResolvedValue({});

      const result = await cloudinaryService.testConnection();

      expect(cloudinary.api.ping).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false for failed connection', async () => {
      cloudinary.api.ping.mockRejectedValue(new Error('Connection failed'));

      const result = await cloudinaryService.testConnection();

      expect(result).toBe(false);
    });
  });
});