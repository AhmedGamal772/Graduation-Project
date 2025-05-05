import React, { createContext, useCallback, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { User, LoginRequest, RegisterRequest } from '../types';
import AuthService from '../services/auth.service';
import { toast } from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  hasRole: (role: string | string[]) => boolean;
  updateUserRole: (role: string) => void;
  refreshUser: () => Promise<User | null>;
  updateFirstLoginStatus: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshCount, setRefreshCount] = useState(0);

  // Only run this on initial mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        setIsLoading(true);
        const currentUser = AuthService.getCurrentUser();
        
        if (currentUser) {
          // Try to get fresh data from server
          try {
            const freshUser = await AuthService.getMe();
            setUser(freshUser);
          } catch (error) {
            console.error("Failed to refresh user data, using stored data:", error);
            setUser(currentUser);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Optimized refreshUser with memoization
  const refreshUser = useCallback(async () => {
    // Debounce rapid refresh calls
    if (isLoading) return user;
    
    try {
      // Don't set loading state right away to prevent flickering
      const updatedUser = await AuthService.getMe();
      
      // Only update state if the user data has actually changed
      if (JSON.stringify(user) !== JSON.stringify(updatedUser)) {
        setUser(updatedUser);
        // Update the refresh counter to inform dependent components
        setRefreshCount(prev => prev + 1);
      }
      
      return updatedUser;
    } catch (error) {
      // If the API call fails, fall back to cookie data
      console.error("Failed to refresh user from API, using cookie data:", error);
      const currentUser = AuthService.getCurrentUser();
      
      // Only update state if the user data has actually changed
      if (JSON.stringify(user) !== JSON.stringify(currentUser)) {
        setUser(currentUser);
        // Update the refresh counter to inform dependent components
        setRefreshCount(prev => prev + 1);
      }
      
      return currentUser;
    }
  }, [user, isLoading]);

  // Memoize login to prevent recreation on every render
  const login = useCallback(async (data: LoginRequest) => {
    try {
      setIsLoading(true);
      const user = await AuthService.login(data);
      setUser(user);
      toast.success('Login successful!');
    } catch (error) {
      console.error('Login error:', error);
      // Don't show toast here to prevent it from disappearing
      // The component will show a persistent error instead
      
      // Rethrow the error so the component can handle it
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Memoize register to prevent recreation on every render
  const register = useCallback(async (data: RegisterRequest) => {
    try {
      setIsLoading(true);
      const user = await AuthService.register(data);
      setUser(user);
      toast.success('Registration successful!');
    } catch (error) {
      console.error('Register error:', error);
      toast.error('Registration failed. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Memoize logout to prevent recreation on every render
  const logout = useCallback(() => {
    AuthService.logout();
    setUser(null);
    toast.success('Logged out successfully');
  }, []);

  // Memoize hasRole to prevent recreation on every render and use the cached user
  const hasRole = useCallback((role: string | string[]): boolean => {
    if (!user) return false;
    
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    
    return user.role === role;
  }, [user]);

  // Memoize updateUserRole to prevent recreation on every render
  const updateUserRole = useCallback((role: string) => {
    if (!user) return;
    // Update the user object with the new role
    const updatedUser = { ...user, role };
    setUser(updatedUser);
    
    // Update in localStorage to persist across refreshes
    AuthService.updateStoredUserRole(updatedUser);
  }, [user]);
  
  // Memoize updateFirstLoginStatus to prevent recreation on every render
  const updateFirstLoginStatus = useCallback((value: boolean) => {
    if (!user) return;
    
    // Update the user object with new is_first_login status
    const updatedUser = { 
      ...user, 
      is_first_login: value 
    };
    
    // Update in memory
    setUser(updatedUser);
    
    // Update in cookies/storage
    const userJson = JSON.stringify(updatedUser);
    document.cookie = `user=${userJson}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Strict`;
  }, [user]);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    hasRole,
    updateUserRole,
    refreshUser,
    updateFirstLoginStatus
  }), [
    user, 
    isLoading, 
    login, 
    register, 
    logout, 
    hasRole, 
    updateUserRole,
    refreshUser,
    updateFirstLoginStatus,
    refreshCount // Include this to ensure dependents update when user is refreshed
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};