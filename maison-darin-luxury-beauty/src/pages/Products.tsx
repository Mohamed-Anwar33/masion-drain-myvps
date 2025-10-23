import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Search, Grid, List, ArrowUpDown, Heart, Loader2, ShoppingCart } from "lucide-react";
import { translations } from "@/data/translations";
import { categories } from "@/data/products";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { CategoryFilter } from "@/components/ui/category-filter";
import { useProducts } from "@/hooks/useProducts";

const Products = () => {
  const navigate = useNavigate(); // إضافة استخدام useNavigate للتنقل
  const [currentLang, setCurrentLang] = useState<'en' | 'ar'>(
    () => (localStorage.getItem('lang') as 'en' | 'ar') || 'en'
  );
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const { addToCart } = useCart();
  const { toast } = useToast();
  
  // Use the products hook to get data from database
  const { products: dbProducts, loading, error, fetchProducts } = useProducts();

  const handleLanguageChange = (lang: 'en' | 'ar') => {
    setCurrentLang(lang);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
    try {
      localStorage.setItem('lang', lang);
    } catch {}
    try {
      window.dispatchEvent(new CustomEvent<'en' | 'ar'>('lang:change', { detail: lang }));
    } catch {}
  };

  useEffect(() => {
    document.documentElement.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', currentLang);
    try {
      localStorage.setItem('lang', currentLang);
    } catch {}
  }, [currentLang]);

  const handleAddToCart = (product: any) => {
    // Debug: log original product
    console.log('🛒 Adding product to cart - Original:', {
      productId: product._id || product.id,
      productName: product.name,
      originalImages: product.images,
      firstImageUrl: product.images?.[0]?.url,
      hasImages: !!product.images,
      imagesLength: product.images?.length
    });

    // Convert product to cart format
    const cartProduct = {
      id: product._id || product.id,
      name: product.name,
      description: product.description,
      longDescription: product.longDescription,
      price: product.price,
      size: product.size,
      category: product.category,
      image: product.images?.[0]?.url || '',
      images: product.images?.map((img: any) => img.url) || [],
      featured: product.featured,
      inStock: product.inStock,
      stock: product.stock,
      concentration: product.concentration,
      notes: product.notes || {
        top: { en: [], ar: [] },
        middle: { en: [], ar: [] },
        base: { en: [], ar: [] }
      }
    };

    // Debug: log converted product
    console.log('🛒 Adding product to cart - Converted:', {
      cartProductId: cartProduct.id,
      cartProductName: cartProduct.name,
      cartImage: cartProduct.image,
      cartImages: cartProduct.images,
      fullCartProduct: cartProduct
    });
    
    addToCart(cartProduct);
    toast({
      title: currentLang === 'ar' ? "تم إضافة المنتج!" : "Product Added!",
      description: currentLang === 'ar' 
        ? `تم إضافة ${product.name[currentLang]} إلى السلة` 
        : `${product.name[currentLang]} added to cart`,
    });
  };

  // Filter products from database
  useEffect(() => {
    if (!dbProducts || !Array.isArray(dbProducts)) {
      setFilteredProducts([]);
      return;
    }

    let filtered = dbProducts;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name?.[currentLang]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.[currentLang]?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Filter by price range
    if (priceRange !== 'all') {
      const [min, max] = priceRange.split('-').map(Number);
      filtered = filtered.filter(product => {
        if (max) {
          return product.price >= min && product.price <= max;
        } else {
          return product.price >= min;
        }
      });
    }

    setFilteredProducts(filtered);
  }, [searchTerm, selectedCategory, priceRange, currentLang, dbProducts]);

  const t = translations[currentLang];

  return (
    <div className="min-h-screen bg-background">
      <Header 
        currentLang={currentLang}
        onLanguageChange={handleLanguageChange}
        translations={t}
      />
      
      <main className="container mx-auto px-4 py-8 mt-20">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
            {t.collections.title}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t.collections.subtitle}
          </p>
        </motion.div>

        {/* Search and View Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className={`absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground ${currentLang === 'ar' ? 'right-3' : 'left-3'}`} />
              <Input
                placeholder={currentLang === 'ar' ? "ابحث عن العطور..." : "Search perfumes..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={currentLang === 'ar' ? 'pr-10' : 'pl-10'}
              />
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Advanced Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <CategoryFilter
            currentLang={currentLang}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedPriceRange={priceRange}
            onPriceRangeChange={setPriceRange}
            productCount={filteredProducts?.length || 0}
          />
        </motion.div>

        {/* Loading State */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center items-center py-12"
          >
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2 text-lg text-muted-foreground">
              {currentLang === 'ar' ? 'جاري تحميل المنتجات...' : 'Loading products...'}
            </span>
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-lg text-red-500 mb-4">
              {currentLang === 'ar' ? 'خطأ في تحميل المنتجات' : 'Error loading products'}
            </p>
            <Button onClick={() => fetchProducts()} variant="outline">
              {currentLang === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
            </Button>
          </motion.div>
        )}

        {/* Products Grid/List */}
        {!loading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={
              viewMode === 'grid'
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-6"
            }
          >
            {filteredProducts.map((product, index) => (
            <motion.div
              key={product._id || product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* نستخدم onClick بدلاً من Link المحيط لمنع تداخل الروابط */}
              <Card 
                onClick={(e) => {
                  // استخدام navigate بشكل صحيح للانتقال إلى صفحة المنتج
                  e.preventDefault();
                  navigate(`/product/${product._id || product.id}`);
                }}
                className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-card/50 backdrop-blur border-border/50 cursor-pointer"
              >
                <div className="relative overflow-hidden rounded-t-lg">
                  <img
                    src={
                      product.images?.[0]?.url && !product.images[0].url.includes('/api/placeholder') 
                        ? product.images[0].url 
                        : `https://images.unsplash.com/photo-${
                            product.category === 'woody' ? '1541643600914-78b084683601' :
                            product.category === 'floral' ? '1594736797933-d0501ba2fe65' :
                            product.category === 'citrus' ? '1615397349754-cda4d2238e1c' :
                            product.category === 'oriental' ? '1615397349754-cda4d2238e1c' :
                            '1541643600914-78b084683601'
                          }?w=400&h=600&fit=crop&auto=format`
                    }
                    alt={product.name?.[currentLang] || product.name?.ar || product.name?.en || 'Product'}
                    className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {product.featured && (
                    <Badge className={`absolute top-3 ${currentLang === 'ar' ? 'right-3' : 'left-3'} bg-accent text-accent-foreground`}>
                      {currentLang === 'ar' ? "مميز" : "Featured"}
                    </Badge>
                  )}
                  {!product.inStock && (
                    <Badge variant="secondary" className={`absolute top-3 ${currentLang === 'ar' ? 'left-3' : 'right-3'}`}>
                      {currentLang === 'ar' ? "غير متوفر" : "Out of Stock"}
                    </Badge>
                  )}
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {product.name?.[currentLang] || product.name?.ar || product.name?.en || 'منتج'}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {categories[product.category as keyof typeof categories]?.[currentLang] || product.category}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm">
                    {product.description?.[currentLang] || product.description?.ar || product.description?.en || 'وصف المنتج'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-bold text-primary">
                      {product.price} {currentLang === 'ar' ? 'ريال' : 'SAR'}
                    </span>
                    <Badge variant="outline">{product.size}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex-1"
                      asChild
                    >
                      <Link to={`/product/${product._id || product.id}`}>
                        {currentLang === 'ar' ? "عرض التفاصيل" : "View Details"}
                      </Link>
                    </Button>
                    <Button 
                      size="sm" 
                      disabled={!product.inStock}
                      onClick={(e) => {
                        e.preventDefault();
                        handleAddToCart(product);
                      }}
                      className="px-3"
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          </motion.div>
        )}

        {!loading && !error && filteredProducts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-lg text-muted-foreground">
              {currentLang === 'ar' ? "لم يتم العثور على منتجات" : "No products found"}
            </p>
          </motion.div>
        )}
      </main>

      <Footer currentLang={currentLang} translations={t} />
    </div>
  );
};

export default Products;