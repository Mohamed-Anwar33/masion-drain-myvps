import React, { useState, useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { Eye, EyeOff, Save, TestTube, CreditCard } from 'lucide-react';

interface PayPalConfig {
  enabled: boolean;
  mode: 'sandbox' | 'production';
  clientId: string;
  clientSecret: string;
  webhookId?: string;
  currency: string;
  brandName: string;
  locale: string;
  landingPage: 'LOGIN' | 'BILLING' | 'NO_PREFERENCE';
  userAction: 'continue' | 'pay_now';
  returnUrl: string;
  cancelUrl: string;
  enableShipping: boolean;
  enableTax: boolean;
  merchantId?: string;
  testMode?: boolean;
}

const PayPalSettings: React.FC = () => {
  const [config, setConfig] = useState<PayPalConfig>({
    enabled: false,
    mode: 'production',
    clientId: '',
    clientSecret: '',
    webhookId: '',
    currency: 'USD',
    brandName: 'Maison Darin',
    locale: 'en_US',
    landingPage: 'NO_PREFERENCE',
    userAction: 'pay_now',
    returnUrl: '',
    cancelUrl: '',
    enableShipping: false,
    enableTax: true,
    merchantId: '',
    testMode: false
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  
  const { showSaveSuccess, showSaveError, showInfo } = useNotifications();

  useEffect(() => {
    fetchPayPalSettings();
  }, []);

  const fetchPayPalSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/paypal/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setConfig({
          ...config,
          ...data,
          // Set default URLs if not provided
          returnUrl: data.returnUrl || `${window.location.origin}/checkout/success`,
          cancelUrl: data.cancelUrl || `${window.location.origin}/checkout/cancel`
        });
      }
    } catch (error) {
      console.error('Error fetching PayPal settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/paypal/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        showSaveSuccess();
      } else {
        showSaveError('فشل في حفظ إعدادات PayPal');
      }
    } catch (error) {
      console.error('Error saving PayPal settings:', error);
      showSaveError('فشل في حفظ إعدادات PayPal');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      const response = await fetch('/api/paypal/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        showInfo('اختبار PayPal', 'تم اختبار الاتصال بـ PayPal بنجاح');
      } else {
        showSaveError('فشل في اختبار الاتصال بـ PayPal');
      }
    } catch (error) {
      console.error('Error testing PayPal:', error);
      showSaveError('فشل في اختبار الاتصال بـ PayPal');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-off-white">
            إعدادات PayPal
          </h1>
          <p className="text-beige/80 mt-2">
            إدارة إعدادات الدفع عبر PayPal
          </p>
        </div>
        <CreditCard className="w-8 h-8 text-gold" />
      </div>

      <div className="bg-dark-brown/50 rounded-lg border border-gold/20 p-6">
        <div className="space-y-6">
          {/* Enable/Disable PayPal */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-off-white font-medium">
                تفعيل PayPal
              </label>
              <p className="text-beige/60 text-sm">
                السماح للعملاء بالدفع عبر PayPal
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold"></div>
            </label>
          </div>

          {/* Mode Selection */}
          <div>
            <label className="block text-off-white font-medium mb-2">
              وضع التشغيل
            </label>
            <div className="flex space-x-4 space-x-reverse">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="sandbox"
                  checked={config.mode === 'sandbox'}
                  onChange={(e) => setConfig(prev => ({ ...prev, mode: e.target.value as 'sandbox' | 'production' }))}
                  className="ml-2 text-gold"
                />
                <span className="text-beige/80">تجريبي (Sandbox)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="production"
                  checked={config.mode === 'production'}
                  onChange={(e) => setConfig(prev => ({ ...prev, mode: e.target.value as 'sandbox' | 'production' }))}
                  className="ml-2 text-gold"
                />
                <span className="text-beige/80">إنتاج (Production)</span>
              </label>
            </div>
          </div>

          {/* Client ID */}
          <div>
            <label className="block text-off-white font-medium mb-2">
              Client ID
            </label>
            <input
              type="text"
              value={config.clientId}
              onChange={(e) => setConfig(prev => ({ ...prev, clientId: e.target.value }))}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-blue-500"
              placeholder="أدخل PayPal Client ID"
            />
          </div>

          {/* Client Secret */}
          <div>
            <label className="block text-off-white font-medium mb-2">
              Client Secret
            </label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                value={config.clientSecret}
                onChange={(e) => setConfig(prev => ({ ...prev, clientSecret: e.target.value }))}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-blue-500 pl-12"
                placeholder="أدخل PayPal Client Secret"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-beige/60 hover:text-gold"
              >
                {showSecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Webhook ID */}
          <div>
            <label className="block text-off-white font-medium mb-2">
              Webhook ID (اختياري)
            </label>
            <input
              type="text"
              value={config.webhookId}
              onChange={(e) => setConfig(prev => ({ ...prev, webhookId: e.target.value }))}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-blue-500"
              placeholder="أدخل PayPal Webhook ID"
            />
          </div>

          {/* Currency */}
          <div>
            <label className="block text-off-white font-medium mb-2">
              العملة
            </label>
            <select
              value={config.currency}
              onChange={(e) => setConfig(prev => ({ ...prev, currency: e.target.value }))}
              className="w-full bg-dark-brown border border-gold/20 rounded-lg px-4 py-2 text-off-white focus:outline-none focus:border-gold"
            >
              <option value="USD">دولار أمريكي (USD)</option>
              <option value="EUR">يورو (EUR)</option>
              <option value="SAR">ريال سعودي (SAR)</option>
              <option value="AED">درهم إماراتي (AED)</option>
              <option value="EGP">جنيه مصري (EGP)</option>
            </select>
          </div>

          {/* Brand Name */}
          <div>
            <label className="block text-off-white font-medium mb-2">
              اسم العلامة التجارية
            </label>
            <input
              type="text"
              value={config.brandName}
              onChange={(e) => setConfig(prev => ({ ...prev, brandName: e.target.value }))}
              className="w-full bg-dark-brown border border-gold/20 rounded-lg px-4 py-2 text-off-white focus:outline-none focus:border-gold"
              placeholder="اسم متجرك في PayPal"
            />
          </div>

          {/* Merchant ID */}
          <div>
            <label className="block text-off-white font-medium mb-2">
              Merchant ID (اختياري)
            </label>
            <input
              type="text"
              value={config.merchantId || ''}
              onChange={(e) => setConfig(prev => ({ ...prev, merchantId: e.target.value }))}
              className="w-full bg-dark-brown border border-gold/20 rounded-lg px-4 py-2 text-off-white focus:outline-none focus:border-gold"
              placeholder="PayPal Merchant ID"
            />
          </div>

          {/* Locale */}
          <div>
            <label className="block text-off-white font-medium mb-2">
              اللغة والمنطقة
            </label>
            <select
              value={config.locale}
              onChange={(e) => setConfig(prev => ({ ...prev, locale: e.target.value }))}
              className="w-full bg-dark-brown border border-gold/20 rounded-lg px-4 py-2 text-off-white focus:outline-none focus:border-gold"
            >
              <option value="en_US">English (US)</option>
              <option value="ar_SA">العربية (السعودية)</option>
              <option value="ar_AE">العربية (الإمارات)</option>
              <option value="ar_EG">العربية (مصر)</option>
              <option value="fr_FR">Français (France)</option>
              <option value="de_DE">Deutsch (Germany)</option>
            </select>
          </div>

          {/* Landing Page */}
          <div>
            <label className="block text-off-white font-medium mb-2">
              صفحة الوصول
            </label>
            <select
              value={config.landingPage}
              onChange={(e) => setConfig(prev => ({ ...prev, landingPage: e.target.value as any }))}
              className="w-full bg-dark-brown border border-gold/20 rounded-lg px-4 py-2 text-off-white focus:outline-none focus:border-gold"
            >
              <option value="NO_PREFERENCE">بدون تفضيل</option>
              <option value="LOGIN">صفحة تسجيل الدخول</option>
              <option value="BILLING">صفحة الفواتير</option>
            </select>
          </div>

          {/* User Action */}
          <div>
            <label className="block text-off-white font-medium mb-2">
              إجراء المستخدم
            </label>
            <select
              value={config.userAction}
              onChange={(e) => setConfig(prev => ({ ...prev, userAction: e.target.value as any }))}
              className="w-full bg-dark-brown border border-gold/20 rounded-lg px-4 py-2 text-off-white focus:outline-none focus:border-gold"
            >
              <option value="pay_now">ادفع الآن</option>
              <option value="continue">متابعة</option>
            </select>
          </div>

          {/* Return URL */}
          <div>
            <label className="block text-off-white font-medium mb-2">
              رابط العودة عند النجاح
            </label>
            <input
              type="url"
              value={config.returnUrl}
              onChange={(e) => setConfig(prev => ({ ...prev, returnUrl: e.target.value }))}
              className="w-full bg-dark-brown border border-gold/20 rounded-lg px-4 py-2 text-off-white focus:outline-none focus:border-gold"
              placeholder="https://yoursite.com/payment/success"
            />
          </div>

          {/* Cancel URL */}
          <div>
            <label className="block text-off-white font-medium mb-2">
              رابط العودة عند الإلغاء
            </label>
            <input
              type="url"
              value={config.cancelUrl}
              onChange={(e) => setConfig(prev => ({ ...prev, cancelUrl: e.target.value }))}
              className="w-full bg-dark-brown border border-gold/20 rounded-lg px-4 py-2 text-off-white focus:outline-none focus:border-gold"
              placeholder="https://yoursite.com/payment/cancel"
            />
          </div>

          {/* Additional Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Enable Shipping */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-off-white font-medium">
                  تفعيل الشحن
                </label>
                <p className="text-beige/60 text-sm">
                  طلب عنوان الشحن من العميل
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enableShipping}
                  onChange={(e) => setConfig(prev => ({ ...prev, enableShipping: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold"></div>
              </label>
            </div>

            {/* Enable Tax */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-off-white font-medium">
                  تفعيل الضريبة
                </label>
                <p className="text-beige/60 text-sm">
                  إضافة الضريبة للمدفوعات
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enableTax}
                  onChange={(e) => setConfig(prev => ({ ...prev, enableTax: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold"></div>
              </label>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-gold/10 border border-gold/20 rounded-lg p-4">
            <h3 className="text-gold font-semibold mb-2">تعليمات الإعداد:</h3>
            <ul className="text-beige/80 text-sm space-y-1">
              <li>• قم بإنشاء حساب PayPal Developer على developer.paypal.com</li>
              <li>• أنشئ تطبيق جديد واحصل على Client ID و Client Secret</li>
              <li>• استخدم وضع Sandbox للاختبار و Production للتشغيل الفعلي</li>
              <li>• تأكد من تفعيل العملة المطلوبة في حساب PayPal</li>
              <li>• استخدم صفحة "اختبار PayPal" لفحص التكامل بعد الحفظ</li>
            </ul>
          </div>

          {/* Status Indicator */}
          <div className={`p-4 rounded-lg border ${config.enabled 
            ? 'bg-green-900/20 border-green-400/20 text-green-400' 
            : 'bg-gray-800/20 border-gray-600/20 text-gray-400'
          }`}>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${config.enabled ? 'bg-green-400' : 'bg-gray-400'}`}></div>
              <span className="font-medium">
                حالة PayPal: {config.enabled ? 'مفعل' : 'غير مفعل'}
              </span>
            </div>
            {config.enabled && (
              <div className="mt-2 text-sm">
                <p>البيئة: {config.mode === 'sandbox' ? 'تجريبي' : 'إنتاج'}</p>
                <p>العملة: {config.currency}</p>
                <p>اللغة: {config.locale}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-gold hover:bg-gold/90 disabled:bg-gold/50 text-dark-brown font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </button>

            <button
              onClick={handleTest}
              disabled={testing || !config.clientId || !config.clientSecret}
              className="flex items-center gap-2 bg-transparent border border-gold text-gold hover:bg-gold hover:text-dark-brown disabled:opacity-50 font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              <TestTube className="w-4 h-4" />
              {testing ? 'جاري الاختبار...' : 'اختبار الاتصال'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayPalSettings;
