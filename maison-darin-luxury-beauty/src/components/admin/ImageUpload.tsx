import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadService } from '@/services/uploadService';

interface ImageData {
  url: string;
  cloudinaryId: string;
  alt?: {
    en: string;
    ar: string;
  };
  order: number;
}

interface ImageUploadProps {
  images: ImageData[];
  onImagesChange: (images: ImageData[]) => void;
  maxImages?: number;
  currentLang: 'en' | 'ar';
}

export const ImageUpload = ({ 
  images, 
  onImagesChange, 
  maxImages = 5, 
  currentLang 
}: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxImages) {
      toast({
        title: currentLang === 'ar' ? 'خطأ' : 'Error',
        description: currentLang === 'ar' 
          ? `يمكن رفع ${maxImages} صور كحد أقصى`
          : `Maximum ${maxImages} images allowed`,
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file, index) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`File ${file.name} is not an image`);
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`File ${file.name} is too large (max 5MB)`);
        }

        // Create FormData for upload
        const formData = new FormData();
        formData.append('image', file);
        formData.append('folder', 'maison-darin/products');

        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/media/upload`, {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const result = await response.json();
        
        return {
          url: result.data.url,
          cloudinaryId: result.data.cloudinaryId,
          alt: {
            en: '',
            ar: ''
          },
          order: images.length + index
        };
      });

      const uploadedImages = await Promise.all(uploadPromises);
      onImagesChange([...images, ...uploadedImages]);

      toast({
        title: currentLang === 'ar' ? 'تم الرفع بنجاح' : 'Upload Successful',
        description: currentLang === 'ar' 
          ? `تم رفع ${uploadedImages.length} صورة بنجاح`
          : `${uploadedImages.length} image(s) uploaded successfully`,
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: currentLang === 'ar' ? 'خطأ في الرفع' : 'Upload Error',
        description: error instanceof Error ? error.message : 'Failed to upload images',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    // Reorder remaining images
    const reorderedImages = newImages.map((img, i) => ({ ...img, order: i }));
    onImagesChange(reorderedImages);
  };

  const updateImageAlt = (index: number, lang: 'en' | 'ar', value: string) => {
    const newImages = [...images];
    newImages[index] = {
      ...newImages[index],
      alt: {
        ...newImages[index].alt,
        [lang]: value
      }
    };
    onImagesChange(newImages);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    
    // Update order
    const reorderedImages = newImages.map((img, i) => ({ ...img, order: i }));
    onImagesChange(reorderedImages);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">
          {currentLang === 'ar' ? 'صور المنتج' : 'Product Images'}
        </Label>
        <Badge variant="secondary">
          {images.length}/{maxImages}
        </Badge>
      </div>

      {/* Upload Area */}
      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
        <div className="text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {currentLang === 'ar' 
                ? 'اسحب الصور هنا أو انقر للاختيار'
                : 'Drag images here or click to select'
              }
            </p>
            <p className="text-xs text-muted-foreground">
              {currentLang === 'ar' 
                ? 'PNG, JPG, WEBP حتى 5MB'
                : 'PNG, JPG, WEBP up to 5MB'
              }
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || images.length >= maxImages}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {currentLang === 'ar' ? 'جاري الرفع...' : 'Uploading...'}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {currentLang === 'ar' ? 'اختيار الصور' : 'Select Images'}
              </>
            )}
          </Button>
        </div>
      </div>

      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <Card key={`${image.cloudinaryId}-${index}`} className="relative">
              <CardContent className="p-2">
                <div className="relative aspect-square">
                  <img
                    src={image.url}
                    alt={image.alt?.[currentLang] || `Product image ${index + 1}`}
                    className="w-full h-full object-cover rounded-md"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  {index === 0 && (
                    <Badge className="absolute bottom-1 left-1 text-xs">
                      {currentLang === 'ar' ? 'رئيسية' : 'Main'}
                    </Badge>
                  )}
                </div>
                
                {/* Alt Text Inputs */}
                <div className="mt-2 space-y-1">
                  <Input
                    placeholder={currentLang === 'ar' ? 'وصف الصورة (عربي)' : 'Image description (Arabic)'}
                    value={image.alt?.ar || ''}
                    onChange={(e) => updateImageAlt(index, 'ar', e.target.value)}
                    className="text-xs"
                  />
                  <Input
                    placeholder={currentLang === 'ar' ? 'وصف الصورة (إنجليزي)' : 'Image description (English)'}
                    value={image.alt?.en || ''}
                    onChange={(e) => updateImageAlt(index, 'en', e.target.value)}
                    className="text-xs"
                  />
                </div>

                {/* Move buttons */}
                {images.length > 1 && (
                  <div className="flex gap-1 mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => moveImage(index, Math.max(0, index - 1))}
                      disabled={index === 0}
                    >
                      ←
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => moveImage(index, Math.min(images.length - 1, index + 1))}
                      disabled={index === images.length - 1}
                    >
                      →
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};