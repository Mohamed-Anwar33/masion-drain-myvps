import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Save, 
  Mail, 
  Settings, 
  TestTube, 
  CheckCircle, 
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface EmailSettings {
  adminEmail: string;
  fromEmail: string;
  fromName: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  enableNotifications: boolean;
  enableCustomerConfirmation: boolean;
}

const EmailSettingsManager: React.FC = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<EmailSettings>({
    adminEmail: '',
    fromEmail: '',
    fromName: 'ميزون دارين - Maison Darin',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    enableNotifications: true,
    enableCustomerConfirmation: true
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/site-settings/email`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setSettings(result.data);
      } else {
        throw new Error('Failed to load settings');
      }
    } catch (error) {
      console.error('Error loading email settings:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل إعدادات البريد الإلكتروني",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof EmailSettings, value: string | number | boolean) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Validate required fields
      if (!settings.adminEmail || !settings.fromEmail || !settings.smtpUser) {
        toast({
          title: "خطأ في التحقق",
          description: "يرجى ملء جميع الحقول المطلوبة",
          variant: "destructive"
        });
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/site-settings/email`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(settings)
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "تم الحفظ بنجاح",
          description: "تم حفظ إعدادات البريد الإلكتروني بنجاح",
        });
      } else {
        throw new Error(result.error?.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving email settings:', error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ الإعدادات",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    try {
      setTesting(true);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/site-settings/email/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "تم إرسال البريد التجريبي",
          description: `تم إرسال بريد تجريبي إلى ${settings.adminEmail}`,
        });
      } else {
        throw new Error(result.error?.message || 'Failed to send test email');
      }
    } catch (error) {
      console.error('Error testing email:', error);
      toast({
        title: "فشل الاختبار",
        description: "فشل في إرسال البريد التجريبي. تأكد من صحة الإعدادات.",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Mail className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">إعدادات البريد الإلكتروني</h2>
            <p className="text-sm text-gray-500">إدارة إعدادات الإيميلات والإشعارات</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 space-x-reverse">
          <Button
            onClick={handleTestEmail}
            disabled={testing || !settings.adminEmail}
            variant="outline"
            className="flex items-center space-x-2 space-x-reverse"
          >
            <TestTube className="w-4 h-4" />
            <span>{testing ? 'جاري الاختبار...' : 'اختبار الإيميل'}</span>
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 space-x-reverse"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Email Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Settings className="w-5 h-5" />
              <span>الإعدادات الأساسية</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="adminEmail" className="text-sm font-medium text-gray-700">
                بريد المدير الإلكتروني *
              </Label>
              <Input
                id="adminEmail"
                type="email"
                value={settings.adminEmail}
                onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                placeholder="admin@maison-darin.com"
                className="mt-1"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                البريد الذي ستصل إليه رسائل العملاء
              </p>
            </div>

            <div>
              <Label htmlFor="fromEmail" className="text-sm font-medium text-gray-700">
                بريد الإرسال *
              </Label>
              <Input
                id="fromEmail"
                type="email"
                value={settings.fromEmail}
                onChange={(e) => handleInputChange('fromEmail', e.target.value)}
                placeholder="noreply@maison-darin.com"
                className="mt-1"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                البريد الذي سيظهر كمرسل للرسائل
              </p>
            </div>

            <div>
              <Label htmlFor="fromName" className="text-sm font-medium text-gray-700">
                اسم المرسل
              </Label>
              <Input
                id="fromName"
                type="text"
                value={settings.fromName}
                onChange={(e) => handleInputChange('fromName', e.target.value)}
                placeholder="ميزون دارين - Maison Darin"
                className="mt-1"
              />
            </div>

            {/* Notification Settings */}
            <div className="space-y-3 pt-4 border-t">
              <h4 className="font-medium text-gray-900">إعدادات الإشعارات</h4>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">إشعارات المدير</p>
                  <p className="text-xs text-gray-500">إرسال إشعار للمدير عند وصول رسالة جديدة</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableNotifications}
                    onChange={(e) => handleInputChange('enableNotifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">تأكيد العميل</p>
                  <p className="text-xs text-gray-500">إرسال تأكيد للعميل عند استلام رسالته</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableCustomerConfirmation}
                    onChange={(e) => handleInputChange('enableCustomerConfirmation', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SMTP Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Mail className="w-5 h-5" />
              <span>إعدادات SMTP</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="smtpHost" className="text-sm font-medium text-gray-700">
                خادم SMTP
              </Label>
              <Input
                id="smtpHost"
                type="text"
                value={settings.smtpHost}
                onChange={(e) => handleInputChange('smtpHost', e.target.value)}
                placeholder="smtp.gmail.com"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="smtpPort" className="text-sm font-medium text-gray-700">
                منفذ SMTP
              </Label>
              <Input
                id="smtpPort"
                type="number"
                value={settings.smtpPort}
                onChange={(e) => handleInputChange('smtpPort', parseInt(e.target.value))}
                placeholder="587"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="smtpUser" className="text-sm font-medium text-gray-700">
                اسم المستخدم *
              </Label>
              <Input
                id="smtpUser"
                type="email"
                value={settings.smtpUser}
                onChange={(e) => handleInputChange('smtpUser', e.target.value)}
                placeholder="your-email@gmail.com"
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="smtpPass" className="text-sm font-medium text-gray-700">
                كلمة المرور *
              </Label>
              <div className="relative mt-1">
                <Input
                  id="smtpPass"
                  type={showPassword ? "text" : "password"}
                  value={settings.smtpPass}
                  onChange={(e) => handleInputChange('smtpPass', e.target.value)}
                  placeholder="كلمة مرور التطبيق"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                استخدم كلمة مرور التطبيق لـ Gmail أو كلمة المرور العادية للخوادم الأخرى
              </p>
            </div>

            {/* Connection Status */}
            <div className="pt-4 border-t">
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">جاهز للإرسال</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <AlertCircle className="w-5 h-5 text-blue-500" />
            <span>تعليمات الإعداد</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">📧 إعداد Gmail:</h4>
              <ol className="list-decimal list-inside space-y-1 mr-4">
                <li>فعّل التحقق بخطوتين في حساب Gmail</li>
                <li>أنشئ كلمة مرور تطبيق من إعدادات الأمان</li>
                <li>استخدم كلمة مرور التطبيق في حقل كلمة المرور أعلاه</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">⚙️ إعدادات أخرى:</h4>
              <ul className="list-disc list-inside space-y-1 mr-4">
                <li>تأكد من صحة عنوان خادم SMTP والمنفذ</li>
                <li>استخدم المنفذ 587 للاتصال الآمن TLS</li>
                <li>اختبر الإعدادات قبل الحفظ</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailSettingsManager;
