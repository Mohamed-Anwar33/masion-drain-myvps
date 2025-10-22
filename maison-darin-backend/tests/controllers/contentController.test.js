const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const contentController = require('../../controllers/contentController');
const contentService = require('../../services/contentService');
const { authenticate } = require('../../middleware/auth');

// Mock the content service
jest.mock('../../services/contentService');
jest.mock('../../middleware/auth');

const app = express();
app.use(express.json());

// Mock authentication middleware
authenticate.mockImplementation((req, res, next) => {
  req.user = { id: 'user123' };
  next();
});

// Set up routes
app.get('/api/content/translations', contentController.getTranslations);
app.put('/api/content/translations', authenticate, contentController.updateTranslations);
app.get('/api/content/:section', contentController.getSection);
app.put('/api/content/:section', authenticate, contentController.updateSection);
app.get('/api/content/:section/history', authenticate, contentController.getSectionHistory);
app.post('/api/content/:section/rollback', authenticate, contentController.rollbackSection);
app.get('/api/content/:section/fallback', contentController.getSectionWithFallback);
app.post('/api/content/:section/validate', authenticate, contentController.validateSection);

describe('Content Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/content/translations', () => {
    it('should get all translations successfully', async () => {
      const mockContent = {
        hero: {
          section: 'hero',
          content: {
            en: { title: 'Welcome' },
            ar: { title: 'مرحباً' }
          }
        }
      };

      contentService.getAllContent.mockResolvedValue(mockContent);

      const response = await request(app)
        .get('/api/content/translations')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockContent);
      expect(response.body.language).toBe('all');
      expect(contentService.getAllContent).toHaveBeenCalledWith(undefined);
    });

    it('should get translations with language filter', async () => {
      const mockContent = {
        hero: {
          section: 'hero',
          content: {
            en: { title: 'Welcome' }
          }
        }
      };

      contentService.getAllContent.mockResolvedValue(mockContent);

      const response = await request(app)
        .get('/api/content/translations?language=en')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.language).toBe('en');
      expect(contentService.getAllContent).toHaveBeenCalledWith('en');
    });

    it('should handle service errors', async () => {
      contentService.getAllContent.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/api/content/translations')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('TRANSLATION_FETCH_ERROR');
    });
  });

  describe('PUT /api/content/translations', () => {
    it('should update translations successfully', async () => {
      const mockResults = {
        successful: [
          { section: 'hero', content: { id: '123' } }
        ],
        failed: []
      };

      contentService.bulkUpdateContent.mockResolvedValue(mockResults);

      const requestBody = {
        contentUpdates: {
          hero: {
            en: { title: 'New Title' },
            ar: { title: 'عنوان جديد' }
          }
        },
        changeLog: 'Test update'
      };

      const response = await request(app)
        .put('/api/content/translations')
        .send(requestBody)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.successful).toHaveLength(1);
      expect(response.body.data.failed).toHaveLength(0);
      expect(contentService.bulkUpdateContent).toHaveBeenCalledWith(
        requestBody.contentUpdates,
        'user123',
        'Test update'
      );
    });

    it('should handle partial failures with 207 status', async () => {
      const mockResults = {
        successful: [
          { section: 'hero', content: { id: '123' } }
        ],
        failed: [
          { section: 'invalid', error: 'Invalid section' }
        ]
      };

      contentService.bulkUpdateContent.mockResolvedValue(mockResults);

      const requestBody = {
        contentUpdates: {
          hero: {
            en: { title: 'New Title' },
            ar: { title: 'عنوان جديد' }
          },
          invalid: {
            en: { title: 'Invalid' },
            ar: { title: 'غير صالح' }
          }
        }
      };

      const response = await request(app)
        .put('/api/content/translations')
        .send(requestBody)
        .expect(207);

      expect(response.body.success).toBe(false);
      expect(response.body.data.successful).toHaveLength(1);
      expect(response.body.data.failed).toHaveLength(1);
    });

    it('should validate request body', async () => {
      const response = await request(app)
        .put('/api/content/translations')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_REQUEST');
    });

    it('should handle service errors', async () => {
      contentService.bulkUpdateContent.mockRejectedValue(new Error('Service error'));

      const requestBody = {
        contentUpdates: {
          hero: {
            en: { title: 'New Title' },
            ar: { title: 'عنوان جديد' }
          }
        }
      };

      const response = await request(app)
        .put('/api/content/translations')
        .send(requestBody)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('TRANSLATION_UPDATE_ERROR');
    });
  });

  describe('GET /api/content/:section', () => {
    it('should get section content successfully', async () => {
      const mockContent = {
        section: 'hero',
        content: {
          en: { title: 'Welcome' },
          ar: { title: 'مرحباً' }
        }
      };

      contentService.getContent.mockResolvedValue(mockContent);

      const response = await request(app)
        .get('/api/content/hero')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockContent);
      expect(contentService.getContent).toHaveBeenCalledWith('hero', undefined);
    });

    it('should get section content with language filter', async () => {
      const mockContent = {
        section: 'hero',
        content: {
          en: { title: 'Welcome' }
        }
      };

      contentService.getContent.mockResolvedValue(mockContent);

      const response = await request(app)
        .get('/api/content/hero?language=en')
        .expect(200);

      expect(contentService.getContent).toHaveBeenCalledWith('hero', 'en');
    });

    it('should return 404 for non-existent content', async () => {
      contentService.getContent.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/content/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONTENT_NOT_FOUND');
    });

    it('should handle service errors', async () => {
      contentService.getContent.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/api/content/hero')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SECTION_FETCH_ERROR');
    });
  });

  describe('PUT /api/content/:section', () => {
    it('should update section content successfully', async () => {
      const mockContent = {
        section: 'hero',
        content: {
          en: { title: 'Updated Title' },
          ar: { title: 'عنوان محدث' }
        }
      };

      contentService.validateContentStructure.mockReturnValue({
        isValid: true,
        errors: []
      });
      contentService.updateContent.mockResolvedValue(mockContent);

      const requestBody = {
        content: {
          en: { title: 'Updated Title', subtitle: 'Subtitle', buttonText: 'Button' },
          ar: { title: 'عنوان محدث', subtitle: 'عنوان فرعي', buttonText: 'زر' }
        },
        changeLog: 'Test update'
      };

      const response = await request(app)
        .put('/api/content/hero')
        .send(requestBody)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockContent);
      expect(contentService.updateContent).toHaveBeenCalledWith(
        'hero',
        requestBody.content,
        'user123',
        'Test update'
      );
    });

    it('should validate content before updating', async () => {
      contentService.validateContentStructure.mockReturnValue({
        isValid: false,
        errors: ['Invalid content structure']
      });

      const requestBody = {
        content: {
          en: { title: 'Title' },
          ar: { title: 'عنوان' }
        }
      };

      const response = await request(app)
        .put('/api/content/hero')
        .send(requestBody)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(contentService.updateContent).not.toHaveBeenCalled();
    });

    it('should validate request body', async () => {
      const response = await request(app)
        .put('/api/content/hero')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_REQUEST');
    });

    it('should handle invalid section errors', async () => {
      contentService.validateContentStructure.mockReturnValue({
        isValid: true,
        errors: []
      });
      contentService.updateContent.mockRejectedValue(new Error('Invalid section: invalid'));

      const requestBody = {
        content: {
          en: { title: 'Title' },
          ar: { title: 'عنوان' }
        }
      };

      const response = await request(app)
        .put('/api/content/invalid')
        .send(requestBody)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_SECTION');
    });

    it('should handle content structure errors', async () => {
      contentService.validateContentStructure.mockReturnValue({
        isValid: true,
        errors: []
      });
      contentService.updateContent.mockRejectedValue(new Error('Invalid content structure for section: hero'));

      const requestBody = {
        content: {
          en: { title: 'Title' },
          ar: { title: 'عنوان' }
        }
      };

      const response = await request(app)
        .put('/api/content/hero')
        .send(requestBody)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CONTENT_STRUCTURE');
    });
  });

  describe('GET /api/content/:section/history', () => {
    it('should get section history successfully', async () => {
      const mockHistory = [
        { version: 2, updatedAt: '2025-09-09T23:29:13.073Z', changeLog: 'Updated' },
        { version: 1, updatedAt: '2025-09-09T23:29:13.073Z', changeLog: 'Created' }
      ];

      contentService.getContentHistory.mockResolvedValue(mockHistory);

      const response = await request(app)
        .get('/api/content/hero/history')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.section).toBe('hero');
      expect(response.body.data.history).toEqual(mockHistory);
      expect(contentService.getContentHistory).toHaveBeenCalledWith('hero', 10);
    });

    it('should respect limit parameter', async () => {
      contentService.getContentHistory.mockResolvedValue([]);

      await request(app)
        .get('/api/content/hero/history?limit=5')
        .expect(200);

      expect(contentService.getContentHistory).toHaveBeenCalledWith('hero', 5);
    });

    it('should handle service errors', async () => {
      contentService.getContentHistory.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/api/content/hero/history')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('HISTORY_FETCH_ERROR');
    });
  });

  describe('POST /api/content/:section/rollback', () => {
    it('should rollback section successfully', async () => {
      const mockContent = {
        section: 'hero',
        content: {
          en: { title: 'Rolled Back Title' },
          ar: { title: 'عنوان مستعاد' }
        }
      };

      contentService.rollbackContent.mockResolvedValue(mockContent);

      const requestBody = {
        versionId: '507f1f77bcf86cd799439011',
        changeLog: 'Rollback test'
      };

      const response = await request(app)
        .post('/api/content/hero/rollback')
        .send(requestBody)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockContent);
      expect(contentService.rollbackContent).toHaveBeenCalledWith(
        'hero',
        '507f1f77bcf86cd799439011',
        'user123',
        'Rollback test'
      );
    });

    it('should validate request body', async () => {
      const response = await request(app)
        .post('/api/content/hero/rollback')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_REQUEST');
    });

    it('should handle version not found errors', async () => {
      contentService.rollbackContent.mockRejectedValue(new Error('Version not found: 123'));

      const requestBody = {
        versionId: '123'
      };

      const response = await request(app)
        .post('/api/content/hero/rollback')
        .send(requestBody)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VERSION_NOT_FOUND');
    });

    it('should handle version mismatch errors', async () => {
      contentService.rollbackContent.mockRejectedValue(new Error('Version 123 does not belong to section hero'));

      const requestBody = {
        versionId: '123'
      };

      const response = await request(app)
        .post('/api/content/hero/rollback')
        .send(requestBody)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VERSION_MISMATCH');
    });
  });

  describe('GET /api/content/:section/fallback', () => {
    it('should get content with fallback successfully', async () => {
      const mockContent = {
        section: 'hero',
        content: { title: 'Welcome' },
        language: 'en',
        usedFallback: false
      };

      contentService.getContentWithFallback.mockResolvedValue(mockContent);

      const response = await request(app)
        .get('/api/content/hero/fallback')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockContent);
      expect(contentService.getContentWithFallback).toHaveBeenCalledWith('hero', 'en', 'ar');
    });

    it('should respect query parameters', async () => {
      contentService.getContentWithFallback.mockResolvedValue({});

      await request(app)
        .get('/api/content/hero/fallback?preferred=ar&fallback=en')
        .expect(200);

      expect(contentService.getContentWithFallback).toHaveBeenCalledWith('hero', 'ar', 'en');
    });

    it('should return 404 for non-existent content', async () => {
      contentService.getContentWithFallback.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/content/nonexistent/fallback')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONTENT_NOT_FOUND');
    });
  });

  describe('POST /api/content/:section/validate', () => {
    it('should validate content successfully', async () => {
      contentService.validateContentStructure.mockReturnValue({
        isValid: true,
        errors: []
      });

      const requestBody = {
        content: {
          en: { title: 'Title', subtitle: 'Subtitle', buttonText: 'Button' },
          ar: { title: 'عنوان', subtitle: 'عنوان فرعي', buttonText: 'زر' }
        }
      };

      const response = await request(app)
        .post('/api/content/hero/validate')
        .send(requestBody)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.section).toBe('hero');
      expect(response.body.data.isValid).toBe(true);
      expect(response.body.data.errors).toHaveLength(0);
    });

    it('should return validation errors', async () => {
      contentService.validateContentStructure.mockReturnValue({
        isValid: false,
        errors: ['Missing required field: subtitle']
      });

      const requestBody = {
        content: {
          en: { title: 'Title' },
          ar: { title: 'عنوان' }
        }
      };

      const response = await request(app)
        .post('/api/content/hero/validate')
        .send(requestBody)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(false);
      expect(response.body.data.errors).toContain('Missing required field: subtitle');
    });

    it('should validate request body', async () => {
      const response = await request(app)
        .post('/api/content/hero/validate')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_REQUEST');
    });
  });
});