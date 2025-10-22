const mongoose = require('mongoose');
const Content = require('../../models/Content');
const User = require('../../models/User');

describe('Content Model', () => {
  let testUser;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/maison-darin-test';
    await mongoose.connect(mongoUri);
  });

  beforeEach(async () => {
    await Content.deleteMany({});
    await User.deleteMany({});
    
    // Create test user
    testUser = await User.create({
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin'
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Schema Validation', () => {
    it('should create content with valid data', async () => {
      const contentData = {
        section: 'hero',
        content: {
          en: {
            title: 'Welcome to Maison Darin',
            subtitle: 'Luxury Perfumes',
            buttonText: 'Shop Now'
          },
          ar: {
            title: 'مرحباً بكم في ميزون دارين',
            subtitle: 'عطور فاخرة',
            buttonText: 'تسوق الآن'
          }
        },
        updatedBy: testUser._id
      };

      const content = await Content.create(contentData);
      expect(content.section).toBe('hero');
      expect(content.version).toBe(1);
      expect(content.isActive).toBe(true);
    });

    it('should require section field', async () => {
      const contentData = {
        content: {
          en: { title: 'Test' },
          ar: { title: 'اختبار' }
        },
        updatedBy: testUser._id
      };

      await expect(Content.create(contentData)).rejects.toThrow('Section is required');
    });

    it('should validate section enum values', async () => {
      const contentData = {
        section: 'invalid-section',
        content: {
          en: { title: 'Test' },
          ar: { title: 'اختبار' }
        },
        updatedBy: testUser._id
      };

      await expect(Content.create(contentData)).rejects.toThrow();
    });

    it('should require English content', async () => {
      const contentData = {
        section: 'hero',
        content: {
          ar: { title: 'اختبار' }
        },
        updatedBy: testUser._id
      };

      await expect(Content.create(contentData)).rejects.toThrow('English content is required');
    });

    it('should require Arabic content', async () => {
      const contentData = {
        section: 'hero',
        content: {
          en: { title: 'Test' }
        },
        updatedBy: testUser._id
      };

      await expect(Content.create(contentData)).rejects.toThrow('Arabic content is required');
    });

    it('should require updatedBy field', async () => {
      const contentData = {
        section: 'hero',
        content: {
          en: { title: 'Test' },
          ar: { title: 'اختبار' }
        }
      };

      await expect(Content.create(contentData)).rejects.toThrow('Updated by user is required');
    });
  });

  describe('Content Structure Validation', () => {
    it('should validate hero section structure', async () => {
      const validHeroContent = {
        section: 'hero',
        content: {
          en: {
            title: 'Welcome',
            subtitle: 'Luxury Perfumes',
            buttonText: 'Shop Now'
          },
          ar: {
            title: 'مرحباً',
            subtitle: 'عطور فاخرة',
            buttonText: 'تسوق الآن'
          }
        },
        updatedBy: testUser._id
      };

      const content = await Content.create(validHeroContent);
      expect(content.validateContentStructure()).toBe(true);
    });

    it('should reject invalid hero section structure', async () => {
      const invalidHeroContent = {
        section: 'hero',
        content: {
          en: { title: 'Welcome' }, // Missing subtitle and buttonText
          ar: { title: 'مرحباً' }
        },
        updatedBy: testUser._id
      };

      await expect(Content.create(invalidHeroContent)).rejects.toThrow('Invalid content structure');
    });

    it('should validate about section structure', async () => {
      const validAboutContent = {
        section: 'about',
        content: {
          en: {
            title: 'About Us',
            description: 'We create luxury perfumes'
          },
          ar: {
            title: 'من نحن',
            description: 'نحن نصنع العطور الفاخرة'
          }
        },
        updatedBy: testUser._id
      };

      const content = await Content.create(validAboutContent);
      expect(content.validateContentStructure()).toBe(true);
    });

    it('should validate nav section structure', async () => {
      const validNavContent = {
        section: 'nav',
        content: {
          en: {
            items: [
              { label: 'Home', href: '/' },
              { label: 'Products', href: '/products' }
            ]
          },
          ar: {
            items: [
              { label: 'الرئيسية', href: '/' },
              { label: 'المنتجات', href: '/products' }
            ]
          }
        },
        updatedBy: testUser._id
      };

      const content = await Content.create(validNavContent);
      expect(content.validateContentStructure()).toBe(true);
    });
  });

  describe('Versioning', () => {
    it('should increment version on content update', async () => {
      const content = await Content.create({
        section: 'hero',
        content: {
          en: { title: 'Original Title', subtitle: 'Subtitle', buttonText: 'Button' },
          ar: { title: 'العنوان الأصلي', subtitle: 'العنوان الفرعي', buttonText: 'زر' }
        },
        updatedBy: testUser._id
      });

      expect(content.version).toBe(1);

      // Update content
      content.content.en.title = 'Updated Title';
      await content.save();

      expect(content.version).toBe(2);
    });

    it('should not increment version if content is not modified', async () => {
      const content = await Content.create({
        section: 'hero',
        content: {
          en: { title: 'Title', subtitle: 'Subtitle', buttonText: 'Button' },
          ar: { title: 'العنوان', subtitle: 'العنوان الفرعي', buttonText: 'زر' }
        },
        updatedBy: testUser._id
      });

      const originalVersion = content.version;
      
      // Save without modifying content
      await content.save();

      expect(content.version).toBe(originalVersion);
    });
  });

  describe('Static Methods', () => {
    beforeEach(async () => {
      // Create multiple versions of hero content
      await Content.create({
        section: 'hero',
        content: {
          en: { title: 'Version 1', subtitle: 'Subtitle', buttonText: 'Button' },
          ar: { title: 'الإصدار 1', subtitle: 'العنوان الفرعي', buttonText: 'زر' }
        },
        version: 1,
        isActive: false,
        updatedBy: testUser._id
      });

      await Content.create({
        section: 'hero',
        content: {
          en: { title: 'Version 2', subtitle: 'Subtitle', buttonText: 'Button' },
          ar: { title: 'الإصدار 2', subtitle: 'العنوان الفرعي', buttonText: 'زر' }
        },
        version: 2,
        isActive: true,
        updatedBy: testUser._id
      });
    });

    it('should get latest active content by section', async () => {
      const latestContent = await Content.getLatestBySection('hero');
      
      expect(latestContent).toBeTruthy();
      expect(latestContent.version).toBe(2);
      expect(latestContent.isActive).toBe(true);
      expect(latestContent.content.en.title).toBe('Version 2');
    });

    it('should get content history for section', async () => {
      const history = await Content.getHistory('hero');
      
      expect(history).toHaveLength(2);
      expect(history[0].version).toBe(2); // Latest first
      expect(history[1].version).toBe(1);
    });

    it('should create new version and deactivate previous ones', async () => {
      const newContent = {
        en: { title: 'Version 3', subtitle: 'Subtitle', buttonText: 'Button' },
        ar: { title: 'الإصدار 3', subtitle: 'العنوان الفرعي', buttonText: 'زر' }
      };

      const createdContent = await Content.createVersion(
        'hero',
        newContent,
        testUser._id,
        'Updated to version 3'
      );

      expect(createdContent.version).toBe(1); // New document starts at version 1
      expect(createdContent.isActive).toBe(true);

      // Check that previous versions are deactivated
      const previousVersions = await Content.find({ 
        section: 'hero', 
        _id: { $ne: createdContent._id } 
      });
      
      previousVersions.forEach(version => {
        expect(version.isActive).toBe(false);
      });
    });
  });

  describe('Instance Methods', () => {
    it('should rollback to previous version', async () => {
      const originalContent = await Content.create({
        section: 'hero',
        content: {
          en: { title: 'Original', subtitle: 'Subtitle', buttonText: 'Button' },
          ar: { title: 'الأصلي', subtitle: 'العنوان الفرعي', buttonText: 'زر' }
        },
        updatedBy: testUser._id
      });

      // Create newer version
      await Content.createVersion(
        'hero',
        {
          en: { title: 'Updated', subtitle: 'Subtitle', buttonText: 'Button' },
          ar: { title: 'محدث', subtitle: 'العنوان الفرعي', buttonText: 'زر' }
        },
        testUser._id,
        'Updated content'
      );

      // Rollback to original
      const rolledBackContent = await originalContent.rollback(
        testUser._id,
        'Rolled back to original'
      );

      expect(rolledBackContent.content.en.title).toBe('Original');
      expect(rolledBackContent.isActive).toBe(true);
      expect(rolledBackContent.changeLog).toBe('Rolled back to original');

      // Verify latest content is now the rolled back version
      const latestContent = await Content.getLatestBySection('hero');
      expect(latestContent.content.en.title).toBe('Original');
    });
  });

  describe('Virtuals', () => {
    it('should format updated date as ISO string', async () => {
      const content = await Content.create({
        section: 'hero',
        content: {
          en: { title: 'Test', subtitle: 'Subtitle', buttonText: 'Button' },
          ar: { title: 'اختبار', subtitle: 'العنوان الفرعي', buttonText: 'زر' }
        },
        updatedBy: testUser._id
      });

      expect(content.formattedUpdatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });
});