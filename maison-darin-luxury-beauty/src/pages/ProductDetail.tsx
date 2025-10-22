import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShoppingBag, Heart, Share2, Star, Sparkles, Award, Shield, Truck, RotateCcw, ChevronLeft, ChevronRight, Zap, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { translations } from "@/data/translations";
import { categories } from "@/data/products";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { productService, Product } from "@/services/productService";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addToCart } = useCart();
  const [currentLang, setCurrentLang] = useState<'en' | 'ar'>('en');
  const [selectedImage, setSelectedImage] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const handleLanguageChange = (lang: 'en' | 'ar') => {
    setCurrentLang(lang);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
  };

  useEffect(() => {
    document.documentElement.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', currentLang);
  }, [currentLang]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const fetchedProduct = await productService.getProductById(id);
        setProduct(fetchedProduct);
      } catch (error) {
        console.error('Error fetching product:', error);
        toast({
          title: "خطأ",
          description: "فشل في تحميل تفاصيل المنتج",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, toast]);

  const handleAddToCart = () => {
    if (product) {
      // Convert API Product to Cart Product format
      const cartProduct = {
        id: parseInt(product._id) || 0,
        name: product.name,
        description: product.description,
        longDescription: product.longDescription,
        price: product.price,
        size: product.size,
        category: product.category,
        image: product.images?.[0]?.url || '',
        images: product.images?.map(img => img.url) || [],
        featured: product.featured,
        inStock: product.inStock,
        concentration: product.concentration,
        notes: product.notes || {
          top: { en: [], ar: [] },
          middle: { en: [], ar: [] },
          base: { en: [], ar: [] }
        }
      };
      
      addToCart(cartProduct as any);
      toast({
        title: currentLang === 'ar' ? "تم إضافة المنتج!" : "Product Added!",
        description: currentLang === 'ar' 
          ? `تم إضافة ${product.name[currentLang]} إلى السلة` 
          : `${product.name[currentLang]} added to cart`,
      });
    }
  };

  const handleRequestSample = () => {
    toast({
      title: currentLang === 'ar' ? "تم طلب العينة!" : "Sample Requested!",
      description: currentLang === 'ar' 
        ? "سنتواصل معك قريباً لترتيب إرسال العينة" 
        : "We'll contact you soon to arrange sample delivery",
    });
  };

  const handleAddToWishlist = () => {
    setIsWishlisted(!isWishlisted);
    toast({
      title: isWishlisted 
        ? (currentLang === 'ar' ? "تم إزالة من المفضلة" : "Removed from Wishlist")
        : (currentLang === 'ar' ? "تم إضافة للمفضلة" : "Added to Wishlist"),
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.name[currentLang],
        text: product?.description[currentLang],
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        description: currentLang === 'ar' ? "تم نسخ رابط المنتج" : "Product link copied to clipboard",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h1 className="text-xl font-bold">Loading Product...</h1>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Button onClick={() => navigate('/products')}>
            {currentLang === 'ar' ? "العودة للمنتاجات" : "Back to Products"}
          </Button>
        </div>
      </div>
    );
  }

  const t = translations[currentLang];
  // Skip related products for now since we're using API data
  const relatedProducts: any[] = [];

  return (
    <div className="min-h-screen bg-background">
      <Header 
        currentLang={currentLang}
        onLanguageChange={handleLanguageChange}
        translations={t}
      />
      
      <main className="container mx-auto px-4 py-8 mt-20">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/products')}
            className="mb-4"
          >
            {currentLang === 'ar' ? (
              <>
                {currentLang === 'ar' && <ArrowLeft className="hidden" />}
                {/* In RTL, place the icon on the right visually by using margin-left */}
                <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                {" "}
                {"العودة للمنتجات"}
              </>
            ) : (
              <>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {"Back to Products"}
              </>
            )}
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20">
          {/* Product Images - Enhanced Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6"
          >
            {/* Main Image with Luxury Frame */}
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-gold/20 via-transparent to-gold/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-gold/20 shadow-2xl">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={selectedImage}
                    src={
                      product.images?.[selectedImage]?.url && !product.images[selectedImage].url.includes('/api/placeholder') 
                        ? product.images[selectedImage].url 
                        : `https://images.unsplash.com/photo-${
                            product.category === 'woody' ? '1541643600914-78b084683601' :
                            product.category === 'floral' ? '1594736797933-d0501ba2fe65' :
                            product.category === 'citrus' ? '1615397349754-cda4d2238e1c' :
                            product.category === 'oriental' ? '1615397349754-cda4d2238e1c' :
                            '1541643600914-78b084683601'
                          }?w=600&h=800&fit=crop&auto=format`
                    }
                    alt={product.name[currentLang]}
                    className="w-full h-96 lg:h-[600px] object-cover"
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  />
                </AnimatePresence>
                
                {/* Luxury Badges */}
                <div className={`absolute top-6 ${currentLang === 'ar' ? 'right-6' : 'left-6'} flex flex-col gap-2`}>
                  {product.featured && (
                    <Badge className="bg-gradient-to-r from-gold to-amber-400 text-dark-tea border-0 shadow-lg backdrop-blur-sm">
                      <Sparkles className="w-3 h-3 mr-1" />
                      {currentLang === 'ar' ? "مميز" : "Featured"}
                    </Badge>
                  )}
                  <Badge className="bg-gradient-to-r from-primary/90 to-primary/70 text-white border-0 shadow-lg backdrop-blur-sm">
                    <Award className="w-3 h-3 mr-1" />
                    {categories[product.category as keyof typeof categories][currentLang]}
                  </Badge>
                </div>

                {!product.inStock && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                    <Badge variant="destructive" className="text-lg px-6 py-2">
                      {currentLang === 'ar' ? "غير متوفر" : "Out of Stock"}
                    </Badge>
                  </div>
                )}

                {/* Navigation Arrows */}
                {product.images.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`absolute top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white border-0 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 ${currentLang === 'ar' ? 'right-4' : 'left-4'}`}
                      onClick={() => setSelectedImage(selectedImage > 0 ? selectedImage - 1 : product.images.length - 1)}
                    >
                      {currentLang === 'ar' ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`absolute top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white border-0 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 ${currentLang === 'ar' ? 'left-4' : 'right-4'}`}
                      onClick={() => setSelectedImage(selectedImage < product.images.length - 1 ? selectedImage + 1 : 0)}
                    >
                      {currentLang === 'ar' ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </Button>
                  </>
                )}
              </div>
            </div>
            
            {/* Thumbnail Gallery */}
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((image, index) => (
                <motion.button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                    selectedImage === index 
                      ? 'border-gold shadow-lg shadow-gold/25 scale-105' 
                      : 'border-border/50 hover:border-gold/50 hover:scale-102'
                  }`}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <img
                    src={
                      image?.url && !image.url.includes('/api/placeholder') 
                        ? image.url 
                        : `https://images.unsplash.com/photo-${
                            product.category === 'woody' ? '1541643600914-78b084683601' :
                            product.category === 'floral' ? '1594736797933-d0501ba2fe65' :
                            product.category === 'citrus' ? '1615397349754-cda4d2238e1c' :
                            product.category === 'oriental' ? '1615397349754-cda4d2238e1c' :
                            '1541643600914-78b084683601'
                          }?w=200&h=200&fit=crop&auto=format`
                    }
                    alt={`${product.name[currentLang]} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {selectedImage === index && (
                    <div className="absolute inset-0 bg-gold/20 backdrop-blur-[1px]"></div>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Product Details - Luxury Layout */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="space-y-8"
          >
            {/* Product Header */}
            <div className="space-y-4">
              <motion.h1 
                className="text-4xl lg:text-5xl font-display font-bold bg-gradient-to-r from-primary via-gold to-primary bg-clip-text text-transparent leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                {product.name[currentLang]}
              </motion.h1>
              <motion.p 
                className="text-xl text-muted-foreground leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                {product.description[currentLang]}
              </motion.p>
            </div>

            {/* Price and Details */}
            <motion.div 
              className="flex flex-wrap items-center gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <div className="flex items-center gap-2">
                <span className="text-4xl font-bold bg-gradient-to-r from-primary to-gold bg-clip-text text-transparent">
                  ${product.price}
                </span>
                <div className="flex items-center gap-1 ml-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                  ))}
                  <span className="text-sm text-muted-foreground ml-1">(4.9)</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge className="bg-gradient-to-r from-primary to-primary/80 text-white border-primary/50 px-3 py-1 font-medium">
                  {product.concentration[currentLang]}
                </Badge>
                <Badge className="bg-gradient-to-r from-amber-600 to-amber-500 text-white border-amber-400 px-3 py-1 font-medium">
                  {product.size}
                </Badge>
              </div>
            </motion.div>

            {/* Luxury Features */}
            <motion.div 
              className="grid grid-cols-2 gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-card/50 to-card/30 border border-gold/10">
                <Shield className="w-5 h-5 text-gold" />
                <span className="text-sm font-medium">{currentLang === 'ar' ? "أصلي 100%" : "100% Authentic"}</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-card/50 to-card/30 border border-gold/10">
                <Truck className="w-5 h-5 text-gold" />
                <span className="text-sm font-medium">{currentLang === 'ar' ? "شحن مجاني" : "Free Shipping"}</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-card/50 to-card/30 border border-gold/10">
                <RotateCcw className="w-5 h-5 text-gold" />
                <span className="text-sm font-medium">{currentLang === 'ar' ? "إرجاع مجاني" : "Free Returns"}</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-card/50 to-card/30 border border-gold/10">
                <Zap className="w-5 h-5 text-gold" />
                <span className="text-sm font-medium">{currentLang === 'ar' ? "توصيل سريع" : "Fast Delivery"}</span>
              </div>
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="p-6 rounded-2xl bg-gradient-to-br from-card/60 to-card/30 backdrop-blur-sm border border-gold/10"
            >
              <h3 className="text-2xl font-display font-semibold mb-4 text-primary flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-gold" />
                {currentLang === 'ar' ? "الوصف التفصيلي" : "Detailed Description"}
              </h3>
              <p className="text-muted-foreground leading-relaxed text-lg">
                {product.longDescription[currentLang]}
              </p>
            </motion.div>

            {/* Fragrance Notes - Luxury Design */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="space-y-6"
            >
              <h3 className="text-2xl font-display font-semibold text-primary flex items-center gap-2">
                <Award className="w-5 h-5 text-gold" />
                {currentLang === 'ar' ? "هرم العطر" : "Fragrance Pyramid"}
              </h3>
              
              <div className="space-y-6">
                {/* Top Notes */}
                <div className="relative">
                  <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-gold to-gold/50 rounded-full"></div>
                  <div className="pl-6">
                    <h4 className="font-semibold mb-3 text-lg flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-gold to-amber-400"></div>
                      {currentLang === 'ar' ? "النوتات العلوية" : "Top Notes"}
                      <span className="text-xs text-muted-foreground">({currentLang === 'ar' ? "الانطباع الأول" : "First Impression"})</span>
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {product.notes.top[currentLang].map((note, index) => (
                        <Badge 
                          key={index} 
                          className="bg-gradient-to-r from-amber-600 to-amber-500 text-white border-amber-400 px-3 py-1 hover:shadow-md transition-shadow font-medium"
                        >
                          {note}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Middle Notes */}
                <div className="relative">
                  <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-primary to-primary/50 rounded-full"></div>
                  <div className="pl-6">
                    <h4 className="font-semibold mb-3 text-lg flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary to-primary/70"></div>
                      {currentLang === 'ar' ? "النوتات الوسطى" : "Heart Notes"}
                      <span className="text-xs text-muted-foreground">({currentLang === 'ar' ? "قلب العطر" : "The Heart"})</span>
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {product.notes.middle[currentLang].map((note, index) => (
                        <Badge 
                          key={index} 
                          className="bg-gradient-to-r from-primary to-primary/80 text-white border-primary/50 px-3 py-1 hover:shadow-md transition-shadow font-medium"
                        >
                          {note}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Base Notes */}
                <div className="relative">
                  <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-amber-600 to-amber-800 rounded-full"></div>
                  <div className="pl-6">
                    <h4 className="font-semibold mb-3 text-lg flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-600 to-amber-800"></div>
                      {currentLang === 'ar' ? "النوتات القاعدية" : "Base Notes"}
                      <span className="text-xs text-muted-foreground">({currentLang === 'ar' ? "الأثر الدائم" : "Lasting Trail"})</span>
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {product.notes.base[currentLang].map((note, index) => (
                        <Badge 
                          key={index} 
                          className="bg-gradient-to-r from-amber-900 to-amber-800 text-amber-50 border-amber-600 px-3 py-1 hover:shadow-md transition-shadow font-medium"
                        >
                          {note}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <Separator />

            {/* Luxury Action Buttons */}
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
            >
              <div className="space-y-4">
                {/* Primary Action - Add to Cart */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button 
                    onClick={handleAddToCart}
                    disabled={!product.inStock}
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary via-gold to-primary hover:from-primary/90 hover:via-gold/90 hover:to-primary/90 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    <ShoppingBag className="h-5 w-5 mr-3" />
                    {currentLang === 'ar' ? "أضف إلى السلة" : "Add to Cart"}
                    <span className="ml-2 text-sm opacity-80">
                      ${product.price}
                    </span>
                  </Button>
                </motion.div>

                {/* Secondary Actions */}
                <div className="grid grid-cols-3 gap-3">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      onClick={handleRequestSample}
                      disabled={!product.inStock}
                      className="w-full h-12 border-gold/30 hover:bg-gold/10 hover:border-gold transition-all duration-300"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      {currentLang === 'ar' ? "عينة" : "Sample"}
                    </Button>
                  </motion.div>
                  
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      onClick={handleAddToWishlist}
                      className={`w-full h-12 transition-all duration-300 ${
                        isWishlisted 
                          ? "bg-red-50 border-red-300 text-red-600 hover:bg-red-100" 
                          : "border-gold/30 hover:bg-gold/10 hover:border-gold"
                      }`}
                    >
                      <Heart className={`h-4 w-4 mr-2 ${isWishlisted ? "fill-current" : ""}`} />
                      {currentLang === 'ar' ? "المفضلة" : "Wishlist"}
                    </Button>
                  </motion.div>
                  
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      variant="outline" 
                      onClick={handleShare}
                      className="w-full h-12 border-gold/30 hover:bg-gold/10 hover:border-gold transition-all duration-300"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      {currentLang === 'ar' ? "مشاركة" : "Share"}
                    </Button>
                  </motion.div>
                </div>
              </div>
              
              {!product.inStock && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-center"
                >
                  <p className="text-destructive font-medium">
                    {currentLang === 'ar' 
                      ? "هذا المنتج غير متوفر حالياً - سيتم إشعارك عند توفره" 
                      : "This product is currently out of stock - We'll notify you when available"}
                  </p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-16"
          >
            <h2 className="text-2xl font-bold text-primary mb-8">
              {currentLang === 'ar' ? "منتجات مشابهة" : "Related Products"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Link key={relatedProduct.id} to={`/product/${relatedProduct.id}`}>
                  <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-card/50 backdrop-blur border-border/50">
                    <div className="relative overflow-hidden rounded-t-lg">
                      <img
                        src={relatedProduct.image}
                        alt={relatedProduct.name[currentLang]}
                        className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <CardHeader>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {relatedProduct.name[currentLang]}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {relatedProduct.description[currentLang]}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <span className="text-xl font-bold text-primary">
                        ${relatedProduct.price}
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </motion.section>
        )}
      </main>

      <Footer currentLang={currentLang} translations={t} />
    </div>
  );
};

export default ProductDetail;