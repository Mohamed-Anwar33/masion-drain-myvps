import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Search, Menu, User, LogOut } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";

interface HeaderProps {
  currentLang: 'en' | 'ar';
  onLanguageChange: (lang: 'en' | 'ar') => void;
  translations: any;
}

export function Header({ currentLang, onLanguageChange, translations }: HeaderProps) {
  const { getItemCount, toggleCart } = useCart();
  const { state, logout } = useAuth();
  const cartItemCount = getItemCount();
  const isRTL = currentLang === 'ar';

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

  return (
    <motion.header 
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/10"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="container mx-auto px-6 py-4">
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          {/* Logo */}
          <Link to="/">
            <motion.div 
              className="flex items-center"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <img 
                src={logo} 
                alt="Logo" 
                className="h-20 w-32 object-contain drop-shadow-lg"
                style={{
                  filter: 'brightness(0) saturate(100%) invert(20%) sepia(51%) saturate(1234%) hue-rotate(139deg) brightness(95%) contrast(95%)'
                }}
              />
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <nav className={`hidden md:flex items-center ${isRTL ? 'space-x-reverse space-x-8' : 'space-x-8'}`}>
            <Link to="/#top" className="text-foreground hover:text-primary transition-colors duration-300 font-medium">
              {extractString(translations?.nav?.home)}
            </Link>
            <Link to="/products" className="text-foreground hover:text-primary transition-colors duration-300 font-medium">
              {extractString(translations?.nav?.collections)}
            </Link>
            <Link to="/#about" className="text-foreground hover:text-primary transition-colors duration-300 font-medium">
              {extractString(translations?.nav?.about)}
            </Link>
            <Link to="/#contact" className="text-foreground hover:text-primary transition-colors duration-300 font-medium">
              {extractString(translations?.nav?.contact)}
            </Link>
          </nav>

          {/* Right Side Actions */}
          <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-4' : 'space-x-4'}`}>
            <LanguageSwitcher 
              currentLang={currentLang} 
              onLanguageChange={onLanguageChange} 
            />
            
            <div className={`hidden md:flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
              <Button variant="ghost" size="icon" className="hover:bg-muted/50">
                <Search className="w-5 h-5" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="hover:bg-muted/50 relative"
                onClick={toggleCart}
              >
                <ShoppingBag className="w-5 h-5" />
                {cartItemCount > 0 && (
                  <Badge 
                    className={`absolute -top-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground ${isRTL ? '-left-2' : '-right-2'}`}
                  >
                    {cartItemCount}
                  </Badge>
                )}
              </Button>

              {/* Auth Buttons */}
              {state.isAuthenticated ? (
                <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                  <span className="text-sm text-muted-foreground hidden lg:block">
                    مرحباً، {state.user?.firstName || state.user?.email}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="hover:bg-muted/50"
                    onClick={logout}
                    title="تسجيل خروج"
                  >
                    <LogOut className="w-5 h-5" />
                  </Button>
                </div>
              ) : (
                <Link to="/auth">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="hover:bg-muted/50 flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    <span className="hidden lg:block">
                      {currentLang === 'ar' ? 'تسجيل دخول' : 'Login'}
                    </span>
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile Menu */}
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}