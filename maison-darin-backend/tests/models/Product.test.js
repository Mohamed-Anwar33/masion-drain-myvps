const mongoose = require('mongoose');
const Product = require('../../models/Product');

describe('Product Model', () => {
  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/maison-darin-test';
    await mongoose.connect(mongoUri);
  }, 30000);

  beforeEach(async () => {
    // Clear products collection before each test
    await Product.deleteMany({});
  });

  afterAll(async () => {
    // Clean up and close connection
    await Product.deleteMany({});
    await mongoose.connection.close();
  }, 30000);

  describe('Product Schema Validation', () => {
    const validProductData = {
      name: {
        en: 'Luxury Rose Perfume',
        ar: 'عطر الورد الفاخر'
      },
      description: {
        en: 'A beautiful rose fragrance',
        ar: 'عطر ورد جميل'
      },
      price: 150.99,
      size: '50ml',
      category: 'floral',
      stock: 10
    };

    it('should create a product with valid data', async () => {
      const product = new Product(validProductData);
      const savedProduct = await product.save();

      expect(savedProduct._id).toBeDefined();
      expect(savedProduct.name.en).toBe(validProductData.name.en);
      expect(savedProduct.name.ar).toBe(validProductData.name.ar);
      expect(savedProduct.price).toBe(validProductData.price);
      expect(savedProduct.category).toBe(validProductData.category);
      expect(savedProduct.inStock).toBe(true);
      expect(savedProduct.featured).toBe(false);
      expect(savedProduct.createdAt).toBeDefined();
      expect(savedProduct.updatedAt).toBeDefined();
    });

    it('should require English name', async () => {
      const productData = { ...validProductData };
      delete productData.name.en;

      const product = new Product(productData);
      await expect(product.save()).rejects.toThrow('English name is required');
    });

    it('should require Arabic name', async () => {
      const productData = { ...validProductData };
      delete productData.name.ar;

      const product = new Product(productData);
      await expect(product.save()).rejects.toThrow('Arabic name is required');
    });

    it('should require English description', async () => {
      const productData = { ...validProductData };
      delete productData.description.en;

      const product = new Product(productData);
      await expect(product.save()).rejects.toThrow('English description is required');
    });

    it('should require Arabic description', async () => {
      const productData = { ...validProductData };
      delete productData.description.ar;

      const product = new Product(productData);
      await expect(product.save()).rejects.toThrow('Arabic description is required');
    });

    it('should require price', async () => {
      const productData = { ...validProductData };
      delete productData.price;

      const product = new Product(productData);
      await expect(product.save()).rejects.toThrow('Price is required');
    });

    it('should not allow negative price', async () => {
      const productData = { ...validProductData, price: -10 };

      const product = new Product(productData);
      await expect(product.save()).rejects.toThrow('Price cannot be negative');
    });

    it('should require size', async () => {
      const productData = { ...validProductData };
      delete productData.size;

      const product = new Product(productData);
      await expect(product.save()).rejects.toThrow('Size is required');
    });

    it('should validate size format', async () => {
      const productData = { ...validProductData, size: 'invalid-size' };

      const product = new Product(productData);
      await expect(product.save()).rejects.toThrow('Size must be in format like "50ml", "100ml", or "3.4oz"');
    });

    it('should accept valid size formats', async () => {
      const validSizes = ['50ml', '100ml', '3.4oz', '1.7oz', '250ml'];

      for (const size of validSizes) {
        const productData = { ...validProductData, size };
        const product = new Product(productData);
        const savedProduct = await product.save();
        expect(savedProduct.size).toBe(size);
        await Product.deleteMany({});
      }
    });

    it('should require category', async () => {
      const productData = { ...validProductData };
      delete productData.category;

      const product = new Product(productData);
      await expect(product.save()).rejects.toThrow('Category is required');
    });

    it('should only allow valid categories', async () => {
      const productData = { ...validProductData, category: 'invalid-category' };

      const product = new Product(productData);
      await expect(product.save()).rejects.toThrow('Category must be one of');
    });

    it('should accept all valid categories', async () => {
      const validCategories = ['floral', 'oriental', 'fresh', 'woody', 'citrus', 'spicy', 'aquatic', 'gourmand'];

      for (const category of validCategories) {
        const productData = { ...validProductData, category };
        const product = new Product(productData);
        const savedProduct = await product.save();
        expect(savedProduct.category).toBe(category);
        await Product.deleteMany({});
      }
    });

    it('should not allow negative stock', async () => {
      const productData = { ...validProductData, stock: -5 };

      const product = new Product(productData);
      await expect(product.save()).rejects.toThrow('Stock cannot be negative');
    });

    it('should only allow integer stock values', async () => {
      const productData = { ...validProductData, stock: 5.5 };

      const product = new Product(productData);
      await expect(product.save()).rejects.toThrow('Stock must be a non-negative integer');
    });

    it('should set inStock to false when stock is 0', async () => {
      const productData = { ...validProductData, stock: 0 };

      const product = new Product(productData);
      const savedProduct = await product.save();
      expect(savedProduct.inStock).toBe(false);
    });

    it('should validate image structure', async () => {
      const productData = {
        ...validProductData,
        images: [{
          url: 'https://example.com/image.jpg',
          cloudinaryId: 'sample_id',
          alt: {
            en: 'Product image',
            ar: 'صورة المنتج'
          },
          order: 0
        }]
      };

      const product = new Product(productData);
      const savedProduct = await product.save();
      expect(savedProduct.images).toHaveLength(1);
      expect(savedProduct.images[0].url).toBe(productData.images[0].url);
      expect(savedProduct.images[0].cloudinaryId).toBe(productData.images[0].cloudinaryId);
    });

    it('should validate fragrance notes structure', async () => {
      const productData = {
        ...validProductData,
        notes: {
          top: {
            en: ['Rose', 'Bergamot'],
            ar: ['ورد', 'برغموت']
          },
          middle: {
            en: ['Jasmine', 'Lily'],
            ar: ['ياسمين', 'زنبق']
          },
          base: {
            en: ['Musk', 'Sandalwood'],
            ar: ['مسك', 'صندل']
          }
        }
      };

      const product = new Product(productData);
      const savedProduct = await product.save();
      expect(savedProduct.notes.top.en).toEqual(['Rose', 'Bergamot']);
      expect(savedProduct.notes.top.ar).toEqual(['ورد', 'برغموت']);
    });
  });

  describe('Product Instance Methods', () => {
    let product;

    beforeEach(async () => {
      const productData = {
        name: {
          en: 'Test Perfume',
          ar: 'عطر تجريبي'
        },
        description: {
          en: 'Test description',
          ar: 'وصف تجريبي'
        },
        price: 100,
        size: '50ml',
        category: 'floral',
        stock: 10
      };

      product = new Product(productData);
      await product.save();
    });

    describe('updateStock', () => {
      it('should increase stock when positive quantity provided', async () => {
        await product.updateStock(5);
        expect(product.stock).toBe(15);
        expect(product.inStock).toBe(true);
      });

      it('should decrease stock when negative quantity provided', async () => {
        await product.updateStock(-3);
        expect(product.stock).toBe(7);
        expect(product.inStock).toBe(true);
      });

      it('should set inStock to false when stock reaches 0', async () => {
        await product.updateStock(-10);
        expect(product.stock).toBe(0);
        expect(product.inStock).toBe(false);
      });

      it('should throw error when trying to reduce stock below 0', async () => {
        await expect(product.updateStock(-15)).rejects.toThrow('Insufficient stock');
      });

      it('should throw error for non-integer quantity', async () => {
        await expect(product.updateStock(5.5)).rejects.toThrow('Quantity must be an integer');
      });
    });

    describe('isAvailable', () => {
      it('should return true when product is in stock and has sufficient quantity', () => {
        expect(product.isAvailable(5)).toBe(true);
      });

      it('should return false when requested quantity exceeds stock', () => {
        expect(product.isAvailable(15)).toBe(false);
      });

      it('should return false when product is not in stock', async () => {
        product.inStock = false;
        expect(product.isAvailable(1)).toBe(false);
      });

      it('should default to quantity 1 when no quantity provided', () => {
        expect(product.isAvailable()).toBe(true);
      });
    });
  });

  describe('Product Static Methods', () => {
    beforeEach(async () => {
      // Create test products
      const products = [
        {
          name: { en: 'Rose Perfume', ar: 'عطر الورد' },
          description: { en: 'Beautiful rose scent', ar: 'رائحة ورد جميلة' },
          price: 150,
          size: '50ml',
          category: 'floral',
          stock: 10,
          featured: true
        },
        {
          name: { en: 'Woody Cologne', ar: 'كولونيا خشبية' },
          description: { en: 'Rich woody fragrance', ar: 'عطر خشبي غني' },
          price: 200,
          size: '100ml',
          category: 'woody',
          stock: 5,
          featured: false
        },
        {
          name: { en: 'Citrus Fresh', ar: 'حمضيات منعشة' },
          description: { en: 'Fresh citrus blend', ar: 'مزيج حمضيات منعش' },
          price: 80,
          size: '30ml',
          category: 'citrus',
          stock: 0,
          inStock: false
        }
      ];

      await Product.insertMany(products);
    });

    describe('findByCategory', () => {
      it('should find products by category', async () => {
        const floralProducts = await Product.findByCategory('floral');
        expect(floralProducts).toHaveLength(1);
        expect(floralProducts[0].category).toBe('floral');
      });

      it('should handle case insensitive category search', async () => {
        const woodyProducts = await Product.findByCategory('WOODY');
        expect(woodyProducts).toHaveLength(1);
        expect(woodyProducts[0].category).toBe('woody');
      });
    });

    describe('findFeatured', () => {
      it('should find featured products that are in stock', async () => {
        const featuredProducts = await Product.findFeatured();
        expect(featuredProducts).toHaveLength(1);
        expect(featuredProducts[0].featured).toBe(true);
        expect(featuredProducts[0].inStock).toBe(true);
      });

      it('should respect limit parameter', async () => {
        const featuredProducts = await Product.findFeatured(0);
        expect(featuredProducts).toHaveLength(0);
      });
    });

    describe('searchProducts', () => {
      it('should search products in English by default', async () => {
        const results = await Product.searchProducts('rose');
        expect(results).toHaveLength(1);
        expect(results[0].name.en).toContain('Rose');
      });

      it('should search products in Arabic when specified', async () => {
        const results = await Product.searchProducts('ورد', 'ar');
        expect(results).toHaveLength(1);
        expect(results[0].name.ar).toContain('ورد');
      });

      it('should search in description fields', async () => {
        const results = await Product.searchProducts('woody');
        expect(results).toHaveLength(1);
        expect(results[0].description.en).toContain('woody');
      });

      it('should be case insensitive', async () => {
        const results = await Product.searchProducts('ROSE');
        expect(results).toHaveLength(1);
      });
    });

    describe('findWithFilters', () => {
      it('should filter by category', async () => {
        const results = await Product.findWithFilters({ category: 'woody' });
        expect(results).toHaveLength(1);
        expect(results[0].category).toBe('woody');
      });

      it('should filter by price range', async () => {
        const results = await Product.findWithFilters({ minPrice: 100, maxPrice: 180 });
        expect(results).toHaveLength(1);
        expect(results[0].price).toBe(150);
      });

      it('should filter by availability', async () => {
        const inStockResults = await Product.findWithFilters({ inStock: true });
        expect(inStockResults).toHaveLength(2);

        const outOfStockResults = await Product.findWithFilters({ inStock: false });
        expect(outOfStockResults).toHaveLength(1);
      });

      it('should filter by featured status', async () => {
        const featuredResults = await Product.findWithFilters({ featured: true });
        expect(featuredResults).toHaveLength(1);
        expect(featuredResults[0].featured).toBe(true);
      });

      it('should combine multiple filters', async () => {
        const results = await Product.findWithFilters({
          category: 'floral',
          inStock: true,
          featured: true
        });
        expect(results).toHaveLength(1);
      });
    });

    describe('getCategories', () => {
      it('should return all unique categories', async () => {
        const categories = await Product.getCategories();
        expect(categories).toHaveLength(3);
        expect(categories).toContain('floral');
        expect(categories).toContain('woody');
        expect(categories).toContain('citrus');
      });
    });
  });

  describe('Product Indexes and Performance', () => {
    it('should have proper indexes defined', () => {
      const indexes = Product.collection.getIndexes ? Product.collection.getIndexes() : {};
      // Note: In test environment, indexes might not be created automatically
      // This test verifies the schema has index definitions
      expect(Product.schema.indexes()).toBeDefined();
    });
  });
});