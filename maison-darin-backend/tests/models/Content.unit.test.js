const mongoose = require('mongoose');
const Content = require('../../models/Content');

describe('Content Model Unit Tests', () => {
  describe('Content Structure Validation', () => {
    let mockContent;

    beforeEach(() => {
      // Create a proper Content instance with the schema methods
      mockContent = new Content({
        section: 'hero',
        content: {
          en: {},
          ar: {}
        },
        updatedBy: new mongoose.Types.ObjectId()
      });
    });

    describe('Hero Section Validation', () => {
      it('should validate complete hero content structure', () => {
        mockContent.section = 'hero';
        mockContent.content = {
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
        };

        expect(mockContent.validateContentStructure()).toBe(true);
      });

      it('should reject hero content missing required fields', () => {
        mockContent.section = 'hero';
        mockContent.content = {
          en: {
            title: 'Welcome'
            // Missing subtitle and buttonText
          },
          ar: {
            title: 'مرحباً'
            // Missing subtitle and buttonText
          }
        };

        expect(mockContent.validateContentStructure()).toBe(false);
      });

      it('should reject hero content with partial language support', () => {
        mockContent.section = 'hero';
        mockContent.content = {
          en: {
            title: 'Welcome',
            subtitle: 'Luxury Perfumes',
            buttonText: 'Shop Now'
          },
          ar: {
            title: 'مرحباً'
            // Missing subtitle and buttonText in Arabic
          }
        };

        expect(mockContent.validateContentStructure()).toBe(false);
      });
    });

    describe('About Section Validation', () => {
      it('should validate complete about content structure', () => {
        mockContent.section = 'about';
        mockContent.content = {
          en: {
            title: 'About Maison Darin',
            description: 'We create exceptional luxury perfumes'
          },
          ar: {
            title: 'حول ميزون دارين',
            description: 'نحن نصنع عطور فاخرة استثنائية'
          }
        };

        expect(mockContent.validateContentStructure()).toBe(true);
      });

      it('should reject about content missing required fields', () => {
        mockContent.section = 'about';
        mockContent.content = {
          en: {
            title: 'About Us'
            // Missing description
          },
          ar: {
            title: 'من نحن'
            // Missing description
          }
        };

        expect(mockContent.validateContentStructure()).toBe(false);
      });
    });

    describe('Navigation Section Validation', () => {
      it('should validate complete nav content structure', () => {
        mockContent.section = 'nav';
        mockContent.content = {
          en: {
            items: [
              { label: 'Home', href: '/' },
              { label: 'Products', href: '/products' },
              { label: 'About', href: '/about' }
            ]
          },
          ar: {
            items: [
              { label: 'الرئيسية', href: '/' },
              { label: 'المنتجات', href: '/products' },
              { label: 'من نحن', href: '/about' }
            ]
          }
        };

        expect(mockContent.validateContentStructure()).toBe(true);
      });

      it('should reject nav content without items array', () => {
        mockContent.section = 'nav';
        mockContent.content = {
          en: {
            // Missing items array
          },
          ar: {
            // Missing items array
          }
        };

        expect(mockContent.validateContentStructure()).toBe(false);
      });

      it('should reject nav content with non-array items', () => {
        mockContent.section = 'nav';
        mockContent.content = {
          en: {
            items: 'not an array'
          },
          ar: {
            items: 'not an array'
          }
        };

        expect(mockContent.validateContentStructure()).toBe(false);
      });
    });

    describe('Contact Section Validation', () => {
      it('should validate complete contact content structure', () => {
        mockContent.section = 'contact';
        mockContent.content = {
          en: {
            title: 'Contact Us',
            address: '123 Luxury Street, Dubai, UAE',
            phone: '+971 4 123 4567',
            email: 'info@maisondarin.com'
          },
          ar: {
            title: 'اتصل بنا',
            address: '123 شارع الفخامة، دبي، الإمارات العربية المتحدة',
            phone: '+971 4 123 4567',
            email: 'info@maisondarin.com'
          }
        };

        expect(mockContent.validateContentStructure()).toBe(true);
      });

      it('should reject contact content missing required fields', () => {
        mockContent.section = 'contact';
        mockContent.content = {
          en: {
            title: 'Contact Us'
            // Missing address, phone, email
          },
          ar: {
            title: 'اتصل بنا'
            // Missing address, phone, email
          }
        };

        expect(mockContent.validateContentStructure()).toBe(false);
      });
    });

    describe('Collections Section Validation', () => {
      it('should validate complete collections content structure', () => {
        mockContent.section = 'collections';
        mockContent.content = {
          en: {
            title: 'Our Collections',
            description: 'Discover our exquisite perfume collections'
          },
          ar: {
            title: 'مجموعاتنا',
            description: 'اكتشف مجموعات العطور الرائعة لدينا'
          }
        };

        expect(mockContent.validateContentStructure()).toBe(true);
      });

      it('should reject collections content missing required fields', () => {
        mockContent.section = 'collections';
        mockContent.content = {
          en: {
            title: 'Our Collections'
            // Missing description
          },
          ar: {
            title: 'مجموعاتنا'
            // Missing description
          }
        };

        expect(mockContent.validateContentStructure()).toBe(false);
      });
    });

    describe('Footer Section Validation', () => {
      it('should validate complete footer content structure', () => {
        mockContent.section = 'footer';
        mockContent.content = {
          en: {
            copyright: '© 2024 Maison Darin. All rights reserved.',
            links: [
              { label: 'Privacy Policy', href: '/privacy' },
              { label: 'Terms of Service', href: '/terms' }
            ]
          },
          ar: {
            copyright: '© 2024 ميزون دارين. جميع الحقوق محفوظة.',
            links: [
              { label: 'سياسة الخصوصية', href: '/privacy' },
              { label: 'شروط الخدمة', href: '/terms' }
            ]
          }
        };

        expect(mockContent.validateContentStructure()).toBe(true);
      });

      it('should reject footer content missing required fields', () => {
        mockContent.section = 'footer';
        mockContent.content = {
          en: {
            copyright: '© 2024 Maison Darin'
            // Missing links
          },
          ar: {
            copyright: '© 2024 ميزون دارين'
            // Missing links
          }
        };

        expect(mockContent.validateContentStructure()).toBe(false);
      });
    });

    describe('Unknown Section Validation', () => {
      it('should return true for unknown sections (no validation)', () => {
        mockContent.section = 'unknown';
        mockContent.content = {
          en: { anything: 'goes' },
          ar: { anything: 'goes' }
        };

        expect(mockContent.validateContentStructure()).toBe(true);
      });
    });
  });

  describe('Schema Validation Rules', () => {
    it('should have correct enum values for section', () => {
      const sectionEnum = Content.schema.paths.section.enumValues;
      const expectedSections = ['hero', 'about', 'nav', 'contact', 'collections', 'footer'];
      
      expect(sectionEnum).toEqual(expectedSections);
    });

    it('should have required validation for section', () => {
      const sectionPath = Content.schema.paths.section;
      expect(sectionPath.isRequired).toBe(true);
    });

    it('should have required validation for English content', () => {
      const enContentPath = Content.schema.paths['content.en'];
      expect(enContentPath.isRequired).toBe(true);
    });

    it('should have required validation for Arabic content', () => {
      const arContentPath = Content.schema.paths['content.ar'];
      expect(arContentPath.isRequired).toBe(true);
    });

    it('should have required validation for updatedBy', () => {
      const updatedByPath = Content.schema.paths.updatedBy;
      expect(updatedByPath.isRequired).toBe(true);
    });

    it('should have default values set correctly', () => {
      const versionPath = Content.schema.paths.version;
      const isActivePath = Content.schema.paths.isActive;
      
      expect(versionPath.defaultValue).toBe(1);
      expect(isActivePath.defaultValue).toBe(true);
    });

    it('should have minimum value validation for version', () => {
      const versionPath = Content.schema.paths.version;
      expect(versionPath.options.min[0]).toBe(1);
    });

    it('should have maximum length validation for changeLog', () => {
      const changeLogPath = Content.schema.paths.changeLog;
      expect(changeLogPath.options.maxlength[0]).toBe(500);
    });
  });

  describe('Indexes', () => {
    it('should have proper indexes defined', () => {
      const indexes = Content.schema.indexes();
      
      // Check for compound indexes
      const sectionActiveIndex = indexes.find(index => 
        index[0].section === 1 && index[0].isActive === 1
      );
      const sectionVersionIndex = indexes.find(index => 
        index[0].section === 1 && index[0].version === -1
      );
      
      expect(sectionActiveIndex).toBeTruthy();
      expect(sectionVersionIndex).toBeTruthy();
    });
  });
});