import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
  fallbackPath?: string;
}

export const ProtectedRoute = ({ 
  children, 
  requiredRole,
  fallbackPath = '/auth' 
}: ProtectedRouteProps) => {
  const { state, checkAuth } = useAuth();
  const location = useLocation();

  useEffect(() => {
    console.log('ProtectedRoute state:', { 
      isAuthenticated: state.isAuthenticated, 
      isLoading: state.isLoading,
      userRole: state.user?.role,
      requiredRole: requiredRole,
      currentPath: location.pathname
    });
    
    // Re-check authentication when component mounts
    if (!state.isAuthenticated && !state.isLoading) {
      console.log('Re-checking authentication...');
      checkAuth();
    }
  }, [state.isAuthenticated, state.isLoading, checkAuth, location.pathname]);

  // Show loading spinner while checking authentication
  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!state.isAuthenticated) {
    return (
      <Navigate 
        to={fallbackPath} 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // Check role-based access if required
  if (requiredRole && state.user?.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-destructive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            Access Denied
          </h2>
          <p className="text-muted-foreground">
            You don't have permission to access this page. Required role: {requiredRole}
          </p>
          <button
            onClick={() => window.history.back()}
            className="text-primary hover:underline"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Render protected content
  return <>{children}</>;
};

// Higher-order component version
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requiredRole?: string;
    fallbackPath?: string;
  }
): React.ComponentType<P> {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute 
        requiredRole={options?.requiredRole}
        fallbackPath={options?.fallbackPath}
      >
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

// Hook for checking if user has specific permission
export function usePermission(requiredRole?: string): boolean {
  const { state } = useAuth();
  
  if (!state.isAuthenticated) return false;
  if (!requiredRole) return true;
  
  return state.user?.role === requiredRole;
}

// Component for conditional rendering based on permissions
interface ConditionalRenderProps {
  children: ReactNode;
  requiredRole?: string;
  fallback?: ReactNode;
}

export const ConditionalRender = ({ 
  children, 
  requiredRole, 
  fallback = null 
}: ConditionalRenderProps) => {
  const hasPermission = usePermission(requiredRole);
  
  return hasPermission ? <>{children}</> : <>{fallback}</>;
};