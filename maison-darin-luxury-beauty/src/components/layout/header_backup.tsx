import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Menu, LogOut, X } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        <div className="flex items-center justify-between">
          {/* Logo - positioned based on language */}
          <div>
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
          </div>

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

              {/* Auth Buttons - Only show logout if authenticated 
                   Login button is hidden for security - access admin via direct URL only */}
              {state.isAuthenticated && (
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
              )}
            </div>

<<<<<<< HEAD
            {/* Mobile Menu */}
=======
            {/* Mobile Menu Button */}
>>>>>>> 82e3ee24260bab51a6c5f5ac09424c82e81e8698
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
<<<<<<< HEAD
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
=======
              onClick={toggleMobileMenu}
>>>>>>> 82e3ee24260bab51a6c5f5ac09424c82e81e8698
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <motion.div
            className="md:hidden fixed top-[88px] left-0 right-0 bg-white border-t border-gray-200 shadow-xl z-[9999]"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <div className="px-4 py-6 space-y-4">
              {/* Mobile Navigation Links */}
              <div className="space-y-2">
                <Link 
                  to="/#top" 
                  className="block w-full text-right px-4 py-3 text-lg font-medium text-gray-800 hover:text-primary hover:bg-gray-50 rounded-lg transition-all duration-300"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  الرئيسية
                </Link>
                <Link 
                  to="/products" 
                  className="block w-full text-right px-4 py-3 text-lg font-medium text-gray-800 hover:text-primary hover:bg-gray-50 rounded-lg transition-all duration-300"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  المجموعات
                </Link>
                <Link 
                  to="/#about" 
                  className="block w-full text-right px-4 py-3 text-lg font-medium text-gray-800 hover:text-primary hover:bg-gray-50 rounded-lg transition-all duration-300"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  من نحن
                </Link>
                <Link 
                  to="/#contact" 
                  className="block w-full text-right px-4 py-3 text-lg font-medium text-gray-800 hover:text-primary hover:bg-gray-50 rounded-lg transition-all duration-300"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  اتصل بنا
                </Link>
              </div>

              {/* Mobile Actions */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <Button 
                  variant="ghost" 
                  className="w-full justify-between text-right px-4 py-3 text-lg font-medium hover:bg-gray-50 rounded-lg"
                  onClick={() => {
                    toggleCart();
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <div className="flex items-center">
                    {cartItemCount > 0 && (
                      <Badge 
                        className="h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground"
                      >
                        {cartItemCount}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center">
                    <span>سلة التسوق</span>
                    <ShoppingBag className="w-5 h-5 ml-3" />
                  </div>
                </Button>

                {/* Auth Buttons for Mobile */}
                {state.isAuthenticated && (
                  <Button 
                    variant="ghost" 
                    className="w-full justify-end text-right px-4 py-3 text-lg font-medium hover:bg-gray-50 rounded-lg"
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <div className="flex items-center">
                      <span>تسجيل خروج</span>
                      <LogOut className="w-5 h-5 ml-3" />
                    </div>
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black/20 z-[9998]"
            style={{ top: '88px' }}
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="fixed inset-0 top-[88px] z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={closeMobileMenu}
            />
            
            {/* Menu Content */}
            <motion.div
              className={`absolute top-0 w-full bg-background/95 backdrop-blur-md border-b border-border/20 shadow-lg ${isRTL ? 'right-0' : 'left-0'}`}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <nav className="container mx-auto px-6 py-6">
                <div className="flex flex-col space-y-6">
                  {/* Navigation Links */}
                  <div className="flex flex-col space-y-4">
                    <Link 
                      to="/#top" 
                      className="text-lg font-medium text-foreground hover:text-primary transition-colors duration-300 py-2"
                      onClick={closeMobileMenu}
                    >
                      {extractString(translations?.nav?.home)}
                    </Link>
                    <Link 
                      to="/products" 
                      className="text-lg font-medium text-foreground hover:text-primary transition-colors duration-300 py-2"
                      onClick={closeMobileMenu}
                    >
                      {extractString(translations?.nav?.collections)}
                    </Link>
                    <Link 
                      to="/#about" 
                      className="text-lg font-medium text-foreground hover:text-primary transition-colors duration-300 py-2"
                      onClick={closeMobileMenu}
                    >
                      {extractString(translations?.nav?.about)}
                    </Link>
                    <Link 
                      to="/#contact" 
                      className="text-lg font-medium text-foreground hover:text-primary transition-colors duration-300 py-2"
                      onClick={closeMobileMenu}
                    >
                      {extractString(translations?.nav?.contact)}
                    </Link>
                  </div>

                  {/* Mobile Actions */}
                  <div className={`flex items-center justify-between pt-4 border-t border-border/20 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-4' : 'space-x-4'}`}>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="hover:bg-muted/50 relative"
                        onClick={() => {
                          toggleCart();
                          closeMobileMenu();
                        }}
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
                    </div>

                    {/* Auth Section for Mobile */}
                    {state.isAuthenticated && (
                      <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                        <span className="text-sm text-muted-foreground">
                          مرحباً، {state.user?.firstName || state.user?.email}
                        </span>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="hover:bg-muted/50"
                          onClick={() => {
                            logout();
                            closeMobileMenu();
                          }}
                          title="تسجيل خروج"
                        >
                          <LogOut className="w-5 h-5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}