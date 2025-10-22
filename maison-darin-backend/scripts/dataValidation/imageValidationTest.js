/**
 * Image Validation and Cloudinary Integration Test
 * 
 * This script specifically tests image uploads and Cloudinary integration:
 * - Tests image URL accessibility
 * - Validates image optimization
 * - Checks image metadata
 * - Tests different image transformations
 * 
 * Requirements: 4.1-4.5
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs').promises;
const axios = require('axios');
const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const Product = require('../../models/Product');
const Media = require('../../models/Media');

class ImageValidationTest {
  constructor() {
    this.testResults = {
      urlAccessibility: {},
      optimization: {},
      metadata: {},
      transformations: {},
      performance: {},
      overall: {}
    };
    this.errors = [];
    this.warnings = [];
    
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
  }

  /**
   * Main image validation method
   */
  async validateImages() {
    console.log('🖼️  Starting image validation and Cloudinary integration test...');
    console.log('=' .repeat(60));
    
    try {
      // Connect to database
      await this.connectToDatabase();
      
      // Run all image validation tests
      await this.testImageUrlAccessibility();
      await this.testImageOptimization();
      await this.testImageMetadata();
      await this.testImageTransformations();
      await this.testImagePerformance();
      
      // Generate image validation report
      await this.generateImageValidationReport();
      
      // Display results
      this.displayImageValidationResults();
      
      console.log('✅ Image validation completed successfully!');
      
    } catch (error) {
      console.error('❌ Error during image validation:', error);
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
    console.log('✅ Connected to MongoDB for image validation');
  }

  /**
   * Test image URL accessibility
   */
  async testImageUrlAccessibility() {
    console.log('🔍 Testing image URL accessibility...');
    
    const products = await Product.find({});
    const mediaFiles = await Media.find({});
    
    let totalUrls = 0;
    let accessibleUrls = 0;
    let cloudinaryUrls = 0;
    let httpsUrls = 0;
    let responseTimes = [];
    
    // Test product images
    for (const product of products) {
      if (product.images) {
        for (const image of product.images) {
          totalUrls++;
          
          if (image.url) {
            // Check if it's a Cloudinary URL
            if (image.url.includes('cloudinary.com')) {
              cloudinaryUrls++;
            }
            
            // Check if it's HTTPS
            if (image.url.startsWith('https://')) {
              httpsUrls++;
            }
            
            // Test accessibility
            try {
              const startTime = Date.now();
              const response = await axios.head(image.url, { 
                timeout: 10000,
                headers: {
                  'User-Agent': 'Maison-Darin-Validator/1.0'
                }
              });
              const responseTime = Date.now() - startTime;
              responseTimes.push(responseTime);
              
              if (response.status === 200) {
                accessibleUrls++;
              } else {
                this.warnings.push(`Image URL returned status ${response.status}: ${image.url}`);
              }
            } catch (error) {
              this.errors.push(`Image URL not accessible: ${image.url} - ${error.message}`);
            }
          }
        }
      }
    }
    
    // Test media collection images
    for (const media of mediaFiles) {
      if (media.cloudinaryUrl) {
        totalUrls++;
        cloudinaryUrls++;
        
        if (media.cloudinaryUrl.startsWith('https://')) {
          httpsUrls++;
        }
        
        try {
          const startTime = Date.now();
          const response = await axios.head(media.cloudinaryUrl, { timeout: 10000 });
          const responseTime = Date.now() - startTime;
          responseTimes.push(responseTime);
          
          if (response.status === 200) {
            accessibleUrls++;
          }
        } catch (error) {
          this.errors.push(`Media URL not accessible: ${media.cloudinaryUrl} - ${error.message}`);
        }
      }
    }
    
    this.testResults.urlAccessibility = {
      totalUrls,
      accessibleUrls,
      cloudinaryUrls,
      httpsUrls,
      averageResponseTime: responseTimes.length > 0 ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : 0,
      accessibilityRate: totalUrls > 0 ? (accessibleUrls / totalUrls * 100).toFixed(1) : '0',
      cloudinaryRate: totalUrls > 0 ? (cloudinaryUrls / totalUrls * 100).toFixed(1) : '0',
      httpsRate: totalUrls > 0 ? (httpsUrls / totalUrls * 100).toFixed(1) : '0'
    };
    
    console.log('✅ Image URL accessibility test completed');
  }

  /**
   * Test image optimization
   */
  async testImageOptimization() {
    console.log('🔍 Testing image optimization...');
    
    const products = await Product.find({});
    
    let totalImages = 0;
    let optimizedImages = 0;
    let webpSupport = 0;
    let multipleFormats = 0;
    let responsiveImages = 0;
    
    for (const product of products) {
      if (product.images) {
        for (const image of product.images) {
          totalImages++;
          
          // Check for optimized URLs
          if (image.optimizedUrls) {
            optimizedImages++;
            
            // Check for WebP support
            if (image.optimizedUrls.webp) {
              webpSupport++;
            }
            
            // Check for multiple formats
            const formats = Object.keys(image.optimizedUrls);
            if (formats.length > 1) {
              multipleFormats++;
            }
            
            // Check for responsive sizes
            if (image.optimizedUrls.small && image.optimizedUrls.medium && image.optimizedUrls.large) {
              responsiveImages++;
            }
          }
        }
      }
    }
    
    this.testResults.optimization = {
      totalImages,
      optimizedImages,
      webpSupport,
      multipleFormats,
      responsiveImages,
      optimizationRate: totalImages > 0 ? (optimizedImages / totalImages * 100).toFixed(1) : '0',
      webpRate: totalImages > 0 ? (webpSupport / totalImages * 100).toFixed(1) : '0',
      responsiveRate: totalImages > 0 ? (responsiveImages / totalImages * 100).toFixed(1) : '0'
    };
    
    console.log('✅ Image optimization test completed');
  }

  /**
   * Test image metadata
   */
  async testImageMetadata() {
    console.log('🔍 Testing image metadata...');
    
    const products = await Product.find({});
    const mediaFiles = await Media.find({});
    
    let totalImages = 0;
    let imagesWithAltText = 0;
    let imagesWithDimensions = 0;
    let imagesWithFileSize = 0;
    let imagesWithCloudinaryId = 0;
    
    // Test product images
    for (const product of products) {
      if (product.images) {
        for (const image of product.images) {
          totalImages++;
          
          if (image.alt && image.alt.en && image.alt.ar) {
            imagesWithAltText++;
          }
          
          if (image.width && image.height) {
            imagesWithDimensions++;
          }
          
          if (image.cloudinaryId) {
            imagesWithCloudinaryId++;
          }
        }
      }
    }
    
    // Test media files
    for (const media of mediaFiles) {
      totalImages++;
      
      if (media.alt && media.alt.en && media.alt.ar) {
        imagesWithAltText++;
      }
      
      if (media.width && media.height) {
        imagesWithDimensions++;
      }
      
      if (media.size) {
        imagesWithFileSize++;
      }
      
      if (media.cloudinaryId) {
        imagesWithCloudinaryId++;
      }
    }
    
    this.testResults.metadata = {
      totalImages,
      imagesWithAltText,
      imagesWithDimensions,
      imagesWithFileSize,
      imagesWithCloudinaryId,
      altTextRate: totalImages > 0 ? (imagesWithAltText / totalImages * 100).toFixed(1) : '0',
      dimensionsRate: totalImages > 0 ? (imagesWithDimensions / totalImages * 100).toFixed(1) : '0',
      fileSizeRate: totalImages > 0 ? (imagesWithFileSize / totalImages * 100).toFixed(1) : '0',
      cloudinaryIdRate: totalImages > 0 ? (imagesWithCloudinaryId / totalImages * 100).toFixed(1) : '0'
    };
    
    console.log('✅ Image metadata test completed');
  }

  /**
   * Test image transformations
   */
  async testImageTransformations() {
    console.log('🔍 Testing image transformations...');
    
    const products = await Product.find({}).limit(3); // Test with first 3 products
    
    let transformationTests = 0;
    let successfulTransformations = 0;
    let testedTransformations = [];
    
    for (const product of products) {
      if (product.images && product.images.length > 0) {
        const image = product.images[0];
        
        if (image.cloudinaryId) {
          // Test different transformations
          const transformations = [
            { width: 400, height: 400, crop: 'fill' },
            { width: 800, quality: 'auto', format: 'webp' },
            { width: 200, height: 200, crop: 'thumb', gravity: 'face' }
          ];
          
          for (const transform of transformations) {
            transformationTests++;
            
            try {
              const transformedUrl = cloudinary.url(image.cloudinaryId, transform);
              
              // Test if transformed URL is accessible
              const response = await axios.head(transformedUrl, { timeout: 5000 });
              if (response.status === 200) {
                successfulTransformations++;
                testedTransformations.push({
                  cloudinaryId: image.cloudinaryId,
                  transformation: transform,
                  url: transformedUrl,
                  success: true
                });
              }
            } catch (error) {
              testedTransformations.push({
                cloudinaryId: image.cloudinaryId,
                transformation: transform,
                success: false,
                error: error.message
              });
            }
          }
        }
      }
    }
    
    this.testResults.transformations = {
      transformationTests,
      successfulTransformations,
      testedTransformations,
      successRate: transformationTests > 0 ? (successfulTransformations / transformationTests * 100).toFixed(1) : '0'
    };
    
    console.log('✅ Image transformations test completed');
  }

  /**
   * Test image performance
   */
  async testImagePerformance() {
    console.log('🔍 Testing image performance...');
    
    const products = await Product.find({}).limit(5);
    
    let totalLoadTests = 0;
    let fastLoads = 0; // < 1000ms
    let mediumLoads = 0; // 1000-3000ms
    let slowLoads = 0; // > 3000ms
    let loadTimes = [];
    
    for (const product of products) {
      if (product.images) {
        for (const image of product.images) {
          if (image.url) {
            totalLoadTests++;
            
            try {
              const startTime = Date.now();
              await axios.get(image.url, { 
                timeout: 10000,
                responseType: 'stream'
              });
              const loadTime = Date.now() - startTime;
              loadTimes.push(loadTime);
              
              if (loadTime < 1000) {
                fastLoads++;
              } else if (loadTime < 3000) {
                mediumLoads++;
              } else {
                slowLoads++;
              }
            } catch (error) {
              slowLoads++;
              this.warnings.push(`Image load test failed: ${image.url}`);
            }
          }
        }
      }
    }
    
    this.testResults.performance = {
      totalLoadTests,
      fastLoads,
      mediumLoads,
      slowLoads,
      averageLoadTime: loadTimes.length > 0 ? Math.round(loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length) : 0,
      fastLoadRate: totalLoadTests > 0 ? (fastLoads / totalLoadTests * 100).toFixed(1) : '0',
      performanceScore: this.calculatePerformanceScore(fastLoads, mediumLoads, slowLoads, totalLoadTests)
    };
    
    console.log('✅ Image performance test completed');
  }

  /**
   * Calculate performance score
   */
  calculatePerformanceScore(fast, medium, slow, total) {
    if (total === 0) return 0;
    
    const fastWeight = 100;
    const mediumWeight = 70;
    const slowWeight = 30;
    
    const score = (fast * fastWeight + medium * mediumWeight + slow * slowWeight) / total;
    return Math.round(score);
  }

  /**
   * Generate image validation report
   */
  async generateImageValidationReport() {
    console.log('📋 Generating image validation report...');
    
    const overallScore = this.calculateOverallImageScore();
    
    this.testResults.overall = {
      validationDate: new Date().toISOString(),
      overallScore,
      status: this.getStatusFromScore(overallScore),
      totalErrors: this.errors.length,
      totalWarnings: this.warnings.length,
      errors: this.errors,
      warnings: this.warnings,
      recommendations: this.generateImageRecommendations()
    };
    
    const report = {
      imageValidationReport: {
        ...this.testResults,
        summary: {
          cloudinaryIntegration: parseFloat(this.testResults.urlAccessibility.cloudinaryRate) > 90 ? 'EXCELLENT' : 'GOOD',
          imageOptimization: parseFloat(this.testResults.optimization.optimizationRate) > 80 ? 'GOOD' : 'NEEDS_IMPROVEMENT',
          metadataCompleteness: parseFloat(this.testResults.metadata.altTextRate) > 90 ? 'EXCELLENT' : 'GOOD',
          performanceRating: this.testResults.performance.performanceScore > 80 ? 'GOOD' : 'NEEDS_IMPROVEMENT'
        }
      }
    };
    
    // Save image validation report
    await fs.writeFile(
      path.join(__dirname, '../extractedData/imageValidationReport.json'),
      JSON.stringify(report, null, 2)
    );
    
    console.log('✅ Image validation report generated');
  }

  /**
   * Calculate overall image score
   */
  calculateOverallImageScore() {
    const weights = {
      accessibility: 30,
      optimization: 25,
      metadata: 25,
      performance: 20
    };
    
    const scores = {
      accessibility: parseFloat(this.testResults.urlAccessibility.accessibilityRate),
      optimization: parseFloat(this.testResults.optimization.optimizationRate),
      metadata: parseFloat(this.testResults.metadata.altTextRate),
      performance: this.testResults.performance.performanceScore
    };
    
    let weightedScore = 0;
    for (const [category, weight] of Object.entries(weights)) {
      weightedScore += (scores[category] * weight) / 100;
    }
    
    return Math.round(weightedScore);
  }

  /**
   * Get status from score
   */
  getStatusFromScore(score) {
    if (score >= 90) return 'EXCELLENT';
    if (score >= 80) return 'GOOD';
    if (score >= 70) return 'ACCEPTABLE';
    return 'NEEDS_IMPROVEMENT';
  }

  /**
   * Generate image-specific recommendations
   */
  generateImageRecommendations() {
    const recommendations = [];
    
    if (parseFloat(this.testResults.urlAccessibility.accessibilityRate) < 95) {
      recommendations.push('Fix inaccessible image URLs to ensure all images load properly');
    }
    
    if (parseFloat(this.testResults.optimization.webpRate) < 80) {
      recommendations.push('Enable WebP format for better image compression and performance');
    }
    
    if (parseFloat(this.testResults.metadata.altTextRate) < 100) {
      recommendations.push('Add alt text to all images for better accessibility and SEO');
    }
    
    if (this.testResults.performance.performanceScore < 80) {
      recommendations.push('Optimize image sizes and compression to improve loading performance');
    }
    
    if (parseFloat(this.testResults.transformations.successRate) < 90) {
      recommendations.push('Check Cloudinary configuration and API credentials for transformation issues');
    }
    
    return recommendations;
  }

  /**
   * Display image validation results
   */
  displayImageValidationResults() {
    console.log('\n🖼️  IMAGE VALIDATION RESULTS');
    console.log('=' .repeat(60));
    
    console.log('\n🔗 URL ACCESSIBILITY:');
    console.log(`   Total URLs: ${this.testResults.urlAccessibility.totalUrls}`);
    console.log(`   Accessible: ${this.testResults.urlAccessibility.accessibilityRate}%`);
    console.log(`   Cloudinary Hosted: ${this.testResults.urlAccessibility.cloudinaryRate}%`);
    console.log(`   HTTPS Secure: ${this.testResults.urlAccessibility.httpsRate}%`);
    console.log(`   Avg Response Time: ${this.testResults.urlAccessibility.averageResponseTime}ms`);
    
    console.log('\n⚡ OPTIMIZATION:');
    console.log(`   Optimized Images: ${this.testResults.optimization.optimizationRate}%`);
    console.log(`   WebP Support: ${this.testResults.optimization.webpRate}%`);
    console.log(`   Responsive Images: ${this.testResults.optimization.responsiveRate}%`);
    
    console.log('\n📋 METADATA:');
    console.log(`   Alt Text Coverage: ${this.testResults.metadata.altTextRate}%`);
    console.log(`   Dimensions Available: ${this.testResults.metadata.dimensionsRate}%`);
    console.log(`   Cloudinary IDs: ${this.testResults.metadata.cloudinaryIdRate}%`);
    
    console.log('\n🔄 TRANSFORMATIONS:');
    console.log(`   Transformation Tests: ${this.testResults.transformations.transformationTests}`);
    console.log(`   Success Rate: ${this.testResults.transformations.successRate}%`);
    
    console.log('\n🚀 PERFORMANCE:');
    console.log(`   Fast Loads (<1s): ${this.testResults.performance.fastLoadRate}%`);
    console.log(`   Average Load Time: ${this.testResults.performance.averageLoadTime}ms`);
    console.log(`   Performance Score: ${this.testResults.performance.performanceScore}/100`);
    
    console.log('\n📊 OVERALL IMAGE SCORE:');
    console.log(`   Score: ${this.testResults.overall.overallScore}/100`);
    console.log(`   Status: ${this.getStatusEmoji(this.testResults.overall.status)} ${this.testResults.overall.status}`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach(warning => console.log(`   - ${warning}`));
    }
    
    if (this.testResults.overall.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      this.testResults.overall.recommendations.forEach(rec => console.log(`   - ${rec}`));
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
      'NEEDS_IMPROVEMENT': '🔴'
    };
    return emojis[status] || '⚪';
  }
}

// Export for use in other scripts
module.exports = ImageValidationTest;

// Run validation if called directly
if (require.main === module) {
  const validator = new ImageValidationTest();
  validator.validateImages()
    .then(() => {
      console.log('\n🎉 Image validation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Image validation failed:', error);
      process.exit(1);
    });
}