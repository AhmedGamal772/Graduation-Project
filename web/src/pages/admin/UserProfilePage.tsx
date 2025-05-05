import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Calendar, Mail, Shield, AlertCircle, Trash2, BookOpen } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTheme } from '../../context/ThemeContext';
import MainLayout from '../../components/layout/MainLayout';
import { Card, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import AdminService from '../../services/admin.service';
import { formatDistanceToNow } from 'date-fns';

interface UserProfileParams {
  userId: string;
}

const UserProfilePage: React.FC = () => {
  const { userId } = useParams<keyof UserProfileParams>() as UserProfileParams;
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRemovingEnrollment, setIsRemovingEnrollment] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const userProfile = await AdminService.getUserProfile(userId);
        setProfile(userProfile);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setError('Failed to load user profile');
        toast.error('Failed to load user profile');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [userId]);

  const handleRemoveEnrollment = async (enrollmentId: string) => {
    if (window.confirm('Are you sure you want to remove this enrollment? This action cannot be undone.')) {
      setIsRemovingEnrollment(enrollmentId);
      
      try {
        await AdminService.removeEnrollment(enrollmentId);
        
        // Update the profile state to remove the enrollment
        setProfile(prevProfile => ({
          ...prevProfile,
          enrollments: prevProfile.enrollments.filter((e: any) => e.id !== enrollmentId)
        }));
        
        toast.success('User has been unenrolled from the course');
      } catch (error) {
        console.error('Error removing enrollment:', error);
        toast.error('Failed to remove enrollment');
      } finally {
        setIsRemovingEnrollment(null);
      }
    }
  };

  const handleBackToUserList = () => {
    navigate('/admin/users');
  };

  const getStatusColor = (status: string) => {
    if (isDarkMode) {
      switch (status) {
        case 'active': return 'bg-green-900 text-green-300';
        case 'suspended': return 'bg-red-900 text-red-300';
        default: return 'bg-gray-700 text-gray-300';
      }
    } else {
      switch (status) {
        case 'active': return 'bg-green-100 text-green-800';
        case 'suspended': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    }
  };

  const getRoleColor = (role: string) => {
    if (isDarkMode) {
      switch (role) {
        case 'admin': return 'bg-purple-900 text-purple-300';
        case 'instructor': return 'bg-blue-900 text-blue-300';
        default: return 'bg-gray-700 text-gray-300';
      }
    } else {
      switch (role) {
        case 'admin': return 'bg-purple-100 text-purple-800';
        case 'instructor': return 'bg-blue-100 text-blue-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="animate-pulse space-y-4">
          <div className={`h-8 w-1/3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded`}></div>
          <div className={`h-40 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded`}></div>
          <div className={`h-20 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded`}></div>
          <div className={`h-40 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded`}></div>
        </div>
      </MainLayout>
    );
  }

  if (error || !profile) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className={`h-12 w-12 ${isDarkMode ? 'text-red-400' : 'text-red-500'} mb-4`} />
          <h2 className={`text-xl font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'} mb-2`}>
            Error Loading Profile
          </h2>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-6`}>
            {error || 'Failed to load user profile'}
          </p>
          <Button variant={isDarkMode ? "dark" : "outline"} onClick={handleBackToUserList}>
            Return to User List
          </Button>
        </div>
      </MainLayout>
    );
  }

  const { user, enrollments } = profile;

  return (
    <MainLayout>
      {/* Breadcrumb */}
      <nav className={`flex items-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-6`}>
        <button
          onClick={handleBackToUserList}
          className={`flex items-center ${isDarkMode ? 'hover:text-gray-300' : 'hover:text-gray-700'}`}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to User List
        </button>
      </nav>

      {/* User Profile Header */}
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm mb-6 p-6`}>
        <div className="flex flex-col md:flex-row md:items-center">
          <div className={`h-20 w-20 rounded-full ${isDarkMode ? 'bg-blue-700' : 'bg-blue-100'} flex items-center justify-center`}>
            <User className={`h-10 w-10 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`} />
          </div>
          
          <div className="md:ml-6 mt-4 md:mt-0">
            <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {user.firstName} {user.lastName}
            </h1>
            
            <div className="flex flex-wrap items-center mt-2 gap-2">
              <div className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${getRoleColor(user.role)}`}>
                <Shield className="h-3 w-3 mr-1" />
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </div>
              
              <div className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${getStatusColor(user.status)}`}>
                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
              </div>
              
              <div className={`inline-flex items-center text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <Calendar className="h-3 w-3 mr-1" />
                Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
              </div>
            </div>
            
            <div className={`flex items-center mt-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <Mail className="h-4 w-4 mr-1" />
              {user.email}
            </div>
          </div>
        </div>
      </div>

      {/* Enrollments */}
      <div className="mb-6">
        <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'} mb-4`}>
          Course Enrollments
        </h2>
        
        {enrollments.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center">
              <BookOpen className={`h-12 w-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>No Enrollments</h3>
              <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                This user is not enrolled in any courses.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border overflow-hidden`}>
            <div className={`${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} px-4 py-3 border-b`}>
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-5 font-medium text-sm">Course</div>
                <div className="col-span-3 font-medium text-sm">Role</div>
                <div className="col-span-2 font-medium text-sm">Enrolled On</div>
                <div className="col-span-2 font-medium text-sm text-right">Actions</div>
              </div>
            </div>
            
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {enrollments.map((enrollment: any) => (
                <div key={enrollment.id} className={`px-4 py-3 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-5">
                      <Link 
                        to={`/admin/courses/${enrollment.courseId}`} 
                        className={`font-medium ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
                      >
                        {enrollment.courseTitle}
                      </Link>
                    </div>
                    
                    <div className="col-span-3">
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${getRoleColor(enrollment.role)}`}>
                        {enrollment.role.charAt(0).toUpperCase() + enrollment.role.slice(1)}
                      </div>
                    </div>
                    
                    <div className={`col-span-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(enrollment.enrolledAt).toLocaleDateString()}
                    </div>
                    
                    <div className="col-span-2 flex justify-end">
                      <Button 
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveEnrollment(enrollment.id)}
                        isLoading={isRemovingEnrollment === enrollment.id}
                        disabled={isRemovingEnrollment !== null}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Unenroll
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default UserProfilePage; 