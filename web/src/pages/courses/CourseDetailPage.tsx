import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PlusCircle, CalendarDays, User, Clock, ChevronRight, Trash2, Users } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import MainLayout from '../../components/layout/MainLayout';
import Button from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import CourseService from '../../services/course.service';
import PostService from '../../services/post.service';
import { Course, Post } from '../../types';
import PostCard from '../../components/posts/PostCard';
import { toast } from 'react-hot-toast';

interface EnrolledUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  enrollment_role: string;
  enrolled_at: string;
}

const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [enrolledUsers, setEnrolledUsers] = useState<EnrolledUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [usersError, setUsersError] = useState<string | null>(null);
  const isAdminOrInstructor = hasRole('admin') || hasRole('instructor');
  const { isDarkMode } = useTheme();
  
  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) return;
      
      setIsLoading(true);
      try {
        const fetchedCourse = await CourseService.getCourseById(courseId);
        setCourse(fetchedCourse);
      } catch (error) {
        console.error('Error fetching course:', error);
        toast.error('Failed to load course details');
      } finally {
        setIsLoading(false);
      }
    };
    
    const fetchPosts = async () => {
      if (!courseId) return;
      
      setIsLoadingPosts(true);
      setPostsError(null);
      try {
        const fetchedPosts = await PostService.getCoursePosts(courseId);
        setPosts(fetchedPosts);
      } catch (error: any) {
        console.error('Error fetching posts:', error);
        if (error.response?.status === 403) {
          setPostsError("You don't have permission to view posts for this course.");
        } else {
          setPostsError("Failed to load course posts.");
        }
      } finally {
        setIsLoadingPosts(false);
      }
    };

    const fetchEnrolledUsers = async () => {
      if (!courseId || !isAdminOrInstructor) return;
      
      setIsLoadingUsers(true);
      setUsersError(null);
      try {
        const users = await CourseService.getEnrolledUsers(courseId);
        setEnrolledUsers(users);
      } catch (error: any) {
        console.error('Error fetching enrolled users:', error);
        if (error.response?.status === 403) {
          setUsersError("You don't have permission to view enrolled users for this course.");
        } else {
          setUsersError("Failed to load enrolled users.");
        }
      } finally {
        setIsLoadingUsers(false);
      }
    };
    
    fetchCourse();
    fetchPosts();
    if (isAdminOrInstructor) {
      fetchEnrolledUsers();
    }
  }, [courseId, hasRole, isAdminOrInstructor]);

  const handleDeleteCourse = async () => {
    if (!courseId) return;
    
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }
    
    try {
      await CourseService.deleteCourse(courseId);
      toast.success('Course deleted successfully');
      navigate('/courses');
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course');
    }
  };
  
  if (!courseId) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">Invalid Course ID</h3>
          <p className="mt-1 text-sm text-gray-500">
            The course ID is missing or invalid.
          </p>
          <div className="mt-6">
            <Link to="/courses">
              <Button variant="outline">
                Return to Courses
              </Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  if (isLoading) {
    return (
      <MainLayout>
        <div className="animate-pulse">
          <div className={`h-8 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded w-1/4 mb-4`}></div>
          <div className={`h-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded w-2/4 mb-6`}></div>
          <div className={`h-64 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded mb-8`}></div>
        </div>
      </MainLayout>
    );
  }
  
  if (!course) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Course Not Found</h3>
          <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            The course you're looking for doesn't exist or you don't have access to it.
          </p>
          <div className="mt-6">
            <Link to="/courses">
              <Button variant={isDarkMode ? "dark" : "outline"}>
                Return to Courses
              </Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      {/* Breadcrumb */}
      <nav className={`flex items-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-4`}>
        <Link to="/courses" className={`${isDarkMode ? 'hover:text-gray-300' : 'hover:text-gray-700'}`}>
          Courses
        </Link>
        <ChevronRight className="h-4 w-4 mx-1" />
        <span className={`${isDarkMode ? 'text-gray-200 font-medium' : 'text-gray-900 font-medium'}`}>{course.title}</span>
      </nav>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Enrolled Users Sidebar for Admin/Instructor */}
        {isAdminOrInstructor && (
          <div className="md:w-1/4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Enrolled Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingUsers ? (
                  <div className="animate-pulse space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className={`h-6 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded`}></div>
                    ))}
                  </div>
                ) : usersError ? (
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>{usersError}</p>
                ) : enrolledUsers.length === 0 ? (
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>No users enrolled yet.</p>
                ) : (
                  <div className="space-y-4">
                    {/* Instructors List */}
                    {enrolledUsers.filter(user => user.enrollment_role === 'instructor').length > 0 && (
                      <div>
                        <h3 className={`font-medium text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>Instructors</h3>
                        <ul className="space-y-2">
                          {enrolledUsers
                            .filter(user => user.enrollment_role === 'instructor')
                            .map(user => (
                              <li key={user.id} className={`flex items-center text-sm ${isDarkMode ? 'text-gray-300' : ''}`}>
                                <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                                {user.first_name} {user.last_name}
                              </li>
                            ))
                          }
                        </ul>
                      </div>
                    )}
                    
                    {/* Students List */}
                    {enrolledUsers.filter(user => user.enrollment_role === 'student').length > 0 && (
                      <div>
                        <h3 className={`font-medium text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>Students</h3>
                        <ul className="space-y-2">
                          {enrolledUsers
                            .filter(user => user.enrollment_role === 'student')
                            .map(user => (
                              <li key={user.id} className={`flex items-center text-sm ${isDarkMode ? 'text-gray-300' : ''}`}>
                                <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                                {user.first_name} {user.last_name}
                              </li>
                            ))
                          }
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Main Course Content */}
        <div className={isAdminOrInstructor ? "md:w-3/4" : "w-full"}>
          {/* Course Header */}
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm rounded-lg p-6 mb-8`}>
            <div className="sm:flex sm:items-center sm:justify-between">
              <div>
                <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{course.title}</h1>
                {course.instructorName && (
                  <div className={`flex items-center mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <User className="h-4 w-4 mr-1" />
                    <span>Instructor: {course.instructorName}</span>
                  </div>
                )}
              </div>
              
              <div className="mt-4 sm:mt-0 flex items-center space-x-3">
                {hasRole('instructor') && (
                  <Link to={`/courses/${courseId}/posts/create`}>
                    <Button variant={isDarkMode ? "dark" : "primary"}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create Post
                    </Button>
                  </Link>
                )}
                
                {hasRole('admin') && (
                  <Button variant="destructive" onClick={handleDeleteCourse}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Course
                  </Button>
                )}
              </div>
            </div>
            
            <div className="mt-6">
              <h2 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'} mb-2`}>Description</h2>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} whitespace-pre-line`}>
                {course.description || 'No description available.'}
              </p>
            </div>
          </div>
          
          {/* Course Content Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Course Content</h2>
              {hasRole('instructor') && (
                <Link to={`/courses/${courseId}/posts/create`}>
                  <Button variant={isDarkMode ? "dark" : "outline"} size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Content
                  </Button>
                </Link>
              )}
            </div>
            
            {isLoadingPosts ? (
              <div className="grid grid-cols-1 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`animate-pulse ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm h-32`}></div>
                ))}
              </div>
            ) : postsError ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Unable to Load Content</h3>
                  <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {postsError}
                  </p>
                </CardContent>
              </Card>
            ) : posts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>No content yet</h3>
                  <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {hasRole('instructor')
                      ? "Start creating content for this course."
                      : "The instructor hasn't added any content yet."}
                  </p>
                  {hasRole('instructor') && (
                    <div className="mt-6">
                      <Link to={`/courses/${courseId}/posts/create`}>
                        <Button variant={isDarkMode ? "dark" : "primary"}>
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Create First Post
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} courseId={courseId} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CourseDetailPage;