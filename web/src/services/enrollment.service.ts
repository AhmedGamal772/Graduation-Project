import api from './api';

export interface EnrollmentRequest {
  courseId: number;
  userId: number;
}

export interface BulkEnrollmentRequest {
  courseId: number;
  userIds: number[];
  role: 'student' | 'instructor';
}

export interface AvailableUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface EnrollmentStatus {
  isEnrolled: boolean;
  role?: string;
}

export interface StudentCourse {
  id: number;
  title: string;
  description: string;
  instructorId: number;
  instructorName: string;
  createdAt: string;
}

class EnrollmentService {
  // Student methods
  async enrollStudent(courseId: number): Promise<void> {
    try {
      console.log('Enrolling in course:', courseId);
      const response = await api.post('/enroll/student', { courseId });
      return response.data;
    } catch (error: any) {
      console.error('Error enrolling student:', error.response?.data || error.message);
      // Rethrow with more context if available
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }

  async getStudentCourses(): Promise<StudentCourse[]> {
    try {
      const response = await api.get('/enroll/student/courses');
      return response.data.data.courses;
    } catch (error: any) {
      console.error('Error getting student courses:', error.response?.data || error.message);
      throw error;
    }
  }

  async checkEnrollment(courseId: number): Promise<EnrollmentStatus> {
    try {
      const response = await api.get(`/enroll/check/${courseId}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error checking enrollment:', error.response?.data || error.message);
      throw error;
    }
  }

  // Admin methods
  async getAvailableUsers(courseId: number, role: 'student' | 'instructor'): Promise<AvailableUser[]> {
    try {
      const response = await api.get(`/enroll/admin/available-users/${courseId}?role=${role}`);
      console.log('API response:', response.data);
      
      // Standard response format should be { data: { users: [...] } }
      if (response.data && response.data.data && response.data.data.users) {
        return response.data.data.users;
      }
      // Handle legacy format
      else if (response.data && response.data.message && response.data.message.users) {
        return response.data.message.users;
      }
      // Handle direct array response
      else if (Array.isArray(response.data)) {
        return response.data;
      }
      // Handle other possible formats
      else if (response.data && Array.isArray(response.data.users)) {
        return response.data.users;
      }
      
      console.warn('Unexpected API response format', response.data);
      return [];
    } catch (error: any) {
      console.error('Error fetching available users:', error.response?.data || error.message);
      throw error;
    }
  }

  async enrollStudentAsAdmin(data: EnrollmentRequest): Promise<void> {
    try {
      console.log('Enrolling student with data:', data);
      const response = await api.post('/enroll/admin/enroll/student', data);
      return response.data;
    } catch (error: any) {
      console.error('Enrollment error details:', error.response?.data || error.message);
      // Rethrow with more context if available
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }

  async enrollInstructorAsAdmin(data: EnrollmentRequest): Promise<void> {
    try {
      console.log('Enrolling instructor with data:', data);
      const response = await api.post('/enroll/admin/enroll/instructor', data);
      return response.data;
    } catch (error: any) {
      console.error('Enrollment error details:', error.response?.data || error.message);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }

  async enrollUsersBulk(data: BulkEnrollmentRequest): Promise<void> {
    try {
      console.log('Bulk enrolling users with data:', data);
      const response = await api.post('/enroll/admin/enroll/bulk', data);
      return response.data;
    } catch (error: any) {
      console.error('Bulk enrollment error details:', error.response?.data || error.message);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }
}

export default new EnrollmentService();