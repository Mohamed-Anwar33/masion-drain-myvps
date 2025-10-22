import { Order } from '@/services/orderService';

interface InvoiceTemplateProps {
  order: Order;
  currentLang: 'en' | 'ar';
}

export default function InvoiceTemplate({ order, currentLang }: InvoiceTemplateProps) {
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
      day: 'numeric'
    }).format(new Date(dateString));
  };

  const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.14; // 14% VAT in Egypt
  const shipping = 50; // Fixed shipping cost
  const total = subtotal + tax + shipping;

  return (
    <div className={`bg-white p-8 max-w-4xl mx-auto ${currentLang === 'ar' ? 'rtl' : 'ltr'}`} dir={currentLang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-purple-600 mb-2">
            {currentLang === 'ar' ? 'ميزون دارين' : 'Maison Darin'}
          </h1>
          <p className="text-gray-600">
            {currentLang === 'ar' ? 'عطور فاخرة' : 'Luxury Perfumes'}
          </p>
          <div className="mt-4 text-sm text-gray-600">
            <p>{currentLang === 'ar' ? 'القاهرة، مصر' : 'Cairo, Egypt'}</p>
            <p>info@maisondarin.com</p>
            <p>+20 123 456 7890</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {currentLang === 'ar' ? 'فاتورة' : 'INVOICE'}
          </h2>
          <div className="text-sm text-gray-600">
            <p><strong>{currentLang === 'ar' ? 'رقم الفاتورة:' : 'Invoice #:'}</strong> {order.orderNumber}</p>
            <p><strong>{currentLang === 'ar' ? 'تاريخ الإصدار:' : 'Date:'}</strong> {formatDate(order.createdAt)}</p>
            <p><strong>{currentLang === 'ar' ? 'حالة الدفع:' : 'Payment Status:'}</strong> 
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                order.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' : 
                order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {order.paymentStatus === 'completed' ? (currentLang === 'ar' ? 'مدفوع' : 'Paid') :
                 order.paymentStatus === 'pending' ? (currentLang === 'ar' ? 'في الانتظار' : 'Pending') :
                 (currentLang === 'ar' ? 'غير مدفوع' : 'Unpaid')}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Bill To */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            {currentLang === 'ar' ? 'فاتورة إلى:' : 'Bill To:'}
          </h3>
          <div className="text-sm text-gray-600">
            <p className="font-medium text-gray-800">
              {order.customerInfo.firstName} {order.customerInfo.lastName}
            </p>
            <p>{order.customerInfo.email}</p>
            <p>{order.customerInfo.phone}</p>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            {currentLang === 'ar' ? 'عنوان التسليم:' : 'Ship To:'}
          </h3>
          <div className="text-sm text-gray-600">
            <p>{order.customerInfo.address}</p>
            <p>{order.customerInfo.city}, {order.customerInfo.postalCode}</p>
            <p>{order.customerInfo.country}</p>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-8">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className={`py-3 px-4 font-semibold text-gray-800 ${currentLang === 'ar' ? 'text-right' : 'text-left'}`}>
                {currentLang === 'ar' ? 'المنتج' : 'Item'}
              </th>
              <th className={`py-3 px-4 font-semibold text-gray-800 ${currentLang === 'ar' ? 'text-right' : 'text-left'}`}>
                {currentLang === 'ar' ? 'الكمية' : 'Qty'}
              </th>
              <th className={`py-3 px-4 font-semibold text-gray-800 ${currentLang === 'ar' ? 'text-right' : 'text-left'}`}>
                {currentLang === 'ar' ? 'السعر' : 'Price'}
              </th>
              <th className={`py-3 px-4 font-semibold text-gray-800 ${currentLang === 'ar' ? 'text-right' : 'text-left'}`}>
                {currentLang === 'ar' ? 'المجموع' : 'Total'}
              </th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="py-3 px-4">
                  <div>
                    <p className="font-medium text-gray-800">
                      {currentLang === 'ar' ? item.name.ar : item.name.en}
                    </p>
                    <p className="text-sm text-gray-600">
                      {currentLang === 'ar' ? item.name.en : item.name.ar}
                    </p>
                  </div>
                </td>
                <td className="py-3 px-4 text-center">{item.quantity}</td>
                <td className="py-3 px-4">{formatCurrency(item.price)}</td>
                <td className="py-3 px-4 font-medium">{formatCurrency(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-full max-w-sm">
          <div className="space-y-2">
            <div className="flex justify-between py-2">
              <span className="text-gray-600">{currentLang === 'ar' ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">{currentLang === 'ar' ? 'الشحن:' : 'Shipping:'}</span>
              <span className="font-medium">{formatCurrency(shipping)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">{currentLang === 'ar' ? 'ضريبة القيمة المضافة (14%):' : 'VAT (14%):'}</span>
              <span className="font-medium">{formatCurrency(tax)}</span>
            </div>
            <div className="border-t-2 border-gray-300 pt-2">
              <div className="flex justify-between py-2">
                <span className="text-lg font-bold text-gray-800">
                  {currentLang === 'ar' ? 'المجموع الكلي:' : 'Total:'}
                </span>
                <span className="text-lg font-bold text-gray-800">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          {currentLang === 'ar' ? 'طريقة الدفع:' : 'Payment Method:'}
        </h3>
        <p className="text-gray-600">
          {order.paymentMethod === 'paypal' && 'PayPal'}
          {order.paymentMethod === 'card' && (currentLang === 'ar' ? 'بطاقة ائتمان' : 'Credit Card')}
          {order.paymentMethod === 'bank_transfer' && (currentLang === 'ar' ? 'تحويل بنكي' : 'Bank Transfer')}
        </p>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            {currentLang === 'ar' ? 'ملاحظات:' : 'Notes:'}
          </h3>
          <p className="text-gray-600">{order.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="border-t-2 border-gray-300 pt-6 mt-8">
        <div className="text-center text-sm text-gray-600">
          <p className="mb-2">
            {currentLang === 'ar' 
              ? 'شكراً لاختيارك ميزون دارين - عطور فاخرة'
              : 'Thank you for choosing Maison Darin - Luxury Perfumes'
            }
          </p>
          <p>
            {currentLang === 'ar'
              ? 'للاستفسارات: info@maisondarin.com | +20 123 456 7890'
              : 'For inquiries: info@maisondarin.com | +20 123 456 7890'
            }
          </p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body { margin: 0; }
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
        }
      `}</style>
    </div>
  );
}