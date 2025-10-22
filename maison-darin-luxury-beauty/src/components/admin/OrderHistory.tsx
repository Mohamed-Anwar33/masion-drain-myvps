import { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Package, 
  Truck, 
  CreditCard,
  User,
  Calendar,
  Activity
} from 'lucide-react';
import { Order } from '@/services/orderService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface OrderHistoryProps {
  order: Order;
  currentLang: 'en' | 'ar';
}

interface OrderEvent {
  id: string;
  type: 'status_change' | 'payment' | 'note' | 'creation';
  timestamp: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  details?: any;
}

export default function OrderHistory({ order, currentLang }: OrderHistoryProps) {
  const [events, setEvents] = useState<OrderEvent[]>([]);

  useEffect(() => {
    generateOrderEvents();
  }, [order]);

  const generateOrderEvents = () => {
    const orderEvents: OrderEvent[] = [];

    // Order creation event
    orderEvents.push({
      id: 'creation',
      type: 'creation',
      timestamp: order.createdAt,
      title: currentLang === 'ar' ? 'تم إنشاء الطلب' : 'Order Created',
      description: currentLang === 'ar' 
        ? `تم إنشاء الطلب رقم ${order.orderNumber} بواسطة ${order.customerInfo.firstName} ${order.customerInfo.lastName}`
        : `Order ${order.orderNumber} created by ${order.customerInfo.firstName} ${order.customerInfo.lastName}`,
      icon: Package,
      color: 'blue',
      details: {
        customer: `${order.customerInfo.firstName} ${order.customerInfo.lastName}`,
        email: order.customerInfo.email,
        total: order.total,
        items: order.items.length
      }
    });

    // Payment status events
    if (order.paymentStatus === 'completed') {
      orderEvents.push({
        id: 'payment_completed',
        type: 'payment',
        timestamp: order.updatedAt, // In real app, this would be payment completion time
        title: currentLang === 'ar' ? 'تم الدفع' : 'Payment Completed',
        description: currentLang === 'ar' 
          ? `تم استلام الدفع بنجاح عبر ${getPaymentMethodName(order.paymentMethod)}`
          : `Payment received successfully via ${getPaymentMethodName(order.paymentMethod)}`,
        icon: CreditCard,
        color: 'green',
        details: {
          method: order.paymentMethod,
          amount: order.total
        }
      });
    }

    // Order status events based on current status
    const statusEvents = generateStatusEvents(order);
    orderEvents.push(...statusEvents);

    // Notes events
    if (order.notes) {
      orderEvents.push({
        id: 'note_added',
        type: 'note',
        timestamp: order.updatedAt,
        title: currentLang === 'ar' ? 'تمت إضافة ملاحظة' : 'Note Added',
        description: order.notes,
        icon: Activity,
        color: 'gray'
      });
    }

    // Sort events by timestamp (newest first)
    orderEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    setEvents(orderEvents);
  };

  const generateStatusEvents = (order: Order): OrderEvent[] => {
    const events: OrderEvent[] = [];
    const statusFlow = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const currentIndex = statusFlow.indexOf(order.orderStatus);

    // Generate events for all completed statuses
    for (let i = 0; i <= currentIndex; i++) {
      const status = statusFlow[i];
      if (status === 'pending') continue; // Skip pending as it's covered by creation

      events.push({
        id: `status_${status}`,
        type: 'status_change',
        timestamp: i === currentIndex ? order.updatedAt : order.createdAt, // In real app, track actual timestamps
        title: getStatusTitle(status),
        description: getStatusDescription(status),
        icon: getStatusIcon(status),
        color: getStatusColor(status),
        details: { status, previousStatus: i > 0 ? statusFlow[i - 1] : 'pending' }
      });
    }

    // Handle cancelled status
    if (order.orderStatus === 'cancelled') {
      events.push({
        id: 'status_cancelled',
        type: 'status_change',
        timestamp: order.updatedAt,
        title: currentLang === 'ar' ? 'تم إلغاء الطلب' : 'Order Cancelled',
        description: currentLang === 'ar' 
          ? 'تم إلغاء الطلب' + (order.notes ? `: ${order.notes}` : '')
          : 'Order was cancelled' + (order.notes ? `: ${order.notes}` : ''),
        icon: XCircle,
        color: 'red'
      });
    }

    return events;
  };

  const getPaymentMethodName = (method: string) => {
    const methods = {
      paypal: 'PayPal',
      card: currentLang === 'ar' ? 'بطاقة ائتمان' : 'Credit Card',
      bank_transfer: currentLang === 'ar' ? 'تحويل بنكي' : 'Bank Transfer'
    };
    return methods[method as keyof typeof methods] || method;
  };

  const getStatusTitle = (status: string) => {
    const titles = {
      ar: {
        confirmed: 'تم تأكيد الطلب',
        processing: 'بدء معالجة الطلب',
        shipped: 'تم شحن الطلب',
        delivered: 'تم تسليم الطلب'
      },
      en: {
        confirmed: 'Order Confirmed',
        processing: 'Processing Started',
        shipped: 'Order Shipped',
        delivered: 'Order Delivered'
      }
    };
    return titles[currentLang][status as keyof typeof titles.ar] || status;
  };

  const getStatusDescription = (status: string) => {
    const descriptions = {
      ar: {
        confirmed: 'تم تأكيد الطلب وسيتم البدء في معالجته',
        processing: 'جاري تحضير المنتجات للشحن',
        shipped: 'تم شحن الطلب وهو في الطريق إليك',
        delivered: 'تم تسليم الطلب بنجاح'
      },
      en: {
        confirmed: 'Order confirmed and will be processed soon',
        processing: 'Products are being prepared for shipment',
        shipped: 'Order has been shipped and is on its way',
        delivered: 'Order has been successfully delivered'
      }
    };
    return descriptions[currentLang][status as keyof typeof descriptions.ar] || status;
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      confirmed: CheckCircle,
      processing: Package,
      shipped: Truck,
      delivered: CheckCircle
    };
    return icons[status as keyof typeof icons] || Activity;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      confirmed: 'blue',
      processing: 'yellow',
      shipped: 'purple',
      delivered: 'green'
    };
    return colors[status as keyof typeof colors] || 'gray';
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat(currentLang === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-100 text-blue-600 border-blue-200',
      green: 'bg-green-100 text-green-600 border-green-200',
      yellow: 'bg-yellow-100 text-yellow-600 border-yellow-200',
      purple: 'bg-purple-100 text-purple-600 border-purple-200',
      red: 'bg-red-100 text-red-600 border-red-200',
      gray: 'bg-gray-100 text-gray-600 border-gray-200'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.gray;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className={`h-5 w-5 ${currentLang === 'ar' ? 'ml-2' : 'mr-2'}`} />
          {currentLang === 'ar' ? 'تاريخ الطلب' : 'Order History'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.map((event, index) => {
            const Icon = event.icon;
            const colorClasses = getColorClasses(event.color);
            
            return (
              <div key={event.id} className="flex items-start space-x-4 rtl:space-x-reverse">
                {/* Timeline Line */}
                {index < events.length - 1 && (
                  <div 
                    className={`absolute ${currentLang === 'ar' ? 'right-6' : 'left-6'} mt-8 w-0.5 h-16 bg-gray-200`}
                    style={{ marginTop: '2rem' }}
                  />
                )}
                
                {/* Event Icon */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center relative z-10 bg-white ${colorClasses}`}>
                  <Icon className="h-4 w-4" />
                </div>
                
                {/* Event Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900">
                      {event.title}
                    </h4>
                    <time className="text-xs text-gray-500">
                      {formatDate(event.timestamp)}
                    </time>
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-1">
                    {event.description}
                  </p>
                  
                  {/* Event Details */}
                  {event.details && (
                    <div className="mt-2">
                      {event.type === 'creation' && (
                        <div className="text-xs text-gray-500 space-y-1">
                          <div>{currentLang === 'ar' ? 'العميل:' : 'Customer:'} {event.details.customer}</div>
                          <div>{currentLang === 'ar' ? 'البريد:' : 'Email:'} {event.details.email}</div>
                          <div>{currentLang === 'ar' ? 'المنتجات:' : 'Items:'} {event.details.items}</div>
                        </div>
                      )}
                      
                      {event.type === 'payment' && (
                        <div className="text-xs text-gray-500">
                          <Badge variant="outline" className="text-xs">
                            {getPaymentMethodName(event.details.method)}
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {events.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>{currentLang === 'ar' ? 'لا يوجد تاريخ للطلب' : 'No order history available'}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}