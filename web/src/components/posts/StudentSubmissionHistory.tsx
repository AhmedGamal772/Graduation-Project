import React from 'react';
import { format } from 'date-fns';
import { FileText, Download, Clock } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface StudentSubmission {
  id: string;
  file_name: string;
  file_url: string;
  created_at: string;
}

interface StudentSubmissionHistoryProps {
  submissions: StudentSubmission[];
  isLoading: boolean;
  getFullFileUrl: (url: string) => string;
}

const StudentSubmissionHistory: React.FC<StudentSubmissionHistoryProps> = ({ 
  submissions, 
  isLoading,
  getFullFileUrl 
}) => {
  const { isDarkMode } = useTheme();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-4">
        <div className={`animate-spin rounded-full h-6 w-6 border-b-2 ${isDarkMode ? 'border-blue-400' : 'border-blue-500'}`}></div>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} italic py-2`}>
        You haven't made any submissions yet.
      </div>
    );
  }

  return (
    <div className={`border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} rounded-lg mt-4`}>
      <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} px-4 py-2 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} flex items-center`}>
          <Clock className={`h-4 w-4 mr-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          Your Previous Submissions
          <span className={`ml-2 ${isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'} text-xs font-medium px-2.5 py-0.5 rounded-full`}>
            {submissions.length}
          </span>
        </h3>
      </div>
      
      <div className="max-h-60 overflow-y-auto">
        {submissions.map((submission) => (
          <div key={submission.id} className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} last:border-b-0`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <FileText className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} font-medium truncate max-w-[200px]`}>
                  {submission.file_name}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {format(new Date(submission.created_at), 'MMM d, yyyy h:mm a')}
                </span>
                
                <a 
                  href={getFullFileUrl(submission.file_url)}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} text-xs px-2 py-1 rounded flex items-center`}
                >
                  <Download className="h-3 w-3 mr-1" />
                  <span>Download</span>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {submissions.length > 3 && (
        <div className={`px-4 py-2 ${isDarkMode ? 'bg-gray-700 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'} border-t text-xs text-center`}>
          Scroll to see all {submissions.length} submissions
        </div>
      )}
    </div>
  );
};

export default StudentSubmissionHistory; 