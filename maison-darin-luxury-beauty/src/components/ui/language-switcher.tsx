import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { motion } from "framer-motion";

interface LanguageSwitcherProps {
  currentLang: 'en' | 'ar';
  onLanguageChange: (lang: 'en' | 'ar') => void;
}

export function LanguageSwitcher({ currentLang, onLanguageChange }: LanguageSwitcherProps) {
  const isRTL = currentLang === 'ar';
  
  return (
    <motion.div 
      className={`flex items-center ${isRTL ? 'gap-2 flex-row-reverse' : 'gap-2'}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <Globe className="w-4 h-4 text-muted-foreground" />
      <div className="flex bg-muted/50 rounded-full p-1 glass">
        <Button
          variant={currentLang === 'en' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onLanguageChange('en')}
          className={`px-3 py-1 text-xs rounded-full transition-all font-medium ${
            currentLang === 'en' 
              ? 'bg-teal-green text-white shadow-sm' 
              : 'hover:bg-muted text-muted-foreground'
          }`}
        >
          EN
        </Button>
        <Button
          variant={currentLang === 'ar' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onLanguageChange('ar')}
          className={`px-3 py-1 text-xs rounded-full transition-all font-medium ${
            currentLang === 'ar' 
              ? 'bg-teal-green text-white shadow-sm' 
              : 'hover:bg-muted text-muted-foreground'
          }`}
        >
          عربي
        </Button>
      </div>
    </motion.div>
  );
}