import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import MainLayout from '../../components/layout/MainLayout';
import { Card, CardContent } from '../../components/ui/Card';
import { Users, BookOpen, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import CourseService from '../../services/course.service';
import AdminService from '../../services/admin.service';
import { Course, Analytics } from '../../types';
import CourseCard from '../../components/courses/CourseCard';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Button from '../../components/ui/Button';

// Custom error boundary component
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  isDarkMode: boolean;
}

class DashboardErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Dashboard error caught:', error, errorInfo);
  }

  render(): React.ReactNode {
    const { isDarkMode } = this.props;

    if (this.state.hasError) {
      return (
        <div className={`p-6 ${isDarkMode ? 'bg-red-900 border-red-800' : 'bg-red-50 border border-red-200'} rounded-lg mb-6`}>
          <div className="flex items-center mb-4">
            <AlertTriangle className={`${isDarkMode ? 'text-red-400' : 'text-red-500'} mr-2`} />
            <h2 className={`text-lg font-bold ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>Dashboard Error</h2>
          </div>
          <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : ''}`}>Sorry, something went wrong loading the dashboard content.</p>
          <p className={`text-sm ${isDarkMode ? 'text-red-300 bg-red-900' : 'text-red-600 bg-red-100'} mb-4 font-mono p-2 rounded`}>
            {this.state.error?.toString()}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className={`px-4 py-2 ${isDarkMode ? 'bg-blue-700' : 'bg-blue-500'} text-white rounded hover:bg-blue-600`}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const DashboardPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const { isDarkMode } = useTheme();
  const [recentCourses, setRecentCourses] = useState<Course[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    // Log for debugging
    console.log('Dashboard rendering with user:', user);
    console.log('hasRole function available:', !!hasRole);
    
    const fetchData = async () => {
      setIsLoading(true);
      setErrors([]);
      
      try {
        console.log('Fetching dashboard data...');
        let courses: Course[] = [];
        
        // Try/catch for each API call
        try {
          if (hasRole('admin')) {
            console.log('Fetching courses for admin');
            courses = await CourseService.getAllCourses();
          } else if (hasRole('instructor') && !hasRole('student')) {
            console.log('Fetching courses for instructor');
            courses = await CourseService.getInstructorCourses();
          } else {
            console.log('Fetching enrolled courses');
            courses = await CourseService.getEnrolledCourses();
          }
        } catch (error) {
          console.error('Error fetching courses:', error);
          setErrors(prev => [...prev, 'Failed to load courses.']);
          courses = [];
        }
        
        setRecentCourses(courses.slice(0, 3));

        // Separate try/catch for analytics
        if (hasRole('admin')) {
          try {
            console.log('Fetching analytics');
            const analyticsData = await AdminService.getAnalytics();
            setAnalytics(analyticsData);
          } catch (error) {
            console.error('Error fetching analytics:', error);
            setErrors(prev => [...prev, 'Failed to load analytics.']);
            // Provide fallback analytics
            setAnalytics({
              total_users: 0,
              total_courses: 0,
              total_enrollments: 0
            });
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setErrors(prev => [...prev, 'Error loading dashboard data.']);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [hasRole, user]);

  const getStats = () => {
    if (hasRole('admin') && analytics) {
      return [
        { name: 'Total Users', value: analytics.total_users, icon: Users, color: 'bg-purple-500' },
        { name: 'Total Courses', value: analytics.total_courses, icon: BookOpen, color: 'bg-blue-500' },
        { name: 'Total Enrollments', value: analytics.total_enrollments, icon: CheckCircle, color: 'bg-green-500' }
      ];
    }

    if (hasRole('instructor') && !hasRole('student')) {
      return [
        { name: 'Your Courses', value: recentCourses.length, icon: BookOpen, color: 'bg-blue-500' },
        { name: 'Active Posts', value: '0', icon: FileText, color: 'bg-purple-500' },
        { name: 'Students', value: '0', icon: Users, color: 'bg-green-500' }
      ];
    }

    // For students - only show enrolled courses
    return [
      { name: 'Enrolled Courses', value: recentCourses.length, icon: BookOpen, color: 'bg-blue-500' }
    ];
  };

  return (
    <MainLayout>
      {/* Welcome section */}
      <DashboardErrorBoundary isDarkMode={isDarkMode}>
        <div className="mb-6">
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
            Welcome back, {user?.first_name || user?.firstName || 'User'}!
          </h1>
          <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {hasRole('admin') && "Here's an overview of your learning platform administration."}
            {hasRole('instructor') && !hasRole('student') && "Here's an overview of your teaching activities."}
            {hasRole('student') && "Here's an overview of your learning progress."}
          </p>
          
          {errors.length > 0 && (
            <div className={`mt-4 p-3 ${isDarkMode ? 'bg-yellow-900 border-yellow-800' : 'bg-yellow-50 border border-yellow-200'} rounded`}>
              <h3 className={isDarkMode ? 'text-yellow-300 font-medium' : 'text-yellow-700 font-medium'}>Warnings:</h3>
              <ul className="list-disc pl-5 mt-1">
                {errors.map((error, index) => (
                  <li key={index} className={`text-sm ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DashboardErrorBoundary>

      {/* Stats Grid */}
      <DashboardErrorBoundary isDarkMode={isDarkMode}>
        <div className={`grid grid-cols-1 gap-6 ${getStats().length > 1 ? 'sm:grid-cols-3' : 'max-w-sm mx-auto'} mb-8`}>
          {getStats().map((stat) => (
            <Card key={stat.name}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`p-3 rounded-full ${stat.color} mr-4`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{stat.name}</p>
                    <p className={`text-2xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DashboardErrorBoundary>

      {/* Recent Courses */}
      <DashboardErrorBoundary isDarkMode={isDarkMode}>
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Recent Courses</h2>
            <Link to="/courses" className={`${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} text-sm font-medium`}>
              View all
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`animate-pulse ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm h-48`} />
              ))}
            </div>
          ) : recentCourses.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>No courses available yet.</p>
                {hasRole(['admin', 'instructor']) && (
                  <Link to="/courses/create" className="mt-4 inline-block">
                    <Button variant={isDarkMode ? "dark" : "primary"}>Create Your First Course</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentCourses.map((course) => (
                <CourseCard 
                  key={course.id} 
                  course={course} 
                  isStudentView={hasRole('student')}
                  relationshipType={course?.relationshipType as any}
                />
              ))}
            </div>
          )}
        </div>
      </DashboardErrorBoundary>
    </MainLayout>
  );
};

export default DashboardPage;