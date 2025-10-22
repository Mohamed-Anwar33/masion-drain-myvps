import { apiClient } from './apiClient';

export interface Category {
  _id: string;
  name: {
    en: string;
    ar: string;
  };
  description?: {
    en: string;
    ar: string;
  };
  slug: string;
  isActive: boolean;
  image?: {
    url: string;
    cloudinaryId: string;
    alt?: {
      en: string;
      ar: string;
    };
  };
  productCount?: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryData {
  name: {
    en: string;
    ar: string;
  };
  description?: {
    en: string;
    ar: string;
  };
  slug?: string;
  isActive?: boolean;
  image?: {
    url: string;
    cloudinaryId: string;
    alt?: {
      en: string;
      ar: string;
    };
  };
  sortOrder?: number;
}

export interface CategoryQueryParams {
  isActive?: boolean;
  includeProductCount?: boolean;
  limit?: number;
  page?: number;
  sort?: Record<string, 1 | -1>;
}

class CategoryService {
  /**
   * Get all categories
   */
  async getCategories(params: CategoryQueryParams = {}): Promise<Category[]> {
    try {
      const response = await apiClient.get('/categories', { params });
      return response.data.data.categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw new Error('Failed to fetch categories');
    }
  }

  /**
   * Get active categories for frontend
   */
  async getActiveCategories(): Promise<Category[]> {
    try {
      const response = await apiClient.get('/categories/active');
      return response.data.data.categories;
    } catch (error) {
      console.error('Error fetching active categories:', error);
      throw new Error('Failed to fetch active categories');
    }
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id: string): Promise<Category> {
    try {
      const response = await apiClient.get(`/categories/${id}`);
      return response.data.data.category;
    } catch (error) {
      console.error('Error fetching category:', error);
      throw new Error('Failed to fetch category');
    }
  }

  /**
   * Get category by slug
   */
  async getCategoryBySlug(slug: string): Promise<Category> {
    try {
      const response = await apiClient.get(`/categories/slug/${slug}`);
      return response.data.data.category;
    } catch (error) {
      console.error('Error fetching category:', error);
      throw new Error('Failed to fetch category');
    }
  }

  /**
   * Create new category
   */
  async createCategory(categoryData: CreateCategoryData): Promise<Category> {
    try {
      const response = await apiClient.post('/categories', categoryData);
      return response.data.data.category;
    } catch (error) {
      console.error('Error creating category:', error);
      throw new Error('Failed to create category');
    }
  }

  /**
   * Update category
   */
  async updateCategory(id: string, categoryData: Partial<CreateCategoryData>): Promise<Category> {
    try {
      const response = await apiClient.put(`/categories/${id}`, categoryData);
      return response.data.data.category;
    } catch (error) {
      console.error('Error updating category:', error);
      throw new Error('Failed to update category');
    }
  }

  /**
   * Delete category
   */
  async deleteCategory(id: string): Promise<void> {
    try {
      await apiClient.delete(`/categories/${id}`);
    } catch (error) {
      console.error('Error deleting category:', error);
      throw new Error('Failed to delete category');
    }
  }

  /**
   * Get category statistics
   */
  async getCategoryStats(): Promise<Array<{
    _id: string;
    name: { en: string; ar: string };
    slug: string;
    isActive: boolean;
    totalProducts: number;
    inStockProducts: number;
    outOfStockProducts: number;
    totalStock: number;
    totalValue: number;
    averagePrice: number;
  }>> {
    try {
      const response = await apiClient.get('/categories/stats');
      return response.data.data.categoryStats;
    } catch (error) {
      console.error('Error fetching category stats:', error);
      throw new Error('Failed to fetch category statistics');
    }
  }

  /**
   * Search categories
   */
  async searchCategories(searchTerm: string, options: {
    isActive?: boolean;
    limit?: number;
  } = {}): Promise<Category[]> {
    try {
      const params = {
        q: searchTerm,
        ...options
      };
      const response = await apiClient.get('/categories/search', { params });
      return response.data.data.categories;
    } catch (error) {
      console.error('Error searching categories:', error);
      throw new Error('Failed to search categories');
    }
  }

  /**
   * Reorder categories
   */
  async reorderCategories(categoryOrders: Array<{
    id: string;
    sortOrder: number;
  }>): Promise<Category[]> {
    try {
      const response = await apiClient.patch('/categories/reorder', {
        categoryOrders
      });
      return response.data.data.categories;
    } catch (error) {
      console.error('Error reordering categories:', error);
      throw new Error('Failed to reorder categories');
    }
  }

  /**
   * Toggle category status
   */
  async toggleCategoryStatus(id: string): Promise<Category> {
    try {
      const response = await apiClient.patch(`/categories/${id}/toggle-status`);
      return response.data.data.category;
    } catch (error) {
      console.error('Error toggling category status:', error);
      throw new Error('Failed to toggle category status');
    }
  }

  /**
   * Get category products
   */
  async getCategoryProducts(id: string, options: {
    inStock?: boolean;
    isActive?: boolean;
    limit?: number;
    sort?: Record<string, 1 | -1>;
  } = {}): Promise<{
    category: {
      _id: string;
      name: { en: string; ar: string };
      slug: string;
    };
    products: any[];
  }> {
    try {
      const response = await apiClient.get(`/categories/${id}/products`, {
        params: options
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching category products:', error);
      throw new Error('Failed to fetch category products');
    }
  }
}

export const categoryService = new CategoryService();