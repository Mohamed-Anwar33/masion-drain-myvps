// Set up environment variables before requiring modules
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-key';
process.env.CLOUDINARY_API_SECRET = 'test-secret';

const request = require('supertest');
const express = require('express');

// Mock dependencies
jest.mock('../../models/Media');
jest.mock('../../services/cloudinaryService');
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

const { MediaController, uploadMiddleware } = require('../../controllers/mediaController');

const Media = require('../../models/Media');
const cloudinaryService = require('../../services/cloudinaryService');

// Create test app
const app = express();
app.use(express.json());

// Mock authentication middleware
const mockAuth = (req, res, next) => {
  req.user = { id: 'test-user-id', email: 'test@example.com' };
  next();
};

// Set up routes
app.post('/api/media/upload', mockAuth, uploadMiddleware, MediaController.uploadImage);
app.get('/api/media', mockAuth, MediaController.getMedia);
app.get('/api/media/:id', mockAuth, MediaController.getMediaById);
app.put('/api/media/:id', mockAuth, MediaController.updateMediaMetadata);
app.delete('/api/media/:id', mockAuth, MediaController.deleteMedia);
app.get('/api/media/:id/url/:size', mockAuth, MediaController.getOptimizedUrl);
app.post('/api/media/:id/usage', mockAuth, MediaController.incrementUsage);

describe('Media Controller Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/media/upload', () => {
    it('should require image file', async () => {
      const response = await request(app)
        .post('/api/media/upload')
        .field('altEn', 'Test image');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('NO_FILE_UPLOADED');
    });

    it('should require at least one alt text', async () => {
      // Create a valid JPEG buffer to pass file validation
      const validBuffer = Buffer.alloc(1000, 0x42);
      validBuffer[0] = 0xFF;
      validBuffer[1] = 0xD8;
      validBuffer[2] = 0xFF;
      validBuffer[3] = 0xE0;

      const response = await request(app)
        .post('/api/media/upload')
        .attach('image', validBuffer, 'test.jpg');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('alt text');
    });
  });

  describe('GET /api/media', () => {
    beforeEach(() => {
      const mockMedia = [
        {
          _id: 'media1',
          filename: 'test1.jpg',
          originalName: 'original1.jpg',
          cloudinaryUrl: 'https://res.cloudinary.com/test/image1.jpg',
          cloudinaryId: 'test/image1',
          size: 100000,
          mimetype: 'image/jpeg',
          width: 800,
          height: 600,
          alt: { en: 'Test image 1' },
          variants: {},
          tags: ['test'],
          usageCount: 0,
          uploadedBy: 'user1',
          uploadedAt: new Date(),
          updatedAt: new Date()
        }
      ];

      Media.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              skip: jest.fn().mockResolvedValue(mockMedia)
            })
          })
        })
      });

      Media.countDocuments = jest.fn().mockResolvedValue(1);
    });

    it('should get media list successfully', async () => {
      const response = await request(app).get('/api/media');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.media).toHaveLength(1);
      expect(response.body.data.pagination).toHaveProperty('total', 1);
    });

    it('should support pagination parameters', async () => {
      const response = await request(app)
        .get('/api/media?page=2&limit=10');

      expect(response.status).toBe(200);
      expect(response.body.data.pagination.page).toBe(2);
      expect(response.body.data.pagination.limit).toBe(10);
    });
  });

  describe('GET /api/media/:id', () => {
    it('should return 404 for non-existent media', async () => {
      Media.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      const response = await request(app).get('/api/media/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('MEDIA_NOT_FOUND');
    });

    it('should get media by ID successfully', async () => {
      const mockMedia = {
        _id: 'media1',
        filename: 'test.jpg',
        originalName: 'original.jpg',
        cloudinaryUrl: 'https://res.cloudinary.com/test/image.jpg',
        cloudinaryId: 'test/image',
        size: 100000,
        mimetype: 'image/jpeg',
        width: 800,
        height: 600,
        alt: { en: 'Test image' },
        variants: {},
        tags: ['test'],
        usageCount: 0,
        uploadedBy: { email: 'user@example.com' },
        uploadedAt: new Date(),
        updatedAt: new Date()
      };

      Media.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockMedia)
      });

      const response = await request(app).get('/api/media/media1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('media1');
    });
  });

  describe('PUT /api/media/:id', () => {
    it('should return 404 for non-existent media', async () => {
      Media.findOne = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .put('/api/media/nonexistent')
        .send({ altEn: 'Updated' });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('MEDIA_NOT_FOUND');
    });

    it('should update media metadata successfully', async () => {
      const mockMedia = {
        _id: 'media1',
        filename: 'test.jpg',
        cloudinaryId: 'test/image',
        alt: { en: 'Original', ar: 'أصلي' },
        tags: ['old'],
        updateAltText: jest.fn().mockResolvedValue(),
        save: jest.fn().mockResolvedValue(),
        toObject: function() { return this; }
      };

      Media.findOne = jest.fn().mockResolvedValue(mockMedia);
      cloudinaryService.updateImageTags = jest.fn().mockResolvedValue({ success: true });

      const response = await request(app)
        .put('/api/media/media1')
        .send({
          altEn: 'Updated English',
          altAr: 'محدث عربي',
          tags: ['new', 'updated']
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockMedia.updateAltText).toHaveBeenCalledWith({
        en: 'Updated English',
        ar: 'محدث عربي'
      });
      expect(cloudinaryService.updateImageTags).toHaveBeenCalledWith(
        'test/image',
        ['new', 'updated']
      );
    });
  });

  describe('DELETE /api/media/:id', () => {
    it('should return 404 for non-existent media', async () => {
      Media.findOne = jest.fn().mockResolvedValue(null);

      const response = await request(app).delete('/api/media/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('MEDIA_NOT_FOUND');
    });

    it('should delete media successfully', async () => {
      const mockMedia = {
        _id: 'media1',
        cloudinaryId: 'test/image',
        softDelete: jest.fn().mockResolvedValue()
      };

      Media.findOne = jest.fn().mockResolvedValue(mockMedia);
      cloudinaryService.deleteImage = jest.fn().mockResolvedValue({ success: true });

      const response = await request(app).delete('/api/media/media1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Media deleted successfully');
      expect(cloudinaryService.deleteImage).toHaveBeenCalledWith('test/image');
      expect(mockMedia.softDelete).toHaveBeenCalled();
    });

    it('should continue deletion even if Cloudinary fails', async () => {
      const mockMedia = {
        _id: 'media1',
        cloudinaryId: 'test/image',
        softDelete: jest.fn().mockResolvedValue()
      };

      Media.findOne = jest.fn().mockResolvedValue(mockMedia);
      cloudinaryService.deleteImage = jest.fn().mockRejectedValue(new Error('Cloudinary error'));

      const response = await request(app).delete('/api/media/media1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockMedia.softDelete).toHaveBeenCalled();
    });
  });

  describe('GET /api/media/:id/url/:size', () => {
    it('should return 404 for non-existent media', async () => {
      Media.findOne = jest.fn().mockResolvedValue(null);

      const response = await request(app).get('/api/media/nonexistent/url/medium');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('MEDIA_NOT_FOUND');
    });

    it('should get optimized URL successfully', async () => {
      const mockMedia = {
        _id: 'media1',
        getOptimizedUrl: jest.fn().mockReturnValue('https://optimized-url.jpg')
      };

      Media.findOne = jest.fn().mockResolvedValue(mockMedia);

      const response = await request(app).get('/api/media/media1/url/medium');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.url).toBe('https://optimized-url.jpg');
      expect(response.body.data.size).toBe('medium');
      expect(mockMedia.getOptimizedUrl).toHaveBeenCalledWith('medium');
    });
  });

  describe('POST /api/media/:id/usage', () => {
    it('should return 404 for non-existent media', async () => {
      Media.findOne = jest.fn().mockResolvedValue(null);

      const response = await request(app).post('/api/media/nonexistent/usage');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('MEDIA_NOT_FOUND');
    });

    it('should increment usage count successfully', async () => {
      const mockMedia = {
        _id: 'media1',
        usageCount: 5,
        incrementUsage: jest.fn().mockResolvedValue()
      };

      // Mock the incrementUsage to actually increment the count
      mockMedia.incrementUsage.mockImplementation(() => {
        mockMedia.usageCount += 1;
        return Promise.resolve();
      });

      Media.findOne = jest.fn().mockResolvedValue(mockMedia);

      const response = await request(app).post('/api/media/media1/usage');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.usageCount).toBe(6);
      expect(mockMedia.incrementUsage).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      Media.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              skip: jest.fn().mockRejectedValue(new Error('Database error'))
            })
          })
        })
      });

      const response = await request(app).get('/api/media');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INTERNAL_ERROR');
    });

    it('should handle Cloudinary service errors', async () => {
      const mockMedia = {
        _id: 'media1',
        cloudinaryId: 'test/image',
        softDelete: jest.fn().mockResolvedValue()
      };

      Media.findOne = jest.fn().mockResolvedValue(mockMedia);
      cloudinaryService.deleteImage = jest.fn().mockRejectedValue(new Error('Service unavailable'));

      const response = await request(app).delete('/api/media/media1');

      // Should still succeed even if Cloudinary fails
      expect(response.status).toBe(200);
      expect(mockMedia.softDelete).toHaveBeenCalled();
    });
  });
});