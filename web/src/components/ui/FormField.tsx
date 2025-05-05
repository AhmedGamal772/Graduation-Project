import React from 'react';
import { useField, FieldHookConfig } from 'formik';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  isDarkMode?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({ label, isDarkMode = false, ...props }) => {
  const [field, meta] = useField(props as FieldHookConfig<string>);
  const hasError = meta.touched && meta.error;

  return (
    <div className="mb-4">
      <label 
        htmlFor={props.id || props.name} 
        className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}
      >
        {label}
      </label>
      <input
        {...field}
        {...props}
        className={`
          w-full px-3 py-2 border rounded-md shadow-sm 
          ${isDarkMode 
            ? 'bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500' 
            : 'bg-white border-gray-300 placeholder-gray-400 text-black focus:ring-blue-500 focus:border-blue-500'
          }
          focus:outline-none focus:ring-2
          ${hasError 
            ? isDarkMode 
              ? 'border-red-700 focus:ring-red-700 focus:border-red-700' 
              : 'border-red-500 focus:ring-red-500 focus:border-red-500' 
            : ''
          }
        `}
      />
      {hasError && (
        <p className={`mt-1 text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{meta.error}</p>
      )}
    </div>
  );
};

interface TextAreaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  name: string;
  isDarkMode?: boolean;
}

export const TextAreaField: React.FC<TextAreaFieldProps> = ({ label, isDarkMode = false, ...props }) => {
  const [field, meta] = useField(props.name);
  const hasError = meta.touched && meta.error;

  return (
    <div className="mb-4">
      <label 
        htmlFor={props.id || props.name} 
        className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}
      >
        {label}
      </label>
      <textarea
        {...field}
        {...props}
        className={`
          w-full px-3 py-2 border rounded-md shadow-sm 
          ${isDarkMode 
            ? 'bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500' 
            : 'bg-white border-gray-300 placeholder-gray-400 text-black focus:ring-blue-500 focus:border-blue-500'
          }
          focus:outline-none focus:ring-2
          ${hasError 
            ? isDarkMode 
              ? 'border-red-700 focus:ring-red-700 focus:border-red-700' 
              : 'border-red-500 focus:ring-red-500 focus:border-red-500' 
            : ''
          }
        `}
      />
      {hasError && (
        <p className={`mt-1 text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{meta.error}</p>
      )}
    </div>
  );
};

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  name: string;
  options: Array<{ value: string; label: string }>;
  isDarkMode?: boolean;
}

export const SelectField: React.FC<SelectFieldProps> = ({ label, options, isDarkMode = false, ...props }) => {
  const [field, meta] = useField(props.name);
  const hasError = meta.touched && meta.error;

  return (
    <div className="mb-4">
      <label 
        htmlFor={props.id || props.name} 
        className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}
      >
        {label}
      </label>
      <select
        {...field}
        {...props}
        className={`
          w-full px-3 py-2 border rounded-md shadow-sm 
          ${isDarkMode 
            ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500' 
            : 'bg-white border-gray-300 text-black focus:ring-blue-500 focus:border-blue-500'
          }
          focus:outline-none focus:ring-2
          ${hasError 
            ? isDarkMode 
              ? 'border-red-700 focus:ring-red-700 focus:border-red-700' 
              : 'border-red-500 focus:ring-red-500 focus:border-red-500' 
            : ''
          }
        `}
      >
        <option value="">Select an option</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hasError && (
        <p className={`mt-1 text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{meta.error}</p>
      )}
    </div>
  );
};

export default FormField;