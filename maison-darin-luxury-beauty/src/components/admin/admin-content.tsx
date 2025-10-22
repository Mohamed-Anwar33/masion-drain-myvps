import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, RotateCcw, Eye, History, Download, Upload, AlertTriangle, Clock, User } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { translations } from "@/data/translations";
import { contentService, SectionKey } from "@/services/contentService";
import { RichTextEditor } from "./RichTextEditor";

interface AdminContentProps {
  currentLang: 'en' | 'ar';
}

interface ContentHistory {
  version: number;
  isActive: boolean;
  updatedAt: string;
  updatedBy: { email: string };
  changeLog: string;
  id: string;
}

export const AdminContent = ({ currentLang }: AdminContentProps) => {
  const [contentData, setContentData] = useState(translations);
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedSection, setSelectedSection] = useState<SectionKey | null>(null);
  const [sectionHistory, setSectionHistory] = useState<ContentHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const { toast } = useToast();

  const handleContentChange = (section: string, field: string, language: 'en' | 'ar', value: string) => {
    const newData = { ...contentData };
    
    if (section === 'nav' || section === 'hero' || section === 'about' || section === 'collections' || section === 'contact') {
      if (field.includes('.')) {
        const [mainField, subField] = field.split('.');
        if (!newData[language][section][mainField]) {
          newData[language][section][mainField] = {};
        }
        newData[language][section][mainField][subField] = value;
      } else {
        newData[language][section][field] = value;
      }
    }
    
    setContentData(newData);
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      // Bulk update all sections to keep DB as single source of truth
      const updates: Partial<Record<SectionKey, any>> = {
        nav: { en: contentData.en.nav, ar: contentData.ar.nav },
        hero: { en: contentData.en.hero, ar: contentData.ar.hero },
        about: { en: contentData.en.about, ar: contentData.ar.about },
        collections: { en: contentData.en.collections, ar: contentData.ar.collections },
        contact: { en: contentData.en.contact, ar: contentData.ar.contact },
        footer: { en: contentData.en.footer || {}, ar: contentData.ar.footer || {} },
      };
      await contentService.bulkUpdate(updates, 'Admin content save');
      toast({
        title: currentLang === 'ar' ? "تم حفظ المحتوى" : "Content Saved",
        description: currentLang === 'ar' ? "تم حفظ التغييرات بنجاح" : "Changes saved successfully",
      });
      setHasChanges(false);
    } catch (error: any) {
      toast({
        title: currentLang === 'ar' ? 'خطأ' : 'Error',
        description: error?.message || (currentLang === 'ar' ? 'فشل حفظ المحتوى' : 'Failed to save content'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setContentData(translations);
    setHasChanges(false);
    toast({
      title: currentLang === 'ar' ? "تم إعادة تعيين المحتوى" : "Content Reset",
      description: currentLang === 'ar' ? "تم إعادة تعيين المحتوى للحالة الأصلية" : "Content reset to original state",
    });
  };

  const handleViewHistory = async (section: SectionKey) => {
    try {
      setBackupLoading(true);
      setSelectedSection(section);
      const history = await contentService.getHistory(section, 20);
      setSectionHistory(history);
      setShowHistory(true);
    } catch (error: any) {
      toast({
        title: currentLang === 'ar' ? 'خطأ' : 'Error',
        description: error?.message || (currentLang === 'ar' ? 'فشل تحميل التاريخ' : 'Failed to load history'),
        variant: 'destructive'
      });
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRollback = async (versionId: string) => {
    if (!selectedSection) return;
    
    try {
      setBackupLoading(true);
      await contentService.rollback(selectedSection, versionId, 'Rollback from admin panel');
      
      // Reload content data
      const remote = await contentService.getTranslations();
      const merged = {
        en: { ...contentData.en, ...Object.fromEntries(Object.entries(remote).map(([k, v]: any) => [k, v.en])) },
        ar: { ...contentData.ar, ...Object.fromEntries(Object.entries(remote).map(([k, v]: any) => [k, v.ar])) },
      } as typeof translations;
      setContentData(merged);
      setHasChanges(false);
      setShowHistory(false);
      
      toast({
        title: currentLang === 'ar' ? "تم استرجاع النسخة" : "Version Restored",
        description: currentLang === 'ar' ? "تم استرجاع النسخة السابقة بنجاح" : "Previous version restored successfully",
      });
    } catch (error: any) {
      toast({
        title: currentLang === 'ar' ? 'خطأ' : 'Error',
        description: error?.message || (currentLang === 'ar' ? 'فشل استرجاع النسخة' : 'Failed to restore version'),
        variant: 'destructive'
      });
    } finally {
      setBackupLoading(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      const allContent = await contentService.getTranslations();
      const backup = {
        timestamp: new Date().toISOString(),
        content: allContent,
        version: "1.0"
      };
      
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `maison-darin-content-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: currentLang === 'ar' ? "تم تصدير النسخة الاحتياطية" : "Backup Exported",
        description: currentLang === 'ar' ? "تم تصدير النسخة الاحتياطية بنجاح" : "Backup exported successfully",
      });
    } catch (error: any) {
      toast({
        title: currentLang === 'ar' ? 'خطأ' : 'Error',
        description: error?.message || (currentLang === 'ar' ? 'فشل تصدير النسخة الاحتياطية' : 'Failed to export backup'),
        variant: 'destructive'
      });
    }
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const backup = JSON.parse(e.target?.result as string);
        if (!backup.content) {
          throw new Error('Invalid backup file format');
        }

        // Validate and merge backup content
        const merged = {
          en: { ...contentData.en, ...Object.fromEntries(Object.entries(backup.content).map(([k, v]: any) => [k, v.en])) },
          ar: { ...contentData.ar, ...Object.fromEntries(Object.entries(backup.content).map(([k, v]: any) => [k, v.ar])) },
        } as typeof translations;
        
        setContentData(merged);
        setHasChanges(true);
        
        toast({
          title: currentLang === 'ar' ? "تم استيراد النسخة الاحتياطية" : "Backup Imported",
          description: currentLang === 'ar' ? "تم استيراد النسخة الاحتياطية بنجاح. لا تنس حفظ التغييرات." : "Backup imported successfully. Don't forget to save changes.",
        });
      } catch (error: any) {
        toast({
          title: currentLang === 'ar' ? 'خطأ' : 'Error',
          description: error?.message || (currentLang === 'ar' ? 'فشل استيراد النسخة الاحتياطية' : 'Failed to import backup'),
          variant: 'destructive'
        });
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  };

  const ContentField = ({ 
    label, 
    value, 
    onChange, 
    multiline = false, 
    placeholder = "",
    richText = false
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    multiline?: boolean;
    placeholder?: string;
    richText?: boolean;
  }) => (
    <div className="space-y-2">
      {richText ? (
        <RichTextEditor
          label={label}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          currentLang={currentLang}
        />
      ) : multiline ? (
        <>
          <Label className="text-sm font-medium">{label}</Label>
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="min-h-24"
            dir={currentLang === 'ar' ? 'rtl' : 'ltr'}
          />
        </>
      ) : (
        <>
          <Label className="text-sm font-medium">{label}</Label>
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            dir={currentLang === 'ar' ? 'rtl' : 'ltr'}
          />
        </>
      )}
    </div>
  );

  useEffect(() => {
    // Load real content from backend on mount
    const load = async () => {
      try {
        setLoading(true);
        const remote = await contentService.getTranslations();
        // Merge into current structure to avoid UI crashes if some keys missing
        const merged = {
          en: { ...contentData.en, ...Object.fromEntries(Object.entries(remote).map(([k, v]: any) => [k, v.en])) },
          ar: { ...contentData.ar, ...Object.fromEntries(Object.entries(remote).map(([k, v]: any) => [k, v.ar])) },
        } as typeof translations;
        setContentData(merged);
        setHasChanges(false);
      } catch (e) {
        // keep defaults if backend not ready
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">
            {currentLang === 'ar' ? 'إدارة المحتوى' : 'Content Management'}
          </h2>
          <p className="text-muted-foreground">
            {currentLang === 'ar' ? 'تحرير نصوص الموقع باللغتين العربية والإنجليزية' : 'Edit website content in both Arabic and English'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportBackup}>
            <Download className="h-4 w-4 mr-2" />
            {currentLang === 'ar' ? 'تصدير نسخة احتياطية' : 'Export Backup'}
          </Button>
          
          <Button variant="outline" onClick={() => document.getElementById('backup-import')?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            {currentLang === 'ar' ? 'استيراد نسخة احتياطية' : 'Import Backup'}
          </Button>
          <input
            id="backup-import"
            type="file"
            accept=".json"
            onChange={handleImportBackup}
            className="hidden"
          />
          
          {hasChanges && (
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              {currentLang === 'ar' ? 'إعادة تعيين' : 'Reset'}
            </Button>
          )}
          <Button onClick={handleSave} disabled={!hasChanges || loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? (currentLang === 'ar' ? 'جارٍ الحفظ...' : 'Saving...') : (currentLang === 'ar' ? 'حفظ التغييرات' : 'Save Changes')}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="en" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="en">English Content</TabsTrigger>
          <TabsTrigger value="ar">المحتوى العربي</TabsTrigger>
        </TabsList>

        <TabsContent value="en" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Navigation */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Navigation</CardTitle>
                    <CardDescription>Main navigation menu items</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewHistory('nav')}
                    disabled={backupLoading}
                  >
                    <History className="h-4 w-4 mr-2" />
                    {currentLang === 'ar' ? 'التاريخ' : 'History'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ContentField
                  label="Home"
                  value={contentData.en.nav.home}
                  onChange={(value) => handleContentChange('nav', 'home', 'en', value)}
                />
                <ContentField
                  label="Collections"
                  value={contentData.en.nav.collections}
                  onChange={(value) => handleContentChange('nav', 'collections', 'en', value)}
                />
                <ContentField
                  label="About"
                  value={contentData.en.nav.about}
                  onChange={(value) => handleContentChange('nav', 'about', 'en', value)}
                />
                <ContentField
                  label="Contact"
                  value={contentData.en.nav.contact}
                  onChange={(value) => handleContentChange('nav', 'contact', 'en', value)}
                />
              </CardContent>
            </Card>

            {/* Hero Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Hero Section</CardTitle>
                    <CardDescription>Main landing page hero content</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewHistory('hero')}
                    disabled={backupLoading}
                  >
                    <History className="h-4 w-4 mr-2" />
                    {currentLang === 'ar' ? 'التاريخ' : 'History'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ContentField
                  label="Badge Text"
                  value={contentData.en.hero.badge}
                  onChange={(value) => handleContentChange('hero', 'badge', 'en', value)}
                />
                <ContentField
                  label="Main Title"
                  value={contentData.en.hero.title}
                  onChange={(value) => handleContentChange('hero', 'title', 'en', value)}
                />
                <ContentField
                  label="Subtitle"
                  value={contentData.en.hero.subtitle}
                  onChange={(value) => handleContentChange('hero', 'subtitle', 'en', value)}
                  richText
                />
                <ContentField
                  label="Primary CTA"
                  value={contentData.en.hero.cta.primary}
                  onChange={(value) => handleContentChange('hero', 'cta.primary', 'en', value)}
                />
                <ContentField
                  label="Secondary CTA"
                  value={contentData.en.hero.cta.secondary}
                  onChange={(value) => handleContentChange('hero', 'cta.secondary', 'en', value)}
                />
              </CardContent>
            </Card>

            {/* About Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>About Section</CardTitle>
                    <CardDescription>Company story and values</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewHistory('about')}
                    disabled={backupLoading}
                  >
                    <History className="h-4 w-4 mr-2" />
                    {currentLang === 'ar' ? 'التاريخ' : 'History'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ContentField
                  label="Section Title"
                  value={contentData.en.about.title}
                  onChange={(value) => handleContentChange('about', 'title', 'en', value)}
                />
                <ContentField
                  label="Subtitle"
                  value={contentData.en.about.subtitle}
                  onChange={(value) => handleContentChange('about', 'subtitle', 'en', value)}
                />
                <ContentField
                  label="Description"
                  value={contentData.en.about.description}
                  onChange={(value) => handleContentChange('about', 'description', 'en', value)}
                  richText
                />
              </CardContent>
            </Card>

            {/* Collections Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Collections Section</CardTitle>
                    <CardDescription>Featured collections content</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewHistory('collections')}
                    disabled={backupLoading}
                  >
                    <History className="h-4 w-4 mr-2" />
                    {currentLang === 'ar' ? 'التاريخ' : 'History'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ContentField
                  label="Section Title"
                  value={contentData.en.collections.title}
                  onChange={(value) => handleContentChange('collections', 'title', 'en', value)}
                />
                <ContentField
                  label="Subtitle"
                  value={contentData.en.collections.subtitle}
                  onChange={(value) => handleContentChange('collections', 'subtitle', 'en', value)}
                />
              </CardContent>
            </Card>

            {/* Contact Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Contact Section</CardTitle>
                    <CardDescription>Contact information and CTA</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewHistory('contact')}
                    disabled={backupLoading}
                  >
                    <History className="h-4 w-4 mr-2" />
                    {currentLang === 'ar' ? 'التاريخ' : 'History'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ContentField
                  label="Section Title"
                  value={contentData.en.contact.title}
                  onChange={(value) => handleContentChange('contact', 'title', 'en', value)}
                />
                <ContentField
                  label="Subtitle"
                  value={contentData.en.contact.subtitle}
                  onChange={(value) => handleContentChange('contact', 'subtitle', 'en', value)}
                />
                <ContentField
                  label="CTA Button"
                  value={contentData.en.contact.cta}
                  onChange={(value) => handleContentChange('contact', 'cta', 'en', value)}
                />
                <ContentField
                  label="Address"
                  value={contentData.en.contact.address}
                  onChange={(value) => handleContentChange('contact', 'address', 'en', value)}
                />
                <ContentField
                  label="Email"
                  value={contentData.en.contact.email}
                  onChange={(value) => handleContentChange('contact', 'email', 'en', value)}
                />
                <ContentField
                  label="Phone"
                  value={contentData.en.contact.phone}
                  onChange={(value) => handleContentChange('contact', 'phone', 'en', value)}
                />
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="ar" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Navigation - Arabic */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>التنقل</CardTitle>
                    <CardDescription>عناصر قائمة التنقل الرئيسية</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewHistory('nav')}
                    disabled={backupLoading}
                  >
                    <History className="h-4 w-4 mr-2" />
                    التاريخ
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ContentField
                  label="الرئيسية"
                  value={contentData.ar.nav.home}
                  onChange={(value) => handleContentChange('nav', 'home', 'ar', value)}
                />
                <ContentField
                  label="المجموعات"
                  value={contentData.ar.nav.collections}
                  onChange={(value) => handleContentChange('nav', 'collections', 'ar', value)}
                />
                <ContentField
                  label="قصتنا"
                  value={contentData.ar.nav.about}
                  onChange={(value) => handleContentChange('nav', 'about', 'ar', value)}
                />
                <ContentField
                  label="اتصل بنا"
                  value={contentData.ar.nav.contact}
                  onChange={(value) => handleContentChange('nav', 'contact', 'ar', value)}
                />
              </CardContent>
            </Card>

            {/* Hero Section - Arabic */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>القسم الرئيسي</CardTitle>
                    <CardDescription>محتوى الصفحة الرئيسية</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewHistory('hero')}
                    disabled={backupLoading}
                  >
                    <History className="h-4 w-4 mr-2" />
                    التاريخ
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ContentField
                  label="نص الشارة"
                  value={contentData.ar.hero.badge}
                  onChange={(value) => handleContentChange('hero', 'badge', 'ar', value)}
                />
                <ContentField
                  label="العنوان الرئيسي"
                  value={contentData.ar.hero.title}
                  onChange={(value) => handleContentChange('hero', 'title', 'ar', value)}
                />
                <ContentField
                  label="العنوان الفرعي"
                  value={contentData.ar.hero.subtitle}
                  onChange={(value) => handleContentChange('hero', 'subtitle', 'ar', value)}
                  richText
                />
                <ContentField
                  label="الزر الأساسي"
                  value={contentData.ar.hero.cta.primary}
                  onChange={(value) => handleContentChange('hero', 'cta.primary', 'ar', value)}
                />
                <ContentField
                  label="الزر الثانوي"
                  value={contentData.ar.hero.cta.secondary}
                  onChange={(value) => handleContentChange('hero', 'cta.secondary', 'ar', value)}
                />
              </CardContent>
            </Card>

            {/* About Section - Arabic */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>قسم عن الشركة</CardTitle>
                    <CardDescription>قصة الشركة والقيم</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewHistory('about')}
                    disabled={backupLoading}
                  >
                    <History className="h-4 w-4 mr-2" />
                    التاريخ
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ContentField
                  label="عنوان القسم"
                  value={contentData.ar.about.title}
                  onChange={(value) => handleContentChange('about', 'title', 'ar', value)}
                />
                <ContentField
                  label="العنوان الفرعي"
                  value={contentData.ar.about.subtitle}
                  onChange={(value) => handleContentChange('about', 'subtitle', 'ar', value)}
                />
                <ContentField
                  label="الوصف"
                  value={contentData.ar.about.description}
                  onChange={(value) => handleContentChange('about', 'description', 'ar', value)}
                  richText
                />
              </CardContent>
            </Card>

            {/* Collections Section - Arabic */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>قسم المجموعات</CardTitle>
                    <CardDescription>محتوى المجموعات المميزة</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewHistory('collections')}
                    disabled={backupLoading}
                  >
                    <History className="h-4 w-4 mr-2" />
                    التاريخ
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ContentField
                  label="عنوان القسم"
                  value={contentData.ar.collections.title}
                  onChange={(value) => handleContentChange('collections', 'title', 'ar', value)}
                />
                <ContentField
                  label="العنوان الفرعي"
                  value={contentData.ar.collections.subtitle}
                  onChange={(value) => handleContentChange('collections', 'subtitle', 'ar', value)}
                />
              </CardContent>
            </Card>

            {/* Contact Section - Arabic */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>قسم التواصل</CardTitle>
                    <CardDescription>معلومات الاتصال ودعوة للعمل</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewHistory('contact')}
                    disabled={backupLoading}
                  >
                    <History className="h-4 w-4 mr-2" />
                    التاريخ
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ContentField
                  label="عنوان القسم"
                  value={contentData.ar.contact.title}
                  onChange={(value) => handleContentChange('contact', 'title', 'ar', value)}
                />
                <ContentField
                  label="العنوان الفرعي"
                  value={contentData.ar.contact.subtitle}
                  onChange={(value) => handleContentChange('contact', 'subtitle', 'ar', value)}
                />
                <ContentField
                  label="زر الدعوة للعمل"
                  value={contentData.ar.contact.cta}
                  onChange={(value) => handleContentChange('contact', 'cta', 'ar', value)}
                />
                <ContentField
                  label="العنوان"
                  value={contentData.ar.contact.address}
                  onChange={(value) => handleContentChange('contact', 'address', 'ar', value)}
                />
                <ContentField
                  label="البريد الإلكتروني"
                  value={contentData.ar.contact.email}
                  onChange={(value) => handleContentChange('contact', 'email', 'ar', value)}
                />
                <ContentField
                  label="الهاتف"
                  value={contentData.ar.contact.phone}
                  onChange={(value) => handleContentChange('contact', 'phone', 'ar', value)}
                />
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Content History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {currentLang === 'ar' ? 'تاريخ المحتوى' : 'Content History'} - {selectedSection}
            </DialogTitle>
            <DialogDescription>
              {currentLang === 'ar' 
                ? 'عرض وإدارة النسخ السابقة من المحتوى'
                : 'View and manage previous versions of content'
              }
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-4">
              {sectionHistory.map((version, index) => (
                <Card key={version.id} className={version.isActive ? 'border-primary' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={version.isActive ? 'default' : 'secondary'}>
                            {currentLang === 'ar' ? 'النسخة' : 'Version'} {version.version}
                          </Badge>
                          {version.isActive && (
                            <Badge variant="outline">
                              {currentLang === 'ar' ? 'النسخة الحالية' : 'Current'}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(version.updatedAt).toLocaleString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {version.updatedBy?.email || 'Unknown'}
                          </div>
                        </div>
                        
                        {version.changeLog && (
                          <p className="text-sm text-muted-foreground">
                            {version.changeLog}
                          </p>
                        )}
                      </div>
                      
                      {!version.isActive && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRollback(version.id)}
                          disabled={backupLoading}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          {currentLang === 'ar' ? 'استرجاع' : 'Restore'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {sectionHistory.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {currentLang === 'ar' ? 'لا يوجد تاريخ متاح' : 'No history available'}
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};