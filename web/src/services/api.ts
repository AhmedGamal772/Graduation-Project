import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'react-hot-toast';

// Extend the AxiosResponse type to include our cached property
interface CachedAxiosResponse extends AxiosResponse {
  cached?: boolean;
}

// Extend AxiosInstance with our custom methods
interface ExtendedAxiosInstance extends AxiosInstance {
  skipCache: (config: AxiosRequestConfig) => AxiosRequestConfig;
  clearCache: () => void;
  clearCacheFor: (url: string) => void;
}

// Create axios instance with base URL from environment variables
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
}) as ExtendedAxiosInstance;

// Cache for API responses
interface CacheEntry {
  data: any;
  timestamp: number;
}

const responseCache = new Map<string, CacheEntry>();
const CACHE_TTL = 30000; // 30 seconds cache time-to-live

// Add interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Only cache GET requests that don't have a custom cache control header
    if (config.method === 'get' && !config.headers['x-skip-cache']) {
      const cacheKey = `${config.url}${JSON.stringify(config.params || {})}`;
      const cached = responseCache.get(cacheKey);
      
      // If we have a valid cache entry, use it
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        // Set a flag to indicate we're using cached data
        config.adapter = async () => {
          return {
            data: cached.data,
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
            cached: true
          } as CachedAxiosResponse;
        };
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Track number of API calls to reduce excessive logging
const apiCallCounts = new Map<string, number>();

// Define endpoints to completely silence in logs
const SILENT_ENDPOINTS = ['/auth/me'];

// Define login endpoints that shouldn't trigger auto-redirects on 401
const LOGIN_ENDPOINTS = ['/auth/login'];

// Add interceptor to handle 401 responses (unauthorized) and log responses
api.interceptors.response.use(
  (response: CachedAxiosResponse) => {
    // If this is a cached response, return it directly without processing
    if (response.cached) {
      return response;
    }
    
    // Cache the response for GET requests
    if (response.config.method === 'get' && !response.config.headers['x-skip-cache']) {
      const cacheKey = `${response.config.url}${JSON.stringify(response.config.params || {})}`;
      responseCache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });
    }
    
    // Only log API calls in development mode, and avoid excessive logging
    if (import.meta.env.DEV) {
      const url = response.config.url || '';
      
      // Skip logging for completely silent endpoints
      if (SILENT_ENDPOINTS.some(endpoint => url.includes(endpoint))) {
        return response;
      }
      
      // Skip logging for frequent endpoints that aren't completely silent
      const skipLogging = [
        '/courses/enrolled',
        '/courses/instructor'
      ].some(endpoint => url.includes(endpoint));
      
      if (!skipLogging) {
        const method = response.config.method?.toUpperCase();
        console.log(`API Response [${method} ${url}]:`, response.status);
      } else {
        // For frequent endpoints, only log once or on error
        const key = `${response.config.method}-${url}`;
        const count = apiCallCounts.get(key) || 0;
        
        if (count === 0) {
          console.log(`API Response [${response.config.method?.toUpperCase()} ${url}]:`, response.status);
        }
        
        apiCallCounts.set(key, count + 1);
      }
    }
    return response;
  },
  (error) => {
    // Skip logging errors for silent endpoints
    const url = error.config?.url || '';
    const isSilentEndpoint = SILENT_ENDPOINTS.some(endpoint => url.includes(endpoint));
    const isLoginEndpoint = LOGIN_ENDPOINTS.some(endpoint => url.includes(endpoint));
    
    // Log error responses for debugging (except for silent endpoints)
    if (error.response && !isSilentEndpoint) {
      const method = error.config.method?.toUpperCase();
      console.error(`API Error [${method} ${url}]:`, error.response.status, error.response.data);
      
      // Skip automatic redirects for login endpoints - let components handle these errors
      if (isLoginEndpoint) {
        console.log('Login endpoint error - skipping auto redirect');
        return Promise.reject(error);
      }
      
      // Handle 401 unauthorized or 403 forbidden
      if (error.response.status === 401) {
        const errorCode = error.response.data?.code;
        
        // Handle token blacklisting
        if (errorCode === 'TOKEN_BLACKLISTED' || errorCode === 'ALL_TOKENS_BLACKLISTED') {
          Cookies.remove('token');
          Cookies.remove('user');
          
          // Show a more specific message
          const message = errorCode === 'TOKEN_BLACKLISTED' 
            ? 'Your session has expired. Please log in again.'
            : 'Your account has been modified. Please log in again.';
          
          toast.error(message);
          
          // Redirect to login
          window.location.href = '/login';
        } else {
          // Generic handling for other 401 errors
          Cookies.remove('token');
          Cookies.remove('user');
          window.location.href = '/login';
        }
      } 
      // Handle account suspension
      else if (error.response.status === 403 && error.response.data?.code === 'ACCOUNT_SUSPENDED') {
        Cookies.remove('token');
        Cookies.remove('user');
        
        toast.error('Your account has been suspended. Please contact an administrator.');
        window.location.href = '/login?suspended=true';
      }
    } else if (error.request && !isSilentEndpoint) {
      console.error('API Error: No response received', error.request);
    } else if (!isSilentEndpoint) {
      console.error('API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Define the custom methods
// Helper method to force skip cache for specific requests
api.skipCache = (config: AxiosRequestConfig): AxiosRequestConfig => {
  return {
    ...config,
    headers: {
      ...config.headers,
      'x-skip-cache': true
    }
  };
};

// Helper to clear the entire cache
api.clearCache = (): void => {
  responseCache.clear();
};

// Helper to clear cache for a specific endpoint
api.clearCacheFor = (url: string): void => {
  for (const key of responseCache.keys()) {
    if (key.startsWith(url)) {
      responseCache.delete(key);
    }
  }
};

export default api;