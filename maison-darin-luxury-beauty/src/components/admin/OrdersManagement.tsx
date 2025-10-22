import React, { useState, useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { Eye, X, Package, User, CreditCard, MapPin, Phone, Mail, Calendar, Trash2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    country: string;
    notes?: string;
  };
  items: Array<{
    productId: string;
    productName: string;
    price: number;
    quantity: number;
    subtotal: number;
  }>;
  total: number;
  subtotal: number;
  shippingCost?: number;
  tax?: number;
  paymentMethod: 'cash_on_delivery' | 'paypal' | 'bank_transfer' | 'card';
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'completed' | 'paid' | 'failed';
  paypalOrderId?: string;
  paypalCaptureId?: string;
  createdAt: string;
  updatedAt: string;
}

const OrdersManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { showSaveSuccess, showSaveError } = useNotifications();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/orders', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('📦 Orders API Response:', result);
        
        if (result.success && result.data) {
          setOrders(result.data);
          console.log(`✅ تم تحميل ${result.data.length} طلب`);
        } else {
          console.error('❌ خطأ في استجابة API:', result);
          showSaveError('فشل في تحميل الطلبات');
        }
      } else {
        console.error('❌ خطأ HTTP:', response.status, response.statusText);
        showSaveError(`خطأ في الخادم: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      showSaveError('فشل في تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ status: status })
      });

      if (response.ok) {
        showSaveSuccess();
        fetchOrders();
      } else {
        showSaveError('فشل في تحديث حالة الطلب');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      showSaveError('فشل في تحديث حالة الطلب');
    }
  };

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
  };

  const printInvoice = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const invoiceHTML = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>فاتورة - ${order.orderNumber}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
            padding: 20px;
          }
          
          .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border: 2px solid #d4af37;
            border-radius: 10px;
            overflow: hidden;
          }
          
          .header {
            background: linear-gradient(135deg, #d4af37, #b8941f);
            color: white;
            padding: 30px;
            text-align: center;
          }
          
          .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: bold;
          }
          
          .header p {
            font-size: 1.2em;
            opacity: 0.9;
          }
          
          .content {
            padding: 30px;
          }
          
          .order-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
          }
          
          .info-section h3 {
            color: #d4af37;
            margin-bottom: 15px;
            font-size: 1.3em;
            border-bottom: 2px solid #d4af37;
            padding-bottom: 5px;
          }
          
          .info-item {
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
          }
          
          .info-label {
            font-weight: bold;
            color: #555;
          }
          
          .info-value {
            color: #333;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          
          .items-table th {
            background: #d4af37;
            color: white;
            padding: 15px;
            text-align: right;
            font-weight: bold;
          }
          
          .items-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #eee;
            text-align: right;
          }
          
          .items-table tr:nth-child(even) {
            background: #f8f9fa;
          }
          
          .total-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-top: 30px;
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 5px 0;
          }
          
          .total-row.final {
            border-top: 2px solid #d4af37;
            padding-top: 15px;
            margin-top: 15px;
            font-size: 1.3em;
            font-weight: bold;
            color: #d4af37;
          }
          
          .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            color: #666;
          }
          
          .status-badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: bold;
          }
          
          .status-delivered { background: #d4edda; color: #155724; }
          .status-pending { background: #fff3cd; color: #856404; }
          .status-confirmed { background: #cce5ff; color: #004085; }
          .status-processing { background: #e1bee7; color: #4a148c; }
          .status-shipped { background: #ffcc80; color: #e65100; }
          .status-cancelled { background: #ffcdd2; color: #c62828; }
          
          @media print {
            body { padding: 0; }
            .invoice-container { border: none; box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <h1>ميزون دارين</h1>
            <p>للعطور الفاخرة</p>
          </div>
          
          <div class="content">
            <div class="order-info">
              <div class="info-section">
                <h3>معلومات الطلب</h3>
                <div class="info-item">
                  <span class="info-label">رقم الطلب:</span>
                  <span class="info-value">${order.orderNumber}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">تاريخ الطلب:</span>
                  <span class="info-value">${new Date(order.createdAt).toLocaleDateString('ar-EG')}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">حالة الطلب:</span>
                  <span class="status-badge status-${order.status}">
                    ${order.status === 'delivered' ? 'مكتمل' : 
                      order.status === 'pending' ? 'معلق' : 
                      order.status === 'confirmed' ? 'مؤكد' : 
                      order.status === 'processing' ? 'قيد المعالجة' :
                      order.status === 'shipped' ? 'تم الشحن' :
                      order.status === 'cancelled' ? 'ملغي' : order.status}
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">طريقة الدفع:</span>
                  <span class="info-value">
                    ${order.paymentMethod === 'paypal' ? 'PayPal' : 
                      order.paymentMethod === 'cash_on_delivery' ? 'نقداً عند التسليم' : 
                      order.paymentMethod}
                  </span>
                </div>
              </div>
              
              <div class="info-section">
                <h3>معلومات العميل</h3>
                <div class="info-item">
                  <span class="info-label">الاسم:</span>
                  <span class="info-value">${order.customerInfo.firstName} ${order.customerInfo.lastName}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">البريد الإلكتروني:</span>
                  <span class="info-value">${order.customerInfo.email}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">الهاتف:</span>
                  <span class="info-value">${order.customerInfo.phone}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">العنوان:</span>
                  <span class="info-value">${order.customerInfo.address}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">المدينة:</span>
                  <span class="info-value">${order.customerInfo.city}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">الدولة:</span>
                  <span class="info-value">${order.customerInfo.country}</span>
                </div>
              </div>
            </div>
            
            <table class="items-table">
              <thead>
                <tr>
                  <th>المنتج</th>
                  <th>الكمية</th>
                  <th>السعر</th>
                  <th>المجموع</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr>
                    <td>${item.productName}</td>
                    <td>${item.quantity}</td>
                    <td>${item.price.toLocaleString()} ريال</td>
                    <td>${item.subtotal.toLocaleString()} ريال</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="total-section">
              <div class="total-row">
                <span>المجموع الفرعي:</span>
                <span>${order.subtotal.toLocaleString()} ريال</span>
              </div>
              ${order.shippingCost ? `
                <div class="total-row">
                  <span>الشحن:</span>
                  <span>${order.shippingCost.toLocaleString()} ريال</span>
                </div>
              ` : ''}
              ${order.tax ? `
                <div class="total-row">
                  <span>الضريبة:</span>
                  <span>${order.tax.toLocaleString()} ريال</span>
                </div>
              ` : ''}
              <div class="total-row final">
                <span>المجموع الكلي:</span>
                <span>${order.total.toLocaleString()} ريال</span>
              </div>
            </div>
            
            ${order.paypalOrderId ? `
              <div style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 8px;">
                <strong>معرف PayPal:</strong> ${order.paypalOrderId}
              </div>
            ` : ''}
          </div>
          
          <div class="footer">
            <p>شكراً لاختياركم ميزون دارين للعطور الفاخرة</p>
            <p>للاستفسارات: info@maisondarin.com | +966 50 123 4567</p>
          </div>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
  };

  const openDeleteModal = (order: Order) => {
    setOrderToDelete(order);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setOrderToDelete(null);
    setIsDeleting(false);
  };

  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return;

    setIsDeleting(true);
    
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        showSaveSuccess();
        fetchOrders(); // إعادة تحميل الطلبات
        closeDeleteModal();
      } else {
        const errorData = await response.json();
        showSaveError(errorData.message || 'فشل في حذف الطلب');
        setIsDeleting(false);
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      showSaveError('حدث خطأ أثناء حذف الطلب');
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'confirmed': return 'bg-blue-500';
      case 'processing': return 'bg-purple-500';
      case 'shipped': return 'bg-orange-500';
      case 'delivered': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'في الانتظار';
      case 'confirmed': return 'مؤكد';
      case 'processing': return 'قيد المعالجة';
      case 'shipped': return 'تم الشحن';
      case 'delivered': return 'تم التسليم';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-display font-bold text-off-white">
          إدارة الطلبات
        </h1>
        <div className="text-beige/80">
          إجمالي الطلبات: {orders.length}
        </div>
      </div>

      <div className="bg-dark-brown/50 rounded-lg border border-gold/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gold/10">
            <thead className="bg-gold/10">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gold uppercase tracking-wider">
                  رقم الطلب
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-beige/60 uppercase tracking-wider">
                  العميل
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-beige/60 uppercase tracking-wider">
                  المبلغ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-beige/60 uppercase tracking-wider">
                  طريقة الدفع
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-beige/60 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-beige/60 uppercase tracking-wider">
                  تاريخ الإنشاء
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gold uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold/10">
              {orders.map((order) => (
                <tr key={order._id} className="hover:bg-gold/5">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-off-white">
                    {order.orderNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-off-white">{order.customerInfo.firstName} {order.customerInfo.lastName}</div>
                    <div className="text-sm text-beige/60">{order.customerInfo.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-off-white">
                    {order.total.toLocaleString()} ريال
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-beige/80">
                    {order.paymentMethod === 'cash_on_delivery' ? 'نقداً عند التسليم' : 
                     order.paymentMethod === 'paypal' ? 'PayPal' :
                     order.paymentMethod === 'bank_transfer' ? 'تحويل بنكي' : 'كارت'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-beige/80">
                    {new Date(order.createdAt).toLocaleDateString('ar-EG')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openOrderDetails(order)}
                        className="inline-flex items-center px-3 py-1.5 bg-gold/20 hover:bg-gold/30 text-gold rounded-lg transition-all duration-200 hover:scale-105"
                      >
                        <Eye className="w-4 h-4 ml-1" />
                        تفاصيل
                      </button>
                      
                      {/* زر الحذف فقط للطلبات غير المدفوعة */}
                      {(order.paymentStatus === 'pending' || order.paymentStatus === 'failed') && (
                        <button
                          onClick={() => openDeleteModal(order)}
                          className="inline-flex items-center px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-lg transition-all duration-200 hover:scale-105"
                          title="حذف الطلب (للطلبات غير المدفوعة فقط)"
                        >
                          <Trash2 className="w-4 h-4 ml-1" />
                          حذف
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {orders.length === 0 && (
        <div className="text-center py-12">
          <div className="text-beige/60 text-lg">
            لا توجد طلبات حتى الآن
          </div>
        </div>
      )}

      {/* Modal تفاصيل الطلب */}
      <AnimatePresence>
        {showModal && selectedOrder && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className="bg-gradient-to-br from-dark-brown to-dark-tea rounded-2xl border border-gold/30 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              dir="rtl"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gold/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gold/20 rounded-lg">
                    <Package className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-display font-bold text-off-white">
                      تفاصيل الطلب
                    </h2>
                    <p className="text-gold font-medium">
                      {selectedOrder.orderNumber}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gold/10 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-beige/60 hover:text-off-white" />
                </button>
              </div>

              <div className="p-6 space-y-8">
                {/* معلومات العميل */}
                <div className="bg-dark-brown/30 rounded-xl p-6 border border-gold/10">
                  <div className="flex items-center gap-3 mb-4">
                    <User className="w-5 h-5 text-gold" />
                    <h3 className="text-lg font-semibold text-off-white">معلومات العميل</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-beige/60" />
                        <span className="text-beige/80">الاسم:</span>
                        <span className="text-off-white font-medium">
                          {selectedOrder.customerInfo.firstName} {selectedOrder.customerInfo.lastName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-beige/60" />
                        <span className="text-beige/80">البريد الإلكتروني:</span>
                        <span className="text-off-white">{selectedOrder.customerInfo.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-beige/60" />
                        <span className="text-beige/80">الهاتف:</span>
                        <span className="text-off-white">{selectedOrder.customerInfo.phone}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-beige/60" />
                        <span className="text-beige/80">العنوان:</span>
                        <span className="text-off-white">{selectedOrder.customerInfo.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-beige/60" />
                        <span className="text-beige/80">المدينة:</span>
                        <span className="text-off-white">{selectedOrder.customerInfo.city}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-beige/60" />
                        <span className="text-beige/80">الدولة:</span>
                        <span className="text-off-white">{selectedOrder.customerInfo.country}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* تفاصيل الطلب */}
                <div className="bg-dark-brown/30 rounded-xl p-6 border border-gold/10">
                  <div className="flex items-center gap-3 mb-4">
                    <Package className="w-5 h-5 text-gold" />
                    <h3 className="text-lg font-semibold text-off-white">تفاصيل الطلب</h3>
                  </div>
                  <div className="space-y-4">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-4 bg-dark-tea/20 rounded-lg">
                        <div>
                          <h4 className="text-off-white font-medium">{item.productName}</h4>
                          <p className="text-beige/60 text-sm">الكمية: {item.quantity}</p>
                        </div>
                        <div className="text-left">
                          <p className="text-off-white font-medium">{item.price.toLocaleString()} ريال</p>
                          <p className="text-beige/60 text-sm">المجموع: {item.subtotal.toLocaleString()} ريال</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* معلومات الدفع */}
                <div className="bg-dark-brown/30 rounded-xl p-6 border border-gold/10">
                  <div className="flex items-center gap-3 mb-4">
                    <CreditCard className="w-5 h-5 text-gold" />
                    <h3 className="text-lg font-semibold text-off-white">معلومات الدفع</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-beige/80">المجموع الفرعي:</span>
                        <span className="text-off-white">{selectedOrder.subtotal.toLocaleString()} ريال</span>
                      </div>
                      {selectedOrder.shippingCost && (
                        <div className="flex justify-between">
                          <span className="text-beige/80">الشحن:</span>
                          <span className="text-off-white">{selectedOrder.shippingCost.toLocaleString()} ريال</span>
                        </div>
                      )}
                      {selectedOrder.tax && (
                        <div className="flex justify-between">
                          <span className="text-beige/80">الضريبة:</span>
                          <span className="text-off-white">{selectedOrder.tax.toLocaleString()} ريال</span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg font-semibold border-t border-gold/20 pt-3">
                        <span className="text-gold">المجموع الكلي:</span>
                        <span className="text-gold">{selectedOrder.total.toLocaleString()} ريال</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-beige/80">طريقة الدفع:</span>
                        <span className="text-off-white">
                          {selectedOrder.paymentMethod === 'cash_on_delivery' ? 'نقداً عند التسليم' : 
                           selectedOrder.paymentMethod === 'paypal' ? 'PayPal' :
                           selectedOrder.paymentMethod === 'bank_transfer' ? 'تحويل بنكي' : 'كارت'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-beige/80">حالة الدفع:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          selectedOrder.paymentStatus === 'completed' || selectedOrder.paymentStatus === 'paid' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {selectedOrder.paymentStatus === 'completed' || selectedOrder.paymentStatus === 'paid' ? 'مدفوع' : 'معلق'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-beige/80">حالة الطلب:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedOrder.status)} text-white`}>
                          {getStatusText(selectedOrder.status)}
                        </span>
                      </div>
                      {selectedOrder.paypalOrderId && (
                        <div className="flex justify-between">
                          <span className="text-beige/80">PayPal Order ID:</span>
                          <span className="text-off-white text-xs font-mono">{selectedOrder.paypalOrderId}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* معلومات إضافية */}
                <div className="bg-dark-brown/30 rounded-xl p-6 border border-gold/10">
                  <div className="flex items-center gap-3 mb-4">
                    <Calendar className="w-5 h-5 text-gold" />
                    <h3 className="text-lg font-semibold text-off-white">معلومات إضافية</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-between">
                      <span className="text-beige/80">تاريخ الإنشاء:</span>
                      <span className="text-off-white">{new Date(selectedOrder.createdAt).toLocaleString('ar-EG')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-beige/80">آخر تحديث:</span>
                      <span className="text-off-white">{new Date(selectedOrder.updatedAt).toLocaleString('ar-EG')}</span>
                    </div>
                  </div>
                  {selectedOrder.customerInfo.notes && (
                    <div className="mt-4 p-4 bg-dark-tea/20 rounded-lg">
                      <h4 className="text-off-white font-medium mb-2">ملاحظات:</h4>
                      <p className="text-beige/80">{selectedOrder.customerInfo.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 p-6 border-t border-gold/20">
                <button
                  onClick={closeModal}
                  className="px-6 py-2 bg-beige/10 hover:bg-beige/20 text-beige rounded-lg transition-colors"
                >
                  إغلاق
                </button>
                <button
                  onClick={() => printInvoice(selectedOrder)}
                  className="px-6 py-2 bg-gold/20 hover:bg-gold/30 text-gold rounded-lg transition-colors"
                >
                  طباعة
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal تأكيد الحذف */}
      <AnimatePresence>
        {showDeleteModal && orderToDelete && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDeleteModal}
          >
            <motion.div
              className="bg-gradient-to-br from-dark-brown to-dark-tea rounded-2xl border border-red-500/30 shadow-2xl max-w-md w-full"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              dir="rtl"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-red-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-bold text-off-white">
                      تأكيد الحذف
                    </h2>
                    <p className="text-red-400 text-sm">
                      هذا الإجراء لا يمكن التراجع عنه
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeDeleteModal}
                  className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                  disabled={isDeleting}
                >
                  <X className="w-5 h-5 text-beige/60 hover:text-off-white" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-off-white font-semibold mb-2">
                        هل أنت متأكد من حذف هذا الطلب؟
                      </h3>
                      <p className="text-beige/80 text-sm mb-3">
                        سيتم حذف الطلب نهائياً من قاعدة البيانات ولن يمكن استرداده.
                      </p>
                      
                      <div className="bg-dark-brown/30 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-beige/60">رقم الطلب:</span>
                          <span className="text-gold font-medium">{orderToDelete.orderNumber}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-beige/60">العميل:</span>
                          <span className="text-off-white">
                            {orderToDelete.customerInfo.firstName} {orderToDelete.customerInfo.lastName}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-beige/60">المبلغ:</span>
                          <span className="text-off-white">{orderToDelete.total.toLocaleString()} ريال</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-beige/60">حالة الدفع:</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            orderToDelete.paymentStatus === 'pending' 
                              ? 'bg-yellow-500/20 text-yellow-400' 
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {orderToDelete.paymentStatus === 'pending' ? 'معلق' : 'فاشل'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-500/10 rounded-lg p-4 border border-amber-500/20 mb-6">
                  <div className="flex items-center gap-2 text-amber-400 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-medium">ملاحظة:</span>
                  </div>
                  <p className="text-amber-300/80 text-sm mt-1">
                    يمكن حذف الطلبات غير المدفوعة فقط. الطلبات المدفوعة محمية من الحذف.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 p-6 border-t border-red-500/20">
                <button
                  onClick={closeDeleteModal}
                  disabled={isDeleting}
                  className="px-6 py-2 bg-beige/10 hover:bg-beige/20 text-beige rounded-lg transition-colors disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button
                  onClick={confirmDeleteOrder}
                  disabled={isDeleting}
                  className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                      جاري الحذف...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      حذف نهائياً
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrdersManagement;