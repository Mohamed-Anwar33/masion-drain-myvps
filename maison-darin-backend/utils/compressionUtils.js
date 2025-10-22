const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

/**
 * File and image compression utilities
 */
class CompressionUtils {
  constructor() {
    this.imageFormats = {
      jpeg: { quality: 85, progressive: true },
      webp: { quality: 80, effort: 4 },
      png: { compressionLevel: 8, progressive: true },
      avif: { quality: 75, effort: 4 }
    };
    
    this.imageSizes = {
      thumbnail: { width: 150, height: 150 },
      small: { width: 300, height: 300 },
      medium: { width: 600, height: 600 },
      large: { width: 1200, height: 1200 },
      original: null // Keep original size
    };
  }

  /**
   * Compress and optimize image with multiple formats and sizes
   */
  async optimizeImage(inputPath, outputDir, filename) {
    try {
      const results = {};
      const image = sharp(inputPath);
      const metadata = await image.metadata();
      
      logger.info('Starting image optimization', {
        filename,
        originalSize: metadata.size,
        format: metadata.format,
        dimensions: `${metadata.width}x${metadata.height}`
      });

      // Generate different sizes and formats
      for (const [sizeName, dimensions] of Object.entries(this.imageSizes)) {
        for (const [format, options] of Object.entries(this.imageFormats)) {
          const outputFilename = `${filename}_${sizeName}.${format}`;
          const outputPath = path.join(outputDir, outputFilename);
          
          let pipeline = image.clone();
          
          // Resize if dimensions specified
          if (dimensions) {
            pipeline = pipeline.resize(dimensions.width, dimensions.height, {
              fit: 'cover',
              position: 'center'
            });
          }
          
          // Apply format-specific optimizations
          switch (format) {
            case 'jpeg':
              pipeline = pipeline.jpeg(options);
              break;
            case 'webp':
              pipeline = pipeline.webp(options);
              break;
            case 'png':
              pipeline = pipeline.png(options);
              break;
            case 'avif':
              pipeline = pipeline.avif(options);
              break;
          }
          
          // Save optimized image
          await pipeline.toFile(outputPath);
          
          // Get file stats
          const stats = await fs.stat(outputPath);
          
          if (!results[sizeName]) {
            results[sizeName] = {};
          }
          
          results[sizeName][format] = {
            path: outputPath,
            filename: outputFilename,
            size: stats.size,
            compressionRatio: metadata.size ? (1 - stats.size / metadata.size) * 100 : 0
          };
        }
      }
      
      logger.info('Image optimization completed', {
        filename,
        formats: Object.keys(this.imageFormats).length,
        sizes: Object.keys(this.imageSizes).length
      });
      
      return results;
    } catch (error) {
      logger.error('Image optimization failed', {
        filename,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Generate responsive image srcset
   */
  generateSrcSet(optimizedImages, format = 'webp') {
    const srcSet = [];
    
    for (const [sizeName, formats] of Object.entries(optimizedImages)) {
      if (formats[format] && this.imageSizes[sizeName]) {
        const { width } = this.imageSizes[sizeName];
        srcSet.push(`${formats[format].filename} ${width}w`);
      }
    }
    
    return srcSet.join(', ');
  }

  /**
   * Get best format for browser support
   */
  getBestFormat(acceptHeader = '') {
    if (acceptHeader.includes('image/avif')) {
      return 'avif';
    } else if (acceptHeader.includes('image/webp')) {
      return 'webp';
    } else {
      return 'jpeg';
    }
  }

  /**
   * Compress JSON data
   */
  compressJSON(data) {
    try {
      // Remove unnecessary whitespace and format
      const compressed = JSON.stringify(data, null, 0);
      
      // Calculate compression ratio
      const original = JSON.stringify(data, null, 2);
      const compressionRatio = (1 - compressed.length / original.length) * 100;
      
      return {
        compressed,
        originalSize: original.length,
        compressedSize: compressed.length,
        compressionRatio
      };
    } catch (error) {
      logger.error('JSON compression failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Optimize CSS by removing comments and unnecessary whitespace
   */
  optimizeCSS(css) {
    try {
      let optimized = css
        // Remove comments
        .replace(/\/\*[\s\S]*?\*\//g, '')
        // Remove unnecessary whitespace
        .replace(/\s+/g, ' ')
        // Remove whitespace around specific characters
        .replace(/\s*([{}:;,>+~])\s*/g, '$1')
        // Remove trailing semicolons
        .replace(/;}/g, '}')
        // Remove empty rules
        .replace(/[^{}]+{\s*}/g, '')
        .trim();
      
      const compressionRatio = (1 - optimized.length / css.length) * 100;
      
      return {
        optimized,
        originalSize: css.length,
        optimizedSize: optimized.length,
        compressionRatio
      };
    } catch (error) {
      logger.error('CSS optimization failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Optimize JavaScript by removing comments and unnecessary whitespace
   */
  optimizeJS(js) {
    try {
      let optimized = js
        // Remove single-line comments (but preserve URLs)
        .replace(/(?<!:)\/\/.*$/gm, '')
        // Remove multi-line comments
        .replace(/\/\*[\s\S]*?\*\//g, '')
        // Remove unnecessary whitespace
        .replace(/\s+/g, ' ')
        // Remove whitespace around operators and punctuation
        .replace(/\s*([{}();,=+\-*/<>!&|])\s*/g, '$1')
        .trim();
      
      const compressionRatio = (1 - optimized.length / js.length) * 100;
      
      return {
        optimized,
        originalSize: js.length,
        optimizedSize: optimized.length,
        compressionRatio
      };
    } catch (error) {
      logger.error('JavaScript optimization failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get compression statistics
   */
  getCompressionStats(original, compressed) {
    const originalSize = typeof original === 'string' ? original.length : original;
    const compressedSize = typeof compressed === 'string' ? compressed.length : compressed;
    
    return {
      originalSize,
      compressedSize,
      savedBytes: originalSize - compressedSize,
      compressionRatio: ((originalSize - compressedSize) / originalSize * 100).toFixed(2) + '%',
      sizeReduction: (compressedSize / originalSize).toFixed(2)
    };
  }

  /**
   * Batch optimize images in directory
   */
  async batchOptimizeImages(inputDir, outputDir) {
    try {
      const files = await fs.readdir(inputDir);
      const imageFiles = files.filter(file => 
        /\.(jpg|jpeg|png|gif|bmp|tiff)$/i.test(file)
      );
      
      const results = [];
      
      for (const file of imageFiles) {
        const inputPath = path.join(inputDir, file);
        const filename = path.parse(file).name;
        
        try {
          const result = await this.optimizeImage(inputPath, outputDir, filename);
          results.push({ file, success: true, result });
        } catch (error) {
          results.push({ file, success: false, error: error.message });
        }
      }
      
      logger.info('Batch image optimization completed', {
        totalFiles: imageFiles.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      });
      
      return results;
    } catch (error) {
      logger.error('Batch image optimization failed', { error: error.message });
      throw error;
    }
  }
}

module.exports = new CompressionUtils();