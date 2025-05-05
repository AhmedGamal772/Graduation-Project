import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { KeySquare, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import FormField from '../../components/ui/FormField';
import Button from '../../components/ui/Button';
import AuthService from '../../services/auth.service';
import { toast } from 'react-hot-toast';

const PasswordChangeSchema = Yup.object().shape({
  newPassword: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-zA-Z])(?=.*[0-9])/,
      'Password must contain at least one letter and one number'
    )
    .required('New password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords must match')
    .required('Confirm password is required'),
});

const FirstLoginPage: React.FC = () => {
  const { user, refreshUser, isAuthenticated, isLoading, updateFirstLoginStatus } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('FirstLoginPage rendered with:', { 
      isAuthenticated, 
      isLoading, 
      user,
      firstLoginStatus: user?.is_first_login 
    });
    
    // If not authenticated or not first login, redirect to appropriate page
    if (isAuthenticated && !isLoading && user && !user.is_first_login) {
      console.log('User already changed password, redirecting to dashboard');
      navigate('/dashboard');
    } else if (!isAuthenticated && !isLoading) {
      console.log('User not authenticated, redirecting to login');
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, user, navigate]);

  // Catch any uncaught errors in the component
  useEffect(() => {
    window.addEventListener('error', (e) => {
      console.error('Global error caught:', e);
      setError(`Error: ${e.message}`);
    });
    
    return () => {
      window.removeEventListener('error', () => {});
    };
  }, []);
  
  // If there was an uncaught error, display it
  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} p-6 rounded shadow-md max-w-md w-full`}>
          <h2 className="text-red-600 text-xl font-bold mb-4">Error Occurred</h2>
          <p className="mb-4">{error}</p>
          <p className="mb-4">Please try logging out and back in.</p>
          <button 
            onClick={() => AuthService.logout()}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  // Show loading state while auth is being checked
  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Added fallback for when user object is undefined/null
  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} p-6 rounded shadow-md max-w-md w-full`}>
          <h2 className="text-red-600 text-xl font-bold mb-4">Authentication Error</h2>
          <p className="mb-4">Unable to retrieve user information. Please try logging in again.</p>
          <button 
            onClick={() => AuthService.logout()}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative`}>
      {/* Dark mode toggle button */}
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-800 text-yellow-400' : 'bg-white text-gray-700'} shadow-md hover:shadow-lg transition-all duration-200`}
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <KeySquare className="h-12 w-12 text-blue-600" />
        </div>
        <h2 className={`mt-6 text-center text-3xl font-extrabold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Set Your Password
        </h2>
        <p className={`mt-2 text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Please set a new password for your account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} py-8 px-4 shadow sm:rounded-lg sm:px-10`}>
          <Formik
            initialValues={{ newPassword: '', confirmPassword: '' }}
            validationSchema={PasswordChangeSchema}
            onSubmit={async (values, { setSubmitting }) => {
              try {
                console.log('Submitting first login password change...');
                // Use the special first login method instead
                await AuthService.changePasswordFirstLogin(values.newPassword, values.confirmPassword);
                toast.success('Password updated successfully');
                
                // Explicitly update first login status in memory
                updateFirstLoginStatus(false);
                
                // Force reload instead of using React Router navigation
                // This ensures a clean state when going to the dashboard
                setTimeout(() => {
                  window.location.href = '/dashboard';
                }, 1000); // short delay to allow the toast to be seen
              } catch (error: any) {
                console.error('Password change error:', error);
                
                // Show more detailed error messages from the API if available
                if (error.response?.data?.message) {
                  toast.error(`Error: ${error.response.data.message}`);
                } else if (error.response?.data?.errors) {
                  // If there are validation errors
                  const errorMessages = error.response.data.errors.map(e => e.msg).join(', ');
                  toast.error(`Validation error: ${errorMessages}`);
                } else {
                  toast.error('Failed to update password. Please try again.');
                }
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-6">
                <FormField
                  label="New Password"
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  isDarkMode={isDarkMode}
                />

                <FormField
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  isDarkMode={isDarkMode}
                />

                <div>
                  <Button
                    type="submit"
                    isLoading={isSubmitting}
                    disabled={isSubmitting}
                    fullWidth
                    variant={isDarkMode ? 'dark' : 'primary'}
                  >
                    Set Password
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default FirstLoginPage; 