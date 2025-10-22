import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Star, Filter, SortAsc } from 'lucide-react';
import { useSiteContent } from '@/hooks/useSiteContent';
import { categoryService, Category } from '@/services/categoryService';
import { productService, Product, ProductsResponse } from '@/services/productService';
import { useToast } from '@/hooks/use-toast';

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [currentLang, setCurrentLang] = useState<'en' | 'ar'>(
    () => (localStorage.getItem('lang') as 'en' | 'ar') || 'ar'
  );

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price-low' | 'price-high' | 'name'>('newest');
  const [filterInStock, setFilterInStock] = useState<boolean | null>(null);

  const { content: t } = useSiteContent(currentLang);
  const { toast } = useToast();

  // Handle language change
  const handleLanguageChange = (lang: 'en' | 'ar') => {
    setCurrentLang(lang);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
    try {
      localStorage.setItem('lang', lang);
    } catch {}
  };

  // Fetch category data
  useEffect(() => {
    const fetchCategory = async () => {
      if (!slug) return;
      
      try {
        setLoading(true);
        const categoryData = await categoryService.getCategoryBySlug(slug);
        setCategory(categoryData);
      } catch (error) {
        console.error('Error fetching category:', error);
        toast({
          title: currentLang === 'ar' ? 'خطأ' : 'Error',
          description: currentLang === 'ar' 
            ? 'فشل في تحميل بيانات القسم'
            : 'Failed to load category data',
          variant: 'destructive',
        });
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };

    fetchCategory();
  }, [slug, navigate, currentLang, toast]);

  // Fetch products for this category
  useEffect(() => {
    const fetchProducts = async () => {
      if (!category) return;

      try {
        setProductsLoading(true);
        const productsResponse = await productService.getProducts({
          category: category._id,
          inStock: filterInStock ?? undefined,
          sortBy: getSortBy(sortBy),
          sortOrder: getSortOrder(sortBy),
        });
        setProducts(productsResponse.products);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast({
          title: currentLang === 'ar' ? 'خطأ' : 'Error',
          description: currentLang === 'ar' 
            ? 'فشل في تحميل المنتجات'
            : 'Failed to load products',
          variant: 'destructive',
        });
      } finally {
        setProductsLoading(false);
      }
    };

    fetchProducts();
  }, [category, sortBy, filterInStock, currentLang, toast]);

  const getSortBy = (sort: string) => {
    switch (sort) {
      case 'newest':
      case 'oldest':
        return 'createdAt';
      case 'price-low':
      case 'price-high':
        return 'price';
      case 'name':
        return 'name';
      default:
        return 'createdAt';
    }
  };

  const getSortOrder = (sort: string) => {
    switch (sort) {
      case 'newest':
      case 'price-high':
        return 'desc';
      case 'oldest':
      case 'price-low':
      case 'name':
        return 'asc';
      default:
        return 'desc';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {currentLang === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">
            {currentLang === 'ar' ? 'القسم غير موجود' : 'Category Not Found'}
          </h1>
          <Button onClick={() => navigate('/products')}>
            {currentLang === 'ar' ? 'العودة للمنتجات' : 'Back to Products'}
          </Button>
        </div>
      </div>
    );
  }

  const isRTL = currentLang === 'ar';

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header 
        currentLang={currentLang}
        onLanguageChange={handleLanguageChange}
        translations={t}
      />
      
      <main className="pt-20">
        {/* Category Hero Section */}
        <section className="py-16 bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              {/* Breadcrumb */}
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate('/')}
                  className="p-0 h-auto font-normal"
                >
                  {currentLang === 'ar' ? 'الرئيسية' : 'Home'}
                </Button>
                <ArrowRight className="w-4 h-4" />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate('/products')}
                  className="p-0 h-auto font-normal"
                >
                  {currentLang === 'ar' ? 'المنتجات' : 'Products'}
                </Button>
                <ArrowRight className="w-4 h-4" />
                <span>{category.name[currentLang]}</span>
              </div>

              <h1 className="text-4xl lg:text-6xl font-display font-bold text-foreground mb-4">
                {category.name[currentLang]}
              </h1>
              
              {category.description?.[currentLang] && (
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
                  {category.description[currentLang]}
                </p>
              )}

              <div className="flex items-center justify-center gap-4">
                <Badge variant="secondary" className="text-sm">
                  {products.length} {currentLang === 'ar' ? 'منتج' : 'products'}
                </Badge>
                {category.isActive && (
                  <Badge variant="default" className="text-sm">
                    {currentLang === 'ar' ? 'قسم نشط' : 'Active Category'}
                  </Badge>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Filters and Sort */}
        <section className="py-8 border-b">
          <div className="container mx-auto px-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button
                  variant={filterInStock === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterInStock(null)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {currentLang === 'ar' ? 'الكل' : 'All'}
                </Button>
                <Button
                  variant={filterInStock === true ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterInStock(true)}
                >
                  {currentLang === 'ar' ? 'متوفر' : 'In Stock'}
                </Button>
                <Button
                  variant={filterInStock === false ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterInStock(false)}
                >
                  {currentLang === 'ar' ? 'غير متوفر' : 'Out of Stock'}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <SortAsc className="w-4 h-4" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-background border border-border rounded-md px-3 py-1 text-sm"
                >
                  <option value="newest">
                    {currentLang === 'ar' ? 'الأحدث' : 'Newest'}
                  </option>
                  <option value="oldest">
                    {currentLang === 'ar' ? 'الأقدم' : 'Oldest'}
                  </option>
                  <option value="price-low">
                    {currentLang === 'ar' ? 'السعر: من الأقل للأعلى' : 'Price: Low to High'}
                  </option>
                  <option value="price-high">
                    {currentLang === 'ar' ? 'السعر: من الأعلى للأقل' : 'Price: High to Low'}
                  </option>
                  <option value="name">
                    {currentLang === 'ar' ? 'الاسم' : 'Name'}
                  </option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Products Grid */}
        <section className="py-16">
          <div className="container mx-auto px-6">
            {productsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-muted rounded-lg h-64 mb-4"></div>
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
              >
                {products.map((product, index) => (
                  <motion.div
                    key={product._id}
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.6 }}
                  >
                    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer">
                      <div 
                        onClick={() => navigate(`/product/${product._id}`)}
                        className="block"
                      >
                        <div className="relative overflow-hidden">
                          <img
                            src={product.images?.[0]?.url || '/placeholder.svg'}
                            alt={product.name[currentLang]}
                            className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {!product.inStock && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <Badge variant="destructive">
                                {currentLang === 'ar' ? 'غير متوفر' : 'Out of Stock'}
                              </Badge>
                            </div>
                          )}
                        </div>

                        <CardContent className="p-4">
                          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                            {product.name[currentLang]}
                          </h3>
                          
                          {product.description?.[currentLang] && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {product.description[currentLang]}
                            </p>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-lg font-bold text-primary">
                                ${product.price || 0}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm text-muted-foreground">4.5</span>
                            </div>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-16">
                <h3 className="text-xl font-semibold mb-4">
                  {currentLang === 'ar' ? 'لا توجد منتجات' : 'No Products Found'}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {currentLang === 'ar' 
                    ? 'لا توجد منتجات في هذا القسم حالياً'
                    : 'There are no products in this category yet'
                  }
                </p>
                <Button onClick={() => navigate('/products')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {currentLang === 'ar' ? 'تصفح المنتجات' : 'Browse Products'}
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer currentLang={currentLang} translations={t} />
    </div>
  );
};

export default CategoryPage;
