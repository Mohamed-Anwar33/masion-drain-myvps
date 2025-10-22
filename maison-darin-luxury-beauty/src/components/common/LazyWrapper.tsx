import { Suspense, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface LazyWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

const DefaultFallback = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="text-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
      <p className="text-muted-foreground text-sm">Loading...</p>
    </div>
  </div>
);

export const LazyWrapper = ({ children, fallback }: LazyWrapperProps) => {
  return (
    <Suspense fallback={fallback || <DefaultFallback />}>
      {children}
    </Suspense>
  );
};

// Specialized loading components for different sections
export const DashboardLoader = () => (
  <div className="space-y-6 p-6">
    <div className="animate-pulse">
      <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
      <div className="h-4 bg-muted rounded w-2/3"></div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-muted rounded-lg h-32"></div>
        </div>
      ))}
    </div>
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-muted rounded-lg h-64"></div>
        </div>
      ))}
    </div>
  </div>
);

export const ProductsLoader = () => (
  <div className="space-y-6 p-6">
    <div className="flex justify-between items-center">
      <div className="animate-pulse">
        <div className="h-8 bg-muted rounded w-48 mb-2"></div>
        <div className="h-4 bg-muted rounded w-64"></div>
      </div>
      <div className="animate-pulse">
        <div className="h-10 bg-muted rounded w-32"></div>
      </div>
    </div>
    
    <div className="animate-pulse">
      <div className="bg-muted rounded-lg h-96"></div>
    </div>
  </div>
);

export const MediaLoader = () => (
  <div className="space-y-6 p-6">
    <div className="flex justify-between items-center">
      <div className="animate-pulse">
        <div className="h-8 bg-muted rounded w-40 mb-2"></div>
        <div className="h-4 bg-muted rounded w-56"></div>
      </div>
      <div className="animate-pulse">
        <div className="h-10 bg-muted rounded w-28"></div>
      </div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-muted rounded-lg aspect-square mb-4"></div>
          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-muted rounded w-1/2"></div>
        </div>
      ))}
    </div>
  </div>
);

export const ContentLoader = () => (
  <div className="space-y-6 p-6">
    <div className="flex justify-between items-center">
      <div className="animate-pulse">
        <div className="h-8 bg-muted rounded w-44 mb-2"></div>
        <div className="h-4 bg-muted rounded w-72"></div>
      </div>
      <div className="animate-pulse flex gap-2">
        <div className="h-10 bg-muted rounded w-24"></div>
        <div className="h-10 bg-muted rounded w-32"></div>
      </div>
    </div>
    
    <div className="animate-pulse">
      <div className="bg-muted rounded-lg h-[600px]"></div>
    </div>
  </div>
);