const mongoose = require('mongoose');
const contentService = require('../../services/contentService');
const Content = require('../../models/Content');
const User = require('../../models/User');

describe('Content Service', () => {
  let testUser;
  let testContent;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/maison-darin-test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
  });

  beforeEach(async () => {
    // Clear collections
    await Content.deleteMany({});
    await User.deleteMany({});
    
    // Create test user
    testUser = await User.create({
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin'
    });

    // Create test content
    testContent = await Content.create({
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
    });
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  describe('getContent', () => {
    it('should get content by section without language filter', async () => {
      const content = await contentService.getContent('hero');
      
      expect(content).toBeTruthy();
      expect(content.section).toBe('hero');
      expect(content.content.en.title).toBe('Welcome to Maison Darin');
      expect(content.content.ar.title).toBe('مرحباً بكم في ميزون دارين');
      expect(content.version).toBe(1);
    });

    it('should get content by section with English language filter', async () => {
      const content = await contentService.getContent('hero', 'en');
      
      expect(content).toBeTruthy();
      expect(content.section).toBe('hero');
      expect(content.content.en.title).toBe('Welcome to Maison Darin');
      expect(content.content.ar).toBeUndefined();
      expect(content.hasFallback).toBe(false);
    });

    it('should get content by section with Arabic language filter', async () => {
      const content = await contentService.getContent('hero', 'ar');
      
      expect(content).toBeTruthy();
      expect(content.section).toBe('hero');
      expect(content.content.ar.title).toBe('مرحباً بكم في ميزون دارين');
      expect(content.content.en).toBeUndefined();
      expect(content.hasFallback).toBe(false);
    });

    it('should return null for non-existent section', async () => {
      const content = await contentService.getContent('nonexistent');
      expect(content).toBeNull();
    });

    it('should provide fallback when requested language is missing', async () => {
      // Create content with only English
      await Content.create({
        section: 'about',
        content: {
          en: {
            title: 'About Us',
            description: 'We create luxury perfumes'
          },
          ar: {} // Empty Arabic content
        },
        updatedBy: testUser._id
      });

      const content = await contentService.getContent('about', 'ar');
      
      expect(content).toBeTruthy();
      expect(content.hasFallback).toBe(true);
      expect(content.content.ar.title).toBe('About Us'); // Fallback to English
    });
  });

  describe('getAllContent', () => {
    beforeEach(async () => {
      // Create content for multiple sections
      await Content.create({
        section: 'about',
        content: {
          en: { title: 'About Us', description: 'We create luxury perfumes' },
          ar: { title: 'من نحن', description: 'نحن نصنع العطور الفاخرة' }
        },
        updatedBy: testUser._id
      });

      await Content.create({
        section: 'nav',
        content: {
          en: { items: [{ label: 'Home', href: '/' }] },
          ar: { items: [{ label: 'الرئيسية', href: '/' }] }
        },
        updatedBy: testUser._id
      });
    });

    it('should get all content sections', async () => {
      const allContent = await contentService.getAllContent();
      
      expect(Object.keys(allContent)).toContain('hero');
      expect(Object.keys(allContent)).toContain('about');
      expect(Object.keys(allContent)).toContain('nav');
      expect(allContent.hero.content.en.title).toBe('Welcome to Maison Darin');
      expect(allContent.about.content.en.title).toBe('About Us');
    });

    it('should get all content sections with language filter', async () => {
      const allContent = await contentService.getAllContent('en');
      
      expect(allContent.hero.content.en.title).toBe('Welcome to Maison Darin');
      expect(allContent.hero.content.ar).toBeUndefined();
    });
  });

  describe('updateContent', () => {
    it('should update content successfully', async () => {
      const newContent = {
        en: {
          title: 'Updated Welcome',
          subtitle: 'Premium Fragrances',
          buttonText: 'Explore Now'
        },
        ar: {
          title: 'مرحباً محدث',
          subtitle: 'عطور متميزة',
          buttonText: 'استكشف الآن'
        }
      };

      const updatedContent = await contentService.updateContent(
        'hero',
        newContent,
        testUser._id,
        'Updated hero content'
      );

      expect(updatedContent.section).toBe('hero');
      expect(updatedContent.content.en.title).toBe('Updated Welcome');
      expect(updatedContent.content.ar.title).toBe('مرحباً محدث');
      expect(updatedContent.changeLog).toBe('Updated hero content');
      expect(updatedContent.version).toBe(1); // New document starts at version 1
    });

    it('should reject invalid section', async () => {
      const newContent = {
        en: { title: 'Test' },
        ar: { title: 'اختبار' }
      };

      await expect(
        contentService.updateContent('invalid-section', newContent, testUser._id)
      ).rejects.toThrow('Invalid section: invalid-section');
    });

    it('should reject content without English translation', async () => {
      const newContent = {
        ar: { title: 'اختبار' }
      };

      await expect(
        contentService.updateContent('hero', newContent, testUser._id)
      ).rejects.toThrow('Content must include both English (en) and Arabic (ar) translations');
    });

    it('should reject content without Arabic translation', async () => {
      const newContent = {
        en: { title: 'Test' }
      };

      await expect(
        contentService.updateContent('hero', newContent, testUser._id)
      ).rejects.toThrow('Content must include both English (en) and Arabic (ar) translations');
    });

    it('should reject invalid content structure for hero section', async () => {
      const newContent = {
        en: { title: 'Test' }, // Missing subtitle and buttonText
        ar: { title: 'اختبار' }
      };

      await expect(
        contentService.updateContent('hero', newContent, testUser._id)
      ).rejects.toThrow('Invalid content structure for section: hero');
    });
  });

  describe('getContentHistory', () => {
    beforeEach(async () => {
      // Create multiple versions
      await contentService.updateContent(
        'hero',
        {
          en: { title: 'Version 2', subtitle: 'Subtitle', buttonText: 'Button' },
          ar: { title: 'الإصدار 2', subtitle: 'العنوان الفرعي', buttonText: 'زر' }
        },
        testUser._id,
        'Second version'
      );

      await contentService.updateContent(
        'hero',
        {
          en: { title: 'Version 3', subtitle: 'Subtitle', buttonText: 'Button' },
          ar: { title: 'الإصدار 3', subtitle: 'العنوان الفرعي', buttonText: 'زر' }
        },
        testUser._id,
        'Third version'
      );
    });

    it('should get content history for section', async () => {
      const history = await contentService.getContentHistory('hero');
      
      expect(history).toHaveLength(3); // Original + 2 updates
      expect(history[0].changeLog).toBe('Third version'); // Latest first
      expect(history[1].changeLog).toBe('Second version');
      expect(history[2].changeLog).toBeUndefined(); // Original has no changeLog
    });

    it('should limit content history results', async () => {
      const history = await contentService.getContentHistory('hero', 2);
      
      expect(history).toHaveLength(2);
    });

    it('should return empty array for non-existent section', async () => {
      const history = await contentService.getContentHistory('nonexistent');
      
      expect(history).toHaveLength(0);
    });
  });

  describe('rollbackContent', () => {
    let secondVersion;

    beforeEach(async () => {
      // Create a second version
      secondVersion = await contentService.updateContent(
        'hero',
        {
          en: { title: 'Version 2', subtitle: 'Subtitle', buttonText: 'Button' },
          ar: { title: 'الإصدار 2', subtitle: 'العنوان الفرعي', buttonText: 'زر' }
        },
        testUser._id,
        'Second version'
      );

      // Create a third version
      await contentService.updateContent(
        'hero',
        {
          en: { title: 'Version 3', subtitle: 'Subtitle', buttonText: 'Button' },
          ar: { title: 'الإصدار 3', subtitle: 'العنوان الفرعي', buttonText: 'زر' }
        },
        testUser._id,
        'Third version'
      );
    });

    it('should rollback to previous version', async () => {
      const rolledBack = await contentService.rollbackContent(
        'hero',
        secondVersion.id,
        testUser._id,
        'Rolled back to version 2'
      );

      expect(rolledBack.content.en.title).toBe('Version 2');
      expect(rolledBack.changeLog).toBe('Rolled back to version 2');
      
      // Verify it's now the active version
      const currentContent = await contentService.getContent('hero');
      expect(currentContent.content.en.title).toBe('Version 2');
    });

    it('should reject rollback to non-existent version', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      await expect(
        contentService.rollbackContent('hero', fakeId.toString(), testUser._id)
      ).rejects.toThrow(`Version not found: ${fakeId}`);
    });

    it('should reject rollback to version from different section', async () => {
      // Create content in different section
      const aboutContent = await contentService.updateContent(
        'about',
        {
          en: { title: 'About', description: 'Description' },
          ar: { title: 'حول', description: 'وصف' }
        },
        testUser._id
      );

      await expect(
        contentService.rollbackContent('hero', aboutContent.id, testUser._id)
      ).rejects.toThrow(`Version ${aboutContent.id} does not belong to section hero`);
    });
  });

  describe('validateContentStructure', () => {
    it('should validate correct hero content structure', () => {
      const contentData = {
        en: { title: 'Title', subtitle: 'Subtitle', buttonText: 'Button' },
        ar: { title: 'العنوان', subtitle: 'العنوان الفرعي', buttonText: 'زر' }
      };

      const result = contentService.validateContentStructure('hero', contentData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid hero content structure', () => {
      const contentData = {
        en: { title: 'Title' }, // Missing subtitle and buttonText
        ar: { title: 'العنوان' }
      };

      const result = contentService.validateContentStructure('hero', contentData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid content structure for section: hero');
    });

    it('should reject content without English translation', () => {
      const contentData = {
        ar: { title: 'العنوان' }
      };

      const result = contentService.validateContentStructure('hero', contentData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('English (en) content is required');
    });

    it('should reject content without Arabic translation', () => {
      const contentData = {
        en: { title: 'Title' }
      };

      const result = contentService.validateContentStructure('hero', contentData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Arabic (ar) content is required');
    });

    it('should reject null content data', () => {
      const result = contentService.validateContentStructure('hero', null);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Content data must be an object');
    });
  });

  describe('getContentWithFallback', () => {
    beforeEach(async () => {
      // Create content with missing Arabic translation
      await Content.create({
        section: 'about',
        content: {
          en: { title: 'About Us', description: 'We create luxury perfumes' },
          ar: {} // Empty Arabic content
        },
        updatedBy: testUser._id
      });
    });

    it('should return preferred language when available', async () => {
      const content = await contentService.getContentWithFallback('hero', 'en', 'ar');
      
      expect(content.language).toBe('en');
      expect(content.usedFallback).toBe(false);
      expect(content.content.title).toBe('Welcome to Maison Darin');
    });

    it('should fallback to alternative language when preferred is not available', async () => {
      const content = await contentService.getContentWithFallback('about', 'ar', 'en');
      
      expect(content.language).toBe('en');
      expect(content.usedFallback).toBe(true);
      expect(content.content.title).toBe('About Us');
    });

    it('should return null for non-existent section', async () => {
      const content = await contentService.getContentWithFallback('nonexistent', 'en', 'ar');
      
      expect(content).toBeNull();
    });
  });

  describe('bulkUpdateContent', () => {
    it('should update multiple sections successfully', async () => {
      const contentUpdates = {
        hero: {
          en: { title: 'New Hero', subtitle: 'Subtitle', buttonText: 'Button' },
          ar: { title: 'بطل جديد', subtitle: 'العنوان الفرعي', buttonText: 'زر' }
        },
        about: {
          en: { title: 'New About', description: 'Description' },
          ar: { title: 'حول جديد', description: 'وصف' }
        }
      };

      const results = await contentService.bulkUpdateContent(
        contentUpdates,
        testUser._id,
        'Bulk update test'
      );

      expect(results.successful).toHaveLength(2);
      expect(results.failed).toHaveLength(0);
      expect(results.successful[0].section).toBe('hero');
      expect(results.successful[1].section).toBe('about');
    });

    it('should handle partial failures in bulk update', async () => {
      const contentUpdates = {
        hero: {
          en: { title: 'New Hero', subtitle: 'Subtitle', buttonText: 'Button' },
          ar: { title: 'بطل جديد', subtitle: 'العنوان الفرعي', buttonText: 'زر' }
        },
        invalid: {
          en: { title: 'Invalid' },
          ar: { title: 'غير صالح' }
        }
      };

      const results = await contentService.bulkUpdateContent(
        contentUpdates,
        testUser._id,
        'Bulk update with failure'
      );

      expect(results.successful).toHaveLength(1);
      expect(results.failed).toHaveLength(1);
      expect(results.successful[0].section).toBe('hero');
      expect(results.failed[0].section).toBe('invalid');
      expect(results.failed[0].error).toContain('Invalid section: invalid');
    });
  });
});