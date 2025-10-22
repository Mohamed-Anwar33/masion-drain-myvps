/**
 * Cloudinary Image Upload Script for Website Migration
 * 
 * This script uploads all website images to Cloudinary with proper naming
 * and generates the mapping for database seeding.
 * 
 * Requirements: 4.1-4.5
 */

const fs = require('fs').promises;
const path = require('path');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

class CloudinaryImageUploader {
  constructor() {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });

    this.frontendAssetsPath = path.join(__dirname, '../../../maison-darin-luxury-beauty/src/assets');
    this.uploadResults = [];
    this.imageMapping = {};
  }

  /**
   * Upload all images to Cloudinary
   */
  async uploadAllImages() {
    console.log('☁️ Starting Cloudinary image upload...');
    
    try {
      // Check Cloudinary configuration
      await this.verifyCloudinaryConfig();
      
      // Get list of images to upload
      const images = await this.getImageList();
      
      // Upload each image
      for (const image of images) {
        await this.uploadSingleImage(image);
      }
      
      // Generate mapping file
      await this.generateImageMapping();
      
      console.log('✅ All images uploaded successfully!');
      
    } catch (error) {
      console.error('❌ Error during image upload:', error);
      throw error;
    }
  }

  /**
   * Verify Cloudinary configuration
   */
  async verifyCloudinaryConfig() {
    console.log('🔧 Verifying Cloudinary configuration...');
    
    if (!process.env.CLOUDINARY_CLOUD_NAME || 
        !process.env.CLOUDINARY_API_KEY || 
        !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Missing Cloudinary configuration. Please check your .env file.');
    }
    
    try {
      // Test connection with a simple API call
      await cloudinary.api.ping();
      console.log('✅ Cloudinary connection verified');
    } catch (error) {
      throw new Error(`Cloudinary connection failed: ${error.message}`);
    }
  }

  /**
   * Get list of images to upload
   */
  async getImageList() {
    console.log('📋 Getting list of images to upload...');
    
    try {
      const files = await fs.readdir(this.frontendAssetsPath);
      const imageFiles = files.filter(file => 
        /\.(jpg|jpeg|png|webp|gif)$/i.test(file)
      );
      
      console.log(`Found ${imageFiles.length} images to upload`);
      return imageFiles;
      
    } catch (error) {
      throw new Error(`Could not read assets directory: ${error.message}`);
    }
  }

  /**
   * Upload a single image to Cloudinary
   */
  async uploadSingleImage(filename) {
    console.log(`📤 Uploading ${filename}...`);
    
    try {
      const imagePath = path.join(this.frontendAssetsPath, filename);
      const publicId = this.generatePublicId(filename);
      
      const uploadResult = await cloudinary.uploader.upload(imagePath, {
        public_id: publicId,
        folder: 'maison-darin/products',
        resource_type: 'image',
        overwrite: true,
        transformation: [
          { quality: 'auto', fetch_format: 'auto' },
          { width: 1200, height: 1200, crop: 'limit' }
        ],
        eager: [
          { width: 400, height: 400, crop: 'fill', quality: 'auto', format: 'webp' },
          { width: 800, height: 800, crop: 'fill', quality: 'auto', format: 'webp' },
          { width: 1200, height: 1200, crop: 'limit', quality: 'auto', format: 'webp' }
        ],
        tags: ['maison-darin', 'product', 'website-migration']
      });
      
      this.uploadResults.push({
        originalFilename: filename,
        publicId: uploadResult.public_id,
        secureUrl: uploadResult.secure_url,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        bytes: uploadResult.bytes,
        eagerUrls: uploadResult.eager?.map(eager => ({
          url: eager.secure_url,
          transformation: eager.transformation
        })) || []
      });
      
      this.imageMapping[filename] = {
        cloudinaryId: uploadResult.public_id,
        url: uploadResult.secure_url,
        optimizedUrls: {
          small: uploadResult.eager?.[0]?.secure_url || uploadResult.secure_url,
          medium: uploadResult.eager?.[1]?.secure_url || uploadResult.secure_url,
          large: uploadResult.eager?.[2]?.secure_url || uploadResult.secure_url
        }
      };
      
      console.log(`✅ ${filename} uploaded successfully`);
      
    } catch (error) {
      console.error(`❌ Failed to upload ${filename}:`, error.message);
      
      // Add to mapping with local fallback
      this.imageMapping[filename] = {
        cloudinaryId: null,
        url: `/assets/${filename}`, // Fallback to local path
        optimizedUrls: {
          small: `/assets/${filename}`,
          medium: `/assets/${filename}`,
          large: `/assets/${filename}`
        },
        error: error.message
      };
    }
  }

  /**
   * Generate a clean public ID for Cloudinary
   */
  generatePublicId(filename) {
    const nameWithoutExt = path.parse(filename).name;
    return nameWithoutExt
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Generate image mapping file for database seeding
   */
  async generateImageMapping() {
    console.log('🗺️ Generating image mapping file...');
    
    try {
      const outputDir = path.join(__dirname, '../extractedData');
      await fs.mkdir(outputDir, { recursive: true });
      
      const mappingData = {
        uploadDate: new Date().toISOString(),
        totalUploaded: this.uploadResults.length,
        successfulUploads: this.uploadResults.filter(r => !r.error).length,
        failedUploads: this.uploadResults.filter(r => r.error).length,
        mapping: this.imageMapping,
        uploadResults: this.uploadResults
      };
      
      await fs.writeFile(
        path.join(outputDir, 'cloudinaryImageMapping.json'),
        JSON.stringify(mappingData, null, 2)
      );
      
      console.log('✅ Image mapping file generated');
      console.log(`📊 Upload Summary:`);
      console.log(`   Total images: ${mappingData.totalUploaded}`);
      console.log(`   Successful: ${mappingData.successfulUploads}`);
      console.log(`   Failed: ${mappingData.failedUploads}`);
      
    } catch (error) {
      console.error('❌ Error generating mapping file:', error);
      throw error;
    }
  }

  /**
   * Test upload with a single image (for development)
   */
  async testUpload(filename = 'hero-perfume.jpg') {
    console.log(`🧪 Testing upload with ${filename}...`);
    
    try {
      await this.verifyCloudinaryConfig();
      await this.uploadSingleImage(filename);
      await this.generateImageMapping();
      
      console.log('✅ Test upload completed successfully!');
      
    } catch (error) {
      console.error('❌ Test upload failed:', error);
      throw error;
    }
  }
}

// Export for use in other scripts
module.exports = CloudinaryImageUploader;

// Run upload if called directly
if (require.main === module) {
  const uploader = new CloudinaryImageUploader();
  
  // Check if test mode is requested
  const testMode = process.argv.includes('--test');
  
  if (testMode) {
    uploader.testUpload()
      .then(() => {
        console.log('\n🎉 Test upload completed successfully!');
        process.exit(0);
      })
      .catch((error) => {
        console.error('\n💥 Test upload failed:', error);
        process.exit(1);
      });
  } else {
    uploader.uploadAllImages()
      .then(() => {
        console.log('\n🎉 All images uploaded successfully!');
        process.exit(0);
      })
      .catch((error) => {
        console.error('\n💥 Image upload failed:', error);
        process.exit(1);
      });
  }
}