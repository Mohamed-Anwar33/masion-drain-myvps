import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';
import Index from '../pages/Index';
import Products from '../pages/Products';
import ProductDetail from '../pages/ProductDetail';
import Login from '../pages/Login';
import Admin from '../pages/Admin';
import NotFound from '../pages/NotFound';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import CheckoutSuccess from '../pages/CheckoutSuccess';
import Checkout from '../pages/Checkout';
import CheckoutCancel from '../pages/CheckoutCancel';
import PayPalReturn from '../pages/PayPalReturn';
import CategoryPage from '../pages/CategoryPage';
import RootLayout from '../components/layout/RootLayout';

// تمرير currentLang إلى router من App.tsx
const createAppRouter = (currentLang: 'en' | 'ar') => {
  return createBrowserRouter(
    createRoutesFromElements(
      // استخدام RootLayout كمكون أساسي يحتوي على CartDrawer و WhatsAppFloat
      <Route element={<RootLayout currentLang={currentLang} />}>
        {/* Public Routes */}
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
        
        {/* 404 Page */}
        <Route path="*" element={<NotFound />} />
      </Route>
    )
  );
};

const router = { createAppRouter };

export default router;
