import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useTranslations } from "@/hooks/useTranslations";
import { Home, ArrowRight, ArrowLeft, Search, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const { currentLang, t } = useTranslations();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const isRTL = currentLang === 'ar';
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-4xl mx-auto text-center">
        {/* Decorative Elements */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <div className="w-96 h-96 rounded-full bg-gradient-to-r from-rose-200 to-amber-200 blur-3xl"></div>
          </div>
          
          {/* 404 Number */}
          <div className="relative">
            <h1 className="text-8xl md:text-9xl font-bold bg-gradient-to-r from-rose-600 via-amber-600 to-rose-600 bg-clip-text text-transparent mb-4">
              404
            </h1>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-20">
              <ShoppingBag className="w-32 h-32 text-rose-300" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6 mb-12">
          <h2 className={`text-3xl md:text-4xl font-bold text-gray-800 ${isRTL ? 'font-arabic' : ''}`}>
            {t('notFound.title')}
          </h2>
          
          <p className={`text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed ${isRTL ? 'font-arabic' : ''}`}>
            {t('notFound.description')}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Button asChild size="lg" className="bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
            <Link to="/" className="flex items-center gap-2">
              <Home className="w-5 h-5" />
              <span className={isRTL ? 'font-arabic' : ''}>
                {t('notFound.backHome')}
              </span>
            </Link>
          </Button>

          <Button asChild variant="outline" size="lg" className="border-2 border-rose-200 hover:border-rose-300 text-rose-700 hover:bg-rose-50 px-8 py-3 rounded-full transition-all duration-300">
            <Link to="/products" className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              <span className={isRTL ? 'font-arabic' : ''}>
                {t('notFound.browseProducts')}
              </span>
            </Link>
          </Button>
        </div>

        {/* Quick Links */}
        <div className="border-t border-gray-200 pt-8">
          <h3 className={`text-lg font-semibold text-gray-700 mb-4 ${isRTL ? 'font-arabic' : ''}`}>
            {t('notFound.quickLinks')}
          </h3>
          
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link 
              to="/products" 
              className={`text-rose-600 hover:text-rose-800 hover:underline transition-colors duration-200 ${isRTL ? 'font-arabic' : ''}`}
            >
              {t('notFound.products')}
            </Link>
            <span className="text-gray-300">|</span>
            <Link 
              to="/about" 
              className={`text-rose-600 hover:text-rose-800 hover:underline transition-colors duration-200 ${isRTL ? 'font-arabic' : ''}`}
            >
              {t('notFound.about')}
            </Link>
            <span className="text-gray-300">|</span>
            <Link 
              to="/contact" 
              className={`text-rose-600 hover:text-rose-800 hover:underline transition-colors duration-200 ${isRTL ? 'font-arabic' : ''}`}
            >
              {t('notFound.contactUs')}
            </Link>
            <span className="text-gray-300">|</span>
            <Link 
              to="/cart" 
              className={`text-rose-600 hover:text-rose-800 hover:underline transition-colors duration-200 ${isRTL ? 'font-arabic' : ''}`}
            >
              {t('notFound.cart')}
            </Link>
          </div>
        </div>

        {/* Decorative Bottom Element */}
        <div className="mt-12 flex justify-center">
          <div className="w-24 h-1 bg-gradient-to-r from-rose-400 to-amber-400 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
