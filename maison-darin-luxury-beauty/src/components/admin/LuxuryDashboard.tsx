import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  RefreshCw,
  Calendar,
  DollarSign,
  Star,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { dashboardService } from '@/services/dashboardService';
import { orderService } from '@/services/orderService';
import { productService } from '@/services/productService';
import { toast } from 'sonner';

interface LuxuryDashboardProps {
  currentLang: 'en' | 'ar';
}

export function LuxuryDashboard({ currentLang }: LuxuryDashboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [recentOrdersData, setRecentOrdersData] = useState<any[]>([]);
  const [categoryStats, setCategoryStats] = useState<any[]>([]);
  const isRTL = currentLang === 'ar';

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [dashboard, orders, categories] = await Promise.all([
        dashboardService.getDashboardStats(),
        orderService.getRecentOrders(5),
        productService.getCategoryStats()
      ]);

      setDashboardData(dashboard);
      setRecentOrdersData(orders);
      setCategoryStats(categories);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error(currentLang === 'ar' ? 'خطأ في تحميل بيانات لوحة التحكم' : 'Error loading dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const stats = dashboardData ? [
    {
      title: currentLang === 'ar' ? 'إجمالي المنتجات' : 'Total Products',
      value: dashboardData.overview.totalProducts.toString(),
      change: '+12%',
      changeType: 'positive',
      icon: Package,
      color: 'from-blue-500 to-blue-600',
      details: currentLang === 'ar' ? `${dashboardData.products.inStock} متوفر` : `${dashboardData.products.inStock} in stock`
    },
    {
      title: currentLang === 'ar' ? 'العملاء' : 'Customers',
      value: dashboardData.overview.totalCustomers.toString(),
      change: '+8.2%',
      changeType: 'positive',
      icon: Users,
      color: 'from-green-500 to-green-600',
      details: currentLang === 'ar' ? 'عملاء نشطون' : 'active customers'
    },
    {
      title: currentLang === 'ar' ? 'طلبات اليوم' : "Today's Orders",
      value: dashboardData.overview.todayOrders.toString(),
      change: '+23%',
      changeType: 'positive',
      icon: ShoppingCart,
      color: 'from-purple-500 to-purple-600',
      details: currentLang === 'ar' ? `${dashboardData.overview.pendingOrders} في الانتظار` : `${dashboardData.overview.pendingOrders} pending`
    },
    {
      title: currentLang === 'ar' ? 'إيرادات اليوم' : "Today's Revenue",
      value: `₪${dashboardData.revenue.today}`,
      change: '+15.3%',
      changeType: 'positive',
      icon: TrendingUp,
      color: 'from-gold to-yellow-600',
      details: currentLang === 'ar' ? `₪${dashboardData.revenue.thisMonth} هذا الشهر` : `₪${dashboardData.revenue.thisMonth} this month`
    }
  ] : [];

  const revenueData = [
    { name: currentLang === 'ar' ? 'يناير' : 'Jan', revenue: 45000, orders: 120 },
    { name: currentLang === 'ar' ? 'فبراير' : 'Feb', revenue: 52000, orders: 145 },
    { name: currentLang === 'ar' ? 'مارس' : 'Mar', revenue: 48000, orders: 135 },
    { name: currentLang === 'ar' ? 'أبريل' : 'Apr', revenue: 61000, orders: 165 },
    { name: currentLang === 'ar' ? 'مايو' : 'May', revenue: 55000, orders: 150 },
    { name: currentLang === 'ar' ? 'يونيو' : 'Jun', revenue: 67000, orders: 180 },
  ];

  // Transform category stats for chart
  const categoryData = categoryStats.map((cat, index) => ({
    name: cat.label[currentLang],
    value: Math.round((cat.totalProducts / categoryStats.reduce((sum, c) => sum + c.totalProducts, 0)) * 100),
    color: ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#EC4899'][index % 6]
  }));

  // Get top products from category stats
  const topProducts = categoryStats
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 3)
    .map(cat => ({
      name: cat.label[currentLang],
      sales: cat.totalProducts,
      revenue: `₪${cat.totalValue.toLocaleString()}`,
      category: cat.category
    }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      completed: currentLang === 'ar' ? 'مكتمل' : 'Completed',
      processing: currentLang === 'ar' ? 'قيد المعالجة' : 'Processing',
      pending: currentLang === 'ar' ? 'في الانتظار' : 'Pending'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <RefreshCw className="w-8 h-8 text-gold" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-off-white mb-2">
            {currentLang === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
          </h1>
          <p className="text-beige/80">
            {currentLang === 'ar' ? 'مرحباً بك في لوحة تحكم ميزون دارين' : 'Welcome to Maison Darin Admin Dashboard'}
          </p>
        </div>
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <Button variant="outline" size="sm" className="bg-white/10 border-gold/30 text-off-white hover:bg-gold/20">
            <Calendar className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
            {currentLang === 'ar' ? 'هذا الشهر' : 'This Month'}
          </Button>
          <Button 
            size="sm" 
            className="bg-gold hover:bg-gold/90 text-dark-tea"
            onClick={loadDashboardData}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0 ${isLoading ? 'animate-spin' : ''}`} />
            {currentLang === 'ar' ? 'تحديث' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-off-white/95 backdrop-blur-sm border-gold/20 shadow-luxury hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.color}`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className={`flex items-center space-x-1 rtl:space-x-reverse px-2 py-1 rounded-full text-xs font-medium ${
                    stat.changeType === 'positive' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {stat.changeType === 'positive' ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    <span>{stat.change}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-dark-tea">{stat.value}</h3>
                  <p className="text-sm font-medium text-dark-tea/80">{stat.title}</p>
                  <p className="text-xs text-dark-tea/60">{stat.details}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card className="bg-off-white/95 backdrop-blur-sm border-gold/20 shadow-luxury">
            <CardHeader>
              <CardTitle className="text-dark-tea flex items-center justify-between">
                <span>{currentLang === 'ar' ? 'الإيرادات الشهرية' : 'Monthly Revenue'}</span>
                <DollarSign className="w-5 h-5 text-gold" />
              </CardTitle>
              <CardDescription>
                {currentLang === 'ar' ? 'إجمالي الإيرادات والطلبات خلال الأشهر الستة الماضية' : 'Total revenue and orders over the last 6 months'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D4AF37" opacity={0.2} />
                    <XAxis dataKey="name" stroke="#8B4513" />
                    <YAxis stroke="#8B4513" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#FFF8DC', 
                        border: '1px solid #D4AF37',
                        borderRadius: '8px'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#D4AF37"
                      strokeWidth={3}
                      fill="url(#revenueGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-off-white/95 backdrop-blur-sm border-gold/20 shadow-luxury">
            <CardHeader>
              <CardTitle className="text-dark-tea flex items-center justify-between">
                <span>{currentLang === 'ar' ? 'توزيع الفئات' : 'Category Distribution'}</span>
                <Package className="w-5 h-5 text-gold" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-4">
                {categoryData.map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm text-dark-tea">{category.name}</span>
                    </div>
                    <span className="text-sm font-medium text-dark-tea">{category.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="bg-off-white/95 backdrop-blur-sm border-gold/20 shadow-luxury">
            <CardHeader>
              <CardTitle className="text-dark-tea flex items-center justify-between">
                <span>{currentLang === 'ar' ? 'أفضل المنتجات' : 'Top Products'}</span>
                <Star className="w-5 h-5 text-gold" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={index} className="flex items-center space-x-4 rtl:space-x-reverse p-3 rounded-lg bg-gold/5 hover:bg-gold/10 transition-colors">
                    <div className="w-12 h-12 bg-gradient-to-br from-gold to-light-brown rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-off-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-dark-tea">{product.name}</h4>
                      <p className="text-sm text-dark-tea/60">
                        {product.sales} {currentLang === 'ar' ? 'مبيعة' : 'sales'}
                      </p>
                    </div>
                    <div className="text-right rtl:text-left">
                      <p className="font-bold text-dark-tea">{product.revenue}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="bg-off-white/95 backdrop-blur-sm border-gold/20 shadow-luxury">
            <CardHeader>
              <CardTitle className="text-dark-tea flex items-center justify-between">
                <span>{currentLang === 'ar' ? 'الطلبات الأخيرة' : 'Recent Orders'}</span>
                <Clock className="w-5 h-5 text-gold" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrdersData.map((order, index) => (
                  <div key={order._id} className="flex items-center justify-between p-3 rounded-lg bg-gold/5 hover:bg-gold/10 transition-colors">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <div className="w-10 h-10 bg-gradient-to-br from-teal-green to-dark-tea rounded-full flex items-center justify-center">
                        <span className="text-off-white text-sm font-medium">
                          {order.customerInfo.firstName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-dark-tea">
                          {order.customerInfo.firstName} {order.customerInfo.lastName}
                        </p>
                        <p className="text-sm text-dark-tea/60">#{order.orderNumber}</p>
                      </div>
                    </div>
                    <div className="text-right rtl:text-left">
                      <p className="font-bold text-dark-tea">₪{order.total}</p>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Badge className={`text-xs ${getStatusColor(order.orderStatus)}`}>
                          {orderService.formatOrderStatus(order.orderStatus, currentLang)}
                        </Badge>
                      </div>
                      <p className="text-xs text-dark-tea/60 mt-1">
                        {new Date(order.createdAt).toLocaleDateString(currentLang === 'ar' ? 'ar-EG' : 'en-US')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
