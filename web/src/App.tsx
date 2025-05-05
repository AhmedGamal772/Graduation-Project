import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import ProtectedRoute from './routes/ProtectedRoute';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import FirstLoginPage from './pages/auth/FirstLoginPage';

// Dashboard
import DashboardPage from './pages/dashboard/DashboardPage';

// Course Pages
import CourseListPage from './pages/courses/CourseListPage';
import CourseDetailPage from './pages/courses/CourseDetailPage';
import CreateCoursePage from './pages/courses/CreateCoursePage';

// Post Pages
import CreatePostPage from './pages/posts/CreatePostPage';
import PostDetailPage from './pages/posts/PostDetailPage';

// User Management
import UserManagementPage from './pages/admin/UserManagementPage';
import UserProfilePage from './pages/admin/UserProfilePage';

// Assignment Pages
import AssignmentListPage from './pages/assignments/AssignmentListPage';

// Enrollment Pages
import EnrollmentPage from './pages/enrollments/EnrollmentPage';

// Error Boundary component to catch rendering errors
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log the error to console
    console.error("React Error Boundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow p-6">
            <h1 className="text-red-600 text-xl font-bold mb-4">Something went wrong</h1>
            <p className="mb-4">The application encountered an error:</p>
            <div className="bg-gray-100 p-4 rounded mb-4 overflow-auto max-h-96">
              <p className="font-mono text-sm whitespace-pre-wrap">
                {this.state.error && this.state.error.toString()}
              </p>
            </div>
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    // If no error, render children normally
    return this.props.children;
  }
}

// First Login Check component
interface FirstLoginCheckProps {
  children: React.ReactNode;
}

const FirstLoginCheck: React.FC<FirstLoginCheckProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  
  // Don't redirect if already on the first-login page
  if (location.pathname === '/first-login') {
    return <>{children}</>;
  }
  
  // Show children while loading to avoid flashing
  if (isLoading) {
    return <>{children}</>;
  }
  
  // If authenticated and is first login, redirect to change password
  if (isAuthenticated && user?.is_first_login) {
    console.log('User needs to change password on first login:', user);
    return <Navigate to="/first-login" replace />;
  }
  
  // Otherwise show the children
  return <>{children}</>;
};

// We'll fix the circular dependency by creating a separate component for the routes
function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* First Login Route */}
      <Route path="/first-login" element={<FirstLoginPage />} />
      
      {/* Protected Routes for all authenticated users */}
      <Route element={<ProtectedRoute />}>
        {/* Wrap all protected routes with FirstLoginCheck */}
        <Route element={<FirstLoginCheck>{<Outlet />}</FirstLoginCheck>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/courses" element={<CourseListPage />} />
          <Route path="/courses/:courseId" element={<CourseDetailPage />} />
          <Route path="/courses/:courseId/posts/:postId" element={<PostDetailPage />} />
          <Route path="/assignments" element={<AssignmentListPage />} />
        
          {/* Admin and Instructor Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'instructor']} />}>
            <Route path="/courses/create" element={<CreateCoursePage />} />
            <Route path="/courses/:courseId/posts/create" element={<CreatePostPage />} />
          </Route>
          
          {/* Admin Only Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin/users" element={<UserManagementPage />} />
            <Route path="/admin/users/:userId/profile" element={<UserProfilePage />} />
            <Route path="/enrollments" element={<EnrollmentPage />} />
          </Route>
        </Route>
      </Route>
      
      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

// Create a separate component for Toaster to access theme context
const ThemedToaster = () => {
  const { isDarkMode } = useTheme();
  
  return (
    <Toaster 
      position="top-right"
      toastOptions={{
        style: {
          background: isDarkMode ? '#374151' : '#fff',
          color: isDarkMode ? '#F3F4F6' : '#333',
          boxShadow: isDarkMode ? '0 1px 3px 0 rgba(0, 0, 0, 0.4)' : undefined,
        },
        duration: 3000,
        success: {
          style: {
            borderLeft: isDarkMode ? '4px solid #10B981' : '4px solid #10b981',
          },
        },
        error: {
          duration: 5000,
          style: {
            borderLeft: isDarkMode ? '4px solid #EF4444' : '4px solid #ef4444',
          },
        },
      }}
    />
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <ErrorBoundary>
            <AppRoutes />
            <ThemedToaster />
          </ErrorBoundary>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;