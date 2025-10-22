const contentService = require('../../services/contentService');

describe('Content Service Unit Tests', () => {
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

    it('should validate correct about content structure', () => {
      const contentData = {
        en: { title: 'About Us', description: 'We create luxury perfumes' },
        ar: { title: 'من نحن', description: 'نحن نصنع العطور الفاخرة' }
      };

      const result = contentService.validateContentStructure('about', contentData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate correct nav content structure', () => {
      const contentData = {
        en: { items: [{ label: 'Home', href: '/' }] },
        ar: { items: [{ label: 'الرئيسية', href: '/' }] }
      };

      const result = contentService.validateContentStructure('nav', contentData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate correct contact content structure', () => {
      const contentData = {
        en: {
          title: 'Contact Us',
          address: '123 Street',
          phone: '+123456789',
          email: 'test@example.com'
        },
        ar: {
          title: 'اتصل بنا',
          address: '123 شارع',
          phone: '+123456789',
          email: 'test@example.com'
        }
      };

      const result = contentService.validateContentStructure('contact', contentData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate correct collections content structure', () => {
      const contentData = {
        en: { title: 'Collections', description: 'Our collections' },
        ar: { title: 'المجموعات', description: 'مجموعاتنا' }
      };

      const result = contentService.validateContentStructure('collections', contentData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate correct footer content structure', () => {
      const contentData = {
        en: {
          copyright: '© 2024 Company',
          links: [{ label: 'Privacy', href: '/privacy' }]
        },
        ar: {
          copyright: '© 2024 الشركة',
          links: [{ label: 'الخصوصية', href: '/privacy' }]
        }
      };

      const result = contentService.validateContentStructure('footer', contentData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
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

    it('should reject undefined content data', () => {
      const result = contentService.validateContentStructure('hero', undefined);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Content data must be an object');
    });

    it('should reject non-object content data', () => {
      const result = contentService.validateContentStructure('hero', 'not an object');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Content data must be an object');
    });

    it('should reject invalid nav content without items array', () => {
      const contentData = {
        en: { title: 'Navigation' }, // Missing items array
        ar: { title: 'التنقل' }
      };

      const result = contentService.validateContentStructure('nav', contentData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid content structure for section: nav');
    });

    it('should reject invalid nav content with non-array items', () => {
      const contentData = {
        en: { items: 'not an array' },
        ar: { items: 'not an array' }
      };

      const result = contentService.validateContentStructure('nav', contentData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid content structure for section: nav');
    });

    it('should reject invalid about content missing description', () => {
      const contentData = {
        en: { title: 'About Us' }, // Missing description
        ar: { title: 'من نحن' }
      };

      const result = contentService.validateContentStructure('about', contentData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid content structure for section: about');
    });

    it('should reject invalid contact content missing required fields', () => {
      const contentData = {
        en: { title: 'Contact Us' }, // Missing address, phone, email
        ar: { title: 'اتصل بنا' }
      };

      const result = contentService.validateContentStructure('contact', contentData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid content structure for section: contact');
    });

    it('should reject invalid collections content missing description', () => {
      const contentData = {
        en: { title: 'Collections' }, // Missing description
        ar: { title: 'المجموعات' }
      };

      const result = contentService.validateContentStructure('collections', contentData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid content structure for section: collections');
    });

    it('should reject invalid footer content missing links', () => {
      const contentData = {
        en: { copyright: '© 2024 Company' }, // Missing links
        ar: { copyright: '© 2024 الشركة' }
      };

      const result = contentService.validateContentStructure('footer', contentData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid content structure for section: footer');
    });

    it('should handle validation errors gracefully', () => {
      // Test with content that would cause validation to fail
      const contentData = {
        en: { title: 'Test' }, // Missing required fields for hero
        ar: { title: 'اختبار' }
      };
      
      const result = contentService.validateContentStructure('hero', contentData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Invalid content structure for section: hero');
    });
  });

  describe('Error Handling', () => {
    it('should validate section names in update operations', async () => {
      const contentData = {
        en: { title: 'Test' },
        ar: { title: 'اختبار' }
      };

      await expect(
        contentService.updateContent('invalid-section', contentData, 'user123')
      ).rejects.toThrow('Invalid section: invalid-section');
    });

    it('should validate content data structure in update operations', async () => {
      await expect(
        contentService.updateContent('hero', null, 'user123')
      ).rejects.toThrow('Content data must be an object');
    });

    it('should validate required translations in update operations', async () => {
      const contentData = {
        en: { title: 'Test' }
        // Missing Arabic translation
      };

      await expect(
        contentService.updateContent('hero', contentData, 'user123')
      ).rejects.toThrow('Content must include both English (en) and Arabic (ar) translations');
    });
  });
});