import React from 'react';
import { Post } from '../../types';
import PostMetadata from './PostMetadata';
import { useTheme } from '../../context/ThemeContext';

interface PostContentProps {
  post: Post;
}

const PostContent: React.FC<PostContentProps> = ({ post }) => {
  const { isDarkMode } = useTheme();
  
  return (
    <>
      <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'} mb-2`}>{post.title}</h1>
      
      <PostMetadata post={post} />
      
      <div className={`prose max-w-none ${isDarkMode ? 'text-gray-300' : ''}`}>
        <p className="whitespace-pre-line">{post.content}</p>
      </div>
    </>
  );
};

export default PostContent; 