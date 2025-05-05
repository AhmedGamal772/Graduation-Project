import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Search, School, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import MainLayout from '../../components/layout/MainLayout';
import CourseCard from '../../components/courses/CourseCard';
import Button from '../../components/ui/Button';
import CourseService from '../../services/course.service';
import { Course } from '../../types';
import { toast } from 'react-hot-toast';

type CourseView = 'all' | 'assigned' | 'enrolled';

const CourseListPage: React.FC = () => {
  const { hasRole } = useAuth();
  const { isDarkMode } = useTheme();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [courseView, setCourseView] = useState<CourseView>('all');
  
  // Fetch courses only once using a proper dependency array
  useEffect(() => {
    let isMounted = true;
    
    const fetchCourses = async () => {
      if (!isMounted) return;
      
      setIsLoading(true);
      try {
        let fetchedCourses: Course[] = [];
        
        if (hasRole('admin')) {
          // Admins see all courses
          fetchedCourses = await CourseService.getAllCourses();
        } else if (hasRole('instructor') && !hasRole('student')) {
          // For instructors (who aren't also students)
          try {
            const instructorCourses = await CourseService.getInstructorCourses();
            fetchedCourses = instructorCourses.map(course => ({
              ...course,
              relationshipType: course.relationshipType || 'assigned'
            }));
          } catch (error) {
            console.error('Error in CourseListPage fetching instructor courses:', error);
            fetchedCourses = [];
          }
        } else {
          // Students just see enrolled courses
          try {
            fetchedCourses = await CourseService.getEnrolledCourses();
          } catch (error) {
            console.error('Error fetching student enrolled courses:', error);
            fetchedCourses = [];
          }
        }
        
        if (isMounted) {
          setCourses(fetchedCourses);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
        if (isMounted) {
          setCourses([]);
          setIsLoading(false);
        }
      }
    };
    
    fetchCourses();
    
    // Cleanup function to prevent state updates after unmounting
    return () => {
      isMounted = false;
    };
  }, [hasRole]); // Only re-run if hasRole changes
  
  // Memoize filtered courses to prevent recalculation on every render
  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      // First apply relationship type filter for instructors
      if (hasRole('instructor') && !hasRole('student') && courseView !== 'all') {
        if (courseView === 'assigned' && course.relationshipType !== 'assigned') {
          return false;
        }
      }
      
      // Then apply search query filter
      if (searchQuery) {
        return (
          course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (course.description && course.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }
      
      return true;
    });
  }, [courses, courseView, searchQuery, hasRole]);
  
  // Memoize search handler to prevent recreation on every render
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);
  
  // Memoize course view change handler
  const handleViewChange = useCallback((view: CourseView) => {
    setCourseView(view);
  }, []);
  
  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
            {hasRole('student') ? 'My Enrolled Courses' : 'Courses'}
          </h1>
          <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {hasRole('admin') && "Manage and create courses for your learning platform."}
            {hasRole('instructor') && "View and manage your assigned and enrolled courses."}
            {hasRole('student') && "Access your enrolled courses and learning materials."}
          </p>
        </div>
        
        {hasRole('admin') && (
          <div className="mt-4 sm:mt-0">
            <Link to="/courses/create">
              <Button variant={isDarkMode ? "dark" : "primary"}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Course
              </Button>
            </Link>
          </div>
        )}
      </div>
      
      {/* Instructor course view tabs - only shown for instructors */}
      {hasRole('instructor') && !hasRole('student') && (
        <div className="mb-6">
          <div className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => handleViewChange('all')}
                className={`${
                  courseView === 'all'
                    ? isDarkMode 
                      ? 'border-blue-500 text-blue-400' 
                      : 'border-indigo-500 text-indigo-600'
                    : isDarkMode 
                      ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <BookOpen className="h-5 w-5 mr-2" />
                All Courses
              </button>
              <button
                onClick={() => handleViewChange('assigned')}
                className={`${
                  courseView === 'assigned'
                    ? isDarkMode 
                      ? 'border-blue-500 text-blue-400' 
                      : 'border-indigo-500 text-indigo-600'
                    : isDarkMode 
                      ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <School className="h-5 w-5 mr-2" />
                Courses I Teach
              </button>
            </nav>
          </div>
        </div>
      )}
      
      {/* Search and filter */}
      <div className="mb-6">
        <div className="flex items-center w-full max-w-md">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className={`h-5 w-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
            <input
              type="text"
              className={`pl-10 block w-full rounded-md ${
                isDarkMode 
                  ? 'border-gray-600 bg-gray-700 text-gray-100 focus:border-blue-500 focus:ring-blue-500' 
                  : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500'
              } py-2 px-3 shadow-sm focus:outline-none sm:text-sm`}
              placeholder="Search courses..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>
      </div>
      
      {/* Courses grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={`animate-pulse ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md h-48`}></div>
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className={`text-center py-12 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm`}>
          <h3 className={`mt-2 text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>No courses found</h3>
          <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {searchQuery 
              ? "No courses match your search query. Try a different search term."
              : hasRole('instructor') && courseView === 'assigned'
                ? "You are not assigned to teach any courses yet."
                : hasRole('student')
                ? "You are not enrolled in any courses yet."
                : "There are no courses available yet."}
          </p>
          {hasRole('admin') && !searchQuery && (
            <div className="mt-6">
              <Link to="/courses/create">
                <Button variant={isDarkMode ? "dark" : "primary"}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Your First Course
                </Button>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <CourseCard 
              key={course.id} 
              course={course} 
              isStudentView={hasRole('student')}
              relationshipType={course.relationshipType}
            />
          ))}
        </div>
      )}
    </MainLayout>
  );
};

export default CourseListPage;