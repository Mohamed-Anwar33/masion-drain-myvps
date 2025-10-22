import React, { useState, useEffect } from 'react';
import { CreditCard, Save, TestTube, Eye, EyeOff } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { LuxuryNotification } from '@/components/ui/LuxuryNotification';

interface PayPalConfig {
  enabled: boolean;
  clientId: string;
  clientSecret: string;
  webhookId: string;
}

const PayPalSettingsFixed: React.FC = () => {
  const [config, setConfig] = useState<PayPalConfig>({
    enabled: false,
    clientId: '',
    clientSecret: '',
    webhookId: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  
  const { showSaveSuccess, showSaveError, showUploadError, notifications } = useNotifications();

  // Load current settings
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      
      if (!token) {
        console.warn('No auth token found');
        setLoading(false);
        return;
      }

      console.log('Loading PayPal settings...');
      const response = await fetch('/api/paypal/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Load response status:', response.status);

      if (response.ok) {
        const responseText = await response.text();
        console.log('Load response text:', responseText);
        
        if (responseText) {
          try {
            const data = JSON.parse(responseText);
            if (data.paypalSettings) {
              setConfig({
                enabled: data.paypalSettings.enabled || false,
                clientId: data.paypalSettings.clientId || '',
                clientSecret: data.paypalSettings.clientSecret || '',
                webhookId: data.paypalSettings.webhookId || ''
              });
              console.log('PayPal settings loaded successfully');
            }
          } catch (parseError) {
            console.warn('Response is not valid JSON:', responseText);
          }
        }
      } else {
        const responseText = await response.text();
        console.error('Load failed:', response.status, responseText);
        
        if (response.status === 404) {
          showUploadError('PayPal API غير متاح - تأكد من تشغيل الباك إند');
        } else if (responseText.includes('<!DOCTYPE')) {
          showUploadError('الباك إند يعيد صفحة HTML - تأكد من المسار الصحيح');
        }
      }
    } catch (error) {
      console.error('Error loading PayPal settings:', error);
      if (error.message.includes('Failed to fetch')) {
        showUploadError('فشل في الاتصال بالخادم - تأكد من تشغيل الباك إند على البورت 5000');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      
      if (!token) {
        showSaveError('يجب تسجيل الدخول أولاً');
        setSaving(false);
        return;
      }

      console.log('Saving PayPal config:', config);
      console.log('Using token:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');

      const response = await fetch('/api/paypal/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (response.ok) {
        // Try to parse JSON, but handle cases where response might be empty
        let responseData = null;
        const responseText = await response.text();
        
        if (responseText) {
          try {
            responseData = JSON.parse(responseText);
          } catch (parseError) {
            console.warn('Response is not valid JSON:', responseText);
          }
        }
        
        showSaveSuccess();
        console.log('Save successful:', responseData);
      } else {
        // Handle error responses
        const responseText = await response.text();
        console.log('Error response text:', responseText);
        
        let errorMessage = 'فشل في حفظ الإعدادات';
        
        if (response.status === 404) {
          errorMessage = 'PayPal API غير موجود - تأكد من تشغيل الباك إند الصحيح';
        } else if (response.status === 401) {
          errorMessage = 'غير مصرح - يجب تسجيل الدخول مرة أخرى';
        } else if (response.status === 403) {
          errorMessage = 'ممنوع - أنت لست مديراً';
        } else {
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorMessage;
          } catch (parseError) {
            // If response is HTML or not JSON
            if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
              errorMessage = 'الباك إند يعيد HTML - تأكد من المسار الصحيح';
            } else {
              errorMessage = `خطأ ${response.status}: ${responseText || 'استجابة غير صحيحة'}`;
            }
          }
        }
        
        showSaveError();
        console.error('Save failed:', response.status, responseText);
      }
    } catch (error) {
      console.error('Error saving PayPal settings:', error);
      
      if (error.message.includes('Failed to fetch')) {
        showSaveError();
      } else {
        showSaveError();
      }
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    if (!config.clientId || !config.clientSecret) {
      showUploadError('يرجى إدخال Client ID و Client Secret أولاً');
      return;
    }

    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      
      if (!token) {
        showUploadError('يجب تسجيل الدخول أولاً');
        return;
      }

      const response = await fetch('/api/paypal/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          showSaveSuccess();
        } else {
          showUploadError('فشل اختبار الاتصال');
        }
      } else {
        showUploadError('فشل اختبار الاتصال - تأكد من الإعدادات');
      }
    } catch (error) {
      console.error('Test connection error:', error);
      showUploadError('فشل في اختبار الاتصال - تأكد من تشغيل الباك إند');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-off-white">
            إعدادات PayPal - مبسط
          </h2>
          <p className="text-beige/80 mt-2">
            3 حقول فقط: Client ID, Secret, Webhook
          </p>
        </div>
        <CreditCard className="w-8 h-8 text-gold" />
      </div>

      <div className="bg-dark-brown/50 rounded-lg border border-gold/20 p-6">
        <div className="space-y-6">
          {/* Enable PayPal */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="paypal-enabled"
              checked={config.enabled}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              className="w-4 h-4 text-gold bg-transparent border-gold rounded focus:ring-gold"
            />
            <label htmlFor="paypal-enabled" className="text-off-white font-medium">
              تفعيل PayPal
            </label>
          </div>

          {/* Client ID */}
          <div>
            <label className="block text-beige/80 font-medium mb-2">
              Client ID <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={config.clientId}
              onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
              placeholder="أدخل PayPal Client ID"
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Client Secret */}
          <div>
            <label className="block text-beige/80 font-medium mb-2">
              Client Secret <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showSecret ? "text" : "password"}
                value={config.clientSecret}
                onChange={(e) => setConfig({ ...config, clientSecret: e.target.value })}
                placeholder="أدخل PayPal Client Secret"
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 pr-12 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-beige/60 hover:text-gold"
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Webhook ID */}
          <div>
            <label className="block text-beige/80 font-medium mb-2">
              Webhook ID (اختياري)
            </label>
            <input
              type="text"
              value={config.webhookId}
              onChange={(e) => setConfig({ ...config, webhookId: e.target.value })}
              placeholder="أدخل PayPal Webhook ID"
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Instructions */}
          <div className="bg-gold/10 border border-gold/20 rounded-lg p-4">
          <h3 className="text-gold font-semibold mb-2">خطوات سريعة:</h3>
          <ol className="text-beige/80 text-sm space-y-1 list-decimal list-inside">
            <li>تأكد من تشغيل الباك إند على البورت 5000</li>
            <li>اذهب إلى <a href="https://developer.paypal.com" target="_blank" className="text-gold hover:underline">PayPal Developer</a></li>
            <li>أنشئ App جديد</li>
            <li>انسخ Client ID و Secret</li>
            <li>احفظ هنا واختبر</li>
          </ol>
          
          <div className="mt-3 p-2 bg-dark-brown/30 rounded text-xs">
            <p className="text-beige/60">💡 نصيحة: ستظهر رسالة نجاح أو فشل في الزاوية العلوية اليمنى عند الحفظ</p>
            <p className="text-beige/60 mt-1">🔧 للتشخيص: افتح Developer Tools (F12)</p>
          </div>
        </div>

          {/* Status */}
          <div className={`p-4 rounded-lg border ${config.enabled 
            ? 'bg-green-900/20 border-green-400/20 text-green-400' 
            : 'bg-gray-800/20 border-gray-600/20 text-gray-400'
            }`}>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${config.enabled ? 'bg-green-400' : 'bg-gray-400'}`}></div>
              <span className="font-medium">
                PayPal: {config.enabled ? 'مفعل' : 'غير مفعل'}
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-gold hover:bg-gold/90 disabled:bg-gold/50 text-dark-brown font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
              {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </button>

            <button
              onClick={testConnection}
              disabled={saving || !config.enabled}
              className="flex items-center gap-2 bg-transparent border border-gold text-gold hover:bg-gold hover:text-dark-brown disabled:opacity-50 font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              <TestTube className="w-4 h-4" />
              اختبار
            </button>
          </div>
        </div>
      </div>

      {/* إضافة الإشعارات */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <LuxuryNotification key={notification.id} {...notification} />
        ))}
      </div>
    </div>
  );
};

export default PayPalSettingsFixed;
