import api from './api';
import { Post, CreatePostRequest } from '../types';

export const PostService = {
  createPost: async (data: CreatePostRequest, file?: File): Promise<Post> => {
    const formData = new FormData();
    formData.append('course_id', data.course_id);
    formData.append('title', data.title);
    formData.append('content', data.content);
    if (data.link_url) formData.append('link_url', data.link_url);
    if (file) formData.append('file', file);
    
    // Append allow_submissions as a string "true" or "false"
    formData.append('allow_submissions', data.allow_submissions ? 'true' : 'false');

    const response = await api.post<Post>('/posts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  togglePinPost: async (postId: string): Promise<{ is_pinned: boolean }> => {
    const response = await api.patch<{ is_pinned: boolean }>(`/posts/${postId}/pin`);
    return response.data;
  },

  getCoursePosts: async (courseId: string): Promise<Post[]> => {
    const response = await api.get<Post[]>(`/posts/course/${courseId}`);
    return response.data;
  },
  
  // Add method for instructor course posts - this uses the same endpoint as getCoursePosts
  // since backend doesn't have a separate endpoint but permissions are handled server-side
  getInstructorCoursePosts: async (courseId: string): Promise<Post[]> => {
    const response = await api.get<Post[]>(`/posts/course/${courseId}`);
    return response.data;
  },

  getPostById: async (postId: string): Promise<Post> => {
    const response = await api.get<Post>(`/posts/${postId}`);
    return response.data;
  },
  
  submitAssignment: async (postId: string, formData: FormData): Promise<any> => {
    const response = await api.post(`/posts/${postId}/submissions`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    // Clear cache for submissions after new submission
    api.clearCacheFor(`/posts/${postId}/submissions/my`);
    
    return response.data;
  },
  
  getSubmissions: async (postId: string): Promise<any[]> => {
    const response = await api.get(`/posts/${postId}/submissions`);
    return response.data;
  },
  
  getMySubmissions: async (postId: string): Promise<any[]> => {
    const response = await api.get(`/posts/${postId}/submissions/my`);
    return response.data;
  },
  
  // New batch method to get submissions for multiple assignments at once
  getMySubmissionsBatch: async (postIds: string[]): Promise<Record<string, any[]>> => {
    if (!postIds.length) return {};
    
    // Create an object to hold the results
    const results: Record<string, any[]> = {};
    
    // Use Promise.all to run requests in parallel
    const submissions = await Promise.all(
      postIds.map(postId => PostService.getMySubmissions(postId))
    );
    
    // Map results to their respective post IDs
    postIds.forEach((postId, index) => {
      results[postId] = submissions[index];
    });
    
    return results;
  },
  
  downloadFile: async (fileUrl: string): Promise<Blob> => {
    const response = await api.get(fileUrl, {
      responseType: 'blob',
    });
    return response.data;
  }
};

export default PostService;