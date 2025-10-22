import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Save, Download, Upload, RefreshCcw } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { settingsService, SiteSettings } from "@/services/settingsService";

interface AdminSettingsProps {
  currentLang: 'en' | 'ar';
}

export const AdminSettings = ({ currentLang }: AdminSettingsProps) => {
  const [settings, setSettings] = useState<SiteSettings>({
    site: {
      title: { en: "Maison Darin", ar: "دار دارين" },
      tagline: { en: "Luxury Fragrances", ar: "عطور فاخرة" },
      description: { 
        en: "Luxury perfumes for the modern woman", 
        ar: "عطور فاخرة للمرأة العصرية" 
      },
      email: "hello@maisondarin.com",
      phone: "+1 (555) 123-4567",
      address: "Luxury Boutique, Fashion District",
      socialMedia: {
        instagram: "https://instagram.com/maisondarin",
        facebook: "https://facebook.com/maisondarin",
        twitter: "https://twitter.com/maisondarin"
      }
    },
    seo: {
      metaTitle: { en: "Maison Darin - Luxury Perfumes", ar: "دار دارين - عطور فاخرة" },
      metaDescription: { 
        en: "Discover our curated collection of luxury perfumes for women", 
        ar: "اكتشفي مجموعتنا المختارة من العطور الفاخرة للنساء" 
      },
      keywords: { 
        en: "luxury perfume, women fragrance, artisanal scents", 
        ar: "عطور فاخرة، عطور نسائية، عطور حرفية" 
      },
      enableSitemap: true,
      enableRobots: true
    },
    appearance: {
      primaryColor: "#1E6660",
      accentColor: "#CD9D82",
      logoUrl: "",
      faviconUrl: "",
      enableAnimations: true,
      enableParallax: true
    },
    features: {
      enableSampleRequests: true,
      enableNewsletter: true,
      enableLiveChat: false,
      enableAnalytics: true,
      maintenanceMode: false
    },
    shipping: {
      enableShipping: true,
      freeShippingThreshold: 100,
      domesticShipping: {
        enabled: true,
        cost: 10,
        estimatedDays: "3-5",
        description: { 
          en: "Standard domestic shipping", 
          ar: "الشحن المحلي العادي" 
        }
      },
      internationalShipping: {
        enabled: true,
        cost: 25,
        estimatedDays: "7-14",
        description: { 
          en: "International shipping", 
          ar: "الشحن الدولي" 
        }
      },
      expressShipping: {
        enabled: true,
        cost: 20,
        estimatedDays: "1-2",
        description: { 
          en: "Express shipping", 
          ar: "الشحن السريع" 
        }
      },
      shippingZones: [
        {
          name: { en: "Local Area", ar: "المنطقة المحلية" },
          countries: ["EG"],
          cost: 5,
          estimatedDays: "1-2"
        },
        {
          name: { en: "Middle East", ar: "الشرق الأوسط" },
          countries: ["SA", "AE", "KW", "QA", "BH", "OM"],
          cost: 15,
          estimatedDays: "3-7"
        },
        {
          name: { en: "International", ar: "دولي" },
          countries: ["*"],
          cost: 25,
          estimatedDays: "7-14"
        }
      ]
    },
    taxes: {
      enableTaxes: true,
      taxIncludedInPrice: false,
      defaultTaxRate: 14,
      taxRates: [
        {
          name: { en: "VAT", ar: "ضريبة القيمة المضافة" },
          rate: 14,
          countries: ["EG"],
          enabled: true
        },
        {
          name: { en: "Gulf VAT", ar: "ضريبة القيمة المضافة الخليجية" },
          rate: 5,
          countries: ["AE", "SA", "BH", "OM"],
          enabled: true
        },
        {
          name: { en: "Kuwait VAT", ar: "ضريبة الكويت" },
          rate: 0,
          countries: ["KW"],
          enabled: false
        }
      ],
      taxExemptProducts: [],
      displayTaxBreakdown: true
    },
    localization: {
      defaultLanguage: "en",
      enableRTL: true,
      dateFormat: "MM/DD/YYYY",
      currencySymbol: "$"
    }
  });

  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSettingChange = (section: string, field: string, value: any, lang?: 'en' | 'ar') => {
    setSettings(prev => {
      const newSettings = { ...prev } as any;
      if (lang && typeof newSettings[section][field] === 'object' && newSettings[section][field].en !== undefined) {
        newSettings[section][field][lang] = value;
      } else if (field.includes('.')) {
        const [mainField, subField] = field.split('.');
        newSettings[section][mainField][subField] = value;
      } else {
        newSettings[section][field] = value;
      }
      return newSettings;
    });
    setHasChanges(true);
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      await settingsService.updateSettings(settings);
      setHasChanges(false);
      toast({
        title: currentLang === 'ar' ? "تم حفظ الإعدادات" : "Settings Saved",
        description: currentLang === 'ar' ? "تم حفظ جميع الإعدادات بنجاح" : "All settings saved successfully",
      });
    } catch (error: any) {
      toast({
        title: currentLang === 'ar' ? 'خطأ' : 'Error',
        description: error?.message || (currentLang === 'ar' ? 'فشل حفظ الإعدادات' : 'Failed to save settings'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportSettings = async () => {
    try {
      const blob = await settingsService.exportSettings();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `maison-darin-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: currentLang === 'ar' ? "تم تصدير الإعدادات" : "Settings Exported",
        description: currentLang === 'ar' ? "تم تنزيل ملف الإعدادات" : "Settings file downloaded",
      });
    } catch (error: any) {
      toast({
        title: currentLang === 'ar' ? 'خطأ' : 'Error',
        description: error?.message || (currentLang === 'ar' ? 'فشل تصدير الإعدادات' : 'Failed to export settings'),
        variant: 'destructive'
      });
    }
  };

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const importData = JSON.parse(e.target?.result as string);
          const importedSettings = await settingsService.importSettings(importData);
          setSettings(importedSettings);
          setHasChanges(false);
          toast({
            title: currentLang === 'ar' ? "تم استيراد الإعدادات" : "Settings Imported",
            description: currentLang === 'ar' ? "تم تحميل الإعدادات بنجاح" : "Settings loaded successfully",
          });
        } catch (error: any) {
          toast({
            title: currentLang === 'ar' ? "خطأ في الاستيراد" : "Import Error",
            description: error?.message || (currentLang === 'ar' ? "ملف غير صالح" : "Invalid file format"),
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    }
    // Reset input
    event.target.value = '';
  };

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const loadedSettings = await settingsService.getSettings();
        setSettings(loadedSettings);
      } catch (error: any) {
        toast({
          title: currentLang === 'ar' ? 'خطأ' : 'Error',
          description: error?.message || (currentLang === 'ar' ? 'فشل تحميل الإعدادات' : 'Failed to load settings'),
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [currentLang, toast]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">
            {currentLang === 'ar' ? 'إعدادات الموقع' : 'Site Settings'}
          </h2>
          <p className="text-muted-foreground">
            {currentLang === 'ar' ? 'إدارة إعدادات الموقع العامة' : 'Manage general website settings'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportSettings}>
            <Download className="h-4 w-4 mr-2" />
            {currentLang === 'ar' ? 'تصدير' : 'Export'}
          </Button>
          <label className="cursor-pointer">
            <Button variant="outline" asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                {currentLang === 'ar' ? 'استيراد' : 'Import'}
              </span>
            </Button>
            <input
              type="file"
              accept=".json"
              onChange={handleImportSettings}
              className="hidden"
            />
          </label>
          <Button onClick={handleSaveSettings} disabled={!hasChanges || loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? (currentLang === 'ar' ? 'جارٍ الحفظ...' : 'Saving...') : (currentLang === 'ar' ? 'حفظ' : 'Save')}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="general">
            {currentLang === 'ar' ? 'عام' : 'General'}
          </TabsTrigger>
          <TabsTrigger value="seo">
            {currentLang === 'ar' ? 'تحسين محركات البحث' : 'SEO'}
          </TabsTrigger>
          <TabsTrigger value="appearance">
            {currentLang === 'ar' ? 'المظهر' : 'Appearance'}
          </TabsTrigger>
          <TabsTrigger value="features">
            {currentLang === 'ar' ? 'المزايا' : 'Features'}
          </TabsTrigger>
          <TabsTrigger value="shipping">
            {currentLang === 'ar' ? 'الشحن' : 'Shipping'}
          </TabsTrigger>
          <TabsTrigger value="taxes">
            {currentLang === 'ar' ? 'الضرائب' : 'Taxes'}
          </TabsTrigger>
          <TabsTrigger value="payment">
            {currentLang === 'ar' ? 'الدفع' : 'Payment'}
          </TabsTrigger>
          <TabsTrigger value="localization">
            {currentLang === 'ar' ? 'الترجمة' : 'Localization'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>{currentLang === 'ar' ? 'معلومات الموقع' : 'Site Information'}</CardTitle>
                <CardDescription>
                  {currentLang === 'ar' ? 'الإعدادات الأساسية للموقع' : 'Basic website configuration'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs defaultValue="en">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="en">English</TabsTrigger>
                    <TabsTrigger value="ar">العربية</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="en" className="space-y-4">
                    <div>
                      <Label>Site Title (English)</Label>
                      <Input
                        value={settings.site.title.en}
                        onChange={(e) => handleSettingChange('site', 'title', e.target.value, 'en')}
                      />
                    </div>
                    <div>
                      <Label>Tagline (English)</Label>
                      <Input
                        value={settings.site.tagline.en}
                        onChange={(e) => handleSettingChange('site', 'tagline', e.target.value, 'en')}
                      />
                    </div>
                    <div>
                      <Label>Description (English)</Label>
                      <Textarea
                        value={settings.site.description.en}
                        onChange={(e) => handleSettingChange('site', 'description', e.target.value, 'en')}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="ar" className="space-y-4">
                    <div>
                      <Label>عنوان الموقع (العربية)</Label>
                      <Input
                        value={settings.site.title.ar}
                        onChange={(e) => handleSettingChange('site', 'title', e.target.value, 'ar')}
                      />
                    </div>
                    <div>
                      <Label>الشعار (العربية)</Label>
                      <Input
                        value={settings.site.tagline.ar}
                        onChange={(e) => handleSettingChange('site', 'tagline', e.target.value, 'ar')}
                      />
                    </div>
                    <div>
                      <Label>الوصف (العربية)</Label>
                      <Textarea
                        value={settings.site.description.ar}
                        onChange={(e) => handleSettingChange('site', 'description', e.target.value, 'ar')}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{currentLang === 'ar' ? 'معلومات الاتصال' : 'Contact Information'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Email</Label>
                  <Input
                    value={settings.site.email}
                    onChange={(e) => handleSettingChange('site', 'email', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={settings.site.phone}
                    onChange={(e) => handleSettingChange('site', 'phone', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input
                    value={settings.site.address}
                    onChange={(e) => handleSettingChange('site', 'address', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{currentLang === 'ar' ? 'وسائل التواصل الاجتماعي' : 'Social Media'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Instagram</Label>
                  <Input
                    value={settings.site.socialMedia.instagram}
                    onChange={(e) => handleSettingChange('site', 'socialMedia.instagram', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Facebook</Label>
                  <Input
                    value={settings.site.socialMedia.facebook}
                    onChange={(e) => handleSettingChange('site', 'socialMedia.facebook', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Twitter</Label>
                  <Input
                    value={settings.site.socialMedia.twitter}
                    onChange={(e) => handleSettingChange('site', 'socialMedia.twitter', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="seo">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>{currentLang === 'ar' ? 'تحسين محركات البحث' : 'SEO Settings'}</CardTitle>
                <CardDescription>
                  {currentLang === 'ar' ? 'إعدادات تحسين الموقع لمحركات البحث' : 'Search engine optimization settings'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="en">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="en">English</TabsTrigger>
                    <TabsTrigger value="ar">العربية</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="en" className="space-y-4">
                    <div>
                      <Label>Meta Title (English)</Label>
                      <Input
                        value={settings.seo.metaTitle.en}
                        onChange={(e) => handleSettingChange('seo', 'metaTitle', e.target.value, 'en')}
                      />
                    </div>
                    <div>
                      <Label>Meta Description (English)</Label>
                      <Textarea
                        value={settings.seo.metaDescription.en}
                        onChange={(e) => handleSettingChange('seo', 'metaDescription', e.target.value, 'en')}
                      />
                    </div>
                    <div>
                      <Label>Keywords (English)</Label>
                      <Textarea
                        value={settings.seo.keywords.en}
                        onChange={(e) => handleSettingChange('seo', 'keywords', e.target.value, 'en')}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="ar" className="space-y-4">
                    <div>
                      <Label>عنوان الصفحة (العربية)</Label>
                      <Input
                        value={settings.seo.metaTitle.ar}
                        onChange={(e) => handleSettingChange('seo', 'metaTitle', e.target.value, 'ar')}
                      />
                    </div>
                    <div>
                      <Label>وصف الصفحة (العربية)</Label>
                      <Textarea
                        value={settings.seo.metaDescription.ar}
                        onChange={(e) => handleSettingChange('seo', 'metaDescription', e.target.value, 'ar')}
                      />
                    </div>
                    <div>
                      <Label>الكلمات المفتاحية (العربية)</Label>
                      <Textarea
                        value={settings.seo.keywords.ar}
                        onChange={(e) => handleSettingChange('seo', 'keywords', e.target.value, 'ar')}
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{currentLang === 'ar' ? 'تفعيل خريطة الموقع' : 'Enable Sitemap'}</Label>
                      <p className="text-sm text-muted-foreground">
                        {currentLang === 'ar' ? 'إنشاء خريطة موقع تلقائية' : 'Generate automatic sitemap'}
                      </p>
                    </div>
                    <Switch
                      checked={settings.seo.enableSitemap}
                      onCheckedChange={(checked) => handleSettingChange('seo', 'enableSitemap', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{currentLang === 'ar' ? 'تفعيل ملف robots.txt' : 'Enable Robots.txt'}</Label>
                      <p className="text-sm text-muted-foreground">
                        {currentLang === 'ar' ? 'إنشاء ملف robots.txt' : 'Generate robots.txt file'}
                      </p>
                    </div>
                    <Switch
                      checked={settings.seo.enableRobots}
                      onCheckedChange={(checked) => handleSettingChange('seo', 'enableRobots', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="appearance">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>{currentLang === 'ar' ? 'إعدادات المظهر' : 'Appearance Settings'}</CardTitle>
                <CardDescription>
                  {currentLang === 'ar' ? 'تخصيص مظهر الموقع' : 'Customize website appearance'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{currentLang === 'ar' ? 'اللون الأساسي' : 'Primary Color'}</Label>
                    <Input
                      type="color"
                      value={settings.appearance.primaryColor}
                      onChange={(e) => handleSettingChange('appearance', 'primaryColor', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>{currentLang === 'ar' ? 'لون التمييز' : 'Accent Color'}</Label>
                    <Input
                      type="color"
                      value={settings.appearance.accentColor}
                      onChange={(e) => handleSettingChange('appearance', 'accentColor', e.target.value)}
                    />
                  </div>
                </div>
                
                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{currentLang === 'ar' ? 'تفعيل الحركات' : 'Enable Animations'}</Label>
                      <p className="text-sm text-muted-foreground">
                        {currentLang === 'ar' ? 'تفعيل الحركات والانتقالات' : 'Enable animations and transitions'}
                      </p>
                    </div>
                    <Switch
                      checked={settings.appearance.enableAnimations}
                      onCheckedChange={(checked) => handleSettingChange('appearance', 'enableAnimations', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{currentLang === 'ar' ? 'تفعيل تأثير البارالاكس' : 'Enable Parallax'}</Label>
                      <p className="text-sm text-muted-foreground">
                        {currentLang === 'ar' ? 'تفعيل تأثيرات البارالاكس' : 'Enable parallax effects'}
                      </p>
                    </div>
                    <Switch
                      checked={settings.appearance.enableParallax}
                      onCheckedChange={(checked) => handleSettingChange('appearance', 'enableParallax', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="features">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>{currentLang === 'ar' ? 'مزايا الموقع' : 'Website Features'}</CardTitle>
                <CardDescription>
                  {currentLang === 'ar' ? 'تفعيل أو إلغاء تفعيل مزايا الموقع' : 'Enable or disable website features'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{currentLang === 'ar' ? 'طلبات العينات' : 'Sample Requests'}</Label>
                    <p className="text-sm text-muted-foreground">
                      {currentLang === 'ar' ? 'السماح للعملاء بطلب عينات' : 'Allow customers to request samples'}
                    </p>
                  </div>
                  <Switch
                    checked={settings.features.enableSampleRequests}
                    onCheckedChange={(checked) => handleSettingChange('features', 'enableSampleRequests', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{currentLang === 'ar' ? 'النشرة الإخبارية' : 'Newsletter'}</Label>
                    <p className="text-sm text-muted-foreground">
                      {currentLang === 'ar' ? 'تفعيل اشتراك النشرة الإخبارية' : 'Enable newsletter subscription'}
                    </p>
                  </div>
                  <Switch
                    checked={settings.features.enableNewsletter}
                    onCheckedChange={(checked) => handleSettingChange('features', 'enableNewsletter', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{currentLang === 'ar' ? 'الدردشة المباشرة' : 'Live Chat'}</Label>
                    <p className="text-sm text-muted-foreground">
                      {currentLang === 'ar' ? 'تفعيل نظام الدردشة المباشرة' : 'Enable live chat system'}
                    </p>
                  </div>
                  <Switch
                    checked={settings.features.enableLiveChat}
                    onCheckedChange={(checked) => handleSettingChange('features', 'enableLiveChat', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{currentLang === 'ar' ? 'تحليلات الموقع' : 'Analytics'}</Label>
                    <p className="text-sm text-muted-foreground">
                      {currentLang === 'ar' ? 'تفعيل تتبع تحليلات الموقع' : 'Enable website analytics tracking'}
                    </p>
                  </div>
                  <Switch
                    checked={settings.features.enableAnalytics}
                    onCheckedChange={(checked) => handleSettingChange('features', 'enableAnalytics', checked)}
                  />
                </div>

                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-destructive">{currentLang === 'ar' ? 'وضع الصيانة' : 'Maintenance Mode'}</Label>
                    <p className="text-sm text-muted-foreground">
                      {currentLang === 'ar' ? 'تفعيل وضع الصيانة للموقع' : 'Enable maintenance mode for the website'}
                    </p>
                  </div>
                  <Switch
                    checked={settings.features.maintenanceMode}
                    onCheckedChange={(checked) => handleSettingChange('features', 'maintenanceMode', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="shipping">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>{currentLang === 'ar' ? 'إعدادات الشحن' : 'Shipping Settings'}</CardTitle>
                <CardDescription>
                  {currentLang === 'ar' ? 'إدارة خيارات وأسعار الشحن' : 'Manage shipping options and rates'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{currentLang === 'ar' ? 'تفعيل الشحن' : 'Enable Shipping'}</Label>
                    <p className="text-sm text-muted-foreground">
                      {currentLang === 'ar' ? 'تفعيل خدمة الشحن للموقع' : 'Enable shipping service for the website'}
                    </p>
                  </div>
                  <Switch
                    checked={settings.shipping.enableShipping}
                    onCheckedChange={(checked) => handleSettingChange('shipping', 'enableShipping', checked)}
                  />
                </div>

                <div>
                  <Label>{currentLang === 'ar' ? 'حد الشحن المجاني' : 'Free Shipping Threshold'}</Label>
                  <Input
                    type="number"
                    value={settings.shipping.freeShippingThreshold}
                    onChange={(e) => handleSettingChange('shipping', 'freeShippingThreshold', parseFloat(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {currentLang === 'ar' ? 'المبلغ المطلوب للحصول على شحن مجاني' : 'Minimum order amount for free shipping'}
                  </p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">{currentLang === 'ar' ? 'خيارات الشحن' : 'Shipping Options'}</h4>
                  
                  {/* Domestic Shipping */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <Label>{currentLang === 'ar' ? 'الشحن المحلي' : 'Domestic Shipping'}</Label>
                        <Switch
                          checked={settings.shipping.domesticShipping.enabled}
                          onCheckedChange={(checked) => handleSettingChange('shipping', 'domesticShipping.enabled', checked)}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>{currentLang === 'ar' ? 'التكلفة' : 'Cost'}</Label>
                          <Input
                            type="number"
                            value={settings.shipping.domesticShipping.cost}
                            onChange={(e) => handleSettingChange('shipping', 'domesticShipping.cost', parseFloat(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label>{currentLang === 'ar' ? 'مدة التوصيل المتوقعة' : 'Estimated Days'}</Label>
                          <Input
                            value={settings.shipping.domesticShipping.estimatedDays}
                            onChange={(e) => handleSettingChange('shipping', 'domesticShipping.estimatedDays', e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <Tabs defaultValue="en">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="en">English</TabsTrigger>
                            <TabsTrigger value="ar">العربية</TabsTrigger>
                          </TabsList>
                          <TabsContent value="en">
                            <div>
                              <Label>Description (English)</Label>
                              <Input
                                value={settings.shipping.domesticShipping.description.en}
                                onChange={(e) => handleSettingChange('shipping', 'domesticShipping.description', e.target.value, 'en')}
                              />
                            </div>
                          </TabsContent>
                          <TabsContent value="ar">
                            <div>
                              <Label>الوصف (العربية)</Label>
                              <Input
                                value={settings.shipping.domesticShipping.description.ar}
                                onChange={(e) => handleSettingChange('shipping', 'domesticShipping.description', e.target.value, 'ar')}
                              />
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>
                    </CardContent>
                  </Card>

                  {/* International Shipping */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <Label>{currentLang === 'ar' ? 'الشحن الدولي' : 'International Shipping'}</Label>
                        <Switch
                          checked={settings.shipping.internationalShipping.enabled}
                          onCheckedChange={(checked) => handleSettingChange('shipping', 'internationalShipping.enabled', checked)}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>{currentLang === 'ar' ? 'التكلفة' : 'Cost'}</Label>
                          <Input
                            type="number"
                            value={settings.shipping.internationalShipping.cost}
                            onChange={(e) => handleSettingChange('shipping', 'internationalShipping.cost', parseFloat(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label>{currentLang === 'ar' ? 'مدة التوصيل المتوقعة' : 'Estimated Days'}</Label>
                          <Input
                            value={settings.shipping.internationalShipping.estimatedDays}
                            onChange={(e) => handleSettingChange('shipping', 'internationalShipping.estimatedDays', e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <Tabs defaultValue="en">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="en">English</TabsTrigger>
                            <TabsTrigger value="ar">العربية</TabsTrigger>
                          </TabsList>
                          <TabsContent value="en">
                            <div>
                              <Label>Description (English)</Label>
                              <Input
                                value={settings.shipping.internationalShipping.description.en}
                                onChange={(e) => handleSettingChange('shipping', 'internationalShipping.description', e.target.value, 'en')}
                              />
                            </div>
                          </TabsContent>
                          <TabsContent value="ar">
                            <div>
                              <Label>الوصف (العربية)</Label>
                              <Input
                                value={settings.shipping.internationalShipping.description.ar}
                                onChange={(e) => handleSettingChange('shipping', 'internationalShipping.description', e.target.value, 'ar')}
                              />
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Express Shipping */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <Label>{currentLang === 'ar' ? 'الشحن السريع' : 'Express Shipping'}</Label>
                        <Switch
                          checked={settings.shipping.expressShipping.enabled}
                          onCheckedChange={(checked) => handleSettingChange('shipping', 'expressShipping.enabled', checked)}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>{currentLang === 'ar' ? 'التكلفة' : 'Cost'}</Label>
                          <Input
                            type="number"
                            value={settings.shipping.expressShipping.cost}
                            onChange={(e) => handleSettingChange('shipping', 'expressShipping.cost', parseFloat(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label>{currentLang === 'ar' ? 'مدة التوصيل المتوقعة' : 'Estimated Days'}</Label>
                          <Input
                            value={settings.shipping.expressShipping.estimatedDays}
                            onChange={(e) => handleSettingChange('shipping', 'expressShipping.estimatedDays', e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <Tabs defaultValue="en">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="en">English</TabsTrigger>
                            <TabsTrigger value="ar">العربية</TabsTrigger>
                          </TabsList>
                          <TabsContent value="en">
                            <div>
                              <Label>Description (English)</Label>
                              <Input
                                value={settings.shipping.expressShipping.description.en}
                                onChange={(e) => handleSettingChange('shipping', 'expressShipping.description', e.target.value, 'en')}
                              />
                            </div>
                          </TabsContent>
                          <TabsContent value="ar">
                            <div>
                              <Label>الوصف (العربية)</Label>
                              <Input
                                value={settings.shipping.expressShipping.description.ar}
                                onChange={(e) => handleSettingChange('shipping', 'expressShipping.description', e.target.value, 'ar')}
                              />
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="taxes">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>{currentLang === 'ar' ? 'إعدادات الضرائب' : 'Tax Settings'}</CardTitle>
                <CardDescription>
                  {currentLang === 'ar' ? 'إدارة معدلات الضرائب والإعدادات' : 'Manage tax rates and settings'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{currentLang === 'ar' ? 'تفعيل الضرائب' : 'Enable Taxes'}</Label>
                    <p className="text-sm text-muted-foreground">
                      {currentLang === 'ar' ? 'تفعيل حساب الضرائب على المنتجات' : 'Enable tax calculation on products'}
                    </p>
                  </div>
                  <Switch
                    checked={settings.taxes.enableTaxes}
                    onCheckedChange={(checked) => handleSettingChange('taxes', 'enableTaxes', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>{currentLang === 'ar' ? 'الضريبة مشمولة في السعر' : 'Tax Included in Price'}</Label>
                    <p className="text-sm text-muted-foreground">
                      {currentLang === 'ar' ? 'هل الضريبة مشمولة في أسعار المنتجات؟' : 'Are taxes included in product prices?'}
                    </p>
                  </div>
                  <Switch
                    checked={settings.taxes.taxIncludedInPrice}
                    onCheckedChange={(checked) => handleSettingChange('taxes', 'taxIncludedInPrice', checked)}
                  />
                </div>

                <div>
                  <Label>{currentLang === 'ar' ? 'معدل الضريبة الافتراضي (%)' : 'Default Tax Rate (%)'}</Label>
                  <Input
                    type="number"
                    value={settings.taxes.defaultTaxRate}
                    onChange={(e) => handleSettingChange('taxes', 'defaultTaxRate', parseFloat(e.target.value))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>{currentLang === 'ar' ? 'عرض تفصيل الضرائب' : 'Display Tax Breakdown'}</Label>
                    <p className="text-sm text-muted-foreground">
                      {currentLang === 'ar' ? 'عرض تفصيل الضرائب في الفاتورة' : 'Show tax breakdown in invoices'}
                    </p>
                  </div>
                  <Switch
                    checked={settings.taxes.displayTaxBreakdown}
                    onCheckedChange={(checked) => handleSettingChange('taxes', 'displayTaxBreakdown', checked)}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">{currentLang === 'ar' ? 'معدلات الضرائب حسب البلد' : 'Tax Rates by Country'}</h4>
                  
                  {settings.taxes.taxRates.map((taxRate, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <Label>{taxRate.name[currentLang]}</Label>
                          <Switch
                            checked={taxRate.enabled}
                            onCheckedChange={(checked) => {
                              const newTaxRates = [...settings.taxes.taxRates];
                              newTaxRates[index].enabled = checked;
                              handleSettingChange('taxes', 'taxRates', newTaxRates);
                            }}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>{currentLang === 'ar' ? 'المعدل (%)' : 'Rate (%)'}</Label>
                            <Input
                              type="number"
                              value={taxRate.rate}
                              onChange={(e) => {
                                const newTaxRates = [...settings.taxes.taxRates];
                                newTaxRates[index].rate = parseFloat(e.target.value);
                                handleSettingChange('taxes', 'taxRates', newTaxRates);
                              }}
                            />
                          </div>
                          <div>
                            <Label>{currentLang === 'ar' ? 'البلدان' : 'Countries'}</Label>
                            <Input
                              value={taxRate.countries.join(', ')}
                              onChange={(e) => {
                                const newTaxRates = [...settings.taxes.taxRates];
                                newTaxRates[index].countries = e.target.value.split(',').map(c => c.trim());
                                handleSettingChange('taxes', 'taxRates', newTaxRates);
                              }}
                              placeholder="EG, SA, AE"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="payment">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>{currentLang === 'ar' ? 'إعدادات بوابات الدفع' : 'Payment Gateways Settings'}</CardTitle>
                <CardDescription>
                  {currentLang === 'ar' ? 'إدارة بوابات الدفع والتحويل البنكي - جميع البيانات مشفرة بشكل آمن' : 'Manage payment gateways and bank transfer - All data is securely encrypted'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {currentLang === 'ar' 
                      ? 'استخدم لوحة "المدفوعات" في القائمة الجانبية لإدارة بوابات الدفع بشكل متقدم'
                      : 'Use the "Payments" panel in the sidebar to manage payment gateways in detail'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {currentLang === 'ar'
                      ? 'يمكنك تكوين: PayPal • Paymob • Fawry • التحويل البنكي'
                      : 'You can configure: PayPal • Paymob • Fawry • Bank Transfer'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="localization">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>{currentLang === 'ar' ? 'إعدادات الترجمة' : 'Localization Settings'}</CardTitle>
                <CardDescription>
                  {currentLang === 'ar' ? 'إعدادات اللغة والمنطقة' : 'Language and region settings'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>{currentLang === 'ar' ? 'اللغة الافتراضية' : 'Default Language'}</Label>
                  <Select 
                    value={settings.localization.defaultLanguage} 
                    onValueChange={(value) => handleSettingChange('localization', 'defaultLanguage', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ar">العربية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{currentLang === 'ar' ? 'تفعيل RTL' : 'Enable RTL'}</Label>
                    <p className="text-sm text-muted-foreground">
                      {currentLang === 'ar' ? 'دعم الكتابة من اليمين لليسار' : 'Right-to-left text direction support'}
                    </p>
                  </div>
                  <Switch
                    checked={settings.localization.enableRTL}
                    onCheckedChange={(checked) => handleSettingChange('localization', 'enableRTL', checked)}
                  />
                </div>
                
                <div>
                  <Label>{currentLang === 'ar' ? 'تنسيق التاريخ' : 'Date Format'}</Label>
                  <Select 
                    value={settings.localization.dateFormat} 
                    onValueChange={(value) => handleSettingChange('localization', 'dateFormat', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>{currentLang === 'ar' ? 'رمز العملة' : 'Currency Symbol'}</Label>
                  <Input
                    value={settings.localization.currencySymbol}
                    onChange={(e) => handleSettingChange('localization', 'currencySymbol', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};