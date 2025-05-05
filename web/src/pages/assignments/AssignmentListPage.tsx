import React, { useEffect, useState, useCallback } from 'react';
import { BookOpen, FileText, Search, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import MainLayout from '../../components/layout/MainLayout';
import Button from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import CourseService from '../../services/course.service';
import PostService from '../../services/post.service';
import { Course, Post } from '../../types';
import { toast } from 'react-hot-toast';
import { useTheme } from '../../context/ThemeContext';
import SubmissionHistorySection from '../../components/posts/SubmissionHistorySection';

// Simplified Assignment type for UI purposes
interface Assignment {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  dueDate: string | null;
  createdAt: string;
  isSubmitted?: boolean;
}

const AssignmentListPage: React.FC = () => {
  const { hasRole } = useAuth();
  const { isDarkMode } = useTheme();
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Memoize the fetchAssignments function to avoid recreating it on each render
  const fetchAssignments = useCallback(async () => {
    setIsLoading(true);
    
    try {
      let fetchedCourses: Course[] = [];
      const allAssignments: Assignment[] = [];
      
      // Fetch courses based on user role
      if (hasRole('admin')) {
        fetchedCourses = await CourseService.getAllCourses();
      } else if (hasRole('instructor')) {
        fetchedCourses = await CourseService.getInstructorCourses();
      } else {
        fetchedCourses = await CourseService.getEnrolledCourses();
      }
      
      setCourses(fetchedCourses);
      
      // For each course, fetch posts and transform to assignments
      for (const course of fetchedCourses) {
        let posts: Post[] = [];
        
        if (hasRole('instructor')) {
          posts = await PostService.getInstructorCoursePosts(course.id);
        } else {
          posts = await PostService.getCoursePosts(course.id);
        }
        
        // Transform posts to assignments
        const courseAssignments = posts.map(post => ({
          id: post.id,
          title: post.title,
          courseId: course.id,
          courseName: course.title,
          dueDate: null, // This would come from API in a real app
          createdAt: post.created_at,
          isSubmitted: false // This would come from API in a real app
        }));
        
        allAssignments.push(...courseAssignments);
      }
      
      // Sort by most recent
      const sortedAssignments = allAssignments.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setAssignments(sortedAssignments);
      setFilteredAssignments(sortedAssignments);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  }, [hasRole]);

  // Initial fetch of assignments
  useEffect(() => {
    if (isInitialLoad) {
      fetchAssignments();
    }
  }, [fetchAssignments, isInitialLoad]);

  useEffect(() => {
    let result = assignments;
    
    // Apply course filter
    if (selectedCourse) {
      result = result.filter(assignment => assignment.courseId === selectedCourse);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        assignment => 
          assignment.title.toLowerCase().includes(query) ||
          assignment.courseName.toLowerCase().includes(query)
      );
    }
    
    setFilteredAssignments(result);
  }, [assignments, searchQuery, selectedCourse]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleCourseFilter = (courseId: string | null) => {
    setSelectedCourse(courseId);
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
          {hasRole('student') ? 'My Assignments' : 'Course Posts'}
        </h1>
        <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {hasRole('student') 
            ? "Access and submit your assignments for all enrolled courses." 
            : "Manage and create posts and assignments for your courses."}
        </p>
      </div>
      
      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleCourseFilter(null)}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              selectedCourse === null
                ? isDarkMode 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-blue-500 text-white'
                : isDarkMode 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            All Courses
          </button>
          
          {courses.map(course => (
            <button
              key={course.id}
              onClick={() => handleCourseFilter(course.id)}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                selectedCourse === course.id
                  ? isDarkMode 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-blue-500 text-white'
                  : isDarkMode 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              {course.title}
            </button>
          ))}
        </div>
        
        <div className="relative w-full md:w-64">
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
            placeholder="Search assignments..."
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
      </div>
      
      {/* Assignments List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`animate-pulse ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm h-24`}></div>
          ))}
        </div>
      ) : filteredAssignments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>No posts found</h3>
            <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {searchQuery 
                ? "No posts match your search query."
                : selectedCourse 
                  ? "No posts available for the selected course."
                  : "No posts available yet."}
            </p>
            
            {hasRole('instructor') && (
              <div className="mt-6">
                {selectedCourse ? (
                  <Link to={`/courses/${selectedCourse}/posts/create`}>
                    <Button variant={isDarkMode ? "dark" : "primary"}>Create Post</Button>
                  </Link>
                ) : courses.length > 0 ? (
                  <Link to={`/courses/${courses[0].id}/posts/create`}>
                    <Button variant={isDarkMode ? "dark" : "primary"}>Create Post</Button>
                  </Link>
                ) : (
                  <Link to="/courses/create">
                    <Button variant={isDarkMode ? "dark" : "primary"}>Create Course First</Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAssignments.map(assignment => (
            <Link
              key={assignment.id}
              to={`/courses/${assignment.courseId}/posts/${assignment.id}`}
              className="block"
            >
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm rounded-lg overflow-hidden hover:shadow-md transition-shadow border-l-4 ${isDarkMode ? 'border-blue-700' : 'border-blue-500'}`}>
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{assignment.title}</h3>
                      <div className={`flex items-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                        <BookOpen className="h-4 w-4 mr-1" />
                        <span>{assignment.courseName}</span>
                      </div>
                    </div>
                    
                    {assignment.isSubmitted && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'
                      }`}>
                        Submitted
                      </span>
                    )}
                    
                    {assignment.dueDate && (
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} flex items-center`}>
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>Due: {format(new Date(assignment.dueDate), 'MMM d, yyyy')}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-2 flex justify-between items-center">
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <Calendar className="inline-block h-4 w-4 mr-1" />
                      <span>Posted: {format(new Date(assignment.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                    <div className={`${isDarkMode ? 'text-blue-400' : 'text-blue-600'} font-medium text-sm`}>
                      View details →
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      
      {/* Submission History Section (for students only) */}
      {hasRole('student') && (
        <SubmissionHistorySection 
          assignments={assignments}
          key={`submissions-${assignments.length}`} 
        />
      )}
    </MainLayout>
  );
};

export default AssignmentListPage;