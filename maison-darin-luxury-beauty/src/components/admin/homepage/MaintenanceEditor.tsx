import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, AlertTriangle, Wrench, Eye, EyeOff } from 'lucide-react';
import { useHomePageSection } from '../../../hooks/useHomePage';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const MaintenanceEditor: React.FC = () => {
  const { data, loading, updateSection } = useHomePageSection('maintenance');
  const [formData, setFormData] = useState({
    maintenanceMode: false,
    maintenanceMessage: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setFormData({
        maintenanceMode: data.maintenanceMode ?? false,
        maintenanceMessage: data.maintenanceMessage || ''
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
      console.error('Error saving maintenance settings:', error);
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
      <div className={`border rounded-lg p-4 ${
        formData.maintenanceMode 
          ? 'bg-red-50 border-red-200' 
          : 'bg-green-50 border-green-200'
      }`}>
        <div className="flex items-start">
          {formData.maintenanceMode ? (
            <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5 ml-2" />
          ) : (
            <Eye className="w-6 h-6 text-green-600 mt-0.5 ml-2" />
          )}
          <div>
            <h3 className={`text-lg font-semibold mb-2 ${
              formData.maintenanceMode ? 'text-red-900' : 'text-green-900'
            }`}>
              {formData.maintenanceMode ? 'وضع الصيانة مفعل' : 'الموقع يعمل بشكل طبيعي'}
            </h3>
            <p className={`text-sm ${
              formData.maintenanceMode ? 'text-red-700' : 'text-green-700'
            }`}>
              {formData.maintenanceMode 
                ? 'الموقع حالياً في وضع الصيانة. الزوار سيرون رسالة الصيانة بدلاً من المحتوى العادي.'
                : 'الموقع متاح للزوار ويعمل بشكل طبيعي.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Maintenance Mode Toggle */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Wrench className="w-5 h-5 text-gray-600 ml-3" />
            <div>
              <h4 className="font-semibold text-gray-900">تفعيل وضع الصيانة</h4>
              <p className="text-sm text-gray-600">
                عند التفعيل، سيرى الزوار رسالة الصيانة بدلاً من محتوى الموقع
              </p>
            </div>
          </div>
          
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              name="maintenanceMode"
              checked={formData.maintenanceMode}
              onChange={handleInputChange}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
          </label>
        </div>
      </div>

      {/* Maintenance Message */}
      <div className="space-y-2">
        <label className="flex items-center text-sm font-medium text-gray-700">
          <AlertTriangle className="w-4 h-4 ml-2" />
          رسالة الصيانة
        </label>
        <textarea
          name="maintenanceMessage"
          value={formData.maintenanceMessage}
          onChange={handleInputChange}
          placeholder="نحن نقوم حالياً بأعمال صيانة لتحسين تجربتكم. يرجى المحاولة مرة أخرى قريباً!"
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
        />
        <p className="text-xs text-gray-500">
          الرسالة التي سيراها الزوار عند تفعيل وضع الصيانة
        </p>
      </div>

      {/* Preview */}
      {formData.maintenanceMode && (
        <div className="border-t pt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">معاينة صفحة الصيانة</h3>
          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <div className="max-w-md mx-auto">
              <Wrench className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">الموقع تحت الصيانة</h2>
              <p className="text-gray-600 mb-6">
                {formData.maintenanceMessage || 'نحن نقوم حالياً بأعمال صيانة لتحسين تجربتكم. يرجى المحاولة مرة أخرى قريباً!'}
              </p>
              <div className="text-sm text-gray-500">
                شكراً لصبركم وتفهمكم
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warning */}
      {formData.maintenanceMode && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 ml-2" />
            <div>
              <h4 className="font-semibold text-yellow-900 mb-1">تحذير مهم</h4>
              <p className="text-yellow-700 text-sm">
                عند تفعيل وضع الصيانة، لن يتمكن الزوار من الوصول إلى الموقع أو إجراء أي عمليات شراء. 
                تأكد من إلغاء تفعيل هذا الوضع بمجرد انتهاء أعمال الصيانة.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-6 border-t">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            formData.maintenanceMode
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-primary text-white hover:bg-primary/90'
          }`}
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

export default MaintenanceEditor;
