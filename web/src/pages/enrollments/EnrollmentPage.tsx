import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import EnrollmentForm from '../../components/enrollment/EnrollmentForm';
import { toast } from 'react-hot-toast';
import EnrollmentService from '../../services/enrollment.service';
import CourseService from '../../services/course.service';
import { Course } from '../../types';
import { useTheme } from '../../context/ThemeContext';

const EnrollmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'student' | 'instructor'>('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const courseSelect = React.useRef<HTMLSelectElement>(null);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const courses = await CourseService.getAllCourses();
        setCourses(courses);
      } catch (error) {
        console.error('Error fetching courses:', error);
        toast.error('Failed to load courses');
      }
    };

    fetchCourses();
  }, []);

  const handleEnrollUsers = async (courseId: string, userIds: string[]) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Validate the input data
      if (!courseId || !userIds.length) {
        setError('Course and at least one user must be selected');
        return;
      }
      
      // Ensure we have valid numbers before proceeding
      const courseIdNum = parseInt(courseId);
      const userIdNums = userIds.map(id => parseInt(id));
      
      if (isNaN(courseIdNum) || userIdNums.some(id => isNaN(id))) {
        setError('Invalid course ID or user ID');
        return;
      }
      
      console.log('Enrolling users:', {
        course: courseIdNum,
        users: userIdNums,
        role: selectedRole
      });
      
      if (selectedRole === 'student') {
        if (userIds.length === 1) {
          await EnrollmentService.enrollStudentAsAdmin({
            courseId: courseIdNum,
            userId: userIdNums[0]
          });
        } else {
          await EnrollmentService.enrollUsersBulk({
            courseId: courseIdNum,
            userIds: userIdNums,
            role: 'student'
          });
        }
      } else {
        if (userIds.length === 1) {
          await EnrollmentService.enrollInstructorAsAdmin({
            courseId: courseIdNum,
            userId: userIdNums[0]
          });
        } else {
          await EnrollmentService.enrollUsersBulk({
            courseId: courseIdNum,
            userIds: userIdNums,
            role: 'instructor'
          });
        }
      }
      
      setSuccess(`Successfully enrolled ${userIds.length} ${selectedRole}(s)`);
      toast.success(`Successfully enrolled ${userIds.length} ${selectedRole}(s)`);
      
      // No need to call fetchAvailableUsers as the EnrollmentForm will handle this via useEffect
    } catch (error: any) {
      console.error('Error enrolling users:', error);
      // Provide more specific error message if available
      let errorMessage = 'Failed to enroll users. Please check server logs.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseChange = (courseId: string) => {
    setSelectedCourse(courseId);
    setError(null);
    setSuccess(null);
  };

  const handleRoleChange = (role: 'student' | 'instructor') => {
    setSelectedRole(role);
    setError(null);
    setSuccess(null);
  };
  
  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Enroll Users</h1>
        <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Add users to courses by selecting a course and the users you want to enroll.
        </p>
      </div>
      
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm rounded-lg p-6`}>
        {error && (
          <div className={`mb-4 p-3 ${isDarkMode ? 'bg-red-900 border-red-800 text-red-300' : 'bg-red-50 border border-red-200 text-red-700'} rounded-md`}>
            {error}
          </div>
        )}
        
        {success && (
          <div className={`mb-4 p-3 ${isDarkMode ? 'bg-green-900 border-green-800 text-green-300' : 'bg-green-50 border border-green-200 text-green-700'} rounded-md`}>
            {success}
          </div>
        )}
        
        <div className="mb-6">
          <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
            Select Course
          </label>
          <select
            ref={courseSelect}
            value={selectedCourse}
            onChange={(e) => handleCourseChange(e.target.value)}
            className={`w-full rounded-md ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500 focus:ring-blue-500' 
                : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
            }`}
          >
            <option value="">Select a course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
            Select Role
          </label>
          <select
            value={selectedRole}
            onChange={(e) => handleRoleChange(e.target.value as 'student' | 'instructor')}
            className={`w-full rounded-md ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500 focus:ring-blue-500' 
                : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
            }`}
          >
            <option value="student">Student</option>
            <option value="instructor">Instructor</option>
          </select>
        </div>

        {selectedCourse && (
          <EnrollmentForm 
            onSubmit={handleEnrollUsers}
            isLoading={loading}
            courseId={selectedCourse}
            role={selectedRole}
            externalError={error}
            externalSuccess={success}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default EnrollmentPage;