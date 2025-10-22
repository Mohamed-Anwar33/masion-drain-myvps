import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Image, Trash2, Edit, Download, Search, Filter, FolderPlus, Tag, Grid, List } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { mediaService, MediaItem } from "@/services/mediaService";

interface AdminMediaProps {
  currentLang: 'en' | 'ar';
}

type UiMedia = MediaItem & { sizeFormatted: string; dimensions: string; usedIn: string[] };

export const AdminMedia = ({ currentLang }: AdminMediaProps) => {
  const [media, setMedia] = useState<UiMedia[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<UiMedia | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [editData, setEditData] = useState({
    alt: { en: "", ar: "" },
    caption: { en: "", ar: "" },
    tags: [] as string[]
  });
  const [uploadFolder, setUploadFolder] = useState('maison-darin');
  const [newTag, setNewTag] = useState('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        const uploaded = await mediaService.uploadImage(file, {
          folder: uploadFolder,
          altEn: `Image uploaded to ${uploadFolder}`,
          altAr: `صورة مرفوعة إلى ${uploadFolder}`
        });
        setMedia(prev => [
          ...prev,
          {
            ...uploaded,
            sizeFormatted: uploaded.sizeFormatted || `${(uploaded.size / (1024 * 1024)).toFixed(1)} MB`,
            dimensions: uploaded.width && uploaded.height ? `${uploaded.width}x${uploaded.height}` : '—',
            usedIn: [],
          }
        ]);
      }
      toast({
        title: currentLang === 'ar' ? "تم رفع الملفات" : "Files Uploaded",
        description: currentLang === 'ar' ? "تم رفع الصور بنجاح" : "Images uploaded successfully",
      });
    } catch (e: any) {
      toast({
        title: currentLang === 'ar' ? 'خطأ' : 'Error',
        description: e?.message || (currentLang === 'ar' ? 'فشل رفع الصور' : 'Failed to upload images'),
        variant: 'destructive'
      });
    }
  };

  const handleEditMedia = (mediaItem: any) => {
    setSelectedMedia(mediaItem);
    setEditData({
      alt: mediaItem.alt,
      caption: mediaItem.caption || { en: "", ar: "" },
      tags: mediaItem.tags || []
    });
    setIsDialogOpen(true);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !editData.tags.includes(newTag.trim())) {
      setEditData({
        ...editData,
        tags: [...editData.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditData({
      ...editData,
      tags: editData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleSaveMedia = async () => {
    try {
      if (selectedMedia) {
        const updated = await mediaService.updateMetadata(selectedMedia._id, { 
          alt: editData.alt,
          tags: editData.tags
        });
        setMedia(media.map(m => m._id === selectedMedia._id ? {
          ...m,
          alt: updated.alt,
          tags: updated.tags,
        } : m));
        toast({
          title: currentLang === 'ar' ? "تم تحديث الوسائط" : "Media Updated",
          description: currentLang === 'ar' ? "تم تحديث معلومات الوسائط بنجاح" : "Media information updated successfully",
        });
      }
    } catch (e: any) {
      toast({
        title: currentLang === 'ar' ? 'خطأ' : 'Error',
        description: e?.message || (currentLang === 'ar' ? 'فشل تحديث الوسائط' : 'Failed to update media'),
        variant: 'destructive'
      });
    } finally {
      setIsDialogOpen(false);
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    try {
      await mediaService.delete(mediaId);
      setMedia(media.filter(m => m._id !== mediaId));
      toast({
        title: currentLang === 'ar' ? "تم حذف الوسائط" : "Media Deleted",
        description: currentLang === 'ar' ? "تم حذف الملف بنجاح" : "File deleted successfully",
      });
    } catch (e: any) {
      toast({
        title: currentLang === 'ar' ? 'خطأ' : 'Error',
        description: e?.message || (currentLang === 'ar' ? 'فشل حذف الملف' : 'Failed to delete file'),
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await mediaService.list({ page: 1, limit: 40, sortBy: 'uploadedAt', sortOrder: 'desc' });
        const normalized: UiMedia[] = res.media.map(item => ({
          ...item,
          sizeFormatted: item.sizeFormatted || `${(item.size / (1024 * 1024)).toFixed(1)} MB`,
          dimensions: item.width && item.height ? `${item.width}x${item.height}` : '—',
          usedIn: [],
        }));
        setMedia(normalized);
      } catch {}
    };
    load();
  }, []);

  const filteredMedia = media.filter(item => {
    const matchesSearch = item.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.alt[currentLang].toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || item.type.includes(filterType);
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">
            {currentLang === 'ar' ? 'مكتبة الوسائط' : 'Media Library'}
          </h2>
          <p className="text-muted-foreground">
            {currentLang === 'ar' ? 'إدارة الصور والملفات' : 'Manage images and files'}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={uploadFolder} onValueChange={setUploadFolder}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={currentLang === 'ar' ? 'اختر المجلد' : 'Select Folder'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="maison-darin">
                <div className="flex items-center gap-2">
                  <FolderPlus className="h-4 w-4" />
                  Maison Darin
                </div>
              </SelectItem>
              <SelectItem value="products">
                <div className="flex items-center gap-2">
                  <FolderPlus className="h-4 w-4" />
                  {currentLang === 'ar' ? 'المنتجات' : 'Products'}
                </div>
              </SelectItem>
              <SelectItem value="collections">
                <div className="flex items-center gap-2">
                  <FolderPlus className="h-4 w-4" />
                  {currentLang === 'ar' ? 'المجموعات' : 'Collections'}
                </div>
              </SelectItem>
              <SelectItem value="content">
                <div className="flex items-center gap-2">
                  <FolderPlus className="h-4 w-4" />
                  {currentLang === 'ar' ? 'المحتوى' : 'Content'}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            {currentLang === 'ar' ? 'رفع ملفات' : 'Upload Files'}
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            accept="image/*"
            className="hidden"
          />
        </div>
      </div>

      <Tabs defaultValue="grid" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="grid">
              {currentLang === 'ar' ? 'عرض الشبكة' : 'Grid View'}
            </TabsTrigger>
            <TabsTrigger value="list">
              {currentLang === 'ar' ? 'عرض القائمة' : 'List View'}
            </TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {currentLang === 'ar' ? 'جميع الملفات' : 'All Files'}
                </SelectItem>
                <SelectItem value="image/jpeg">JPEG</SelectItem>
                <SelectItem value="image/png">PNG</SelectItem>
                <SelectItem value="image/webp">WebP</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={currentLang === 'ar' ? 'البحث في الملفات...' : 'Search files...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </div>

        <TabsContent value="grid">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMedia.map((item) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group"
              >
                <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={item.url}
                      alt={item.alt[currentLang]}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEditMedia(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDeleteMedia(item._id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h4 className="font-medium truncate">{item.filename}</h4>
                      <p className="text-sm text-muted-foreground">
                        {item.dimensions} • {item.sizeFormatted}
                      </p>
                      {item.usedIn.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.usedIn.map((usage, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {usage}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardContent className="p-0">
              <div className="space-y-0">
                {filteredMedia.map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center gap-4 p-4 border-b last:border-b-0 hover:bg-muted/50"
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
                      <img
                        src={item.url}
                        alt={item.alt[currentLang]}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{item.filename}</h4>
                      <p className="text-sm text-muted-foreground">
                        {item.alt[currentLang] || 'No description'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.dimensions} • {item.sizeFormatted} • {currentLang === 'ar' ? 'رُفع في' : 'Uploaded on'} {new Date(item.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.usedIn.length > 0 && (
                        <Badge variant="outline">
                          {currentLang === 'ar' ? 'مستخدم' : 'In Use'}
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditMedia(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteMedia(item._id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Media Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {currentLang === 'ar' ? 'تعديل معلومات الوسائط' : 'Edit Media Information'}
            </DialogTitle>
            <DialogDescription>
              {currentLang === 'ar' 
                ? 'تحديث النص البديل والتعليق التوضيحي للصورة'
                : 'Update the alt text and caption for this image'
              }
            </DialogDescription>
          </DialogHeader>
          
          {selectedMedia && (
            <div className="space-y-4">
              <div className="w-full h-48 rounded-lg overflow-hidden bg-muted">
                <img
                  src={selectedMedia.url}
                  alt={selectedMedia.alt[currentLang]}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <Tabs defaultValue="en" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="en">English</TabsTrigger>
                  <TabsTrigger value="ar">العربية</TabsTrigger>
                </TabsList>
                
                <TabsContent value="en" className="space-y-4">
                  <div>
                    <Label htmlFor="alt-en">Alt Text (English)</Label>
                    <Input
                      id="alt-en"
                      value={editData.alt.en}
                      onChange={(e) => setEditData({
                        ...editData,
                        alt: { ...editData.alt, en: e.target.value }
                      })}
                      placeholder="Describe the image for accessibility"
                    />
                  </div>
                  <div>
                    <Label htmlFor="caption-en">Caption (English)</Label>
                    <Textarea
                      id="caption-en"
                      value={editData.caption.en}
                      onChange={(e) => setEditData({
                        ...editData,
                        caption: { ...editData.caption, en: e.target.value }
                      })}
                      placeholder="Optional caption for the image"
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="ar" className="space-y-4">
                  <div>
                    <Label htmlFor="alt-ar">النص البديل (العربية)</Label>
                    <Input
                      id="alt-ar"
                      value={editData.alt.ar}
                      onChange={(e) => setEditData({
                        ...editData,
                        alt: { ...editData.alt, ar: e.target.value }
                      })}
                      placeholder="صف الصورة لإمكانية الوصول"
                    />
                  </div>
                  <div>
                    <Label htmlFor="caption-ar">التعليق التوضيحي (العربية)</Label>
                    <Textarea
                      id="caption-ar"
                      value={editData.caption.ar}
                      onChange={(e) => setEditData({
                        ...editData,
                        caption: { ...editData.caption, ar: e.target.value }
                      })}
                      placeholder="تعليق توضيحي اختياري للصورة"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              {/* Tags Management */}
              <div className="space-y-4">
                <Label>{currentLang === 'ar' ? 'العلامات' : 'Tags'}</Label>
                
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder={currentLang === 'ar' ? 'إضافة علامة جديدة' : 'Add new tag'}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  />
                  <Button type="button" onClick={handleAddTag} size="sm">
                    <Tag className="h-4 w-4 mr-2" />
                    {currentLang === 'ar' ? 'إضافة' : 'Add'}
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {editData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 text-xs hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {currentLang === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button onClick={handleSaveMedia}>
                  {currentLang === 'ar' ? 'حفظ' : 'Save'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};