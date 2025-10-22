import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Eye, EyeOff, Type, Hash } from 'lucide-react';
import { useHomePageSection } from '../../../hooks/useHomePage';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const FeaturedProductsEditor: React.FC = () => {
  const { data, loading, updateSection } = useHomePageSection('featuredProducts');
  const [formData, setFormData] = useState({
    featuredProductsTitle: '',
    featuredProductsSubtitle: '',
    showFeaturedProducts: true,
    featuredProductsLimit: 8
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setFormData({
        featuredProductsTitle: data.featuredProductsTitle || '',
        featuredProductsSubtitle: data.featuredProductsSubtitle || '',
        showFeaturedProducts: data.showFeaturedProducts ?? true,
        featuredProductsLimit: data.featuredProductsLimit || 8
      });
    }
  }, [data]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateSection(formData);
    } catch (error) {
      console.error('Error saving featured products section:', error);
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

  return (
    <div className="space-y-8" dir="rtl">
      {/* Section Visibility Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center">
          {formData.showFeaturedProducts ? (
            <Eye className="w-5 h-5 text-green-500 ml-2" />
          ) : (
            <EyeOff className="w-5 h-5 text-gray-400 ml-2" />
          )}
          <span className="font-medium text-gray-900">عرض قسم المنتجات المميزة</span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            name="showFeaturedProducts"
            checked={formData.showFeaturedProducts}
            onChange={handleInputChange}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
        </label>
      </div>

      {/* Section Title */}
      <div className="space-y-2">
        <label className="flex items-center text-sm font-medium text-gray-700">
          <Type className="w-4 h-4 ml-2" />
          عنوان القسم
        </label>
        <input
          type="text"
          name="featuredProductsTitle"
          value={formData.featuredProductsTitle}
          onChange={handleInputChange}
          placeholder="المنتجات المميزة"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
        />
      </div>

      {/* Section Subtitle */}
      <div className="space-y-2">
        <label className="flex items-center text-sm font-medium text-gray-700">
          <Type className="w-4 h-4 ml-2" />
          العنوان الفرعي
        </label>
        <input
          type="text"
          name="featuredProductsSubtitle"
          value={formData.featuredProductsSubtitle}
          onChange={handleInputChange}
          placeholder="اكتشف مجموعتنا المختارة من المنتجات المميزة"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
        />
      </div>

      {/* Products Limit */}
      <div className="space-y-2">
        <label className="flex items-center text-sm font-medium text-gray-700">
          <Hash className="w-4 h-4 ml-2" />
          عدد المنتجات المعروضة
        </label>
        <input
          type="number"
          name="featuredProductsLimit"
          value={formData.featuredProductsLimit}
          onChange={handleInputChange}
          min="1"
          max="20"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
        />
        <p className="text-xs text-gray-500">عدد المنتجات المميزة التي ستظهر في الصفحة الرئيسية (1-20)</p>
      </div>

      {/* Save Button */}
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

export default FeaturedProductsEditor;
