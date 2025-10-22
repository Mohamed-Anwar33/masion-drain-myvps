import { useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { LuxuryDashboard } from './LuxuryDashboard';

// @ts-ignore - Temporary ignore TypeScript errors for these imports
import { ProductsManager } from './ProductsManager';
// @ts-ignore - Temporary ignore TypeScript errors for these imports  
import { OrdersManager } from './OrdersManager';
import { CategoryManager } from './CategoryManager';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import HomePageManagement from '../../pages/admin/HomePageManagement';
import { ContactSettings } from './ContactSettings';
import SiteSettingsManager from './SiteSettingsManager';
import PayPalSettingsFixed from './PayPalSettingsFixed';
// import PayPalTestPanel from './PayPalTestPanel';
// @ts-ignore - Temporary ignore TypeScript errors for this import
import OrdersManagement from './OrdersManagement';

interface AdminPanelProps {
  currentLang: 'en' | 'ar';
  onLanguageChange: (lang: 'en' | 'ar') => void;
}

export function AdminPanel({ currentLang = 'ar', onLanguageChange }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    console.log('Current activeTab:', activeTab);
    switch (activeTab) {
      case 'dashboard':
        return <LuxuryDashboard currentLang="ar" />;
      case 'products':
        console.log('Rendering ProductsManager');
        return <ProductsManager currentLang="ar" />;
      case 'orders':
        console.log('Rendering OrdersManagement');
        return <OrdersManagement />;
      case 'categories':
        return <CategoryManager currentLang="ar" />;
      case 'analytics':
        return <AnalyticsDashboard currentLang="ar" />;
      case 'homepage':
        return <HomePageManagement />;
      case 'contact-settings':
        return <ContactSettings />;
      case 'site-settings':
        return <SiteSettingsManager />;
      case 'paypal':
        return <PayPalSettingsFixed />;
      case 'settings':
        return <PlaceholderComponent title="الإعدادات" />;
      default:
        return <LuxuryDashboard currentLang="ar" />;
    }
  };

  return (
    <AdminLayout
      currentLang="ar"
      onLanguageChange={() => {}} // No language change allowed
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {renderContent()}
    </AdminLayout>
  );
}

// Placeholder component for unfinished managers
function PlaceholderComponent({ title }: { title: string; currentLang?: 'en' | 'ar' }) {
  return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-display font-bold text-off-white mb-4">
        {title}
      </h2>
      <p className="text-beige/80">
        قريباً...
      </p>
    </div>
  );
}

// Default export for lazy loading
export default AdminPanel;
