import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Save, X, Upload, ImagePlus, Trash2, Camera } from 'lucide-react';

interface Product {
  _id?: string;
  name: {
    en: string;
    ar: string;
  };
  description: {
    en: string;
    ar: string;
  };
  longDescription?: {
    en: string;
    ar: string;
  };
  price: number;
  size: string;
  category: string;
  images: Array<string | { url: string; cloudinaryId?: string; alt?: { en: string; ar: string }; order?: number }>;
  inStock: boolean;
  stock: number;
  concentration?: {
    en: string;
    ar: string;
  };
  notes?: {
    top: { en: string[]; ar: string[] };
    middle: { en: string[]; ar: string[] };
    base: { en: string[]; ar: string[] };
  };
  featured?: boolean;
  createdAt?: string;
}

interface ProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  onSave: (product: Product) => void;
}

export function ProductDialog({ isOpen, onClose, product, onSave }: ProductDialogProps) {
  const [formData, setFormData] = useState<Product>({
    name: { en: '', ar: '' },
    description: { en: '', ar: '' },
    longDescription: { en: '', ar: '' },
    price: 0,
    size: '100ml',
    category: 'floral',
    images: [],
    inStock: true,
    stock: 0,
    concentration: { en: '', ar: '' },
    notes: {
      top: { en: [], ar: [] },
      middle: { en: [], ar: [] },
      base: { en: [], ar: [] }
    },
    featured: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Category translations
  const categories = [
    { value: 'floral', label: 'زهري' },
    { value: 'oriental', label: 'شرقي' },
    { value: 'fresh', label: 'منعش' },
    { value: 'woody', label: 'خشبي' },
    { value: 'citrus', label: 'حمضي' },
    { value: 'spicy', label: 'حار' },
    { value: 'aquatic', label: 'مائي' },
    { value: 'gourmand', label: 'حلو' }
  ];

  const sizes = ['30ml', '50ml', '75ml', '100ml', '125ml', '150ml'];

  // Reset form when dialog opens/closes or product changes
  useEffect(() => {
    if (isOpen) {
      if (product) {
        setFormData(product);
      } else {
        setFormData({
          name: { en: '', ar: '' },
          description: { en: '', ar: '' },
          longDescription: { en: '', ar: '' },
          price: 0,
          size: '100ml',
          category: 'floral',
          images: [],
          inStock: true,
          stock: 0,
          concentration: { en: '', ar: '' },
          notes: {
            top: { en: [], ar: [] },
            middle: { en: [], ar: [] },
            base: { en: [], ar: [] }
          },
          featured: false
        });
      }
    }
  }, [isOpen, product]);

  const handleInputChange = (field: string, value: any, lang?: 'en' | 'ar') => {
    setFormData(prev => {
      if (lang) {
        // Handle nested objects for name, description, longDescription, and concentration
        if (field === 'name' || field === 'description') {
          return {
            ...prev,
            [field]: {
              ...prev[field],
              [lang]: value
            }
          };
        }
        if (field === 'longDescription') {
          return {
            ...prev,
            longDescription: {
              ...(prev.longDescription || { en: '', ar: '' }),
              [lang]: value
            }
          };
        }
        if (field === 'concentration') {
          return {
            ...prev,
            concentration: {
              ...(prev.concentration || { en: '', ar: '' }),
              [lang]: value
            }
          };
        }
      }
      return {
        ...prev,
        [field]: value
      };
    });
  };

  // Image upload functions
  const handleImageUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;

    const maxImages = 10;
    const currentImageCount = formData.images.length;
    const newImageCount = files.length;

    if (currentImageCount + newImageCount > maxImages) {
      toast.error(`❌ يمكن رفع ${maxImages} صور كحد أقصى!\n📊 لديك ${currentImageCount} صور، تحاول إضافة ${newImageCount} صور.`);
      return;
    }

    setUploadingImages(true);
    setUploadProgress(0);

    try {
      const uploadedImages: Array<{ url: string; cloudinaryId?: string; alt?: { en: string; ar: string }; order?: number }> = [];
      const totalFiles = files.length;

      for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
          toast.error(`❌ نوع الملف غير مدعوم: ${file.name}\n✅ الأنواع المدعومة: JPEG, PNG, WebP`);
          continue;
        }

        // Validate file size (5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
          toast.error(`❌ حجم الملف كبير جداً: ${file.name}\n📏 الحد الأقصى: 5 ميجابايت`);
          continue;
        }

        // Create safe filename
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const safeFileName = `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
        const renamedFile = new File([file], safeFileName, { type: file.type });

        // Prepare form data
        const uploadFormData = new FormData();
        uploadFormData.append('image', renamedFile);
        uploadFormData.append('altEn', `Product image: ${file.name}`);
        uploadFormData.append('altAr', `صورة المنتج: ${file.name}`);
        uploadFormData.append('folder', 'maison-darin/products');
        uploadFormData.append('tags', 'product,maison-darin');

        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/media/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: uploadFormData
          });

          if (response.ok) {
            const result = await response.json();
            // Create image object that matches the Product model
            const imageObject = {
              url: result.data.url,
              cloudinaryId: result.data.cloudinaryId,
              alt: {
                en: `Product image: ${file.name}`,
                ar: `صورة المنتج: ${file.name}`
              },
              order: uploadedImages.length
            };
            uploadedImages.push(imageObject);
            
            // Update progress
            const progress = ((i + 1) / totalFiles) * 100;
            setUploadProgress(progress);
            
            toast.success(`✅ تم رفع الصورة ${i + 1}/${totalFiles} بنجاح!`);
          } else {
            const errorData = await response.text();
            console.error('Upload error:', errorData);
            toast.error(`❌ فشل رفع الصورة: ${file.name}\n🔧 ${response.status}: ${errorData}`);
          }
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error(`💥 خطأ في رفع الصورة: ${file.name}\n🌐 تأكد من اتصالك بالإنترنت.`);
        }
      }

      if (uploadedImages.length > 0) {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...uploadedImages]
        }));
        
        toast.success(`🎉 تم رفع ${uploadedImages.length} صورة بنجاح!\n📸 إجمالي الصور: ${formData.images.length + uploadedImages.length}`);
      }

    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('💥 خطأ في رفع الصور!\n🔧 حاول مرة أخرى.');
    } finally {
      setUploadingImages(false);
      setUploadProgress(0);
    }
  };

  const handleImageDelete = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    toast.success('🗑️ تم حذف الصورة بنجاح!');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageUpload(files);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.ar.trim() || !formData.name.en.trim()) {
      toast.error('❌ يجب إدخال اسم المنتج بالعربي والإنجليزي');
      return;
    }
    
    if (!formData.description.ar.trim() || !formData.description.en.trim()) {
      toast.error('❌ يجب إدخال وصف المنتج بالعربي والإنجليزي');
      return;
    }
    
    if (formData.price <= 0) {
      toast.error('❌ يجب إدخال سعر صحيح للمنتج');
      return;
    }

    try {
      setIsLoading(true);
      
      const url = product 
        ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/products/${product._id}`
        : `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/products`;
      
      const method = product ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const result = await response.json();
        const savedProduct = result.data || result.product || result;
        
        onSave(savedProduct);
        
        if (product) {
          toast.success(`🎉 تم تحديث "${formData.name.ar}" بنجاح!\n✨ تم حفظ جميع التغييرات.`);
        } else {
          toast.success(`🎉 تم إضافة "${formData.name.ar}" بنجاح!\n✨ المنتج الجديد متاح الآن في المتجر.`);
        }
        
        onClose();
      } else {
        const errorData = await response.text();
        toast.error(`❌ فشل في ${product ? 'تحديث' : 'إضافة'} المنتج!\n🔧 ${response.status}: ${errorData}`);
      }
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(`💥 خطأ في الاتصال!\n🌐 تأكد من اتصالك بالإنترنت والخادم.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-dark-tea">
            {product ? `✏️ تعديل المنتج: ${product.name?.ar}` : '➕ إضافة منتج جديد'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Names */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name-ar" className="text-dark-tea font-semibold">
                اسم المنتج (عربي) *
              </Label>
              <Input
                id="name-ar"
                value={formData.name.ar}
                onChange={(e) => handleInputChange('name', e.target.value, 'ar')}
                placeholder="مثال: سيمفونية الأزهار"
                className="bg-white/50 border-gold/20"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name-en" className="text-dark-tea font-semibold">
                اسم المنتج (إنجليزي) *
              </Label>
              <Input
                id="name-en"
                value={formData.name.en}
                onChange={(e) => handleInputChange('name', e.target.value, 'en')}
                placeholder="Example: Floral Symphony"
                className="bg-white/50 border-gold/20"
                required
              />
            </div>
          </div>

          {/* Product Descriptions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="desc-ar" className="text-dark-tea font-semibold">
                وصف المنتج (عربي) *
              </Label>
              <Textarea
                id="desc-ar"
                value={formData.description.ar}
                onChange={(e) => handleInputChange('description', e.target.value, 'ar')}
                placeholder="وصف مختصر للمنتج بالعربي..."
                className="bg-white/50 border-gold/20 min-h-[80px]"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc-en" className="text-dark-tea font-semibold">
                وصف المنتج (إنجليزي) *
              </Label>
              <Textarea
                id="desc-en"
                value={formData.description.en}
                onChange={(e) => handleInputChange('description', e.target.value, 'en')}
                placeholder="Short product description in English..."
                className="bg-white/50 border-gold/20 min-h-[80px]"
                required
              />
            </div>
          </div>

          {/* Long Descriptions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="long-desc-ar" className="text-dark-tea font-semibold">
                الوصف التفصيلي (عربي)
              </Label>
              <Textarea
                id="long-desc-ar"
                value={formData.longDescription?.ar || ''}
                onChange={(e) => handleInputChange('longDescription', e.target.value, 'ar')}
                placeholder="وصف مفصل وشامل للمنتج بالعربي..."
                className="bg-white/50 border-gold/20 min-h-[120px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="long-desc-en" className="text-dark-tea font-semibold">
                الوصف التفصيلي (إنجليزي)
              </Label>
              <Textarea
                id="long-desc-en"
                value={formData.longDescription?.en || ''}
                onChange={(e) => handleInputChange('longDescription', e.target.value, 'en')}
                placeholder="Detailed product description in English..."
                className="bg-white/50 border-gold/20 min-h-[120px]"
              />
            </div>
          </div>

          {/* Concentration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="concentration-ar" className="text-dark-tea font-semibold">
                التركيز (عربي)
              </Label>
              <Input
                id="concentration-ar"
                value={formData.concentration?.ar || ''}
                onChange={(e) => handleInputChange('concentration', e.target.value, 'ar')}
                placeholder="مثال: ماء العطر"
                className="bg-white/50 border-gold/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="concentration-en" className="text-dark-tea font-semibold">
                التركيز (إنجليزي)
              </Label>
              <Input
                id="concentration-en"
                value={formData.concentration?.en || ''}
                onChange={(e) => handleInputChange('concentration', e.target.value, 'en')}
                placeholder="Example: Eau de Parfum"
                className="bg-white/50 border-gold/20"
              />
            </div>
          </div>

          {/* Price, Size, Category */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price" className="text-dark-tea font-semibold">
                السعر (ريال) *
              </Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                placeholder="150"
                className="bg-white/50 border-gold/20"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="size" className="text-dark-tea font-semibold">
                الحجم
              </Label>
              <Select value={formData.size} onValueChange={(value) => handleInputChange('size', value)}>
                <SelectTrigger className="bg-white/50 border-gold/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sizes.map(size => (
                    <SelectItem key={size} value={size}>{size}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category" className="text-dark-tea font-semibold">
                الفئة
              </Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger className="bg-white/50 border-gold/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stock and Featured */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stock" className="text-dark-tea font-semibold">
                الكمية المتوفرة
              </Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock}
                onChange={(e) => handleInputChange('stock', parseInt(e.target.value) || 0)}
                placeholder="50"
                className="bg-white/50 border-gold/20"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-dark-tea font-semibold">
                حالة التوفر
              </Label>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Switch
                  checked={formData.inStock}
                  onCheckedChange={(checked) => handleInputChange('inStock', checked)}
                />
                <span className="text-sm text-dark-tea">
                  {formData.inStock ? 'متوفر' : 'غير متوفر'}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-dark-tea font-semibold">
                منتج مميز
              </Label>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Switch
                  checked={formData.featured || false}
                  onCheckedChange={(checked) => handleInputChange('featured', checked)}
                />
                <span className="text-sm text-dark-tea">
                  {formData.featured ? 'مميز' : 'عادي'}
                </span>
              </div>
            </div>
          </div>

          {/* Fragrance Notes (هرم العطر) */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-dark-tea border-b border-gold/20 pb-2">
              🌸 هرم العطر - Fragrance Pyramid
            </h3>
            
            {/* Top Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-dark-tea font-semibold">
                  النوتات العلوية (عربي)
                </Label>
                <Input
                  value={formData.notes?.top?.ar?.join(', ') || ''}
                  onChange={(e) => {
                    const notes = e.target.value.split(',').map(n => n.trim()).filter(n => n);
                    setFormData(prev => ({
                      ...prev,
                      notes: {
                        ...prev.notes,
                        top: {
                          ...prev.notes?.top,
                          ar: notes
                        }
                      }
                    }));
                  }}
                  placeholder="مثال: الليمون, البرتقال, النعناع"
                  className="bg-white/50 border-gold/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-dark-tea font-semibold">
                  Top Notes (English)
                </Label>
                <Input
                  value={formData.notes?.top?.en?.join(', ') || ''}
                  onChange={(e) => {
                    const notes = e.target.value.split(',').map(n => n.trim()).filter(n => n);
                    setFormData(prev => ({
                      ...prev,
                      notes: {
                        ...prev.notes,
                        top: {
                          ...prev.notes?.top,
                          en: notes
                        }
                      }
                    }));
                  }}
                  placeholder="Example: Lemon, Orange, Mint"
                  className="bg-white/50 border-gold/20"
                />
              </div>
            </div>

            {/* Middle Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-dark-tea font-semibold">
                  النوتات الوسطى (عربي)
                </Label>
                <Input
                  value={formData.notes?.middle?.ar?.join(', ') || ''}
                  onChange={(e) => {
                    const notes = e.target.value.split(',').map(n => n.trim()).filter(n => n);
                    setFormData(prev => ({
                      ...prev,
                      notes: {
                        ...prev.notes,
                        middle: {
                          ...prev.notes?.middle,
                          ar: notes
                        }
                      }
                    }));
                  }}
                  placeholder="مثال: الورد, الياسمين, الخزامى"
                  className="bg-white/50 border-gold/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-dark-tea font-semibold">
                  Middle Notes (English)
                </Label>
                <Input
                  value={formData.notes?.middle?.en?.join(', ') || ''}
                  onChange={(e) => {
                    const notes = e.target.value.split(',').map(n => n.trim()).filter(n => n);
                    setFormData(prev => ({
                      ...prev,
                      notes: {
                        ...prev.notes,
                        middle: {
                          ...prev.notes?.middle,
                          en: notes
                        }
                      }
                    }));
                  }}
                  placeholder="Example: Rose, Jasmine, Lavender"
                  className="bg-white/50 border-gold/20"
                />
              </div>
            </div>

            {/* Base Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-dark-tea font-semibold">
                  النوتات القاعدية (عربي)
                </Label>
                <Input
                  value={formData.notes?.base?.ar?.join(', ') || ''}
                  onChange={(e) => {
                    const notes = e.target.value.split(',').map(n => n.trim()).filter(n => n);
                    setFormData(prev => ({
                      ...prev,
                      notes: {
                        ...prev.notes,
                        base: {
                          ...prev.notes?.base,
                          ar: notes
                        }
                      }
                    }));
                  }}
                  placeholder="مثال: العود, المسك, الفانيليا"
                  className="bg-white/50 border-gold/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-dark-tea font-semibold">
                  Base Notes (English)
                </Label>
                <Input
                  value={formData.notes?.base?.en?.join(', ') || ''}
                  onChange={(e) => {
                    const notes = e.target.value.split(',').map(n => n.trim()).filter(n => n);
                    setFormData(prev => ({
                      ...prev,
                      notes: {
                        ...prev.notes,
                        base: {
                          ...prev.notes?.base,
                          en: notes
                        }
                      }
                    }));
                  }}
                  placeholder="Example: Oud, Musk, Vanilla"
                  className="bg-white/50 border-gold/20"
                />
              </div>
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-dark-tea border-b border-gold/20 pb-2">
              📸 صور المنتج - Product Images
            </h3>
            
            {/* Upload Area */}
            <div 
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                uploadingImages 
                  ? 'border-gold bg-gold/5' 
                  : 'border-gold/30 hover:border-gold/50 hover:bg-gold/5'
              }`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {uploadingImages ? (
                <div className="space-y-3">
                  <div className="w-12 h-12 mx-auto animate-spin border-4 border-gold border-t-transparent rounded-full"></div>
                  <p className="text-dark-tea font-medium">جاري رفع الصور...</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gold h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600">{Math.round(uploadProgress)}%</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Camera className="w-12 h-12 mx-auto text-gold" />
                  <div>
                    <p className="text-dark-tea font-medium mb-1">
                      اسحب الصور هنا أو انقر للاختيار
                    </p>
                    <p className="text-sm text-gray-600">
                      JPEG, PNG, WebP • حد أقصى 5 ميجابايت • حتى 10 صور
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-gold/30 text-dark-tea hover:bg-gold/10"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.multiple = true;
                      input.accept = 'image/jpeg,image/png,image/webp';
                      input.onchange = (e) => {
                        const files = (e.target as HTMLInputElement).files;
                        if (files) handleImageUpload(files);
                      };
                      input.click();
                    }}
                  >
                    <ImagePlus className="w-4 h-4 mr-2" />
                    اختيار الصور
                  </Button>
                </div>
              )}
            </div>

            {/* Images Preview */}
            {formData.images.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-dark-tea">
                    الصور المرفوعة ({formData.images.length}/10)
                  </h4>
                  {formData.images.length > 0 && (
                    <p className="text-sm text-gray-600">
                      الصورة الأولى ستكون الصورة الرئيسية
                    </p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gold/20">
                        <img
                          src={typeof image === 'string' ? image : image.url}
                          alt={typeof image === 'string' ? `صورة المنتج ${index + 1}` : image.alt?.ar || `صورة المنتج ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Image Number Badge */}
                      <div className={`absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 
                          ? 'bg-gold text-dark-tea' 
                          : 'bg-dark-tea/80 text-white'
                      }`}>
                        {index + 1}
                      </div>
                      
                      {/* Main Image Badge */}
                      {index === 0 && (
                        <div className="absolute top-2 right-2 bg-gold text-dark-tea text-xs px-2 py-1 rounded-full font-medium">
                          رئيسية
                        </div>
                      )}
                      
                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleImageDelete(index)}
                        className="absolute bottom-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {formData.images.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <ImagePlus className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-medium mb-1">لا توجد صور مرفوعة</p>
                <p className="text-sm">ابدأ برفع صور المنتج لعرضها للعملاء</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-gold hover:bg-gold/90 text-dark-tea"
            >
              {isLoading ? (
                <div className="w-4 h-4 mr-2 animate-spin border-2 border-dark-tea border-t-transparent rounded-full"></div>
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isLoading ? 'جاري الحفظ...' : (product ? 'حفظ التغييرات' : 'إضافة المنتج')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="border-gold/30 text-dark-tea hover:bg-gold/10"
            >
              <X className="w-4 h-4 mr-2" />
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
