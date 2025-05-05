import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Download, File, FileText, Upload, Users, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import MainLayoutWrapper from '../../components/layout/MainLayoutWrapper';
import Button from '../../components/ui/Button';
import FileUpload from '../../components/ui/FileUpload';
import { Card, CardContent } from '../../components/ui/Card';
import PostService from '../../services/post.service';
import api from '../../services/api';
import { Post, File as PostFile } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'react-hot-toast';
import PostContent from '../../components/posts/PostContent';
import StudentSubmissionHistory from '../../components/posts/StudentSubmissionHistory';

// Add this new helper function before the PostDetailPage component
const getFullFileUrl = (url: string): string => {
  // If the URL is already absolute, return it
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Otherwise, prepend the API base URL
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return `${apiBaseUrl}${url}`;
};

interface Submission {
  id: string;
  file_name: string;
  file_url: string;
  created_at: string;
  student: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

const PostDetailPage: React.FC = () => {
  const { courseId, postId } = useParams<{ courseId: string; postId: string }>();
  const { hasRole, user } = useAuth();
  const { isDarkMode } = useTheme();
  const [post, setPost] = useState<Post | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [mySubmissions, setMySubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [isLoadingMySubmissions, setIsLoadingMySubmissions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const isInstructor = hasRole(['instructor', 'admin']);
  const isStudent = hasRole('student');
  
  useEffect(() => {
    let isMounted = true;
    const fetchPost = async () => {
      if (!courseId || !postId) return;
      
      setIsLoading(true);
      try {
        // Fetch the specific post by ID
        const fetchedPost = await PostService.getPostById(postId);
        if (!isMounted) return;
        setPost(fetchedPost);
        
        // If user is instructor or admin, fetch submissions
        if (isInstructor && fetchedPost.allow_submissions) {
          setIsLoadingSubmissions(true);
          try {
            const fetchedSubmissions = await PostService.getSubmissions(postId);
            if (!isMounted) return;
            setSubmissions(fetchedSubmissions);
          } catch (error) {
            console.error('Error fetching submissions:', error);
            if (isMounted) toast.error('Failed to load student submissions');
          } finally {
            if (isMounted) setIsLoadingSubmissions(false);
          }
        }
        
        // If user is a student, fetch their own submissions
        if (isStudent && fetchedPost.allow_submissions) {
          setIsLoadingMySubmissions(true);
          try {
            const fetchedMySubmissions = await PostService.getMySubmissions(postId);
            if (!isMounted) return;
            setMySubmissions(fetchedMySubmissions);
          } catch (error) {
            console.error('Error fetching your submissions:', error);
            // Don't show error toast for this to keep the UI clean
          } finally {
            if (isMounted) setIsLoadingMySubmissions(false);
          }
        }
      } catch (error) {
        console.error('Error fetching post:', error);
        if (isMounted) toast.error('Failed to load post details');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    
    fetchPost();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [courseId, postId, hasRole, isInstructor, isStudent]);
  
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };
  
  const handleSubmitAssignment = async () => {
    if (!postId || !selectedFile) return;
    
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      await PostService.submitAssignment(postId, formData);
      toast.success('Assignment submitted successfully!');
      setSelectedFile(null);
      
      // Refresh student's own submissions
      if (isStudent) {
        try {
          // Skip cache for this request to get fresh data
          api.clearCacheFor(`/posts/${postId}/submissions/my`);
          const updatedSubmissions = await PostService.getMySubmissions(postId);
          setMySubmissions(updatedSubmissions);
        } catch (error) {
          console.error('Error refreshing your submissions:', error);
        }
      }
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast.error('Failed to submit assignment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!courseId || !postId) {
    return (
      <MainLayoutWrapper>
        <div className="text-center py-12">
          <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Invalid URL</h3>
          <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            The course or post ID is missing.
          </p>
          <div className="mt-6">
            <Link to="/courses">
              <Button variant={isDarkMode ? "dark" : "outline"}>
                Return to Courses
              </Button>
            </Link>
          </div>
        </div>
      </MainLayoutWrapper>
    );
  }
  
  if (isLoading) {
    return (
      <MainLayoutWrapper>
        <div className="animate-pulse">
          <div className={`h-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded w-1/4 mb-4`}></div>
          <div className={`h-8 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded w-2/4 mb-2`}></div>
          <div className={`h-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded w-1/4 mb-6`}></div>
          <div className={`h-32 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded mb-4`}></div>
          <div className={`h-24 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded mb-4`}></div>
        </div>
      </MainLayoutWrapper>
    );
  }
  
  if (!post) {
    return (
      <MainLayoutWrapper>
        <div className="text-center py-12">
          <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Post Not Found</h3>
          <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            The post you're looking for doesn't exist or you don't have access to it.
          </p>
          <div className="mt-6">
            <Link to={`/courses/${courseId}`}>
              <Button variant={isDarkMode ? "dark" : "outline"}>
                Return to Course
              </Button>
            </Link>
          </div>
        </div>
      </MainLayoutWrapper>
    );
  }
  
  return (
    <MainLayoutWrapper>
      {/* Breadcrumb */}
      <nav className={`flex items-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-4`}>
        <Link to={`/courses/${courseId}`} className={`flex items-center ${isDarkMode ? 'hover:text-gray-300' : 'hover:text-gray-700'}`}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Course
        </Link>
      </nav>
      
      {/* Post Header */}
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm rounded-lg p-6 mb-6`}>
        <PostContent post={post} />
      </div>
      
      {/* Attachments Section */}
      {post.files && post.files.length > 0 && (
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm rounded-lg p-6 mb-6`}>
          <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} mb-4`}>Attachments</h2>
          
          <div className="space-y-3">
            {post.files.map((file: PostFile) => (
              <div 
                key={file.id}
                className={`flex items-center p-3 ${isDarkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'} border rounded-md`}
              >
                <div className={`p-2 ${isDarkMode ? 'bg-blue-900' : 'bg-blue-100'} rounded mr-3`}>
                  <FileText className={`h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'} truncate`}>
                    {file.name}
                  </p>
                </div>
                <a 
                  href={getFullFileUrl(file.url)}
                  download={file.name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`ml-4 flex-shrink-0 ${isDarkMode ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700'} text-white px-3 py-2 rounded-md flex items-center`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toast.success(`Downloading ${file.name}...`);
                  }}
                >
                  <Download className="h-4 w-4 mr-1" />
                  <span>Download</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Student Submissions Section - Only for instructors/admins */}
      {isInstructor && post.allow_submissions && (
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm rounded-lg p-6 mb-6`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Student Submissions</h2>
              <div className={`ml-2 ${isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'} text-xs font-medium px-2.5 py-0.5 rounded-full`}>
                {submissions.length}
              </div>
            </div>
            <div className={`flex items-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <Users className="h-4 w-4 mr-1" />
              <span>Total: {submissions.length} submission{submissions.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
          
          {isLoadingSubmissions ? (
            <div className="flex justify-center items-center py-12">
              <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isDarkMode ? 'border-blue-400' : 'border-blue-500'}`}></div>
            </div>
          ) : submissions.length === 0 ? (
            <div className={`text-center py-12 ${isDarkMode ? 'border-gray-700' : 'border-gray-100'} border rounded-lg`}>
              <ShieldAlert className={`h-12 w-12 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'} mx-auto mb-4`} />
              <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'} mb-1`}>No Submissions Yet</h3>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>
                Students haven't submitted any files for this post yet.
              </p>
            </div>
          ) : (
            <div className={`${isDarkMode ? 'border-gray-700' : 'border-gray-200'} border rounded-lg`}>
              <div className={`p-3 ${isDarkMode ? 'bg-gray-700 border-gray-700' : 'bg-gray-50 border-gray-200'} border-b flex justify-between items-center`}>
                <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Student</div>
                <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Submission Date</div>
              </div>
              
              <div className="max-h-80 overflow-y-auto">
                {submissions.map((submission) => (
                  <div 
                    key={submission.id}
                    className={`p-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} border-b last:border-b-0`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className={`h-8 w-8 rounded-full ${isDarkMode ? 'bg-blue-900 text-blue-400' : 'bg-blue-100 text-blue-600'} flex items-center justify-center mr-3`}>
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : ''}`}>
                            {submission.student.first_name} {submission.student.last_name}
                          </h4>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{submission.student.email}</p>
                        </div>
                      </div>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {format(new Date(submission.created_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    
                    <div className={`flex items-center justify-between p-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-md`}>
                      <div className="flex items-center">
                        <FileText className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mr-2`} />
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {submission.file_name}
                        </span>
                      </div>
                      <a 
                        href={getFullFileUrl(submission.file_url)}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${isDarkMode ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700'} text-white px-3 py-1 text-sm rounded-md flex items-center`}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        <span>Download</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
              
              {submissions.length > 5 && (
                <div className={`p-3 ${isDarkMode ? 'bg-gray-700 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'} border-t text-center text-xs`}>
                  Scroll to see all {submissions.length} submissions
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Assignment Submission (only for students and when allowed) */}
      {isStudent && post && post.allow_submissions && (
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm rounded-lg p-6`}>
          <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} mb-4`}>Submit Your Work</h2>
          
          <Card>
            <CardContent className="p-4">
              <FileUpload
                onFileSelect={handleFileSelect}
                label="Upload your work (PDF, DOC, DOCX, etc.)"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip,.rar,.jpg,.jpeg,.png"
                maxSize={10}
              />
              
              {selectedFile && (
                <div className="mt-4">
                  <Button 
                    onClick={handleSubmitAssignment}
                    isLoading={isSubmitting}
                    disabled={isSubmitting}
                    variant={isDarkMode ? "dark" : "primary"}
                  >
                    Submit Work
                  </Button>
                </div>
              )}
              
              <p className={`mt-3 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Your submission will be visible only to course instructors and administrators.
              </p>
              
              {/* Student Submission History */}
              <StudentSubmissionHistory 
                submissions={mySubmissions}
                isLoading={isLoadingMySubmissions}
                getFullFileUrl={getFullFileUrl}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </MainLayoutWrapper>
  );
};

export default PostDetailPage;