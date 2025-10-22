/**
 * Migration Validator for Real Product Data Migration
 * 
 * This script validates that the real product data migration was successful
 * by checking database integrity, image availability, and data completeness.
 * 
 * Requirements: 2.1-2.6, 4.1-4.5
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const Product = require('../../models/Product');
const realProductData = require('../seedData/realProducts');

class MigrationValidator {
  constructor() {
    this.validationResults = {
      database: {},
      images: {},
      content: {},
      multilingual: {},
      seo: {},
      overall: {}
    };
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Main validation method
   */
  async validateMigration() {
    console.log('🔍 Starting migration validation...');
    
    try {
      // Connect to database
      await this.connectToDatabase();
      
      // Run all validation checks
      await this.validateDatabaseIntegrity();
      await this.validateImageIntegration();
      await this.validateContentCompleteness();
      await this.validateMultilingualSupport();
      await this.validateSeoMetadata();
      
      // Generate validation report
      await this.generateValidationReport();
      
      // Display results
      this.displayValidationResults();
      
      console.log('✅ Migration validation completed successfully!');
      
    } catch (error) {
      console.error('❌ Error during migration validation:', error);
      throw error;
    } finally {
      await mongoose.connection.close();
    }
  }

  /**
   * Connect to database
   */
  async connectToDatabase() {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/maison-darin';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB for validation');
  }

  /**
   * Validate database integrity
   */
  async validateDatabaseIntegrity() {
    console.log('🔍 Validating database integrity...');
    
    const totalProducts = await Product.countDocuments();
    const expectedProducts = realProductData.products.length;
    
    this.validationResults.database = {
      totalProducts,
      expectedProducts,
      migrationComplete: totalProducts === expectedProducts,
      featuredProducts: await Product.countDocuments({ featured: true }),
      inStockProducts: await Product.countDocuments({ inStock: true }),
      outOfStockProducts: await Product.countDocuments({ inStock: false }),
      categories: await Product.distinct('category')
    };
    
    if (totalProducts !== expectedProducts) {
      this.errors.push(`Database contains ${totalProducts} products, expected ${expectedProducts}`);
    }
    
    // Validate each product exists and has required fields
    for (const originalProduct of realProductData.products) {
      const dbProduct = await Product.findOne({ frontendId: originalProduct.frontendId });
      
      if (!dbProduct) {
        this.errors.push(`Product ${originalProduct.name.en} not found in database`);
        continue;
      }
      
      // Validate required fields
      const requiredFields = ['name.en', 'name.ar', 'description.en', 'description.ar', 'price', 'category'];
      for (const field of requiredFields) {
        const fieldValue = this.getNestedValue(dbProduct, field);
        if (!fieldValue) {
          this.errors.push(`Product ${dbProduct.name.en} missing required field: ${field}`);
        }
      }
    }
    
    console.log('✅ Database integrity validation completed');
  }

  /**
   * Validate image integration with Cloudinary
   */
  async validateImageIntegration() {
    console.log('🔍 Validating image integration...');
    
    const products = await Product.find({});
    let totalImages = 0;
    let cloudinaryImages = 0;
    let imagesWithOptimization = 0;
    let imagesWithAltText = 0;
    
    for (const product of products) {
      for (const image of product.images) {
        totalImages++;
        
        if (image.cloudinaryId) {
          cloudinaryImages++;
        }
        
        if (image.optimizedUrls) {
          imagesWithOptimization++;
        }
        
        if (image.alt && image.alt.en && image.alt.ar) {
          imagesWithAltText++;
        }
      }
    }
    
    this.validationResults.images = {
      totalImages,
      cloudinaryImages,
      imagesWithOptimization,
      imagesWithAltText,
      cloudinaryIntegrationRate: (cloudinaryImages / totalImages * 100).toFixed(1),
      optimizationRate: (imagesWithOptimization / totalImages * 100).toFixed(1),
      altTextCompleteness: (imagesWithAltText / totalImages * 100).toFixed(1)
    };
    
    if (cloudinaryImages === 0) {
      this.errors.push('No images are integrated with Cloudinary');
    } else if (cloudinaryImages < totalImages) {
      this.warnings.push(`Only ${cloudinaryImages}/${totalImages} images are integrated with Cloudinary`);
    }
    
    console.log('✅ Image integration validation completed');
  }

  /**
   * Validate content completeness
   */
  async validateContentCompleteness() {
    console.log('🔍 Validating content completeness...');
    
    const products = await Product.find({});
    let productsWithLongDescription = 0;
    let productsWithFragranceNotes = 0;
    let productsWithConcentration = 0;
    
    for (const product of products) {
      if (product.longDescription && product.longDescription.en && product.longDescription.ar) {
        productsWithLongDescription++;
      }
      
      if (product.concentration && product.concentration.en && product.concentration.ar) {
        productsWithConcentration++;
      }
      
      if (product.notes && 
          (product.notes.top.en.length > 0 || product.notes.middle.en.length > 0 || product.notes.base.en.length > 0)) {
        productsWithFragranceNotes++;
      }
    }
    
    this.validationResults.content = {
      totalProducts: products.length,
      productsWithLongDescription,
      productsWithFragranceNotes,
      productsWithConcentration,
      longDescriptionCompleteness: (productsWithLongDescription / products.length * 100).toFixed(1),
      fragranceNotesCompleteness: (productsWithFragranceNotes / products.length * 100).toFixed(1),
      concentrationCompleteness: (productsWithConcentration / products.length * 100).toFixed(1)
    };
    
    console.log('✅ Content completeness validation completed');
  }

  /**
   * Validate multilingual support
   */
  async validateMultilingualSupport() {
    console.log('🔍 Validating multilingual support...');
    
    const products = await Product.find({});
    let englishComplete = 0;
    let arabicComplete = 0;
    let bothLanguagesComplete = 0;
    
    for (const product of products) {
      const hasEnglish = product.name.en && product.description.en;
      const hasArabic = product.name.ar && product.description.ar;
      
      if (hasEnglish) englishComplete++;
      if (hasArabic) arabicComplete++;
      if (hasEnglish && hasArabic) bothLanguagesComplete++;
    }
    
    this.validationResults.multilingual = {
      totalProducts: products.length,
      englishComplete,
      arabicComplete,
      bothLanguagesComplete,
      englishCompleteness: (englishComplete / products.length * 100).toFixed(1),
      arabicCompleteness: (arabicComplete / products.length * 100).toFixed(1),
      bilingualCompleteness: (bothLanguagesComplete / products.length * 100).toFixed(1)
    };
    
    if (bothLanguagesComplete < products.length) {
      this.warnings.push(`${products.length - bothLanguagesComplete} products missing complete bilingual content`);
    }
    
    console.log('✅ Multilingual support validation completed');
  }

  /**
   * Validate SEO metadata
   */
  async validateSeoMetadata() {
    console.log('🔍 Validating SEO metadata...');
    
    const products = await Product.find({});
    let productsWithSeo = 0;
    let productsWithMetaTitles = 0;
    let productsWithMetaDescriptions = 0;
    
    for (const product of products) {
      if (product.seo) {
        productsWithSeo++;
        
        if (product.seo.metaTitle && product.seo.metaTitle.en && product.seo.metaTitle.ar) {
          productsWithMetaTitles++;
        }
        
        if (product.seo.metaDescription && product.seo.metaDescription.en && product.seo.metaDescription.ar) {
          productsWithMetaDescriptions++;
        }
      }
    }
    
    this.validationResults.seo = {
      totalProducts: products.length,
      productsWithSeo,
      productsWithMetaTitles,
      productsWithMetaDescriptions,
      seoCompleteness: (productsWithSeo / products.length * 100).toFixed(1),
      metaTitleCompleteness: (productsWithMetaTitles / products.length * 100).toFixed(1),
      metaDescriptionCompleteness: (productsWithMetaDescriptions / products.length * 100).toFixed(1)
    };
    
    console.log('✅ SEO metadata validation completed');
  }

  /**
   * Generate validation report
   */
  async generateValidationReport() {
    console.log('📋 Generating validation report...');
    
    const overallScore = this.calculateOverallScore();
    
    this.validationResults.overall = {
      validationDate: new Date().toISOString(),
      overallScore,
      status: overallScore >= 90 ? 'EXCELLENT' : overallScore >= 80 ? 'GOOD' : overallScore >= 70 ? 'ACCEPTABLE' : 'NEEDS_IMPROVEMENT',
      totalErrors: this.errors.length,
      totalWarnings: this.warnings.length,
      errors: this.errors,
      warnings: this.warnings
    };
    
    const report = {
      migrationValidationReport: {
        ...this.validationResults,
        summary: {
          migrationStatus: this.errors.length === 0 ? 'SUCCESS' : 'PARTIAL_SUCCESS',
          dataIntegrity: this.validationResults.database.migrationComplete ? 'COMPLETE' : 'INCOMPLETE',
          imageIntegration: parseFloat(this.validationResults.images.cloudinaryIntegrationRate) > 90 ? 'EXCELLENT' : 'GOOD',
          multilingualSupport: parseFloat(this.validationResults.multilingual.bilingualCompleteness) === 100 ? 'COMPLETE' : 'PARTIAL',
          seoOptimization: parseFloat(this.validationResults.seo.seoCompleteness) === 100 ? 'COMPLETE' : 'PARTIAL'
        }
      }
    };
    
    // Save validation report
    await fs.writeFile(
      path.join(__dirname, '../extractedData/migrationValidationReport.json'),
      JSON.stringify(report, null, 2)
    );
    
    console.log('✅ Validation report generated');
  }

  /**
   * Calculate overall migration score
   */
  calculateOverallScore() {
    const weights = {
      database: 30,
      images: 20,
      content: 20,
      multilingual: 20,
      seo: 10
    };
    
    const scores = {
      database: this.validationResults.database.migrationComplete ? 100 : 50,
      images: parseFloat(this.validationResults.images.cloudinaryIntegrationRate),
      content: parseFloat(this.validationResults.content.longDescriptionCompleteness),
      multilingual: parseFloat(this.validationResults.multilingual.bilingualCompleteness),
      seo: parseFloat(this.validationResults.seo.seoCompleteness)
    };
    
    let weightedScore = 0;
    for (const [category, weight] of Object.entries(weights)) {
      weightedScore += (scores[category] * weight) / 100;
    }
    
    return Math.round(weightedScore);
  }

  /**
   * Display validation results
   */
  displayValidationResults() {
    console.log('\n📊 MIGRATION VALIDATION RESULTS');
    console.log('================================');
    
    console.log('\n🗄️  DATABASE INTEGRITY:');
    console.log(`   Products migrated: ${this.validationResults.database.totalProducts}/${this.validationResults.database.expectedProducts}`);
    console.log(`   Featured products: ${this.validationResults.database.featuredProducts}`);
    console.log(`   In-stock products: ${this.validationResults.database.inStockProducts}`);
    console.log(`   Categories: ${this.validationResults.database.categories.join(', ')}`);
    
    console.log('\n🖼️  IMAGE INTEGRATION:');
    console.log(`   Total images: ${this.validationResults.images.totalImages}`);
    console.log(`   Cloudinary integration: ${this.validationResults.images.cloudinaryIntegrationRate}%`);
    console.log(`   Optimization rate: ${this.validationResults.images.optimizationRate}%`);
    console.log(`   Alt text completeness: ${this.validationResults.images.altTextCompleteness}%`);
    
    console.log('\n🌐 MULTILINGUAL SUPPORT:');
    console.log(`   English completeness: ${this.validationResults.multilingual.englishCompleteness}%`);
    console.log(`   Arabic completeness: ${this.validationResults.multilingual.arabicCompleteness}%`);
    console.log(`   Bilingual completeness: ${this.validationResults.multilingual.bilingualCompleteness}%`);
    
    console.log('\n🔍 SEO OPTIMIZATION:');
    console.log(`   SEO metadata: ${this.validationResults.seo.seoCompleteness}%`);
    console.log(`   Meta titles: ${this.validationResults.seo.metaTitleCompleteness}%`);
    console.log(`   Meta descriptions: ${this.validationResults.seo.metaDescriptionCompleteness}%`);
    
    console.log('\n📊 OVERALL SCORE:');
    console.log(`   Migration Score: ${this.validationResults.overall.overallScore}/100 (${this.validationResults.overall.status})`);
    console.log(`   Status: ${this.validationResults.overall.overallScore >= 90 ? '🟢 EXCELLENT' : this.validationResults.overall.overallScore >= 80 ? '🟡 GOOD' : '🔴 NEEDS IMPROVEMENT'}`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach(warning => console.log(`   - ${warning}`));
    }
  }

  /**
   * Helper method to get nested object values
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key], obj);
  }
}

// Export for use in other scripts
module.exports = MigrationValidator;

// Run validation if called directly
if (require.main === module) {
  const validator = new MigrationValidator();
  validator.validateMigration()
    .then(() => {
      console.log('\n🎉 Migration validation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration validation failed:', error);
      process.exit(1);
    });
}