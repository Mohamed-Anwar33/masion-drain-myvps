import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Award, Gem } from "lucide-react";
import { useAboutSection } from "../../hooks/useAboutSection";
import LoadingSpinner from "../ui/LoadingSpinner";

interface AboutSectionProps {
  currentLang: 'en' | 'ar';
}

export function AboutSection({ currentLang }: AboutSectionProps) {
  const { aboutData, loading, error } = useAboutSection();
  const isRTL = currentLang === 'ar';

  // Show loading state
  if (loading) {
    return (
      <section className="py-section bg-gradient-to-br from-dark-tea to-teal-green relative">
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </section>
    );
  }

  // Show error state
  if (error || !aboutData) {
    return (
      <section className="py-section bg-gradient-to-br from-dark-tea to-teal-green relative">
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center py-12">
            <p className="text-beige">
              {error || 'Failed to load about section'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Don't render if section is hidden
  if (!aboutData.showSection) {
    return null;
  }

  const values = [
    {
      icon: Award,
      title: aboutData.values.craftsmanship.title[currentLang] || aboutData.values.craftsmanship.title.en,
      description: aboutData.values.craftsmanship.description[currentLang] || aboutData.values.craftsmanship.description.en
    },
    {
      icon: Gem,
      title: aboutData.values.elegance.title[currentLang] || aboutData.values.elegance.title.en,
      description: aboutData.values.elegance.description[currentLang] || aboutData.values.elegance.description.en
    },
    {
      icon: Sparkles,
      title: aboutData.values.exclusivity.title[currentLang] || aboutData.values.exclusivity.title.en,
      description: aboutData.values.exclusivity.description[currentLang] || aboutData.values.exclusivity.description.en
    }
  ];

  return (
    <section 
      id="about" 
      className="py-section bg-gradient-to-br from-dark-tea to-teal-green relative"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className={`absolute top-1/4 ${isRTL ? 'right-1/4' : 'left-1/4'} w-32 h-32 border border-gold rounded-full animate-pulse`}></div>
        <div className={`absolute bottom-1/3 ${isRTL ? 'left-1/4' : 'right-1/4'} w-24 h-24 border border-light-brown rounded-full animate-pulse delay-1000`}></div>
        <div className={`absolute top-1/2 ${isRTL ? 'left-1/3' : 'right-1/3'} w-16 h-16 border border-beige rounded-full animate-pulse delay-2000`}></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Side - Content */}
          <motion.div 
            className={`space-y-8 ${isRTL ? 'lg:order-2 text-right' : 'lg:order-1'}`}
            initial={{ x: isRTL ? 100 : -100, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <h2 className="text-4xl lg:text-6xl font-display font-bold text-off-white mb-6">
                {aboutData.title[currentLang] || aboutData.title.en}
              </h2>
              <p className="text-xl text-beige font-medium mb-4">
                {aboutData.subtitle[currentLang] || aboutData.subtitle.en}
              </p>
              <p className="text-lg text-beige/80 leading-relaxed mb-6">
                {aboutData.description[currentLang] || aboutData.description.en}
              </p>
              <p className="text-lg text-beige/80 leading-relaxed">
                {aboutData.legacy[currentLang] || aboutData.legacy.en}
              </p>
            </motion.div>

            {/* Statistics */}
            {aboutData.showStatistics && (
              <motion.div 
                className="grid grid-cols-3 gap-6 py-8"
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                <div className="text-center">
                  <div className="text-3xl font-bold text-gold">{aboutData.statistics.collections.value}</div>
                  <div className="text-sm text-beige/70">{aboutData.statistics.collections.label[currentLang] || aboutData.statistics.collections.label.en}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gold">{aboutData.statistics.clients.value}</div>
                  <div className="text-sm text-beige/70">{aboutData.statistics.clients.label[currentLang] || aboutData.statistics.clients.label.en}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gold">{aboutData.statistics.countries.value}</div>
                  <div className="text-sm text-beige/70">{aboutData.statistics.countries.label[currentLang] || aboutData.statistics.countries.label.en}</div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Right Side - Values Cards */}
          {aboutData.showValues && (
            <motion.div 
              className={`space-y-6 ${isRTL ? 'lg:order-1' : 'lg:order-2'}`}
              initial={{ x: isRTL ? -100 : 100, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ 
                  delay: 0.3 + index * 0.1, 
                  duration: 0.8,
                  ease: [0.22, 1, 0.36, 1]
                }}
              >
                <Card className="bg-off-white/95 backdrop-blur-sm border border-gold/20 shadow-luxury hover:shadow-xl transition-all duration-500 group hover:bg-off-white">
                  <CardContent className="p-6">
                    <div className={`flex items-start space-x-4 ${isRTL ? 'space-x-reverse' : ''}`}>
                      <div className="p-3 rounded-full bg-gold/20 group-hover:bg-gold/30 transition-colors">
                        <value.icon className="w-6 h-6 text-gold" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-display font-semibold text-dark-tea mb-2">
                          {value.title}
                        </h3>
                        <p className="text-dark-tea/80 leading-relaxed">
                          {value.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}