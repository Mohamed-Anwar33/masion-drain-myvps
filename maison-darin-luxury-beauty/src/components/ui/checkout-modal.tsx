import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { X, CreditCard, MapPin, User, Mail, Phone, Shield } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { PayPalButtons } from "@/components/ui/paypal-buttons";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: 'en' | 'ar';
}

export function CheckoutModal({ isOpen, onClose, currentLang }: CheckoutModalProps) {
  const { state, clearCart } = useCart();
  const { items, total } = state;
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'card'>('paypal');
  const [isProcessing, setIsProcessing] = useState(false);
  const [billingInfo, setBillingInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: ''
  });

  const isRTL = currentLang === 'ar';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBillingInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePaymentSuccess = () => {
    toast({
      title: currentLang === 'en' ? "Payment Successful!" : "تم الدفع بنجاح!",
      description: currentLang === 'en' 
        ? "Your order has been placed successfully. You will receive a confirmation email shortly."
        : "تم تأكيد طلبك بنجاح. ستتلقى بريد إلكتروني للتأكيد قريباً.",
    });
    clearCart();
    onClose();
  };

  const handleCardPayment = async () => {
    setIsProcessing(true);
    // Simulate card payment processing
    setTimeout(() => {
      handlePaymentSuccess();
      setIsProcessing(false);
    }, 3000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <Card className="glass border-0 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between p-6">
              <CardTitle className="text-2xl font-display text-dark-tea">
                {currentLang === 'en' ? 'Checkout' : 'إتمام الشراء'}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 hover:bg-teal-green/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>

            <CardContent className="p-6 space-y-8">
              <div className="grid lg:grid-cols-2 gap-8">
                
                {/* Order Summary */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-dark-tea flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    {currentLang === 'en' ? 'Order Summary' : 'ملخص الطلب'}
                  </h3>
                  
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.product.id} className="flex items-center gap-4 p-4 rounded-lg bg-white/50">
                        <img
                          src={item.product.image}
                          alt={item.product.name[currentLang]}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-dark-tea">
                            {item.product.name[currentLang]}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {currentLang === 'en' ? 'Quantity' : 'الكمية'}: {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-dark-tea">
                            ${(item.product.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{currentLang === 'en' ? 'Subtotal' : 'المجموع الفرعي'}</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{currentLang === 'en' ? 'Shipping' : 'الشحن'}</span>
                      <span>{currentLang === 'en' ? 'Free' : 'مجاني'}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-semibold text-dark-tea">
                      <span>{currentLang === 'en' ? 'Total' : 'المجموع الكلي'}</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Billing & Payment */}
                <div className="space-y-6">
                  
                  {/* Billing Information */}
                  <div>
                    <h3 className="text-xl font-semibold text-dark-tea flex items-center gap-2 mb-4">
                      <User className="w-5 h-5" />
                      {currentLang === 'en' ? 'Billing Information' : 'معلومات الفواتير'}
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4 space-y-0">
                      <div>
                        <Label htmlFor="firstName" className="text-sm font-medium">
                          {currentLang === 'en' ? 'First Name' : 'الاسم الأول'}
                        </Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          value={billingInfo.firstName}
                          onChange={handleInputChange}
                          className="mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName" className="text-sm font-medium">
                          {currentLang === 'en' ? 'Last Name' : 'اسم العائلة'}
                        </Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          value={billingInfo.lastName}
                          onChange={handleInputChange}
                          className="mt-1"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <Label htmlFor="email" className="text-sm font-medium flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {currentLang === 'en' ? 'Email' : 'البريد الإلكتروني'}
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={billingInfo.email}
                          onChange={handleInputChange}
                          className="mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {currentLang === 'en' ? 'Phone' : 'الهاتف'}
                        </Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={billingInfo.phone}
                          onChange={handleInputChange}
                          className="mt-1"
                          required
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <Label htmlFor="address" className="text-sm font-medium flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {currentLang === 'en' ? 'Address' : 'العنوان'}
                      </Label>
                      <Input
                        id="address"
                        name="address"
                        value={billingInfo.address}
                        onChange={handleInputChange}
                        className="mt-1"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div>
                        <Label htmlFor="city" className="text-sm font-medium">
                          {currentLang === 'en' ? 'City' : 'المدينة'}
                        </Label>
                        <Input
                          id="city"
                          name="city"
                          value={billingInfo.city}
                          onChange={handleInputChange}
                          className="mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="postalCode" className="text-sm font-medium">
                          {currentLang === 'en' ? 'Postal Code' : 'الرمز البريدي'}
                        </Label>
                        <Input
                          id="postalCode"
                          name="postalCode"
                          value={billingInfo.postalCode}
                          onChange={handleInputChange}
                          className="mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="country" className="text-sm font-medium">
                          {currentLang === 'en' ? 'Country' : 'البلد'}
                        </Label>
                        <Input
                          id="country"
                          name="country"
                          value={billingInfo.country}
                          onChange={handleInputChange}
                          className="mt-1"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Payment Method */}
                  <div>
                    <h3 className="text-xl font-semibold text-dark-tea flex items-center gap-2 mb-4">
                      <Shield className="w-5 h-5" />
                      {currentLang === 'en' ? 'Payment Method' : 'طريقة الدفع'}
                    </h3>

                    <div className="space-y-4">
                      {/* Payment Method Selection */}
                      <div className="flex gap-4">
                        <Button
                          variant={paymentMethod === 'paypal' ? 'default' : 'outline'}
                          onClick={() => setPaymentMethod('paypal')}
                          className="flex-1"
                        >
                          PayPal
                        </Button>
                        <Button
                          variant={paymentMethod === 'card' ? 'default' : 'outline'}
                          onClick={() => setPaymentMethod('card')}
                          className="flex-1"
                        >
                          {currentLang === 'en' ? 'Credit Card' : 'بطاقة ائتمان'}
                        </Button>
                      </div>

                      {/* PayPal Payment */}
                      {paymentMethod === 'paypal' && (
                        <div className="p-4 border rounded-lg bg-white/50">
                          <PayPalButtons
                            amount={total}
                            currency="SAR"
                            onSuccess={handlePaymentSuccess}
                            onError={(error) => {
                              toast({
                                title: currentLang === 'en' ? "Payment Error" : "خطأ في الدفع",
                                description: error.message || (currentLang === 'en' ? "Payment failed" : "فشل الدفع"),
                                variant: "destructive"
                              });
                            }}
                          />
                        </div>
                      )}

                      {/* Card Payment */}
                      {paymentMethod === 'card' && (
                        <div className="space-y-4 p-4 border rounded-lg bg-white/50">
                          <div>
                            <Label htmlFor="cardNumber" className="text-sm font-medium">
                              {currentLang === 'en' ? 'Card Number' : 'رقم البطاقة'}
                            </Label>
                            <Input
                              id="cardNumber"
                              placeholder="1234 5678 9012 3456"
                              className="mt-1"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="expiry" className="text-sm font-medium">
                                {currentLang === 'en' ? 'Expiry Date' : 'تاريخ الانتهاء'}
                              </Label>
                              <Input
                                id="expiry"
                                placeholder="MM/YY"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor="cvv" className="text-sm font-medium">
                                CVV
                              </Label>
                              <Input
                                id="cvv"
                                placeholder="123"
                                className="mt-1"
                              />
                            </div>
                          </div>
                          <Button
                            onClick={handleCardPayment}
                            disabled={isProcessing}
                            className="w-full bg-gradient-to-r from-teal-green to-teal-green/80 hover:from-teal-green/90 hover:to-teal-green/70 text-white"
                          >
                            {isProcessing ? (
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                {currentLang === 'en' ? 'Processing...' : 'جاري المعالجة...'}
                              </div>
                            ) : (
                              <>
                                {currentLang === 'en' ? 'Pay Now' : 'ادفع الآن'} ${total.toFixed(2)}
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
