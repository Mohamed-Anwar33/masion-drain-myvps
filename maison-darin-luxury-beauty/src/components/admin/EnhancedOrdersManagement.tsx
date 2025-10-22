import React, { useState, useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { LuxuryNotification } from '@/components/ui/LuxuryNotification';
import { 
  Package, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Eye,
  Edit,
  Check,
  X,
  Clock,
  Truck,
  CheckCircle,
  AlertCircle,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';

interface OrderItem {
  productId: string;
  productName: string;
  productImage?: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode?: string;
    notes?: string;
  };
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  paymentMethod: 'cash_on_delivery' | 'bank_transfer' | 'credit_card' | 'paypal';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  orderDate: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

const EnhancedOrdersManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [updating, setUpdating] = useState(false);

  const { showSaveSuccess, showSaveError, notifications } = useNotifications();

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter, paymentFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      
      if (!token) {
        showSaveError('يجب تسجيل الدخول أولاً');
        return;
      }

      const response = await fetch('/api/orders?sortBy=createdAt&sortOrder=desc&limit=50', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Orders data:', data);
        
        // Handle different response structures
        const ordersArray = data.data?.orders || data.orders || data || [];
        setOrders(ordersArray);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch orders:', response.status, errorText);
        showSaveError('فشل في تحميل الطلبات');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      showSaveError('خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerInfo.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerInfo.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerInfo.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Payment filter
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(order => order.paymentStatus === paymentFilter);
    }

    setFilteredOrders(filtered);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdating(true);
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');

      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        await fetchOrders(); // Refresh orders
        showSaveSuccess();
        setSelectedOrder(null);
        setShowOrderDetails(false);
      } else {
        showSaveError('فشل في تحديث حالة الطلب');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      showSaveError('خطأ في الاتصال بالخادم');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'confirmed': return <Check className="w-4 h-4 text-blue-500" />;
      case 'processing': return <Package className="w-4 h-4 text-orange-500" />;
      case 'shipped': return <Truck className="w-4 h-4 text-purple-500" />;
      case 'delivered': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled': return <X className="w-4 h-4 text-red-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'paid': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <X className="w-4 h-4 text-red-500" />;
      case 'refunded': return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      'pending': 'قيد المراجعة',
      'confirmed': 'مؤكد',
      'processing': 'قيد التحضير',
      'shipped': 'تم الشحن',
      'delivered': 'تم التسليم',
      'cancelled': 'ملغي'
    };
    return statusMap[status] || status;
  };

  const getPaymentStatusText = (status: string) => {
    const statusMap = {
      'pending': 'في انتظار الدفع',
      'paid': 'تم الدفع',
      'failed': 'فشل الدفع',
      'refunded': 'مُسترد'
    };
    return statusMap[status] || status;
  };

  const getPaymentMethodText = (method: string) => {
    const methodMap = {
      'cash_on_delivery': 'الدفع عند الاستلام',
      'bank_transfer': 'تحويل بنكي',
      'credit_card': 'بطاقة ائتمان',
      'paypal': 'PayPal'
    };
    return methodMap[method] || method;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
          <p className="text-beige/80">جاري تحميل الطلبات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-beige mb-2">إدارة الطلبات</h1>
          <p className="text-beige/60">عرض وإدارة جميع الطلبات الواردة من العملاء</p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="flex items-center gap-2 bg-gold hover:bg-gold/90 text-dark-brown px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </button>
      </div>

      {/* Filters */}
      <div className="bg-dark-brown/50 backdrop-blur-sm border border-gold/20 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-beige/40 w-4 h-4" />
            <input
              type="text"
              placeholder="البحث برقم الطلب، اسم العميل، أو الإيميل..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-dark-brown/30 border border-gold/20 rounded-lg pl-4 pr-10 py-2 text-beige placeholder-beige/40 focus:border-gold focus:outline-none"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-dark-brown/30 border border-gold/20 rounded-lg px-4 py-2 text-beige focus:border-gold focus:outline-none"
          >
            <option value="all">جميع الحالات</option>
            <option value="pending">قيد المراجعة</option>
            <option value="confirmed">مؤكد</option>
            <option value="processing">قيد التحضير</option>
            <option value="shipped">تم الشحن</option>
            <option value="delivered">تم التسليم</option>
            <option value="cancelled">ملغي</option>
          </select>

          {/* Payment Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="bg-dark-brown/30 border border-gold/20 rounded-lg px-4 py-2 text-beige focus:border-gold focus:outline-none"
          >
            <option value="all">جميع حالات الدفع</option>
            <option value="pending">في انتظار الدفع</option>
            <option value="paid">تم الدفع</option>
            <option value="failed">فشل الدفع</option>
            <option value="refunded">مُسترد</option>
          </select>

          {/* Results Count */}
          <div className="flex items-center justify-center bg-gold/10 border border-gold/20 rounded-lg px-4 py-2">
            <span className="text-gold font-medium">
              {filteredOrders.length} طلب
            </span>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-beige/30 mx-auto mb-4" />
          <p className="text-beige/60 text-lg">لا توجد طلبات تطابق البحث</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map((order) => (
            <div key={order._id} className="bg-dark-brown/50 backdrop-blur-sm border border-gold/20 rounded-xl p-6 hover:border-gold/40 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gold">{order.orderNumber}</h3>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(order.status)}
                      <span className="text-sm text-beige/80">{getStatusText(order.status)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPaymentStatusIcon(order.paymentStatus)}
                      <span className="text-sm text-beige/80">{getPaymentStatusText(order.paymentStatus)}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-beige/70">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{order.customerInfo.firstName} {order.customerInfo.lastName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>{order.customerInfo.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(order.orderDate).toLocaleDateString('ar-EG')}</span>
                    </div>
                  </div>
                </div>

                <div className="text-left">
                  <div className="text-2xl font-bold text-gold mb-1">
                    {order.total} ج.م
                  </div>
                  <div className="text-sm text-beige/60">
                    {getPaymentMethodText(order.paymentMethod)}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowOrderDetails(true);
                      }}
                      className="flex items-center gap-1 bg-gold/20 hover:bg-gold/30 text-gold px-3 py-1 rounded-lg text-sm transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      عرض
                    </button>
                  </div>
                </div>
              </div>

              {/* Order Items Preview */}
              <div className="border-t border-gold/10 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-beige/70">
                    <Package className="w-4 h-4" />
                    <span>{order.items.length} منتج</span>
                  </div>
                  <div className="flex -space-x-2">
                    {order.items.slice(0, 3).map((item, index) => (
                      <div key={index} className="w-8 h-8 bg-gold/20 border border-gold/30 rounded-full flex items-center justify-center text-xs text-gold font-medium">
                        {item.quantity}
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="w-8 h-8 bg-beige/20 border border-beige/30 rounded-full flex items-center justify-center text-xs text-beige font-medium">
                        +{order.items.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-brown border border-gold/20 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-dark-brown border-b border-gold/20 p-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gold">{selectedOrder.orderNumber}</h2>
                <p className="text-beige/60">تفاصيل الطلب</p>
              </div>
              <button
                onClick={() => {
                  setShowOrderDetails(false);
                  setSelectedOrder(null);
                }}
                className="text-beige/60 hover:text-beige p-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="bg-dark-brown/30 border border-gold/10 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gold mb-3">معلومات العميل</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-beige/60">الاسم:</label>
                    <p className="text-beige">{selectedOrder.customerInfo.firstName} {selectedOrder.customerInfo.lastName}</p>
                  </div>
                  <div>
                    <label className="text-beige/60">البريد الإلكتروني:</label>
                    <p className="text-beige">{selectedOrder.customerInfo.email}</p>
                  </div>
                  <div>
                    <label className="text-beige/60">رقم الهاتف:</label>
                    <p className="text-beige">{selectedOrder.customerInfo.phone}</p>
                  </div>
                  <div>
                    <label className="text-beige/60">المدينة:</label>
                    <p className="text-beige">{selectedOrder.customerInfo.city}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-beige/60">العنوان:</label>
                    <p className="text-beige">{selectedOrder.customerInfo.address}</p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-dark-brown/30 border border-gold/10 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gold mb-3">المنتجات المطلوبة</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-dark-brown/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        {item.productImage && (
                          <img src={item.productImage} alt={item.productName} className="w-12 h-12 rounded-lg object-cover" />
                        )}
                        <div>
                          <p className="font-medium text-beige">{item.productName}</p>
                          <p className="text-sm text-beige/60">{item.price} ج.م × {item.quantity}</p>
                        </div>
                      </div>
                      <div className="text-gold font-bold">
                        {item.subtotal} ج.م
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-gold/10 mt-4 pt-4 space-y-2">
                  <div className="flex justify-between text-beige/70">
                    <span>المجموع الفرعي:</span>
                    <span>{selectedOrder.subtotal} ج.م</span>
                  </div>
                  {selectedOrder.shippingCost > 0 && (
                    <div className="flex justify-between text-beige/70">
                      <span>تكلفة الشحن:</span>
                      <span>{selectedOrder.shippingCost} ج.م</span>
                    </div>
                  )}
                  {selectedOrder.tax > 0 && (
                    <div className="flex justify-between text-beige/70">
                      <span>الضرائب:</span>
                      <span>{selectedOrder.tax} ج.م</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold text-gold border-t border-gold/20 pt-2">
                    <span>المجموع الإجمالي:</span>
                    <span>{selectedOrder.total} ج.م</span>
                  </div>
                </div>
              </div>

              {/* Order Status Update */}
              <div className="bg-dark-brown/30 border border-gold/10 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gold mb-3">تحديث حالة الطلب</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { value: 'pending', label: 'قيد المراجعة', color: 'yellow' },
                    { value: 'confirmed', label: 'مؤكد', color: 'blue' },
                    { value: 'processing', label: 'قيد التحضير', color: 'orange' },
                    { value: 'shipped', label: 'تم الشحن', color: 'purple' },
                    { value: 'delivered', label: 'تم التسليم', color: 'green' },
                    { value: 'cancelled', label: 'ملغي', color: 'red' }
                  ].map((status) => (
                    <button
                      key={status.value}
                      onClick={() => updateOrderStatus(selectedOrder._id, status.value)}
                      disabled={updating || selectedOrder.status === status.value}
                      className={`flex items-center justify-center gap-2 p-3 rounded-lg font-medium transition-colors ${
                        selectedOrder.status === status.value
                          ? 'bg-gold text-dark-brown'
                          : 'bg-dark-brown/20 hover:bg-dark-brown/40 text-beige border border-gold/20 hover:border-gold/40'
                      } disabled:opacity-50`}
                    >
                      {getStatusIcon(status.value)}
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <LuxuryNotification key={notification.id} {...notification} />
        ))}
      </div>
    </div>
  );
};

export default EnhancedOrdersManagement;
