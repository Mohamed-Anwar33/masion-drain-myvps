import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { useFeaturedCollections } from '../../hooks/useFeaturedCollections';
import { useProducts } from '../../hooks/useProducts';
import LoadingSpinner from '../ui/LoadingSpinner';

interface CollectionsSectionProps {
  currentLang: 'en' | 'ar';
}

export function CollectionsSection({ currentLang }: CollectionsSectionProps) {
  const { collectionsData, loading: collectionsLoading, error: collectionsError } = useFeaturedCollections();
  const { products, loading: productsLoading, error: productsError } = useProducts();
  const isRTL = currentLang === 'ar';
  const [isMobile, setIsMobile] = useState(false);
  
  // Detect mobile view
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  const loading = collectionsLoading || productsLoading;
  const error = collectionsError || productsError;

  // Show loading state
  if (loading) {
    return (
      <section className="py-section bg-soft-neutral relative emblem-bg">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </section>
    );
  }

  // Show error state
  if (error || !collectionsData) {
    return (
      <section className="py-section bg-soft-neutral relative emblem-bg">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center py-12">
            <p className="text-dark-tea">
              {error || 'Failed to load featured collections'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Don't render if section is hidden
  if (!collectionsData.showSection) {
    return null;
  }

  // Get featured products to display (limited by maxCollections setting)
  let collections = products
    .filter(product => product.featured) // Only featured products
    .slice(0, collectionsData?.maxCollections || 4) // Show 3-4 products as requested
    .map((product: any) => ({
      id: product._id || product.id || Math.random().toString(),
      image: typeof product.images?.[0] === 'object' ? product.images[0].url : (product.images?.[0] || 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=500'),
      name: typeof product.name === 'object' ? (product.name[currentLang] || product.name.en) : product.name,
      description: typeof product.description === 'object' ? (product.description[currentLang] || product.description.en) : product.description,
      price: `${product.price} ريال`,
      category: product.category ? (typeof product.category === 'object' ? (product.category[currentLang] || product.category.en) : product.category) : 'عطور',
      slug: product._id || product.id || Math.random().toString(),
      rating: 4.8, // Default rating since it's not in Product interface
      link: `/product/${product._id || product.id}`
    }));

  // If no featured products, show first few products
  if (collections.length === 0) {
    collections = products
      .slice(0, collectionsData?.maxCollections || 4)
      .map((product: any) => ({
        id: product._id || product.id || Math.random().toString(),
        image: typeof product.images?.[0] === 'object' ? product.images[0].url : (product.images?.[0] || 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=500'),
        name: typeof product.name === 'object' ? (product.name[currentLang] || product.name.en) : product.name,
        description: typeof product.description === 'object' ? (product.description[currentLang] || product.description.en) : product.description,
        price: `${product.price} ريال`,
        category: product.category ? (typeof product.category === 'object' ? (product.category[currentLang] || product.category.en) : product.category) : 'عطور',
        slug: product._id || product.id || Math.random().toString(),
        rating: 4.8,
        link: `/product/${product._id || product.id}`
      }));
  }

  return (
    <section 
      id="collections" 
      className="py-8 sm:py-12 lg:py-section bg-soft-neutral relative emblem-bg w-full overflow-x-hidden fixed-section"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ margin: 0, padding: '2rem 0' }}
    >
      <div className="container mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-8 sm:mb-12 lg:mb-16"
          initial={isMobile ? { y: 0, opacity: 1 } : { y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: isMobile ? 0 : 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.h2 
            className="text-3xl sm:text-4xl lg:text-6xl font-display font-bold text-dark-tea mb-3 sm:mb-4 lg:mb-6"
            initial={isMobile ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: isMobile ? 0 : 0.2, duration: isMobile ? 0 : 0.8 }}
          >
            {collectionsData.title[currentLang] || collectionsData.title.en}
          </motion.h2>
          <motion.p 
            className="text-lg sm:text-xl text-teal-green max-w-2xl mx-auto"
            initial={isMobile ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: isMobile ? 0 : 0.4, duration: isMobile ? 0 : 0.8 }}
          >
            {collectionsData.subtitle[currentLang] || collectionsData.subtitle.en}
          </motion.p>
        </motion.div>

        {/* Collections Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mobile-cards-container">
          {collections.map((collection, index) => (
            <motion.div
              key={collection.id}
              initial={isMobile ? { y: 0, opacity: 1 } : { y: 80, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ 
                delay: isMobile ? 0 : index * 0.2, 
                duration: isMobile ? 0 : 0.8, 
                ease: [0.22, 1, 0.36, 1] 
              }}
            >
              <Card className="group overflow-visible glass border-0 shadow-luxury hover:shadow-xl transition-all duration-500 cursor-pointer h-full product-card">
                <div className="block">
                  <div className="relative overflow-visible">
                    <motion.img
                      src={collection.image}
                      alt={collection.name}
                      className="w-full h-48 sm:h-64 lg:h-80 object-cover"
                      whileHover={isMobile ? { scale: 1 } : { scale: 1.1 }}
                      transition={{ duration: isMobile ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] }}
                    />
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-tea/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  

                  {/* Category Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 text-xs font-medium bg-gold text-dark-tea rounded-full">
                      {collection.category}
                    </span>
                  </div>
                  </div>

                  <CardContent className="p-4 sm:p-5 lg:p-6 bg-card card-content">
                  <div className="flex items-center justify-between mb-2 sm:mb-3 product-title-row">
                    <h3 className="text-lg sm:text-xl font-display font-semibold text-card-foreground group-hover:text-primary transition-colors text-center mx-auto">
                      {collection.name}
                    </h3>
                    {collectionsData.showRatings && (
                      <div className="flex items-center gap-1 rating-badge">
                        <Star className="w-4 h-4 fill-gold text-gold" />
                        <span className="text-sm text-muted-foreground">{collection.rating}</span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4 leading-relaxed text-center product-description">
                    {collection.description}
                  </p>
                  
                  <div className="flex items-center justify-center product-footer">
                    {collectionsData.showPrices && (
                      <span className="text-xl sm:text-2xl font-bold text-primary mr-2">
                        {collection.price}
                      </span>
                    )}
                    <Link to={collection.link || `/products`} className="mx-auto">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors details-button"
                      >
                        {currentLang === 'en' ? 'View Details' : 'عرض التفاصيل'}
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                  </CardContent>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* View All Button */}
        {collectionsData.showViewAllButton && (
          <motion.div 
            className="text-center mt-8 sm:mt-10 lg:mt-12"
            initial={isMobile ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: isMobile ? 0 : 0.6, duration: isMobile ? 0 : 0.8 }}
          >
            <Link to={collectionsData.viewAllButtonLink || '/products'}>
              <Button 
                size="lg" 
                className="btn-luxury px-12 py-3 rounded-full text-lg group"
              >
                {collectionsData.viewAllButtonText[currentLang] || collectionsData.viewAllButtonText.en}
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}