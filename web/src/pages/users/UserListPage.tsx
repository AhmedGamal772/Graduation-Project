import React, { useEffect, useState } from 'react';
import { User, Search, UserCheck, UserX, Mail, KeyRound, MoreVertical } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { Card, CardContent } from '../../components/ui/Card';
import { User as UserType } from '../../types';
import UserService from '../../services/user.service';
import { toast } from 'react-hot-toast';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/ui/Button';

const UserListPage: React.FC = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const { isDarkMode } = useTheme();
  
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const fetchedUsers = await UserService.getAllUsers();
        setUsers(fetchedUsers);
        setFilteredUsers(fetchedUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUsers();
  }, []);
  
  useEffect(() => {
    let result = users;
    
    // Apply role filter
    if (activeFilter) {
      result = result.filter(user => user.role === activeFilter);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        user => 
          user.first_name.toLowerCase().includes(query) ||
          user.last_name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
      );
    }
    
    setFilteredUsers(result);
  }, [users, searchQuery, activeFilter]);
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleFilterClick = (filter: string | null) => {
    setActiveFilter(activeFilter === filter ? null : filter);
  };
  
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <UserCheck className="h-5 w-5 text-purple-600" />;
      case 'instructor':
        return <User className="h-5 w-5 text-blue-600" />;
      case 'student':
        return <User className="h-5 w-5 text-green-600" />;
      default:
        return <UserX className="h-5 w-5 text-gray-600" />;
    }
  };
  
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return `${isDarkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'}`;
      case 'instructor':
        return `${isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`;
      case 'student':
        return `${isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'}`;
      default:
        return `${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'}`;
    }
  };

  const handleResetPasswordClick = (user: UserType) => {
    setSelectedUser(user);
    setShowResetModal(true);
  };

  const handleConfirmResetPassword = async () => {
    if (!selectedUser) return;
    
    setIsResetting(true);
    try {
      const result = await UserService.resetPassword(selectedUser.id);
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
  
  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Users</h1>
        <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Manage and view all users in your learning platform.
        </p>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleFilterClick('admin')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              activeFilter === 'admin'
                ? 'bg-purple-500 text-white'
                : `${isDarkMode ? 'bg-purple-900 text-purple-200 hover:bg-purple-800' : 'bg-purple-100 text-purple-800 hover:bg-purple-200'}`
            }`}
          >
            Admins
          </button>
          <button
            onClick={() => handleFilterClick('instructor')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              activeFilter === 'instructor'
                ? 'bg-blue-500 text-white'
                : `${isDarkMode ? 'bg-blue-900 text-blue-200 hover:bg-blue-800' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}`
            }`}
          >
            Instructors
          </button>
          <button
            onClick={() => handleFilterClick('student')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              activeFilter === 'student'
                ? 'bg-green-500 text-white'
                : `${isDarkMode ? 'bg-green-900 text-green-200 hover:bg-green-800' : 'bg-green-100 text-green-800 hover:bg-green-200'}`
            }`}
          >
            Students
          </button>
          {activeFilter && (
            <button
              onClick={() => setActiveFilter(null)}
              className={`px-3 py-1 rounded-full text-sm font-medium ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
            >
              Clear
            </button>
          )}
        </div>
        
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className={`h-5 w-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
          </div>
          <input
            type="text"
            className={`pl-10 block w-full rounded-md border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-300 text-gray-900'} py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm`}
            placeholder="Search users..."
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
      </div>
      
      {/* User List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`animate-pulse ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm h-16`}></div>
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card>
          <CardContent className={`py-12 text-center ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>No users found</h3>
            <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {searchQuery 
                ? "No users match your search query. Try a different search term."
                : activeFilter 
                  ? `No ${activeFilter}s found in the system.` 
                  : "There are no users in the system."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <div 
              key={user.id}
              className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm rounded-lg overflow-hidden hover:shadow-md transition-shadow`}
            >
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`h-10 w-10 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-blue-100'} flex items-center justify-center`}>
                    {getRoleIcon(user.role)}
                  </div>
                  <div className="ml-4">
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{`${user.first_name} ${user.last_name}`}</h3>
                    <div className={`flex items-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <Mail className="h-4 w-4 mr-1" />
                      {user.email}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                  <button
                    onClick={() => handleResetPasswordClick(user)}
                    className={`p-1.5 rounded-full ${
                      isDarkMode 
                        ? 'hover:bg-gray-700 text-gray-300 hover:text-blue-400' 
                        : 'hover:bg-gray-100 text-gray-500 hover:text-blue-600'
                    }`}
                    title="Reset Password"
                  >
                    <KeyRound className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
                  variant={isDarkMode ? 'dark' : 'danger'}
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

export default UserListPage;