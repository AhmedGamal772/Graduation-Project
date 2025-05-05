import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import PostForm from '../../components/posts/PostForm';
import PostService from '../../services/post.service';
import { Post } from '../../types';
import { toast } from 'react-hot-toast';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/ui/Button';

const CreatePostPage: React.FC = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isDarkMode } = useTheme();
  
  if (!courseId) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Invalid Course ID</h3>
          <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Please select a course to create a post for.
          </p>
          <div className="mt-6">
            <Link to="/courses">
              <Button variant={isDarkMode ? "dark" : "primary"}>
                View Courses
              </Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  const handleSubmit = async (values: Partial<Post>, file?: File) => {
    // Set loading state
    setIsSubmitting(true);
    
    try {
      // Create the post
      await PostService.createPost({
        course_id: courseId,
        title: values.title || '',
        content: values.content || '',
        link_url: values.link_url,
        allow_submissions: values.allow_submissions
      }, file);
      
      // Show success message
      toast.success('Post created successfully!');
      
      // Reset loading state
      setIsSubmitting(false);
      
      // Navigate to course page
      setTimeout(() => {
        navigate(`/courses/${courseId}`);
      }, 500);
    } catch (error) {
      // Log error
      console.error('Error creating post:', error);
      
      // Show error message
      toast.error('Failed to create post. Please try again.');
      
      // Reset loading state
      setIsSubmitting(false);
    }
  };
  
  return (
    <MainLayout>
      {/* Breadcrumb */}
      <nav className={`flex items-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-4`}>
        <Link to={`/courses/${courseId}`} className={`flex items-center ${isDarkMode ? 'hover:text-gray-300' : 'hover:text-gray-700'}`}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Course
        </Link>
      </nav>
      
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm rounded-lg p-6`}>
        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'} mb-6`}>Create New Post</h1>
        <PostForm 
          courseId={courseId}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
          isDarkMode={isDarkMode}
        />
      </div>
    </MainLayout>
  );
};

export default CreatePostPage;