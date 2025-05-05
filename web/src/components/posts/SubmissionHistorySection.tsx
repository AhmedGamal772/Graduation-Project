import React, { useState } from 'react';
import { format } from 'date-fns';
import { File, Download, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import PostService from '../../services/post.service';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'react-hot-toast';

// Interface for submission history
interface Submission {
  id: string;
  file_name: string;
  file_url: string;
  created_at: string;
  post_title?: string;
  course_title?: string;
  course_id?: string;
  post_id?: string;
}

interface Assignment {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
}

interface SubmissionHistorySectionProps {
  assignments: Assignment[];
}

const SubmissionHistorySection: React.FC<SubmissionHistorySectionProps> = ({ assignments }) => {
  const { isDarkMode } = useTheme();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);

  const getFullFileUrl = (url: string): string => {
    if (url.startsWith('http')) return url;
    return `${import.meta.env.VITE_API_URL}${url}`;
  };

  // No useEffect or useCallback to avoid loop issues - just a plain async function
  const loadSubmissions = async () => {
    if (isLoading || assignments.length === 0) return;
    
    setIsLoading(true);
    // Clear submissions while loading to avoid UI flickers
    setSubmissions([]);
    
    try {
      const allSubmissions: Submission[] = [];
      
      // Create a unique list of assignment IDs to fetch
      const uniqueAssignmentIds = Array.from(new Set(assignments.map(a => a.id)));
      
      // Create a lookup map for assignments by ID
      const assignmentsById = assignments.reduce((acc, assignment) => {
        acc[assignment.id] = assignment;
        return acc;
      }, {} as Record<string, Assignment>);
      
      // Use the batch API to fetch all submissions at once
      const submissionsByPostId = await PostService.getMySubmissionsBatch(uniqueAssignmentIds);
      
      // Process all submissions
      Object.entries(submissionsByPostId).forEach(([postId, postSubmissions]) => {
        const assignment = assignmentsById[postId];
        if (assignment) {
          // Enrich with assignment data
          const enrichedSubmissions = postSubmissions.map(sub => ({
            ...sub,
            post_title: assignment.title,
            course_title: assignment.courseName,
            course_id: assignment.courseId,
            post_id: assignment.id
          }));
          
          allSubmissions.push(...enrichedSubmissions);
        }
      });
      
      // Sort by most recent
      const sortedSubmissions = allSubmissions.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setSubmissions(sortedSubmissions);
    } catch (error) {
      console.error('Error loading submission history:', error);
      toast.error('Failed to load submission history');
    } finally {
      setIsLoading(false);
      setHasAttemptedLoad(true);
    }
  };

  // Render-time check to load submissions only once
  if (assignments.length > 0 && !isLoading && !hasAttemptedLoad) {
    // We use setTimeout to defer the loading until after the current render
    setTimeout(() => {
      loadSubmissions();
    }, 0);
  }

  return (
    <div className="mt-12">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className={`text-xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
            My Submission History
          </h2>
          <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Track all your previous assignment submissions.
          </p>
        </div>
        
        <Button 
          variant={isDarkMode ? "dark" : "outline"} 
          onClick={loadSubmissions}
          isLoading={isLoading}
          disabled={isLoading || assignments.length === 0}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={`submission-loading-${i}`} className={`animate-pulse ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm h-20`}></div>
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-center">
            <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>No submissions found</h3>
            <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {hasAttemptedLoad ? "You haven't submitted any assignments yet." : "Loading your submissions..."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm rounded-lg border overflow-hidden`}>
          <div className={`${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} px-4 py-3 border-b`}>
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-4 font-medium text-sm">File</div>
              <div className="col-span-3 font-medium text-sm">Course</div>
              <div className="col-span-3 font-medium text-sm">Assignment</div>
              <div className="col-span-2 font-medium text-sm text-right">Date</div>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {submissions.map(submission => (
              <div 
                key={submission.id} 
                className={`px-4 py-3 ${isDarkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'} border-b last:border-b-0`}
              >
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-4">
                    <div className="flex items-center">
                      <File className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mr-2`} />
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} truncate`}>
                        {submission.file_name}
                      </span>
                    </div>
                  </div>
                  
                  <div className="col-span-3">
                    {submission.course_id && submission.course_title ? (
                      <Link 
                        to={`/courses/${submission.course_id}`} 
                        className={`text-sm ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
                      >
                        {submission.course_title}
                      </Link>
                    ) : (
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>-</span>
                    )}
                  </div>
                  
                  <div className="col-span-3">
                    {submission.post_id && submission.post_title ? (
                      <Link 
                        to={`/courses/${submission.course_id}/posts/${submission.post_id}`} 
                        className={`text-sm ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
                      >
                        {submission.post_title}
                      </Link>
                    ) : (
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>-</span>
                    )}
                  </div>
                  
                  <div className="col-span-2 flex justify-end items-center">
                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mr-2`}>
                      {format(new Date(submission.created_at), 'MMM d, yyyy')}
                    </span>
                    <a 
                      href={getFullFileUrl(submission.file_url)}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${
                        isDarkMode 
                          ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      } p-1 rounded`}
                      title="Download file"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionHistorySection; 