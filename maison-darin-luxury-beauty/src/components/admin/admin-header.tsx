import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { Bell, User, Search, LogOut, Settings, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface AdminHeaderProps {
  currentLang: 'en' | 'ar';
  onLanguageChange: (lang: 'en' | 'ar') => void;
  activeTab: string;
}

export const AdminHeader = ({ currentLang, onLanguageChange, activeTab }: AdminHeaderProps) => {
  const { state: authState, logout } = useAuth();
  const { toast } = useToast();
  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return currentLang === 'ar' ? 'لوحة التحكم' : 'Dashboard';
      case 'products':
        return currentLang === 'ar' ? 'إدارة المنتجات' : 'Product Management';
      case 'media':
        return currentLang === 'ar' ? 'مكتبة الوسائط' : 'Media Library';
      case 'content':
        return currentLang === 'ar' ? 'إدارة المحتوى' : 'Content Management';
      case 'settings':
        return currentLang === 'ar' ? 'الإعدادات' : 'Settings';
      default:
        return currentLang === 'ar' ? 'لوحة التحكم' : 'Dashboard';
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: currentLang === 'ar' ? "تم تسجيل الخروج" : "Logged Out",
        description: currentLang === 'ar' ? "تم تسجيل الخروج بنجاح" : "You have been logged out successfully",
      });
    } catch (error) {
      toast({
        title: currentLang === 'ar' ? "خطأ" : "Error",
        description: currentLang === 'ar' ? "حدث خطأ أثناء تسجيل الخروج" : "An error occurred while logging out",
        variant: "destructive",
      });
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className={`
      h-16 border-b bg-card/95 backdrop-blur-sm shadow-sm
      flex items-center justify-between px-6 admin-header
      ${currentLang === 'ar' ? 'flex-row-reverse border-l' : 'border-r'}
    `}>
      {/* Page Title Section */}
      <div className={`flex items-center gap-4 ${currentLang === 'ar' ? 'flex-row-reverse' : ''}`}>
        <div className={`flex flex-col ${currentLang === 'ar' ? 'items-end' : 'items-start'}`}>
          <h1 className={`text-xl font-semibold text-primary ${currentLang === 'ar' ? 'text-right' : 'text-left'}`}>
            {getPageTitle()}
          </h1>
          <p className={`text-sm text-muted-foreground ${currentLang === 'ar' ? 'text-right' : 'text-left'}`}>
            {currentLang === 'ar' ? 'إدارة وتحكم شامل' : 'Complete management and control'}
          </p>
        </div>
      </div>

      {/* Actions Section */}
      <div className={`flex items-center gap-3 ${currentLang === 'ar' ? 'flex-row-reverse' : ''}`}>
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className={`
            absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground 
            ${currentLang === 'ar' ? 'right-3' : 'left-3'}
          `} />
          <Input
            placeholder={currentLang === 'ar' ? 'بحث في لوحة التحكم...' : 'Search dashboard...'}
            className={`
              w-64 bg-background/50 border-border/50 focus:bg-background focus:border-primary/50
              ${currentLang === 'ar' ? 'pr-10 text-right' : 'pl-10 text-left'}
            `}
            dir={currentLang === 'ar' ? 'rtl' : 'ltr'}
          />
        </div>

        {/* Language Switcher */}
        <LanguageSwitcher currentLang={currentLang} onLanguageChange={onLanguageChange} />

        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative hover:bg-primary/10">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 h-2 w-2 bg-destructive rounded-full"></span>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className={`
                flex items-center gap-3 px-3 py-2 hover:bg-primary/10 rounded-lg
                user-info ${currentLang === 'ar' ? 'flex-row-reverse' : ''}
              `}
            >
              <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                <AvatarImage src={authState.user?.avatar} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {authState.user?.name ? getUserInitials(authState.user.name) : 'AD'}
                </AvatarFallback>
              </Avatar>
              <div className={`hidden md:flex flex-col ${currentLang === 'ar' ? 'items-end' : 'items-start'}`}>
                <span className="text-sm font-medium text-foreground">
                  {authState.user?.name || (currentLang === 'ar' ? 'المدير' : 'Admin')}
                </span>
                <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                  {currentLang === 'ar' ? 'مدير النظام' : (authState.user?.role || 'System Admin')}
                </Badge>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align={currentLang === 'ar' ? 'start' : 'end'} 
            className={`w-56 ${currentLang === 'ar' ? 'text-right' : 'text-left'} bg-card/95 backdrop-blur-sm`}
          >
            <DropdownMenuLabel className={`flex flex-col ${currentLang === 'ar' ? 'items-end' : 'items-start'}`}>
              <span className="font-medium">
                {authState.user?.name || (currentLang === 'ar' ? 'المستخدم المدير' : 'Admin User')}
              </span>
              <span className="text-xs text-muted-foreground">
                {authState.user?.email}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className={`${currentLang === 'ar' ? 'flex-row-reverse' : ''} hover:bg-primary/10`}>
              <User className={`h-4 w-4 ${currentLang === 'ar' ? 'ml-2' : 'mr-2'}`} />
              {currentLang === 'ar' ? 'الملف الشخصي' : 'Profile'}
            </DropdownMenuItem>
            <DropdownMenuItem className={`${currentLang === 'ar' ? 'flex-row-reverse' : ''} hover:bg-primary/10`}>
              <Settings className={`h-4 w-4 ${currentLang === 'ar' ? 'ml-2' : 'mr-2'}`} />
              {currentLang === 'ar' ? 'الإعدادات' : 'Settings'}
            </DropdownMenuItem>
            <DropdownMenuItem className={`${currentLang === 'ar' ? 'flex-row-reverse' : ''} hover:bg-primary/10`}>
              <Shield className={`h-4 w-4 ${currentLang === 'ar' ? 'ml-2' : 'mr-2'}`} />
              {currentLang === 'ar' ? 'الأمان' : 'Security'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className={`text-destructive focus:text-destructive hover:bg-destructive/10 ${currentLang === 'ar' ? 'flex-row-reverse' : ''}`}
              onClick={handleLogout}
            >
              <LogOut className={`h-4 w-4 ${currentLang === 'ar' ? 'ml-2' : 'mr-2'}`} />
              {currentLang === 'ar' ? 'تسجيل الخروج' : 'Log out'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};