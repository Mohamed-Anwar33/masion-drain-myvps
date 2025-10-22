import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import { usePayments } from '@/hooks/usePayments';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface PaymentReport {
  period: string;
  totalAmount: number;
  totalTransactions: number;
  successRate: number;
  averageAmount: number;
  refundedAmount: number;
  fees: number;
}

interface PaymentMethodStats {
  method: string;
  count: number;
  amount: number;
  percentage: number;
  color: string;
}

const PaymentReports: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportType, setReportType] = useState('overview');
  const [statistics, setStatistics] = useState<any>(null);
  const [dailyData, setDailyData] = useState<PaymentReport[]>([]);
  const [methodStats, setMethodStats] = useState<PaymentMethodStats[]>([]);

  const { getPaymentStatistics, getPayments } = usePayments();

  useEffect(() => {
    loadReportData();
  }, [dateRange, startDate, endDate]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      
      const filters: any = {};
      
      if (dateRange !== 'custom') {
        const days = parseInt(dateRange);
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - days);
        
        filters.startDate = start.toISOString().split('T')[0];
        filters.endDate = end.toISOString().split('T')[0];
      } else {
        if (startDate) filters.startDate = startDate;
        if (endDate) filters.endDate = endDate;
      }

      // Load overall statistics
      const statsResponse = await getPaymentStatistics(filters);
      if (statsResponse.success) {
        setStatistics(statsResponse.statistics);
      }

      // Load detailed payment data for charts
      await loadChartData(filters);

    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChartData = async (filters: any) => {
    try {
      // Get payments for the period
      const paymentsResponse = await getPayments({ ...filters, limit: 1000 });
      
      if (paymentsResponse.success) {
        const payments = paymentsResponse.payments;
        
        // Generate daily data
        const dailyMap = new Map<string, PaymentReport>();
        const methodMap = new Map<string, { count: number; amount: number }>();
        
        payments.forEach((payment: any) => {
          const date = new Date(payment.createdAt).toISOString().split('T')[0];
          
          // Daily aggregation
          if (!dailyMap.has(date)) {
            dailyMap.set(date, {
              period: date,
              totalAmount: 0,
              totalTransactions: 0,
              successRate: 0,
              averageAmount: 0,
              refundedAmount: 0,
              fees: 0
            });
          }
          
          const dayData = dailyMap.get(date)!;
          dayData.totalAmount += payment.amount;
          dayData.totalTransactions += 1;
          dayData.refundedAmount += payment.refundedAmount || 0;
          dayData.fees += payment.fees?.totalFees || 0;
          
          if (payment.status === 'completed') {
            dayData.successRate += 1;
          }
          
          // Method aggregation
          if (!methodMap.has(payment.paymentMethod)) {
            methodMap.set(payment.paymentMethod, { count: 0, amount: 0 });
          }
          
          const methodData = methodMap.get(payment.paymentMethod)!;
          methodData.count += 1;
          methodData.amount += payment.amount;
        });
        
        // Calculate success rates and averages
        const dailyArray = Array.from(dailyMap.values()).map(day => ({
          ...day,
          successRate: day.totalTransactions > 0 ? (day.successRate / day.totalTransactions) * 100 : 0,
          averageAmount: day.totalTransactions > 0 ? day.totalAmount / day.totalTransactions : 0
        }));
        
        setDailyData(dailyArray.sort((a, b) => a.period.localeCompare(b.period)));
        
        // Calculate method statistics
        const totalAmount = Array.from(methodMap.values()).reduce((sum, method) => sum + method.amount, 0);
        const methodColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff'];
        
        const methodArray = Array.from(methodMap.entries()).map(([method, data], index) => ({
          method,
          count: data.count,
          amount: data.amount,
          percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
          color: methodColors[index % methodColors.length]
        }));
        
        setMethodStats(methodArray.sort((a, b) => b.amount - a.amount));
      }
    } catch (error) {
      console.error('Error loading chart data:', error);
    }
  };

  const exportReport = () => {
    // Implementation for exporting report to CSV/PDF
    console.log('Exporting report...');
  };

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      visa: 'فيزا',
      mastercard: 'ماستركارد',
      vodafone_cash: 'فودافون كاش',
      cash_on_delivery: 'الدفع عند الاستلام',
      bank_transfer: 'تحويل بنكي',
      paypal: 'باي بال'
    };
    return labels[method] || method;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            التقارير المالية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="نوع التقرير" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">نظرة عامة</SelectItem>
                <SelectItem value="methods">طرق الدفع</SelectItem>
                <SelectItem value="trends">الاتجاهات</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="الفترة الزمنية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">آخر 7 أيام</SelectItem>
                <SelectItem value="30">آخر 30 يوم</SelectItem>
                <SelectItem value="90">آخر 90 يوم</SelectItem>
                <SelectItem value="365">آخر سنة</SelectItem>
                <SelectItem value="custom">فترة مخصصة</SelectItem>
              </SelectContent>
            </Select>

            {dateRange === 'custom' && (
              <>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="تاريخ البداية"
                />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="تاريخ النهاية"
                />
              </>
            )}

            <Button onClick={loadReportData} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              تحديث
            </Button>

            <Button onClick={exportReport} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              تصدير
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">إجمالي الإيرادات</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(statistics.completedAmount, 'EGP')}
                  </p>
                  <p className="text-xs text-gray-500">
                    من {statistics.completedPayments} معاملة
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">معدل النجاح</p>
                  <p className="text-2xl font-bold">{statistics.successRate.toFixed(1)}%</p>
                  <div className="flex items-center gap-1 text-xs">
                    {statistics.successRate >= 90 ? (
                      <TrendingUp className="w-3 h-3 text-green-500" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-500" />
                    )}
                    <span className={statistics.successRate >= 90 ? 'text-green-500' : 'text-red-500'}>
                      {statistics.successRate >= 90 ? 'ممتاز' : 'يحتاج تحسين'}
                    </span>
                  </div>
                </div>
                <CreditCard className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">متوسط المعاملة</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(statistics.averageAmount, 'EGP')}
                  </p>
                  <p className="text-xs text-gray-500">
                    لكل معاملة
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-600" />
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
                  <p className="text-xs text-gray-500">
                    {((statistics.refundedAmount / statistics.totalAmount) * 100).toFixed(1)}% من الإجمالي
                  </p>
                </div>
                <TrendingDown className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>الإيرادات اليومية</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="period" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('ar-EG')}
                />
                <YAxis tickFormatter={(value) => formatCurrency(value, 'EGP')} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString('ar-EG')}
                  formatter={(value: any) => [formatCurrency(value, 'EGP'), 'الإيرادات']}
                />
                <Bar dataKey="totalAmount" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Methods Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>توزيع طرق الدفع</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={methodStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ method, percentage }) => `${getMethodLabel(method)} (${percentage.toFixed(1)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {methodStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [formatCurrency(value, 'EGP'), 'المبلغ']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Success Rate Trend */}
      <Card>
        <CardHeader>
          <CardTitle>اتجاه معدل النجاح</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="period" 
                tickFormatter={(value) => new Date(value).toLocaleDateString('ar-EG')}
              />
              <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString('ar-EG')}
                formatter={(value: any) => [`${value.toFixed(1)}%`, 'معدل النجاح']}
              />
              <Line 
                type="monotone" 
                dataKey="successRate" 
                stroke="#82ca9d" 
                strokeWidth={2}
                dot={{ fill: '#82ca9d' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Payment Methods Table */}
      <Card>
        <CardHeader>
          <CardTitle>تفاصيل طرق الدفع</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>طريقة الدفع</TableHead>
                <TableHead>عدد المعاملات</TableHead>
                <TableHead>إجمالي المبلغ</TableHead>
                <TableHead>متوسط المعاملة</TableHead>
                <TableHead>النسبة المئوية</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {methodStats.map((method) => (
                <TableRow key={method.method}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: method.color }}
                      />
                      {getMethodLabel(method.method)}
                    </div>
                  </TableCell>
                  <TableCell>{method.count}</TableCell>
                  <TableCell>{formatCurrency(method.amount, 'EGP')}</TableCell>
                  <TableCell>
                    {formatCurrency(method.count > 0 ? method.amount / method.count : 0, 'EGP')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {method.percentage.toFixed(1)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentReports;