import { motion } from 'framer-motion';
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
      className="py-section bg-soft-neutral relative emblem-bg"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="container mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.h2 
            className="text-4xl lg:text-6xl font-display font-bold text-dark-tea mb-6"
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            {collectionsData.title[currentLang] || collectionsData.title.en}
          </motion.h2>
          <motion.p 
            className="text-xl text-teal-green max-w-2xl mx-auto"
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            {collectionsData.subtitle[currentLang] || collectionsData.subtitle.en}
          </motion.p>
        </motion.div>

        {/* Collections Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {collections.map((collection, index) => (
            <motion.div
              key={collection.id}
              initial={{ y: 80, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ 
                delay: index * 0.2, 
                duration: 0.8, 
                ease: [0.22, 1, 0.36, 1] 
              }}
            >
              <Card className="group overflow-hidden glass border-0 shadow-luxury hover:shadow-xl transition-all duration-500 cursor-pointer">
                <div className="block">
                  <div className="relative overflow-hidden">
                    <motion.img
                      src={collection.image}
                      alt={collection.name}
                      className="w-full h-80 object-cover"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
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

                  <CardContent className="p-6 bg-card">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-display font-semibold text-card-foreground group-hover:text-primary transition-colors">
                      {collection.name}
                    </h3>
                    {collectionsData.showRatings && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-gold text-gold" />
                        <span className="text-sm text-muted-foreground">{collection.rating}</span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    {collection.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    {collectionsData.showPrices && (
                      <span className="text-2xl font-bold text-primary">
                        {collection.price}
                      </span>
                    )}
                    <Link to={collection.link || `/products`}>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
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
            className="text-center mt-12"
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6, duration: 0.8 }}
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