import { LayoutDashboard, Package, Image, FileText, Settings, Activity, ShoppingCart, CreditCard, Users, FolderOpen } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAdminTranslations } from "@/hooks/useTranslations";

interface AdminSidebarProps {
  currentLang: 'en' | 'ar';
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const AdminSidebar = ({ currentLang, activeTab, onTabChange }: AdminSidebarProps) => {
  const { state, isMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const { t } = useAdminTranslations();

  const menuItems = [
    {
      id: 'dashboard',
      icon: LayoutDashboard,
      label: t('dashboard')
    },
    {
      id: 'products',
      icon: Package,
      label: t('products')
    },
    {
      id: 'orders',
      icon: ShoppingCart,
      label: currentLang === 'ar' ? 'الطلبات' : 'Orders'
    },
    {
      id: 'categories',
      icon: FolderOpen,
      label: currentLang === 'ar' ? 'الفئات' : 'Categories'
    },
    {
      id: 'analytics',
      icon: Activity,
      label: currentLang === 'ar' ? 'التحليلات' : 'Analytics'
    },
    {
      id: 'settings',
      icon: Settings,
      label: t('settings')
    },
  ];

  return (
    <Sidebar 
      className={`
        ${collapsed ? "w-14" : "w-60"} 
        bg-card border-border shadow-lg admin-sidebar
        fixed top-0 bottom-0 z-40
        ${currentLang === 'ar' ? 'right-0' : 'left-0'}
      `} 
      collapsible="icon"
      side={currentLang === 'ar' ? 'right' : 'left'}
    >
      {/* Sidebar Toggle */}
      <SidebarTrigger className={`m-2 ${currentLang === 'ar' ? 'self-start' : 'self-end'}`} />
      
      <SidebarContent className="bg-card/95 backdrop-blur-sm">
        <SidebarGroup>
          {/* Brand Header */}
          <SidebarGroupLabel className={`flex items-center gap-3 text-primary font-bold text-lg mb-6 p-4 ${currentLang === 'ar' ? 'flex-row-reverse text-right' : 'text-left'}`}>
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-md">
              <img 
                src="/src/assets/logo.png" 
                alt="Maison Darin"
                className="w-6 h-6 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling;
                  if (fallback) fallback.classList.remove('hidden');
                }}
              />
              <Package className="w-5 h-5 text-primary-foreground hidden" />
            </div>
            {!collapsed && (
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent font-semibold">
                {currentLang === 'ar' ? 'ميزون دارين' : 'Maison Darin'}
              </span>
            )}
          </SidebarGroupLabel>
          
          {/* Navigation Menu */}
          <SidebarGroupContent className="px-2">
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={activeTab === item.id}
                    className={`
                      w-full transition-all duration-200 hover:bg-primary/10 hover:text-primary
                      ${activeTab === item.id ? 'bg-primary/15 text-primary border-r-2 border-primary' : 'text-muted-foreground'}
                      ${currentLang === 'ar' ? 'flex-row-reverse text-right' : 'text-left'}
                      ${currentLang === 'ar' && activeTab === item.id ? 'border-r-0 border-l-2' : ''}
                    `}
                    onClick={() => onTabChange(item.id)}
                  >
                    <button className={`w-full flex items-center gap-3 p-3 rounded-lg ${currentLang === 'ar' ? 'flex-row-reverse' : ''}`}>
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && (
                        <span className="font-medium truncate">
                          {item.label}
                        </span>
                      )}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};