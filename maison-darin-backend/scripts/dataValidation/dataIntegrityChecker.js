/**
 * Data Integrity Checker
 * 
 * This script performs comprehensive data integrity checks:
 * - Database constraints and relationships
 * - Data consistency across collections
 * - Referential integrity
 * - Business rule validation
 * - Performance and indexing validation
 * 
 * Requirements: 2.1-2.6, 3.1-3.5, 4.1-4.5
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const Product = require('../../models/Product');
const Content = require('../../models/Content');
const Media = require('../../models/Media');
const User = require('../../models/User');

class DataIntegrityChecker {
  constructor() {
    this.integrityResults = {
      constraints: {},
      relationships: {},
      consistency: {},
      businessRules: {},
      performance: {},
      indexes: {},
      overall: {}
    };
    this.errors = [];
    this.warnings = [];
    this.criticalIssues = [];
  }

  /**
   * Main data integrity checking method
   */
  async checkDataIntegrity() {
    console.log('🔍 Starting comprehensive data integrity check...');
    console.log('=' .repeat(60));
    
    try {
      // Connect to database
      await this.connectToDatabase();
      
      // Run all integrity checks
      await this.checkDatabaseConstraints();
      await this.checkDataRelationships();
      await this.checkDataConsistency();
      await this.checkBusinessRules();
      await this.checkPerformanceMetrics();
      await this.checkDatabaseIndexes();
      
      // Generate integrity report
      await this.generateIntegrityReport();
      
      // Display results
      this.displayIntegrityResults();
      
      console.log('✅ Data integrity check completed successfully!');
      
    } catch (error) {
      console.error('❌ Error during data integrity check:', error);
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
    console.log('✅ Connected to MongoDB for integrity check');
  }

  /**
   * Check database constraints
   */
  async checkDatabaseConstraints() {
    console.log('🔍 Checking database constraints...');
    
    let constraintViolations = 0;
    let uniqueConstraintViolations = 0;
    let requiredFieldViolations = 0;
    let dataTypeViolations = 0;
    
    // Check Product constraints
    const products = await Product.find({});
    const productNames = new Map();
    
    for (const product of products) {
      // Check required fields
      const requiredFields = ['name.en', 'name.ar', 'description.en', 'description.ar', 'price', 'category'];
      for (const field of requiredFields) {
        if (!this.getNestedValue(product, field)) {
          requiredFieldViolations++;
          this.errors.push(`Product ${product._id} missing required field: ${field}`);
        }
      }
      
      // Check unique constraints (product names should be unique)
      const nameKey = `${product.name?.en}-${product.name?.ar}`;
      if (productNames.has(nameKey)) {
        uniqueConstraintViolations++;
        this.errors.push(`Duplicate product name found: ${product.name?.en}`);
      }
      productNames.set(nameKey, product._id);
      
      // Check data types
      if (product.price && (typeof product.price !== 'number' || product.price <= 0)) {
        dataTypeViolations++;
        this.errors.push(`Invalid price data type for product ${product.name?.en}: ${product.price}`);
      }
      
      if (product.stock && (typeof product.stock !== 'number' || product.stock < 0)) {
        dataTypeViolations++;
        this.errors.push(`Invalid stock data type for product ${product.name?.en}: ${product.stock}`);
      }
      
      // Check category enum
      const validCategories = ['floral', 'oriental', 'fresh', 'woody', 'citrus', 'spicy', 'aquatic', 'gourmand'];
      if (product.category && !validCategories.includes(product.category)) {
        constraintViolations++;
        this.errors.push(`Invalid category for product ${product.name?.en}: ${product.category}`);
      }
    }
    
    // Check Content constraints
    const contentSections = await Content.find({});
    const sectionNames = new Set();
    
    for (const section of contentSections) {
      // Check unique section names
      if (sectionNames.has(section.section)) {
        uniqueConstraintViolations++;
        this.errors.push(`Duplicate content section: ${section.section}`);
      }
      sectionNames.add(section.section);
      
      // Check required fields
      if (!section.content || (!section.content.en && !section.content.ar)) {
        requiredFieldViolations++;
        this.errors.push(`Content section ${section.section} missing content`);
      }
    }
    
    // Check User constraints
    const users = await User.find({});
    const userEmails = new Set();
    
    for (const user of users) {
      // Check unique email
      if (userEmails.has(user.email)) {
        uniqueConstraintViolations++;
        this.criticalIssues.push(`Duplicate user email: ${user.email}`);
      }
      userEmails.add(user.email);
      
      // Check required fields
      if (!user.email || !user.password) {
        requiredFieldViolations++;
        this.criticalIssues.push(`User ${user._id} missing required fields`);
      }
    }
    
    this.integrityResults.constraints = {
      constraintViolations,
      uniqueConstraintViolations,
      requiredFieldViolations,
      dataTypeViolations,
      totalViolations: constraintViolations + uniqueConstraintViolations + requiredFieldViolations + dataTypeViolations
    };
    
    console.log('✅ Database constraints check completed');
  }

  /**
   * Check data relationships
   */
  async checkDataRelationships() {
    console.log('🔍 Checking data relationships...');
    
    let orphanedRecords = 0;
    let brokenReferences = 0;
    let circularReferences = 0;
    
    // Check Media relationships with Products
    const mediaFiles = await Media.find({});
    const products = await Product.find({});
    const productImageIds = new Set();
    
    // Collect all image IDs used in products
    for (const product of products) {
      if (product.images) {
        for (const image of product.images) {
          if (image.cloudinaryId) {
            productImageIds.add(image.cloudinaryId);
          }
        }
      }
    }
    
    // Check for orphaned media files
    for (const media of mediaFiles) {
      if (media.cloudinaryId && !productImageIds.has(media.cloudinaryId)) {
        orphanedRecords++;
        this.warnings.push(`Orphaned media file: ${media.cloudinaryId}`);
      }
    }
    
    // Check for broken image references in products
    for (const product of products) {
      if (product.images) {
        for (const image of product.images) {
          if (image.cloudinaryId) {
            const mediaExists = mediaFiles.some(m => m.cloudinaryId === image.cloudinaryId);
            if (!mediaExists) {
              brokenReferences++;
              this.warnings.push(`Broken image reference in product ${product.name?.en}: ${image.cloudinaryId}`);
            }
          }
        }
      }
    }
    
    // Check Content version relationships
    const contentSections = await Content.find({});
    const sectionVersions = new Map();
    
    for (const section of contentSections) {
      const key = section.section;
      if (!sectionVersions.has(key)) {
        sectionVersions.set(key, []);
      }
      sectionVersions.get(key).push(section.version);
    }
    
    // Check for version consistency
    for (const [sectionName, versions] of sectionVersions) {
      const uniqueVersions = [...new Set(versions)];
      if (uniqueVersions.length !== versions.length) {
        this.warnings.push(`Duplicate versions found for content section: ${sectionName}`);
      }
    }
    
    this.integrityResults.relationships = {
      orphanedRecords,
      brokenReferences,
      circularReferences,
      totalIssues: orphanedRecords + brokenReferences + circularReferences
    };
    
    console.log('✅ Data relationships check completed');
  }

  /**
   * Check data consistency
   */
  async checkDataConsistency() {
    console.log('🔍 Checking data consistency...');
    
    let inconsistentData = 0;
    let timestampIssues = 0;
    let statusInconsistencies = 0;
    let calculationErrors = 0;
    
    const products = await Product.find({});
    
    for (const product of products) {
      // Check timestamp consistency
      if (product.updatedAt && product.createdAt && product.updatedAt < product.createdAt) {
        timestampIssues++;
        this.errors.push(`Invalid timestamps for product ${product.name?.en}: updated before created`);
      }
      
      // Check stock vs availability consistency
      if (product.inStock === true && product.stock === 0) {
        statusInconsistencies++;
        this.warnings.push(`Product ${product.name?.en} marked as in stock but has 0 stock`);
      }
      
      if (product.inStock === false && product.stock > 0) {
        statusInconsistencies++;
        this.warnings.push(`Product ${product.name?.en} marked as out of stock but has ${product.stock} stock`);
      }
      
      // Check price consistency
      if (product.price && product.price < 0) {
        calculationErrors++;
        this.errors.push(`Negative price for product ${product.name?.en}: ${product.price}`);
      }
      
      // Check image order consistency
      if (product.images && product.images.length > 1) {
        const orders = product.images.map(img => img.order || 0);
        const sortedOrders = [...orders].sort((a, b) => a - b);
        if (JSON.stringify(orders) !== JSON.stringify(sortedOrders)) {
          inconsistentData++;
          this.warnings.push(`Inconsistent image order for product ${product.name?.en}`);
        }
      }
    }
    
    // Check content consistency
    const contentSections = await Content.find({});
    
    for (const section of contentSections) {
      // Check version consistency
      if (section.version && section.version < 1) {
        inconsistentData++;
        this.errors.push(`Invalid version number for content section ${section.section}: ${section.version}`);
      }
      
      // Check active status consistency
      if (section.isActive === undefined || section.isActive === null) {
        statusInconsistencies++;
        this.warnings.push(`Undefined active status for content section ${section.section}`);
      }
    }
    
    this.integrityResults.consistency = {
      inconsistentData,
      timestampIssues,
      statusInconsistencies,
      calculationErrors,
      totalIssues: inconsistentData + timestampIssues + statusInconsistencies + calculationErrors
    };
    
    console.log('✅ Data consistency check completed');
  }

  /**
   * Check business rules
   */
  async checkBusinessRules() {
    console.log('🔍 Checking business rules...');
    
    let businessRuleViolations = 0;
    let pricingRuleViolations = 0;
    let inventoryRuleViolations = 0;
    let contentRuleViolations = 0;
    
    const products = await Product.find({});
    
    // Business Rule 1: Featured products should have images
    const featuredProducts = products.filter(p => p.featured);
    for (const product of featuredProducts) {
      if (!product.images || product.images.length === 0) {
        businessRuleViolations++;
        this.warnings.push(`Featured product ${product.name?.en} has no images`);
      }
    }
    
    // Business Rule 2: Products should have reasonable price ranges
    for (const product of products) {
      if (product.price) {
        if (product.price < 10 || product.price > 1000) {
          pricingRuleViolations++;
          this.warnings.push(`Product ${product.name?.en} has unusual price: $${product.price}`);
        }
      }
    }
    
    // Business Rule 3: In-stock products should have stock quantity
    for (const product of products) {
      if (product.inStock && (!product.stock || product.stock <= 0)) {
        inventoryRuleViolations++;
        this.warnings.push(`In-stock product ${product.name?.en} has no stock quantity`);
      }
    }
    
    // Business Rule 4: Products should have complete multilingual content
    for (const product of products) {
      if (!product.name?.en || !product.name?.ar || !product.description?.en || !product.description?.ar) {
        contentRuleViolations++;
        this.warnings.push(`Product ${product.name?.en || 'Unknown'} missing multilingual content`);
      }
    }
    
    // Business Rule 5: Content sections should be complete
    const requiredSections = ['hero', 'about', 'nav', 'contact'];
    const contentSections = await Content.find({ isActive: true });
    const existingSections = contentSections.map(s => s.section);
    
    for (const requiredSection of requiredSections) {
      if (!existingSections.includes(requiredSection)) {
        contentRuleViolations++;
        this.warnings.push(`Missing required content section: ${requiredSection}`);
      }
    }
    
    this.integrityResults.businessRules = {
      businessRuleViolations,
      pricingRuleViolations,
      inventoryRuleViolations,
      contentRuleViolations,
      totalViolations: businessRuleViolations + pricingRuleViolations + inventoryRuleViolations + contentRuleViolations
    };
    
    console.log('✅ Business rules check completed');
  }

  /**
   * Check performance metrics
   */
  async checkPerformanceMetrics() {
    console.log('🔍 Checking performance metrics...');
    
    const startTime = Date.now();
    
    // Test query performance
    const queryTests = [];
    
    // Test 1: Product listing query
    const productQueryStart = Date.now();
    await Product.find({}).limit(20);
    const productQueryTime = Date.now() - productQueryStart;
    queryTests.push({ name: 'Product Listing', time: productQueryTime });
    
    // Test 2: Product search query
    const searchQueryStart = Date.now();
    await Product.find({ $or: [
      { 'name.en': { $regex: 'floral', $options: 'i' } },
      { 'name.ar': { $regex: 'floral', $options: 'i' } }
    ]}).limit(10);
    const searchQueryTime = Date.now() - searchQueryStart;
    queryTests.push({ name: 'Product Search', time: searchQueryTime });
    
    // Test 3: Category filter query
    const categoryQueryStart = Date.now();
    await Product.find({ category: 'floral' }).limit(10);
    const categoryQueryTime = Date.now() - categoryQueryStart;
    queryTests.push({ name: 'Category Filter', time: categoryQueryTime });
    
    // Test 4: Featured products query
    const featuredQueryStart = Date.now();
    await Product.find({ featured: true }).limit(10);
    const featuredQueryTime = Date.now() - featuredQueryStart;
    queryTests.push({ name: 'Featured Products', time: featuredQueryTime });
    
    // Test 5: Content query
    const contentQueryStart = Date.now();
    await Content.find({ isActive: true });
    const contentQueryTime = Date.now() - contentQueryStart;
    queryTests.push({ name: 'Content Sections', time: contentQueryTime });
    
    const totalTestTime = Date.now() - startTime;
    const averageQueryTime = queryTests.reduce((sum, test) => sum + test.time, 0) / queryTests.length;
    
    // Performance thresholds
    const slowQueries = queryTests.filter(test => test.time > 100);
    const verySlowQueries = queryTests.filter(test => test.time > 500);
    
    this.integrityResults.performance = {
      queryTests,
      totalTestTime,
      averageQueryTime: Math.round(averageQueryTime),
      slowQueries: slowQueries.length,
      verySlowQueries: verySlowQueries.length,
      performanceScore: this.calculatePerformanceScore(averageQueryTime, slowQueries.length, verySlowQueries.length)
    };
    
    if (verySlowQueries.length > 0) {
      this.warnings.push(`${verySlowQueries.length} very slow queries detected (>500ms)`);
    }
    
    console.log('✅ Performance metrics check completed');
  }

  /**
   * Check database indexes
   */
  async checkDatabaseIndexes() {
    console.log('🔍 Checking database indexes...');
    
    const collections = ['products', 'contents', 'media', 'users'];
    const indexInfo = {};
    let missingIndexes = 0;
    let recommendedIndexes = [];
    
    for (const collectionName of collections) {
      try {
        const collection = mongoose.connection.db.collection(collectionName);
        const indexes = await collection.getIndexes();
        indexInfo[collectionName] = {
          count: Object.keys(indexes).length,
          indexes: Object.keys(indexes)
        };
      } catch (error) {
        this.warnings.push(`Could not retrieve indexes for collection: ${collectionName}`);
      }
    }
    
    // Check for recommended indexes
    const recommendedProductIndexes = [
      'category_1',
      'featured_1',
      'inStock_1',
      'price_1',
      'name.en_text_name.ar_text_description.en_text_description.ar_text'
    ];
    
    const productIndexes = indexInfo.products?.indexes || [];
    for (const recommendedIndex of recommendedProductIndexes) {
      if (!productIndexes.some(index => index.includes(recommendedIndex.split('_')[0]))) {
        missingIndexes++;
        recommendedIndexes.push(`products.${recommendedIndex}`);
      }
    }
    
    // Check for content indexes
    const recommendedContentIndexes = ['section_1', 'isActive_1'];
    const contentIndexes = indexInfo.contents?.indexes || [];
    for (const recommendedIndex of recommendedContentIndexes) {
      if (!contentIndexes.some(index => index.includes(recommendedIndex.split('_')[0]))) {
        missingIndexes++;
        recommendedIndexes.push(`contents.${recommendedIndex}`);
      }
    }
    
    this.integrityResults.indexes = {
      indexInfo,
      missingIndexes,
      recommendedIndexes,
      indexOptimizationScore: Math.max(0, 100 - (missingIndexes * 20))
    };
    
    if (missingIndexes > 0) {
      this.warnings.push(`${missingIndexes} recommended indexes are missing`);
    }
    
    console.log('✅ Database indexes check completed');
  }

  /**
   * Calculate performance score
   */
  calculatePerformanceScore(avgTime, slowQueries, verySlowQueries) {
    let score = 100;
    
    // Deduct points for average query time
    if (avgTime > 50) score -= 10;
    if (avgTime > 100) score -= 20;
    if (avgTime > 200) score -= 30;
    
    // Deduct points for slow queries
    score -= slowQueries * 5;
    score -= verySlowQueries * 15;
    
    return Math.max(0, score);
  }

  /**
   * Generate integrity report
   */
  async generateIntegrityReport() {
    console.log('📋 Generating data integrity report...');
    
    const overallScore = this.calculateOverallIntegrityScore();
    const criticalIssuesCount = this.criticalIssues.length;
    
    this.integrityResults.overall = {
      validationDate: new Date().toISOString(),
      overallScore,
      criticalIssuesCount,
      status: this.getIntegrityStatus(overallScore, criticalIssuesCount),
      totalErrors: this.errors.length,
      totalWarnings: this.warnings.length,
      criticalIssues: this.criticalIssues,
      errors: this.errors,
      warnings: this.warnings,
      recommendations: this.generateIntegrityRecommendations()
    };
    
    const report = {
      dataIntegrityReport: {
        ...this.integrityResults,
        summary: {
          dataIntegrity: criticalIssuesCount === 0 ? 'INTACT' : 'COMPROMISED',
          constraintCompliance: this.integrityResults.constraints.totalViolations === 0 ? 'COMPLIANT' : 'VIOLATIONS_FOUND',
          relationshipIntegrity: this.integrityResults.relationships.totalIssues === 0 ? 'INTACT' : 'ISSUES_FOUND',
          businessRuleCompliance: this.integrityResults.businessRules.totalViolations === 0 ? 'COMPLIANT' : 'VIOLATIONS_FOUND',
          performanceRating: this.integrityResults.performance.performanceScore > 80 ? 'GOOD' : 'NEEDS_OPTIMIZATION'
        }
      }
    };
    
    // Save integrity report
    await fs.writeFile(
      path.join(__dirname, '../extractedData/dataIntegrityReport.json'),
      JSON.stringify(report, null, 2)
    );
    
    console.log('✅ Data integrity report generated');
  }

  /**
   * Calculate overall integrity score
   */
  calculateOverallIntegrityScore() {
    const weights = {
      constraints: 30,
      relationships: 20,
      consistency: 20,
      businessRules: 15,
      performance: 10,
      indexes: 5
    };
    
    const scores = {
      constraints: Math.max(0, 100 - (this.integrityResults.constraints.totalViolations * 10)),
      relationships: Math.max(0, 100 - (this.integrityResults.relationships.totalIssues * 15)),
      consistency: Math.max(0, 100 - (this.integrityResults.consistency.totalIssues * 10)),
      businessRules: Math.max(0, 100 - (this.integrityResults.businessRules.totalViolations * 5)),
      performance: this.integrityResults.performance.performanceScore,
      indexes: this.integrityResults.indexes.indexOptimizationScore
    };
    
    let weightedScore = 0;
    for (const [category, weight] of Object.entries(weights)) {
      weightedScore += (scores[category] * weight) / 100;
    }
    
    return Math.round(weightedScore);
  }

  /**
   * Get integrity status
   */
  getIntegrityStatus(score, criticalIssues) {
    if (criticalIssues > 0) return 'CRITICAL_ISSUES';
    if (score >= 95) return 'EXCELLENT';
    if (score >= 85) return 'GOOD';
    if (score >= 75) return 'ACCEPTABLE';
    return 'NEEDS_ATTENTION';
  }

  /**
   * Generate integrity recommendations
   */
  generateIntegrityRecommendations() {
    const recommendations = [];
    
    if (this.integrityResults.constraints.totalViolations > 0) {
      recommendations.push('Fix database constraint violations to ensure data validity');
    }
    
    if (this.integrityResults.relationships.totalIssues > 0) {
      recommendations.push('Resolve broken relationships and orphaned records');
    }
    
    if (this.integrityResults.consistency.totalIssues > 0) {
      recommendations.push('Address data consistency issues to maintain data quality');
    }
    
    if (this.integrityResults.businessRules.totalViolations > 0) {
      recommendations.push('Ensure compliance with business rules and requirements');
    }
    
    if (this.integrityResults.performance.performanceScore < 80) {
      recommendations.push('Optimize database queries and add appropriate indexes');
    }
    
    if (this.integrityResults.indexes.missingIndexes > 0) {
      recommendations.push('Add recommended database indexes for better performance');
    }
    
    if (this.criticalIssues.length > 0) {
      recommendations.push('URGENT: Address critical issues that compromise data integrity');
    }
    
    return recommendations;
  }

  /**
   * Display integrity results
   */
  displayIntegrityResults() {
    console.log('\n🔍 DATA INTEGRITY CHECK RESULTS');
    console.log('=' .repeat(60));
    
    console.log('\n🚫 CONSTRAINT VIOLATIONS:');
    console.log(`   Total Violations: ${this.integrityResults.constraints.totalViolations}`);
    console.log(`   Unique Constraints: ${this.integrityResults.constraints.uniqueConstraintViolations}`);
    console.log(`   Required Fields: ${this.integrityResults.constraints.requiredFieldViolations}`);
    console.log(`   Data Types: ${this.integrityResults.constraints.dataTypeViolations}`);
    
    console.log('\n🔗 RELATIONSHIP INTEGRITY:');
    console.log(`   Total Issues: ${this.integrityResults.relationships.totalIssues}`);
    console.log(`   Orphaned Records: ${this.integrityResults.relationships.orphanedRecords}`);
    console.log(`   Broken References: ${this.integrityResults.relationships.brokenReferences}`);
    
    console.log('\n📊 DATA CONSISTENCY:');
    console.log(`   Total Issues: ${this.integrityResults.consistency.totalIssues}`);
    console.log(`   Timestamp Issues: ${this.integrityResults.consistency.timestampIssues}`);
    console.log(`   Status Inconsistencies: ${this.integrityResults.consistency.statusInconsistencies}`);
    
    console.log('\n📋 BUSINESS RULES:');
    console.log(`   Total Violations: ${this.integrityResults.businessRules.totalViolations}`);
    console.log(`   Pricing Rules: ${this.integrityResults.businessRules.pricingRuleViolations}`);
    console.log(`   Inventory Rules: ${this.integrityResults.businessRules.inventoryRuleViolations}`);
    
    console.log('\n⚡ PERFORMANCE:');
    console.log(`   Average Query Time: ${this.integrityResults.performance.averageQueryTime}ms`);
    console.log(`   Slow Queries: ${this.integrityResults.performance.slowQueries}`);
    console.log(`   Performance Score: ${this.integrityResults.performance.performanceScore}/100`);
    
    console.log('\n📇 DATABASE INDEXES:');
    console.log(`   Missing Indexes: ${this.integrityResults.indexes.missingIndexes}`);
    console.log(`   Optimization Score: ${this.integrityResults.indexes.indexOptimizationScore}/100`);
    
    console.log('\n📊 OVERALL INTEGRITY:');
    console.log(`   Integrity Score: ${this.integrityResults.overall.overallScore}/100`);
    console.log(`   Status: ${this.getStatusEmoji(this.integrityResults.overall.status)} ${this.integrityResults.overall.status}`);
    console.log(`   Critical Issues: ${this.integrityResults.overall.criticalIssuesCount}`);
    
    if (this.criticalIssues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES:');
      this.criticalIssues.forEach(issue => console.log(`   - ${issue}`));
    }
    
    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.slice(0, 10).forEach(error => console.log(`   - ${error}`));
      if (this.errors.length > 10) {
        console.log(`   ... and ${this.errors.length - 10} more errors`);
      }
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.slice(0, 10).forEach(warning => console.log(`   - ${warning}`));
      if (this.warnings.length > 10) {
        console.log(`   ... and ${this.warnings.length - 10} more warnings`);
      }
    }
    
    if (this.integrityResults.overall.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      this.integrityResults.overall.recommendations.forEach(rec => console.log(`   - ${rec}`));
    }
  }

  /**
   * Get status emoji
   */
  getStatusEmoji(status) {
    const emojis = {
      'EXCELLENT': '🟢',
      'GOOD': '🟡',
      'ACCEPTABLE': '🟡',
      'NEEDS_ATTENTION': '🔴',
      'CRITICAL_ISSUES': '🚨'
    };
    return emojis[status] || '⚪';
  }

  /**
   * Helper method to get nested object values
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key], obj);
  }
}

// Export for use in other scripts
module.exports = DataIntegrityChecker;

// Run integrity check if called directly
if (require.main === module) {
  const checker = new DataIntegrityChecker();
  checker.checkDataIntegrity()
    .then(() => {
      console.log('\n🎉 Data integrity check completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Data integrity check failed:', error);
      process.exit(1);
    });
}