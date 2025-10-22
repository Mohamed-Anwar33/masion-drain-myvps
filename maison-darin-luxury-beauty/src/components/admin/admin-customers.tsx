import { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  UserPlus, 
  Edit,
  Trash2,
  RefreshCw,
  Users,
  Crown,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Download,
  MoreHorizontal,
  Shield,
  ShieldOff,
  UserX
} from 'lucide-react';
import { useCustomers } from '@/hooks/useCustomers';
import { customerService, Customer, CustomerFilters } from '@/services/customerService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

export default function AdminCustomers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [tierFilter, setTierFilter] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  
  const { toast } = useToast();

  // Build filters for the customers hook
  const filters: CustomerFilters = useMemo(() => {
    const baseFilters: CustomerFilters = {
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };

    if (searchTerm.trim()) {
      baseFilters.search = searchTerm.trim();
    }

    if (statusFilter) {
      baseFilters.status = statusFilter;
    }

    if (tierFilter) {
      baseFilters.tier = tierFilter;
    }

    return baseFilters;
  }, [searchTerm, statusFilter, tierFilter]);

  const { customers, loading, error, pagination, updateFilters, refreshCustomers } = useCustomers(filters);

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  // Handle status filter change
  const handleStatusFilter = (value: string) => {
    setStatusFilter(value === 'all' ? '' : value);
  };

  // Handle tier filter change
  const handleTierFilter = (value: string) => {
    setTierFilter(value === 'all' ? '' : value);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setTierFilter('');
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    updateFilters({ ...filters, page: newPage });
  };

  // View customer details
  const viewCustomerDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerDetails(true);
  };

  // Handle customer status update
  const handleStatusUpdate = async (customer: Customer, newStatus: string) => {
    try {
      await customerService.updateCustomerStatus(customer._id, newStatus);
      toast({
        title: "تم التحديث",
        description: "تم تحديث حالة العميل بنجاح",
      });
      refreshCustomers();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة العميل",
        variant: "destructive",
      });
    }
  };

  // Handle customer deletion
  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;

    try {
      const result = await customerService.deleteCustomer(customerToDelete._id);
      const message = result.deleted ? 
        "تم حذف العميل بنجاح" : 
        "تم إلغاء تفعيل العميل (لديه طلبات موجودة)";
      
      toast({
        title: "تم",
        description: message,
      });
      refreshCustomers();
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في حذف العميل",
        variant: "destructive",
      });
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(dateString));
  };

  if (showCustomerDetails && selectedCustomer) {
    return (
      <CustomerDetailsView 
        customer={selectedCustomer} 
        onBack={() => setShowCustomerDetails(false)}
        onRefresh={refreshCustomers}
      />
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة العملاء</h1>
          <p className="text-gray-600 mt-1">
            عرض وإدارة جميع عملاء المتجر
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshCustomers} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          <Button>
            <UserPlus className="h-4 w-4 ml-2" />
            إضافة عميل
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 ml-2" />
            البحث والفلترة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">البحث</label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="الاسم أو البريد الإلكتروني..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">الحالة</label>
              <Select value={statusFilter || 'all'} onValueChange={handleStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الحالات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="inactive">غير نشط</SelectItem>
                  <SelectItem value="blocked">محظور</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tier Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">المستوى</label>
              <Select value={tierFilter || 'all'} onValueChange={handleTierFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع المستويات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المستويات</SelectItem>
                  <SelectItem value="bronze">برونزي</SelectItem>
                  <SelectItem value="silver">فضي</SelectItem>
                  <SelectItem value="gold">ذهبي</SelectItem>
                  <SelectItem value="platinum">بلاتيني</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Clear Filters */}
          {(searchTerm || statusFilter || tierFilter) && (
            <div className="mt-4">
              <Button variant="outline" onClick={clearFilters}>
                مسح الفلاتر
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 ml-2" />
              العملاء ({pagination.totalCustomers})
            </CardTitle>
            {customers.length > 0 && (
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 ml-2" />
                تصدير
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              <span className="mr-2 text-gray-600">جاري التحميل...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <UserX className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={refreshCustomers}>إعادة المحاولة</Button>
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">لا يوجد عملاء</p>
              <p className="text-sm text-gray-500">
                {searchTerm || statusFilter || tierFilter
                  ? 'لا يوجد عملاء يطابقون معايير البحث'
                  : 'لم يتم تسجيل أي عملاء بعد'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">العميل</TableHead>
                      <TableHead className="text-right">المستوى</TableHead>
                      <TableHead className="text-right">إجمالي الإنفاق</TableHead>
                      <TableHead className="text-right">عدد الطلبات</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">تاريخ التسجيل</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer._id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">
                              {customer.fullName}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Mail className="h-3 w-3 ml-1" />
                              {customer.email}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Phone className="h-3 w-3 ml-1" />
                              {customer.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={customerService.getTierColor(customer.tier)}>
                            <Crown className="h-3 w-3 ml-1" />
                            {customerService.formatTier(customer.tier, 'ar')}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(customer.totalSpent)}
                        </TableCell>
                        <TableCell>
                          {customer.totalOrders} طلب
                        </TableCell>
                        <TableCell>
                          <Badge className={customerService.getStatusColor(customer.status)}>
                            {customerService.formatStatus(customer.status, 'ar')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(customer.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewCustomerDetails(customer)}
                            >
                              <Eye className="h-4 w-4 ml-1" />
                              عرض
                            </Button>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 ml-2" />
                                  تعديل
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {customer.status === 'active' ? (
                                  <DropdownMenuItem onClick={() => handleStatusUpdate(customer, 'inactive')}>
                                    <ShieldOff className="h-4 w-4 ml-2" />
                                    إلغاء التفعيل
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => handleStatusUpdate(customer, 'active')}>
                                    <Shield className="h-4 w-4 ml-2" />
                                    تفعيل
                                  </DropdownMenuItem>
                                )}
                                {customer.status !== 'blocked' && (
                                  <DropdownMenuItem onClick={() => handleStatusUpdate(customer, 'blocked')}>
                                    <UserX className="h-4 w-4 ml-2" />
                                    حظر
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => {
                                    setCustomerToDelete(customer);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 ml-2" />
                                  حذف
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-between items-center mt-6">
                  <div className="text-sm text-gray-600">
                    عرض {((pagination.currentPage - 1) * 20) + 1} إلى {Math.min(pagination.currentPage * 20, pagination.totalCustomers)} من {pagination.totalCustomers} عميل
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={!pagination.hasPrevPage}
                    >
                      <ChevronRight className="h-4 w-4" />
                      السابق
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <Button
                            key={page}
                            variant={page === pagination.currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                    >
                      التالي
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>حذف العميل</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف العميل "{customerToDelete?.fullName}"؟
              {customerToDelete?.totalOrders > 0 && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    تنبيه: هذا العميل لديه {customerToDelete.totalOrders} طلب. سيتم إلغاء تفعيل الحساب بدلاً من الحذف.
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={handleDeleteCustomer}>
              {customerToDelete?.totalOrders > 0 ? 'إلغاء التفعيل' : 'حذف'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Customer Details Component (placeholder)
interface CustomerDetailsViewProps {
  customer: Customer;
  onBack: () => void;
  onRefresh: () => void;
}

function CustomerDetailsView({ customer, onBack, onRefresh }: CustomerDetailsViewProps) {
  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ChevronRight className="h-4 w-4 ml-1" />
          العودة
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {customer.fullName}
          </h1>
          <p className="text-gray-600 mt-1">
            عميل منذ {new Intl.DateTimeFormat('ar-EG', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }).format(new Date(customer.createdAt))}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle>معلومات العميل</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">الاسم</label>
              <div className="mt-1">{customer.fullName}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">البريد الإلكتروني</label>
              <div className="mt-1">{customer.email}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">الهاتف</label>
              <div className="mt-1">{customer.phone}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">المستوى</label>
              <div className="mt-1">
                <Badge className={customerService.getTierColor(customer.tier)}>
                  <Crown className="h-3 w-3 ml-1" />
                  {customerService.formatTier(customer.tier, 'ar')}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">الحالة</label>
              <div className="mt-1">
                <Badge className={customerService.getStatusColor(customer.status)}>
                  {customerService.formatStatus(customer.status, 'ar')}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>الإحصائيات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">إجمالي الإنفاق</label>
              <div className="mt-1 text-lg font-bold">
                {new Intl.NumberFormat('ar-EG', {
                  style: 'currency',
                  currency: 'EGP'
                }).format(customer.totalSpent)}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">عدد الطلبات</label>
              <div className="mt-1 text-lg font-bold">{customer.totalOrders}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">متوسط قيمة الطلب</label>
              <div className="mt-1 text-lg font-bold">
                {customer.totalOrders > 0 ? 
                  new Intl.NumberFormat('ar-EG', {
                    style: 'currency',
                    currency: 'EGP'
                  }).format(customer.totalSpent / customer.totalOrders) : 
                  '0 جنيه'
                }
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">نقاط الولاء</label>
              <div className="mt-1 text-lg font-bold">{customer.loyaltyPoints}</div>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        {customer.defaultAddress && (
          <Card>
            <CardHeader>
              <CardTitle>العنوان الافتراضي</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                <div>{customer.defaultAddress.address}</div>
                <div>{customer.defaultAddress.city}, {customer.defaultAddress.postalCode}</div>
                <div>{customer.defaultAddress.country}</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Orders */}
      {customer.recentOrders && customer.recentOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>الطلبات الأخيرة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {customer.recentOrders.slice(0, 5).map((order: any) => (
                <div key={order._id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <div>
                    <div className="font-medium">{order.orderNumber}</div>
                    <div className="text-sm text-gray-500">
                      {new Intl.DateTimeFormat('ar-EG').format(new Date(order.createdAt))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {new Intl.NumberFormat('ar-EG', {
                        style: 'currency',
                        currency: 'EGP'
                      }).format(order.total)}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {order.orderStatus}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}