import { useState, useEffect, useCallback } from 'react';
import { productService, Product, ProductsResponse, ProductQueryParams, CreateProductData, Category } from '@/services/productService';
import { useToast } from '@/hooks/use-toast';

interface UseProductsState {
  products: Product[];
  pagination: ProductsResponse['pagination'] | null;
  categories: Category[];
  loading: boolean;
  error: string | null;
}

interface UseProductsActions {
  fetchProducts: (params?: ProductQueryParams) => Promise<void>;
  fetchCategories: () => Promise<void>;
  createProduct: (productData: CreateProductData) => Promise<Product | null>;
  updateProduct: (id: string, productData: Partial<CreateProductData>) => Promise<Product | null>;
  deleteProduct: (id: string) => Promise<boolean>;
  updateStock: (id: string, stock: number, inStock?: boolean) => Promise<Product | null>;
  refreshProducts: () => Promise<void>;
  getCategoryStats: () => Promise<any[]>;
  bulkUpdateStock: (updates: Array<{ productId: string; stock: number; inStock?: boolean }>) => Promise<any>;
  getInventoryReport: (lowStockThreshold?: number) => Promise<any>;
}

export const useProducts = (initialParams?: ProductQueryParams) => {
  const [state, setState] = useState<UseProductsState>({
    products: [],
    pagination: null,
    categories: [],
    loading: false,
    error: null,
  });

  const [currentParams, setCurrentParams] = useState<ProductQueryParams>(initialParams || {});
  const { toast } = useToast();

  const fetchProducts = useCallback(async (params?: ProductQueryParams) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const queryParams = params || currentParams;
      setCurrentParams(queryParams);
      
      const response = await productService.getProducts(queryParams);
      setState(prev => ({
        ...prev,
        products: response.products,
        pagination: response.pagination,
        loading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch products';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [currentParams, toast]);

  const fetchCategories = useCallback(async () => {
    try {
      const categories = await productService.getCategories();
      setState(prev => ({ ...prev, categories }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch categories';
      console.error('Error fetching categories:', errorMessage);
    }
  }, []);

  const createProduct = useCallback(async (productData: CreateProductData): Promise<Product | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const newProduct = await productService.createProduct(productData);
      
      // Add the new product to the current list
      setState(prev => ({
        ...prev,
        products: [newProduct, ...prev.products],
        loading: false,
      }));

      toast({
        title: "Success",
        description: "Product created successfully",
      });

      return newProduct;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create product';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      return null;
    }
  }, [toast]);

  const updateProduct = useCallback(async (id: string, productData: Partial<CreateProductData>): Promise<Product | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const updatedProduct = await productService.updateProduct(id, productData);
      
      // Update the product in the current list
      setState(prev => ({
        ...prev,
        products: prev.products.map(product => 
          product._id === id ? updatedProduct : product
        ),
        loading: false,
      }));

      toast({
        title: "Success",
        description: "Product updated successfully",
      });

      return updatedProduct;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update product';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      return null;
    }
  }, [toast]);

  const deleteProduct = useCallback(async (id: string): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await productService.deleteProduct(id);
      
      // Remove the product from the current list
      setState(prev => ({
        ...prev,
        products: prev.products.filter(product => product._id !== id),
        loading: false,
      }));

      toast({
        title: "Success",
        description: "Product deleted successfully",
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete product';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      return false;
    }
  }, [toast]);

  const updateStock = useCallback(async (id: string, stock: number, inStock?: boolean): Promise<Product | null> => {
    try {
      const updatedProduct = await productService.updateStock(id, stock, inStock);
      
      // Update the product in the current list
      setState(prev => ({
        ...prev,
        products: prev.products.map(product => 
          product._id === id ? updatedProduct : product
        ),
      }));

      toast({
        title: "Success",
        description: "Stock updated successfully",
      });

      return updatedProduct;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update stock';
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      return null;
    }
  }, [toast]);

  const refreshProducts = useCallback(async () => {
    await fetchProducts(currentParams);
  }, [fetchProducts, currentParams]);

  const getCategoryStats = useCallback(async () => {
    try {
      return await productService.getCategoryStats();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch category statistics';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return [];
    }
  }, [toast]);

  const bulkUpdateStock = useCallback(async (updates: Array<{ productId: string; stock: number; inStock?: boolean }>) => {
    try {
      const result = await productService.bulkUpdateStock(updates);
      
      // Refresh products to get updated data
      await refreshProducts();
      
      toast({
        title: "Success",
        description: `Bulk update completed: ${result.updated} updated, ${result.failed} failed`,
      });
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to bulk update stock';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast, refreshProducts]);

  const getInventoryReport = useCallback(async (lowStockThreshold: number = 5) => {
    try {
      return await productService.getInventoryReport(lowStockThreshold);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch inventory report';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  // Initial load
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const actions: UseProductsActions = {
    fetchProducts,
    fetchCategories,
    createProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    refreshProducts,
    getCategoryStats,
    bulkUpdateStock,
    getInventoryReport,
  };

  return {
    ...state,
    ...actions,
  };
};