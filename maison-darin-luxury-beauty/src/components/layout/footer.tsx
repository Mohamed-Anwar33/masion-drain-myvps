import { motion } from "framer-motion";
import { Instagram, Facebook, Twitter, Mail, Phone, MapPin, Youtube } from "lucide-react";
import { FaTiktok, FaSnapchatGhost } from "react-icons/fa";
// Newsletter components hidden - imports commented out
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface FooterProps {
  currentLang: 'en' | 'ar';
  translations: any;
}

export const Footer = ({ currentLang, translations }: FooterProps) => {
  const { siteSettings, loading } = useSiteSettings();
  
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

  // Get social links from site settings or use defaults
  const socialLinks = [
    { 
      icon: Instagram, 
      href: siteSettings?.socialMedia?.instagram || "#", 
      label: "Instagram",
      show: !!siteSettings?.socialMedia?.instagram
    },
    { 
      icon: Facebook, 
      href: siteSettings?.socialMedia?.facebook || "#", 
      label: "Facebook",
      show: !!siteSettings?.socialMedia?.facebook
    },
    { 
      icon: Twitter, 
      href: siteSettings?.socialMedia?.twitter || "#", 
      label: "Twitter",
      show: !!siteSettings?.socialMedia?.twitter
    },
    { 
      icon: Youtube, 
      href: siteSettings?.socialMedia?.youtube || "#", 
      label: "YouTube",
      show: !!siteSettings?.socialMedia?.youtube
    },
    { 
      icon: FaTiktok, 
      href: siteSettings?.socialMedia?.tiktok || "#", 
      label: "TikTok",
      show: !!siteSettings?.socialMedia?.tiktok
    },
    { 
      icon: FaSnapchatGhost, 
      href: siteSettings?.socialMedia?.snapchat || "#", 
      label: "Snapchat",
      show: !!siteSettings?.socialMedia?.snapchat
    },
  ].filter(link => link.show);
  const quickLinks = [
    { label: currentLang === 'ar' ? "الرئيسية" : "Home", href: "/" },
    { label: currentLang === 'ar' ? "المجموعات" : "Collections", href: "/products" },
    { label: currentLang === 'ar' ? "قصتنا" : "Our Story", href: "/#about" },
    { label: currentLang === 'ar' ? "اتصل بنا" : "Contact", href: "/#contact" },
  ];

  // Customer Care section hidden - no content available yet
  // const customerCare = [
  //   { label: currentLang === 'ar' ? "سياسة الشحن" : "Shipping Policy", href: "#" },
  //   { label: currentLang === 'ar' ? "سياسة الإرجاع" : "Return Policy", href: "#" },
  //   { label: currentLang === 'ar' ? "الأسئلة الشائعة" : "FAQ", href: "#" },
  //   { label: currentLang === 'ar' ? "خدمة العملاء" : "Customer Service", href: "#" },
  // ];

  return (
    <footer className="bg-primary text-primary-foreground relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent via-accent-foreground to-accent" />
      </div>

      <div className="container mx-auto px-4 py-16 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h3 className="text-2xl font-bold text-accent">
              {siteSettings?.siteInfo?.siteName?.[currentLang] || (currentLang === 'ar' ? "ميزون دارين" : "Maison Darin")}
            </h3>
            <p className="text-primary-foreground/80 text-sm leading-relaxed">
              {siteSettings?.siteInfo?.description?.[currentLang] || 
                (currentLang === 'ar' 
                  ? "عطور فاخرة تحكي قصة الأناقة والجمال. كل عطر رحلة فريدة تنقلك إلى عالم من الفخامة والرقي."
                  : "Luxury fragrances that tell the story of elegance and beauty. Each perfume is a unique journey that transports you to a world of luxury and sophistication."
                )
              }
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social, index) => {
                const IconComponent = social.icon;
                return (
                  <motion.a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 bg-accent/20 hover:bg-accent text-accent hover:text-accent-foreground rounded-full flex items-center justify-center transition-all duration-300"
                    aria-label={social.label}
                  >
                    <IconComponent className="h-4 w-4" />
                  </motion.a>
                );
              })}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <h4 className="text-lg font-semibold text-accent">
              {currentLang === 'ar' ? "روابط سريعة" : "Quick Links"}
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-primary-foreground/80 hover:text-accent transition-colors duration-300 text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Customer Care section hidden - no content available yet */}
          {/* <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <h4 className="text-lg font-semibold text-accent">
              {currentLang === 'ar' ? "خدمة العملاء" : "Customer Care"}
            </h4>
            <ul className="space-y-2">
              {customerCare.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-primary-foreground/80 hover:text-accent transition-colors duration-300 text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div> */}

          {/* Contact Info Only */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <h4 className="text-lg font-semibold text-accent">
              {currentLang === 'ar' ? "معلومات التواصل" : "Contact Info"}
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-accent" />
                <span className="text-primary-foreground/80">
                  {siteSettings?.contactInfo?.address?.[currentLang] || 
                    (currentLang === 'ar' ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia')
                  }
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-accent" />
                <span className="text-primary-foreground/80">
                  {siteSettings?.contactInfo?.email || 'info@maison-darin.com'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-accent" />
                <span className="text-primary-foreground/80">
                  {siteSettings?.contactInfo?.phone || '+966 50 123 4567'}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Newsletter section hidden - no functionality implemented yet */}
          {/* <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <h4 className="text-lg font-semibold text-accent">
              {currentLang === 'ar' ? "النشرة الإخبارية" : "Newsletter"}
            </h4>
            <p className="text-primary-foreground/80 text-sm">
              {currentLang === 'ar' 
                ? "اشتركي للحصول على آخر الأخبار والعروض الحصرية"
                : "Subscribe to get latest news and exclusive offers"
              }
            </p>
            <div className="flex gap-2">
              <Input
                placeholder={currentLang === 'ar' ? "بريدك الإلكتروني" : "Your email"}
                className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
              />
              <Button 
                variant="secondary" 
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {currentLang === 'ar' ? "اشتراك" : "Subscribe"}
              </Button>
            </div>
          </motion.div> */}
        </div>

        <Separator className="bg-primary-foreground/20 my-8" />

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0"
        >
          <p className="text-primary-foreground/60 text-sm text-center md:text-left">
            {currentLang === 'ar' 
              ? `© ${new Date().getFullYear()} ${siteSettings?.siteInfo?.siteName?.ar || 'ميزون دارين'}. جميع الحقوق محفوظة.`
              : `© ${new Date().getFullYear()} ${siteSettings?.siteInfo?.siteName?.en || 'Maison Darin'}. All rights reserved.`
            }
          </p>
          {/* Policy links hidden - no content available yet */}
          {/* <div className="flex gap-6 text-sm">
            <a href="#" className="text-primary-foreground/60 hover:text-accent transition-colors">
              {currentLang === 'ar' ? "سياسة الخصوصية" : "Privacy Policy"}
            </a>
            <a href="#" className="text-primary-foreground/60 hover:text-accent transition-colors">
              {currentLang === 'ar' ? "شروط الاستخدام" : "Terms of Service"}
            </a>
          </div> */}
        </motion.div>
      </div>
    </footer>
  );
};