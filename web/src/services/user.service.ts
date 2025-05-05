import api from './api';
import { User } from '../types';

export const UserService = {
  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/admin/users');
    return response.data;
  },
  
  getUsersByRole: async (role: string): Promise<User[]> => {
    const response = await api.get<User[]>(`/admin/users?role=${role}`);
    return response.data;
  },
  
  getUserById: async (id: string): Promise<User> => {
    const response = await api.get<User>(`/admin/users/${id}`);
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string, confirmPassword: string): Promise<void> => {
    await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
      confirmPassword
    });
  },
  
  resetPassword: async (userId: number): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(`/admin/users/${userId}/reset-password`);
    return response.data;
  }
};

export default UserService;