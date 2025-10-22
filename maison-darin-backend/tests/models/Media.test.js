const mongoose = require('mongoose');
const Media = require('../../models/Media');
const User = require('../../models/User');

// Mock logger to avoid file system operations in tests
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

describe('Media Model', () => {
  let testUser;
  let validMediaData;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://127.0.0.1:27017/maison-darin-test';
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clean up database
    await Media.deleteMany({});
    await User.deleteMany({});

    // Create test user
    testUser = new User({
      email: 'test@example.com',
      password: 'hashedpassword123',
      role: 'admin'
    });
    await testUser.save();

    // Valid media data
    validMediaData = {
      filename: 'test-image.jpg',
      originalName: 'original-test-image.jpg',
      cloudinaryUrl: 'https://res.cloudinary.com/test/image/upload/v1234567890/test-image.jpg',
      cloudinaryId: 'test-folder/test-image-id',
      size: 150000,
      mimetype: 'image/jpeg',
      width: 800,
      height: 600,
      alt: {
        en: 'Test image description',
        ar: 'وصف الصورة التجريبية'
      },
      uploadedBy: testUser._id,
      variants: {
        thumbnail: 'https://res.cloudinary.com/test/image/upload/c_fill,h_150,w_150/test-image.jpg',
        medium: 'https://res.cloudinary.com/test/image/upload/c_fill,h_400,w_400/test-image.jpg',
        large: 'https://res.cloudinary.com/test/image/upload/c_fill,h_800,w_800/test-image.jpg',
        extraLarge: 'https://res.cloudinary.com/test/image/upload/c_scale,w_1200/test-image.jpg'
      }
    };
  });

  describe('Schema Validation', () => {
    it('should create media with valid data', async () => {
      const media = new Media(validMediaData);
      const savedMedia = await media.save();

      expect(savedMedia._id).toBeDefined();
      expect(savedMedia.filename).toBe(validMediaData.filename);
      expect(savedMedia.cloudinaryId).toBe(validMediaData.cloudinaryId);
      expect(savedMedia.uploadedAt).toBeDefined();
      expect(savedMedia.isActive).toBe(true);
    });

    it('should require filename', async () => {
      const mediaData = { ...validMediaData };
      delete mediaData.filename;

      const media = new Media(mediaData);
      await expect(media.save()).rejects.toThrow('Filename is required');
    });

    it('should require originalName', async () => {
      const mediaData = { ...validMediaData };
      delete mediaData.originalName;

      const media = new Media(mediaData);
      await expect(media.save()).rejects.toThrow('Original filename is required');
    });

    it('should require cloudinaryUrl', async () => {
      const mediaData = { ...validMediaData };
      delete mediaData.cloudinaryUrl;

      const media = new Media(mediaData);
      await expect(media.save()).rejects.toThrow('Cloudinary URL is required');
    });

    it('should validate cloudinaryUrl format', async () => {
      const mediaData = { ...validMediaData };
      mediaData.cloudinaryUrl = 'https://invalid-url.com/image.jpg';

      const media = new Media(mediaData);
      await expect(media.save()).rejects.toThrow('Invalid Cloudinary URL format');
    });

    it('should require cloudinaryId', async () => {
      const mediaData = { ...validMediaData };
      delete mediaData.cloudinaryId;

      const media = new Media(mediaData);
      await expect(media.save()).rejects.toThrow('Cloudinary public ID is required');
    });

    it('should enforce unique cloudinaryId', async () => {
      const media1 = new Media(validMediaData);
      await media1.save();

      const media2 = new Media({
        ...validMediaData,
        filename: 'different-filename.jpg'
      });

      await expect(media2.save()).rejects.toThrow();
    });

    it('should require size', async () => {
      const mediaData = { ...validMediaData };
      delete mediaData.size;

      const media = new Media(mediaData);
      await expect(media.save()).rejects.toThrow('File size is required');
    });

    it('should validate size is not negative', async () => {
      const mediaData = { ...validMediaData };
      mediaData.size = -100;

      const media = new Media(mediaData);
      await expect(media.save()).rejects.toThrow('File size cannot be negative');
    });

    it('should require mimetype', async () => {
      const mediaData = { ...validMediaData };
      delete mediaData.mimetype;

      const media = new Media(mediaData);
      await expect(media.save()).rejects.toThrow('MIME type is required');
    });

    it('should validate allowed mimetypes', async () => {
      const mediaData = { ...validMediaData };
      mediaData.mimetype = 'image/gif';

      const media = new Media(mediaData);
      await expect(media.save()).rejects.toThrow('Only JPEG, PNG, and WebP images are allowed');
    });

    it('should require width and height for images', async () => {
      const mediaData = { ...validMediaData };
      delete mediaData.width;
      delete mediaData.height;

      const media = new Media(mediaData);
      await expect(media.save()).rejects.toThrow('Width and height are required for images');
    });

    it('should validate width is positive integer', async () => {
      const mediaData = { ...validMediaData };
      mediaData.width = -100;

      const media = new Media(mediaData);
      await expect(media.save()).rejects.toThrow('Width must be positive');
    });

    it('should validate height is positive integer', async () => {
      const mediaData = { ...validMediaData };
      mediaData.height = 0;

      const media = new Media(mediaData);
      await expect(media.save()).rejects.toThrow('Height must be positive');
    });

    it('should require uploadedBy', async () => {
      const mediaData = { ...validMediaData };
      delete mediaData.uploadedBy;

      const media = new Media(mediaData);
      await expect(media.save()).rejects.toThrow('Uploader information is required');
    });

    it('should require at least one alt text', async () => {
      const mediaData = { ...validMediaData };
      mediaData.alt = {};

      const media = new Media(mediaData);
      await expect(media.save()).rejects.toThrow('At least one alt text (English or Arabic) is required');
    });

    it('should validate alt text length', async () => {
      const mediaData = { ...validMediaData };
      mediaData.alt.en = 'a'.repeat(201);

      const media = new Media(mediaData);
      await expect(media.save()).rejects.toThrow('English alt text cannot exceed 200 characters');
    });

    it('should validate variant URLs format', async () => {
      const mediaData = { ...validMediaData };
      mediaData.variants.thumbnail = 'https://invalid-url.com/image.jpg';

      const media = new Media(mediaData);
      await expect(media.save()).rejects.toThrow('Invalid thumbnail URL format');
    });
  });

  describe('Virtuals', () => {
    it('should calculate sizeFormatted correctly', async () => {
      const media = new Media(validMediaData);
      await media.save();

      expect(media.sizeFormatted).toBe('146.48 KB');
    });

    it('should calculate aspectRatio correctly', async () => {
      const media = new Media(validMediaData);
      await media.save();

      expect(media.aspectRatio).toBe('1.33');
    });

    it('should return null aspectRatio if dimensions missing', async () => {
      const mediaData = { ...validMediaData };
      delete mediaData.width;
      delete mediaData.height;
      // Remove mimetype validation for this test
      mediaData.mimetype = 'application/pdf';

      const media = new Media(mediaData);
      expect(media.aspectRatio).toBeNull();
    });
  });

  describe('Static Methods', () => {
    beforeEach(async () => {
      // Create test media
      const media1 = new Media({
        ...validMediaData,
        cloudinaryId: 'test-1',
        tags: ['product', 'perfume']
      });
      await media1.save();

      const media2 = new Media({
        ...validMediaData,
        cloudinaryId: 'test-2',
        filename: 'test-2.jpg',
        tags: ['hero', 'banner'],
        isActive: false
      });
      await media2.save();
    });

    describe('findByCloudinaryId', () => {
      it('should find active media by cloudinary ID', async () => {
        const media = await Media.findByCloudinaryId('test-1');
        expect(media).toBeTruthy();
        expect(media.cloudinaryId).toBe('test-1');
      });

      it('should not find inactive media', async () => {
        const media = await Media.findByCloudinaryId('test-2');
        expect(media).toBeNull();
      });

      it('should return null for non-existent ID', async () => {
        const media = await Media.findByCloudinaryId('non-existent');
        expect(media).toBeNull();
      });
    });

    describe('findByUploader', () => {
      it('should find media by uploader', async () => {
        const mediaList = await Media.findByUploader(testUser._id);
        expect(mediaList).toHaveLength(1);
        expect(mediaList[0].cloudinaryId).toBe('test-1');
      });

      it('should filter by mimetype', async () => {
        const mediaList = await Media.findByUploader(testUser._id, {
          mimetype: 'image/jpeg'
        });
        expect(mediaList).toHaveLength(1);
      });

      it('should filter by tags', async () => {
        const mediaList = await Media.findByUploader(testUser._id, {
          tags: ['product']
        });
        expect(mediaList).toHaveLength(1);
      });

      it('should respect limit and skip options', async () => {
        const mediaList = await Media.findByUploader(testUser._id, {
          limit: 0,
          skip: 1
        });
        expect(mediaList).toHaveLength(0);
      });
    });

    describe('searchMedia', () => {
      it('should search by filename', async () => {
        const results = await Media.searchMedia('test-image');
        expect(results).toHaveLength(1);
        expect(results[0].filename).toContain('test-image');
      });

      it('should search by alt text', async () => {
        const results = await Media.searchMedia('Test image');
        expect(results).toHaveLength(1);
      });

      it('should search by tags', async () => {
        const results = await Media.searchMedia('product');
        expect(results).toHaveLength(1);
      });

      it('should filter by mimetype', async () => {
        const results = await Media.searchMedia('', {
          mimetype: 'image/jpeg'
        });
        expect(results).toHaveLength(1);
      });

      it('should filter by uploader', async () => {
        const results = await Media.searchMedia('', {
          uploadedBy: testUser._id
        });
        expect(results).toHaveLength(1);
      });
    });
  });

  describe('Instance Methods', () => {
    let media;

    beforeEach(async () => {
      media = new Media(validMediaData);
      await media.save();
    });

    describe('incrementUsage', () => {
      it('should increment usage count', async () => {
        expect(media.usageCount).toBe(0);
        
        await media.incrementUsage();
        expect(media.usageCount).toBe(1);
        
        await media.incrementUsage();
        expect(media.usageCount).toBe(2);
      });
    });

    describe('addTags', () => {
      it('should add single tag', async () => {
        await media.addTags('new-tag');
        expect(media.tags).toContain('new-tag');
      });

      it('should add multiple tags', async () => {
        await media.addTags(['tag1', 'tag2']);
        expect(media.tags).toContain('tag1');
        expect(media.tags).toContain('tag2');
      });

      it('should not add duplicate tags', async () => {
        media.tags = ['existing-tag'];
        await media.addTags(['existing-tag', 'new-tag']);
        
        const tagCount = media.tags.filter(tag => tag === 'existing-tag').length;
        expect(tagCount).toBe(1);
        expect(media.tags).toContain('new-tag');
      });

      it('should normalize tags to lowercase', async () => {
        await media.addTags('UPPERCASE-TAG');
        expect(media.tags).toContain('uppercase-tag');
      });
    });

    describe('removeTags', () => {
      beforeEach(async () => {
        media.tags = ['tag1', 'tag2', 'tag3'];
        await media.save();
      });

      it('should remove single tag', async () => {
        await media.removeTags('tag1');
        expect(media.tags).not.toContain('tag1');
        expect(media.tags).toContain('tag2');
      });

      it('should remove multiple tags', async () => {
        await media.removeTags(['tag1', 'tag2']);
        expect(media.tags).not.toContain('tag1');
        expect(media.tags).not.toContain('tag2');
        expect(media.tags).toContain('tag3');
      });
    });

    describe('softDelete', () => {
      it('should set isActive to false', async () => {
        expect(media.isActive).toBe(true);
        
        await media.softDelete();
        expect(media.isActive).toBe(false);
      });
    });

    describe('getOptimizedUrl', () => {
      it('should return medium variant by default', () => {
        const url = media.getOptimizedUrl();
        expect(url).toBe(media.variants.medium);
      });

      it('should return specific size variant', () => {
        const url = media.getOptimizedUrl('thumbnail');
        expect(url).toBe(media.variants.thumbnail);
      });

      it('should return original URL for invalid size', () => {
        const url = media.getOptimizedUrl('invalid-size');
        expect(url).toBe(media.cloudinaryUrl);
      });

      it('should return original URL if variant not available', () => {
        media.variants.medium = null;
        const url = media.getOptimizedUrl('medium');
        expect(url).toBe(media.cloudinaryUrl);
      });
    });

    describe('updateAltText', () => {
      it('should update English alt text', async () => {
        await media.updateAltText({ en: 'New English description' });
        expect(media.alt.en).toBe('New English description');
      });

      it('should update Arabic alt text', async () => {
        await media.updateAltText({ ar: 'وصف عربي جديد' });
        expect(media.alt.ar).toBe('وصف عربي جديد');
      });

      it('should update both alt texts', async () => {
        await media.updateAltText({
          en: 'New English description',
          ar: 'وصف عربي جديد'
        });
        expect(media.alt.en).toBe('New English description');
        expect(media.alt.ar).toBe('وصف عربي جديد');
      });
    });
  });

  describe('Middleware', () => {
    it('should update updatedAt on save', async () => {
      const media = new Media(validMediaData);
      await media.save();
      
      const originalUpdatedAt = media.updatedAt;
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      media.filename = 'updated-filename.jpg';
      await media.save();
      
      expect(media.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Indexes', () => {
    it('should have proper indexes defined', () => {
      const indexes = Media.schema.indexes();
      
      // Check for cloudinaryId unique index
      const cloudinaryIdIndex = indexes.find(index => 
        index[0].cloudinaryId && index[1].unique
      );
      expect(cloudinaryIdIndex).toBeTruthy();
      
      // Check for uploadedBy index
      const uploadedByIndex = indexes.find(index => index[0].uploadedBy);
      expect(uploadedByIndex).toBeTruthy();
    });
  });
});