import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { useEffect, useState } from "react";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartDrawer } from "@/components/ui/cart-drawer";
import { WhatsAppFloat } from "@/components/ui/whatsapp-float";
import router from "@/router";
import cacheManager from "@/utils/cacheManager";

const queryClient = new QueryClient();

const App = () => {
  const [currentLang, setCurrentLang] = useState<'en' | 'ar'>(
    () => (localStorage.getItem('lang') as 'en' | 'ar') || 'en'
  );

  // استدعاء مدير التخزين المؤقت للتحقق من وجود تحديثات وتنظيف الكاش
  useEffect(() => {
    // التحقق من التحديثات وتنظيف الكاش إذا لزم الأمر
    cacheManager.checkForUpdates();
    
    // فحص إذا كان هناك حاجة لمسح التخزين المؤقت بناءً على الوقت المنقضي
    if (cacheManager.isCacheExpired(12)) { // مسح التخزين المؤقت إذا مر أكثر من 12 ساعة
      console.log('🧹 التخزين المؤقت قديم، جارٍ التنظيف...');
      cacheManager.clearBrowserCache({ clearLocalStorage: false, clearSessionStorage: false });
    }
  }, []);

  useEffect(() => {
    const onLangChange = (e: Event) => {
      const detail = (e as CustomEvent<'en' | 'ar'>).detail;
      const lang = detail || (localStorage.getItem('lang') as 'en' | 'ar') || 'en';
      setCurrentLang(lang);
    };
    window.addEventListener('lang:change', onLangChange as EventListener);
    
    const onFocus = () => {
      const lang = (localStorage.getItem('lang') as 'en' | 'ar') || 'en';
      setCurrentLang(lang);
    };
    window.addEventListener('focus', onFocus);
    
    return () => {
      window.removeEventListener('lang:change', onLangChange as EventListener);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            {/* استخدام createAppRouter لإنشاء راوتر جديد مع تمرير currentLang */}
            <RouterProvider router={router.createAppRouter(currentLang)} />
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
