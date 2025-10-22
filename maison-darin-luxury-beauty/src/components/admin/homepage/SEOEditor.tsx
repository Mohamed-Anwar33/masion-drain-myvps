import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Search, Type, FileText } from 'lucide-react';
import { useHomePageSection } from '../../../hooks/useHomePage';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const SEOEditor: React.FC = () => {
  const { data, loading, updateSection } = useHomePageSection('seo');
  const [formData, setFormData] = useState({
    seoTitle: '',
    seoDescription: '',
    seoKeywords: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setFormData({
        seoTitle: data.seoTitle || '',
        seoDescription: data.seoDescription || '',
        seoKeywords: data.seoKeywords || ''
      });
    }
  }, [data]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateSection(formData);
    } catch (error) {
      console.error('Error saving SEO section:', error);
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
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-green-900 mb-2">إعدادات تحسين محركات البحث (SEO)</h3>
        <p className="text-green-700 text-sm">
          هذه الإعدادات تساعد في تحسين ظهور موقعك في نتائج البحث على جوجل ومحركات البحث الأخرى.
        </p>
      </div>

      <div className="space-y-2">
        <label className="flex items-center text-sm font-medium text-gray-700">
          <Type className="w-4 h-4 ml-2" />
          عنوان الصفحة (Title Tag)
        </label>
        <input
          type="text"
          name="seoTitle"
          value={formData.seoTitle}
          onChange={handleInputChange}
          placeholder="ميزون دارين - منتجات التجميل والعطور الفاخرة"
          maxLength={60}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>العنوان الذي سيظهر في نتائج البحث</span>
          <span className={formData.seoTitle.length > 60 ? 'text-red-500' : ''}>
            {formData.seoTitle.length}/60
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center text-sm font-medium text-gray-700">
          <FileText className="w-4 h-4 ml-2" />
          وصف الصفحة (Meta Description)
        </label>
        <textarea
          name="seoDescription"
          value={formData.seoDescription}
          onChange={handleInputChange}
          placeholder="اكتشف مجموعة منتجات التجميل والعطور الفاخرة في ميزون دارين. تسوق أفضل الماركات العالمية بأعلى معايير الجودة."
          maxLength={160}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>الوصف الذي سيظهر تحت العنوان في نتائج البحث</span>
          <span className={formData.seoDescription.length > 160 ? 'text-red-500' : ''}>
            {formData.seoDescription.length}/160
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center text-sm font-medium text-gray-700">
          <Search className="w-4 h-4 ml-2" />
          الكلمات المفتاحية (Keywords)
        </label>
        <textarea
          name="seoKeywords"
          value={formData.seoKeywords}
          onChange={handleInputChange}
          placeholder="منتجات التجميل، العطور الفاخرة، مستحضرات التجميل، عطور نسائية، عطور رجالية، ميزون دارين"
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
        />
        <p className="text-xs text-gray-500">
          اكتب الكلمات المفتاحية مفصولة بفواصل. هذه الكلمات تساعد محركات البحث في فهم محتوى موقعك.
        </p>
      </div>

      {/* SEO Preview */}
      <div className="border-t pt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">معاينة نتيجة البحث</h3>
        <div className="bg-white border rounded-lg p-4 max-w-2xl">
          <div className="space-y-1">
            <h4 className="text-blue-600 text-lg hover:underline cursor-pointer">
              {formData.seoTitle || 'ميزون دارين - منتجات التجميل والعطور الفاخرة'}
            </h4>
            <div className="text-green-700 text-sm">
              https://maisondarin.com
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              {formData.seoDescription || 'اكتشف مجموعة منتجات التجميل والعطور الفاخرة في ميزون دارين. تسوق أفضل الماركات العالمية بأعلى معايير الجودة.'}
            </p>
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

export default SEOEditor;
