import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Eye, 
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { orderService, Order } from '@/services/orderService';
import { toast } from 'sonner';

interface OrdersManagerProps {
  currentLang: 'en' | 'ar';
}

export function OrdersManager({ currentLang }: OrdersManagerProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    today: 0,
    pending: 0,
    processing: 0,
    delivered: 0
  });
  const isRTL = currentLang === 'ar';

  const statusOptions = [
    { value: 'all', label: currentLang === 'ar' ? 'جميع الحالات' : 'All Status' },
    { value: 'pending', label: currentLang === 'ar' ? 'في الانتظار' : 'Pending' },
    { value: 'confirmed', label: currentLang === 'ar' ? 'مؤكد' : 'Confirmed' },
    { value: 'processing', label: currentLang === 'ar' ? 'قيد المعالجة' : 'Processing' },
    { value: 'shipped', label: currentLang === 'ar' ? 'تم الشحن' : 'Shipped' },
    { value: 'delivered', label: currentLang === 'ar' ? 'تم التسليم' : 'Delivered' },
    { value: 'cancelled', label: currentLang === 'ar' ? 'ملغي' : 'Cancelled' }
  ];

  // Load orders from API
  useEffect(() => {
    loadOrders();
    loadStats();
  }, []);

  // Reload orders when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadOrders();
    }, 500); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchQuery, statusFilter]);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const response = await orderService.getOrders({
        orderStatus: statusFilter !== 'all' ? statusFilter : undefined,
        orderNumber: searchQuery || undefined,
        customerEmail: searchQuery || undefined,
        page: 1,
        limit: 50,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      setOrders(response.orders);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error(currentLang === 'ar' ? 'خطأ في تحميل الطلبات' : 'Error loading orders');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [todayOrders, orderStats] = await Promise.all([
        orderService.getTodayOrders(),
        orderService.getOrderStats()
      ]);

      setStats({
        today: todayOrders.length,
        pending: todayOrders.filter(o => o.orderStatus === 'pending').length,
        processing: todayOrders.filter(o => o.orderStatus === 'processing').length,
        delivered: todayOrders.filter(o => o.orderStatus === 'delivered').length
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus, 'order');
      await loadOrders(); // Reload orders after update
      toast.success(currentLang === 'ar' ? 'تم تحديث حالة الطلب' : 'Order status updated');
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error(currentLang === 'ar' ? 'خطأ في تحديث حالة الطلب' : 'Error updating order status');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'confirmed': return CheckCircle;
      case 'processing': return Package;
      case 'shipped': return Truck;
      case 'delivered': return CheckCircle;
      case 'cancelled': return XCircle;
      default: return Clock;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return currentLang === 'ar' 
      ? date.toLocaleDateString('ar-EG')
      : date.toLocaleDateString('en-US');
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-off-white mb-2">
            {currentLang === 'ar' ? 'إدارة الطلبات' : 'Orders Management'}
          </h1>
          <p className="text-beige/80">
            {currentLang === 'ar' ? 'متابعة وإدارة طلبات العملاء' : 'Track and manage customer orders'}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            title: currentLang === 'ar' ? 'طلبات اليوم' : "Today's Orders",
            value: stats.today.toString(),
            icon: Package,
            color: 'from-blue-500 to-blue-600'
          },
          {
            title: currentLang === 'ar' ? 'في الانتظار' : 'Pending',
            value: stats.pending.toString(),
            icon: Clock,
            color: 'from-yellow-500 to-yellow-600'
          },
          {
            title: currentLang === 'ar' ? 'قيد المعالجة' : 'Processing',
            value: stats.processing.toString(),
            icon: Package,
            color: 'from-purple-500 to-purple-600'
          },
          {
            title: currentLang === 'ar' ? 'تم التسليم' : 'Delivered',
            value: stats.delivered.toString(),
            icon: CheckCircle,
            color: 'from-green-500 to-green-600'
          }
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-off-white/95 backdrop-blur-sm border-gold/20 shadow-luxury">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-dark-tea/60">{stat.title}</p>
                    <p className="text-2xl font-bold text-dark-tea">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.color}`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card className="bg-off-white/95 backdrop-blur-sm border-gold/20 shadow-luxury">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className={`absolute top-1/2 transform -translate-y-1/2 ${isRTL ? 'right-3' : 'left-3'} w-4 h-4 text-dark-tea/40`} />
                <Input
                  placeholder={currentLang === 'ar' ? 'البحث في الطلبات...' : 'Search orders...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`${isRTL ? 'pr-10' : 'pl-10'} border-gold/20 focus:border-gold/50`}
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 border-gold/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="bg-off-white/95 backdrop-blur-sm border-gold/20 shadow-luxury">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-gold border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-4 text-dark-tea/60">
                {currentLang === 'ar' ? 'جاري التحميل...' : 'Loading...'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow className="border-gold/20">
                  <TableHead className="text-dark-tea font-semibold">
                    {currentLang === 'ar' ? 'رقم الطلب' : 'Order #'}
                  </TableHead>
                  <TableHead className="text-dark-tea font-semibold">
                    {currentLang === 'ar' ? 'العميل' : 'Customer'}
                  </TableHead>
                  <TableHead className="text-dark-tea font-semibold">
                    {currentLang === 'ar' ? 'المبلغ' : 'Amount'}
                  </TableHead>
                  <TableHead className="text-dark-tea font-semibold">
                    {currentLang === 'ar' ? 'حالة الطلب' : 'Order Status'}
                  </TableHead>
                  <TableHead className="text-dark-tea font-semibold">
                    {currentLang === 'ar' ? 'حالة الدفع' : 'Payment'}
                  </TableHead>
                  <TableHead className="text-dark-tea font-semibold">
                    {currentLang === 'ar' ? 'التاريخ' : 'Date'}
                  </TableHead>
                  <TableHead className="text-dark-tea font-semibold">
                    {currentLang === 'ar' ? 'الإجراءات' : 'Actions'}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {orders.map((order, index) => {
                    const StatusIcon = getStatusIcon(order.orderStatus);
                    return (
                      <motion.tr
                        key={order._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-gold/10 hover:bg-gold/5 transition-colors"
                      >
                        <TableCell className="font-medium text-dark-tea">
                          {order.orderNumber}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3 rtl:space-x-reverse">
                            <div className="w-8 h-8 bg-gradient-to-br from-gold to-light-brown rounded-full flex items-center justify-center">
                              <span className="text-off-white text-sm font-medium">
                                {order.customerInfo.firstName.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-dark-tea">
                                {order.customerInfo.firstName} {order.customerInfo.lastName}
                              </p>
                              <p className="text-sm text-dark-tea/60">
                                {order.customerInfo.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-dark-tea">
                          ₪{order.total}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${orderService.getStatusColor(order.orderStatus)} border`}>
                            <StatusIcon className="w-3 h-3 mr-1 rtl:ml-1 rtl:mr-0" />
                            {orderService.formatOrderStatus(order.orderStatus, currentLang)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={orderService.getStatusColor(order.paymentStatus)}>
                            {orderService.formatPaymentStatus(order.paymentStatus, currentLang)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-dark-tea/70">
                          {formatDate(order.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedOrder(order)}
                              className="border-gold/30 hover:bg-gold/10"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Select
                              value={order.orderStatus}
                              onValueChange={(value) => updateOrderStatus(order._id, value)}
                            >
                              <SelectTrigger className="w-32 h-8 border-gold/30">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {statusOptions.slice(1).map(option => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {currentLang === 'ar' ? 'تفاصيل الطلب' : 'Order Details'} #{selectedOrder?.orderNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <User className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" />
                    {currentLang === 'ar' ? 'معلومات العميل' : 'Customer Information'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-dark-tea/60">{currentLang === 'ar' ? 'الاسم' : 'Name'}</p>
                      <p className="font-medium">{selectedOrder.customerInfo.firstName} {selectedOrder.customerInfo.lastName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-dark-tea/60">{currentLang === 'ar' ? 'البريد الإلكتروني' : 'Email'}</p>
                      <p className="font-medium">{selectedOrder.customerInfo.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-dark-tea/60">{currentLang === 'ar' ? 'الهاتف' : 'Phone'}</p>
                      <p className="font-medium">{selectedOrder.customerInfo.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-dark-tea/60">{currentLang === 'ar' ? 'المدينة' : 'City'}</p>
                      <p className="font-medium">{selectedOrder.customerInfo.city}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-dark-tea/60">{currentLang === 'ar' ? 'العنوان' : 'Address'}</p>
                    <p className="font-medium">{selectedOrder.customerInfo.address}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Package className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" />
                    {currentLang === 'ar' ? 'المنتجات' : 'Order Items'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gold/5 rounded-lg">
                        <div>
                          <p className="font-medium">{item.name[currentLang]}</p>
                          <p className="text-sm text-dark-tea/60">
                            {currentLang === 'ar' ? 'الكمية:' : 'Quantity:'} {item.quantity}
                          </p>
                        </div>
                        <p className="font-bold">₪{item.price * item.quantity}</p>
                      </div>
                    ))}
                    <div className="border-t pt-3 flex justify-between items-center font-bold text-lg">
                      <span>{currentLang === 'ar' ? 'الإجمالي:' : 'Total:'}</span>
                      <span>₪{selectedOrder.total}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Calendar className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" />
                    {currentLang === 'ar' ? 'معلومات الدفع' : 'Payment Information'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-dark-tea/60">{currentLang === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</p>
                      <p className="font-medium capitalize">{selectedOrder.paymentMethod}</p>
                    </div>
                    <div>
                      <p className="text-sm text-dark-tea/60">{currentLang === 'ar' ? 'حالة الدفع' : 'Payment Status'}</p>
                      <Badge className={orderService.getStatusColor(selectedOrder.paymentStatus)}>
                        {orderService.formatPaymentStatus(selectedOrder.paymentStatus, currentLang)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
