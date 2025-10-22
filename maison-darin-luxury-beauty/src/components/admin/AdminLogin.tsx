import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, LogIn, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';

interface AdminLoginProps {
  currentLang: 'en' | 'ar';
  onLanguageChange: (lang: 'en' | 'ar') => void;
}

export function AdminLogin({ currentLang, onLanguageChange }: AdminLoginProps) {
  console.log('🚀 AdminLogin component loaded!');
  const [email, setEmail] = useState('admin@maisondarin.com');
  const [password, setPassword] = useState('Admin123456#');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, state } = useAuth();
  const navigate = useNavigate();
  const isRTL = currentLang === 'ar';

  // Monitor auth state changes and redirect when login succeeds
  useEffect(() => {
    console.log('🔍 Auth state changed:', { 
      isAuthenticated: state.isAuthenticated, 
      userRole: state.user?.role,
      isLoading: state.isLoading 
    });
    
    if (state.isAuthenticated && state.user?.role === 'admin') {
      console.log('🚀 Admin authenticated, redirecting to /admin');
      navigate('/admin', { replace: true });
    }
  }, [state.isAuthenticated, state.user?.role, state.isLoading, navigate]);

  // Redirect if already authenticated as admin
  if (state.isAuthenticated && state.user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('🔐 Attempting login with:', { email, password: '***' });
      console.log('🌐 API Base URL:', import.meta.env.VITE_API_URL || 'http://localhost:5000/api');
      
      await login(email, password);
      console.log('✅ Login successful from AdminLogin component');
      
      // Wait a bit for state to update, then redirect
      setTimeout(() => {
        console.log('🚀 Navigating to /admin after successful login');
        navigate('/admin', { replace: true });
      }, 100);
      
    } catch (err) {
      console.error('❌ Login failed:', err);
      const errorMessage = err instanceof Error ? err.message : 
        (currentLang === 'ar' ? 'حدث خطأ في تسجيل الدخول' : 'An error occurred during login');
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div 
      className={`min-h-screen bg-gradient-to-br from-dark-tea via-teal-green to-light-brown flex items-center justify-center p-4 ${isRTL ? 'rtl' : 'ltr'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className={`absolute top-1/4 ${isRTL ? 'right-1/4' : 'left-1/4'} w-32 h-32 border border-gold rounded-full animate-pulse`}></div>
        <div className={`absolute bottom-1/3 ${isRTL ? 'left-1/4' : 'right-1/4'} w-24 h-24 border border-light-brown rounded-full animate-pulse delay-1000`}></div>
        <div className={`absolute top-1/2 ${isRTL ? 'left-1/3' : 'right-1/3'} w-16 h-16 border border-beige rounded-full animate-pulse delay-2000`}></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="bg-off-white/95 backdrop-blur-xl border-gold/20 shadow-luxury">
          <CardHeader className="text-center space-y-4">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto w-16 h-16 bg-gradient-to-br from-gold to-light-brown rounded-xl flex items-center justify-center"
            >
              <span className="text-off-white font-bold text-2xl">M</span>
            </motion.div>

            <div>
              <CardTitle className="text-2xl font-display font-bold text-dark-tea">
                {currentLang === 'ar' ? 'ميزون دارين' : 'Maison Darin'}
              </CardTitle>
              <p className="text-dark-tea/60 mt-2">
                {currentLang === 'ar' ? 'لوحة تحكم المسؤول' : 'Admin Dashboard'}
              </p>
            </div>

            {/* Language Switcher */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLanguageChange(currentLang === 'ar' ? 'en' : 'ar')}
              className="absolute top-4 right-4 rtl:right-auto rtl:left-4 flex items-center space-x-2 rtl:space-x-reverse"
            >
              <Globe className="w-4 h-4" />
              <span className="text-sm font-medium">
                {currentLang === 'ar' ? 'EN' : 'عر'}
              </span>
            </Button>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-dark-tea font-medium">
                  {currentLang === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                </Label>
                <div className="relative">
                  <Mail className={`absolute top-1/2 transform -translate-y-1/2 ${isRTL ? 'right-3' : 'left-3'} w-4 h-4 text-dark-tea/40`} />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`${isRTL ? 'pr-10' : 'pl-10'} border-gold/20 focus:border-gold/50 bg-white/50`}
                    placeholder={currentLang === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-dark-tea font-medium">
                  {currentLang === 'ar' ? 'كلمة المرور' : 'Password'}
                </Label>
                <div className="relative">
                  <Lock className={`absolute top-1/2 transform -translate-y-1/2 ${isRTL ? 'right-3' : 'left-3'} w-4 h-4 text-dark-tea/40`} />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10'} border-gold/20 focus:border-gold/50 bg-white/50`}
                    placeholder={currentLang === 'ar' ? 'أدخل كلمة المرور' : 'Enter your password'}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={`absolute top-1/2 transform -translate-y-1/2 ${isRTL ? 'left-2' : 'right-2'} h-auto p-1`}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-dark-tea/40" />
                    ) : (
                      <Eye className="w-4 h-4 text-dark-tea/40" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800">
                      {error}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-gold to-light-brown hover:from-gold/90 hover:to-light-brown/90 text-off-white font-semibold py-3 transition-all duration-300"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <div className="w-4 h-4 border-2 border-off-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{currentLang === 'ar' ? 'جاري تسجيل الدخول...' : 'Signing in...'}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                    <LogIn className="w-4 h-4" />
                    <span>{currentLang === 'ar' ? 'تسجيل الدخول' : 'Sign In'}</span>
                  </div>
                )}
              </Button>
            </form>

          </CardContent>
        </Card>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-8"
        >
          <p className="text-beige/60 text-sm">
            © 2024 {currentLang === 'ar' ? 'ميزون دارين' : 'Maison Darin'}. 
            {currentLang === 'ar' ? ' جميع الحقوق محفوظة.' : ' All rights reserved.'}
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
