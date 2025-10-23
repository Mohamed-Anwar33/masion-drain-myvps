import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Save, 
  Mail, 
  Settings,
  Phone,
  MapPin,
  Globe,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Shield,
  TestTube,
  MessageCircle,
  Clock,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAdminSiteSettings } from '@/hooks/useAdminSiteSettings';
import { siteSettingsService, SiteSettings } from '@/services/siteSettingsService';

const SiteSettingsManager: React.FC = () => {
  const { toast } = useToast();
  const { siteSettings, loading, error, updateSettings } = useAdminSiteSettings();
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeSection, setActiveSection] = useState('email');
  
  // Local state for form data
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    if (siteSettings) {
      setSettings(siteSettings);
    }
  }, [siteSettings]);

  const handleSave = async () => {
    if (!settings) return;
    
    try {
      setSaving(true);
      await updateSettings(settings);
      
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم حفظ إعدادات الموقع بنجاح",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
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
      const result = await siteSettingsService.testEmailSettings();
      
      toast({
        title: "تم إرسال البريد التجريبي",
        description: `تم إرسال بريد تجريبي إلى ${settings?.emailSettings.adminEmail}`,
      });
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

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center py-12">
        {loading ? (
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        ) : error ? (
          <div className="text-center">
            <h3 className="text-lg font-semibold text-red-600 mb-2">خطأ في التحميل</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">
              يرجى التأكد من تسجيل الدخول كمدير للوصول لهذه الصفحة
            </p>
          </div>
        ) : (
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Settings className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">إعدادات الموقع</h2>
            <p className="text-xs sm:text-sm text-gray-500">إدارة شاملة لجميع إعدادات الموقع</p>
          </div>
        </div>
        
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center space-x-2 space-x-reverse w-full sm:w-auto"
        >
          <Save className="w-4 h-4" />
          <span className="text-sm">{saving ? 'جاري الحفظ...' : 'حفظ جميع الإعدادات'}</span>
        </Button>
      </div>

      {/* Section Selector */}
      <Card>
        <CardContent className="pt-6">
          <Label htmlFor="section-select" className="text-base font-semibold mb-2 block">اختر القسم</Label>
          <Select value={activeSection} onValueChange={setActiveSection}>
            <SelectTrigger id="section-select" className="w-full">
              <SelectValue placeholder="اختر القسم" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email">📧 البريد الإلكتروني</SelectItem>
              <SelectItem value="contact">📞 معلومات التواصل</SelectItem>
              <SelectItem value="social">🌐 وسائل التواصل</SelectItem>
              <SelectItem value="site">ℹ️ معلومات الموقع</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Email Settings Section */}
      {activeSection === 'email' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 space-x-reverse">
                  <Mail className="w-5 h-5" />
                  <span>الإعدادات الأساسية</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="adminEmail">البريد الإلكتروني لاستقبال الرسائل *</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={settings.emailSettings.adminEmail}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      emailSettings: { ...prev.emailSettings, adminEmail: e.target.value }
                    }))}
                    placeholder="admin@maison-darin.com"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    البريد الإلكتروني الذي ستصل إليه رسائل العملاء من فورم التواصل
                  </p>
                </div>

                <div>
                  <Label htmlFor="fromEmail">بريد الإرسال *</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    value={settings.emailSettings.fromEmail}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      emailSettings: { ...prev.emailSettings, fromEmail: e.target.value }
                    }))}
                    placeholder="noreply@maison-darin.com"
                  />
                </div>

                <div>
                  <Label htmlFor="fromName">اسم المرسل</Label>
                  <Input
                    id="fromName"
                    value={settings.emailSettings.fromName}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      emailSettings: { ...prev.emailSettings, fromName: e.target.value }
                    }))}
                  />
                </div>

                <div className="flex items-center space-x-3 space-x-reverse">
                  <Button
                    onClick={handleTestEmail}
                    disabled={testing}
                    variant="outline"
                    size="sm"
                  >
                    <TestTube className="w-4 h-4 ml-2" />
                    {testing ? 'جاري الاختبار...' : 'اختبار الإيميل'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>إعدادات الأمان</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-800">إعدادات SMTP محمية</h4>
                  </div>
                  <p className="text-sm text-blue-700">
                    تم تثبيت إعدادات SMTP (الخادم، المنفذ، اسم المستخدم، كلمة المرور) في الكود لأغراض الأمان.
                    <br />
                    البريد المستخدم: <strong>maisondarin2025@gmail.com</strong>
                  </p>
                </div>

              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Contact Info Section */}
      {activeSection === 'contact' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 space-x-reverse">
                <Phone className="w-5 h-5" />
                <span>معلومات التواصل</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactEmail">البريد الإلكتروني</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={settings.contactInfo.email}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      contactInfo: { ...prev.contactInfo, email: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input
                    id="phone"
                    value={settings.contactInfo.phone}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      contactInfo: { ...prev.contactInfo, phone: e.target.value }
                    }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="whatsapp">رقم الواتساب</Label>
                <Input
                  id="whatsapp"
                  value={settings.contactInfo.whatsapp}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    contactInfo: { ...prev.contactInfo, whatsapp: e.target.value }
                  }))}
                />
              </div>

              <div className="flex items-center space-x-2 space-x-reverse">
                <input
                  type="checkbox"
                  id="whatsappEnabled"
                  checked={settings.contactInfo.whatsappEnabled !== false}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    contactInfo: { ...prev.contactInfo, whatsappEnabled: e.target.checked }
                  }))}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="whatsappEnabled" className="flex items-center space-x-2 space-x-reverse">
                  <MessageCircle className="w-4 h-4 text-green-600" />
                  <span>إظهار أيقونة الواتساب الثابتة</span>
                </Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="addressAr">العنوان (عربي)</Label>
                  <Textarea
                    id="addressAr"
                    value={settings.contactInfo.address.ar}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      contactInfo: { 
                        ...prev.contactInfo, 
                        address: { ...prev.contactInfo.address, ar: e.target.value }
                      }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="addressEn">العنوان (إنجليزي)</Label>
                  <Textarea
                    id="addressEn"
                    value={settings.contactInfo.address.en}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      contactInfo: { 
                        ...prev.contactInfo, 
                        address: { ...prev.contactInfo.address, en: e.target.value }
                      }
                    }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hoursAr">ساعات العمل (عربي)</Label>
                  <Input
                    id="hoursAr"
                    value={settings.contactInfo.workingHours.ar}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      contactInfo: { 
                        ...prev.contactInfo, 
                        workingHours: { ...prev.contactInfo.workingHours, ar: e.target.value }
                      }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="hoursEn">ساعات العمل (إنجليزي)</Label>
                  <Input
                    id="hoursEn"
                    value={settings.contactInfo.workingHours.en}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      contactInfo: { 
                        ...prev.contactInfo, 
                        workingHours: { ...prev.contactInfo.workingHours, en: e.target.value }
                      }
                    }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Social Media Section */}
      {activeSection === 'social' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 space-x-reverse">
                <Globe className="w-5 h-5" />
                <span>وسائل التواصل الاجتماعي</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="facebook" className="flex items-center space-x-2 space-x-reverse">
                    <Facebook className="w-4 h-4" />
                    <span>فيسبوك</span>
                  </Label>
                  <Input
                    id="facebook"
                    value={settings.socialMedia.facebook}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      socialMedia: { ...prev.socialMedia, facebook: e.target.value }
                    }))}
                    placeholder="https://facebook.com/maisondarin"
                  />
                </div>
                <div>
                  <Label htmlFor="instagram" className="flex items-center space-x-2 space-x-reverse">
                    <Instagram className="w-4 h-4" />
                    <span>إنستغرام</span>
                  </Label>
                  <Input
                    id="instagram"
                    value={settings.socialMedia.instagram}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      socialMedia: { ...prev.socialMedia, instagram: e.target.value }
                    }))}
                    placeholder="https://instagram.com/maisondarin"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="twitter" className="flex items-center space-x-2 space-x-reverse">
                    <Twitter className="w-4 h-4" />
                    <span>تويتر</span>
                  </Label>
                  <Input
                    id="twitter"
                    value={settings.socialMedia.twitter}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      socialMedia: { ...prev.socialMedia, twitter: e.target.value }
                    }))}
                    placeholder="https://twitter.com/maisondarin"
                  />
                </div>
                <div>
                  <Label htmlFor="youtube" className="flex items-center space-x-2 space-x-reverse">
                    <Youtube className="w-4 h-4" />
                    <span>يوتيوب</span>
                  </Label>
                  <Input
                    id="youtube"
                    value={settings.socialMedia.youtube}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      socialMedia: { ...prev.socialMedia, youtube: e.target.value }
                    }))}
                    placeholder="https://youtube.com/maisondarin"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tiktok">تيك توك</Label>
                  <Input
                    id="tiktok"
                    value={settings.socialMedia.tiktok}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      socialMedia: { ...prev.socialMedia, tiktok: e.target.value }
                    }))}
                    placeholder="https://tiktok.com/@maisondarin"
                  />
                </div>
                <div>
                  <Label htmlFor="snapchat">سناب شات</Label>
                  <Input
                    id="snapchat"
                    value={settings.socialMedia.snapchat}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      socialMedia: { ...prev.socialMedia, snapchat: e.target.value }
                    }))}
                    placeholder="https://snapchat.com/add/maisondarin"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Site Info Section */}
      {activeSection === 'site' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 space-x-reverse">
                <Globe className="w-5 h-5" />
                <span>معلومات الموقع</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="siteNameAr">اسم الموقع (عربي)</Label>
                  <Input
                    id="siteNameAr"
                    value={settings.siteInfo.siteName.ar}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      siteInfo: { 
                        ...prev.siteInfo, 
                        siteName: { ...prev.siteInfo.siteName, ar: e.target.value }
                      }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="siteNameEn">اسم الموقع (إنجليزي)</Label>
                  <Input
                    id="siteNameEn"
                    value={settings.siteInfo.siteName.en}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      siteInfo: { 
                        ...prev.siteInfo, 
                        siteName: { ...prev.siteInfo.siteName, en: e.target.value }
                      }
                    }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="taglineAr">الشعار (عربي)</Label>
                  <Input
                    id="taglineAr"
                    value={settings.siteInfo.tagline.ar}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      siteInfo: { 
                        ...prev.siteInfo, 
                        tagline: { ...prev.siteInfo.tagline, ar: e.target.value }
                      }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="taglineEn">الشعار (إنجليزي)</Label>
                  <Input
                    id="taglineEn"
                    value={settings.siteInfo.tagline.en}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      siteInfo: { 
                        ...prev.siteInfo, 
                        tagline: { ...prev.siteInfo.tagline, en: e.target.value }
                      }
                    }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="descAr">الوصف (عربي)</Label>
                  <Textarea
                    id="descAr"
                    value={settings.siteInfo.description.ar}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      siteInfo: { 
                        ...prev.siteInfo, 
                        description: { ...prev.siteInfo.description, ar: e.target.value }
                      }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="descEn">الوصف (إنجليزي)</Label>
                  <Textarea
                    id="descEn"
                    value={settings.siteInfo.description.en}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      siteInfo: { 
                        ...prev.siteInfo, 
                        description: { ...prev.siteInfo.description, en: e.target.value }
                      }
                    }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SiteSettingsManager;
