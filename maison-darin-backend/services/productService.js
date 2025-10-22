const Product = require('../models/Product');

class ProductService {
  /**
   * Create a new product
   * @param {Object} productData - Product data
   * @returns {Promise<Object>} Created product
   */
  async createProduct(productData) {
    try {
      // Validate required fields
      this.validateProductData(productData);
      
      const product = new Product(productData);
      return await product.save();
    } catch (error) {
      throw new Error(`Failed to create product: ${error.message}`);
    }
  }

  /**
   * Get all products with optional filters and pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Products with pagination info
   */
  async getProducts(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        category,
        minPrice,
        maxPrice,
        inStock,
        featured,
        search,
        language = 'en',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      // Build query
      const query = {};
      
      if (category) {
        query.category = category.toLowerCase();
      }
      
      if (minPrice !== undefined || maxPrice !== undefined) {
        query.price = {};
        if (minPrice !== undefined) {
          query.price.$gte = Number(minPrice);
        }
        if (maxPrice !== undefined) {
          query.price.$lte = Number(maxPrice);
        }
      }
      
      if (inStock !== undefined) {
        query.inStock = inStock === 'true' || inStock === true;
      }
      
      if (featured !== undefined) {
        query.featured = featured === 'true' || featured === true;
      }

      // Handle search
      if (search) {
        const searchRegex = new RegExp(search, 'i');
        if (language === 'ar') {
          query.$or = [
            { 'name.ar': searchRegex },
            { 'description.ar': searchRegex },
            { 'longDescription.ar': searchRegex }
          ];
        } else {
          query.$or = [
            { 'name.en': searchRegex },
            { 'description.en': searchRegex },
            { 'longDescription.en': searchRegex }
          ];
        }
      }

      // Calculate pagination
      const skip = (page - 1) * limit;
      
      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Execute query
      const [products, total] = await Promise.all([
        Product.find(query)
          .sort(sort)
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        Product.countDocuments(query)
      ]);

      return {
        products,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Failed to get products: ${error.message}`);
    }
  }

  /**
   * Get product by ID
   * @param {string} id - Product ID
   * @returns {Promise<Object>} Product
   */
  async getProductById(id) {
    try {
      const product = await Product.findById(id);
      if (!product) {
        throw new Error('Product not found');
      }
      return product;
    } catch (error) {
      if (error.name === 'CastError') {
        throw new Error('Invalid product ID');
      }
      throw new Error(`Failed to get product: ${error.message}`);
    }
  }

  /**
   * Update product by ID
   * @param {string} id - Product ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated product
   */
  async updateProduct(id, updateData) {
    try {
      // Remove fields that shouldn't be updated directly
      const { _id, createdAt, ...validUpdateData } = updateData;
      
      // Validate update data if it contains core product info
      if (validUpdateData.name || validUpdateData.description || validUpdateData.price) {
        this.validateProductData(validUpdateData, false);
      }

      const product = await Product.findByIdAndUpdate(
        id,
        { ...validUpdateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!product) {
        throw new Error('Product not found');
      }

      return product;
    } catch (error) {
      if (error.name === 'CastError') {
        throw new Error('Invalid product ID');
      }
      throw new Error(`Failed to update product: ${error.message}`);
    }
  }

  /**
   * Delete product by ID
   * @param {string} id - Product ID
   * @returns {Promise<Object>} Deleted product
   */
  async deleteProduct(id) {
    try {
      const product = await Product.findByIdAndDelete(id);
      if (!product) {
        throw new Error('Product not found');
      }

      // TODO: Clean up associated images from Cloudinary
      // This will be implemented in the media management task
      
      return product;
    } catch (error) {
      if (error.name === 'CastError') {
        throw new Error('Invalid product ID');
      }
      throw new Error(`Failed to delete product: ${error.message}`);
    }
  }

  /**
   * Get featured products
   * @param {number} limit - Number of products to return
   * @returns {Promise<Array>} Featured products
   */
  async getFeaturedProducts(limit = 10) {
    try {
      return await Product.findFeatured(limit);
    } catch (error) {
      throw new Error(`Failed to get featured products: ${error.message}`);
    }
  }

  /**
   * Get all categories
   * @returns {Promise<Array>} Categories
   */
  async getCategories() {
    try {
      return await Product.getCategories();
    } catch (error) {
      throw new Error(`Failed to get categories: ${error.message}`);
    }
  }

  /**
   * Get category statistics
   * @returns {Promise<Array>} Category statistics
   */
  async getCategoryStats() {
    try {
      const categories = await Product.getCategories();
      const categoryStats = [];

      for (const category of categories) {
        const products = await Product.find({ category: category.value });
        const inStockProducts = products.filter(p => p.inStock);
        const outOfStockProducts = products.filter(p => !p.inStock);
        const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
        const averagePrice = products.length > 0 ? 
          products.reduce((sum, p) => sum + p.price, 0) / products.length : 0;

        categoryStats.push({
          category: category.value,
          label: category.label,
          totalProducts: products.length,
          inStockProducts: inStockProducts.length,
          outOfStockProducts: outOfStockProducts.length,
          averagePrice: Math.round(averagePrice * 100) / 100,
          totalValue: Math.round(totalValue * 100) / 100,
          totalStock: products.reduce((sum, p) => sum + p.stock, 0)
        });
      }

      return categoryStats;
    } catch (error) {
      throw new Error(`Failed to get category statistics: ${error.message}`);
    }
  }

  /**
   * Update product stock
   * @param {string} id - Product ID
   * @param {number} quantity - Quantity to add/subtract
   * @returns {Promise<Object>} Updated product
   */
  async updateStock(id, quantity) {
    try {
      const product = await Product.findById(id);
      if (!product) {
        throw new Error('Product not found');
      }

      return await product.updateStock(quantity);
    } catch (error) {
      if (error.name === 'CastError') {
        throw new Error('Invalid product ID');
      }
      throw new Error(`Failed to update stock: ${error.message}`);
    }
  }

  /**
   * Update product stock directly
   * @param {string} id - Product ID
   * @param {number} stock - New stock value
   * @param {boolean} inStock - Stock availability
   * @returns {Promise<Object>} Updated product
   */
  async updateProductStock(id, stock, inStock) {
    try {
      const product = await Product.findById(id);
      if (!product) {
        throw new Error('Product not found');
      }

      product.stock = stock;
      product.inStock = inStock !== undefined ? inStock : stock > 0;
      return await product.save();
    } catch (error) {
      if (error.name === 'CastError') {
        throw new Error('Invalid product ID');
      }
      throw new Error(`Failed to update stock: ${error.message}`);
    }
  }

  /**
   * Check product availability
   * @param {string} id - Product ID
   * @param {number} quantity - Quantity to check
   * @returns {Promise<boolean>} Availability status
   */
  async checkAvailability(id, quantity = 1) {
    try {
      const product = await Product.findById(id);
      if (!product) {
        throw new Error('Product not found');
      }

      return product.isAvailable(quantity);
    } catch (error) {
      if (error.name === 'CastError') {
        throw new Error('Invalid product ID');
      }
      throw new Error(`Failed to check availability: ${error.message}`);
    }
  }

  /**
   * Bulk update product stock
   * @param {Array} updates - Array of stock updates
   * @returns {Promise<Object>} Update results
   */
  async bulkUpdateStock(updates) {
    try {
      const results = {
        updated: 0,
        failed: 0,
        results: []
      };

      for (const update of updates) {
        try {
          const { productId, stock, inStock } = update;
          
          if (!productId || typeof stock !== 'number' || stock < 0) {
            results.failed++;
            results.results.push({
              productId,
              success: false,
              error: 'Invalid update data'
            });
            continue;
          }

          const product = await Product.findById(productId);
          if (!product) {
            results.failed++;
            results.results.push({
              productId,
              success: false,
              error: 'Product not found'
            });
            continue;
          }

          product.stock = stock;
          product.inStock = inStock !== undefined ? inStock : stock > 0;
          await product.save();

          results.updated++;
          results.results.push({
            productId,
            success: true,
            newStock: stock,
            inStock: product.inStock
          });
        } catch (error) {
          results.failed++;
          results.results.push({
            productId: update.productId,
            success: false,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      throw new Error(`Failed to bulk update stock: ${error.message}`);
    }
  }

  /**
   * Get inventory report
   * @param {number} lowStockThreshold - Threshold for low stock alert
   * @returns {Promise<Object>} Inventory report
   */
  async getInventoryReport(lowStockThreshold = 5) {
    try {
      const allProducts = await Product.find({});
      const inStockProducts = allProducts.filter(p => p.inStock);
      const outOfStockProducts = allProducts.filter(p => !p.inStock);
      const lowStockProducts = allProducts.filter(p => p.stock > 0 && p.stock <= lowStockThreshold);

      // Calculate total inventory value
      const totalInventoryValue = allProducts.reduce((sum, p) => sum + (p.price * p.stock), 0);

      // Category breakdown
      const categoryBreakdown = {};
      allProducts.forEach(product => {
        if (!categoryBreakdown[product.category]) {
          categoryBreakdown[product.category] = {
            category: product.category,
            count: 0,
            value: 0,
            stock: 0
          };
        }
        categoryBreakdown[product.category].count++;
        categoryBreakdown[product.category].value += product.price * product.stock;
        categoryBreakdown[product.category].stock += product.stock;
      });

      return {
        totalProducts: allProducts.length,
        inStockProducts: inStockProducts.length,
        outOfStockProducts: outOfStockProducts.length,
        lowStockProducts: lowStockProducts.map(p => ({
          _id: p._id,
          name: p.name,
          category: p.category,
          stock: p.stock,
          price: p.price
        })),
        totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
        categoryBreakdown: Object.values(categoryBreakdown).map(cat => ({
          ...cat,
          value: Math.round(cat.value * 100) / 100
        })),
        lowStockThreshold
      };
    } catch (error) {
      throw new Error(`Failed to generate inventory report: ${error.message}`);
    }
  }

  /**
   * Validate product data
   * @param {Object} productData - Product data to validate
   * @param {boolean} isCreate - Whether this is for creation (requires all fields)
   */
  validateProductData(productData, isCreate = true) {
    if (isCreate) {
      // Required fields for creation
      const requiredFields = ['name', 'description', 'price', 'size', 'category'];
      
      for (const field of requiredFields) {
        if (!productData[field]) {
          throw new Error(`${field} is required`);
        }
      }

      // Validate multilingual fields
      if (!productData.name.en || !productData.name.ar) {
        throw new Error('Product name is required in both English and Arabic');
      }

      if (!productData.description.en || !productData.description.ar) {
        throw new Error('Product description is required in both English and Arabic');
      }
    }

    // Validate price if provided
    if (productData.price !== undefined) {
      if (typeof productData.price !== 'number' || productData.price < 0) {
        throw new Error('Price must be a positive number');
      }
    }

    // Validate stock if provided
    if (productData.stock !== undefined) {
      if (!Number.isInteger(productData.stock) || productData.stock < 0) {
        throw new Error('Stock must be a non-negative integer');
      }
    }

    // Validate category if provided
    if (productData.category) {
      const validCategories = ['floral', 'oriental', 'fresh', 'woody', 'citrus', 'spicy', 'aquatic', 'gourmand'];
      if (!validCategories.includes(productData.category.toLowerCase())) {
        throw new Error(`Category must be one of: ${validCategories.join(', ')}`);
      }
    }

    // Validate size format if provided
    if (productData.size) {
      const sizeRegex = /^\d+(\.\d+)?(ml|oz|g)$/i;
      if (!sizeRegex.test(productData.size)) {
        throw new Error('Size must be in format like "50ml", "100ml", or "3.4oz"');
      }
    }

    // Validate images if provided
    if (productData.images) {
      if (!Array.isArray(productData.images)) {
        throw new Error('Images must be an array');
      }
      
      if (productData.images.length > 10) {
        throw new Error('Maximum 10 images allowed per product');
      }
      
      // Validate each image
      for (const image of productData.images) {
        if (typeof image === 'string') {
          // Simple URL validation
          if (!image.startsWith('http://') && !image.startsWith('https://')) {
            throw new Error('Image URLs must start with http:// or https://');
          }
        } else if (typeof image === 'object' && image !== null) {
          // Image object validation
          if (!image.url) {
            throw new Error('Image object must have a url property');
          }
          if (!image.url.startsWith('http://') && !image.url.startsWith('https://')) {
            throw new Error('Image URLs must start with http:// or https://');
          }
          // Validate cloudinaryId if provided
          if (image.cloudinaryId && typeof image.cloudinaryId !== 'string') {
            throw new Error('Cloudinary ID must be a string');
          }
          // Validate alt text if provided
          if (image.alt) {
            if (typeof image.alt !== 'object') {
              throw new Error('Alt text must be an object with en and ar properties');
            }
            if (image.alt.en && typeof image.alt.en !== 'string') {
              throw new Error('English alt text must be a string');
            }
            if (image.alt.ar && typeof image.alt.ar !== 'string') {
              throw new Error('Arabic alt text must be a string');
            }
          }
        } else {
          throw new Error('Each image must be either a URL string or an object with url property');
        }
      }
    }
  }
}

module.exports = new ProductService();