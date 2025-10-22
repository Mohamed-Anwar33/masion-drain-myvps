import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Eye, EyeOff, Home, Info, Star, Grid3X3, Mail, Phone, MessageSquare, BookOpen } from 'lucide-react';
import { useHomePageSection } from '../../../hooks/useHomePage';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const DisplaySettingsEditor: React.FC = () => {
  const { data, loading, updateSection } = useHomePageSection('display');
  const [formData, setFormData] = useState({
    showHeroSection: true,
    showAboutSection: true,
    showFeaturedProducts: true,
    showCategories: true,
    showNewsletter: true,
    showContact: true,
    showTestimonials: true,
    showBlog: false
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setFormData({
        showHeroSection: data.showHeroSection ?? true,
        showAboutSection: data.showAboutSection ?? true,
        showFeaturedProducts: data.showFeaturedProducts ?? true,
        showCategories: data.showCategories ?? true,
        showNewsletter: data.showNewsletter ?? true,
        showContact: data.showContact ?? true,
        showTestimonials: data.showTestimonials ?? true,
        showBlog: data.showBlog ?? false
      });
    }
  }, [data]);

  const handleToggle = (field: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field as keyof typeof prev]
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateSection(formData);
    } catch (error) {
      console.error('Error saving display settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const sections = [
    {
      key: 'showHeroSection',
      label: 'القسم الرئيسي (Hero)',
      description: 'البانر الرئيسي في أعلى الصفحة',
      icon: <Home className="w-5 h-5" />,
      color: 'text-blue-600'
    },
    {
      key: 'showAboutSection',
      label: 'قسم نبذة عنا',
      description: 'معلومات عن الشركة ورؤيتها',
      icon: <Info className="w-5 h-5" />,
      color: 'text-green-600'
    },
    {
      key: 'showFeaturedProducts',
      label: 'المنتجات المميزة',
      description: 'عرض المنتجات المختارة والمميزة',
      icon: <Star className="w-5 h-5" />,
      color: 'text-yellow-600'
    },
    {
      key: 'showCategories',
      label: 'قسم الفئات',
      description: 'عرض فئات المنتجات المختلفة',
      icon: <Grid3X3 className="w-5 h-5" />,
      color: 'text-purple-600'
    },
    {
      key: 'showNewsletter',
      label: 'النشرة الإخبارية',
      description: 'نموذج الاشتراك في النشرة الإخبارية',
      icon: <Mail className="w-5 h-5" />,
      color: 'text-indigo-600'
    },
    {
      key: 'showContact',
      label: 'قسم التواصل',
      description: 'معلومات التواصل ونموذج الاتصال',
      icon: <Phone className="w-5 h-5" />,
      color: 'text-pink-600'
    },
    {
      key: 'showTestimonials',
      label: 'آراء العملاء',
      description: 'عرض تقييمات وآراء العملاء',
      icon: <MessageSquare className="w-5 h-5" />,
      color: 'text-cyan-600'
    },
    {
      key: 'showBlog',
      label: 'قسم المدونة',
      description: 'عرض آخر مقالات المدونة',
      icon: <BookOpen className="w-5 h-5" />,
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="space-y-8" dir="rtl">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">إعدادات عرض الأقسام</h3>
        <p className="text-blue-700 text-sm">
          تحكم في الأقسام التي تريد عرضها أو إخفاؤها في الصفحة الرئيسية. يمكنك تفعيل أو إلغاء تفعيل أي قسم حسب احتياجاتك.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section) => (
          <div key={section.key} className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className={`${section.color} ml-3`}>
                  {section.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{section.label}</h4>
                  <p className="text-sm text-gray-600">{section.description}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                {formData[section.key as keyof typeof formData] ? (
                  <Eye className="w-5 h-5 text-green-500 ml-2" />
                ) : (
                  <EyeOff className="w-5 h-5 text-gray-400 ml-2" />
                )}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData[section.key as keyof typeof formData]}
                    onChange={() => handleToggle(section.key)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
            
            <div className="text-xs text-gray-500">
              الحالة: {formData[section.key as keyof typeof formData] ? (
                <span className="text-green-600 font-medium">مفعل</span>
              ) : (
                <span className="text-red-600 font-medium">غير مفعل</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="border-t pt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">ملخص الإعدادات</h3>
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-green-900 mb-2">الأقسام المفعلة</h4>
              <div className="space-y-1">
                {sections.filter(section => formData[section.key as keyof typeof formData]).map(section => (
                  <div key={section.key} className="flex items-center text-sm text-green-700">
                    <Eye className="w-4 h-4 ml-1" />
                    {section.label}
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-red-900 mb-2">الأقسام المخفية</h4>
              <div className="space-y-1">
                {sections.filter(section => !formData[section.key as keyof typeof formData]).map(section => (
                  <div key={section.key} className="flex items-center text-sm text-red-700">
                    <EyeOff className="w-4 h-4 ml-1" />
                    {section.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={saving}
          className="flex items-center px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <LoadingSpinner size="sm" className="ml-2" />
          ) : (
            <Save className="w-5 h-5 ml-2" />
          )}
          {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </motion.button>
      </div>
    </div>
  );
};

export default DisplaySettingsEditor;
