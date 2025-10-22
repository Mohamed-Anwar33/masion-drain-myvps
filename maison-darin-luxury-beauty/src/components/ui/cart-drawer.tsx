import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, ShoppingBag, Trash2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface CartDrawerProps {
  currentLang: 'en' | 'ar';
}

// Helper function to get the first image from a product
const getProductImage = (product: any): string => {
  // Check if product has images array (new format)
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    const firstImage = product.images[0];
    // If it's an object with url property
    if (typeof firstImage === 'object' && firstImage.url) {
      return firstImage.url;
    }
    // If it's a string
    if (typeof firstImage === 'string') {
      return firstImage;
    }
  }
  
  // Fallback to single image property (old format)
  if (product.image && product.image.trim() !== '') {
    return product.image;
  }
  
  // Debug: log the full product data
  console.log('🔍 Product image debug:', {
    productId: product.id || product._id,
    productName: product.name,
    hasImage: !!product.image,
    imageValue: product.image,
    hasImagesArray: !!product.images,
    imagesArray: product.images,
    imagesLength: product.images?.length,
    firstImageType: product.images?.[0] ? typeof product.images[0] : 'undefined',
    firstImageValue: product.images?.[0],
    fullProduct: product
  });
  
  // Default placeholder - use a data URL for a simple placeholder
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04MCA4MEgxMjBWMTIwSDgwVjgwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
};

export function CartDrawer({ currentLang }: CartDrawerProps) {
  const { state, removeFromCart, updateQuantity, closeCart, clearCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isRTL = currentLang === 'ar';

  const handleCheckout = () => {
    closeCart(); // Close the cart drawer
    navigate('/checkout'); // Navigate to checkout page
  };

  const handleQuantityChange = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  return (
    <AnimatePresence>
      {state.isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          
          {/* Cart Drawer */}
          <motion.div
            initial={{ x: isRTL ? -400 : 400 }}
            animate={{ x: 0 }}
            exit={{ x: isRTL ? -400 : 400 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`fixed top-0 ${isRTL ? 'left-0' : 'right-0'} h-full w-full max-w-md bg-background border-l border-border shadow-2xl z-50 flex flex-col`}
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            {/* Header */}
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  {currentLang === 'ar' ? 'سلة التسوق' : 'Shopping Cart'}
                </h2>
                <Button variant="ghost" size="icon" onClick={closeCart}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {state.items.length} {currentLang === 'ar' ? 'عنصر' : 'items'}
              </p>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {state.items.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg text-muted-foreground">
                    {currentLang === 'ar' ? 'السلة فارغة' : 'Your cart is empty'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {currentLang === 'ar' 
                      ? 'ابدئي بإضافة بعض العطور الرائعة!' 
                      : 'Start adding some amazing fragrances!'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {state.items.map((item) => (
                    <motion.div
                      key={item.product.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <Card className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            <img
                              src={getProductImage(item.product)}
                              alt={item.product.name[currentLang]}
                              className="w-16 h-16 object-cover rounded-lg"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04MCA4MEgxMjBWMTIwSDgwVjgwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                                console.log('Image failed to load:', target.getAttribute('src'));
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm truncate">
                                {item.product.name[currentLang]}
                              </h3>
                              <p className="text-xs text-muted-foreground mt-1">
                                {item.product.size} • {item.product.concentration?.[currentLang]}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="font-bold text-primary">
                                  ${item.product.price}
                                </span>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                                  >
                                    <Minus className="w-3 h-3" />
                                  </Button>
                                  <span className="w-8 text-center text-sm font-medium">
                                    {item.quantity}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => removeFromCart(item.product.id)}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {state.items.length > 0 && (
              <div className="p-6 border-t border-border bg-muted/20">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">
                      {currentLang === 'ar' ? 'المجموع:' : 'Total:'}
                    </span>
                    <span className="text-2xl font-bold text-primary">
                      ${state.total.toFixed(2)}
                    </span>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Button 
                      onClick={handleCheckout}
                      className="w-full btn-luxury flex items-center gap-2"
                      size="lg"
                    >
                      <CreditCard className="w-4 h-4" />
                      {currentLang === 'ar' ? 'إتمام الطلب' : 'Checkout'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={clearCart}
                      className="w-full"
                    >
                      {currentLang === 'ar' ? 'إفراغ السلة' : 'Clear Cart'}
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground text-center">
                    {currentLang === 'ar' 
                      ? 'الشحن مجاني للطلبات فوق $200' 
                      : 'Free shipping on orders over $200'}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
