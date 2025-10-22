import { lazy } from 'react';

// Lazy load NEW admin components for better performance
export const LazyAdminPanel = lazy(() => 
  import('./AdminPanel')
);

export const LazyLuxuryDashboard = lazy(() => 
  import('./LuxuryDashboard').then(module => ({ default: module.LuxuryDashboard }))
);

export const LazyProductsManager = lazy(() => 
  import('./ProductsManager').then(module => ({ default: module.ProductsManager }))
);

export const LazyOrdersManager = lazy(() => 
  import('./OrdersManager').then(module => ({ default: module.OrdersManager }))
);

export const LazyOrdersManagement = lazy(
  // @ts-ignore - TypeScript cannot infer default export, but it exists at runtime
  () => import('./OrdersManagement')
);

export const LazyAdminLogin = lazy(() => 
  import('./AdminLogin').then(module => ({ default: module.AdminLogin }))
);

// Legacy components (still available)
export const LazyAdminMedia = lazy(() => 
  import('./admin-media').then(module => ({ default: module.AdminMedia }))
);

export const LazyAdminContent = lazy(() => 
  import('./admin-content').then(module => ({ default: module.AdminContent }))
);

export const LazyAdminSettings = lazy(() => 
  import('./admin-settings').then(module => ({ default: module.AdminSettings }))
);

export const LazyAdminMonitoring = lazy(() => 
  import('./admin-monitoring').then(module => ({ default: module.AdminMonitoring }))
);

export const LazyAdminCustomers = lazy(() =>
  import('./admin-customers').then(module => ({ default: module.default }))
);

export const LazyAdminPayments = lazy(() =>
  import('./admin-payments').then(module => ({ default: module.default }))
);

export const LazyPaymentReports = lazy(() =>
  import('./PaymentReports').then(module => ({ default: module.default }))
);

export const LazyPayPalSettings = lazy(() =>
  import('./PayPalSettings')
);