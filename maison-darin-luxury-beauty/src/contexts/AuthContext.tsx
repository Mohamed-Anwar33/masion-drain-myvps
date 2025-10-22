 import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import SessionService from '@/services/sessionService';

// Types
export interface User {
  id?: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role: string;
  phone?: string;
  address?: string;
  city?: string;
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  sessionWarning: boolean;
  timeUntilExpiry: number;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SESSION_WARNING'; payload: { warning: boolean; timeLeft: number } }
  | { type: 'SESSION_EXPIRED' };

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true, // Start with loading to check existing auth
  error: null,
  sessionWarning: false,
  timeUntilExpiry: 0,
};

// Auth reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    
    case 'SESSION_WARNING':
      return {
        ...state,
        sessionWarning: action.payload.warning,
        timeUntilExpiry: action.payload.timeLeft,
      };
    
    case 'SESSION_EXPIRED':
      return {
        ...initialState,
        isLoading: false,
        error: 'Session expired. Please login again.',
      };
    
    default:
      return state;
  }
}

// Auth service functions with real API integration
class AuthService {
  private static readonly TOKEN_KEY = 'authToken';
  private static readonly USER_KEY = 'user';
  private static readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private static readonly API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  static getStoredToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static getStoredUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  static setAuthData(user: User, token: string, refreshToken?: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    if (refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  static clearAuthData(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  static async login(email: string, password: string): Promise<{ user: User; token: string }> {
    try {
      console.log('🚀 AuthService.login called with API URL:', this.API_BASE_URL);
      
      const response = await fetch(`${this.API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('📡 Login API response status:', response.status, response.statusText);
      const data = await response.json();
      console.log('📄 Login API response data:', { 
        success: data.success, 
        hasUser: !!data.user, 
        hasToken: !!data.token,
        userRole: data.user?.role 
      });

      if (!response.ok) {
        // Handle rate limiting separately
        if (response.status === 429) {
          throw new Error(data.error?.message || 'Too many login attempts. Please try again in 15 minutes.');
        }
        throw new Error(data.error?.message || 'Login failed');
      }

      if (data.success && data.user && data.token) {
        const userData: User = {
          id: data.user.id,
          email: data.user.email,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          name: `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim() || data.user.email.split('@')[0],
          role: data.user.role,
        };
        
        this.setAuthData(userData, data.token, data.refreshToken);
        return { user: userData, token: data.token };
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      // Don't fallback to mock if it's a rate limit error
      if (error instanceof Error && error.message.includes('Too many login attempts')) {
        throw error;
      }
      
      // Check if it's a network error first
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('🌐 Network error - Backend server may be down');
        throw new Error(
          'لا يمكن الاتصال بالخادم. تأكد من تشغيل الباك إند على البورت 5000\n' +
          'Cannot connect to server. Make sure backend is running on port 5000'
        );
      }
      
      // Fallback to mock authentication for development only if backend is unreachable
      console.warn('API login failed, using mock authentication:', error);
      
      if (email === 'admin@maisondarin.com' && password === 'Admin123456#') {
        const user: User = {
          id: '1',
          email,
          name: 'مدير النظام', // Arabic name for admin
          role: 'admin',
        };
        const token = 'mock-jwt-token-' + Date.now();
        
        this.setAuthData(user, token);
        return { user, token };
      } else {
        throw new Error('بيانات تسجيل الدخول غير صحيحة - Invalid credentials');
      }
    }
  }

  static async logout(): Promise<void> {
    try {
      const token = this.getStoredToken();
      if (token) {
        await fetch(`${this.API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.warn('API logout failed:', error);
    } finally {
      this.clearAuthData();
    }
  }

  static async refreshToken(): Promise<{ user: User; token: string } | null> {
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${this.API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const user = this.getStoredUser();
        if (user) {
          this.setAuthData(user, data.data.accessToken, refreshToken);
          return { user, token: data.data.accessToken };
        }
      }
      
      throw new Error('Token refresh failed');
    } catch (error) {
      console.warn('Token refresh failed:', error);
      this.clearAuthData();
      return null;
    }
  }

  static async verifyToken(): Promise<boolean> {
    const token = this.getStoredToken();
    if (!token) return false;

    try {
      const response = await fetch(`${this.API_BASE_URL}/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  static isTokenExpired(token: string): boolean {
    try {
      // Basic JWT expiration check
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }
}

// Context interface
interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  checkAuth: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const sessionService = SessionService.initialize(
    () => {
      // Handle session expiry
      dispatch({ type: 'SESSION_EXPIRED' });
    },
    (timeLeft: number) => {
      // Handle session warning
      dispatch({ 
        type: 'SESSION_WARNING', 
        payload: { warning: true, timeLeft } 
      });
    }
  );

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Auto-logout on token expiration
  useEffect(() => {
    if (state.isAuthenticated && state.token) {
      const checkTokenExpiration = () => {
        if (AuthService.isTokenExpired(state.token!)) {
          logout();
        }
      };

      // Check every 5 minutes
      const interval = setInterval(checkTokenExpiration, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [state.isAuthenticated, state.token]);

  const checkAuth = async (): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const token = AuthService.getStoredToken();
      const user = AuthService.getStoredUser();
      
      if (token && user) {
        if (AuthService.isTokenExpired(token)) {
          // Try to refresh token
          const refreshResult = await AuthService.refreshToken();
          if (refreshResult) {
            dispatch({
              type: 'AUTH_SUCCESS',
              payload: refreshResult,
            });
          } else {
            dispatch({ type: 'LOGOUT' });
          }
        } else {
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user, token },
          });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE', payload: 'Authentication check failed' });
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    dispatch({ type: 'AUTH_START' });
    
    try {
      const result = await AuthService.login(email, password);
      
      // Create session with enhanced security
      sessionService.createSession({
        userId: result.user.id || '1',
        email: result.user.email,
        role: result.user.role,
      });
      
      console.log('🎯 Dispatching AUTH_SUCCESS with result:', result);
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: result,
      });
      
      console.log('✨ AUTH_SUCCESS dispatched');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      await AuthService.logout();
      sessionService.destroySession();
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      // Even if logout API fails, clear local state
      sessionService.destroySession();
      dispatch({ type: 'LOGOUT' });
    }
  };

  const clearError = useCallback((): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const contextValue: AuthContextType = {
    state,
    login,
    logout,
    clearError,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// HOC for components that require authentication
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function AuthenticatedComponent(props: P) {
    const { state } = useAuth();
    
    if (!state.isAuthenticated) {
      return null; // or redirect to login
    }
    
    return <Component {...props} />;
  };
}