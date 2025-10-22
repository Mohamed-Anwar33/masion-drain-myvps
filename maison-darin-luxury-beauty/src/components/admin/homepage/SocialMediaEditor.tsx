import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Facebook, Instagram, Twitter, Youtube, Music } from 'lucide-react';
import { useHomePageSection } from '../../../hooks/useHomePage';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const SocialMediaEditor: React.FC = () => {
  const { data, loading, updateSection } = useHomePageSection('socialMedia');
  const [formData, setFormData] = useState({
    socialMedia: {
      facebook: '',
      instagram: '',
      twitter: '',
      youtube: '',
      tiktok: ''
    }
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setFormData({
        socialMedia: {
          facebook: data.socialMedia?.facebook || '',
          instagram: data.socialMedia?.instagram || '',
          twitter: data.socialMedia?.twitter || '',
          youtube: data.socialMedia?.youtube || '',
          tiktok: data.socialMedia?.tiktok || ''
        }
      });
    }
  }, [data]);

  const handleInputChange = (platform: string, value: string) => {
    setFormData(prev => ({
      socialMedia: {
        ...prev.socialMedia,
        [platform]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateSection(formData);
    } catch (error) {
      console.error('Error saving social media section:', error);
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

  const socialPlatforms = [
    {
      key: 'facebook',
      label: 'فيسبوك',
      icon: <Facebook className="w-5 h-5" />,
      placeholder: 'https://facebook.com/maisondarin',
      color: 'text-blue-600'
    },
    {
      key: 'instagram',
      label: 'إنستغرام',
      icon: <Instagram className="w-5 h-5" />,
      placeholder: 'https://instagram.com/maisondarin',
      color: 'text-pink-600'
    },
    {
      key: 'twitter',
      label: 'تويتر',
      icon: <Twitter className="w-5 h-5" />,
      placeholder: 'https://twitter.com/maisondarin',
      color: 'text-blue-400'
    },
    {
      key: 'youtube',
      label: 'يوتيوب',
      icon: <Youtube className="w-5 h-5" />,
      placeholder: 'https://youtube.com/@maisondarin',
      color: 'text-red-600'
    },
    {
      key: 'tiktok',
      label: 'تيك توك',
      icon: <Music className="w-5 h-5" />,
      placeholder: 'https://tiktok.com/@maisondarin',
      color: 'text-gray-900'
    }
  ];

  return (
    <div className="space-y-8" dir="rtl">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">روابط وسائل التواصل الاجتماعي</h3>
        <p className="text-blue-700 text-sm">
          أضف روابط حسابات الشركة على وسائل التواصل الاجتماعي. ستظهر هذه الروابط في أسفل الصفحة الرئيسية.
        </p>
      </div>

      <div className="space-y-6">
        {socialPlatforms.map((platform) => (
          <div key={platform.key} className="space-y-2">
            <label className={`flex items-center text-sm font-medium ${platform.color}`}>
              {platform.icon}
              <span className="mr-2">{platform.label}</span>
            </label>
            <input
              type="url"
              value={formData.socialMedia[platform.key as keyof typeof formData.socialMedia]}
              onChange={(e) => handleInputChange(platform.key, e.target.value)}
              placeholder={platform.placeholder}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>
        ))}
      </div>

      {/* Preview */}
      <div className="border-t pt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">معاينة الروابط</h3>
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex flex-wrap gap-4 justify-center">
            {socialPlatforms.map((platform) => {
              const url = formData.socialMedia[platform.key as keyof typeof formData.socialMedia];
              return url ? (
                <a
                  key={platform.key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center px-4 py-2 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow ${platform.color}`}
                >
                  {platform.icon}
                  <span className="mr-2 text-sm font-medium">{platform.label}</span>
                </a>
              ) : null;
            })}
          </div>
          {!Object.values(formData.socialMedia).some(url => url) && (
            <p className="text-center text-gray-500 text-sm">
              لم يتم إضافة أي روابط لوسائل التواصل الاجتماعي بعد
            </p>
          )}
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

export default SocialMediaEditor;
