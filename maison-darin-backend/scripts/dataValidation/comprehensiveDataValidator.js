/**
 * Comprehensive Data Validation and Quality Assurance
 * 
 * This script performs thorough validation of all migrated data including:
 * - Product data completeness and accuracy
 * - Image uploads and Cloudinary integration
 * - Multilingual content validation
 * - Data integrity checks
 * - Performance validation
 * 
 * Requirements: 2.1-2.6, 3.1-3.5, 4.1-4.5
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs').promises;
const axios = require('axios');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const Product = require('../../models/Product');
const Content = require('../../models/Content');
const Media = require('../../models/Media');
const User = require('../../models/User');

class ComprehensiveDataValidator {
  constructor() {
    this.validationResults = {
      products: {},
      content: {},
      media: {},
      multilingual: {},
      integrity: {},
      performance: {},
      cloudinary: {},
      overall: {}
    };
    this.errors = [];
    this.warnings = [];
    this.startTime = Date.now();
  }

  /**
   * Main validation method
   */
  async validateAllData() {
    console.log('🔍 Starting comprehensive data validation...');
    console.log('=' .repeat(60));
    
    try {
      // Connect to database
      await this.connectToDatabase();
      
      // Run all validation checks
      await this.validateProductData();
      await this.validateContentData();
      await this.validateMediaData();
      await this.validateMultilingualSupport();
      await this.validateDataIntegrity();
      await this.validateCloudinaryIntegration();
      await this.validatePerformance();
      
      // Generate comprehensive report
      await this.generateComprehensiveReport();
      
      // Display results
      this.displayValidationResults();
      
      console.log('✅ Comprehensive data validation completed successfully!');
      
    } catch (error) {
      console.error('❌ Error during data validation:', error);
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
   * Validate product data completeness and accuracy
   */
  async validateProductData() {
    console.log('🔍 Validating product data...');
    
    const products = await Product.find({});
    const totalProducts = products.length;
    
    let validProducts = 0;
    let productsWithImages = 0;
    let productsWithFragranceNotes = 0;
    let productsWithSeo = 0;
    let productsWithStock = 0;
    let featuredProducts = 0;
    
    const categoryDistribution = {};
    const priceRange = { min: Infinity, max: 0, total: 0 };
    
    for (const product of products) {
      let isValid = true;
      
      // Check required fields
      const requiredFields = [
        'name.en', 'name.ar', 'description.en', 'description.ar',
        'price', 'category', 'size'
      ];
      
      for (const field of requiredFields) {
        if (!this.getNestedValue(product, field)) {
          this.errors.push(`Product ${product.name?.en || 'Unknown'} missing required field: ${field}`);
          isValid = false;
        }
      }
      
      if (isValid) validProducts++;
      
      // Check images
      if (product.images && product.images.length > 0) {
        productsWithImages++;
      }
      
      // Check fragrance notes
      if (product.notes && (
        product.notes.top?.en?.length > 0 ||
        product.notes.middle?.en?.length > 0 ||
        product.notes.base?.en?.length > 0
      )) {
        productsWithFragranceNotes++;
      }
      
      // Check SEO metadata
      if (product.seo && product.seo.metaTitle?.en && product.seo.metaDescription?.en) {
        productsWithSeo++;
      }
      
      // Check stock information
      if (product.stock !== undefined && product.stock >= 0) {
        productsWithStock++;
      }
      
      // Count featured products
      if (product.featured) {
        featuredProducts++;
      }
      
      // Category distribution
      categoryDistribution[product.category] = (categoryDistribution[product.category] || 0) + 1;
      
      // Price analysis
      if (product.price) {
        priceRange.min = Math.min(priceRange.min, product.price);
        priceRange.max = Math.max(priceRange.max, product.price);
        priceRange.total += product.price;
      }
    }
    
    this.validationResults.products = {
      totalProducts,
      validProducts,
      productsWithImages,
      productsWithFragranceNotes,
      productsWithSeo,
      productsWithStock,
      featuredProducts,
      categoryDistribution,
      priceRange: {
        ...priceRange,
        average: totalProducts > 0 ? Math.round(priceRange.total / totalProducts) : 0
      },
      completenessRates: {
        overall: (validProducts / totalProducts * 100).toFixed(1),
        images: (productsWithImages / totalProducts * 100).toFixed(1),
        fragranceNotes: (productsWithFragranceNotes / totalProducts * 100).toFixed(1),
        seo: (productsWithSeo / totalProducts * 100).toFixed(1),
        stock: (productsWithStock / totalProducts * 100).toFixed(1)
      }
    };
    
    console.log('✅ Product data validation completed');
  }

  /**
   * Validate content data
   */
  async validateContentData() {
    console.log('🔍 Validating content data...');
    
    const contentSections = await Content.find({ isActive: true });
    const totalSections = contentSections.length;
    
    let validSections = 0;
    let sectionsWithBothLanguages = 0;
    let sectionsWithVersioning = 0;
    
    const expectedSections = ['hero', 'about', 'nav', 'contact', 'collections', 'footer'];
    const missingSections = [];
    
    for (const expectedSection of expectedSections) {
      const section = contentSections.find(s => s.section === expectedSection);
      if (!section) {
        missingSections.push(expectedSection);
        this.warnings.push(`Missing content section: ${expectedSection}`);
      }
    }
    
    for (const section of contentSections) {
      let isValid = true;
      
      // Check if both languages exist
      if (section.content?.en && section.content?.ar) {
        sectionsWithBothLanguages++;
      } else {
        this.warnings.push(`Content section ${section.section} missing language content`);
        isValid = false;
      }
      
      // Check versioning
      if (section.version && section.version > 0) {
        sectionsWithVersioning++;
      }
      
      if (isValid) validSections++;
    }
    
    this.validationResults.content = {
      totalSections,
      validSections,
      sectionsWithBothLanguages,
      sectionsWithVersioning,
      expectedSections: expectedSections.length,
      missingSections,
      completenessRates: {
        overall: (validSections / totalSections * 100).toFixed(1),
        bilingual: (sectionsWithBothLanguages / totalSections * 100).toFixed(1),
        versioning: (sectionsWithVersioning / totalSections * 100).toFixed(1)
      }
    };
    
    console.log('✅ Content data validation completed');
  }

  /**
   * Validate media data and Cloudinary integration
   */
  async validateMediaData() {
    console.log('🔍 Validating media data...');
    
    const mediaFiles = await Media.find({});
    const products = await Product.find({});
    
    let totalImages = 0;
    let validCloudinaryUrls = 0;
    let imagesWithAltText = 0;
    let imagesWithOptimization = 0;
    
    // Count product images
    for (const product of products) {
      if (product.images) {
        totalImages += product.images.length;
        
        for (const image of product.images) {
          if (image.cloudinaryId && image.url) {
            validCloudinaryUrls++;
          }
          
          if (image.alt?.en && image.alt?.ar) {
            imagesWithAltText++;
          }
          
          if (image.optimizedUrls) {
            imagesWithOptimization++;
          }
        }
      }
    }
    
    // Add media collection images
    totalImages += mediaFiles.length;
    for (const media of mediaFiles) {
      if (media.cloudinaryId && media.cloudinaryUrl) {
        validCloudinaryUrls++;
      }
      
      if (media.alt?.en && media.alt?.ar) {
        imagesWithAltText++;
      }
    }
    
    this.validationResults.media = {
      totalImages,
      validCloudinaryUrls,
      imagesWithAltText,
      imagesWithOptimization,
      mediaFiles: mediaFiles.length,
      completenessRates: {
        cloudinaryIntegration: totalImages > 0 ? (validCloudinaryUrls / totalImages * 100).toFixed(1) : '0',
        altText: totalImages > 0 ? (imagesWithAltText / totalImages * 100).toFixed(1) : '0',
        optimization: totalImages > 0 ? (imagesWithOptimization / totalImages * 100).toFixed(1) : '0'
      }
    };
    
    console.log('✅ Media data validation completed');
  }

  /**
   * Validate multilingual support
   */
  async validateMultilingualSupport() {
    console.log('🔍 Validating multilingual support...');
    
    const products = await Product.find({});
    const contentSections = await Content.find({ isActive: true });
    
    let productsWithCompleteTranslations = 0;
    let contentWithCompleteTranslations = 0;
    let arabicTextValidation = 0;
    let englishTextValidation = 0;
    
    // Validate product translations
    for (const product of products) {
      const hasEnglish = product.name?.en && product.description?.en;
      const hasArabic = product.name?.ar && product.description?.ar;
      
      if (hasEnglish && hasArabic) {
        productsWithCompleteTranslations++;
      }
      
      // Validate Arabic text (contains Arabic characters)
      if (product.name?.ar && this.containsArabicText(product.name.ar)) {
        arabicTextValidation++;
      }
      
      // Validate English text (contains Latin characters)
      if (product.name?.en && this.containsLatinText(product.name.en)) {
        englishTextValidation++;
      }
    }
    
    // Validate content translations
    for (const section of contentSections) {
      if (section.content?.en && section.content?.ar) {
        contentWithCompleteTranslations++;
      }
    }
    
    this.validationResults.multilingual = {
      products: {
        total: products.length,
        completeTranslations: productsWithCompleteTranslations,
        arabicTextValid: arabicTextValidation,
        englishTextValid: englishTextValidation
      },
      content: {
        total: contentSections.length,
        completeTranslations: contentWithCompleteTranslations
      },
      completenessRates: {
        productTranslations: (productsWithCompleteTranslations / products.length * 100).toFixed(1),
        contentTranslations: contentSections.length > 0 ? (contentWithCompleteTranslations / contentSections.length * 100).toFixed(1) : '0',
        arabicValidation: (arabicTextValidation / products.length * 100).toFixed(1),
        englishValidation: (englishTextValidation / products.length * 100).toFixed(1)
      }
    };
    
    console.log('✅ Multilingual support validation completed');
  }

  /**
   * Validate data integrity
   */
  async validateDataIntegrity() {
    console.log('🔍 Validating data integrity...');
    
    const products = await Product.find({});
    const users = await User.find({});
    
    let duplicateProducts = 0;
    let orphanedImages = 0;
    let invalidPrices = 0;
    let invalidCategories = 0;
    
    const validCategories = ['floral', 'oriental', 'fresh', 'woody', 'citrus', 'spicy', 'aquatic', 'gourmand'];
    const productNames = new Set();
    
    for (const product of products) {
      // Check for duplicate names
      const nameKey = `${product.name?.en}-${product.name?.ar}`;
      if (productNames.has(nameKey)) {
        duplicateProducts++;
        this.warnings.push(`Duplicate product found: ${product.name?.en}`);
      }
      productNames.add(nameKey);
      
      // Validate price
      if (!product.price || product.price <= 0) {
        invalidPrices++;
        this.errors.push(`Invalid price for product: ${product.name?.en}`);
      }
      
      // Validate category
      if (!validCategories.includes(product.category)) {
        invalidCategories++;
        this.errors.push(`Invalid category for product: ${product.name?.en} - ${product.category}`);
      }
    }
    
    this.validationResults.integrity = {
      duplicateProducts,
      orphanedImages,
      invalidPrices,
      invalidCategories,
      totalUsers: users.length,
      integrityScore: Math.max(0, 100 - (duplicateProducts + invalidPrices + invalidCategories) * 10)
    };
    
    console.log('✅ Data integrity validation completed');
  }

  /**
   * Validate Cloudinary integration by testing image URLs
   */
  async validateCloudinaryIntegration() {
    console.log('🔍 Validating Cloudinary integration...');
    
    const products = await Product.find({});
    let totalImageUrls = 0;
    let accessibleUrls = 0;
    let optimizedUrls = 0;
    let cloudinaryUrls = 0;
    
    for (const product of products) {
      if (product.images) {
        for (const image of product.images) {
          totalImageUrls++;
          
          if (image.url && image.url.includes('cloudinary.com')) {
            cloudinaryUrls++;
            
            try {
              // Test if image URL is accessible (head request)
              const response = await axios.head(image.url, { timeout: 5000 });
              if (response.status === 200) {
                accessibleUrls++;
              }
            } catch (error) {
              this.warnings.push(`Image URL not accessible: ${image.url}`);
            }
          }
          
          if (image.optimizedUrls) {
            optimizedUrls++;
          }
        }
      }
    }
    
    this.validationResults.cloudinary = {
      totalImageUrls,
      cloudinaryUrls,
      accessibleUrls,
      optimizedUrls,
      integrationRates: {
        cloudinaryHosted: totalImageUrls > 0 ? (cloudinaryUrls / totalImageUrls * 100).toFixed(1) : '0',
        accessible: cloudinaryUrls > 0 ? (accessibleUrls / cloudinaryUrls * 100).toFixed(1) : '0',
        optimized: totalImageUrls > 0 ? (optimizedUrls / totalImageUrls * 100).toFixed(1) : '0'
      }
    };
    
    console.log('✅ Cloudinary integration validation completed');
  }

  /**
   * Validate performance aspects
   */
  async validatePerformance() {
    console.log('🔍 Validating performance aspects...');
    
    const startTime = Date.now();
    
    // Test query performance
    const productQueryStart = Date.now();
    await Product.find({}).limit(10);
    const productQueryTime = Date.now() - productQueryStart;
    
    const searchQueryStart = Date.now();
    await Product.find({ $text: { $search: "floral" } }).limit(5);
    const searchQueryTime = Date.now() - searchQueryStart;
    
    const categoryQueryStart = Date.now();
    await Product.find({ category: 'floral' }).limit(5);
    const categoryQueryTime = Date.now() - categoryQueryStart;
    
    // Check indexes
    const productIndexes = await Product.collection.getIndexes();
    const contentIndexes = await Content.collection.getIndexes();
    
    this.validationResults.performance = {
      queryTimes: {
        productQuery: productQueryTime,
        searchQuery: searchQueryTime,
        categoryQuery: categoryQueryTime
      },
      indexes: {
        productIndexes: Object.keys(productIndexes).length,
        contentIndexes: Object.keys(contentIndexes).length
      },
      performanceScore: this.calculatePerformanceScore(productQueryTime, searchQueryTime, categoryQueryTime)
    };
    
    console.log('✅ Performance validation completed');
  }

  /**
   * Generate comprehensive validation report
   */
  async generateComprehensiveReport() {
    console.log('📋 Generating comprehensive validation report...');
    
    const totalTime = Date.now() - this.startTime;
    const overallScore = this.calculateOverallScore();
    
    this.validationResults.overall = {
      validationDate: new Date().toISOString(),
      validationDuration: `${totalTime}ms`,
      overallScore,
      status: this.getStatusFromScore(overallScore),
      totalErrors: this.errors.length,
      totalWarnings: this.warnings.length,
      errors: this.errors,
      warnings: this.warnings,
      recommendations: this.generateRecommendations()
    };
    
    const report = {
      comprehensiveValidationReport: {
        ...this.validationResults,
        summary: {
          migrationStatus: this.errors.length === 0 ? 'SUCCESS' : 'PARTIAL_SUCCESS',
          dataQuality: overallScore >= 90 ? 'EXCELLENT' : overallScore >= 80 ? 'GOOD' : 'NEEDS_IMPROVEMENT',
          readyForProduction: this.errors.length === 0 && overallScore >= 85
        }
      }
    };
    
    // Save comprehensive report
    await fs.writeFile(
      path.join(__dirname, '../extractedData/comprehensiveValidationReport.json'),
      JSON.stringify(report, null, 2)
    );
    
    console.log('✅ Comprehensive validation report generated');
  }

  /**
   * Calculate overall validation score
   */
  calculateOverallScore() {
    const weights = {
      products: 25,
      content: 15,
      media: 20,
      multilingual: 20,
      integrity: 10,
      cloudinary: 10
    };
    
    const scores = {
      products: parseFloat(this.validationResults.products.completenessRates.overall),
      content: parseFloat(this.validationResults.content.completenessRates.overall),
      media: parseFloat(this.validationResults.media.completenessRates.cloudinaryIntegration),
      multilingual: parseFloat(this.validationResults.multilingual.completenessRates.productTranslations),
      integrity: this.validationResults.integrity.integrityScore,
      cloudinary: parseFloat(this.validationResults.cloudinary.integrationRates.accessible)
    };
    
    let weightedScore = 0;
    for (const [category, weight] of Object.entries(weights)) {
      weightedScore += (scores[category] * weight) / 100;
    }
    
    return Math.round(weightedScore);
  }

  /**
   * Calculate performance score
   */
  calculatePerformanceScore(productTime, searchTime, categoryTime) {
    const avgTime = (productTime + searchTime + categoryTime) / 3;
    if (avgTime < 50) return 100;
    if (avgTime < 100) return 90;
    if (avgTime < 200) return 80;
    if (avgTime < 500) return 70;
    return 60;
  }

  /**
   * Get status from score
   */
  getStatusFromScore(score) {
    if (score >= 95) return 'EXCELLENT';
    if (score >= 85) return 'VERY_GOOD';
    if (score >= 75) return 'GOOD';
    if (score >= 65) return 'ACCEPTABLE';
    return 'NEEDS_IMPROVEMENT';
  }

  /**
   * Generate recommendations based on validation results
   */
  generateRecommendations() {
    const recommendations = [];
    
    if (parseFloat(this.validationResults.products.completenessRates.seo) < 100) {
      recommendations.push('Complete SEO metadata for all products to improve search engine visibility');
    }
    
    if (parseFloat(this.validationResults.media.completenessRates.altText) < 100) {
      recommendations.push('Add alt text to all images for better accessibility');
    }
    
    if (this.validationResults.integrity.duplicateProducts > 0) {
      recommendations.push('Remove or merge duplicate products to maintain data integrity');
    }
    
    if (parseFloat(this.validationResults.cloudinary.integrationRates.accessible) < 95) {
      recommendations.push('Check and fix inaccessible Cloudinary image URLs');
    }
    
    if (this.validationResults.performance.performanceScore < 80) {
      recommendations.push('Optimize database queries and add appropriate indexes for better performance');
    }
    
    return recommendations;
  }

  /**
   * Display comprehensive validation results
   */
  displayValidationResults() {
    console.log('\n📊 COMPREHENSIVE DATA VALIDATION RESULTS');
    console.log('=' .repeat(60));
    
    console.log('\n📦 PRODUCT DATA:');
    console.log(`   Total Products: ${this.validationResults.products.totalProducts}`);
    console.log(`   Valid Products: ${this.validationResults.products.validProducts}`);
    console.log(`   Completeness: ${this.validationResults.products.completenessRates.overall}%`);
    console.log(`   With Images: ${this.validationResults.products.completenessRates.images}%`);
    console.log(`   With SEO: ${this.validationResults.products.completenessRates.seo}%`);
    
    console.log('\n📄 CONTENT DATA:');
    console.log(`   Total Sections: ${this.validationResults.content.totalSections}`);
    console.log(`   Valid Sections: ${this.validationResults.content.validSections}`);
    console.log(`   Bilingual Support: ${this.validationResults.content.completenessRates.bilingual}%`);
    
    console.log('\n🖼️  MEDIA DATA:');
    console.log(`   Total Images: ${this.validationResults.media.totalImages}`);
    console.log(`   Cloudinary Integration: ${this.validationResults.media.completenessRates.cloudinaryIntegration}%`);
    console.log(`   Alt Text Coverage: ${this.validationResults.media.completenessRates.altText}%`);
    
    console.log('\n🌐 MULTILINGUAL SUPPORT:');
    console.log(`   Product Translations: ${this.validationResults.multilingual.completenessRates.productTranslations}%`);
    console.log(`   Content Translations: ${this.validationResults.multilingual.completenessRates.contentTranslations}%`);
    console.log(`   Arabic Text Valid: ${this.validationResults.multilingual.completenessRates.arabicValidation}%`);
    
    console.log('\n☁️  CLOUDINARY INTEGRATION:');
    console.log(`   Cloudinary Hosted: ${this.validationResults.cloudinary.integrationRates.cloudinaryHosted}%`);
    console.log(`   Accessible URLs: ${this.validationResults.cloudinary.integrationRates.accessible}%`);
    console.log(`   Optimized Images: ${this.validationResults.cloudinary.integrationRates.optimized}%`);
    
    console.log('\n⚡ PERFORMANCE:');
    console.log(`   Query Performance: ${this.validationResults.performance.performanceScore}/100`);
    console.log(`   Product Indexes: ${this.validationResults.performance.indexes.productIndexes}`);
    
    console.log('\n📊 OVERALL RESULTS:');
    console.log(`   Overall Score: ${this.validationResults.overall.overallScore}/100`);
    console.log(`   Status: ${this.getStatusEmoji(this.validationResults.overall.status)} ${this.validationResults.overall.status}`);
    console.log(`   Errors: ${this.validationResults.overall.totalErrors}`);
    console.log(`   Warnings: ${this.validationResults.overall.totalWarnings}`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach(warning => console.log(`   - ${warning}`));
    }
    
    if (this.validationResults.overall.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      this.validationResults.overall.recommendations.forEach(rec => console.log(`   - ${rec}`));
    }
  }

  /**
   * Get status emoji
   */
  getStatusEmoji(status) {
    const emojis = {
      'EXCELLENT': '🟢',
      'VERY_GOOD': '🟢',
      'GOOD': '🟡',
      'ACCEPTABLE': '🟡',
      'NEEDS_IMPROVEMENT': '🔴'
    };
    return emojis[status] || '⚪';
  }

  /**
   * Helper methods
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key], obj);
  }

  containsArabicText(text) {
    return /[\u0600-\u06FF]/.test(text);
  }

  containsLatinText(text) {
    return /[a-zA-Z]/.test(text);
  }
}

// Export for use in other scripts
module.exports = ComprehensiveDataValidator;

// Run validation if called directly
if (require.main === module) {
  const validator = new ComprehensiveDataValidator();
  validator.validateAllData()
    .then(() => {
      console.log('\n🎉 Comprehensive data validation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Comprehensive data validation failed:', error);
      process.exit(1);
    });
}