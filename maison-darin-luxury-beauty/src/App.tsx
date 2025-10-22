import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CartDrawer } from "@/components/ui/cart-drawer";
import { WhatsAppFloat } from "@/components/ui/whatsapp-float";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import CategoryPage from "./pages/CategoryPage";
import Checkout from "./pages/Checkout";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import CheckoutCancel from "./pages/CheckoutCancel";
import PayPalReturn from "./pages/PayPalReturn";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [currentLang, setCurrentLang] = useState<'en' | 'ar'>(
    () => (localStorage.getItem('lang') as 'en' | 'ar') || 'en'
  );

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
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/products" element={<Products />} />
                <Route path="/collections" element={<Products />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/category/:slug" element={<CategoryPage />} />
                {/* Guest Checkout - No Auth Required */}
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/checkout/success" element={<CheckoutSuccess />} />
                <Route path="/checkout/cancel" element={<CheckoutCancel />} />
                <Route path="/payment/return" element={<PayPalReturn />} />
                {/* Admin Routes - Auth Required */}
                <Route path="/auth" element={<Login />} />
                <Route path="/login" element={<Login />} />
                <Route path="/admin/login" element={<Login />} />
                <Route path="/admin-test" element={<Admin />} />
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <Admin />
                    </ProtectedRoute>
                  } 
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <CartDrawer currentLang={currentLang} />
              <WhatsAppFloat currentLang={currentLang} />
            </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
