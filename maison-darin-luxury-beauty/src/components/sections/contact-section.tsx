import { motion } from "framer-motion";
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
      className="py-section bg-soft-pink relative emblem-bg"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          
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
              {extractString(translations?.contact?.title) || (currentLang === 'ar' ? 'تواصل معنا' : 'Contact Us')}
            </motion.h2>
            <motion.p 
              className="text-xl text-teal-green max-w-2xl mx-auto mb-8"
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              {extractString(translations?.contact?.subtitle) || (currentLang === 'ar' ? 'نحن هنا للإجابة على استفساراتكم وخدمتكم' : 'We are here to answer your questions and serve you')}
            </motion.p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12">
            
            {/* Contact Info Cards */}
            <motion.div 
              className="space-y-6"
              initial={{ x: isRTL ? 100 : -100, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              {contactInfo.map((info, index) => (
                <motion.div
                  key={index}
                  initial={{ y: 30, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ 
                    delay: 0.2 + index * 0.1, 
                    duration: 0.8 
                  }}
                >
                  <Card className="glass border-0 shadow-luxury hover:shadow-xl transition-all duration-500 group">
                    <CardContent className="p-6">
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