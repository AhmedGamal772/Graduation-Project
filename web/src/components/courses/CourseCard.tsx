import React from 'react';
import { Card, CardContent, CardTitle } from '../ui/Card';
import { BookOpen, User, GraduationCap, School } from 'lucide-react';
import { Course } from '../../types';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

interface CourseCardProps {
  course: Course;
  isStudentView?: boolean;
  relationshipType?: 'assigned' | 'enrolled';
}

const CourseCard: React.FC<CourseCardProps> = ({ 
  course, 
  isStudentView = false,
  relationshipType
}) => {
  const { isDarkMode } = useTheme();
  
  return (
    <Link to={`/courses/${course.id}`}>
      <Card className="h-full hover:shadow-lg transition-shadow duration-200">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className={`flex-shrink-0 p-3 rounded-lg ${isDarkMode ? 'bg-blue-900' : 'bg-blue-100'}`}>
              <BookOpen className={`h-6 w-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            
            {/* Relationship badge */}
            {isStudentView && (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'
              }`}>
                <GraduationCap className="w-3 h-3 mr-1" />
                Enrolled
              </span>
            )}
            {!isStudentView && relationshipType === 'assigned' && (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'
              }`}>
                <School className="w-3 h-3 mr-1" />
                Teaching
              </span>
            )}
          </div>
          
          <CardTitle className="mt-4">{course.title}</CardTitle>
          
          <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} line-clamp-3`}>
            {course.description || 'No description available'}
          </p>
          
          {/* Show instructor name if available or creator name */}
          <div className={`mt-4 flex items-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <User className={`mr-1.5 h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            {isStudentView ? 
              `Instructor: ${course.instructorName || 'Not Assigned'}` :
              `Created by: ${course.creator_name || 'Unknown'}`
            }
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default CourseCard;