export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'instructor' | 'student';
  status: 'active' | 'suspended';
  is_first_login?: boolean;
  createdAt?: string;
  created_at?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: User;
  createdAt: string;
  relationshipType?: 'assigned' | 'enrolled' | string;
}

export interface PostFile {
  id: string;
  name: string;
  url: string;
  size?: number;
  type?: string;
  post_id?: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  course_id: string;
  author?: User;
  author_name?: string;
  author_last_name?: string;
  author_email?: string;
  created_at: string;
  is_pinned: boolean;
  files?: PostFile[];
  allow_submissions?: boolean;
}

export interface Analytics {
  total_users: number;
  total_courses: number;
  total_enrollments: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'instructor' | 'student';
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface EnrollmentRequest {
  courseId: number;
  userId?: number;
}

export interface BulkEnrollmentRequest {
  courseId: number;
  userIds: number[];
  role: 'student' | 'instructor';
}

export interface CreateCourseRequest {
  title: string;
  description: string;
}

export interface CreatePostRequest {
  course_id: string;
  title: string;
  content: string;
  link_url?: string;
  allow_submissions?: boolean;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'instructor' | 'student';
}