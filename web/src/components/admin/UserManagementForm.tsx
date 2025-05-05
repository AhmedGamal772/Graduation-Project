import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import AdminService from '../../services/admin.service';
import { CreateUserRequest } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/ui/Button';

interface UserManagementFormProps {
  onSuccess?: () => void;
}

const UserManagementForm: React.FC<UserManagementFormProps> = ({ onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateUserRequest>();
  const { isDarkMode } = useTheme();

  const onSubmit = async (data: CreateUserRequest) => {
    setIsSubmitting(true);
    try {
      await AdminService.createUser(data);
      toast.success('User created successfully');
      reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="email" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Email
        </label>
        <input
          type="email"
          id="email"
          {...register('email', { required: 'Email is required' })}
          className={`mt-1 block w-full rounded-md ${
            isDarkMode 
              ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500 focus:ring-blue-500' 
              : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
          }`}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="firstName" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          First Name
        </label>
        <input
          type="text"
          id="firstName"
          {...register('firstName', { required: 'First name is required' })}
          className={`mt-1 block w-full rounded-md ${
            isDarkMode 
              ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500 focus:ring-blue-500' 
              : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
          }`}
        />
        {errors.firstName && (
          <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="lastName" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Last Name
        </label>
        <input
          type="text"
          id="lastName"
          {...register('lastName', { required: 'Last name is required' })}
          className={`mt-1 block w-full rounded-md ${
            isDarkMode 
              ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500 focus:ring-blue-500' 
              : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
          }`}
        />
        {errors.lastName && (
          <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="role" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Role
        </label>
        <select
          id="role"
          {...register('role', { required: 'Role is required' })}
          className={`mt-1 block w-full rounded-md ${
            isDarkMode 
              ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500 focus:ring-blue-500' 
              : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
          }`}
        >
          <option value="">Select a role</option>
          <option value="admin">Admin</option>
          <option value="instructor">Instructor</option>
          <option value="student">Student</option>
        </select>
        {errors.role && (
          <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
        )}
      </div>

      <div>
        <Button
          type="submit"
          variant={isDarkMode ? "dark" : "primary"}
          fullWidth
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Create User'}
        </Button>
      </div>
    </form>
  );
};

export default UserManagementForm; 