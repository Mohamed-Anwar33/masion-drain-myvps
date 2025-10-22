import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, User, Mail, Phone, CheckCircle, CreditCard, MapPin, Globe } from "lucide-react";
import { LuxuryNotification } from "@/components/ui/LuxuryNotification";
import { useCart } from "@/contexts/CartContext";
import { useNotifications } from "@/hooks/useNotifications";
import { Link, useNavigate } from "react-router-dom";

export default function CheckoutSimple() {
  const { state, clearCart } = useCart();
  const { items, total } = state;
  const { notifications, showSaveError, showSaveSuccess } = useNotifications();
  const navigate = useNavigate();
  const [currentLang, setCurrentLang] = useState<'en' | 'ar'>('ar');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'السعودية'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePayPalPayment = async () => {
    // Validate required fields
    if (!customerInfo.name.trim() || !customerInfo.email.trim() || !customerInfo.phone.trim() || 
        !customerInfo.address.trim() || !customerInfo.city.trim() || !customerInfo.country.trim()) {
      showSaveError("يرجى ملء جميع الحقول المطلوبة (الاسم، الإيميل، الهاتف، العنوان، المدينة، الدولة)");
      return;
    }

    setIsProcessing(true);
    
    try {
      // Create order data
      const orderData = {
        items: items.map(item => ({
          productId: item.product._id || item.product.id.toString(),
          productName: typeof item.product.name === 'string' 
            ? item.product.name
            : item.product.name?.ar || item.product.name?.en || 'منتج',
          productImage: item.product.images?.[0] || '',
          price: item.product.price,
          quantity: item.quantity,
          subtotal: item.product.price * item.quantity
        })),
        subtotal: total,
        shippingCost: 0,
        tax: 0,
        total: total,
        paymentMethod: 'paypal',
        paymentStatus: 'pending',
        status: 'pending',
        customerInfo: {
          firstName: customerInfo.name.split(' ')[0] || customerInfo.name,
          lastName: customerInfo.name.split(' ').slice(1).join(' ') || 'العميل',
          email: customerInfo.email,
          phone: customerInfo.phone,
          address: customerInfo.address,
          city: customerInfo.city,
          postalCode: '12345', // Default postal code
          country: customerInfo.country,
          notes: 'طلب عبر PayPal'
        }
      };

      // Create PayPal order
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/paypal/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          amount: total,
          currency: 'SAR',  // تغيير من USD إلى SAR
          orderData 
        })
      });

      const result = await response.json();
      console.log('PayPal order response:', result);

      if (result.success && result.approveUrl) {
        // Redirect to PayPal as usual
        window.location.href = result.approveUrl;
      } else {
        throw new Error(result.message || 'فشل في إنشاء الطلب');
      }
    } catch (error: any) {
      console.error('PayPal payment error:', error);
      showSaveError(error.message || "حدث خطأ أثناء معالجة الدفع. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCashPayment = () => {
    // Validate required fields
    if (!customerInfo.name.trim() || !customerInfo.email.trim() || !customerInfo.phone.trim()) {
      showSaveError("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    setOrderComplete(true);
    showSaveSuccess();
    clearCart();
  };

  // Redirect if cart is empty and order not complete
  if (items.length === 0 && !orderComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-soft-pink to-white">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="p-8">
            <h1 className="text-2xl font-bold text-dark-tea mb-4">السلة فارغة</h1>
            <p className="text-muted-foreground mb-6">
              أضف بعض المنتجات إلى سلتك قبل الدفع.
            </p>
            <Link to="/products">
              <Button className="btn-luxury">تسوق الآن</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Order completion screen
  if (orderComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-soft-pink to-white">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md mx-auto text-center"
        >
          <Card className="glass border-0 shadow-2xl">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-dark-tea mb-2">تم تأكيد الطلب!</h1>
              <p className="text-muted-foreground mb-6">
                شكراً لك على طلبك. سيتم التواصل معك قريباً.
              </p>
              <div className="space-y-3">
                <Link to="/products">
                  <Button className="w-full btn-luxury">متابعة التسوق</Button>
                </Link>
                <Link to="/">
                  <Button variant="outline" className="w-full">العودة للرئيسية</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-pink to-white py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/cart">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                العودة للسلة
              </Button>
            </Link>
            <h1 className="text-3xl font-display font-bold text-dark-tea">إتمام الطلب</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div>
            <Card className="glass border-0 shadow-luxury">
              <CardHeader>
                <CardTitle>ملخص الطلب</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items */}
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.product.image}
                          alt={typeof item.product.name === 'string' 
                            ? item.product.name 
                            : item.product.name?.ar || item.product.name?.en || 'منتج'
                          }
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-medium text-sm">
                            {typeof item.product.name === 'string' 
                              ? item.product.name 
                              : item.product.name?.ar || item.product.name?.en || 'منتج'
                            }
                          </p>
                          <p className="text-xs text-muted-foreground">الكمية: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="font-semibold">${(item.product.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>المجموع الفرعي</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>الشحن</span>
                    <span>مجاني</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-semibold text-dark-tea">
                    <span>المجموع الكلي</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Customer Info & Payment */}
          <div className="space-y-6">
            {/* Customer Information */}
            <Card className="glass border-0 shadow-luxury">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  معلومات العميل
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium">
                    الاسم الكامل *
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={customerInfo.name}
                    onChange={handleInputChange}
                    placeholder="أدخل اسمك الكامل"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm font-medium flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    البريد الإلكتروني *
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={customerInfo.email}
                    onChange={handleInputChange}
                    placeholder="البريد@الإلكتروني.com"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    رقم الهاتف *
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={customerInfo.phone}
                    onChange={handleInputChange}
                    placeholder="+966 50 123 4567"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="address" className="text-sm font-medium flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    العنوان *
                  </Label>
                  <Input
                    id="address"
                    name="address"
                    value={customerInfo.address}
                    onChange={handleInputChange}
                    placeholder="أدخل عنوانك الكامل"
                    className="mt-1"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city" className="text-sm font-medium flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      المدينة *
                    </Label>
                    <Input
                      id="city"
                      name="city"
                      value={customerInfo.city}
                      onChange={handleInputChange}
                      placeholder="الرياض"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="country" className="text-sm font-medium flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      الدولة *
                    </Label>
                    <Input
                      id="country"
                      name="country"
                      value={customerInfo.country}
                      onChange={handleInputChange}
                      placeholder="السعودية"
                      className="mt-1"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card className="glass border-0 shadow-luxury">
              <CardHeader>
                <CardTitle>طريقة الدفع</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* PayPal Payment */}
                <Button
                  onClick={handlePayPalPayment}
                  disabled={isProcessing}
                  className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white h-12 text-lg font-semibold"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      جاري المعالجة...
                    </div>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 mr-2" />
                      الدفع عبر PayPal
                    </>
                  )}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground">أو</span>
                  </div>
                </div>

                {/* Cash on Delivery */}
                <Button
                  onClick={handleCashPayment}
                  variant="outline"
                  className="w-full h-12 text-lg font-semibold border-2 border-teal-green text-teal-green hover:bg-teal-green hover:text-white"
                >
                  الدفع عند الاستلام
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  * جميع الحقول مطلوبة لإتمام الطلب
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Luxury Notifications */}
      {notifications.map((notification) => (
        <LuxuryNotification key={notification.id} {...notification} />
      ))}
    </div>
  );
}
