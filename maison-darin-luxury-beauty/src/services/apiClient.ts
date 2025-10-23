import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// Extend AxiosRequestConfig to include our custom properties
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  skipCache?: boolean;
}

// Create axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 20000, // Reduced for better performance
  headers: {
    'Content-Type': 'application/json',
  },
});

// API response caching mechanism
const apiCache = new Map<string, {data: any, timestamp: number}>();
const CACHE_DURATION = 3 * 60 * 1000; // 3 minutes

// Helper for generating cache keys
const getCacheKey = (config: AxiosRequestConfig): string => {
  const { method, url, params, data } = config;
  return `${method}-${url}-${JSON.stringify(params)}-${JSON.stringify(data)}`;
};

// Request interceptor to add auth token and handle caching
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token
    const token = localStorage.getItem('authToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Check cache for GET requests
    const customConfig = config as CustomAxiosRequestConfig;
    if (config.method?.toLowerCase() === 'get' && !customConfig.skipCache) {
      const cacheKey = getCacheKey(config);
      const cachedResponse = apiCache.get(cacheKey);
      
      if (cachedResponse && (Date.now() - cachedResponse.timestamp) < CACHE_DURATION) {
        // Return cached response as a resolved promise
        return {
          ...config,
          adapter: () => Promise.resolve({
            data: cachedResponse.data,
            status: 200,
            statusText: 'OK (cached)',
            headers: {},
            config,
            cached: true
          }),
        };
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/auth';
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }
    
    // Handle API errors
    const message = error.response?.data?.error?.message || error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

export { apiClient };