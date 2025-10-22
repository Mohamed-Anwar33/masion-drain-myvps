import { apiClient } from './apiClient';

export interface Product {
  _id: string;
  name: {
    en: string;
    ar: string;
  };
  description: {
    en: string;
    ar: string;
  };
  longDescription?: {
    en: string;
    ar: string;
  };
  price: number;
  size: string;
  category: string;
  images: Array<{
    url: string;
    cloudinaryId: string;
    alt?: {
      en: string;
      ar: string;
    };
    order: number;
  }>;
  featured: boolean;
  inStock: boolean;
  stock: number;
  concentration?: {
    en: string;
    ar: string;
  };
  notes?: {
    top: {
      en: string[];
      ar: string[];
    };
    middle: {
      en: string[];
      ar: string[];
    };
    base: {
      en: string[];
      ar: string[];
    };
  };
  seo?: {
    metaTitle?: {
      en: string;
      ar: string;
    };
    metaDescription?: {
      en: string;
      ar: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  featured?: boolean;
  inStock?: boolean;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'name' | 'price' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  language?: 'en' | 'ar';
}

export interface CreateProductData {
  name: {
    en: string;
    ar: string;
  };
  description: {
    en: string;
    ar: string;
  };
  longDescription?: {
    en: string;
    ar: string;
  };
  price: number;
  size: string;
  category: string;
  images?: Array<{
    url: string;
    cloudinaryId: string;
    alt?: {
      en: string;
      ar: string;
    };
    order: number;
  }>;
  featured?: boolean;
  inStock?: boolean;
  stock?: number;
  concentration?: {
    en: string;
    ar: string;
  };
  notes?: {
    top: {
      en: string[];
      ar: string[];
    };
    middle: {
      en: string[];
      ar: string[];
    };
    base: {
      en: string[];
      ar: string[];
    };
  };
  seo?: {
    metaTitle?: {
      en: string;
      ar: string;
    };
    metaDescription?: {
      en: string;
      ar: string;
    };
  };
}

export interface Category {
  value: string;
  label: {
    ar: string;
  };
}

class ProductService {
  async getProducts(params: ProductQueryParams = {}): Promise<ProductsResponse> {
    try {
      const response = await apiClient.get('/products', { params });
      return {
        products: response.data.data || [],
        pagination: response.data.pagination || { page: 1, limit: 10, total: 0, pages: 0, hasNext: false, hasPrev: false }
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      throw new Error('Failed to fetch products');
    }
  }

  async getProductById(id: string): Promise<Product> {
    try {
      const response = await apiClient.get(`/products/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching product:', error);
      throw new Error('Failed to fetch product');
    }
  }

  async getCategories(): Promise<Category[]> {
    try {
      const response = await apiClient.get('/categories/active');
      return response.data.data.categories.map((cat: any) => ({
        value: cat._id,
        label: cat.name
      }));
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw new Error('Failed to fetch categories');
    }
  }

  async createProduct(productData: CreateProductData): Promise<Product> {
    try {
      const response = await apiClient.post('/products', productData);
      return response.data.data.product;
    } catch (error) {
      console.error('Error creating product:', error);
      throw new Error('Failed to create product');
    }
  }

  async updateProduct(id: string, productData: Partial<CreateProductData>): Promise<Product> {
    try {
      const response = await apiClient.put(`/products/${id}`, productData);
      return response.data.data.product;
    } catch (error) {
      console.error('Error updating product:', error);
      throw new Error('Failed to update product');
    }
  }

  async deleteProduct(id: string): Promise<void> {
    try {
      await apiClient.delete(`/products/${id}`);
    } catch (error) {
      console.error('Error deleting product:', error);
      throw new Error('Failed to delete product');
    }
  }

  async updateStock(id: string, stock: number, inStock?: boolean): Promise<Product> {
    try {
      const response = await apiClient.patch(`/products/${id}/stock`, { 
        stock, 
        inStock: inStock !== undefined ? inStock : stock > 0 
      });
      return response.data.data.product;
    } catch (error) {
      console.error('Error updating stock:', error);
      throw new Error('Failed to update stock');
    }
  }

  async getCategoryStats(): Promise<Array<{
    category: string;
    label: { en: string; ar: string };
    totalProducts: number;
    inStockProducts: number;
    outOfStockProducts: number;
    averagePrice: number;
    totalValue: number;
    totalStock: number;
  }>> {
    try {
      const response = await apiClient.get('/products/categories/stats');
      return response.data.data.categoryStats;
    } catch (error) {
      console.error('Error fetching category stats:', error);
      throw new Error('Failed to fetch category statistics');
    }
  }

  async bulkUpdateStock(updates: Array<{
    productId: string;
    stock: number;
    inStock?: boolean;
  }>): Promise<{
    updated: number;
    failed: number;
    results: Array<{
      productId: string;
      success: boolean;
      error?: string;
      newStock?: number;
      inStock?: boolean;
    }>;
  }> {
    try {
      const response = await apiClient.patch('/products/bulk/stock', { updates });
      return response.data.data;
    } catch (error) {
      console.error('Error bulk updating stock:', error);
      throw new Error('Failed to bulk update stock');
    }
  }

  async getInventoryReport(lowStockThreshold: number = 5): Promise<{
    totalProducts: number;
    inStockProducts: number;
    outOfStockProducts: number;
    lowStockProducts: Array<{
      _id: string;
      name: { en: string; ar: string };
      category: string;
      stock: number;
      price: number;
    }>;
    totalInventoryValue: number;
    categoryBreakdown: Array<{
      category: string;
      count: number;
      value: number;
      stock: number;
    }>;
    lowStockThreshold: number;
  }> {
    try {
      const response = await apiClient.get('/products/inventory/report', {
        params: { lowStockThreshold }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching inventory report:', error);
      throw new Error('Failed to fetch inventory report');
    }
  }
}

export const productService = new ProductService();