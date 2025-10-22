import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Download, 
  Print, 
  CreditCard,
  Calendar,
  Hash,
  User,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface PaymentReceiptProps {
  payment: {
    paymentId: string;
    amount: number;
    currency: string;
    status: string;
    paymentMethod: string;
    createdAt: string;
    completedAt?: string;
    transactionId?: string;
    order: {
      orderNumber: string;
      total: number;
      items: Array<{
        name: { ar: string; en: string };
        quantity: number;
        price: number;
      }>;
    };
    customer: {
      name: string;
      email: string;
      phone?: string;
      address?: string;
    };
    fees?: {
      gatewayFee: number;
      processingFee: number;
      totalFees: number;
    };
  };
  onDownload?: () => void;
  onPrint?: () => void;
}

const PaymentReceipt: React.FC<PaymentReceiptProps> = ({
  payment,
  onDownload,
  onPrint
}) => {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { color: 'bg-green-100 text-green-800', label: 'مكتملة' },
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'في الانتظار' },
      processing: { color: 'bg-blue-100 text-blue-800', label: 'قيد المعالجة' },
      failed: { color: 'bg-red-100 text-red-800', label: 'فاشلة' },
      refunded: { color: 'bg-purple-100 text-purple-800', label: 'مستردة' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      visa: 'فيزا',
      mastercard: 'ماستركارد',
      vodafone_cash: 'فودافون كاش',
      cash_on_delivery: 'الدفع عند الاستلام',
      bank_transfer: 'تحويل بنكي',
      paypal: 'باي بال'
    };

    return methods[method] || method;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white" dir="rtl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">إيصال الدفع</h1>
        <p className="text-gray-600">ميزون دارين للعطور الفاخرة</p>
      </div>

      {/* Payment Status */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold">معلومات الدفع</h2>
            </div>
            {getStatusBadge(payment.status)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">رقم الدفع:</span>
                <span className="font-mono text-sm">{payment.paymentId}</span>
              </div>
              
              {payment.transactionId && (
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">رقم المعاملة:</span>
                  <span className="font-mono text-sm">{payment.transactionId}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">طريقة الدفع:</span>
                <span className="text-sm">{getPaymentMethodLabel(payment.paymentMethod)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">تاريخ الإنشاء:</span>
                <span className="text-sm">{formatDate(payment.createdAt)}</span>
              </div>

              {payment.completedAt && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">تاريخ الإكمال:</span>
                  <span className="text-sm">{formatDate(payment.completedAt)}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            معلومات العميل
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">الاسم:</span>
                <span className="text-sm">{payment.customer.name}</span>
              </div>

              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">البريد الإلكتروني:</span>
                <span className="text-sm">{payment.customer.email}</span>
              </div>
            </div>

            <div className="space-y-3">
              {payment.customer.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">الهاتف:</span>
                  <span className="text-sm">{payment.customer.phone}</span>
                </div>
              )}

              {payment.customer.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">العنوان:</span>
                  <span className="text-sm">{payment.customer.address}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>تفاصيل الطلب - {payment.order.orderNumber}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payment.order.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <h4 className="font-medium">{item.name.ar}</h4>
                  <p className="text-sm text-gray-600">الكمية: {item.quantity}</p>
                </div>
                <div className="text-left">
                  <p className="font-medium">{formatCurrency(item.price * item.quantity, payment.currency)}</p>
                  <p className="text-sm text-gray-600">{formatCurrency(item.price, payment.currency)} × {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>ملخص الدفع</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">المبلغ الأساسي:</span>
              <span>{formatCurrency(payment.amount, payment.currency)}</span>
            </div>

            {payment.fees && payment.fees.totalFees > 0 && (
              <>
                {payment.fees.gatewayFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">رسوم البوابة:</span>
                    <span>{formatCurrency(payment.fees.gatewayFee, payment.currency)}</span>
                  </div>
                )}

                {payment.fees.processingFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">رسوم المعالجة:</span>
                    <span>{formatCurrency(payment.fees.processingFee, payment.currency)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="text-gray-600">إجمالي الرسوم:</span>
                  <span>{formatCurrency(payment.fees.totalFees, payment.currency)}</span>
                </div>
              </>
            )}

            <div className="flex justify-between text-lg font-bold border-t pt-3">
              <span>المبلغ الإجمالي:</span>
              <span>{formatCurrency(payment.amount + (payment.fees?.totalFees || 0), payment.currency)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-center gap-4 mt-8">
        {onPrint && (
          <Button variant="outline" onClick={onPrint} className="flex items-center gap-2">
            <Print className="w-4 h-4" />
            طباعة
          </Button>
        )}

        {onDownload && (
          <Button onClick={onDownload} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            تحميل PDF
          </Button>
        )}
      </div>

      {/* Footer */}
      <div className="text-center mt-8 pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          شكراً لك على ثقتك في ميزون دارين للعطور الفاخرة
        </p>
        <p className="text-xs text-gray-500 mt-2">
          هذا إيصال إلكتروني صالح قانونياً
        </p>
      </div>
    </div>
  );
};

export default PaymentReceipt;