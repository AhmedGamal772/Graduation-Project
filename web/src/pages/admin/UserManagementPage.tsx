import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Search, Filter, X, Users, BookOpen, UserPlus, KeyRound } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import UserManagementForm from '../../components/admin/UserManagementForm';
import AdminService from '../../services/admin.service';
import CourseService from '../../services/course.service';
import EnrollmentService from '../../services/enrollment.service';
import { User, Course } from '../../types';
import Button from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import AuthService from '../../services/auth.service';

type TabType = 'create' | 'assignments' | 'list';

const UserManagementPage: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState<TabType>('list');
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState<string>('');
  const [selectedCourseForAssignment, setSelectedCourseForAssignment] = useState<string>('');
  const [showUserForm, setShowUserForm] = useState(true);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const { user: currentUser, updateUserRole } = useAuth();
  const { isDarkMode } = useTheme();

  // Fetch data
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await AdminService.getAllUsers(
        searchQuery || undefined,
        selectedCourse || undefined,
        selectedRole || undefined
      );
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const data = await CourseService.getAllCourses();
      setCourses(data);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to fetch courses');
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchCourses();
  }, []);

  useEffect(() => {
    // Debounce search to avoid too many API calls
    const timer = setTimeout(() => {
      fetchUsers();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCourse, selectedRole]);

  // User management actions
  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      await AdminService.deleteUser(userId);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const updatedUser = await AdminService.updateUserRole(userId, newRole);
      toast.success('User role updated successfully');
      
      // If the admin is updating their own role
      if (currentUser && currentUser.id.toString() === userId) {
        // If changing from admin to another role, we need to force logout to reset permissions
        if (currentUser.role === 'admin' && newRole !== 'admin') {
          toast.success('Your role has been changed. You will be logged out to apply changes.');
          setTimeout(() => {
            // Logout after toast is shown
            AuthService.logout();
          }, 2000);
          return; // Return early to prevent fetchUsers
        } else {
          // Just update the role in context
          updateUserRole(newRole);
          toast.success('Your role has been updated. UI will refresh to show changes.');
        }
      } else {
        // Force a re-fetch of user data to update any cached info
        AuthService.updateStoredUserRole(updatedUser);
      }
      
      fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  const handleSuspendUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to suspend this user?')) {
      return;
    }

    try {
      await AdminService.suspendUser(userId);
      toast.success('User suspended successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error suspending user:', error);
      toast.error('Failed to suspend user');
    }
  };

  const handleUnsuspendUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to unsuspend this user?')) {
      return;
    }

    try {
      await AdminService.unsuspendUser(userId);
      toast.success('User unsuspended successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error unsuspending user:', error);
      toast.error('Failed to unsuspend user');
    }
  };

  const handleResetPasswordClick = (user: User) => {
    setSelectedUser(user);
    setShowResetModal(true);
  };

  const handleConfirmResetPassword = async () => {
    if (!selectedUser) return;
    
    setIsResetting(true);
    try {
      const result = await AdminService.resetPassword(selectedUser.id);
      toast.success(result.message || 'Password reset successfully. User will be required to set a new password on next login.');
      
      // Update the user in the list to reflect is_first_login=true
      const updatedUsers = users.map(user => 
        user.id === selectedUser.id 
          ? { ...user, is_first_login: true } 
          : user
      );
      setUsers(updatedUsers);
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Failed to reset password. Please try again.');
    } finally {
      setIsResetting(false);
      setShowResetModal(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCourse('');
    setSelectedRole('');
  };

  const handleAssignCourse = async () => {
    if (!selectedInstructor || !selectedCourseForAssignment) {
      toast.error('Please select both an instructor and a course');
      return;
    }

    try {
      await EnrollmentService.enrollUsersBulk({
        courseId: parseInt(selectedCourseForAssignment),
        userIds: [parseInt(selectedInstructor)],
        role: 'instructor'
      });
      toast.success('Instructor assigned to course successfully');
      setSelectedInstructor('');
      setSelectedCourseForAssignment('');
    } catch (err: any) {
      console.error('Error assigning instructor to course:', err);
      
      // Display more specific error message if available
      if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else if (err.message) {
        toast.error(err.message);
      } else {
        toast.error('Failed to assign instructor to course');
      }
    }
  };

  const instructors = users.filter(user => user.role === 'instructor');

  // Tab content renderers
  const renderCreateUserTab = () => {
  return (
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">Create New User</CardTitle>
            <CardDescription>Fill in the form below to add a new user to the system</CardDescription>
      </div>
          <Button 
            onClick={() => setShowUserForm(!showUserForm)} 
            variant={showUserForm ? (isDarkMode ? "dark" : "outline") : (isDarkMode ? "primary" : "primary")}
            size="sm"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {showUserForm ? 'Hide Form' : 'New User'}
          </Button>
        </CardHeader>
        
        <CardContent>
          {showUserForm && (
            <UserManagementForm onSuccess={() => {
              fetchUsers();
              toast.success('User created successfully');
            }} />
          )}
        </CardContent>
      </Card>
    );
  };

  const renderCourseAssignmentsTab = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Course Assignments</CardTitle>
          <CardDescription>Assign instructors to courses</CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="instructor" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Select Instructor
              </label>
              <select
                id="instructor"
                className={`block w-full rounded-md ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500 focus:ring-blue-500' 
                    : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                } shadow-sm sm:text-sm`}
                value={selectedInstructor}
                onChange={(e) => setSelectedInstructor(e.target.value)}
              >
                <option value="">Select an instructor</option>
                {instructors.map((instructor) => (
                  <option key={instructor.id} value={instructor.id}>
                    {`${instructor.first_name} ${instructor.last_name}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="course-assignment" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Select Course
              </label>
              <select
                id="course-assignment"
                className={`block w-full rounded-md ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500 focus:ring-blue-500' 
                    : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                } shadow-sm sm:text-sm`}
                value={selectedCourseForAssignment}
                onChange={(e) => setSelectedCourseForAssignment(e.target.value)}
              >
                <option value="">Select a course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
        </div>
      </div>

          <div className="mt-6">
            <Button
              onClick={handleAssignCourse}
              disabled={!selectedInstructor || !selectedCourseForAssignment}
              variant={isDarkMode ? "dark" : "primary"}
            >
              Assign Course to Instructor
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderUserListTab = () => {
    return (
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">User List</CardTitle>
            <CardDescription>View and manage all users</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
                <Button 
              variant={isDarkMode ? "dark" : "outline"} 
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-1" />
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </Button>
                {(searchQuery || selectedCourse || selectedRole) && (
                  <Button 
                variant={isDarkMode ? "dark" : "outline"} 
                    size="sm"
                    onClick={clearFilters}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear Filters
                  </Button>
                )}
              </div>
        </CardHeader>

        <CardContent>
            {showFilters && (
            <div className={`mb-6 p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg space-y-4`}>
                <div>
                <label htmlFor="search" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Search by name or email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className={`h-5 w-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    </div>
                    <input
                      type="text"
                      id="search"
                    className={`pl-10 block w-full rounded-md ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500' 
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                    } shadow-sm sm:text-sm`}
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                  <label htmlFor="course" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Filter by course
                    </label>
                    <select
                      id="course"
                    className={`block w-full rounded-md ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500 focus:ring-blue-500' 
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                    } shadow-sm sm:text-sm`}
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                    >
                      <option value="">All courses</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                  <label htmlFor="role" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Filter by role
                    </label>
                    <select
                      id="role"
                    className={`block w-full rounded-md ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500 focus:ring-blue-500' 
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                    } shadow-sm sm:text-sm`}
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                    >
                      <option value="">All roles</option>
                      <option value="admin">Admin</option>
                      <option value="instructor">Instructor</option>
                      <option value="student">Student</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center items-center h-40">
              <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isDarkMode ? 'border-blue-400' : 'border-indigo-600'}`}></div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>No users found.</p>
                {(searchQuery || selectedCourse || selectedRole) && (
                  <button
                    onClick={clearFilters}
                  className={isDarkMode ? 'mt-2 text-blue-400 hover:text-blue-300' : 'mt-2 text-indigo-600 hover:text-indigo-800'}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
              <table className={`min-w-full divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                <thead className={isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}>
                    <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                        Name
                      </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                        Email
                      </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                        Role
                      </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                        Status
                      </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                <tbody className={`${isDarkMode ? 'bg-gray-800 divide-y divide-gray-700' : 'bg-white divide-y divide-gray-200'}`}>
                    {users.map((user) => (
                    <tr key={user.id} className={isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                      <td className={`px-6 py-4 whitespace-nowrap ${isDarkMode ? 'text-gray-300' : ''}`}>
                          {`${user.first_name} ${user.last_name}`}
                        </td>
                      <td className={`px-6 py-4 whitespace-nowrap ${isDarkMode ? 'text-gray-300' : ''}`}>
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className={`rounded-md ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500 focus:ring-blue-500' 
                              : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                          }`}
                          >
                            <option value="admin">Admin</option>
                            <option value="instructor">Instructor</option>
                            <option value="student">Student</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.status === 'active' 
                            ? isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                            : isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <a
                          href={`/admin/users/${user.id}/profile`}
                          className={isDarkMode ? 'text-blue-400 hover:text-blue-300 mr-4' : 'text-blue-600 hover:text-blue-900 mr-4'}
                        >
                          View Profile
                        </a>
                          {user.status === 'active' ? (
                            <button
                              onClick={() => handleSuspendUser(user.id)}
                            className={isDarkMode ? 'text-yellow-400 hover:text-yellow-300 mr-4' : 'text-yellow-600 hover:text-yellow-900 mr-4'}
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUnsuspendUser(user.id)}
                            className={isDarkMode ? 'text-green-400 hover:text-green-300 mr-4' : 'text-green-600 hover:text-green-900 mr-4'}
                            >
                              Unsuspend
                            </button>
                          )}
                        <button
                          onClick={() => handleResetPasswordClick(user)}
                          className={isDarkMode ? 'text-blue-400 hover:text-blue-300 mr-4' : 'text-blue-600 hover:text-blue-900 mr-4'}
                        >
                          Reset Password
                        </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                          className={isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-900'}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </CardContent>
      </Card>
    );
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>User Management</h1>
        <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Create, manage, and assign users in the system.
        </p>
        </div>
      
      {/* Inner Navigation Bar */}
      <div className={`mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm rounded-lg`}>
        <nav className="flex">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 flex-1 justify-center ${
              activeTab === 'create' 
                ? isDarkMode 
                  ? 'border-blue-500 text-blue-400' 
                  : 'border-indigo-500 text-indigo-600' 
                : isDarkMode 
                  ? 'border-transparent text-gray-400 hover:border-gray-700 hover:text-gray-300' 
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            <UserPlus className="h-5 w-5 mr-2" />
            Create Users
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 flex-1 justify-center ${
              activeTab === 'assignments' 
                ? isDarkMode 
                  ? 'border-blue-500 text-blue-400' 
                  : 'border-indigo-500 text-indigo-600' 
                : isDarkMode 
                  ? 'border-transparent text-gray-400 hover:border-gray-700 hover:text-gray-300' 
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            <BookOpen className="h-5 w-5 mr-2" />
            Course Assignments
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 flex-1 justify-center ${
              activeTab === 'list' 
                ? isDarkMode 
                  ? 'border-blue-500 text-blue-400' 
                  : 'border-indigo-500 text-indigo-600' 
                : isDarkMode 
                  ? 'border-transparent text-gray-400 hover:border-gray-700 hover:text-gray-300' 
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            <Users className="h-5 w-5 mr-2" />
            User List
          </button>
        </nav>
            </div>

      {/* Content based on active tab */}
            <div>
        {activeTab === 'create' && renderCreateUserTab()}
        {activeTab === 'assignments' && renderCourseAssignmentsTab()}
        {activeTab === 'list' && renderUserListTab()}
      </div>

      {/* Reset Password Confirmation Modal */}
      {showResetModal && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              aria-hidden="true"
              onClick={() => !isResetting && setShowResetModal(false)}
            ></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className={`inline-block align-bottom ${isDarkMode ? 'bg-gray-900' : 'bg-white'} rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full`}>
              <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} px-4 pt-5 pb-4 sm:p-6 sm:pb-4`}>
                <div className="sm:flex sm:items-start">
                  <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${isDarkMode ? 'bg-red-900' : 'bg-red-100'} sm:mx-0 sm:h-10 sm:w-10`}>
                    <KeyRound className={`h-6 w-6 ${isDarkMode ? 'text-red-200' : 'text-red-600'}`} aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className={`text-lg leading-6 font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`} id="modal-title">
                      Reset Password
                    </h3>
                    <div className="mt-2">
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Are you sure you want to reset the password for {selectedUser.first_name} {selectedUser.last_name}?
                      </p>
                      <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        A new random password will be generated and sent to their email. They will be required to create a new password when they next login.
                      </p>
                    </div>
                  </div>
            </div>
          </div>
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse`}>
                <Button
                  variant={isDarkMode ? "dark" : "danger"}
                  isLoading={isResetting}
                  disabled={isResetting}
                  onClick={handleConfirmResetPassword}
                  className="w-full sm:w-auto sm:ml-3"
                >
                  Reset Password
                </Button>
            <Button
                  variant="outline"
                  onClick={() => setShowResetModal(false)}
                  disabled={isResetting}
                  className={`mt-3 sm:mt-0 w-full sm:w-auto ${isDarkMode ? 'text-gray-300 border-gray-600' : ''}`}
                >
                  Cancel
            </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default UserManagementPage; 