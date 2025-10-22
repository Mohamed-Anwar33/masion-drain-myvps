// Mock logger
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

const mongoose = require('mongoose');
const Media = require('../../models/Media');

describe('Media Model Unit Tests', () => {
  describe('Schema Definition', () => {
    it('should have correct schema structure', () => {
      const schema = Media.schema;
      
      // Check required fields
      expect(schema.paths.filename.isRequired).toBe(true);
      expect(schema.paths.originalName.isRequired).toBe(true);
      expect(schema.paths.cloudinaryUrl.isRequired).toBe(true);
      expect(schema.paths.cloudinaryId.isRequired).toBe(true);
      expect(schema.paths.size.isRequired).toBe(true);
      expect(schema.paths.mimetype.isRequired).toBe(true);
      expect(schema.paths.uploadedBy.isRequired).toBe(true);
    });

    it('should have correct field types', () => {
      const schema = Media.schema;
      
      expect(schema.paths.filename.instance).toBe('String');
      expect(schema.paths.originalName.instance).toBe('String');
      expect(schema.paths.cloudinaryUrl.instance).toBe('String');
      expect(schema.paths.cloudinaryId.instance).toBe('String');
      expect(schema.paths.size.instance).toBe('Number');
      expect(schema.paths.mimetype.instance).toBe('String');
      expect(schema.paths.width.instance).toBe('Number');
      expect(schema.paths.height.instance).toBe('Number');
      expect(schema.paths.uploadedBy.instance).toBe('ObjectId');
    });

    it('should have correct enum values for mimetype', () => {
      const schema = Media.schema;
      const mimetypeEnum = schema.paths.mimetype.enumValues;
      
      expect(mimetypeEnum).toContain('image/jpeg');
      expect(mimetypeEnum).toContain('image/png');
      expect(mimetypeEnum).toContain('image/webp');
      expect(mimetypeEnum).toHaveLength(3);
    });

    it('should have default values set correctly', () => {
      const schema = Media.schema;
      
      expect(schema.paths.usageCount.defaultValue).toBe(0);
      expect(schema.paths.isActive.defaultValue).toBe(true);
      expect(schema.paths.isPublic.defaultValue).toBe(true);
    });

    it('should have proper validation for cloudinaryUrl', () => {
      const schema = Media.schema;
      const validator = schema.paths.cloudinaryUrl.validators.find(v => v.type === 'user defined');
      
      expect(validator.validator('https://res.cloudinary.com/test/image.jpg')).toBe(true);
      expect(validator.validator('https://invalid-url.com/image.jpg')).toBe(false);
    });

    it('should have proper validation for size', () => {
      const schema = Media.schema;
      const minValidator = schema.paths.size.validators.find(v => v.type === 'min');
      
      expect(minValidator.min).toBe(0);
    });

    it('should have proper validation for width and height', () => {
      const schema = Media.schema;
      
      const widthMinValidator = schema.paths.width.validators.find(v => v.type === 'min');
      const heightMinValidator = schema.paths.height.validators.find(v => v.type === 'min');
      
      expect(widthMinValidator.min).toBe(1);
      expect(heightMinValidator.min).toBe(1);
    });

    it('should have maxlength validation for alt text', () => {
      const schema = Media.schema;
      
      const enAltMaxLength = schema.paths['alt.en'].validators.find(v => v.type === 'maxlength');
      const arAltMaxLength = schema.paths['alt.ar'].validators.find(v => v.type === 'maxlength');
      
      expect(enAltMaxLength.maxlength).toBe(200);
      expect(arAltMaxLength.maxlength).toBe(200);
    });
  });

  describe('Virtual Properties', () => {
    let mediaInstance;

    beforeEach(() => {
      // Create a mock media instance
      mediaInstance = {
        size: 150000,
        width: 800,
        height: 600,
        cloudinaryUrl: 'https://res.cloudinary.com/test/image.jpg',
        variants: {
          thumbnail: 'https://res.cloudinary.com/test/c_fill,h_150,w_150/image.jpg',
          medium: 'https://res.cloudinary.com/test/c_fill,h_400,w_400/image.jpg',
          large: 'https://res.cloudinary.com/test/c_fill,h_800,w_800/image.jpg',
          extraLarge: 'https://res.cloudinary.com/test/c_scale,w_1200/image.jpg'
        }
      };
    });

    it('should calculate sizeFormatted correctly', () => {
      const schema = Media.schema;
      const sizeFormattedVirtual = schema.virtuals.sizeFormatted;
      
      // Test the getter function
      const result = sizeFormattedVirtual.getters[0].call(mediaInstance);
      expect(result).toBe('146.48 KB');
    });

    it('should calculate aspectRatio correctly', () => {
      const schema = Media.schema;
      const aspectRatioVirtual = schema.virtuals.aspectRatio;
      
      // Test the getter function
      const result = aspectRatioVirtual.getters[0].call(mediaInstance);
      expect(result).toBe('1.33');
    });

    it('should return null aspectRatio when dimensions missing', () => {
      const schema = Media.schema;
      const aspectRatioVirtual = schema.virtuals.aspectRatio;
      
      const instanceWithoutDimensions = { ...mediaInstance, width: null, height: null };
      const result = aspectRatioVirtual.getters[0].call(instanceWithoutDimensions);
      expect(result).toBeNull();
    });

    it('should format different file sizes correctly', () => {
      const schema = Media.schema;
      const sizeFormattedVirtual = schema.virtuals.sizeFormatted;
      
      // Test bytes
      const bytesInstance = { size: 500 };
      let result = sizeFormattedVirtual.getters[0].call(bytesInstance);
      expect(result).toBe('500 Bytes');
      
      // Test MB
      const mbInstance = { size: 2048000 };
      result = sizeFormattedVirtual.getters[0].call(mbInstance);
      expect(result).toBe('1.95 MB');
      
      // Test zero bytes
      const zeroInstance = { size: 0 };
      result = sizeFormattedVirtual.getters[0].call(zeroInstance);
      expect(result).toBe('0 Bytes');
    });
  });

  describe('Static Methods', () => {
    it('should have findByCloudinaryId static method', () => {
      expect(typeof Media.findByCloudinaryId).toBe('function');
    });

    it('should have findByUploader static method', () => {
      expect(typeof Media.findByUploader).toBe('function');
    });

    it('should have searchMedia static method', () => {
      expect(typeof Media.searchMedia).toBe('function');
    });
  });

  describe('Instance Methods', () => {
    let mockMedia;

    beforeEach(() => {
      // Create a mock media instance with methods
      mockMedia = {
        usageCount: 0,
        tags: ['existing-tag'],
        isActive: true,
        alt: { en: 'Test', ar: 'اختبار' },
        cloudinaryUrl: 'https://res.cloudinary.com/test/image.jpg',
        variants: {
          thumbnail: 'https://res.cloudinary.com/test/c_fill,h_150,w_150/image.jpg',
          medium: 'https://res.cloudinary.com/test/c_fill,h_400,w_400/image.jpg'
        },
        save: jest.fn().mockResolvedValue(true)
      };

      // Bind the actual methods to the mock instance
      const schema = Media.schema;
      mockMedia.incrementUsage = schema.methods.incrementUsage.bind(mockMedia);
      mockMedia.addTags = schema.methods.addTags.bind(mockMedia);
      mockMedia.removeTags = schema.methods.removeTags.bind(mockMedia);
      mockMedia.softDelete = schema.methods.softDelete.bind(mockMedia);
      mockMedia.getOptimizedUrl = schema.methods.getOptimizedUrl.bind(mockMedia);
      mockMedia.updateAltText = schema.methods.updateAltText.bind(mockMedia);
    });

    describe('incrementUsage', () => {
      it('should increment usage count', async () => {
        expect(mockMedia.usageCount).toBe(0);
        
        await mockMedia.incrementUsage();
        expect(mockMedia.usageCount).toBe(1);
        expect(mockMedia.save).toHaveBeenCalled();
      });
    });

    describe('addTags', () => {
      it('should add single tag', async () => {
        await mockMedia.addTags('new-tag');
        expect(mockMedia.tags).toContain('new-tag');
        expect(mockMedia.save).toHaveBeenCalled();
      });

      it('should add multiple tags', async () => {
        await mockMedia.addTags(['tag1', 'tag2']);
        expect(mockMedia.tags).toContain('tag1');
        expect(mockMedia.tags).toContain('tag2');
      });

      it('should handle string input', async () => {
        await mockMedia.addTags('single-tag');
        expect(mockMedia.tags).toContain('single-tag');
      });

      it('should normalize tags to lowercase', async () => {
        await mockMedia.addTags('UPPERCASE-TAG');
        expect(mockMedia.tags).toContain('uppercase-tag');
      });

      it('should not add duplicate tags', async () => {
        await mockMedia.addTags(['existing-tag', 'new-tag']);
        const existingTagCount = mockMedia.tags.filter(tag => tag === 'existing-tag').length;
        expect(existingTagCount).toBe(1);
      });
    });

    describe('removeTags', () => {
      beforeEach(() => {
        mockMedia.tags = ['tag1', 'tag2', 'tag3'];
      });

      it('should remove single tag', async () => {
        await mockMedia.removeTags('tag1');
        expect(mockMedia.tags).not.toContain('tag1');
        expect(mockMedia.tags).toContain('tag2');
        expect(mockMedia.save).toHaveBeenCalled();
      });

      it('should remove multiple tags', async () => {
        await mockMedia.removeTags(['tag1', 'tag2']);
        expect(mockMedia.tags).not.toContain('tag1');
        expect(mockMedia.tags).not.toContain('tag2');
        expect(mockMedia.tags).toContain('tag3');
      });

      it('should handle string input', async () => {
        await mockMedia.removeTags('tag1');
        expect(mockMedia.tags).not.toContain('tag1');
      });
    });

    describe('softDelete', () => {
      it('should set isActive to false', async () => {
        expect(mockMedia.isActive).toBe(true);
        
        await mockMedia.softDelete();
        expect(mockMedia.isActive).toBe(false);
        expect(mockMedia.save).toHaveBeenCalled();
      });
    });

    describe('getOptimizedUrl', () => {
      it('should return medium variant by default', () => {
        const url = mockMedia.getOptimizedUrl();
        expect(url).toBe(mockMedia.variants.medium);
      });

      it('should return specific size variant', () => {
        const url = mockMedia.getOptimizedUrl('thumbnail');
        expect(url).toBe(mockMedia.variants.thumbnail);
      });

      it('should return original URL for invalid size', () => {
        const url = mockMedia.getOptimizedUrl('invalid-size');
        expect(url).toBe(mockMedia.cloudinaryUrl);
      });

      it('should return original URL if variant not available', () => {
        mockMedia.variants.large = null;
        const url = mockMedia.getOptimizedUrl('large');
        expect(url).toBe(mockMedia.cloudinaryUrl);
      });
    });

    describe('updateAltText', () => {
      it('should update English alt text', async () => {
        await mockMedia.updateAltText({ en: 'New English description' });
        expect(mockMedia.alt.en).toBe('New English description');
        expect(mockMedia.save).toHaveBeenCalled();
      });

      it('should update Arabic alt text', async () => {
        await mockMedia.updateAltText({ ar: 'وصف عربي جديد' });
        expect(mockMedia.alt.ar).toBe('وصف عربي جديد');
      });

      it('should update both alt texts', async () => {
        await mockMedia.updateAltText({
          en: 'New English description',
          ar: 'وصف عربي جديد'
        });
        expect(mockMedia.alt.en).toBe('New English description');
        expect(mockMedia.alt.ar).toBe('وصف عربي جديد');
      });

      it('should not update if field not provided', async () => {
        const originalEn = mockMedia.alt.en;
        await mockMedia.updateAltText({ ar: 'وصف عربي جديد' });
        expect(mockMedia.alt.en).toBe(originalEn);
        expect(mockMedia.alt.ar).toBe('وصف عربي جديد');
      });
    });
  });

  describe('Validation Functions', () => {
    it('should validate Cloudinary URL format correctly', () => {
      const schema = Media.schema;
      const validator = schema.paths.cloudinaryUrl.validators.find(v => v.type === 'user defined').validator;
      
      // Valid URLs
      expect(validator('https://res.cloudinary.com/test/image/upload/v123/image.jpg')).toBe(true);
      expect(validator('https://res.cloudinary.com/mycloud/video/upload/video.mp4')).toBe(true);
      
      // Invalid URLs
      expect(validator('https://example.com/image.jpg')).toBe(false);
      expect(validator('http://res.cloudinary.com/test/image.jpg')).toBe(false);
      expect(validator('not-a-url')).toBe(false);
    });

    it('should validate variant URLs format correctly', () => {
      const schema = Media.schema;
      const thumbnailValidator = schema.paths['variants.thumbnail'].validators[0].validator;
      
      // Valid URLs (including empty)
      expect(thumbnailValidator('https://res.cloudinary.com/test/image.jpg')).toBe(true);
      expect(thumbnailValidator('')).toBe(true);
      expect(thumbnailValidator(null)).toBe(true);
      expect(thumbnailValidator(undefined)).toBe(true);
      
      // Invalid URLs
      expect(thumbnailValidator('https://example.com/image.jpg')).toBe(false);
    });

    it('should validate integer values correctly', () => {
      const schema = Media.schema;
      const widthValidator = schema.paths.width.validators.find(v => v.type === 'user defined').validator;
      
      expect(widthValidator(100)).toBe(true);
      expect(widthValidator(0)).toBe(true);
      expect(widthValidator(-1)).toBe(true); // min validator will catch this
      expect(widthValidator(100.5)).toBe(false);
      expect(widthValidator('100')).toBe(false);
    });
  });
});