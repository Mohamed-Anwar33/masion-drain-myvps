import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Eye, EyeOff, Type } from 'lucide-react';
import { useHomePageSection } from '../../../hooks/useHomePage';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const NewsletterEditor: React.FC = () => {
  const { data, loading, updateSection } = useHomePageSection('newsletter');
  const [formData, setFormData] = useState({
    newsletterTitle: '',
    newsletterDescription: '',
    newsletterButtonText: '',
    showNewsletter: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setFormData({
        newsletterTitle: data.newsletterTitle || '',
        newsletterDescription: data.newsletterDescription || '',
        newsletterButtonText: data.newsletterButtonText || '',
        showNewsletter: data.showNewsletter ?? true
      });
    }
  }, [data]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateSection(formData);
    } catch (error) {
      console.error('Error saving newsletter section:', error);
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
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center">
          {formData.showNewsletter ? (
            <Eye className="w-5 h-5 text-green-500 ml-2" />
          ) : (
            <EyeOff className="w-5 h-5 text-gray-400 ml-2" />
          )}
          <span className="font-medium text-gray-900">عرض قسم النشرة الإخبارية</span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            name="showNewsletter"
            checked={formData.showNewsletter}
            onChange={handleInputChange}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
        </label>
      </div>

      <div className="space-y-2">
        <label className="flex items-center text-sm font-medium text-gray-700">
          <Type className="w-4 h-4 ml-2" />
          عنوان القسم
        </label>
        <input
          type="text"
          name="newsletterTitle"
          value={formData.newsletterTitle}
          onChange={handleInputChange}
          placeholder="ابق على اطلاع"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
        />
      </div>

      <div className="space-y-2">
        <label className="flex items-center text-sm font-medium text-gray-700">
          <Type className="w-4 h-4 ml-2" />
          وصف القسم
        </label>
        <textarea
          name="newsletterDescription"
          value={formData.newsletterDescription}
          onChange={handleInputChange}
          placeholder="اشترك في نشرتنا الإخبارية للحصول على آخر التحديثات والعروض الحصرية"
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
        />
      </div>

      <div className="space-y-2">
        <label className="flex items-center text-sm font-medium text-gray-700">
          <Type className="w-4 h-4 ml-2" />
          نص زر الاشتراك
        </label>
        <input
          type="text"
          name="newsletterButtonText"
          value={formData.newsletterButtonText}
          onChange={handleInputChange}
          placeholder="اشترك"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
        />
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

export default NewsletterEditor;
