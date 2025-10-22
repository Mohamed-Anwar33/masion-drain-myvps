import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  Package, 
  DollarSign,
  Eye,
  RefreshCw
} from 'lucide-react';
import { categoryService } from '@/services/categoryService';
import { productService } from '@/services/productService';

interface AnalyticsDashboardProps {
  currentLang: 'en' | 'ar';
}

export function AnalyticsDashboard({ currentLang }: AnalyticsDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCategories: 0,
    activeCategories: 0,
    totalProducts: 0,
    inStockProducts: 0,
    outOfStockProducts: 0,
    categoryStats: [] as any[]
  });

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch categories
      const categories = await categoryService.getCategories({ includeProductCount: true });
      const activeCategories = categories.filter(cat => cat.isActive);
      
      // Fetch products
      const productsResponse = await productService.getProducts({ limit: 1000 });
      const products = productsResponse.products;
      const inStockProducts = products.filter(p => p.inStock);
      const outOfStockProducts = products.filter(p => !p.inStock);

      // Get category stats
      const categoryStats = await categoryService.getCategoryStats();

      setStats({
        totalCategories: categories.length,
        activeCategories: activeCategories.length,
        totalProducts: products.length,
        inStockProducts: inStockProducts.length,
        outOfStockProducts: outOfStockProducts.length,
        categoryStats: categoryStats.slice(0, 5) // Top 5 categories
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const isRTL = currentLang === 'ar';

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {currentLang === 'ar' ? 'التحليلات والإحصائيات' : 'Analytics & Statistics'}
          </h2>
          <p className="text-muted-foreground">
            {currentLang === 'ar' 
              ? 'نظرة عامة على أداء المتجر والفئات'
              : 'Overview of store performance and categories'
            }
          </p>
        </div>
        <Button onClick={fetchAnalytics} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          {currentLang === 'ar' ? 'تحديث' : 'Refresh'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {currentLang === 'ar' ? 'إجمالي الفئات' : 'Total Categories'}
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCategories}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {stats.activeCategories} {currentLang === 'ar' ? 'نشط' : 'active'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {currentLang === 'ar' ? 'إجمالي المنتجات' : 'Total Products'}
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              {currentLang === 'ar' ? 'منتج في المتجر' : 'products in store'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {currentLang === 'ar' ? 'متوفر في المخزون' : 'In Stock'}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.inStockProducts}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.inStockProducts / stats.totalProducts) * 100) || 0}% 
              {currentLang === 'ar' ? ' من المنتجات' : ' of products'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {currentLang === 'ar' ? 'غير متوفر' : 'Out of Stock'}
            </CardTitle>
            <Eye className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.outOfStockProducts}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.outOfStockProducts / stats.totalProducts) * 100) || 0}% 
              {currentLang === 'ar' ? ' من المنتجات' : ' of products'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            {currentLang === 'ar' ? 'أداء الفئات' : 'Category Performance'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.categoryStats.length > 0 ? (
            <div className="space-y-4">
              {stats.categoryStats.map((category, index) => (
                <div key={category._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium">
                        {category.name[currentLang]}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {category.totalProducts} {currentLang === 'ar' ? 'منتج' : 'products'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        ${category.totalValue?.toFixed(2) || '0.00'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {currentLang === 'ar' ? 'القيمة الإجمالية' : 'Total Value'}
                      </div>
                    </div>
                    
                    <Badge 
                      variant={category.inStockProducts > 0 ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {category.inStockProducts} {currentLang === 'ar' ? 'متوفر' : 'in stock'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{currentLang === 'ar' ? 'لا توجد بيانات للعرض' : 'No data to display'}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>
            {currentLang === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Package className="w-6 h-6" />
              <span className="text-sm">
                {currentLang === 'ar' ? 'إضافة فئة جديدة' : 'Add New Category'}
              </span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <ShoppingCart className="w-6 h-6" />
              <span className="text-sm">
                {currentLang === 'ar' ? 'إضافة منتج جديد' : 'Add New Product'}
              </span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <BarChart3 className="w-6 h-6" />
              <span className="text-sm">
                {currentLang === 'ar' ? 'تقرير مفصل' : 'Detailed Report'}
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
