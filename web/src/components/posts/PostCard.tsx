import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/Card';
import { FileText, Calendar, User, Paperclip } from 'lucide-react';
import { Post } from '../../types';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

interface PostCardProps {
  post: Post;
  courseId: string;
}

const PostCard: React.FC<PostCardProps> = ({ post, courseId }) => {
  const { isDarkMode } = useTheme();
  const hasFiles = post.file_url || post.link_url;
  
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };
  
  return (
    <Link to={`/courses/${courseId}/posts/${post.id}`}>
      <Card className={`h-full hover:shadow-lg transition-shadow duration-200 ${isDarkMode ? 'bg-gray-800 border-gray-700' : ''}`}>
        <CardHeader className={isDarkMode ? 'border-gray-700' : ''}>
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <div className={`flex-shrink-0 p-2 ${isDarkMode ? 'bg-purple-900' : 'bg-purple-100'} rounded-lg mr-3`}>
                <FileText className={`h-5 w-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              </div>
              <CardTitle className={isDarkMode ? 'text-gray-200' : ''}>{post.title || (post.content && post.content.substring(0, 50) + (post.content.length > 50 ? '...' : ''))}</CardTitle>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} line-clamp-3`}>
            {post.content}
          </p>
          
          {hasFiles && (
            <div className="mt-4">
              <div className={`flex items-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>
                <Paperclip className={`mr-1.5 h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <span>Attachments</span>
              </div>
              
              <ul className="space-y-1">
                {post.file_url && (
                  <li className={`text-xs ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'} rounded px-2 py-1`}>
                    File attachment
                  </li>
                )}
                {post.link_url && (
                  <li className={`text-xs ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'} rounded px-2 py-1`}>
                    Link attachment
                  </li>
                )}
              </ul>
            </div>
          )}
        </CardContent>
        
        <CardFooter className={`flex items-center justify-between text-sm ${isDarkMode ? 'text-gray-400 border-gray-700' : 'text-gray-500'}`}>
          <div className="flex items-center">
            <User className="h-4 w-4 mr-1.5" />
            <span>By: {post.author_name || post.author_last_name}</span>
          </div>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1.5" />
            <span>{formatDate(post.created_at)}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default PostCard;