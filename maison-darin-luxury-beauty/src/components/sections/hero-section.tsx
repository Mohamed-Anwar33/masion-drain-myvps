import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useHeroSection } from "@/hooks/useHomePage";
import heroImage from "@/assets/hero-perfume.jpg";
import collection1 from "@/assets/collection-1.jpg";
import collection2 from "@/assets/collection-2.jpg";
import collection3 from "@/assets/collection-3.jpg";

interface HeroSectionProps {
  translations: any;
  currentLang: 'en' | 'ar';
}

export function HeroSection({ translations, currentLang }: HeroSectionProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { heroData, loading } = useHeroSection();
  const navigate = useNavigate();
  const isRTL = currentLang === 'ar';
  const fallbackImages = [heroImage, collection1, collection2, collection3];
  
  // Use hero data images or fallback
  const heroImages = heroData?.images?.slideshow?.length > 0 
    ? heroData.images.slideshow.map(img => img.url)
    : fallbackImages;

  // Helper function to extract string value - handles nested objects and text fields
  const extractString = (value: any): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (value?.text) return String(value.text);
    if (typeof value === 'object') {
      // Try current language first, then fallback
      if (value[currentLang]) return String(value[currentLang]);
      if (value.en) return String(value.en);
      if (value.ar) return String(value.ar);
    }
    return String(value);
  };

  // Click handlers for CTA buttons
  const handleExploreCollections = () => {
    navigate('/products');
  };

  const handleRequestSample = () => {
    // Scroll to contact section
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Auto-change images every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === heroImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [heroImages.length]);

  return (
    <section 
      id="home" 
      className="min-h-screen flex items-center relative overflow-hidden emblem-bg pt-16 md:pt-20 hero-mobile-fix w-full"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ margin: 0, padding: 0 }}
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark-tea via-teal-green to-dark-tea opacity-90 hero-gradient-full" />
      
      <div className="container mx-auto px-4 sm:px-6 py-20 sm:py-24 lg:py-32 relative z-10 w-full max-w-full">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center w-full">
          
          {/* Left Side - Typography Statement */}
          <motion.div 
            className={`space-y-8 ${isRTL ? 'lg:order-2 text-right' : 'lg:order-1'}`}
            initial={{ x: isRTL ? 100 : -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Luxury Badge */}
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-gold/20"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <Sparkles className="w-4 h-4 text-gold" />
              <span className="text-sm font-medium text-off-white">
                {heroData?.badge?.[currentLang] || extractString(translations?.hero?.badge)}
              </span>
            </motion.div>

            {/* Main Heading */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-display font-bold leading-tight text-off-white">
                {(heroData?.title?.[currentLang] || extractString(translations?.hero?.title)).split(' ').map((word: string, index: number) => (
                  <motion.span
                    key={index}
                    className="inline-block"
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ 
                      delay: 0.5 + index * 0.1, 
                      duration: 0.8, 
                      ease: [0.22, 1, 0.36, 1] 
                    }}
                  >
                    {word}&nbsp;
                  </motion.span>
                ))}
              </h1>
            </motion.div>

            {/* Subtitle */}
            <motion.p 
              className="text-lg sm:text-xl text-beige/90 max-w-lg leading-relaxed"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              {heroData?.subtitle?.[currentLang] || extractString(translations?.hero?.subtitle)}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 pt-4"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
            >
              <Button 
                size="lg" 
                className="btn-luxury text-lg px-8 py-3 rounded-full group"
                onClick={handleExploreCollections}
              >
                {heroData?.cta?.primary?.text?.[currentLang] || extractString(translations?.hero?.cta?.primary)}
                <ArrowRight className={`w-5 h-5 transition-transform ${isRTL ? 'mr-2 rotate-180 group-hover:-translate-x-1' : 'ml-2 group-hover:translate-x-1'}`} />
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                className="text-lg px-8 py-3 rounded-full border-2 border-beige/30 text-beige hover:bg-beige/10 hover:border-beige/50 transition-all duration-300"
                onClick={handleRequestSample}
              >
                {heroData?.cta?.secondary?.text?.[currentLang] || extractString(translations?.hero?.cta?.secondary)}
              </Button>
            </motion.div>
          </motion.div>

          {/* Right Side - Hero Image */}
          <motion.div 
            className={`relative ${isRTL ? 'lg:order-1' : 'lg:order-2'}`}
            initial={{ x: isRTL ? -100 : 100, opacity: 0, scale: 0.8 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Floating Elements */}
            <motion.div 
              className={`absolute -top-8 ${isRTL ? '-right-8' : '-left-8'} w-16 h-16 rounded-full bg-gold/20 glass`}
              animate={{ 
                y: [0, -20, 0],
                rotate: [0, 180, 360]
              }}
              transition={{ 
                duration: 6, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            />
            
            <motion.div 
              className={`absolute -bottom-4 ${isRTL ? '-left-4' : '-right-4'} w-12 h-12 rounded-full bg-light-brown/30 glass`}
              animate={{ 
                y: [0, 20, 0],
                x: [0, 10, 0]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: 1
              }}
            />

            {/* Main Image Container with Auto Slideshow */}
            <div className="relative rounded-3xl overflow-hidden shadow-luxury bg-gradient-to-br from-dark-tea via-teal-green to-dark-tea">
              {/* Image Stack with Luxury Transitions */}
              <div className="relative w-full h-[450px] sm:h-[500px] md:h-[550px] lg:h-[600px]">
                {heroImages.map((image, index) => (
                  <motion.img
                    key={index}
                    src={image}
                    alt={`Maison Darin Luxury Perfume ${index + 1}`}
                    className="absolute inset-0 w-full h-full object-cover object-center"
                    initial={{ 
                      opacity: index === 0 ? 1 : 0,
                      scale: 1.1,
                      filter: "blur(10px)"
                    }}
                    animate={{ 
                      opacity: index === currentImageIndex ? 1 : 0,
                      scale: index === currentImageIndex ? 1 : 1.1,
                      filter: index === currentImageIndex ? "blur(0px)" : "blur(10px)"
                    }}
                    transition={{ 
                      duration: 1.5,
                      ease: [0.22, 1, 0.36, 1],
                      opacity: { duration: 1.2 },
                      scale: { duration: 8 },
                      filter: { duration: 1 }
                    }}
                    whileHover={{ scale: index === currentImageIndex ? 1.05 : 1.1 }}
                  />
                ))}
              </div>
              
              {/* Luxury Progress Indicators */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-3">
                {heroImages.map((_, index) => (
                  <motion.div
                    key={index}
                    className="relative"
                  >
                    {/* Background dot */}
                    <div className="w-3 h-3 rounded-full bg-white/20 backdrop-blur-sm" />
                    
                    {/* Active indicator with luxury animation */}
                    <motion.div
                      className="absolute inset-0 w-3 h-3 rounded-full bg-gradient-to-r from-gold to-amber-400 shadow-lg"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ 
                        scale: index === currentImageIndex ? 1 : 0,
                        opacity: index === currentImageIndex ? 1 : 0
                      }}
                      transition={{ 
                        duration: 0.6,
                        ease: [0.22, 1, 0.36, 1]
                      }}
                    />
                    
                    {/* Glowing effect */}
                    {index === currentImageIndex && (
                      <motion.div
                        className="absolute inset-0 w-3 h-3 rounded-full bg-gold/50"
                        animate={{ 
                          scale: [1, 1.8, 1],
                          opacity: [0.5, 0, 0.5]
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    )}
                  </motion.div>
                ))}
              </div>
              
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-dark-tea/30 via-transparent to-transparent pointer-events-none" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div 
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.8 }}
      >
        <motion.div 
          className="w-6 h-10 border-2 border-beige/50 rounded-full flex justify-center"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.div 
            className="w-1 h-3 bg-beige rounded-full mt-2"
            animate={{ scaleY: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}