import React, { useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { BookOpen, AlertCircle, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/ui/Button';

// Email validation regex
const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

const LoginPage: React.FC = () => {
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{email?: string; password?: string}>({});
  
  // Auth and theme context
  const { login, isAuthenticated, isLoading } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  
  // Navigation and UI state
  const location = useLocation();
  const [showSuspendedMessage, setShowSuspendedMessage] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check for suspended account on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const isSuspended = params.get('suspended') === 'true';
    console.log(`Checking suspended status: ${isSuspended}`);
    setShowSuspendedMessage(isSuspended);
  }, [location]);

  // If we're returning to this page from a previous state, clear error states
  useEffect(() => {
    console.log('Setting up cleanup effect for login page');
    return () => {
      console.log('Cleanup effect running, clearing errors');
      setErrors({});
      setLoginError(null);
    };
  }, []);

  // Form validation
  const validateForm = () => {
    console.log('Validating form', { email, password });
    const newErrors: {email?: string; password?: string} = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!EMAIL_REGEX.test(email)) {
      newErrors.email = 'Invalid email address';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    console.log('Validation result', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle login button click
  const handleLoginClick = async () => {
    console.log('Login button clicked');
    
    // Validate form
    const isValid = validateForm();
    console.log(`Form validation result: ${isValid}`);
    
    if (!isValid || isSubmitting) {
      console.log('Login aborted - invalid form or already submitting');
      return;
    }
    
    // Set submitting state
    setIsSubmitting(true);
    
    try {
      console.log('Clearing previous login error');
      // Clear any previous error
      setLoginError(null);
      
      console.log('Calling login function', { email });
      // Call the login function from auth context - with try/catch to properly handle errors
      await login({ email, password });
      
      console.log('Login successful!');
      // If login succeeds, auth context will handle the redirect
    } catch (error: any) {
      console.error('Login error caught', error.message);
      
      // For consistent user experience, always show "Invalid credentials" 
      // for both wrong email and password
      let errorMessage = 'Invalid credentials';
      
      // Only use specific messages for other types of errors
      if (error.response?.status !== 400 && error.response?.status !== 401) {
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.message && !error.message.includes('status code 400') && !error.message.includes('status code 401')) {
          errorMessage = error.message;
        }
      }
      
      console.log(`Setting login error message: ${errorMessage}`);
      // Set the error message state
      setLoginError(errorMessage);
    } finally {
      console.log('Login attempt completed, setting isSubmitting to false');
      setIsSubmitting(false);
    }
  };

  // Handle key press for the password field
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      console.log('Enter key pressed');
      e.preventDefault();
      handleLoginClick();
    }
  };

  // If authenticated, redirect to dashboard
  if (isAuthenticated) {
    console.log('User is authenticated, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div 
      id="login-container"
      className={`min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
    >
      {/* Dark mode toggle button */}
      <div className="absolute top-4 right-4">
        <button
          type="button" 
          onClick={toggleTheme}
          className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-800 text-yellow-400' : 'bg-white text-gray-700'} shadow-md hover:shadow-lg transition-all duration-200`}
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <BookOpen className="h-12 w-12 text-blue-600" />
        </div>
        <h2 className={`mt-6 text-center text-3xl font-extrabold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Sign in to your account
        </h2>
        <p className={`mt-2 text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Or{' '}
          <Link 
            to="/register" 
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className={`py-8 px-4 shadow sm:rounded-lg sm:px-10 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          {/* Account suspended message */}
          {showSuspendedMessage && (
            <div className={`mb-4 rounded-md p-4 ${isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-50 text-red-800'}`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className={`h-5 w-5 ${isDarkMode ? 'text-red-400' : 'text-red-400'}`} aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium">Account Suspended</h3>
                  <div className="mt-2 text-sm">
                    <p>
                      Your account has been suspended. Please contact an administrator for assistance.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Login error message */}
          {loginError && (
            <div className={`mb-4 rounded-md p-4 ${isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-50 text-red-800'}`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className={`h-5 w-5 ${isDarkMode ? 'text-red-400' : 'text-red-400'}`} aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium">Login Error</h3>
                  <div className="mt-2 text-sm">
                    <p>{loginError}</p>
                    <p className="mt-1">
                      If you've forgotten your password, please contact the system administrator to reset it.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Login fields (not using form element) */}
          <div className="space-y-6">
            {/* Email field */}
            <div className="mb-4">
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                className={`
                  w-full px-3 py-2 border rounded-md shadow-sm 
                  ${isDarkMode 
                    ? 'bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500' 
                    : 'bg-white border-gray-300 placeholder-gray-400 text-black focus:ring-blue-500 focus:border-blue-500'
                  }
                  focus:outline-none focus:ring-2
                  ${errors.email 
                    ? isDarkMode 
                      ? 'border-red-700 focus:ring-red-700 focus:border-red-700' 
                      : 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                    : ''
                  }
                `}
                placeholder="you@example.com"
                autoComplete="email"
              />
              {errors.email && (
                <p className={`mt-1 text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{errors.email}</p>
              )}
            </div>

            {/* Password field */}
            <div className="mb-4">
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                className={`
                  w-full px-3 py-2 border rounded-md shadow-sm 
                  ${isDarkMode 
                    ? 'bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500' 
                    : 'bg-white border-gray-300 placeholder-gray-400 text-black focus:ring-blue-500 focus:border-blue-500'
                  }
                  focus:outline-none focus:ring-2
                  ${errors.password 
                    ? isDarkMode 
                      ? 'border-red-700 focus:ring-red-700 focus:border-red-700' 
                      : 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                    : ''
                  }
                `}
                placeholder="••••••"
                autoComplete="current-password"
              />
              {errors.password && (
                <p className={`mt-1 text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{errors.password}</p>
              )}
            </div>

            {/* Login button */}
            <div>
              <Button
                type="button"
                onClick={handleLoginClick}
                isLoading={isSubmitting || isLoading}
                disabled={isSubmitting || isLoading}
                fullWidth
                variant={isDarkMode ? 'dark' : 'primary'}
              >
                Sign in
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;