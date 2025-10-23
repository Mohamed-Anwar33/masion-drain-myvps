import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Eye, EyeOff, Type, BarChart3, Award, Gem, Sparkles, Globe } from 'lucide-react';
import { useAboutSection } from '../../../hooks/useAboutSection';
import { useNotifications } from '../../../hooks/useNotifications';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { NotificationContainer } from '../../ui/LuxuryNotification';

const AboutSectionEditorNew: React.FC = () => {
  const { aboutData, loading, updateAbout, refreshAbout } = useAboutSection();
  const { 
    notifications, 
    removeNotification,
    showSaveSuccess,
    showSaveError,
    showSaveProgress
  } = useNotifications();
  
  const [activeLanguage, setActiveLanguage] = useState<'en' | 'ar'>('ar');
  const [saving, setSaving] = useState(false);
  
  // Initialize form data from aboutData
  const [formData, setFormData] = useState({
    title: { en: '', ar: '' },
    subtitle: { en: '', ar: '' },
    description: { en: '', ar: '' },
    legacy: { en: '', ar: '' },
    values: {
      craftsmanship: {
        title: { en: '', ar: '' },
        description: { en: '', ar: '' }
      },
      elegance: {
        title: { en: '', ar: '' },
        description: { en: '', ar: '' }
      },
      exclusivity: {
        title: { en: '', ar: '' },
        description: { en: '', ar: '' }
      }
    },
    statistics: {
      collections: {
        value: '',
        label: { en: '', ar: '' }
      },
      clients: {
        value: '',
        label: { en: '', ar: '' }
      },
      countries: {
        value: '',
        label: { en: '', ar: '' }
      }
    },
    showSection: true,
    showStatistics: true,
    showValues: true
  });

  // Update form data when aboutData changes
  useEffect(() => {
    if (aboutData) {
      setFormData({ ...aboutData });
    }
  }, [aboutData]);

  // Handle input changes with nested object support
  const handleInputChange = (path: string, value: string | boolean, language?: 'en' | 'ar') => {
    setFormData(prev => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current: any = newData;
      
      // Navigate to the parent object
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      // Set the value
      const lastKey = keys[keys.length - 1];
      if (language) {
        if (!current[lastKey]) {
          current[lastKey] = {};
        }
        current[lastKey][language] = value;
      } else {
        current[lastKey] = value;
      }
      
      return newData;
    });
  };

  // Handle save
  const handleSave = async () => {
    setSaving(true);
    const progressId = showSaveProgress();
    
    try {
      await updateAbout(formData);
      await refreshAbout();
      removeNotification(progressId);
      showSaveSuccess();
    } catch (error) {
      console.error('Error saving about section:', error);
      removeNotification(progressId);
      showSaveError('حدث خطأ أثناء حفظ البيانات. يرجى المحاولة مرة أخرى.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !aboutData) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notifications */}
      <NotificationContainer 
        notifications={notifications} 
        onClose={removeNotification} 
      />
      
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Type className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">قسم قصتنا</h2>
              <p className="text-xs sm:text-sm text-gray-500">إدارة محتوى قسم التعريف بالشركة</p>
            </div>
          </div>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 w-full sm:w-auto justify-center"
          >
            <Save className="w-4 h-4 ml-2" />
            <span className="text-sm">{saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}</span>
          </button>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Language Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveLanguage('ar')}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeLanguage === 'ar' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              العربية
            </button>
            <button
              onClick={() => setActiveLanguage('en')}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeLanguage === 'en' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              English
            </button>
          </div>
          
          <button
            onClick={() => handleInputChange('showSection', !formData.showSection)}
            className={`flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              formData.showSection 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {formData.showSection ? <Eye className="w-4 h-4 ml-2" /> : <EyeOff className="w-4 h-4 ml-2" />}
            {formData.showSection ? 'مرئي' : 'مخفي'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg border p-6 space-y-8">
        {/* Title & Subtitle */}
        <div className="space-y-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="flex items-center text-lg font-semibold text-gray-900">
            <Type className="w-5 h-5 ml-2" />
            العناوين الرئيسية
          </h3>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                العنوان الرئيسي ({activeLanguage === 'ar' ? 'العربية' : 'English'})
              </label>
              <input
                type="text"
                value={formData.title[activeLanguage] || ''}
                onChange={(e) => handleInputChange('title', e.target.value, activeLanguage)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder={activeLanguage === 'ar' ? 'قصتنا' : 'Our Story'}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                العنوان الفرعي ({activeLanguage === 'ar' ? 'العربية' : 'English'})
              </label>
              <input
                type="text"
                value={formData.subtitle[activeLanguage] || ''}
                onChange={(e) => handleInputChange('subtitle', e.target.value, activeLanguage)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder={activeLanguage === 'ar' ? 'عندما يتحول التاريخ إلى عطر خالد..' : 'WHEN HISTORY TURNS INTO TIMELESS FRAGRANCE..'}
              />
            </div>
          </div>
        </div>

        {/* Description & Legacy */}
        <div className="space-y-6 p-4 bg-green-50 rounded-lg">
          <h3 className="flex items-center text-lg font-semibold text-gray-900">
            <Type className="w-5 h-5 ml-2" />
            النصوص الوصفية
          </h3>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الوصف الرئيسي ({activeLanguage === 'ar' ? 'العربية' : 'English'})
              </label>
              <textarea
                value={formData.description[activeLanguage] || ''}
                onChange={(e) => handleInputChange('description', e.target.value, activeLanguage)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
                placeholder={activeLanguage === 'ar' ? 'على شواطئ الخليج العربي تقع جزيرة دارين...' : 'On the shores of the Arabian Gulf lies Dareen Island...'}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نص الإرث ({activeLanguage === 'ar' ? 'العربية' : 'English'})
              </label>
              <textarea
                value={formData.legacy[activeLanguage] || ''}
                onChange={(e) => handleInputChange('legacy', e.target.value, activeLanguage)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
                placeholder={activeLanguage === 'ar' ? 'مستوحاة من هذا الإرث، وُلدت عطور دارين...' : 'Inspired by this legacy, Dareen Perfumes was born...'}
              />
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="space-y-6 p-4 bg-yellow-50 rounded-lg">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center text-lg font-semibold text-gray-900">
              <Award className="w-5 h-5 ml-2" />
              القيم والمميزات
            </h3>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.showValues}
                onChange={(e) => handleInputChange('showValues', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              <span className="mr-3 text-sm font-medium text-gray-700">عرض القيم</span>
            </label>
          </div>
          
          {/* Craftsmanship */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Award className="w-5 h-5 text-amber-600" />
              <h4 className="font-medium text-gray-700">الحرفية الفنية</h4>
            </div>
            <div className="grid grid-cols-1 gap-4 pl-7">
              <input
                type="text"
                value={formData.values.craftsmanship.title[activeLanguage] || ''}
                onChange={(e) => handleInputChange('values.craftsmanship.title', e.target.value, activeLanguage)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder={activeLanguage === 'ar' ? 'الحرفية الفنية' : 'Artisanal Craftsmanship'}
              />
              <textarea
                value={formData.values.craftsmanship.description[activeLanguage] || ''}
                onChange={(e) => handleInputChange('values.craftsmanship.description', e.target.value, activeLanguage)}
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
                placeholder={activeLanguage === 'ar' ? 'كل عطر مصنوع بعناية فائقة...' : 'Every perfume is meticulously crafted...'}
              />
            </div>
          </div>
          
          {/* Elegance */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Gem className="w-5 h-5 text-purple-600" />
              <h4 className="font-medium text-gray-700">الأناقة الخالدة</h4>
            </div>
            <div className="grid grid-cols-1 gap-4 pl-7">
              <input
                type="text"
                value={formData.values.elegance.title[activeLanguage] || ''}
                onChange={(e) => handleInputChange('values.elegance.title', e.target.value, activeLanguage)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder={activeLanguage === 'ar' ? 'الأناقة الخالدة' : 'Timeless Elegance'}
              />
              <textarea
                value={formData.values.elegance.description[activeLanguage] || ''}
                onChange={(e) => handleInputChange('values.elegance.description', e.target.value, activeLanguage)}
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
                placeholder={activeLanguage === 'ar' ? 'تصاميمنا تعكس الرقي والنعومة...' : 'Our designs reflect sophistication and grace...'}
              />
            </div>
          </div>
          
          {/* Exclusivity */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h4 className="font-medium text-gray-700">المجموعات الحصرية</h4>
            </div>
            <div className="grid grid-cols-1 gap-4 pl-7">
              <input
                type="text"
                value={formData.values.exclusivity.title[activeLanguage] || ''}
                onChange={(e) => handleInputChange('values.exclusivity.title', e.target.value, activeLanguage)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder={activeLanguage === 'ar' ? 'مجموعات حصرية' : 'Exclusive Collections'}
              />
              <textarea
                value={formData.values.exclusivity.description[activeLanguage] || ''}
                onChange={(e) => handleInputChange('values.exclusivity.description', e.target.value, activeLanguage)}
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
                placeholder={activeLanguage === 'ar' ? 'عطور إصدار محدود تقدم ملامح عطرية فريدة...' : 'Limited edition fragrances that offer unique scent profiles...'}
              />
            </div>
          </div>
        </div>

        {/* Statistics Section */}
        <div className="space-y-6 p-4 bg-purple-50 rounded-lg">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center text-lg font-semibold text-gray-900">
              <BarChart3 className="w-5 h-5 ml-2" />
              الإحصائيات
            </h3>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.showStatistics}
                onChange={(e) => handleInputChange('showStatistics', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              <span className="mr-3 text-sm font-medium text-gray-700">عرض الإحصائيات</span>
            </label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Collections */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-700">المجموعات</h4>
              <input
                type="text"
                value={formData.statistics.collections.value || ''}
                onChange={(e) => handleInputChange('statistics.collections.value', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder="15+"
              />
              <input
                type="text"
                value={formData.statistics.collections.label[activeLanguage] || ''}
                onChange={(e) => handleInputChange('statistics.collections.label', e.target.value, activeLanguage)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder={activeLanguage === 'ar' ? 'مجموعة' : 'Collections'}
              />
            </div>
            
            {/* Clients */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-700">العملاء</h4>
              <input
                type="text"
                value={formData.statistics.clients.value || ''}
                onChange={(e) => handleInputChange('statistics.clients.value', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder="5K+"
              />
              <input
                type="text"
                value={formData.statistics.clients.label[activeLanguage] || ''}
                onChange={(e) => handleInputChange('statistics.clients.label', e.target.value, activeLanguage)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder={activeLanguage === 'ar' ? 'عميلة سعيدة' : 'Happy Clients'}
              />
            </div>
            
            {/* Countries */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-700">الدول</h4>
              <input
                type="text"
                value={formData.statistics.countries.value || ''}
                onChange={(e) => handleInputChange('statistics.countries.value', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder="25+"
              />
              <input
                type="text"
                value={formData.statistics.countries.label[activeLanguage] || ''}
                onChange={(e) => handleInputChange('statistics.countries.label', e.target.value, activeLanguage)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder={activeLanguage === 'ar' ? 'دولة' : 'Countries'}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutSectionEditorNew;
