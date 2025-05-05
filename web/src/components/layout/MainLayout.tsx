import React, { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  BookOpen, 
  User, 
  LogOut, 
  ChevronDown, 
  Home, 
  Users,
  Menu,
  X,
  BookOpenCheck,
  FileText,
  Moon,
  Sun
} from 'lucide-react';
import Button from '../ui/Button';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, logout, hasRole } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  if (!user) {
    navigate('/login');
    return null;
  }

  // Navigation items based on user role
  const navigationItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Home, roles: ['admin', 'instructor', 'student'] },
    { name: 'Courses', path: '/courses', icon: BookOpen, roles: ['admin', 'instructor', 'student'] },
    { name: 'Users', path: '/admin/users', icon: Users, roles: ['admin'] },
    { name: 'Assignments', path: '/assignments', icon: FileText, roles: ['instructor', 'student'] },
    { name: 'Enrollments', path: '/enrollments', icon: BookOpenCheck, roles: ['admin'] },
  ].filter(item => hasRole(item.roles));

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-sm sticky top-0 z-10`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and desktop navigation */}
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <BookOpen className={`h-8 w-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <span className={`ml-2 text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>LMS Portal</span>
              </div>
              
              {/* Desktop navigation */}
              <nav className="hidden sm:ml-6 sm:flex sm:space-x-4 items-center">
                {navigationItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`
                      px-3 py-2 rounded-md text-sm font-medium 
                      ${location.pathname === item.path
                        ? isDarkMode 
                          ? 'bg-gray-700 text-blue-400' 
                          : 'bg-blue-50 text-blue-700'
                        : isDarkMode
                          ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="flex items-center">
                      <item.icon className="mr-1.5 h-4 w-4" />
                      {item.name}
                    </div>
                  </Link>
                ))}
              </nav>
            </div>
            
            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
              <button
                type="button"
                className={`inline-flex items-center justify-center p-2 rounded-md ${
                  isDarkMode 
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                    : 'text-gray-400 hover:text-gray-500 hover:bg-gray-100'
                } focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500`}
                onClick={toggleMobileMenu}
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
            </div>
            
            {/* User profile dropdown and theme toggle */}
            <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
              {/* Theme toggle button */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-full ${
                  isDarkMode 
                    ? 'bg-gray-700 text-yellow-300 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } transition-colors duration-200`}
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>
              
              {/* User profile */}
              <div className="relative">
                <button
                  type="button"
                  className={`flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    isDarkMode ? 'bg-gray-800' : 'bg-white'
                  }`}
                  onClick={toggleProfileDropdown}
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
                      <User className="h-5 w-5" />
                    </div>
                    <span className={`ml-2 text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      {user.name}
                    </span>
                    <ChevronDown className={`ml-1 h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                  </div>
                </button>
                
                {/* Profile dropdown panel */}
                {isProfileDropdownOpen && (
                  <div className={`origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 ${
                    isDarkMode ? 'bg-gray-800 ring-gray-700' : 'bg-white ring-black ring-opacity-5'
                  } focus:outline-none`}>
                    <div className={`px-4 py-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Signed in as
                      <p className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{user.email}</p>
                      <span className={`mt-1 block px-2 py-1 text-xs font-medium ${
                        isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'
                      } rounded`}>
                        {user.role === 'instructor' ? 'Instructor' : 
                         user.role === 'admin' ? 'Admin' : 'Student'}
                      </span>
                    </div>
                    <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}></div>
                    <button
                      onClick={handleLogout}
                      className={`w-full text-left block px-4 py-2 text-sm ${
                        isDarkMode 
                          ? 'text-gray-300 hover:bg-gray-700' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center">
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign out
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile menu panel */}
        {isMobileMenuOpen && (
          <div className={`sm:hidden ${isDarkMode ? 'bg-gray-800' : ''}`}>
            <div className="pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`
                    block px-3 py-2 rounded-md text-base font-medium
                    ${location.pathname === item.path
                      ? isDarkMode 
                        ? 'bg-gray-700 text-blue-400' 
                        : 'bg-blue-50 text-blue-700'
                      : isDarkMode
                        ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <item.icon className="mr-2 h-5 w-5" />
                    {item.name}
                  </div>
                </Link>
              ))}
            </div>
            
            {/* Mobile profile section */}
            <div className={`pt-4 pb-3 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    <User className="h-6 w-6" />
                  </div>
                </div>
                <div className="ml-3">
                  <div className={`text-base font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{user.name}</div>
                  <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{user.email}</div>
                  <span className={`mt-1 inline-block px-2 py-0.5 text-xs font-medium ${
                    isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'
                  } rounded`}>
                    {user.role === 'instructor' ? 'Instructor' : 
                     user.role === 'admin' ? 'Admin' : 'Student'}
                  </span>
                </div>
                
                {/* Add theme toggle on mobile */}
                <button
                  onClick={toggleTheme}
                  className={`ml-auto p-2 rounded-full ${
                    isDarkMode 
                      ? 'bg-gray-700 text-yellow-300' 
                      : 'bg-gray-100 text-gray-700'
                  }`}
                  aria-label="Toggle dark mode"
                >
                  {isDarkMode ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </button>
              </div>
              <div className="mt-3 space-y-1">
                <Button
                  variant={isDarkMode ? "dark" : "outline"}
                  className="w-full justify-start"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-5 w-5" />
                  Sign out
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>
      
      {/* Main content */}
      <main className={`max-w-7xl w-full mx-auto py-6 sm:px-6 lg:px-8 flex-grow ${isDarkMode ? 'text-gray-200' : ''}`}>
        {children}
      </main>
      
      {/* Footer */}
      <footer className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t`}>
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className={`text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            &copy; {new Date().getFullYear()} LMS Portal. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;