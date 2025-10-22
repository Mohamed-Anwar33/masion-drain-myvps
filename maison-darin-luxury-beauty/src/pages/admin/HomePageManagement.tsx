import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Info, 
  Star, 
  Grid3X3, 
  Mail, 
  Phone, 
  Share2, 
  Search, 
  Settings, 
  Eye, 
  Wrench,
  Save,
  RotateCcw,
  Clock,
  User
} from 'lucide-react';
import { useHomePage } from '../../hooks/useHomePage';
import HeroSectionEditorNew from '@/components/admin/homepage/HeroSectionEditorNew';
import AboutSectionEditorNew from '@/components/admin/homepage/AboutSectionEditorNew';
import FeaturedCollectionsEditor from '@/components/admin/homepage/FeaturedCollectionsEditor';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface TabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  color: string;
}

const HomePageManagement: React.FC = () => {
  const { content, loading, error, resetToDefault, lastUpdated, updatedBy } = useHomePage();
  const [activeTab, setActiveTab] = useState('hero');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const tabs: TabItem[] = [
    {
      id: 'hero',
      label: 'البانر الرئيسي',
      icon: <Home className="w-5 h-5" />,
      component: <HeroSectionEditorNew />,
      color: 'bg-blue-500'
    },
    {
      id: 'about',
      label: 'قصتنا',
      icon: <Info className="w-5 h-5" />,
      component: <AboutSectionEditorNew />,
      color: 'bg-green-500'
    },
    {
      id: 'collections',
      label: 'المجموعات المميزة',
      icon: <Star className="w-5 h-5" />,
      component: <FeaturedCollectionsEditor />,
      color: 'bg-purple-500'
    }
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  const handleResetToDefault = async () => {
    if (window.confirm('هل أنت متأكد من إعادة تعيين جميع الإعدادات إلى الافتراضية؟ سيتم فقدان جميع التخصيصات الحالية.')) {
      try {
        await resetToDefault();
      } catch (error) {
        console.error('Error resetting to default:', error);
      }
    }
  };

  if (loading && !content) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && !content) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">خطأ في تحميل البيانات</div>
          <div className="text-gray-600">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Settings className="w-8 h-8 text-primary ml-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">إدارة الصفحة الرئيسية</h1>
                <p className="text-sm text-gray-500">تحكم في جميع أقسام ومحتوى الصفحة الرئيسية</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 space-x-reverse">
              {lastUpdated && (
                <div className="hidden md:flex items-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 ml-1" />
                  آخر تحديث: {lastUpdated.toLocaleDateString('ar-SA')}
                </div>
              )}
              
              <button
                onClick={handleResetToDefault}
                className="flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                <RotateCcw className="w-4 h-4 ml-2" />
                إعادة تعيين
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Mobile Tab Selector */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-lg shadow-sm border"
            >
              <div className="flex items-center">
                {activeTabData?.icon}
                <span className="mr-3 font-medium">{activeTabData?.label}</span>
              </div>
              <motion.div
                animate={{ rotate: isMobileMenuOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </motion.div>
            </button>

            <AnimatePresence>
              {isMobileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 bg-white rounded-lg shadow-sm border overflow-hidden"
                >
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center px-4 py-3 text-right hover:bg-gray-50 transition-colors ${
                        activeTab === tab.id ? 'bg-primary/5 text-primary border-r-4 border-primary' : 'text-gray-700'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ml-3 ${tab.color}`} />
                      {tab.icon}
                      <span className="mr-3">{tab.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-80">
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-6 border-b bg-gradient-to-r from-primary/5 to-primary/10">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">أقسام الصفحة</h2>
                <p className="text-sm text-gray-600">اختر القسم الذي تريد تعديله</p>
              </div>
              
              <div className="p-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-3 mb-1 rounded-lg text-right transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-primary text-white shadow-md transform scale-[1.02]'
                        : 'text-gray-700 hover:bg-gray-50 hover:transform hover:scale-[1.01]'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ml-3 ${
                      activeTab === tab.id ? 'bg-white' : tab.color
                    }`} />
                    <div className={`${activeTab === tab.id ? 'text-white' : 'text-gray-400'}`}>
                      {tab.icon}
                    </div>
                    <span className="mr-3 font-medium">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Info Card */}
            {content && (
              <div className="mt-6 bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">معلومات المحتوى</h3>
                
                <div className="space-y-3">
                  {lastUpdated && (
                    <div className="flex items-center text-sm">
                      <Clock className="w-4 h-4 text-gray-400 ml-2" />
                      <span className="text-gray-600">آخر تحديث:</span>
                      <span className="mr-2 font-medium">{lastUpdated.toLocaleString('ar-SA')}</span>
                    </div>
                  )}
                  
                  {updatedBy && (
                    <div className="flex items-center text-sm">
                      <User className="w-4 h-4 text-gray-400 ml-2" />
                      <span className="text-gray-600">تم التحديث بواسطة:</span>
                      <span className="mr-2 font-medium">{updatedBy.name || updatedBy.email}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center text-sm">
                    <Eye className="w-4 h-4 text-gray-400 ml-2" />
                    <span className="text-gray-600">وضع الصيانة:</span>
                    <span className={`mr-2 font-medium ${
                      content.maintenanceMode ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {content.maintenanceMode ? 'مفعل' : 'غير مفعل'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex items-center">
                  {activeTabData?.icon}
                  <h2 className="mr-3 text-xl font-semibold text-gray-900">
                    {activeTabData?.label}
                  </h2>
                </div>
              </div>
              
              <div className="p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {activeTabData?.component}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePageManagement;
