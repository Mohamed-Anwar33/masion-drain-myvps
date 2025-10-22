import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Instagram, 
  Facebook, 
  Twitter, 
  Youtube,
  Save,
  Settings
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

interface ContactSettingsData {
  // إعدادات الإيميل
  contactFormEmail: string;
  footerEmail: string;
  
  // معلومات التواصل في الفوتر
  phone: string;
  address: string;
  
  // وسائل التواصل الاجتماعي
  socialMedia: {
    instagram: string;
    facebook: string;
    twitter: string;
    youtube: string;
  };
}

export function ContactSettings() {
  const { showSaveSuccess, showSaveError, showSaveProgress } = useNotifications();
  const [settings, setSettings] = useState<ContactSettingsData>({
    contactFormEmail: 'maisondarin2025@gmail.com',
    footerEmail: 'info@maisondarin.com',
    phone: '+966 50 123 4567',
    address: 'الرياض، المملكة العربية السعودية',
    socialMedia: {
      instagram: 'https://instagram.com/maisondarin',
      facebook: 'https://facebook.com/maisondarin',
      twitter: 'https://twitter.com/maisondarin',
      youtube: 'https://youtube.com/@maisondarin'
    }
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // تحميل الإعدادات الحالية
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/site-settings`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setSettings({
            contactFormEmail: data.data.email?.adminEmail || 'maisondarin2025@gmail.com',
            footerEmail: data.data.contact?.email || 'info@maisondarin.com',
            phone: data.data.contact?.phone || '+966 50 123 4567',
            address: data.data.contact?.address || 'الرياض، المملكة العربية السعودية',
            socialMedia: {
              instagram: data.data.socialMedia?.instagram || '',
              facebook: data.data.socialMedia?.facebook || '',
              twitter: data.data.socialMedia?.twitter || '',
              youtube: data.data.socialMedia?.youtube || ''
            }
          });
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('socialMedia.')) {
      const socialField = field.split('.')[1];
      setSettings(prev => ({
        ...prev,
        socialMedia: {
          ...prev.socialMedia,
          [socialField]: value
        }
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      showSaveProgress();

      const updateData = {
        email: {
          adminEmail: settings.contactFormEmail
        },
        contact: {
          email: settings.footerEmail,
          phone: settings.phone,
          address: settings.address
        },
        socialMedia: settings.socialMedia
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/site-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        showSaveSuccess();
      } else {
        showSaveError('فشل في حفظ الإعدادات');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showSaveError('خطأ في الاتصال بالخادم');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-gold border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gold/10 rounded-xl">
          <Settings className="w-6 h-6 text-gold" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold text-off-white">
            إعدادات التواصل
          </h1>
          <p className="text-beige/80">
            إدارة معلومات التواصل ووسائل التواصل الاجتماعي
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* إعدادات الإيميل */}
        <Card className="bg-off-white/95 backdrop-blur-sm border-gold/20 shadow-luxury">
          <CardHeader>
            <CardTitle className="text-dark-tea flex items-center gap-2">
              <Mail className="w-5 h-5 text-gold" />
              إعدادات البريد الإلكتروني
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="contactFormEmail" className="text-dark-tea font-medium">
                📧 إيميل استقبال رسائل الفورم
              </Label>
              <p className="text-sm text-dark-tea/60 mb-2">
                الإيميل اللي هيوصله رسائل العملاء من فورم الاتصال
              </p>
              <Input
                id="contactFormEmail"
                type="email"
                value={settings.contactFormEmail}
                onChange={(e) => handleInputChange('contactFormEmail', e.target.value)}
                placeholder="maisondarin2025@gmail.com"
                className="bg-white/50 border-gold/20 focus:border-gold/50"
              />
            </div>

            <div>
              <Label htmlFor="footerEmail" className="text-dark-tea font-medium">
                📮 إيميل الفوتر
              </Label>
              <p className="text-sm text-dark-tea/60 mb-2">
                الإيميل اللي هيظهر في الفوتر للعملاء
              </p>
              <Input
                id="footerEmail"
                type="email"
                value={settings.footerEmail}
                onChange={(e) => handleInputChange('footerEmail', e.target.value)}
                placeholder="info@maisondarin.com"
                className="bg-white/50 border-gold/20 focus:border-gold/50"
              />
            </div>
          </CardContent>
        </Card>

        {/* معلومات التواصل */}
        <Card className="bg-off-white/95 backdrop-blur-sm border-gold/20 shadow-luxury">
          <CardHeader>
            <CardTitle className="text-dark-tea flex items-center gap-2">
              <Phone className="w-5 h-5 text-gold" />
              معلومات التواصل
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="phone" className="text-dark-tea font-medium">
                📱 رقم التليفون
              </Label>
              <Input
                id="phone"
                value={settings.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+966 50 123 4567"
                className="bg-white/50 border-gold/20 focus:border-gold/50"
              />
            </div>

            <div>
              <Label htmlFor="address" className="text-dark-tea font-medium">
                📍 العنوان
              </Label>
              <Textarea
                id="address"
                value={settings.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="الرياض، المملكة العربية السعودية"
                className="bg-white/50 border-gold/20 focus:border-gold/50 min-h-[80px]"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* وسائل التواصل الاجتماعي */}
      <Card className="bg-off-white/95 backdrop-blur-sm border-gold/20 shadow-luxury">
        <CardHeader>
          <CardTitle className="text-dark-tea flex items-center gap-2">
            <Instagram className="w-5 h-5 text-gold" />
            وسائل التواصل الاجتماعي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="instagram" className="text-dark-tea font-medium flex items-center gap-2">
                <Instagram className="w-4 h-4 text-pink-500" />
                إنستجرام
              </Label>
              <Input
                id="instagram"
                value={settings.socialMedia.instagram}
                onChange={(e) => handleInputChange('socialMedia.instagram', e.target.value)}
                placeholder="https://instagram.com/maisondarin"
                className="bg-white/50 border-gold/20 focus:border-gold/50"
              />
            </div>

            <div>
              <Label htmlFor="facebook" className="text-dark-tea font-medium flex items-center gap-2">
                <Facebook className="w-4 h-4 text-blue-500" />
                فيسبوك
              </Label>
              <Input
                id="facebook"
                value={settings.socialMedia.facebook}
                onChange={(e) => handleInputChange('socialMedia.facebook', e.target.value)}
                placeholder="https://facebook.com/maisondarin"
                className="bg-white/50 border-gold/20 focus:border-gold/50"
              />
            </div>

            <div>
              <Label htmlFor="twitter" className="text-dark-tea font-medium flex items-center gap-2">
                <Twitter className="w-4 h-4 text-blue-400" />
                تويتر / X
              </Label>
              <Input
                id="twitter"
                value={settings.socialMedia.twitter}
                onChange={(e) => handleInputChange('socialMedia.twitter', e.target.value)}
                placeholder="https://twitter.com/maisondarin"
                className="bg-white/50 border-gold/20 focus:border-gold/50"
              />
            </div>

            <div>
              <Label htmlFor="youtube" className="text-dark-tea font-medium flex items-center gap-2">
                <Youtube className="w-4 h-4 text-red-500" />
                يوتيوب
              </Label>
              <Input
                id="youtube"
                value={settings.socialMedia.youtube}
                onChange={(e) => handleInputChange('socialMedia.youtube', e.target.value)}
                placeholder="https://youtube.com/@maisondarin"
                className="bg-white/50 border-gold/20 focus:border-gold/50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* زر الحفظ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end"
      >
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-gold hover:bg-gold/90 text-dark-tea px-8 py-3 text-lg font-medium"
        >
          {isSaving ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 animate-spin border-2 border-dark-tea border-t-transparent rounded-full"></div>
              جاري الحفظ...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Save className="w-5 h-5" />
              حفظ الإعدادات
            </div>
          )}
        </Button>
      </motion.div>
    </div>
  );
}
