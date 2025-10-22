import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Mail, AlertCircle } from 'lucide-react';
import { useHomePageSection } from '../../../hooks/useHomePage';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const EmailSettingsEditor: React.FC = () => {
  const { data, loading, updateSection } = useHomePageSection('email');
  const [formData, setFormData] = useState({
    contactFormEmail: '',
    newsletterEmail: '',
    orderNotificationEmail: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setFormData({
        contactFormEmail: data.contactFormEmail || '',
        newsletterEmail: data.newsletterEmail || '',
        orderNotificationEmail: data.orderNotificationEmail || ''
      });
    }
  }, [data]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      console.error('Error saving email settings:', error);
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

  const emailSettings = [
    {
      key: 'contactFormEmail',
      label: 'بريد نموذج التواصل',
      description: 'البريد الإلكتروني الذي ستصل إليه رسائل نموذج التواصل',
      placeholder: 'contact@maisondarin.com'
    },
    {
      key: 'newsletterEmail',
      label: 'بريد النشرة الإخبارية',
      description: 'البريد الإلكتروني لإدارة اشتراكات النشرة الإخبارية',
      placeholder: 'newsletter@maisondarin.com'
    },
    {
      key: 'orderNotificationEmail',
      label: 'بريد إشعارات الطلبات',
      description: 'البريد الإلكتروني الذي ستصل إليه إشعارات الطلبات الجديدة',
      placeholder: 'orders@maisondarin.com'
    }
  ];

  return (
    <div className="space-y-8" dir="rtl">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 ml-2" />
          <div>
            <h3 className="text-lg font-semibold text-amber-900 mb-2">إعدادات البريد الإلكتروني</h3>
            <p className="text-amber-700 text-sm">
              تأكد من صحة عناوين البريد الإلكتروني. هذه العناوين ستستخدم لاستقبال الرسائل والإشعارات من الموقع.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {emailSettings.map((setting) => (
          <div key={setting.key} className="space-y-2">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <Mail className="w-4 h-4 ml-2" />
              {setting.label}
            </label>
            <input
              type="email"
              name={setting.key}
              value={formData[setting.key as keyof typeof formData]}
              onChange={handleInputChange}
              placeholder={setting.placeholder}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
            <p className="text-xs text-gray-500">{setting.description}</p>
          </div>
        ))}
      </div>

      {/* Email Test Section */}
      <div className="border-t pt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">اختبار إعدادات البريد</h3>
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {emailSettings.map((setting) => {
              const email = formData[setting.key as keyof typeof formData];
              return (
                <div key={setting.key} className="bg-white rounded-lg p-4 border">
                  <div className="flex items-center mb-2">
                    <Mail className="w-4 h-4 text-gray-400 ml-2" />
                    <span className="text-sm font-medium text-gray-900">{setting.label}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {email || 'لم يتم تحديد بريد إلكتروني'}
                  </div>
                  {email && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        ✓ صالح
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
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

export default EmailSettingsEditor;
