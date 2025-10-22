import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings, 
  Image, 
  MessageSquare, 
  CreditCard,
  Menu,
  X,
  LogOut,
  User,
  Bell,
  Search,
  Globe,
  Home,
  Mail,
  Info,
  TestTube,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentLang: 'en' | 'ar';
  onLanguageChange: (lang: 'en' | 'ar') => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function AdminLayout({ 
  children, 
  currentLang, 
  onLanguageChange, 
  activeTab, 
  onTabChange 
}: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { logout, state } = useAuth();
  const isRTL = currentLang === 'ar';

  const menuItems = [
    {
      id: 'dashboard',
      label: currentLang === 'ar' ? 'لوحة التحكم' : 'Dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'products',
      label: currentLang === 'ar' ? 'المنتجات' : 'Products',
      icon: Package,
      badge: null
    },
    {
      id: 'orders',
      label: currentLang === 'ar' ? 'الطلبات' : 'Orders',
      icon: ShoppingCart,
      badge: '12'
    },
    {
      id: 'homepage',
      label: currentLang === 'ar' ? 'الصفحة الرئيسية' : 'Homepage',
      icon: Home,
      badge: null
    },
    {
      id: 'site-settings',
      label: currentLang === 'ar' ? 'إعدادات الموقع' : 'Site Settings',
      icon: Settings,
      badge: null
    },
    {
      id: 'paypal',
      label: currentLang === 'ar' ? 'إعدادات PayPal' : 'PayPal Settings',
      icon: CreditCard,
      badge: null
    },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-dark-tea via-teal-green to-light-brown ${isRTL ? 'rtl' : 'ltr'} relative overflow-hidden`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {sidebarOpen && (
        <motion.aside
          initial={{ x: isRTL ? 320 : -320 }}
          animate={{ x: 0 }}
          exit={{ x: isRTL ? 320 : -320 }}
          className={`w-80 h-screen bg-off-white/95 backdrop-blur-xl ${isRTL ? 'border-l' : 'border-r'} border-gold/20 shadow-luxury fixed top-0 ${isRTL ? 'right-0' : 'left-0'} z-50 overflow-y-auto`}
      >
        <div className="p-6 border-b border-gold/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-10 h-10 bg-gradient-to-br from-gold to-light-brown rounded-lg flex items-center justify-center">
                <span className="text-off-white font-bold text-lg">M</span>
              </div>
              <div>
                <h2 className="text-lg font-display font-bold text-dark-tea">
                  {currentLang === 'ar' ? 'ميزون دارين' : 'Maison Darin'}
                </h2>
                <p className="text-sm text-dark-tea/60">
                  {currentLang === 'ar' ? 'لوحة التحكم' : 'Admin Panel'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => {
                console.log('Clicked on:', item.id);
                onTabChange(item.id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-300 group ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-gold/20 to-light-brown/20 text-dark-tea border border-gold/30 shadow-lg'
                  : 'text-dark-tea/70 hover:bg-gold/10 hover:text-dark-tea'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-gold' : 'text-dark-tea/60'}`} />
                <span className="font-medium">{item.label}</span>
              </div>
              {item.badge && (
                <Badge className="bg-gold text-dark-tea text-xs">
                  {item.badge}
                </Badge>
              )}
            </motion.button>
          ))}
        </nav>
        </motion.aside>
      )}

      {/* Main Content */}
      <div className={`min-h-screen transition-all duration-300 ${sidebarOpen ? (isRTL ? 'mr-80' : 'ml-80') : ''} w-full overflow-x-hidden`}>
        {/* Header */}
        <header className="bg-off-white/95 backdrop-blur-xl border-b border-gold/20 shadow-luxury sticky top-0 z-40">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              
              <div className="relative">
                <Search className={`absolute top-1/2 transform -translate-y-1/2 ${isRTL ? 'right-3' : 'left-3'} w-4 h-4 text-dark-tea/40`} />
                <Input
                  placeholder={currentLang === 'ar' ? 'البحث...' : 'Search...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`${isRTL ? 'pr-10' : 'pl-10'} w-64 bg-white/50 border-gold/20 focus:border-gold/50`}
                />
              </div>
            </div>

            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5" />
                <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 bg-gold text-dark-tea text-xs flex items-center justify-center">
                  3
                </Badge>
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-3 rtl:space-x-reverse p-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src="/admin-avatar.jpg" />
                      <AvatarFallback className="bg-gold text-dark-tea">
                        {state.user?.email?.charAt(0).toUpperCase() || 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block text-left rtl:text-right">
                      <p className="text-sm font-medium text-dark-tea">
                        {currentLang === 'ar' ? 'المسؤول' : 'Admin'}
                      </p>
                      <p className="text-xs text-dark-tea/60">
                        {state.user?.email || 'admin@maisondarin.com'}
                      </p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-56">
                  <DropdownMenuItem>
                    <User className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                    {currentLang === 'ar' ? 'الملف الشخصي' : 'Profile'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onTabChange('settings')}>
                    <Settings className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                    {currentLang === 'ar' ? 'الإعدادات' : 'Settings'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                    {currentLang === 'ar' ? 'تسجيل الخروج' : 'Logout'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 max-w-full overflow-x-hidden w-full">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
