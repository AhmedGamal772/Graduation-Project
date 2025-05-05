import React, { useState, useEffect } from 'react';
import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup';
import { SearchIcon, X, Plus, Check, Loader2 } from 'lucide-react';
import { SelectField } from '../ui/FormField';
import Button from '../ui/Button';
import { Course, User } from '../../types';
import UserService from '../../services/user.service';
import EnrollmentService from '../../services/enrollment.service';
import { toast } from 'react-hot-toast';
import { useTheme } from '../../context/ThemeContext';

interface EnrollmentFormProps {
  onSubmit: (courseId: string, userIds: string[]) => Promise<void>;
  isLoading: boolean;
  courseId: string;
  role: 'student' | 'instructor';
  externalError?: string | null;
  externalSuccess?: string | null;
}

const EnrollmentSchema = Yup.object().shape({
  userIds: Yup.array()
    .of(Yup.string())
    .min(1, 'Please select at least one user')
    .required('Please select at least one user'),
});

const EnrollmentForm: React.FC<EnrollmentFormProps> = ({ 
  onSubmit, 
  isLoading,
  courseId,
  role,
  externalError,
  externalSuccess
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [lastSuccess, setLastSuccess] = useState<string | null>(null);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    if (externalSuccess && externalSuccess !== lastSuccess) {
      setLastSuccess(externalSuccess);
      fetchAvailableUsers();
    }
  }, [externalSuccess]);

  const fetchAvailableUsers = async () => {
    setIsLoadingUsers(true);
    setInternalError(null);
    try {
      console.log('Fetching available users for course:', courseId, 'role:', role);
      const availableUsers = await EnrollmentService.getAvailableUsers(parseInt(courseId), role);
      console.log('Received users:', availableUsers);
      
      if (Array.isArray(availableUsers)) {
        if (availableUsers.length === 0) {
          console.log('No users available for enrollment');
        }
        
        // Make sure we have the latest user roles data and consistent field names
        const processedUsers = availableUsers.map(user => ({
          id: user.id,
          email: user.email,
          firstName: user.firstName || user.first_name || '',
          lastName: user.lastName || user.last_name || '',
          // Ensure role property is properly applied
          role: user.role || role
        }));
        
        setUsers(processedUsers);
        setFilteredUsers(processedUsers);
      } else {
        console.error('Invalid response format from server', availableUsers);
        setInternalError('Invalid response format from server');
        setUsers([]);
        setFilteredUsers([]);
      }
    } catch (error: any) {
      console.error('Error fetching available users:', error);
      setInternalError(error.message || 'Failed to load available users');
      setUsers([]);
      setFilteredUsers([]);
      toast.error(error.message || 'Failed to load available users');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchAvailableUsers();
    } else {
      setUsers([]);
      setFilteredUsers([]);
    }
  }, [courseId, role]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = users.filter(user => 
        `${user.first_name || user.firstName} ${user.last_name || user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) || 
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Display loading spinner if users are being loaded
  if (isLoadingUsers) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className={`h-8 w-8 animate-spin ${isDarkMode ? 'text-blue-400' : 'text-indigo-600'}`} />
      </div>
    );
  }

  // Display component errors (either internal or external)
  const displayError = externalError || internalError;
  if (displayError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className={isDarkMode ? 'text-red-400' : 'text-red-600'}>{displayError}</div>
      </div>
    );
  }

  return (
    <Formik
      initialValues={{ userIds: [] as string[] }}
      validationSchema={EnrollmentSchema}
      onSubmit={async (values, { setSubmitting, resetForm }) => {
        try {
          await onSubmit(courseId, values.userIds);
          resetForm();
        } catch (error) {
          console.error('Error submitting form:', error);
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ values, isSubmitting, setFieldValue }) => (
        <Form className="space-y-6">
          {externalSuccess && (
            <div className={`p-3 ${isDarkMode ? 'bg-green-900 border-green-800 text-green-300' : 'bg-green-50 border border-green-200 text-green-700'} rounded-md`}>
              {externalSuccess}
            </div>
          )}
        
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className={`h-5 w-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
            <input
              type="text"
              className={`block w-full pl-10 pr-3 py-2 rounded-md leading-5 ${
                isDarkMode 
                  ? 'border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500' 
                  : 'border-gray-300 bg-white placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500'
              } sm:text-sm`}
              placeholder={`Search ${role}s...`}
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>

          {filteredUsers.length === 0 ? (
            <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No {role}s available for enrollment
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    values.userIds.includes(user.id.toString())
                      ? isDarkMode 
                        ? 'border-blue-600 bg-blue-900 bg-opacity-30' 
                        : 'border-indigo-500 bg-indigo-50'
                      : isDarkMode 
                        ? 'border-gray-700 bg-gray-800' 
                        : 'border-gray-200'
                  } border`}
                >
                  <div>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                      {user.first_name || user.firstName} {user.last_name || user.lastName}
                    </p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{user.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const userIds = values.userIds.includes(user.id.toString())
                        ? values.userIds.filter((id) => id !== user.id.toString())
                        : [...values.userIds, user.id.toString()];
                      setFieldValue('userIds', userIds);
                    }}
                    className={`p-2 rounded-full ${
                      values.userIds.includes(user.id.toString())
                        ? isDarkMode 
                          ? 'text-blue-400 hover:text-blue-300' 
                          : 'text-indigo-600 hover:text-indigo-800'
                        : isDarkMode 
                          ? 'text-gray-500 hover:text-gray-300' 
                          : 'text-gray-400 hover:text-gray-500'
                    }`}
                  >
                    {values.userIds.includes(user.id.toString()) ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Plus className="h-5 w-5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              variant={isDarkMode ? "dark" : "primary"}
              disabled={isSubmitting || isLoading || isLoadingUsers || filteredUsers.length === 0}
            >
              {isSubmitting || isLoading ? 'Enrolling...' : `Enroll ${role}s`}
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default EnrollmentForm;