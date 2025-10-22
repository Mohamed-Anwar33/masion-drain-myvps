import { useState, useEffect } from 'react';
import { 
  Search, 
  Package, 
  Clock, 
  CheckCircle, 
  Truck, 
  MapPin,
  Calendar,
  User,
  Mail,
  Phone,
  AlertCircle
} from 'lucide-react';
import { orderService, Order } from '@/services/orderService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface OrderTrackingProps {
  currentLang: 'en' | 'ar';
}

export default function OrderTracking({ currentLang }: OrderTrackingProps) {
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleTrackOrder = async () => {
    if (!orderNumber.trim() || !email.trim()) {
      toast({
        title: currentLang === 'ar' ? "خطأ" : "Error",
        description: currentLang === 'ar' ? "يرجى إدخال رقم الطلب والبريد الإلكتروني" : "Please enter order number and email",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Search for order by order number and email
      const response = await orderService.searchOrders(orderNumber.trim(), {
        customerEmail: email.trim(),
        limit: 1
      });

      if (response.orders.length === 0) {
        setError(currentLang === 'ar' ? 'لم يتم العثور على الطلب' : 'Order not found');
        setOrder(null);
      } else {
        const foundOrder = response.orders[0];
        // Verify email matches
        if (foundOrder.customerInfo.email.toLowerCase() === email.trim().toLowerCase()) {
          setOrder(foundOrder);
          setError(null);
        } else {
          setError(currentLang === 'ar' ? 'البيانات غير صحيحة' : 'Invalid credentials');
          setOrder(null);
        }
      }
    } catch (err) {
      const errorMessage = currentLang === 'ar' ? 'حدث خطأ أثناء البحث عن الطلب' : 'Error searching for order';
      setError(errorMessage);
      setOrder(null);
      toast({
        title: currentLang === 'ar' ? "خطأ" : "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(currentLang === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat(currentLang === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  return (
    <div className={`min-h-screen bg-gray-50 py-12 ${currentLang === 'ar' ? 'rtl' : 'ltr'}`} dir={currentLang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {currentLang === 'ar' ? 'تتبع الطلب' : 'Track Your Order'}
          </h1>
          <p className="text-gray-600">
            {currentLang === 'ar' 
              ? 'أدخل رقم الطلب والبريد الإلكتروني لتتبع حالة طلبك'
              : 'Enter your order number and email to track your order status'
            }
          </p>
        </div>

        {/* Search Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className={`h-5 w-5 ${currentLang === 'ar' ? 'ml-2' : 'mr-2'}`} />
              {currentLang === 'ar' ? 'البحث عن الطلب' : 'Search Order'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {currentLang === 'ar' ? 'رقم الطلب' : 'Order Number'}
                </label>
                <Input
                  placeholder={currentLang === 'ar' ? 'مثال: MD123456789' : 'e.g., MD123456789'}
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="uppercase"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {currentLang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                </label>
                <Input
                  type="email"
                  placeholder={currentLang === 'ar' ? 'example@email.com' : 'example@email.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <Button 
              onClick={handleTrackOrder} 
              disabled={loading}
              className="w-full md:w-auto"
            >
              {loading ? (
                <>
                  <Clock className={`h-4 w-4 animate-spin ${currentLang === 'ar' ? 'ml-2' : 'mr-2'}`} />
                  {currentLang === 'ar' ? 'جاري البحث...' : 'Searching...'}
                </>
              ) : (
                <>
                  <Search className={`h-4 w-4 ${currentLang === 'ar' ? 'ml-2' : 'mr-2'}`} />
                  {currentLang === 'ar' ? 'تتبع الطلب' : 'Track Order'}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center text-red-600">
                <AlertCircle className={`h-5 w-5 ${currentLang === 'ar' ? 'ml-2' : 'mr-2'}`} />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Details */}
        {order && (
          <div className="space-y-6">
            {/* Order Header */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl">
                      {currentLang === 'ar' ? 'الطلب' : 'Order'} {order.orderNumber}
                    </CardTitle>
                    <p className="text-gray-600 mt-1">
                      {currentLang === 'ar' ? 'تم الإنشاء في' : 'Created on'} {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant="default" 
                      className="text-sm mb-2"
                    >
                      {orderService.formatOrderStatus(order.orderStatus, currentLang)}
                    </Badge>
                    <div className="text-lg font-bold">
                      {formatCurrency(order.total)}
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Order Status Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className={`h-5 w-5 ${currentLang === 'ar' ? 'ml-2' : 'mr-2'}`} />
                  {currentLang === 'ar' ? 'حالة الطلب' : 'Order Status'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <OrderStatusTimeline order={order} currentLang={currentLang} />
              </CardContent>
            </Card>

            {/* Customer & Shipping Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className={`h-5 w-5 ${currentLang === 'ar' ? 'ml-2' : 'mr-2'}`} />
                    {currentLang === 'ar' ? 'معلومات العميل' : 'Customer Information'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      {currentLang === 'ar' ? 'الاسم' : 'Name'}
                    </label>
                    <div className="mt-1">
                      {order.customerInfo.firstName} {order.customerInfo.lastName}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      {currentLang === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                    </label>
                    <div className="mt-1 flex items-center">
                      <Mail className={`h-4 w-4 text-gray-400 ${currentLang === 'ar' ? 'ml-2' : 'mr-2'}`} />
                      {order.customerInfo.email}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      {currentLang === 'ar' ? 'الهاتف' : 'Phone'}
                    </label>
                    <div className="mt-1 flex items-center">
                      <Phone className={`h-4 w-4 text-gray-400 ${currentLang === 'ar' ? 'ml-2' : 'mr-2'}`} />
                      {order.customerInfo.phone}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className={`h-5 w-5 ${currentLang === 'ar' ? 'ml-2' : 'mr-2'}`} />
                    {currentLang === 'ar' ? 'عنوان التسليم' : 'Shipping Address'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    <div>{order.customerInfo.address}</div>
                    <div>{order.customerInfo.city}, {order.customerInfo.postalCode}</div>
                    <div>{order.customerInfo.country}</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className={`h-5 w-5 ${currentLang === 'ar' ? 'ml-2' : 'mr-2'}`} />
                  {currentLang === 'ar' ? 'منتجات الطلب' : 'Order Items'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-3 border-b last:border-b-0">
                      <div className="flex-1">
                        <h4 className="font-medium">
                          {currentLang === 'ar' ? item.name.ar : item.name.en}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {currentLang === 'ar' ? 'الكمية:' : 'Quantity:'} {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(item.price)}</div>
                        <div className="text-sm text-gray-600">
                          {currentLang === 'ar' ? 'المجموع:' : 'Total:'} {formatCurrency(item.price * item.quantity)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>{currentLang === 'ar' ? 'المجموع الكلي:' : 'Total Amount:'}</span>
                    <span>{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {order.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {currentLang === 'ar' ? 'ملاحظات' : 'Notes'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{order.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Order Status Timeline Component
interface OrderStatusTimelineProps {
  order: Order;
  currentLang: 'en' | 'ar';
}

function OrderStatusTimeline({ order, currentLang }: OrderStatusTimelineProps) {
  const statusSteps = [
    { 
      key: 'pending', 
      label: currentLang === 'ar' ? 'في الانتظار' : 'Pending', 
      icon: Clock,
      description: currentLang === 'ar' ? 'تم استلام الطلب' : 'Order received'
    },
    { 
      key: 'confirmed', 
      label: currentLang === 'ar' ? 'مؤكد' : 'Confirmed', 
      icon: CheckCircle,
      description: currentLang === 'ar' ? 'تم تأكيد الطلب' : 'Order confirmed'
    },
    { 
      key: 'processing', 
      label: currentLang === 'ar' ? 'قيد المعالجة' : 'Processing', 
      icon: Package,
      description: currentLang === 'ar' ? 'جاري تحضير الطلب' : 'Preparing your order'
    },
    { 
      key: 'shipped', 
      label: currentLang === 'ar' ? 'تم الشحن' : 'Shipped', 
      icon: Truck,
      description: currentLang === 'ar' ? 'تم شحن الطلب' : 'Order shipped'
    },
    { 
      key: 'delivered', 
      label: currentLang === 'ar' ? 'تم التسليم' : 'Delivered', 
      icon: CheckCircle,
      description: currentLang === 'ar' ? 'تم تسليم الطلب' : 'Order delivered'
    }
  ];

  const currentStatusIndex = statusSteps.findIndex(step => step.key === order.orderStatus);
  const isCancelled = order.orderStatus === 'cancelled';

  if (isCancelled) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
          <p className="text-red-600 font-medium">
            {currentLang === 'ar' ? 'تم إلغاء الطلب' : 'Order Cancelled'}
          </p>
          {order.notes && (
            <p className="text-sm text-gray-500 mt-1">{order.notes}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="space-y-6">
        {statusSteps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index <= currentStatusIndex;
          const isCurrent = index === currentStatusIndex;
          
          return (
            <div key={step.key} className="flex items-start">
              {/* Timeline Line */}
              {index < statusSteps.length - 1 && (
                <div 
                  className={`absolute ${currentLang === 'ar' ? 'right-6' : 'left-6'} mt-8 w-0.5 h-6 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              )}
              
              {/* Status Icon */}
              <div 
                className={`w-12 h-12 rounded-full flex items-center justify-center border-2 relative z-10 ${
                  isCompleted 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : isCurrent
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              
              {/* Status Content */}
              <div className={`flex-1 ${currentLang === 'ar' ? 'mr-4' : 'ml-4'}`}>
                <div className="flex items-center justify-between">
                  <h4 className={`font-medium ${
                    isCompleted ? 'text-green-600' : isCurrent ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </h4>
                  {isCurrent && (
                    <span className="text-sm text-blue-600">
                      {currentLang === 'ar' ? 'الحالة الحالية' : 'Current Status'}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {step.description}
                </p>
                {isCurrent && (
                  <p className="text-xs text-gray-500 mt-1">
                    {currentLang === 'ar' ? 'آخر تحديث:' : 'Last updated:'} {formatDate(order.updatedAt)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateString));
}