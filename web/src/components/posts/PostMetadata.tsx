import React from 'react';
import { User, Calendar, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { Post } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface PostMetadataProps {
  post: Post;
}

const PostMetadata: React.FC<PostMetadataProps> = ({ post }) => {
  const { isDarkMode } = useTheme();
  const authorName = post.author_name || (post.author && post.author.first_name) || '';
  const authorLastName = post.author_last_name || (post.author && post.author.last_name) || '';
  
  return (
    <div className={`flex flex-wrap gap-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-6`}>
      <div className="flex items-center">
        <User className="h-4 w-4 mr-1" />
        <span>By: {authorName} {authorLastName}</span>
      </div>
      
      <div className="flex items-center">
        <Calendar className="h-4 w-4 mr-1" />
        <span>Posted: {format(new Date(post.created_at), 'MMM d, yyyy')}</span>
      </div>
      
      {post.allow_submissions && (
        <div className={`flex items-center ${isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'} px-2 py-0.5 rounded-full text-xs font-medium`}>
          <Upload className="h-3 w-3 mr-1" />
          <span>Accepts Submissions</span>
        </div>
      )}
    </div>
  );
};

export default PostMetadata; 