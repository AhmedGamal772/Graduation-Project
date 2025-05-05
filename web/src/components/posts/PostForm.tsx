import React, { useState } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import FormField, { TextAreaField } from '../ui/FormField';
import Button from '../ui/Button';
import FileUpload from '../ui/FileUpload';
import { Post } from '../../types';
import { Paperclip, X, Upload, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface PostFormProps {
  courseId: string;
  initialValues?: Partial<Post>;
  onSubmit: (values: Partial<Post>, file?: File) => Promise<void>;
  isLoading: boolean;
  isDarkMode?: boolean;
}

const PostSchema = Yup.object().shape({
  title: Yup.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters')
    .required('Title is required'),
  content: Yup.string()
    .min(10, 'Content must be at least 10 characters')
    .required('Content is required'),
  allow_submissions: Yup.boolean(),
});

const PostForm: React.FC<PostFormProps> = ({ 
  courseId,
  initialValues = { title: '', content: '', allow_submissions: false }, 
  onSubmit,
  isLoading,
  isDarkMode = false,
}) => {
  const { hasRole } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };
  
  const removeSelectedFile = () => {
    setSelectedFile(null);
  };
  
  const isInstructorOrAdmin = hasRole(['instructor', 'admin']);
  
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={PostSchema}
      onSubmit={async (values, { setSubmitting }) => {
        try {
          await onSubmit(values, selectedFile || undefined);
        } catch (error) {
          console.error('Error submitting form:', error);
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting, values, setFieldValue }) => (
        <Form className="space-y-4">
          <FormField
            label="Post Title"
            name="title"
            type="text"
            placeholder="Enter post title"
            required
            isDarkMode={isDarkMode}
          />
          
          <TextAreaField
            label="Post Content"
            name="content"
            placeholder="Enter post content"
            rows={6}
            required
            isDarkMode={isDarkMode}
          />
          
          {/* Student submission option - only for instructors/admins */}
          {isInstructorOrAdmin && (
            <div className={`mt-4 ${isDarkMode ? 'bg-blue-900 border-blue-800' : 'bg-blue-50 border-blue-100'} border rounded-lg p-4`}>
              <div className="flex items-center mb-2">
                <Field
                  type="checkbox"
                  name="allow_submissions"
                  id="allowSubmissions"
                  className={`h-4 w-4 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'} rounded focus:ring-blue-500 text-blue-600`}
                />
                <label htmlFor="allowSubmissions" className={`ml-2 block text-sm font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                  Allow Student Submissions
                </label>
              </div>
              <p className={`text-xs ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                Enable this option to allow students to submit files for this post.
                Student submissions will be visible only to instructors and admins.
              </p>
              
              {values.allow_submissions && (
                <div className={`mt-3 p-3 ${isDarkMode ? 'bg-gray-800 border-blue-800' : 'bg-white border-blue-200'} rounded-md border flex items-center`}>
                  <FileText className={`h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'} mr-2`} />
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Students will be able to submit files</p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Files can be viewed only by instructors and admins</p>
                  </div>
                  <Upload className={`h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                </div>
              )}
            </div>
          )}
          
          <div className="mt-6">
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Attachments
            </label>
            
            <FileUpload
              onFileSelect={handleFileSelect}
              label="Upload attachment (PDF, DOC, DOCX, etc.)"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip"
              maxSize={10}
              isDarkMode={isDarkMode}
            />
            
            {selectedFile && (
              <div className={`mt-2 flex items-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} p-2 rounded`}>
                <Paperclip className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mr-2`} />
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} flex-1 truncate`}>
                  {selectedFile.name}
                </span>
                <button
                  type="button"
                  onClick={removeSelectedFile}
                  className={`${isDarkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-500'}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
          
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              isLoading={isSubmitting || isLoading}
              disabled={isSubmitting || isLoading}
              variant={isDarkMode ? "dark" : "primary"}
            >
              {initialValues.id ? 'Update Post' : 'Create Post'}
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default PostForm;