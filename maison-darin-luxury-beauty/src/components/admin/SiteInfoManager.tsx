import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Save, 
  Globe, 
  Phone, 
  Mail, 
  MapPin,
  Clock,
  Facebook,
  Instagram,
  Twitter,
  Youtube
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

interface SiteInfo {
  siteName: { ar: string; en: string };
  tagline: { ar: string; en: string };
  description: { ar: string; en: string };
  logo: string;
  favicon: string;
}

interface ContactInfo {
  email: string;
  phone: string;
  whatsapp: string;
  address: { ar: string; en: string };
  workingHours: { ar: string; en: string };
}

interface SocialMedia {
  facebook: string;
  instagram: string;
  twitter: string;
  youtube: string;
  tiktok: string;
  snapchat: string;
}

const SiteInfoManager: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('site-info');

  const [siteInfo, setSiteInfo] = useState<SiteInfo>({
    siteName: { ar: 'ميزون دارين', en: 'Maison Darin' },
    tagline: { ar: 'عالم العطور الفاخرة', en: 'World of Luxury Fragrances' },
    description: { ar: '', en: '' },
    logo: '',
    favicon: ''
  });

  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    email: 'info@maison-darin.com',
    phone: '+966 50 123 4567',
    whatsapp: '+966 50 123 4567',
    address: { ar: 'الرياض، المملكة العربية السعودية', en: 'Riyadh, Saudi Arabia' },
    workingHours: { ar: 'السبت - الخميس: 9:00 ص - 10:00 م', en: 'Saturday - Thursday: 9:00 AM - 10:00 PM' }
  });

  const [socialMedia, setSocialMedia] = useState<SocialMedia>({
    facebook: '',
    instagram: '',
    twitter: '',
    youtube: '',
    tiktok: '',
    snapchat: ''
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/site-settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        const data = result.data;
        
        if (data.siteInfo) setSiteInfo(data.siteInfo);
        if (data.contactInfo) setContactInfo(data.contactInfo);
        if (data.socialMedia) setSocialMedia(data.socialMedia);
      }
    } catch (error) {
      console.error('Error loading site settings:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل إعدادات الموقع",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const updates = {
        siteInfo,
        contactInfo,
        socialMedia
      };

      const response = await fetch('http://localhost:5000/api/site-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updates)
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "تم الحفظ بنجاح",
          description: "تم حفظ معلومات الموقع بنجاح",
        });
      } else {
        throw new Error(result.error?.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving site settings:', error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ الإعدادات",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
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
          <div className="p-2 bg-green-100 rounded-lg">
            <Globe className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">معلومات الموقع</h2>
            <p className="text-sm text-gray-500">إدارة معلومات الموقع ووسائل التواصل</p>
          </div>
        </div>
        
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center space-x-2 space-x-reverse"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}</span>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="site-info">معلومات الموقع</TabsTrigger>
          <TabsTrigger value="contact">معلومات التواصل</TabsTrigger>
          <TabsTrigger value="social">وسائل التواصل</TabsTrigger>
        </TabsList>

        {/* Site Info Tab */}
        <TabsContent value="site-info" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>معلومات الموقع الأساسية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    اسم الموقع (عربي)
                  </Label>
                  <Input
                    value={siteInfo.siteName.ar}
                    onChange={(e) => setSiteInfo(prev => ({
                      ...prev,
                      siteName: { ...prev.siteName, ar: e.target.value }
                    }))}
                    placeholder="ميزون دارين"
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    اسم الموقع (إنجليزي)
                  </Label>
                  <Input
                    value={siteInfo.siteName.en}
                    onChange={(e) => setSiteInfo(prev => ({
                      ...prev,
                      siteName: { ...prev.siteName, en: e.target.value }
                    }))}
                    placeholder="Maison Darin"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    الشعار (عربي)
                  </Label>
                  <Input
                    value={siteInfo.tagline.ar}
                    onChange={(e) => setSiteInfo(prev => ({
                      ...prev,
                      tagline: { ...prev.tagline, ar: e.target.value }
                    }))}
                    placeholder="عالم العطور الفاخرة"
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    الشعار (إنجليزي)
                  </Label>
                  <Input
                    value={siteInfo.tagline.en}
                    onChange={(e) => setSiteInfo(prev => ({
                      ...prev,
                      tagline: { ...prev.tagline, en: e.target.value }
                    }))}
                    placeholder="World of Luxury Fragrances"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    وصف الموقع (عربي)
                  </Label>
                  <Textarea
                    value={siteInfo.description.ar}
                    onChange={(e) => setSiteInfo(prev => ({
                      ...prev,
                      description: { ...prev.description, ar: e.target.value }
                    }))}
                    placeholder="متجر ميزون دارين للعطور الفاخرة والأصيلة"
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    وصف الموقع (إنجليزي)
                  </Label>
                  <Textarea
                    value={siteInfo.description.en}
                    onChange={(e) => setSiteInfo(prev => ({
                      ...prev,
                      description: { ...prev.description, en: e.target.value }
                    }))}
                    placeholder="Maison Darin Luxury and Authentic Fragrances Store"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Info Tab */}
        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 space-x-reverse">
                <Phone className="w-5 h-5" />
                <span>معلومات التواصل</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2 space-x-reverse">
                    <Mail className="w-4 h-4" />
                    <span>البريد الإلكتروني</span>
                  </Label>
                  <Input
                    type="email"
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo(prev => ({
                      ...prev,
                      email: e.target.value
                    }))}
                    placeholder="info@maison-darin.com"
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2 space-x-reverse">
                    <Phone className="w-4 h-4" />
                    <span>رقم الهاتف</span>
                  </Label>
                  <Input
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo(prev => ({
                      ...prev,
                      phone: e.target.value
                    }))}
                    placeholder="+966 50 123 4567"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  رقم الواتساب
                </Label>
                <Input
                  value={contactInfo.whatsapp}
                  onChange={(e) => setContactInfo(prev => ({
                    ...prev,
                    whatsapp: e.target.value
                  }))}
                  placeholder="+966 50 123 4567"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2 space-x-reverse">
                    <MapPin className="w-4 h-4" />
                    <span>العنوان (عربي)</span>
                  </Label>
                  <Textarea
                    value={contactInfo.address.ar}
                    onChange={(e) => setContactInfo(prev => ({
                      ...prev,
                      address: { ...prev.address, ar: e.target.value }
                    }))}
                    placeholder="الرياض، المملكة العربية السعودية"
                    rows={2}
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2 space-x-reverse">
                    <MapPin className="w-4 h-4" />
                    <span>العنوان (إنجليزي)</span>
                  </Label>
                  <Textarea
                    value={contactInfo.address.en}
                    onChange={(e) => setContactInfo(prev => ({
                      ...prev,
                      address: { ...prev.address, en: e.target.value }
                    }))}
                    placeholder="Riyadh, Saudi Arabia"
                    rows={2}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2 space-x-reverse">
                    <Clock className="w-4 h-4" />
                    <span>ساعات العمل (عربي)</span>
                  </Label>
                  <Input
                    value={contactInfo.workingHours.ar}
                    onChange={(e) => setContactInfo(prev => ({
                      ...prev,
                      workingHours: { ...prev.workingHours, ar: e.target.value }
                    }))}
                    placeholder="السبت - الخميس: 9:00 ص - 10:00 م"
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2 space-x-reverse">
                    <Clock className="w-4 h-4" />
                    <span>ساعات العمل (إنجليزي)</span>
                  </Label>
                  <Input
                    value={contactInfo.workingHours.en}
                    onChange={(e) => setContactInfo(prev => ({
                      ...prev,
                      workingHours: { ...prev.workingHours, en: e.target.value }
                    }))}
                    placeholder="Saturday - Thursday: 9:00 AM - 10:00 PM"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Media Tab */}
        <TabsContent value="social" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>وسائل التواصل الاجتماعي</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2 space-x-reverse">
                    <Facebook className="w-4 h-4 text-blue-600" />
                    <span>فيسبوك</span>
                  </Label>
                  <Input
                    value={socialMedia.facebook}
                    onChange={(e) => setSocialMedia(prev => ({
                      ...prev,
                      facebook: e.target.value
                    }))}
                    placeholder="https://facebook.com/maisondarin"
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2 space-x-reverse">
                    <Instagram className="w-4 h-4 text-pink-600" />
                    <span>إنستغرام</span>
                  </Label>
                  <Input
                    value={socialMedia.instagram}
                    onChange={(e) => setSocialMedia(prev => ({
                      ...prev,
                      instagram: e.target.value
                    }))}
                    placeholder="https://instagram.com/maisondarin"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2 space-x-reverse">
                    <Twitter className="w-4 h-4 text-blue-400" />
                    <span>تويتر</span>
                  </Label>
                  <Input
                    value={socialMedia.twitter}
                    onChange={(e) => setSocialMedia(prev => ({
                      ...prev,
                      twitter: e.target.value
                    }))}
                    placeholder="https://twitter.com/maisondarin"
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2 space-x-reverse">
                    <Youtube className="w-4 h-4 text-red-600" />
                    <span>يوتيوب</span>
                  </Label>
                  <Input
                    value={socialMedia.youtube}
                    onChange={(e) => setSocialMedia(prev => ({
                      ...prev,
                      youtube: e.target.value
                    }))}
                    placeholder="https://youtube.com/@maisondarin"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    تيك توك
                  </Label>
                  <Input
                    value={socialMedia.tiktok}
                    onChange={(e) => setSocialMedia(prev => ({
                      ...prev,
                      tiktok: e.target.value
                    }))}
                    placeholder="https://tiktok.com/@maisondarin"
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    سناب شات
                  </Label>
                  <Input
                    value={socialMedia.snapchat}
                    onChange={(e) => setSocialMedia(prev => ({
                      ...prev,
                      snapchat: e.target.value
                    }))}
                    placeholder="https://snapchat.com/add/maisondarin"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SiteInfoManager;
