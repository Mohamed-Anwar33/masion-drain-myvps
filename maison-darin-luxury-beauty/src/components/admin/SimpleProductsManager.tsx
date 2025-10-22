import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Package } from 'lucide-react';

interface SimpleProductsManagerProps {
  currentLang: 'en' | 'ar';
}

export function SimpleProductsManager({ currentLang }: SimpleProductsManagerProps) {
  const [products] = useState([
    { id: 1, name: 'عطر الورد', price: 250, category: 'floral' },
    { id: 2, name: 'عطر الياسمين', price: 300, category: 'floral' },
    { id: 3, name: 'عطر العود', price: 450, category: 'woody' }
  ]);

  const isRTL = currentLang === 'ar';

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-off-white mb-2">
            إدارة المنتجات
          </h1>
          <p className="text-beige/80">
            إضافة وتعديل وحذف المنتجات
          </p>
        </div>
        <Button className="bg-gold hover:bg-gold/90 text-dark-tea">
          <Plus className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
          إضافة منتج جديد
        </Button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="bg-off-white/95 backdrop-blur-sm border-gold/20 shadow-luxury">
            <CardHeader>
              <CardTitle className="flex items-center text-dark-tea">
                <Package className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" />
                {product.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-dark-tea/70">الفئة: {product.category}</p>
                <p className="text-lg font-bold text-gold">{product.price} ريال</p>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1">
                    تعديل
                  </Button>
                  <Button variant="destructive" size="sm" className="flex-1">
                    حذف
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats */}
      <Card className="bg-off-white/95 backdrop-blur-sm border-gold/20 shadow-luxury">
        <CardHeader>
          <CardTitle className="text-dark-tea">إحصائيات المنتجات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gold">{products.length}</div>
              <div className="text-sm text-dark-tea/60">إجمالي المنتجات</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gold">2</div>
              <div className="text-sm text-dark-tea/60">الفئات</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gold">333</div>
              <div className="text-sm text-dark-tea/60">متوسط السعر</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
