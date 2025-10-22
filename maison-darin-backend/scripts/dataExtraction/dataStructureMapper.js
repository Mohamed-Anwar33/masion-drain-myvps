/**
 * Data Structure Mapping and Analysis Script
 * 
 * This script analyzes the current frontend data structure and creates
 * mapping rules for converting to the backend database schema.
 * 
 * Requirements: 2.1, 2.6, 3.1, 4.1-4.5
 */

const fs = require('fs').promises;
const path = require('path');

class DataStructureMapper {
  constructor() {
    this.extractedDataPath = path.join(__dirname, '../extractedData');
    this.mappingRules = {
      products: {},
      content: {},
      images: {},
      categories: {}
    };
    this.schemaValidation = {
      products: [],
      content: [],
      images: []
    };
  }

  /**
   * Main mapping analysis method
   */
  async analyzeAndMap() {
    console.log('🗺️ Starting data structure mapping analysis...');
    
    try {
      // Load extracted data
      const extractedData = await this.loadExtractedData();
      
      // Create product mapping rules
      await this.createProductMappingRules(extractedData.products);
      
      // Create content mapping rules
      await this.createContentMappingRules(extractedData.translations);
      
      // Create image mapping rules
      await this.createImageMappingRules(extractedData.images);
      
      // Validate against backend schema
      await this.validateAgainstSchema(extractedData);
      
      // Generate mapping documentation
      await this.generateMappingDocumentation();
      
      console.log('✅ Data structure mapping completed successfully!');
      
    } catch (error) {
      console.error('❌ Error during mapping analysis:', error);
      throw error;
    }
  }

  /**
   * Load extracted data from previous step
   */
  async loadExtractedData() {
    console.log('📂 Loading extracted data...');
    
    try {
      const dataPath = path.join(this.extractedDataPath, 'extractedData.json');
      const dataContent = await fs.readFile(dataPath, 'utf8');
      return JSON.parse(dataContent);
    } catch (error) {
      throw new Error(`Could not load extracted data: ${error.message}`);
    }
  }

  /**
   * Create mapping rules for products
   */
  async createProductMappingRules(products) {
    console.log('📦 Creating product mapping rules...');
    
    // Analyze first product to understand structure
    const sampleProduct = products[0];
    
    this.mappingRules.products = {
      // Direct mappings
      directMappings: {
        'id': 'frontendId', // Store original ID for reference
        'name.en': 'name.en',
        'name.ar': 'name.ar',
        'description.en': 'description.en',
        'description.ar': 'description.ar',
        'longDescription.en': 'longDescription.en',
        'longDescription.ar': 'longDescription.ar',
        'price': 'price',
        'size': 'size',
        'category': 'category',
        'featured': 'featured',
        'inStock': 'inStock',
        'concentration.en': 'concentration.en',
        'concentration.ar': 'concentration.ar'
      },
      
      // Complex mappings that need transformation
      transformations: {
        images: {
          from: 'images[]', // Array of filenames
          to: 'images[]', // Array of image objects
          transformation: 'convertImageFilenameToImageObject',
          description: 'Convert image filenames to full image objects with Cloudinary URLs'
        },
        notes: {
          from: 'notes.{top,middle,base}.{en,ar}[]',
          to: 'notes.{top,middle,base}.{en,ar}[]',
          transformation: 'validateAndCleanNotes',
          description: 'Validate fragrance notes structure and clean data'
        },
        seo: {
          from: 'null', // Not present in frontend
          to: 'seo.{metaTitle,metaDescription}.{en,ar}',
          transformation: 'generateSeoFromProduct',
          description: 'Generate SEO metadata from product name and description'
        },
        stock: {
          from: 'inStock', // Boolean
          to: 'stock', // Number
          transformation: 'convertInStockToStockNumber',
          description: 'Convert boolean inStock to numeric stock quantity'
        }
      },
      
      // New fields to add
      newFields: {
        createdAt: 'new Date()',
        updatedAt: 'new Date()',
        version: '1',
        isActive: 'true'
      },
      
      // Validation rules
      validation: {
        required: ['name.en', 'name.ar', 'description.en', 'description.ar', 'price', 'category'],
        optional: ['longDescription', 'notes', 'images', 'seo'],
        constraints: {
          price: 'number > 0',
          category: 'enum: floral,oriental,fresh,woody,citrus,spicy,aquatic,gourmand',
          size: 'string, typically "100ml"'
        }
      }
    };
    
    console.log('✅ Product mapping rules created');
  }

  /**
   * Create mapping rules for content
   */
  async createContentMappingRules(translations) {
    console.log('🌐 Creating content mapping rules...');
    
    this.mappingRules.content = {
      // Section mappings
      sectionMappings: {
        'nav': {
          from: 'translations.{en,ar}.nav',
          to: 'Content{section: "nav"}',
          transformation: 'convertNavigationContent'
        },
        'hero': {
          from: 'translations.{en,ar}.hero',
          to: 'Content{section: "hero"}',
          transformation: 'convertHeroContent'
        },
        'about': {
          from: 'translations.{en,ar}.about',
          to: 'Content{section: "about"}',
          transformation: 'convertAboutContent'
        },
        'collections': {
          from: 'translations.{en,ar}.collections',
          to: 'Content{section: "collections"}',
          transformation: 'convertCollectionsContent'
        },
        'contact': {
          from: 'translations.{en,ar}.contact',
          to: 'Content{section: "contact"}',
          transformation: 'convertContactContent'
        }
      },
      
      // Content structure transformation
      transformations: {
        multilingualContent: {
          description: 'Convert flat translation structure to nested content structure',
          example: {
            from: 'translations.en.hero.title + translations.ar.hero.title',
            to: 'content.{en: {title: "..."}, ar: {title: "..."}}'
          }
        }
      },
      
      // New fields for content
      newFields: {
        version: '1',
        isActive: 'true',
        updatedBy: 'null', // Will be set when admin updates
        updatedAt: 'new Date()'
      }
    };
    
    console.log('✅ Content mapping rules created');
  }

  /**
   * Create mapping rules for images
   */
  async createImageMappingRules(images) {
    console.log('🖼️ Creating image mapping rules...');
    
    this.mappingRules.images = {
      // Direct mappings
      directMappings: {
        'filename': 'filename',
        'originalName': 'filename', // Same as filename for now
        'size': 'size',
        'mimetype': 'type'
      },
      
      // Cloudinary integration
      cloudinaryMappings: {
        'cloudinaryUrl': 'from_cloudinary_upload_result.secure_url',
        'cloudinaryId': 'from_cloudinary_upload_result.public_id',
        'width': 'from_cloudinary_upload_result.width',
        'height': 'from_cloudinary_upload_result.height'
      },
      
      // New fields
      newFields: {
        tags: '["maison-darin", "product"]',
        alt: '{en: "", ar: ""}', // To be filled manually or generated
        uploadedBy: 'null', // System upload
        uploadedAt: 'new Date()'
      },
      
      // Image optimization
      optimizations: {
        sizes: ['400x400', '800x800', '1200x1200'],
        formats: ['webp', 'jpg'],
        quality: 'auto'
      }
    };
    
    console.log('✅ Image mapping rules created');
  }

  /**
   * Validate extracted data against backend schema
   */
  async validateAgainstSchema(extractedData) {
    console.log('✅ Validating data against backend schema...');
    
    // Validate products
    for (const product of extractedData.products) {
      const validation = this.validateProduct(product);
      if (!validation.isValid) {
        this.schemaValidation.products.push({
          productId: product.id,
          productName: product.name.en,
          errors: validation.errors,
          warnings: validation.warnings
        });
      }
    }
    
    // Validate content structure
    const contentValidation = this.validateContent(extractedData.translations);
    if (!contentValidation.isValid) {
      this.schemaValidation.content.push({
        section: 'translations',
        errors: contentValidation.errors,
        warnings: contentValidation.warnings
      });
    }
    
    // Validate images
    for (const image of extractedData.images) {
      const validation = this.validateImage(image);
      if (!validation.isValid) {
        this.schemaValidation.images.push({
          filename: image.filename,
          errors: validation.errors,
          warnings: validation.warnings
        });
      }
    }
    
    console.log('✅ Schema validation completed');
  }

  /**
   * Validate individual product against schema
   */
  validateProduct(product) {
    const errors = [];
    const warnings = [];
    
    // Required fields
    if (!product.name?.en) errors.push('Missing name.en');
    if (!product.name?.ar) errors.push('Missing name.ar');
    if (!product.description?.en) errors.push('Missing description.en');
    if (!product.description?.ar) errors.push('Missing description.ar');
    if (!product.price || product.price <= 0) errors.push('Invalid price');
    if (!product.category) errors.push('Missing category');
    
    // Optional but recommended fields
    if (!product.longDescription?.en) warnings.push('Missing longDescription.en');
    if (!product.longDescription?.ar) warnings.push('Missing longDescription.ar');
    if (!product.notes) warnings.push('Missing fragrance notes');
    if (!product.images || product.images.length === 0) warnings.push('No images');
    
    // Data type validation
    if (typeof product.price !== 'number') errors.push('Price must be a number');
    if (typeof product.featured !== 'boolean') errors.push('Featured must be boolean');
    if (typeof product.inStock !== 'boolean') errors.push('InStock must be boolean');
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate content structure
   */
  validateContent(translations) {
    const errors = [];
    const warnings = [];
    
    // Check required languages
    if (!translations.en) errors.push('Missing English translations');
    if (!translations.ar) errors.push('Missing Arabic translations');
    
    // Check required sections
    const requiredSections = ['nav', 'hero', 'about', 'collections', 'contact'];
    for (const section of requiredSections) {
      if (!translations.en?.[section]) errors.push(`Missing English ${section} section`);
      if (!translations.ar?.[section]) errors.push(`Missing Arabic ${section} section`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate image data
   */
  validateImage(image) {
    const errors = [];
    const warnings = [];
    
    // Required fields
    if (!image.filename) errors.push('Missing filename');
    if (!image.size || image.size <= 0) errors.push('Invalid file size');
    
    // File type validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(image.type)) {
      warnings.push(`Unsupported image type: ${image.type}`);
    }
    
    // Size recommendations
    if (image.size > 5 * 1024 * 1024) { // 5MB
      warnings.push('Image size is quite large, consider optimization');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generate comprehensive mapping documentation
   */
  async generateMappingDocumentation() {
    console.log('📋 Generating mapping documentation...');
    
    const documentation = {
      generatedAt: new Date().toISOString(),
      overview: {
        purpose: 'Data structure mapping for Maison Darin website migration',
        sourceFormat: 'Frontend TypeScript data files',
        targetFormat: 'MongoDB documents via Mongoose schemas',
        totalMappings: {
          products: Object.keys(this.mappingRules.products.directMappings).length,
          content: Object.keys(this.mappingRules.content.sectionMappings).length,
          images: Object.keys(this.mappingRules.images.directMappings).length
        }
      },
      mappingRules: this.mappingRules,
      schemaValidation: {
        summary: {
          productsWithErrors: this.schemaValidation.products.length,
          contentWithErrors: this.schemaValidation.content.length,
          imagesWithErrors: this.schemaValidation.images.length
        },
        details: this.schemaValidation
      },
      migrationSteps: [
        {
          step: 1,
          title: 'Upload Images to Cloudinary',
          description: 'Upload all product images to Cloudinary and get URLs',
          script: 'cloudinaryImageUploader.js'
        },
        {
          step: 2,
          title: 'Transform Product Data',
          description: 'Convert frontend product data to backend schema format',
          script: 'productDataTransformer.js'
        },
        {
          step: 3,
          title: 'Transform Content Data',
          description: 'Convert translation data to content management format',
          script: 'contentDataTransformer.js'
        },
        {
          step: 4,
          title: 'Generate Seed Scripts',
          description: 'Create database seed scripts with transformed data',
          script: 'generateMigrationSeeds.js'
        },
        {
          step: 5,
          title: 'Validate Migration',
          description: 'Run validation tests on migrated data',
          script: 'validateMigration.js'
        }
      ],
      recommendations: [
        'Review all validation errors before proceeding with migration',
        'Test image uploads to Cloudinary in development environment first',
        'Backup existing seed data before replacing with migrated data',
        'Run comprehensive tests after migration to ensure data integrity',
        'Consider adding SEO metadata for all products during migration'
      ]
    };
    
    // Save documentation
    await fs.writeFile(
      path.join(this.extractedDataPath, 'dataMappingDocumentation.json'),
      JSON.stringify(documentation, null, 2)
    );
    
    // Generate human-readable summary
    const summary = this.generateHumanReadableSummary(documentation);
    await fs.writeFile(
      path.join(this.extractedDataPath, 'migrationSummary.md'),
      summary
    );
    
    console.log('✅ Mapping documentation generated');
    console.log('\n📊 MAPPING SUMMARY:');
    console.log(`   Product mappings: ${documentation.overview.totalMappings.products}`);
    console.log(`   Content sections: ${documentation.overview.totalMappings.content}`);
    console.log(`   Image mappings: ${documentation.overview.totalMappings.images}`);
    
    if (documentation.schemaValidation.summary.productsWithErrors > 0) {
      console.log(`\n⚠️  Products with validation issues: ${documentation.schemaValidation.summary.productsWithErrors}`);
    }
  }

  /**
   * Generate human-readable migration summary
   */
  generateHumanReadableSummary(documentation) {
    return `# Maison Darin Website Data Migration Summary

Generated: ${new Date().toLocaleString()}

## Overview

This document summarizes the data migration from the current Maison Darin frontend to the new backend system.

### Data Sources
- **Products**: ${documentation.overview.totalMappings.products} field mappings
- **Content**: ${documentation.overview.totalMappings.content} content sections
- **Images**: ${documentation.overview.totalMappings.images} image mappings

### Migration Steps

${documentation.migrationSteps.map(step => 
  `${step.step}. **${step.title}**\n   ${step.description}\n   Script: \`${step.script}\``
).join('\n\n')}

### Validation Results

${documentation.schemaValidation.summary.productsWithErrors === 0 
  ? '✅ All products passed validation' 
  : `⚠️ ${documentation.schemaValidation.summary.productsWithErrors} products have validation issues`}

${documentation.schemaValidation.summary.contentWithErrors === 0 
  ? '✅ All content passed validation' 
  : `⚠️ ${documentation.schemaValidation.summary.contentWithErrors} content sections have validation issues`}

${documentation.schemaValidation.summary.imagesWithErrors === 0 
  ? '✅ All images passed validation' 
  : `⚠️ ${documentation.schemaValidation.summary.imagesWithErrors} images have validation issues`}

### Recommendations

${documentation.recommendations.map(rec => `- ${rec}`).join('\n')}

### Next Steps

1. Review this summary and the detailed mapping documentation
2. Run the Cloudinary image upload script
3. Execute the data transformation scripts
4. Generate and run the database seed scripts
5. Validate the migrated data

For detailed technical information, see \`dataMappingDocumentation.json\`.
`;
  }
}

// Export for use in other scripts
module.exports = DataStructureMapper;

// Run mapping if called directly
if (require.main === module) {
  const mapper = new DataStructureMapper();
  mapper.analyzeAndMap()
    .then(() => {
      console.log('\n🎉 Data structure mapping completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Mapping analysis failed:', error);
      process.exit(1);
    });
}