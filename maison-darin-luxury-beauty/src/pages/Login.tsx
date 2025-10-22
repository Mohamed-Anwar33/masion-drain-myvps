import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Lock, Mail, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const currentLang = 'en'; // Fixed to English only
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { state: authState, login, clearError } = useAuth();

  // Get the intended destination from location state
  const from = (location.state as any)?.from || '/admin';

  // Set document direction and language to English only
  useEffect(() => {
    document.documentElement.setAttribute('dir', 'ltr');
    document.documentElement.setAttribute('lang', 'en');
    localStorage.setItem('lang', 'en');
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    console.log('🔍 Auth state changed:', { 
      isAuthenticated: authState.isAuthenticated, 
      user: authState.user,
      from: from 
    });
    
    if (authState.isAuthenticated) {
      console.log('✅ User is authenticated, navigating to:', from);
      navigate(from, { replace: true });
    }
  }, [authState.isAuthenticated, navigate, from]);

  // Clear auth errors on unmount only (avoid effect churn)
  useEffect(() => {
    return () => {
      clearError();
    };
  }, []);

  useEffect(() => {
    if (authState.error && (formData.email || formData.password)) {
      clearError();
    }
    // Only rerun when inputs change; clearError is stable via useCallback
  }, [formData.email, formData.password, authState.error]);

  // Fixed English translations only
  const t = {
    title: "Welcome Back",
    subtitle: "Sign in to your admin dashboard",
    email: "Email Address",
    password: "Password",
    showPassword: "Show password",
    hidePassword: "Hide password",
    signIn: "Sign In",
    signingIn: "Signing in...",
    invalidCredentials: "Invalid email or password",
    networkError: "Network error. Please try again.",
    emailRequired: "Email is required",
    passwordRequired: "Password is required",
    invalidEmail: "Please enter a valid email address",
    brandName: "Maison Darin",
    brandTagline: "Luxury Perfumes Admin",
    accountLocked: "Account is temporarily locked due to too many failed attempts",
    sessionExpired: "Your session has expired. Please login again.",
    securityNotice: "For security, sessions expire after 24 hours of inactivity"
  };

  const validateForm = () => {
    if (!formData.email) {
      return { isValid: false, error: t.emailRequired };
    }
    if (!formData.password) {
      return { isValid: false, error: t.passwordRequired };
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      return { isValid: false, error: t.invalidEmail };
    }
    return { isValid: true, error: null };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateForm();
    if (!validation.isValid) {
      return;
    }

    try {
      console.log('🚀 Attempting login with:', { email: formData.email, from });
      
      await login(formData.email, formData.password);
      
      console.log('✅ Login successful, auth state:', authState);
      
      toast({
        title: "Login Successful",
        description: "Welcome to the admin dashboard",
      });
      
      // Navigate immediately after successful login
      console.log('🔄 Navigating to:', from);
      
      // Small delay to ensure state is updated
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 100);
    } catch (err) {
      // Error is handled by AuthContext and displayed below
      console.error('Login error:', err);
    }
  };
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl border-0 bg-background/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4 pb-8">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="mx-auto w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg"
            >
              <img 
                src="/src/assets/logo.png" 
                alt={t.brandName}
                className="w-12 h-12 object-contain"
                onError={(e) => {
                  // Fallback to icon if logo fails to load
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                  if (fallback) fallback.classList.remove('hidden');
                }}
              />
              <Lock className="w-10 h-10 text-primary-foreground hidden fallback-icon" />
            </motion.div>
            
            <div>
              <CardTitle className="text-2xl font-bold text-primary mb-2">
                {t.brandName}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {t.brandTagline}
              </CardDescription>
            </div>
            
            <div>
              <h1 className="text-xl font-semibold">{t.title}</h1>
              <p className="text-sm text-muted-foreground">{t.subtitle}</p>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Alert */}
              {authState.error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {authState.error === 'Invalid credentials' 
                        ? t.invalidCredentials 
                        : authState.error === 'Network error'
                        ? t.networkError
                        : authState.error.includes('locked')
                        ? t.accountLocked
                        : authState.error.includes('expired')
                        ? t.sessionExpired
                        : authState.error
                      }
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}

              {/* Security Notice */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-xs text-muted-foreground text-center p-2 bg-muted/30 rounded"
              >
                {t.securityNotice}
              </motion.div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  {t.email}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="pl-10"
                    placeholder="admin@maisondarin.com"
                    disabled={authState.isLoading}
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  {t.password}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="pl-10 pr-10"
                    placeholder="••••••••"
                    disabled={authState.isLoading}
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={authState.isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    <span className="sr-only">
                      {showPassword ? t.hidePassword : t.showPassword}
                    </span>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={authState.isLoading}
                size="lg"
              >
                {authState.isLoading ? t.signingIn : t.signIn}
              </Button>

            </form>
          </CardContent>
        </Card>

      </motion.div>
    </div>
  );
};

export default Login;