const Category = require('../models/Category');
const Product = require('../models/Product');
const { AppError } = require('../utils/errorHandler');

class CategoryService {
  /**
   * Get all categories with optional filters
   */
  async getCategories(options = {}) {
    try {
      const {
        isActive,
        includeProductCount = false,
        sort = { sortOrder: 1, 'name.en': 1 },
        limit,
        skip
      } = options;

      let query = Category.find();

      // Apply filters
      if (isActive !== undefined) {
        query = query.where('isActive').equals(isActive);
      }

      // Include product count if requested
      if (includeProductCount) {
        const categories = await Category.getWithProductCount();
        return categories.filter(cat => isActive === undefined || cat.isActive === isActive);
      }

      // Apply sorting
      query = query.sort(sort);

      // Apply pagination
      if (skip) query = query.skip(skip);
      if (limit) query = query.limit(limit);

      const categories = await query.exec();
      return categories;
    } catch (error) {
      throw new AppError('Failed to fetch categories', 500);
    }
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id) {
    try {
      const category = await Category.findById(id);
      if (!category) {
        throw new AppError('Category not found', 404);
      }
      return category;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch category', 500);
    }
  }

  /**
   * Get category by slug
   */
  async getCategoryBySlug(slug) {
    try {
      const category = await Category.findOne({ slug, isActive: true });
      if (!category) {
        throw new AppError('Category not found', 404);
      }
      return category;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch category', 500);
    }
  }

  /**
   * Create new category
   */
  async createCategory(categoryData) {
    try {
      // Check if slug already exists
      if (categoryData.slug) {
        const existingCategory = await Category.findOne({ slug: categoryData.slug });
        if (existingCategory) {
          throw new AppError('Category with this slug already exists', 400);
        }
      }

      // Generate slug if not provided
      if (!categoryData.slug && categoryData.name?.en) {
        categoryData.slug = this.generateSlug(categoryData.name.en);
      }

      const category = new Category(categoryData);
      await category.save();
      return category;
    } catch (error) {
      if (error.code === 11000) {
        throw new AppError('Category with this slug already exists', 400);
      }
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create category', 500);
    }
  }

  /**
   * Update category
   */
  async updateCategory(id, updateData) {
    try {
      // If updating name and no slug provided, regenerate slug
      if (updateData.name?.en && !updateData.slug) {
        updateData.slug = this.generateSlug(updateData.name.en);
      }

      // Check if new slug conflicts with existing categories
      if (updateData.slug) {
        const existingCategory = await Category.findOne({ 
          slug: updateData.slug, 
          _id: { $ne: id } 
        });
        if (existingCategory) {
          throw new AppError('Category with this slug already exists', 400);
        }
      }

      const category = await Category.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!category) {
        throw new AppError('Category not found', 404);
      }

      return category;
    } catch (error) {
      if (error.code === 11000) {
        throw new AppError('Category with this slug already exists', 400);
      }
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update category', 500);
    }
  }

  /**
   * Delete category
   */
  async deleteCategory(id) {
    try {
      // Check if category has products
      const productCount = await Product.countDocuments({ category: id });
      if (productCount > 0) {
        throw new AppError(
          `Cannot delete category. It has ${productCount} product(s) associated with it.`,
          400
        );
      }

      const category = await Category.findByIdAndDelete(id);
      if (!category) {
        throw new AppError('Category not found', 404);
      }

      return category;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete category', 500);
    }
  }

  /**
   * Get category statistics
   */
  async getCategoryStats() {
    try {
      const stats = await Category.aggregate([
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: 'category',
            as: 'products'
          }
        },
        {
          $addFields: {
            totalProducts: { $size: '$products' },
            inStockProducts: {
              $size: {
                $filter: {
                  input: '$products',
                  cond: { $eq: ['$$this.inStock', true] }
                }
              }
            },
            outOfStockProducts: {
              $size: {
                $filter: {
                  input: '$products',
                  cond: { $eq: ['$$this.inStock', false] }
                }
              }
            },
            totalStock: {
              $sum: '$products.stock'
            },
            totalValue: {
              $sum: {
                $map: {
                  input: '$products',
                  as: 'product',
                  in: { $multiply: ['$$product.price', '$$product.stock'] }
                }
              }
            },
            averagePrice: {
              $cond: {
                if: { $gt: [{ $size: '$products' }, 0] },
                then: { $avg: '$products.price' },
                else: 0
              }
            }
          }
        },
        {
          $project: {
            name: 1,
            slug: 1,
            isActive: 1,
            totalProducts: 1,
            inStockProducts: 1,
            outOfStockProducts: 1,
            totalStock: 1,
            totalValue: { $round: ['$totalValue', 2] },
            averagePrice: { $round: ['$averagePrice', 2] }
          }
        },
        {
          $sort: { totalProducts: -1 }
        }
      ]);

      return stats;
    } catch (error) {
      throw new AppError('Failed to fetch category statistics', 500);
    }
  }

  /**
   * Get active categories for frontend
   */
  async getActiveCategories() {
    try {
      const categories = await Category.getActive();
      return categories.map(cat => ({
        _id: cat._id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image: cat.image
      }));
    } catch (error) {
      throw new AppError('Failed to fetch active categories', 500);
    }
  }

  /**
   * Reorder categories
   */
  async reorderCategories(categoryOrders) {
    try {
      const updatePromises = categoryOrders.map(({ id, sortOrder }) =>
        Category.findByIdAndUpdate(id, { sortOrder }, { new: true })
      );

      const updatedCategories = await Promise.all(updatePromises);
      return updatedCategories.filter(cat => cat !== null);
    } catch (error) {
      throw new AppError('Failed to reorder categories', 500);
    }
  }

  /**
   * Search categories
   */
  async searchCategories(searchTerm, options = {}) {
    try {
      const { isActive, limit = 10 } = options;

      let query = Category.find({
        $or: [
          { 'name.en': { $regex: searchTerm, $options: 'i' } },
          { 'name.ar': { $regex: searchTerm, $options: 'i' } },
          { 'description.en': { $regex: searchTerm, $options: 'i' } },
          { 'description.ar': { $regex: searchTerm, $options: 'i' } }
        ]
      });

      if (isActive !== undefined) {
        query = query.where('isActive').equals(isActive);
      }

      const categories = await query
        .sort({ 'name.en': 1 })
        .limit(limit)
        .exec();

      return categories;
    } catch (error) {
      throw new AppError('Failed to search categories', 500);
    }
  }

  /**
   * Generate slug from name
   */
  generateSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }

  /**
   * Validate category data
   */
  validateCategoryData(data) {
    const errors = [];

    if (!data.name?.en?.trim()) {
      errors.push('English name is required');
    }

    if (!data.name?.ar?.trim()) {
      errors.push('Arabic name is required');
    }

    if (data.name?.en && data.name.en.length > 100) {
      errors.push('English name cannot exceed 100 characters');
    }

    if (data.name?.ar && data.name.ar.length > 100) {
      errors.push('Arabic name cannot exceed 100 characters');
    }

    if (data.description?.en && data.description.en.length > 500) {
      errors.push('English description cannot exceed 500 characters');
    }

    if (data.description?.ar && data.description.ar.length > 500) {
      errors.push('Arabic description cannot exceed 500 characters');
    }

    if (data.slug && !/^[a-z0-9-]+$/.test(data.slug)) {
      errors.push('Slug can only contain lowercase letters, numbers, and hyphens');
    }

    return errors;
  }
}

module.exports = new CategoryService();