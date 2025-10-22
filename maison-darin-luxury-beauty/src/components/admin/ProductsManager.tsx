import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Package,
  Image as ImageIcon,
  Save,
  Upload
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ProductDialog } from './ProductDialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

interface Product {
  _id: string;
  name: {
    en: string;
    ar: string;
  };
  description: {
    en: string;
    ar: string;
  };
  price: number;
  size: string;
  category: string;
  images: Array<string | { url: string; alt?: { en: string; ar: string }; order?: number }>;
  inStock: boolean;
  stock: number;
  createdAt: string;
}

interface ProductsManagerProps {
  currentLang: 'en' | 'ar';
}

export function ProductsManager({ currentLang }: ProductsManagerProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<Array<{value: string; label: string}>>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 جاري تحميل المنتجات...');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/products`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 استجابة الخادم:', response.status, response.statusText);
      
      if (response.ok) {
        const result = await response.json();
        console.log('📦 البيانات المستلمة:', result);
        
        // API returns data.data not data.products
        const products = result.data || result.products || [];
        console.log('🎯 عدد المنتجات:', products.length);
        
        setProducts(products);
        toast.success(`تم تحميل ${products.length} منتج بنجاح`);
      } else {
        const errorData = await response.text();
        console.error('❌ خطأ من الخادم:', response.status, errorData);
        toast.error(`فشل في تحميل المنتجات: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ خطأ في الاتصال:', error);
      toast.error('خطأ في الاتصال بالخادم - تأكد من تشغيل الخادم على localhost:5000');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle product deletion
  const handleDeleteProduct = async (productId: string, productName: string) => {
    // Show elegant confirmation toast
    const confirmDelete = await new Promise<boolean>((resolve) => {
      toast.custom(
        (t: any) => (
          <div className="bg-white border border-red-200 rounded-lg shadow-lg p-6 max-w-md mx-auto" dir="rtl">
            <div className="flex items-start space-x-4 rtl:space-x-reverse">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  🗑️ تأكيد الحذف
                </h3>
                <p className="text-gray-600 mb-4">
                  هل أنت متأكد من حذف المنتج <span className="font-bold text-red-600">"{productName}"</span>؟
                </p>
                <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-500 ml-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-red-700">
                      ⚠️ هذا الإجراء لا يمكن التراجع عنه! سيتم حذف المنتج نهائياً من النظام.
                    </span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      toast.dismiss(t.id);
                      resolve(true);
                    }}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors font-medium"
                  >
                    🗑️ نعم، احذف المنتج
                  </button>
                  <button
                    onClick={() => {
                      toast.dismiss(t.id);
                      resolve(false);
                    }}
                    className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors font-medium"
                  >
                    ❌ إلغاء
                  </button>
                </div>
              </div>
            </div>
          </div>
        ),
        {
          duration: Infinity,
          position: 'top-center',
        }
      );
    });
    
    if (!confirmDelete) return;

    try {
      setIsDeleting(true);
      setDeleteProductId(productId);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Remove product from local state
        setProducts(prev => prev.filter(p => p._id !== productId));
        toast.success(`🎉 تم حذف "${productName}" بنجاح!\n✨ المنتج لم يعد متاحاً في المتجر.`);
      } else {
        const errorData = await response.text();
        toast.error(`❌ فشل في حذف المنتج!\n🔧 ${response.status}: ${errorData}`);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error(`💥 خطأ في الاتصال!\n🌐 تأكد من اتصالك بالإنترنت والخادم.`);
    } finally {
      setIsDeleting(false);
      setDeleteProductId(null);
    }
  };

  // Handle product editing
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
    toast.info(`✏️ جاري تحضير نموذج التعديل...\n📝 يمكنك الآن تعديل بيانات "${product.name?.ar || product.name?.en}"`);
  };

  // Handle adding new product
  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsDialogOpen(true);
    toast.info(`➕ إضافة منتج جديد\n🎯 املأ البيانات المطلوبة لإضافة منتج فاخر جديد للمجموعة`);
  };

  // Handle saving product (add or update)
  const handleSaveProduct = (savedProduct: Product) => {
    if (editingProduct) {
      // Update existing product
      setProducts(prev => prev.map(p => p._id === savedProduct._id ? savedProduct : p));
    } else {
      // Add new product
      setProducts(prev => [...prev, savedProduct]);
    }
  };

  const isRTL = currentLang === 'ar';

  // Category translations
  const categoryTranslations = {
    'floral': 'زهري',
    'oriental': 'شرقي', 
    'fresh': 'منعش',
    'woody': 'خشبي',
    'citrus': 'حمضي',
    'spicy': 'حار',
    'aquatic': 'مائي',
    'gourmand': 'حلو'
  };

  // Fallback images for products
  const fallbackImages = [
    'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=400&fit=crop&q=80',
    'https://images.unsplash.com/photo-1588405748880-12d1d2a59d75?w=400&h=400&fit=crop&q=80',
    'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400&h=400&fit=crop&q=80',
    'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400&h=400&fit=crop&q=80',
    'https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=400&h=400&fit=crop&q=80',
    'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=400&fit=crop&q=80',
    'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=400&h=400&fit=crop&q=80',
    'https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=400&h=400&fit=crop&q=80'
  ];

  // Function to get product image
  const getProductImage = (product: Product, index: number) => {
    if (product.images && product.images.length > 0) {
      const firstImage = product.images[0];
      const imageUrl = typeof firstImage === 'string' ? firstImage : (firstImage as any)?.url;
      
      // Check if Cloudinary image is accessible
      if (imageUrl && imageUrl.includes('cloudinary')) {
        return imageUrl;
      }
    }
    
    // Use fallback image
    return fallbackImages[index % fallbackImages.length];
  };

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.ar?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.name?.en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.ar?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-gold border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-off-white mb-2">
            إدارة المنتجات
          </h1>
          <p className="text-beige/80">
            إدارة وتعديل منتجات الموقع
          </p>
        </div>
        <Button 
          onClick={handleAddProduct}
          className="bg-gold hover:bg-gold/90 text-dark-tea"
        >
          <Plus className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
          إضافة منتج جديد
        </Button>
      </div>

      {/* Stats */}
      <Card className="bg-off-white/95 backdrop-blur-sm border-gold/20 shadow-luxury">
        <CardHeader>
          <CardTitle className="text-dark-tea">إحصائيات المنتجات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gold">{products.length}</div>
              <div className="text-sm text-dark-tea/60">إجمالي المنتجات</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gold">
                {products.filter(p => p.inStock).length}
              </div>
              <div className="text-sm text-dark-tea/60">متوفر</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gold">
                {products.filter(p => !p.inStock).length}
              </div>
              <div className="text-sm text-dark-tea/60">غير متوفر</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gold">
                {products.length > 0 ? Math.round(products.reduce((sum, p) => sum + p.price, 0) / products.length) : 0}
              </div>
              <div className="text-sm text-dark-tea/60">متوسط السعر</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <Card className="bg-off-white/95 backdrop-blur-sm border-gold/20 shadow-luxury">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className={`absolute top-1/2 transform -translate-y-1/2 ${isRTL ? 'right-3' : 'left-3'} w-4 h-4 text-dark-tea/40`} />
              <Input
                placeholder="البحث في المنتجات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${isRTL ? 'pr-10' : 'pl-10'} bg-white/50 border-gold/20 focus:border-gold/50`}
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48 bg-white/50 border-gold/20">
                <SelectValue placeholder="اختر الفئة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفئات</SelectItem>
                {Object.entries(categoryTranslations).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products List */}
      <div className="space-y-4">
        {filteredProducts.length === 0 ? (
          <Card className="bg-off-white/95 backdrop-blur-sm border-gold/20 shadow-luxury">
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 text-dark-tea/40 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-dark-tea mb-2">لا توجد منتجات</h3>
              <p className="text-dark-tea/60">لم يتم العثور على منتجات تطابق البحث</p>
            </CardContent>
          </Card>
        ) : (
          filteredProducts.map((product, index) => (
            <Card key={product._id} className="bg-off-white/95 backdrop-blur-sm border-gold/20 shadow-luxury hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Product Image */}
                  <div className="w-full md:w-32 h-32 bg-gradient-to-br from-gold/10 to-light-brown/10 rounded-lg flex items-center justify-center overflow-hidden">
                    <img 
                      src={getProductImage(product, index)} 
                      alt={product.name?.ar || product.name?.en || 'منتج'}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        // Fallback to placeholder if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="w-12 h-12 text-dark-tea/40"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"></path><path d="M12 22V12"></path><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"></path><path d="m7.5 4.27 9 5.15"></path></svg></div>';
                        }
                      }}
                    />
                  </div>

                  {/* Product Info */}
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-dark-tea mb-2">
                          {product.name?.ar || product.name?.en || 'منتج بدون اسم'}
                        </h3>
                        <p className="text-dark-tea/70 mb-3 line-clamp-2">
                          {product.description?.ar || product.description?.en || 'لا يوجد وصف'}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="secondary" className="bg-gold/20 text-dark-tea">
                            {categoryTranslations[product.category] || product.category}
                          </Badge>
                          <Badge variant="secondary" className="bg-light-brown/20 text-dark-tea">
                            {product.size}
                          </Badge>
                          <Badge 
                            variant={product.inStock ? "default" : "destructive"}
                            className={product.inStock ? "bg-green-100 text-green-800" : ""}
                          >
                            {product.inStock ? `متوفر (${product.stock})` : 'غير متوفر'}
                          </Badge>
                        </div>
                        <div className="text-2xl font-bold text-gold">
                          {product.price} ريال
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditProduct(product)}
                            className="border-gold/30 text-dark-tea hover:bg-gold/10"
                          >
                            <Edit className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0" />
                            تعديل
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteProduct(product._id, product.name?.ar || product.name?.en || 'منتج')}
                            disabled={isDeleting && deleteProductId === product._id}
                            className={isDeleting && deleteProductId === product._id ? 'opacity-50 cursor-not-allowed' : ''}
                          >
                            {isDeleting && deleteProductId === product._id ? (
                              <div className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0 animate-spin border-2 border-white border-t-transparent rounded-full"></div>
                            ) : (
                              <Trash2 className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0" />
                            )}
                            {isDeleting && deleteProductId === product._id ? 'جاري الحذف...' : 'حذف'}
                          </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Product Dialog */}
      <ProductDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        product={editingProduct}
        onSave={handleSaveProduct}
      />
    </div>
  );
}
