import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Mail, Phone, ArrowRight } from "lucide-react";
import { ContactForm } from "@/components/ui/contact-form";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface ContactSectionProps {
  translations: any;
  currentLang: 'en' | 'ar';
}

export function ContactSection({ translations, currentLang }: ContactSectionProps) {
  const isRTL = currentLang === 'ar';
  const { siteSettings, loading: settingsLoading } = useSiteSettings();
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

  // Use site settings data or fallback to translations
  const contactInfo = [
    {
      icon: MapPin,
      label: currentLang === 'en' ? 'Visit Us' : 'زورونا',
      value: siteSettings?.contactInfo?.address?.[currentLang] || extractString(translations?.contact?.address)
    },
    {
      icon: Mail,
      label: currentLang === 'en' ? 'Email' : 'البريد الإلكتروني',
      value: siteSettings?.contactInfo?.email || extractString(translations?.contact?.email)
    },
    {
      icon: Phone,
      label: currentLang === 'en' ? 'Phone' : 'الهاتف',
      value: siteSettings?.contactInfo?.phone || extractString(translations?.contact?.phone)
    }
  ];

  return (
    <section 
      id="contact" 
      className="py-8 sm:py-12 lg:py-section bg-soft-pink relative emblem-bg w-full overflow-x-hidden fixed-section"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ margin: 0, padding: '2rem 0' }}
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          
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
              {extractString(translations?.contact?.title) || (currentLang === 'ar' ? 'تواصل معنا' : 'Contact Us')}
            </motion.h2>
            <motion.p 
              className="text-lg sm:text-xl text-teal-green max-w-2xl mx-auto mb-4 sm:mb-6 lg:mb-8"
              initial={isMobile ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: isMobile ? 0 : 0.4, duration: isMobile ? 0 : 0.8 }}
            >
              {extractString(translations?.contact?.subtitle) || (currentLang === 'ar' ? 'نحن هنا للإجابة على استفساراتكم وخدمتكم' : 'We are here to answer your questions and serve you')}
            </motion.p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-10">
            
            {/* Contact Info Cards */}
            <motion.div 
              className="space-y-3 sm:space-y-4 lg:space-y-6"
              initial={isMobile ? { x: 0, opacity: 1 } : { x: isRTL ? 100 : -100, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: isMobile ? 0 : 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              {contactInfo.map((info, index) => (
                <motion.div
                  key={index}
                  initial={isMobile ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ 
                    delay: isMobile ? 0 : 0.2 + index * 0.1, 
                    duration: isMobile ? 0 : 0.8 
                  }}
                >
                  <Card className="glass border-0 shadow-luxury hover:shadow-xl transition-all duration-500 group">
                    <CardContent className="p-4 sm:p-5 lg:p-6">
                      <div className="flex items-center space-x-4 rtl:space-x-reverse">
                        <div className="p-3 rounded-full bg-teal-green/20 group-hover:bg-teal-green/30 transition-colors">
                          <info.icon className="w-6 h-6 text-teal-green" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-dark-tea mb-1">
                            {info.label}
                          </h4>
                          <p className="text-muted-foreground">
                            {info.value}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {/* Contact Form */}
            <ContactForm currentLang={currentLang} />
          </div>
        </div>
      </div>
    </section>
  );
}