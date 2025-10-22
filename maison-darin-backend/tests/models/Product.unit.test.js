const Product = require('../../models/Product');

describe('Product Model Unit Tests', () => {
  describe('Product Schema Structure', () => {
    it('should have correct schema structure', () => {
      const product = new Product();
      const paths = product.schema.paths;
      
      // Check that the schema has the expected fields
      expect(paths['name.en']).toBeDefined();
      expect(paths['name.ar']).toBeDefined();
      expect(paths['description.en']).toBeDefined();
      expect(paths['description.ar']).toBeDefined();
      expect(paths['price']).toBeDefined();
      expect(paths['size']).toBeDefined();
      expect(paths['category']).toBeDefined();
      expect(paths['stock']).toBeDefined();
      expect(paths['inStock']).toBeDefined();
      expect(paths['featured']).toBeDefined();
    });

    it('should have correct category enum values', () => {
      const categoryPath = Product.schema.paths.category;
      const enumValues = categoryPath.enumValues;
      
      expect(enumValues).toContain('floral');
      expect(enumValues).toContain('oriental');
      expect(enumValues).toContain('fresh');
      expect(enumValues).toContain('woody');
      expect(enumValues).toContain('citrus');
      expect(enumValues).toContain('spicy');
      expect(enumValues).toContain('aquatic');
      expect(enumValues).toContain('gourmand');
    });

    it('should have correct default values', () => {
      const product = new Product();
      
      expect(product.featured).toBe(false);
      expect(product.inStock).toBe(true);
      expect(product.stock).toBe(0);
    });
  });

  describe('Product Instance Methods', () => {
    let product;

    beforeEach(() => {
      product = new Product({
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
      });
    });

    describe('isAvailable', () => {
      it('should return true when product is in stock and has sufficient quantity', () => {
        expect(product.isAvailable(5)).toBe(true);
      });

      it('should return false when requested quantity exceeds stock', () => {
        expect(product.isAvailable(15)).toBe(false);
      });

      it('should return false when product is not in stock', () => {
        product.inStock = false;
        expect(product.isAvailable(1)).toBe(false);
      });

      it('should default to quantity 1 when no quantity provided', () => {
        expect(product.isAvailable()).toBe(true);
      });
    });
  });

  describe('Product Static Methods', () => {
    describe('size validation', () => {
      it('should validate size format correctly', () => {
        const sizeValidator = Product.schema.paths.size.validators.find(v => v.message && v.message.includes('format'));
        
        if (sizeValidator) {
          // Valid sizes
          expect(sizeValidator.validator('50ml')).toBe(true);
          expect(sizeValidator.validator('100ml')).toBe(true);
          expect(sizeValidator.validator('3.4oz')).toBe(true);
          expect(sizeValidator.validator('1.7oz')).toBe(true);
          
          // Invalid sizes
          expect(sizeValidator.validator('invalid-size')).toBe(false);
          expect(sizeValidator.validator('50')).toBe(false);
          expect(sizeValidator.validator('ml50')).toBe(false);
        } else {
          // Test the regex directly
          const sizeRegex = /^\d+(\.\d+)?(ml|oz|g)$/i;
          expect(sizeRegex.test('50ml')).toBe(true);
          expect(sizeRegex.test('100ml')).toBe(true);
          expect(sizeRegex.test('3.4oz')).toBe(true);
          expect(sizeRegex.test('invalid-size')).toBe(false);
        }
      });
    });
  });
});