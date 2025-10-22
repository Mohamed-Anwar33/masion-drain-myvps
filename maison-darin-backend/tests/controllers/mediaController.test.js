const request = require('supertest');
const app = require('../../server');
const Media = require('../../models/Media');
const User = require('../../models/User');
const cloudinaryService = require('../../services/cloudinaryService');
const jwt = require('jsonwebtoken');

// Mock Cloudinary service
jest.mock('../../services/cloudinaryService', () => ({
  uploadImage: jest.fn(),
  deleteImage: jest.fn(),
  updateImageTags: jest.fn()
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

describe('Media Controller', () => {
  let authToken;
  let testUser;
  let testMedia;

  beforeAll(async () => {
    // Create test user
    testUser = new User({
      email: 'test@example.com',
      password: 'hashedpassword123',
      role: 'admin'
    });
    await testUser.save();

    // Generate auth token
    authToken = jwt.sign(
      { id: testUser._id, email: testUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  beforeEach(async () => {
    // Clean up media collection
    await Media.deleteMany({});

    // Create test media
    testMedia = new Media({
      filename: 'test-image.jpg',
      originalName: 'original-test.jpg',
      cloudinaryUrl: 'https://res.cloudinary.com/test/image/upload/test-id.jpg',
      cloudinaryId: 'test-folder/test-id',
      size: 150000,
      mimetype: 'image/jpeg',
      width: 800,
      height: 600,
      alt: {
        en: 'Test image',
        ar: 'صورة اختبار'
      },
      variants: {
        thumbnail: 'https://res.cloudinary.com/test/c_fill,h_150,w_150/test-id.jpg',
        medium: 'https://res.cloudinary.com/test/c_fill,h_400,w_400/test-id.jpg',
        large: 'https://res.cloudinary.com/test/c_fill,h_800,w_800/test-id.jpg',
        extraLarge: 'https://res.cloudinary.com/test/c_scale,w_1200/test-id.jpg'
      },
      tags: ['test', 'product'],
      uploadedBy: testUser._id
    });
    await testMedia.save();

    // Reset mocks
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Media.deleteMany({});
  });

  describe('POST /api/media/upload', () => {
    const mockCloudinaryResult = {
      success: true,
      data: {
        publicId: 'test-folder/new-image-id',
        url: 'https://res.cloudinary.com/test/image/upload/new-image-id.jpg',
        width: 1024,
        height: 768,
        format: 'jpg',
        size: 200000,
        createdAt: '2024-01-15T10:30:00Z',
        variants: {
          thumbnail: 'https://res.cloudinary.com/test/c_fill,h_150,w_150/new-image-id.jpg',
          medium: 'https://res.cloudinary.com/test/c_fill,h_400,w_400/new-image-id.jpg',
          large: 'https://res.cloudinary.com/test/c_fill,h_800,w_800/new-image-id.jpg',
          extraLarge: 'https://res.cloudinary.com/test/c_scale,w_1200/new-image-id.jpg'
        }
      }
    };

    beforeEach(() => {
      cloudinaryService.uploadImage.mockResolvedValue(mockCloudinaryResult);
    });

    it('should upload image successfully', async () => {
      const response = await request(app)
        .post('/api/media/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('altEn', 'New test image')
        .field('altAr', 'صورة اختبار جديدة')
        .field('tags', 'product,new')
        .attach('image', Buffer.from('fake image data'), 'test.jpg');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.originalName).toBe('test.jpg');
      expect(response.body.data.alt.en).toBe('New test image');
      expect(response.body.data.alt.ar).toBe('صورة اختبار جديدة');
      expect(response.body.data.tags).toEqual(['product', 'new']);

      expect(cloudinaryService.uploadImage).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.objectContaining({
          folder: 'maison-darin',
          tags: ['product', 'new']
        })
      );
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/media/upload')
        .field('altEn', 'Test image')
        .attach('image', Buffer.from('fake image data'), 'test.jpg');

      expect(response.status).toBe(401);
    });

    it('should require image file', async () => {
      const response = await request(app)
        .post('/api/media/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('altEn', 'Test image');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('NO_FILE_UPLOADED');
    });

    it('should require at least one alt text', async () => {
      const response = await request(app)
        .post('/api/media/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', Buffer.from('fake image data'), 'test.jpg');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle Cloudinary upload failure', async () => {
      cloudinaryService.uploadImage.mockResolvedValue({ success: false });

      const response = await request(app)
        .post('/api/media/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('altEn', 'Test image')
        .attach('image', Buffer.from('fake image data'), 'test.jpg');

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('UPLOAD_FAILED');
    });

    it('should use custom folder when provided', async () => {
      await request(app)
        .post('/api/media/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('altEn', 'Test image')
        .field('folder', 'custom-folder')
        .attach('image', Buffer.from('fake image data'), 'test.jpg');

      expect(cloudinaryService.uploadImage).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.objectContaining({
          folder: 'custom-folder'
        })
      );
    });
  });

  describe('GET /api/media', () => {
    beforeEach(async () => {
      // Create additional test media
      const media2 = new Media({
        filename: 'test-image-2.jpg',
        originalName: 'original-test-2.jpg',
        cloudinaryUrl: 'https://res.cloudinary.com/test/image/upload/test-id-2.jpg',
        cloudinaryId: 'test-folder/test-id-2',
        size: 100000,
        mimetype: 'image/png',
        width: 600,
        height: 400,
        alt: { en: 'Second test image' },
        variants: {},
        tags: ['banner'],
        uploadedBy: testUser._id
      });
      await media2.save();
    });

    it('should get media list successfully', async () => {
      const response = await request(app)
        .get('/api/media')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.media).toHaveLength(2);
      expect(response.body.data.pagination).toHaveProperty('total', 2);
      expect(response.body.data.pagination).toHaveProperty('pages', 1);
    });

    it('should filter by mimetype', async () => {
      const response = await request(app)
        .get('/api/media?mimetype=image/jpeg')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.media).toHaveLength(1);
      expect(response.body.data.media[0].mimetype).toBe('image/jpeg');
    });

    it('should filter by tags', async () => {
      const response = await request(app)
        .get('/api/media?tags=product')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.media).toHaveLength(1);
      expect(response.body.data.media[0].tags).toContain('product');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/media?page=1&limit=1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.media).toHaveLength(1);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(1);
      expect(response.body.data.pagination.hasNext).toBe(true);
    });

    it('should require authentication', async () => {
      const response = await request(app).get('/api/media');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/media/:id', () => {
    it('should get media by ID successfully', async () => {
      const response = await request(app)
        .get(`/api/media/${testMedia._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testMedia._id.toString());
      expect(response.body.data.filename).toBe(testMedia.filename);
    });

    it('should return 404 for non-existent media', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/media/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('MEDIA_NOT_FOUND');
    });

    it('should require authentication', async () => {
      const response = await request(app).get(`/api/media/${testMedia._id}`);
      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/media/:id', () => {
    beforeEach(() => {
      cloudinaryService.updateImageTags.mockResolvedValue({ success: true });
    });

    it('should update media metadata successfully', async () => {
      const response = await request(app)
        .put(`/api/media/${testMedia._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          altEn: 'Updated English alt text',
          altAr: 'نص بديل محدث',
          tags: ['updated', 'product']
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.alt.en).toBe('Updated English alt text');
      expect(response.body.data.alt.ar).toBe('نص بديل محدث');
      expect(response.body.data.tags).toEqual(['updated', 'product']);

      expect(cloudinaryService.updateImageTags).toHaveBeenCalledWith(
        testMedia.cloudinaryId,
        ['updated', 'product']
      );
    });

    it('should update only alt text when tags not provided', async () => {
      const response = await request(app)
        .put(`/api/media/${testMedia._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          altEn: 'Updated English only'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.alt.en).toBe('Updated English only');
      expect(response.body.data.alt.ar).toBe('صورة اختبار'); // Original Arabic text
      expect(cloudinaryService.updateImageTags).not.toHaveBeenCalled();
    });

    it('should handle tags as comma-separated string', async () => {
      const response = await request(app)
        .put(`/api/media/${testMedia._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tags: 'tag1, tag2, tag3'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.tags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should return 404 for non-existent media', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .put(`/api/media/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ altEn: 'Updated' });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('MEDIA_NOT_FOUND');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put(`/api/media/${testMedia._id}`)
        .send({ altEn: 'Updated' });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/media/:id', () => {
    beforeEach(() => {
      cloudinaryService.deleteImage.mockResolvedValue({ success: true });
    });

    it('should delete media successfully', async () => {
      const response = await request(app)
        .delete(`/api/media/${testMedia._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Media deleted successfully');

      expect(cloudinaryService.deleteImage).toHaveBeenCalledWith(testMedia.cloudinaryId);

      // Verify media is soft deleted
      const deletedMedia = await Media.findById(testMedia._id);
      expect(deletedMedia.isActive).toBe(false);
    });

    it('should continue deletion even if Cloudinary fails', async () => {
      cloudinaryService.deleteImage.mockRejectedValue(new Error('Cloudinary error'));

      const response = await request(app)
        .delete(`/api/media/${testMedia._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify media is still soft deleted
      const deletedMedia = await Media.findById(testMedia._id);
      expect(deletedMedia.isActive).toBe(false);
    });

    it('should return 404 for non-existent media', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .delete(`/api/media/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('MEDIA_NOT_FOUND');
    });

    it('should require authentication', async () => {
      const response = await request(app).delete(`/api/media/${testMedia._id}`);
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/media/:id/url/:size', () => {
    it('should get optimized URL successfully', async () => {
      const response = await request(app)
        .get(`/api/media/${testMedia._id}/url/medium`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.url).toBe(testMedia.variants.medium);
      expect(response.body.data.size).toBe('medium');
      expect(response.body.data.mediaId).toBe(testMedia._id.toString());
    });

    it('should return original URL for invalid size', async () => {
      const response = await request(app)
        .get(`/api/media/${testMedia._id}/url/invalid`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.url).toBe(testMedia.cloudinaryUrl);
    });

    it('should return 404 for non-existent media', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/media/${fakeId}/url/medium`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should require authentication', async () => {
      const response = await request(app).get(`/api/media/${testMedia._id}/url/medium`);
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/media/:id/usage', () => {
    it('should increment usage count successfully', async () => {
      const initialUsage = testMedia.usageCount;

      const response = await request(app)
        .post(`/api/media/${testMedia._id}/usage`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.usageCount).toBe(initialUsage + 1);

      // Verify in database
      const updatedMedia = await Media.findById(testMedia._id);
      expect(updatedMedia.usageCount).toBe(initialUsage + 1);
    });

    it('should return 404 for non-existent media', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .post(`/api/media/${fakeId}/usage`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should require authentication', async () => {
      const response = await request(app).post(`/api/media/${testMedia._id}/usage`);
      expect(response.status).toBe(401);
    });
  });
});