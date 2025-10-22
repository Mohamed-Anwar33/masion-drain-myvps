import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Upload, Eye, EyeOff, Link, Type, Image as ImageIcon } from 'lucide-react';
import { useHomePageSection } from '../../../hooks/useHomePage';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const HeroSectionEditor: React.FC = () => {
  const { data, loading, updateSection } = useHomePageSection('hero');
  const [formData, setFormData] = useState({
    heroTitle: '',
    heroSubtitle: '',
    heroButtonText: '',
    heroButtonLink: '',
    heroBackgroundImage: '',
    showHeroSection: true
  });
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    if (data && !loading) {
      setFormData({
        heroTitle: data.heroTitle || '',
        heroSubtitle: data.heroSubtitle || '',
        heroButtonText: data.heroButtonText || '',
        heroButtonLink: data.heroButtonLink || '',
        heroBackgroundImage: data.heroBackgroundImage || '',
        showHeroSection: data.showHeroSection ?? true
      });
      setImagePreview(data.heroBackgroundImage || '');
    }
  }, [data, loading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData(prev => ({ ...prev, heroBackgroundImage: url }));
    setImagePreview(url);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateSection(formData);
    } catch (error) {
      console.error('Error saving hero section:', error);
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
          {formData.showHeroSection ? (
            <Eye className="w-5 h-5 text-green-500 ml-2" />
          ) : (
            <EyeOff className="w-5 h-5 text-gray-400 ml-2" />
          )}
          <span className="font-medium text-gray-900">عرض القسم الرئيسي</span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            name="showHeroSection"
            checked={formData.showHeroSection}
            onChange={handleInputChange}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
        </label>
      </div>

      {/* Hero Title */}
      <div className="space-y-2">
        <label className="flex items-center text-sm font-medium text-gray-700">
          <Type className="w-4 h-4 ml-2" />
          العنوان الرئيسي
        </label>
        <input
          type="text"
          name="heroTitle"
          value={formData.heroTitle}
          onChange={handleInputChange}
          placeholder="أدخل العنوان الرئيسي للصفحة"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
        />
        <p className="text-xs text-gray-500">العنوان الذي سيظهر في أعلى الصفحة الرئيسية</p>
      </div>

      {/* Hero Subtitle */}
      <div className="space-y-2">
        <label className="flex items-center text-sm font-medium text-gray-700">
          <Type className="w-4 h-4 ml-2" />
          العنوان الفرعي
        </label>
        <textarea
          name="heroSubtitle"
          value={formData.heroSubtitle}
          onChange={handleInputChange}
          placeholder="أدخل الوصف أو العنوان الفرعي"
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
        />
        <p className="text-xs text-gray-500">وصف مختصر يظهر تحت العنوان الرئيسي</p>
      </div>

      {/* Button Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <Type className="w-4 h-4 ml-2" />
            نص الزر
          </label>
          <input
            type="text"
            name="heroButtonText"
            value={formData.heroButtonText}
            onChange={handleInputChange}
            placeholder="تسوق الآن"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <Link className="w-4 h-4 ml-2" />
            رابط الزر
          </label>
          <input
            type="url"
            name="heroButtonLink"
            value={formData.heroButtonLink}
            onChange={handleInputChange}
            placeholder="/products"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Background Image */}
      <div className="space-y-4">
        <label className="flex items-center text-sm font-medium text-gray-700">
          <ImageIcon className="w-4 h-4 ml-2" />
          صورة الخلفية
        </label>
        
        <div className="space-y-4">
          <input
            type="url"
            name="heroBackgroundImage"
            value={formData.heroBackgroundImage}
            onChange={handleImageUrlChange}
            placeholder="https://example.com/image.jpg"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
          
          {imagePreview && (
            <div className="relative">
              <img
                src={imagePreview}
                alt="معاينة صورة الخلفية"
                className="w-full h-48 object-cover rounded-lg border"
                onError={() => setImagePreview('')}
              />
              <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                <div className="bg-white/90 px-4 py-2 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">معاينة صورة الخلفية</p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <p className="text-xs text-gray-500">
          أدخل رابط الصورة التي تريد استخدامها كخلفية للقسم الرئيسي
        </p>
      </div>

      {/* Preview Section */}
      {formData.showHeroSection && (
        <div className="border-t pt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">معاينة القسم</h3>
          <div 
            className="relative bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-8 md:p-12 text-center overflow-hidden"
            style={{
              backgroundImage: imagePreview ? `url(${imagePreview})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {imagePreview && (
              <div className="absolute inset-0 bg-black/30 rounded-xl"></div>
            )}
            <div className="relative z-10">
              <h1 className={`text-3xl md:text-4xl font-bold mb-4 ${
                imagePreview ? 'text-white' : 'text-gray-900'
              }`}>
                {formData.heroTitle || 'العنوان الرئيسي'}
              </h1>
              <p className={`text-lg mb-8 max-w-2xl mx-auto ${
                imagePreview ? 'text-white/90' : 'text-gray-600'
              }`}>
                {formData.heroSubtitle || 'الوصف الفرعي للصفحة الرئيسية'}
              </p>
              {formData.heroButtonText && (
                <button className="bg-primary text-white px-8 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors">
                  {formData.heroButtonText}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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

export default HeroSectionEditor;
