/**
 * Content Data Transformer for Real Website Migration
 * 
 * This script converts extracted translation data from the frontend format
 * to the backend Content Management System format.
 * 
 * Requirements: 3.1-3.5
 */

const fs = require('fs').promises;
const path = require('path');

class ContentDataTransformer {
  constructor() {
    this.extractedDataPath = path.join(__dirname, '../extractedData');
    this.transformedContent = [];
    this.contentSections = ['nav', 'hero', 'about', 'collections', 'contact'];
  }

  /**
   * Main transformation method
   */
  async transformContentData() {
    console.log('🔄 Starting content data transformation...');
    
    try {
      // Load extracted data
      const extractedData = await this.loadExtractedData();
      
      // Transform each content section
      for (const section of this.contentSections) {
        const transformedSection = await this.transformContentSection(
          section, 
          extractedData.translations
        );
        this.transformedContent.push(transformedSection);
      }
      
      // Generate content seed data
      await this.generateContentSeedData();
      
      // Generate transformation report
      await this.generateTransformationReport();
      
      console.log('✅ Content data transformation completed successfully!');
      
    } catch (error) {
      console.error('❌ Error during content transformation:', error);
      throw error;
    }
  }

  /**
   * Load extracted data from previous step
   */
  async loadExtractedData() {
    console.log('📂 Loading extracted content data...');
    
    try {
      const dataPath = path.join(this.extractedDataPath, 'extractedData.json');
      const dataContent = await fs.readFile(dataPath, 'utf8');
      return JSON.parse(dataContent);
    } catch (error) {
      throw new Error(`Could not load extracted data: ${error.message}`);
    }
  }

  /**
   * Transform a single content section
   */
  async transformContentSection(sectionName, translations) {
    console.log(`🔄 Transforming content section: ${sectionName}`);
    
    const enContent = translations.en[sectionName];
    const arContent = translations.ar[sectionName];
    
    if (!enContent || !arContent) {
      throw new Error(`Missing content for section: ${sectionName}`);
    }
    
    const transformedSection = {
      section: sectionName,
      content: {
        en: this.transformSectionContent(enContent, sectionName),
        ar: this.transformSectionContent(arContent, sectionName)
      },
      version: 1,
      isActive: true,
      updatedBy: null, // System migration
      updatedAt: new Date(),
      createdAt: new Date()
    };
    
    return transformedSection;
  }

  /**
   * Transform section content based on section type
   */
  transformSectionContent(content, sectionName) {
    switch (sectionName) {
      case 'nav':
        return this.transformNavigationContent(content);
      case 'hero':
        return this.transformHeroContent(content);
      case 'about':
        return this.transformAboutContent(content);
      case 'collections':
        return this.transformCollectionsContent(content);
      case 'contact':
        return this.transformContactContent(content);
      default:
        return content; // Return as-is for unknown sections
    }
  }

  /**
   * Transform navigation content
   */
  transformNavigationContent(navContent) {
    return {
      type: 'navigation',
      items: [
        {
          key: 'home',
          label: navContent.home,
          href: '/',
          order: 1
        },
        {
          key: 'collections',
          label: navContent.collections,
          href: '/products',
          order: 2
        },
        {
          key: 'about',
          label: navContent.about,
          href: '/about',
          order: 3
        },
        {
          key: 'contact',
          label: navContent.contact,
          href: '/contact',
          order: 4
        }
      ]
    };
  }

  /**
   * Transform hero section content
   */
  transformHeroContent(heroContent) {
    return {
      title: heroContent.title,
      subtitle: heroContent.subtitle,
      buttonText: heroContent.cta.primary, // Required field for validation
      badge: heroContent.badge,
      cta: {
        primary: {
          text: heroContent.cta.primary,
          href: '/products',
          style: 'primary'
        },
        secondary: {
          text: heroContent.cta.secondary,
          href: '/contact',
          style: 'secondary'
        }
      },
      backgroundImage: {
        url: 'https://res.cloudinary.com/maison-darin/image/upload/v1725955200/maison-darin/products/hero-perfume.jpg',
        alt: 'Luxury perfume bottle'
      }
    };
  }

  /**
   * Transform about section content
   */
  transformAboutContent(aboutContent) {
    return {
      title: aboutContent.title,
      description: aboutContent.description, // Required field for validation
      subtitle: aboutContent.subtitle,
      legacy: aboutContent.legacy,
      values: [
        {
          key: 'craftsmanship',
          title: aboutContent.values.craftsmanship.title,
          description: aboutContent.values.craftsmanship.description,
          icon: 'craft',
          order: 1
        },
        {
          key: 'elegance',
          title: aboutContent.values.elegance.title,
          description: aboutContent.values.elegance.description,
          icon: 'elegance',
          order: 2
        },
        {
          key: 'exclusivity',
          title: aboutContent.values.exclusivity.title,
          description: aboutContent.values.exclusivity.description,
          icon: 'exclusive',
          order: 3
        }
      ]
    };
  }

  /**
   * Transform collections section content
   */
  transformCollectionsContent(collectionsContent) {
    return {
      title: collectionsContent.title,
      description: collectionsContent.subtitle, // Required field for validation
      subtitle: collectionsContent.subtitle,
      featuredItems: [
        {
          key: 'floral',
          name: collectionsContent.items.floral.name,
          description: collectionsContent.items.floral.description,
          category: 'floral',
          image: {
            url: 'https://res.cloudinary.com/maison-darin/image/upload/v1725955200/maison-darin/products/collection-1.jpg',
            alt: collectionsContent.items.floral.name
          },
          order: 1
        },
        {
          key: 'oriental',
          name: collectionsContent.items.oriental.name,
          description: collectionsContent.items.oriental.description,
          category: 'oriental',
          image: {
            url: 'https://res.cloudinary.com/maison-darin/image/upload/v1725955200/maison-darin/products/collection-2.jpg',
            alt: collectionsContent.items.oriental.name
          },
          order: 2
        },
        {
          key: 'fresh',
          name: collectionsContent.items.fresh.name,
          description: collectionsContent.items.fresh.description,
          category: 'fresh',
          image: {
            url: 'https://res.cloudinary.com/maison-darin/image/upload/v1725955200/maison-darin/products/collection-3.jpg',
            alt: collectionsContent.items.fresh.name
          },
          order: 3
        }
      ]
    };
  }

  /**
   * Transform contact section content
   */
  transformContactContent(contactContent) {
    return {
      title: contactContent.title,
      address: contactContent.address, // Required field for validation
      phone: contactContent.phone, // Required field for validation
      email: contactContent.email, // Required field for validation
      subtitle: contactContent.subtitle,
      cta: contactContent.cta,
      form: {
        fields: [
          {
            key: 'name',
            type: 'text',
            required: true,
            order: 1
          },
          {
            key: 'email',
            type: 'email',
            required: true,
            order: 2
          },
          {
            key: 'subject',
            type: 'text',
            required: false,
            order: 3
          },
          {
            key: 'message',
            type: 'textarea',
            required: true,
            order: 4
          }
        ]
      }
    };
  }

  /**
   * Generate content seed data for database
   */
  async generateContentSeedData() {
    console.log('🌱 Generating content seed data...');
    
    const seedData = {
      generatedAt: new Date().toISOString(),
      totalSections: this.transformedContent.length,
      sections: this.contentSections,
      content: this.transformedContent
    };
    
    // Generate JavaScript seed file
    const seedScript = this.generateContentSeedScript(seedData);
    
    // Save seed data
    await fs.writeFile(
      path.join(this.extractedDataPath, 'transformedContent.json'),
      JSON.stringify(seedData, null, 2)
    );
    
    await fs.writeFile(
      path.join(__dirname, '../seedData/realContent.js'),
      seedScript
    );
    
    console.log('✅ Content seed data generated');
  }

  /**
   * Generate JavaScript seed script for content
   */
  generateContentSeedScript(seedData) {
    return `/**
 * Real Content Data from Website Migration
 * Generated: ${seedData.generatedAt}
 * Total Sections: ${seedData.totalSections}
 */

const realContent = ${JSON.stringify(seedData.content, null, 2)};

module.exports = {
  content: realContent,
  metadata: {
    generatedAt: '${seedData.generatedAt}',
    totalSections: ${seedData.totalSections},
    sections: ${JSON.stringify(seedData.sections)},
    source: 'website-migration'
  }
};
`;
  }

  /**
   * Generate transformation report
   */
  async generateTransformationReport() {
    console.log('📋 Generating content transformation report...');
    
    const report = {
      transformationDate: new Date().toISOString(),
      summary: {
        totalSectionsTransformed: this.transformedContent.length,
        sectionsProcessed: this.contentSections,
        languages: ['en', 'ar'],
        contentTypes: [...new Set(this.transformedContent.map(c => c.content.en.type))]
      },
      sectionDetails: this.transformedContent.map(section => ({
        section: section.section,
        type: section.content.en.type,
        hasEnglish: !!section.content.en,
        hasArabic: !!section.content.ar,
        itemCount: this.getContentItemCount(section.content.en)
      })),
      dataQuality: {
        completeSections: this.transformedContent.filter(s => 
          s.content.en && s.content.ar
        ).length,
        sectionsWithStructure: this.transformedContent.filter(s => 
          s.content.en.type && s.content.ar.type
        ).length
      },
      recommendations: [
        'All content sections successfully transformed to CMS format',
        'Multilingual content structure maintained',
        'Navigation items properly structured with URLs',
        'Hero section includes CTA buttons and background image',
        'About section values organized with icons and order',
        'Collections section linked to product categories',
        'Contact section includes form field definitions'
      ]
    };
    
    await fs.writeFile(
      path.join(this.extractedDataPath, 'contentTransformationReport.json'),
      JSON.stringify(report, null, 2)
    );
    
    console.log('✅ Content transformation report generated');
    console.log('\n📊 CONTENT TRANSFORMATION SUMMARY:');
    console.log(`   Sections transformed: ${report.summary.totalSectionsTransformed}`);
    console.log(`   Languages: ${report.summary.languages.join(', ')}`);
    console.log(`   Content types: ${report.summary.contentTypes.join(', ')}`);
    console.log(`   Complete sections: ${report.dataQuality.completeSections}/${report.summary.totalSectionsTransformed}`);
  }

  /**
   * Get content item count for a section
   */
  getContentItemCount(content) {
    switch (content.type) {
      case 'navigation':
        return content.items?.length || 0;
      case 'about':
        return content.values?.length || 0;
      case 'collections':
        return content.featuredItems?.length || 0;
      case 'contact':
        return content.form?.fields?.length || 0;
      default:
        return 1; // Single content item
    }
  }
}

// Export for use in other scripts
module.exports = ContentDataTransformer;

// Run transformation if called directly
if (require.main === module) {
  const transformer = new ContentDataTransformer();
  transformer.transformContentData()
    .then(() => {
      console.log('\n🎉 Content data transformation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Content transformation failed:', error);
      process.exit(1);
    });
}