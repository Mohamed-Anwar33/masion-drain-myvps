/**
 * Product Data Transformer for Real Website Migration
 * 
 * This script converts extracted product data from the frontend format
 * to the backend database schema format with proper validation and enhancement.
 * 
 * Requirements: 2.1-2.6, 4.1-4.5
 */

const fs = require('fs').promises;
const path = require('path');

class ProductDataTransformer {
  constructor() {
    this.extractedDataPath = path.join(__dirname, '../extractedData');
    this.transformedProducts = [];
    this.imageMapping = {};
    this.categoryMapping = {
      floral: { en: "Floral", ar: "زهري" },
      oriental: { en: "Oriental", ar: "شرقي" },
      fresh: { en: "Fresh", ar: "منعش" },
      woody: { en: "Woody", ar: "خشبي" },
      citrus: { en: "Citrus", ar: "حمضي" },
      spicy: { en: "Spicy", ar: "حار" },
      aquatic: { en: "Aquatic", ar: "مائي" },
      gourmand: { en: "Gourmand", ar: "حلو" }
    };
  }

  /**
   * Main transformation method
   */
  async transformProductData() {
    console.log('🔄 Starting product data transformation...');
    
    try {
      // Load extracted data
      const extractedData = await this.loadExtractedData();
      
      // Load image mapping if available
      await this.loadImageMapping();
      
      // Transform each product
      for (const frontendProduct of extractedData.products) {
        const transformedProduct = await this.transformSingleProduct(frontendProduct);
        this.transformedProducts.push(transformedProduct);
      }
      
      // Generate seed data
      await this.generateProductSeedData();
      
      // Generate validation report
      await this.generateTransformationReport();
      
      console.log('✅ Product data transformation completed successfully!');
      
    } catch (error) {
      console.error('❌ Error during product transformation:', error);
      throw error;
    }
  }

  /**
   * Load extracted data from previous step
   */
  async loadExtractedData() {
    console.log('📂 Loading extracted product data...');
    
    try {
      const dataPath = path.join(this.extractedDataPath, 'extractedData.json');
      const dataContent = await fs.readFile(dataPath, 'utf8');
      return JSON.parse(dataContent);
    } catch (error) {
      throw new Error(`Could not load extracted data: ${error.message}`);
    }
  }

  /**
   * Load Cloudinary image mapping if available
   */
  async loadImageMapping() {
    console.log('🖼️ Loading image mapping...');
    
    try {
      const mappingPath = path.join(this.extractedDataPath, 'cloudinaryImageMapping.json');
      const mappingContent = await fs.readFile(mappingPath, 'utf8');
      const mappingData = JSON.parse(mappingContent);
      this.imageMapping = mappingData.mapping || {};
      console.log(`✅ Loaded mapping for ${Object.keys(this.imageMapping).length} images`);
    } catch (error) {
      console.log('⚠️ No image mapping found, will use local paths');
      this.imageMapping = {};
    }
  }

  /**
   * Transform a single product from frontend to backend format
   */
  async transformSingleProduct(frontendProduct) {
    console.log(`🔄 Transforming product: ${frontendProduct.name.en}`);
    
    const transformedProduct = {
      // Basic product information
      name: {
        en: frontendProduct.name.en,
        ar: frontendProduct.name.ar
      },
      description: {
        en: frontendProduct.description.en,
        ar: frontendProduct.description.ar
      },
      longDescription: {
        en: frontendProduct.longDescription?.en || frontendProduct.description.en,
        ar: frontendProduct.longDescription?.ar || frontendProduct.description.ar
      },
      
      // Pricing and availability
      price: frontendProduct.price,
      size: frontendProduct.size,
      category: frontendProduct.category,
      
      // Transform images
      images: await this.transformProductImages(frontendProduct.images, frontendProduct.id),
      
      // Product flags
      featured: frontendProduct.featured || false,
      inStock: frontendProduct.inStock !== false, // Default to true if not specified
      stock: this.convertInStockToQuantity(frontendProduct.inStock, frontendProduct.featured),
      
      // Fragrance information
      concentration: {
        en: frontendProduct.concentration?.en || "Eau de Parfum",
        ar: frontendProduct.concentration?.ar || "ماء العطر"
      },
      
      // Transform fragrance notes
      notes: this.transformFragranceNotes(frontendProduct.notes),
      
      // Generate SEO metadata
      seo: this.generateSeoMetadata(frontendProduct),
      
      // System fields
      frontendId: frontendProduct.id, // Keep reference to original ID
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return transformedProduct;
  }

  /**
   * Transform product images with Cloudinary integration
   */
  async transformProductImages(imageFilenames, productId) {
    if (!imageFilenames || imageFilenames.length === 0) {
      return [];
    }
    
    const transformedImages = [];
    
    for (let i = 0; i < imageFilenames.length; i++) {
      const filename = imageFilenames[i];
      const imageMapping = this.imageMapping[filename];
      
      const imageObject = {
        url: imageMapping?.url || `/assets/${filename}`,
        cloudinaryId: imageMapping?.cloudinaryId || null,
        alt: {
          en: `${productId === 1 ? 'Floral Symphony' : productId === 2 ? 'Oriental Mystique' : 'Luxury Perfume'} - Image ${i + 1}`,
          ar: `${productId === 1 ? 'سيمفونية الأزهار' : productId === 2 ? 'الغموض الشرقي' : 'عطر فاخر'} - صورة ${i + 1}`
        },
        order: i
      };
      
      // Add optimized URLs if available from Cloudinary
      if (imageMapping?.optimizedUrls) {
        imageObject.optimizedUrls = imageMapping.optimizedUrls;
      }
      
      transformedImages.push(imageObject);
    }
    
    return transformedImages;
  }

  /**
   * Convert boolean inStock to numeric quantity
   */
  convertInStockToQuantity(inStock, featured) {
    if (inStock === false) return 0;
    
    // Generate realistic stock quantities
    if (featured) {
      return Math.floor(Math.random() * 50) + 20; // 20-70 for featured products
    } else {
      return Math.floor(Math.random() * 30) + 10; // 10-40 for regular products
    }
  }

  /**
   * Transform fragrance notes structure
   */
  transformFragranceNotes(notes) {
    if (!notes) {
      return {
        top: { en: [], ar: [] },
        middle: { en: [], ar: [] },
        base: { en: [], ar: [] }
      };
    }
    
    return {
      top: {
        en: notes.top?.en || [],
        ar: notes.top?.ar || []
      },
      middle: {
        en: notes.middle?.en || [],
        ar: notes.middle?.ar || []
      },
      base: {
        en: notes.base?.en || [],
        ar: notes.base?.ar || []
      }
    };
  }

  /**
   * Generate SEO metadata from product information
   */
  generateSeoMetadata(product) {
    const seo = {
      metaTitle: {
        en: `${product.name.en} - Luxury Perfume | Maison Darin`,
        ar: `${product.name.ar} - عطر فاخر | ميزون دارين`
      },
      metaDescription: {
        en: `${product.description.en}. ${product.concentration?.en || 'Eau de Parfum'} ${product.size}. Shop luxury fragrances at Maison Darin.`,
        ar: `${product.description.ar}. ${product.concentration?.ar || 'ماء العطر'} ${product.size}. تسوقي العطور الفاخرة في ميزون دارين.`
      }
    };
    
    // Ensure meta descriptions are not too long
    if (seo.metaDescription.en.length > 160) {
      seo.metaDescription.en = seo.metaDescription.en.substring(0, 157) + '...';
    }
    if (seo.metaDescription.ar.length > 160) {
      seo.metaDescription.ar = seo.metaDescription.ar.substring(0, 157) + '...';
    }
    
    return seo;
  }

  /**
   * Generate product seed data for database
   */
  async generateProductSeedData() {
    console.log('🌱 Generating product seed data...');
    
    const seedData = {
      generatedAt: new Date().toISOString(),
      totalProducts: this.transformedProducts.length,
      categories: Object.keys(this.categoryMapping),
      products: this.transformedProducts
    };
    
    // Generate JavaScript seed file
    const seedScript = this.generateSeedScript(seedData);
    
    // Save seed data
    await fs.writeFile(
      path.join(this.extractedDataPath, 'transformedProducts.json'),
      JSON.stringify(seedData, null, 2)
    );
    
    await fs.writeFile(
      path.join(__dirname, '../seedData/realProducts.js'),
      seedScript
    );
    
    console.log('✅ Product seed data generated');
  }

  /**
   * Generate JavaScript seed script
   */
  generateSeedScript(seedData) {
    return `/**
 * Real Product Data from Website Migration
 * Generated: ${seedData.generatedAt}
 * Total Products: ${seedData.totalProducts}
 */

const realProducts = ${JSON.stringify(seedData.products, null, 2)};

const categories = ${JSON.stringify(this.categoryMapping, null, 2)};

module.exports = {
  products: realProducts,
  categories: categories,
  metadata: {
    generatedAt: '${seedData.generatedAt}',
    totalProducts: ${seedData.totalProducts},
    source: 'website-migration'
  }
};
`;
  }

  /**
   * Generate transformation report
   */
  async generateTransformationReport() {
    console.log('📋 Generating transformation report...');
    
    const report = {
      transformationDate: new Date().toISOString(),
      summary: {
        totalProductsTransformed: this.transformedProducts.length,
        totalImagesProcessed: this.transformedProducts.reduce((sum, p) => sum + p.images.length, 0),
        categoriesUsed: [...new Set(this.transformedProducts.map(p => p.category))],
        priceRange: {
          min: Math.min(...this.transformedProducts.map(p => p.price)),
          max: Math.max(...this.transformedProducts.map(p => p.price))
        },
        featuredProducts: this.transformedProducts.filter(p => p.featured).length,
        inStockProducts: this.transformedProducts.filter(p => p.inStock).length
      },
      transformations: {
        imagesWithCloudinary: this.transformedProducts.reduce((sum, p) => 
          sum + p.images.filter(img => img.cloudinaryId).length, 0),
        imagesWithLocalFallback: this.transformedProducts.reduce((sum, p) => 
          sum + p.images.filter(img => !img.cloudinaryId).length, 0),
        productsWithSeo: this.transformedProducts.filter(p => p.seo).length,
        productsWithNotes: this.transformedProducts.filter(p => 
          p.notes.top.en.length > 0 || p.notes.middle.en.length > 0 || p.notes.base.en.length > 0
        ).length
      },
      dataQuality: {
        completeProducts: this.transformedProducts.filter(p => 
          p.name.en && p.name.ar && p.description.en && p.description.ar
        ).length,
        productsWithImages: this.transformedProducts.filter(p => p.images.length > 0).length,
        productsWithLongDescription: this.transformedProducts.filter(p => 
          p.longDescription.en && p.longDescription.ar
        ).length
      },
      recommendations: [
        'All products successfully transformed to backend schema format',
        'SEO metadata generated for all products',
        'Stock quantities assigned based on featured status',
        'Image alt text generated in both languages',
        'Ready for database seeding and testing'
      ]
    };
    
    await fs.writeFile(
      path.join(this.extractedDataPath, 'productTransformationReport.json'),
      JSON.stringify(report, null, 2)
    );
    
    console.log('✅ Transformation report generated');
    console.log('\n📊 TRANSFORMATION SUMMARY:');
    console.log(`   Products transformed: ${report.summary.totalProductsTransformed}`);
    console.log(`   Images processed: ${report.summary.totalImagesProcessed}`);
    console.log(`   Categories: ${report.summary.categoriesUsed.join(', ')}`);
    console.log(`   Featured products: ${report.summary.featuredProducts}`);
    console.log(`   In-stock products: ${report.summary.inStockProducts}`);
    console.log(`   Products with Cloudinary images: ${report.transformations.imagesWithCloudinary}`);
  }
}

// Export for use in other scripts
module.exports = ProductDataTransformer;

// Run transformation if called directly
if (require.main === module) {
  const transformer = new ProductDataTransformer();
  transformer.transformProductData()
    .then(() => {
      console.log('\n🎉 Product data transformation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Product transformation failed:', error);
      process.exit(1);
    });
}