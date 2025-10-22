import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { categoryService, Category } from '@/services/categoryService';



interface CategoryManagerProps {
  currentLang: 'en' | 'ar';
  onCategorySelect?: (category: Category) => void;
  selectedCategory?: string;
}

export const CategoryManager = ({ 
  currentLang, 
  onCategorySelect, 
  selectedCategory 
}: CategoryManagerProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    nameEn: '',
    nameAr: '',
    descriptionEn: '',
    descriptionAr: '',
    isActive: true
  });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const categories = await categoryService.getCategories({
        includeProductCount: true
      });
      setCategories(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: currentLang === 'ar' ? 'خطأ' : 'Error',
        description: currentLang === 'ar' 
          ? 'فشل في تحميل الفئات'
          : 'Failed to load categories',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nameEn: '',
      nameAr: '',
      descriptionEn: '',
      descriptionAr: '',
      isActive: true
    });
    setEditingCategory(null);
  };

  const openDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        nameEn: category.name.en,
        nameAr: category.name.ar,
        descriptionEn: category.description?.en || '',
        descriptionAr: category.description?.ar || '',
        isActive: category.isActive
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nameEn.trim() || !formData.nameAr.trim()) {
      toast({
        title: currentLang === 'ar' ? 'خطأ' : 'Error',
        description: currentLang === 'ar' 
          ? 'يجب إدخال اسم الفئة بالعربية والإنجليزية'
          : 'Category name is required in both languages',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const categoryData = {
        name: {
          en: formData.nameEn.trim(),
          ar: formData.nameAr.trim()
        },
        description: {
          en: formData.descriptionEn.trim(),
          ar: formData.descriptionAr.trim()
        },
        isActive: formData.isActive
      };

      let savedCategory;
      if (editingCategory) {
        savedCategory = await categoryService.updateCategory(editingCategory._id, categoryData);
        setCategories(categories.map(cat => 
          cat._id === editingCategory._id ? savedCategory : cat
        ));
      } else {
        savedCategory = await categoryService.createCategory(categoryData);
        setCategories([...categories, savedCategory]);
      }

      toast({
        title: currentLang === 'ar' ? 'تم بنجاح' : 'Success',
        description: currentLang === 'ar' 
          ? `تم ${editingCategory ? 'تحديث' : 'إضافة'} الفئة بنجاح`
          : `Category ${editingCategory ? 'updated' : 'created'} successfully`,
      });

      closeDialog();
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        title: currentLang === 'ar' ? 'خطأ' : 'Error',
        description: error instanceof Error ? error.message : 'Failed to save category',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(
      currentLang === 'ar' 
        ? `هل أنت متأكد من حذف فئة "${category.name[currentLang]}"؟`
        : `Are you sure you want to delete category "${category.name[currentLang]}"?`
    )) {
      return;
    }

    try {
      await categoryService.deleteCategory(category._id);
      setCategories(categories.filter(cat => cat._id !== category._id));
      
      toast({
        title: currentLang === 'ar' ? 'تم الحذف' : 'Deleted',
        description: currentLang === 'ar' 
          ? 'تم حذف الفئة بنجاح'
          : 'Category deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: currentLang === 'ar' ? 'خطأ' : 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete category',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">
          {currentLang === 'ar' ? 'إدارة الفئات' : 'Category Management'}
        </h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              {currentLang === 'ar' ? 'إضافة فئة' : 'Add Category'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCategory 
                  ? (currentLang === 'ar' ? 'تعديل الفئة' : 'Edit Category')
                  : (currentLang === 'ar' ? 'إضافة فئة جديدة' : 'Add New Category')
                }
              </DialogTitle>
              <DialogDescription>
                {currentLang === 'ar' 
                  ? 'أدخل تفاصيل الفئة بالعربية والإنجليزية'
                  : 'Enter category details in both Arabic and English'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nameAr">
                    {currentLang === 'ar' ? 'الاسم (عربي)' : 'Name (Arabic)'}
                  </Label>
                  <Input
                    id="nameAr"
                    value={formData.nameAr}
                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                    placeholder={currentLang === 'ar' ? 'اسم الفئة' : 'Category name'}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="nameEn">
                    {currentLang === 'ar' ? 'الاسم (إنجليزي)' : 'Name (English)'}
                  </Label>
                  <Input
                    id="nameEn"
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    placeholder="Category name"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="descAr">
                    {currentLang === 'ar' ? 'الوصف (عربي)' : 'Description (Arabic)'}
                  </Label>
                  <Textarea
                    id="descAr"
                    value={formData.descriptionAr}
                    onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                    placeholder={currentLang === 'ar' ? 'وصف الفئة' : 'Category description'}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="descEn">
                    {currentLang === 'ar' ? 'الوصف (إنجليزي)' : 'Description (English)'}
                  </Label>
                  <Textarea
                    id="descEn"
                    value={formData.descriptionEn}
                    onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                    placeholder="Category description"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isActive">
                  {currentLang === 'ar' ? 'فئة نشطة' : 'Active Category'}
                </Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {currentLang === 'ar' ? 'جاري الحفظ...' : 'Saving...'}
                    </>
                  ) : (
                    editingCategory 
                      ? (currentLang === 'ar' ? 'تحديث' : 'Update')
                      : (currentLang === 'ar' ? 'إضافة' : 'Add')
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  {currentLang === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <Card 
            key={category._id} 
            className={`cursor-pointer transition-colors ${
              selectedCategory === category._id 
                ? 'ring-2 ring-primary' 
                : 'hover:bg-muted/50'
            }`}
            onClick={() => onCategorySelect?.(category)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {category.name[currentLang]}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Badge variant={category.isActive ? 'default' : 'secondary'}>
                    {category.isActive 
                      ? (currentLang === 'ar' ? 'نشط' : 'Active')
                      : (currentLang === 'ar' ? 'غير نشط' : 'Inactive')
                    }
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {category.description?.[currentLang] && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {category.description[currentLang]}
                </p>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {category.productCount || 0} {currentLang === 'ar' ? 'منتج' : 'products'}
                </span>
                
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDialog(category);
                    }}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(category);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {categories.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              {currentLang === 'ar' 
                ? 'لا توجد فئات. انقر على "إضافة فئة" لإنشاء فئة جديدة.'
                : 'No categories found. Click "Add Category" to create a new one.'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};