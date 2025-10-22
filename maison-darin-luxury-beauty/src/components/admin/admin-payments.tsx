import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Eye, 
  DollarSign,
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  RotateCcw
} from 'lucide-react';
import { usePayments } from '@/hooks/usePayments';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface Payment {
  paymentId: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  createdAt: string;
  completedAt?: string;
  order: {
    orderNumber: string;
    total: number;
    status: string;
  };
  customer: {
    name: string;
    email: string;
  };
  fees: {
    gatewayFee: number;
    processingFee: number;
    totalFees: number;
  };
  refundedAmount: number;
  refundableAmount: number;
}

interface PaymentStatistics {
  totalPayments: number;
  totalAmount: number;
  completedPayments: number;
  completedAmount: number;
  failedPayments: number;
  refundedAmount: number;
  averageAmount: number;
  successRate: number;
}

const AdminPayments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [statistics, setStatistics] = useState<PaymentStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { 
    getPayments, 
    getPaymentStatistics, 
    processRefund,
    verifyBankTransfer 
  } = usePayments();

  useEffect(() => {
    loadPayments();
    loadStatistics();
  }, [currentPage, statusFilter, methodFilter, searchTerm]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const filters: any = {
        page: currentPage,
        limit: 20
      };

      if (statusFilter !== 'all') filters.status = statusFilter;
      if (methodFilter !== 'all') filters.paymentMethod = methodFilter;
      if (searchTerm) filters.search = searchTerm;

      const response = await getPayments(filters);
      if (response.success) {
        setPayments(response.payments);
        setTotalPages(response.pagination.pages);
      }
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await getPaymentStatistics();
      if (response.success) {
        setStatistics(response.statistics);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const handleRefund = async () => {
    if (!selectedPayment || !refundAmount || !refundReason) return;

    try {
      const response = await processRefund(
        selectedPayment.paymentId,
        parseFloat(refundAmount),
        refundReason
      );

      if (response.success) {
        setShowRefundDialog(false);
        setRefundAmount('');
        setRefundReason('');
        setSelectedPayment(null);
        loadPayments();
        loadStatistics();
      }
    } catch (error) {
      console.error('Error processing refund:', error);
    }
  };

  const handleBankTransferVerification = async (paymentId: string, verified: boolean) => {
    try {
      const response = await verifyBankTransfer(paymentId, verified);
      if (response.success) {
        loadPayments();
        loadStatistics();
      }
    } catch (error) {
      console.error('Error verifying bank transfer:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      processing: { color: 'bg-blue-100 text-blue-800', icon: RefreshCw },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle },
      refunded: { color: 'bg-purple-100 text-purple-800', icon: RotateCcw },
      partially_refunded: { color: 'bg-orange-100 text-orange-800', icon: RotateCcw }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getMethodBadge = (method: string) => {
    const methodConfig = {
      visa: { color: 'bg-blue-100 text-blue-800', label: 'Visa' },
      mastercard: { color: 'bg-red-100 text-red-800', label: 'Mastercard' },
      vodafone_cash: { color: 'bg-red-100 text-red-800', label: 'Vodafone Cash' },
      cash_on_delivery: { color: 'bg-green-100 text-green-800', label: 'Cash on Delivery' },
      bank_transfer: { color: 'bg-purple-100 text-purple-800', label: 'Bank Transfer' },
      paypal: { color: 'bg-blue-100 text-blue-800', label: 'PayPal' }
    };

    const config = methodConfig[method as keyof typeof methodConfig] || 
                  { color: 'bg-gray-100 text-gray-800', label: method };

    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  if (loading && !payments.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">إجمالي المدفوعات</p>
                  <p className="text-2xl font-bold">{statistics.totalPayments}</p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">إجمالي المبلغ</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(statistics.totalAmount, 'EGP')}
                  </p>
                </div>
                <CreditCard className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">معدل النجاح</p>
                  <p className="text-2xl font-bold">{statistics.successRate.toFixed(1)}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">المبلغ المسترد</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(statistics.refundedAmount, 'EGP')}
                  </p>
                </div>
                <RotateCcw className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            إدارة المدفوعات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="البحث في المدفوعات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="فلترة حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="pending">في الانتظار</SelectItem>
                <SelectItem value="processing">قيد المعالجة</SelectItem>
                <SelectItem value="completed">مكتملة</SelectItem>
                <SelectItem value="failed">فاشلة</SelectItem>
                <SelectItem value="refunded">مستردة</SelectItem>
              </SelectContent>
            </Select>

            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="فلترة حسب الطريقة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الطرق</SelectItem>
                <SelectItem value="visa">فيزا</SelectItem>
                <SelectItem value="mastercard">ماستركارد</SelectItem>
                <SelectItem value="vodafone_cash">فودافون كاش</SelectItem>
                <SelectItem value="cash_on_delivery">الدفع عند الاستلام</SelectItem>
                <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                <SelectItem value="paypal">باي بال</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={loadPayments} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              تحديث
            </Button>
          </div>

          {/* Payments Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الدفع</TableHead>
                  <TableHead>رقم الطلب</TableHead>
                  <TableHead>العميل</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>طريقة الدفع</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.paymentId}>
                    <TableCell className="font-mono text-sm">
                      {payment.paymentId}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{payment.order.orderNumber}</div>
                        <div className="text-sm text-gray-500">
                          {formatCurrency(payment.order.total, payment.currency)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{payment.customer.name}</div>
                        <div className="text-sm text-gray-500">{payment.customer.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-bold">
                          {formatCurrency(payment.amount, payment.currency)}
                        </div>
                        {payment.fees.totalFees > 0 && (
                          <div className="text-sm text-gray-500">
                            رسوم: {formatCurrency(payment.fees.totalFees, payment.currency)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getMethodBadge(payment.paymentMethod)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(payment.status)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">{formatDate(payment.createdAt)}</div>
                        {payment.completedAt && (
                          <div className="text-xs text-gray-500">
                            اكتمل: {formatDate(payment.completedAt)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedPayment(payment)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        {payment.status === 'completed' && payment.refundableAmount > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedPayment(payment);
                              setShowRefundDialog(true);
                              setRefundAmount(payment.refundableAmount.toString());
                            }}
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        )}

                        {payment.paymentMethod === 'bank_transfer' && payment.status === 'processing' && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleBankTransferVerification(payment.paymentId, true)}
                              className="text-green-600"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleBankTransferVerification(payment.paymentId, false)}
                              className="text-red-600"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                السابق
              </Button>
              
              <span className="flex items-center px-4">
                صفحة {currentPage} من {totalPages}
              </span>
              
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                التالي
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>استرداد المبلغ</DialogTitle>
            <DialogDescription>
              استرداد مبلغ للدفعة {selectedPayment?.paymentId}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">مبلغ الاسترداد</label>
              <Input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                max={selectedPayment?.refundableAmount}
                placeholder="أدخل مبلغ الاسترداد"
              />
              <p className="text-xs text-gray-500 mt-1">
                الحد الأقصى: {formatCurrency(selectedPayment?.refundableAmount || 0, selectedPayment?.currency || 'EGP')}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium">سبب الاسترداد</label>
              <Textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="أدخل سبب الاسترداد"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefundDialog(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={handleRefund}
              disabled={!refundAmount || !refundReason}
            >
              تأكيد الاسترداد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPayments;