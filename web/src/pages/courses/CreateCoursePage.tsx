import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import CourseForm from '../../components/courses/CourseForm';
import CourseService from '../../services/course.service';
import { Course } from '../../types';
import { toast } from 'react-hot-toast';
import { useTheme } from '../../context/ThemeContext';

const CreateCoursePage: React.FC = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (values: Partial<Course>) => {
    setIsSubmitting(true);
    try {
      const newCourse = await CourseService.createCourse(values);
      toast.success('Course created successfully!');
      navigate(`/courses/${newCourse.id}`);
    } catch (error) {
      console.error('Error creating course:', error);
      toast.error('Failed to create course. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <MainLayout>
      {/* Breadcrumb */}
      <nav className={`flex items-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-4`}>
        <Link to="/courses" className={`flex items-center ${isDarkMode ? 'hover:text-gray-300' : 'hover:text-gray-700'}`}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Courses
        </Link>
      </nav>
      
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm rounded-lg p-6`}>
        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'} mb-6`}>Create New Course</h1>
        <CourseForm onSubmit={handleSubmit} isLoading={isSubmitting} isDarkMode={isDarkMode} />
      </div>
    </MainLayout>
  );
};

export default CreateCoursePage;