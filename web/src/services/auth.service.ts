import api from './api';
import Cookies from 'js-cookie';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../types';

// 30 days in seconds
const TOKEN_EXPIRY = 30 * 24 * 60 * 60;

// Add a stronger throttle mechanism for API calls
let lastMeFetchTime = 0;
const ME_FETCH_THROTTLE = 30000; // 30 seconds - increase to reduce API calls
let pendingMeRequest: Promise<User> | null = null;

export const AuthService = {
  login: async (data: LoginRequest): Promise<User> => {
    try {
      // Log for debugging purposes
      console.log('Attempting login with:', { email: data.email });
      
      // Make the API request
      const response = await api.post<AuthResponse>('/auth/login', data);
      const { token, user } = response.data;
      
      // Store token and user data
      Cookies.set('token', token, { expires: TOKEN_EXPIRY, sameSite: 'strict' });
      Cookies.set('user', JSON.stringify(user), { expires: TOKEN_EXPIRY, sameSite: 'strict' });
      
      // Update last fetch time
      lastMeFetchTime = Date.now();
      
      return user;
    } catch (error) {
      // Log the error but don't redirect or modify the window
      console.error('Login API error:', error);
      
      // Important: Do not manipulate window.location here as it might cause page refresh
      // Instead, let the error propagate and be handled by the component
      
      // Rethrow the error to be handled by the caller
      throw error;
    }
  },
  
  register: async (data: RegisterRequest): Promise<User> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    const { token, user } = response.data;
    
    // Store token and user data
    Cookies.set('token', token, { expires: TOKEN_EXPIRY, sameSite: 'strict' });
    Cookies.set('user', JSON.stringify(user), { expires: TOKEN_EXPIRY, sameSite: 'strict' });
    
    // Update last fetch time
    lastMeFetchTime = Date.now();
    
    return user;
  },
  
  logout: async (): Promise<void> => {
    try {
      // Call server to blacklist the token if we're authenticated
      if (AuthService.isAuthenticated()) {
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Always clear cookies and redirect, regardless of server response
      Cookies.remove('token');
      Cookies.remove('user');
      window.location.href = '/login';
    }
  },
  
  getCurrentUser: (): User | null => {
    const userStr = Cookies.get('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr) as User;
    } catch (error) {
      console.error('Failed to parse user data:', error);
      return null;
    }
  },
  
  getMe: async (): Promise<User> => {
    try {
      // First check cached data
      const currentUser = AuthService.getCurrentUser();
      
      // If no token or user data, reject immediately
      if (!Cookies.get('token') || !currentUser) {
        throw new Error('User not authenticated');
      }
      
      // Check if we should throttle API calls
      const now = Date.now();
      
      // Use cached data if within throttle period
      if (now - lastMeFetchTime < ME_FETCH_THROTTLE && currentUser) {
        return currentUser;
      }
      
      // Re-use in-flight request if one exists
      if (pendingMeRequest) {
        return pendingMeRequest;
      }
      
      // Update last fetch time
      lastMeFetchTime = now;
      
      // Create new request and store it
      pendingMeRequest = api.get<User>('/auth/me')
        .then(response => {
          // Update stored user data with latest from server
          if (response.data) {
            Cookies.set('user', JSON.stringify(response.data), { 
              expires: TOKEN_EXPIRY, 
              sameSite: 'strict' 
            });
          }
          return response.data;
        })
        .finally(() => {
          // Clear the pending request reference
          pendingMeRequest = null;
        });
      
      return pendingMeRequest;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // If API request fails, fall back to stored user data
      const currentUser = AuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      return currentUser;
    }
  },
  
  isAuthenticated: (): boolean => {
    return !!Cookies.get('token');
  },
  
  hasRole: (role: string | string[]): boolean => {
    const user = AuthService.getCurrentUser();
    if (!user) return false;
    
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    
    return user.role === role;
  },

  updateStoredUserRole: (user: User): void => {
    // Update the user data in cookies to match the new role
    Cookies.set('user', JSON.stringify(user), { expires: TOKEN_EXPIRY, sameSite: 'strict' });
    
    // Reset last fetch time to ensure next getMe call updates data
    lastMeFetchTime = 0;
  },

  changePassword: async (currentPassword: string, newPassword: string, confirmPassword: string): Promise<void> => {
    await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
      confirmPassword
    });
  },

  // For first login, use this specific method which doesn't require currentPassword validation
  changePasswordFirstLogin: async (newPassword: string, confirmPassword: string): Promise<void> => {
    console.log('Using first login password change method');
    await api.post('/auth/change-password', {
      currentPassword: '',  // Send empty string for first login
      newPassword,
      confirmPassword
    });
  }
};

export default AuthService;