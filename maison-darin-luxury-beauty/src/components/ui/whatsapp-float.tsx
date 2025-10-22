import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Phone } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

interface WhatsAppFloatProps {
  currentLang?: 'ar' | 'en';
}

export const WhatsAppFloat: React.FC<WhatsAppFloatProps> = ({ currentLang = 'ar' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const { siteSettings, loading } = useSiteSettings();

  // إظهار الأيقونة بعد تحميل الصفحة
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // إظهار tooltip بعد فترة
  useEffect(() => {
    if (isVisible) {
      const tooltipTimer = setTimeout(() => {
        setShowTooltip(true);
        // إخفاء tooltip بعد 5 ثوان
        setTimeout(() => setShowTooltip(false), 5000);
      }, 3000);

      return () => clearTimeout(tooltipTimer);
    }
  }, [isVisible]);

  // إخفاء الأيقونة إذا لم يكن هناك رقم واتساب أو إذا كانت معطلة
  if (loading || 
      !siteSettings?.contactInfo?.whatsapp || 
      siteSettings?.contactInfo?.whatsappEnabled === false) {
    return null;
  }

  const whatsappNumber = siteSettings.contactInfo.whatsapp;
  const cleanNumber = whatsappNumber.replace(/[^\d]/g, '');
  
  const messages = {
    ar: {
      tooltip: 'تحدث معنا عبر الواتساب',
      defaultMessage: 'مرحباً! أود الاستفسار عن منتجاتكم الفاخرة.'
    },
    en: {
      tooltip: 'Chat with us on WhatsApp',
      defaultMessage: 'Hello! I would like to inquire about your luxury products.'
    }
  };

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent(messages[currentLang].defaultMessage);
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0, x: 100 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0, x: 100 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            duration: 0.6
          }}
          className="fixed bottom-6 right-6 z-50 group"
          style={{ direction: 'ltr' }}
        >
          {/* Tooltip */}
          <AnimatePresence>
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, x: 20, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className={`absolute bottom-full mb-3 ${currentLang === 'ar' ? 'right-0' : 'left-0'} 
                  bg-white text-dark-tea shadow-lg rounded-lg px-4 py-2 text-sm font-medium
                  border border-teal-green/20 whitespace-nowrap`}
                style={{ direction: currentLang === 'ar' ? 'rtl' : 'ltr' }}
              >
                {messages[currentLang].tooltip}
                {/* Arrow */}
                <div 
                  className={`absolute top-full ${currentLang === 'ar' ? 'right-4' : 'left-4'} 
                    w-0 h-0 border-l-4 border-r-4 border-t-4 
                    border-l-transparent border-r-transparent border-t-white`}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main WhatsApp Button */}
          <motion.button
            onClick={handleWhatsAppClick}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="relative w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 
              hover:from-green-600 hover:to-green-700 rounded-full shadow-2xl 
              flex items-center justify-center text-white transition-all duration-300
              hover:shadow-green-500/30 group-hover:shadow-xl"
          >
            {/* Pulse Animation */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 0, 0.7]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 bg-green-500 rounded-full"
            />
            
            {/* WhatsApp Icon */}
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="relative z-10"
            >
              <MessageCircle className="w-8 h-8" />
            </motion.div>

            {/* Notification Dot */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [1, 0.7, 1]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full 
                border-2 border-white flex items-center justify-center"
            >
              <div className="w-2 h-2 bg-white rounded-full" />
            </motion.div>
          </motion.button>

          {/* Floating Sparkles */}
          <motion.div
            animate={{
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{
              rotate: { duration: 8, repeat: Infinity, ease: "linear" },
              scale: { duration: 3, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute -top-2 -left-2 text-gold opacity-60"
          >
            ✨
          </motion.div>

          <motion.div
            animate={{
              rotate: -360,
              scale: [1, 1.2, 1]
            }}
            transition={{
              rotate: { duration: 6, repeat: Infinity, ease: "linear" },
              scale: { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute -bottom-1 -right-2 text-gold opacity-70"
          >
            ✨
          </motion.div>

          {/* Phone Icon for Additional Context */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="absolute -bottom-2 -left-2 w-6 h-6 bg-teal-green rounded-full 
              flex items-center justify-center text-white text-xs shadow-lg"
          >
            <Phone className="w-3 h-3" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WhatsAppFloat;
