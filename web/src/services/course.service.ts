import api from './api';
import { Course, CreateCourseRequest, Post } from '../types';

export const CourseService = {
  getAllCourses: async (): Promise<Course[]> => {
    try {
      const response = await api.get('/courses');
      
      // Handle different response formats
      if (response.data && response.data.data && Array.isArray(response.data.data.courses)) {
        return response.data.data.courses;
      } else if (response.data && Array.isArray(response.data.courses)) {
        return response.data.courses;
      } else if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
      
      console.warn('Unexpected course response format', response.data);
      return [];
    } catch (error: any) {
      console.error('Error fetching courses:', error.response?.data || error.message);
      throw error;
    }
  },

  getCourseById: async (id: string): Promise<Course> => {
    try {
      const response = await api.get(`/courses/${id}`);
      
      // Handle different response formats
      if (response.data && response.data.data) {
        return response.data.data;
      }
      
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching course ${id}:`, error.response?.data || error.message);
      throw error;
    }
  },

  createCourse: async (data: CreateCourseRequest): Promise<Course> => {
    try {
      const response = await api.post('/courses/create', data);
      
      // Handle different response formats
      if (response.data && response.data.data) {
        return response.data.data;
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error creating course:', error.response?.data || error.message);
      throw error;
    }
  },

  getCoursePosts: async (courseId: string): Promise<Post[]> => {
    try {
      const response = await api.get(`/posts/course/${courseId}`);
      
      // Handle different response formats
      if (response.data && response.data.data && Array.isArray(response.data.data.posts)) {
        return response.data.data.posts;
      } else if (response.data && Array.isArray(response.data.posts)) {
        return response.data.posts;
      } else if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
      
      console.warn('Unexpected posts response format', response.data);
      return [];
    } catch (error: any) {
      console.error(`Error fetching posts for course ${courseId}:`, error.response?.data || error.message);
      throw error;
    }
  },

  getInstructorCourses: async (): Promise<Course[]> => {
    try {
      const response = await api.get('/courses/instructor');
      
      // Handle different response formats
      if (response.data && response.data.data && Array.isArray(response.data.data.courses)) {
        return response.data.data.courses;
      } else if (response.data && Array.isArray(response.data.courses)) {
        return response.data.courses;
      } else if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
      
      console.warn('Unexpected instructor courses response format', response.data);
      return [];
    } catch (error: any) {
      console.error('Error fetching instructor courses:', error);
      // Return empty array instead of throwing
      return [];
    }
  },

  getEnrolledCourses: async (): Promise<Course[]> => {
    try {
      const response = await api.get('/courses/enrolled');
      
      // Handle different response formats
      if (response.data && response.data.courses && Array.isArray(response.data.courses)) {
        return response.data.courses;
      } else if (response.data && response.data.data && Array.isArray(response.data.data.courses)) {
        return response.data.data.courses;
      } else if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
      
      // If no valid data format is found, return empty array
      console.warn('Unexpected enrolled courses response format', response.data);
      return [];
    } catch (error: any) {
      console.error('Error fetching enrolled courses:', error.response?.data || error.message);
      // Return empty array instead of throwing an error
      return [];
    }
  },

  deleteCourse: async (courseId: string): Promise<boolean> => {
    try {
      await api.delete(`/courses/${courseId}`);
      return true;
    } catch (error: any) {
      console.error(`Error deleting course ${courseId}:`, error.response?.data || error.message);
      throw error;
    }
  },

  getEnrolledUsers: async (courseId: string): Promise<any[]> => {
    try {
      const response = await api.get(`/courses/${courseId}/users`);
      
      // Handle different response formats
      if (response.data && response.data.data && Array.isArray(response.data.data.users)) {
        return response.data.data.users;
      } else if (response.data && Array.isArray(response.data.users)) {
        return response.data.users;
      } else if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
      
      console.warn('Unexpected enrolled users response format', response.data);
      return [];
    } catch (error: any) {
      console.error(`Error fetching enrolled users for course ${courseId}:`, error.response?.data || error.message);
      throw error;
    }
  }
};

export default CourseService;