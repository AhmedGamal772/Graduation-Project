import React, { useState, useRef } from 'react';
import { File, Upload } from 'lucide-react';
import Button from './Button';
import { useTheme } from '../../context/ThemeContext';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  label?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  className?: string;
  isDarkMode?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  accept = '*',
  label = 'Upload a file',
  multiple = false,
  maxSize = 5, // 5MB default
  className = '',
  isDarkMode: propsDarkMode,
}) => {
  const { isDarkMode: contextDarkMode } = useTheme();
  const isDarkMode = propsDarkMode !== undefined ? propsDarkMode : contextDarkMode;
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    
    if (!e.target.files || e.target.files.length === 0) {
      setSelectedFile(null);
      return;
    }
    
    const file = e.target.files[0];
    
    // Check file size (convert maxSize from MB to bytes)
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size exceeds the ${maxSize}MB limit`);
      setSelectedFile(null);
      return;
    }
    
    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={className}>
      <div className="flex flex-col items-center justify-center w-full">
        <label 
          className={`
            flex flex-col items-center justify-center w-full h-32 
            border-2 border-dashed ${isDarkMode ? 'border-gray-600' : 'border-gray-300'} rounded-lg 
            cursor-pointer ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'}
          `}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className={`w-8 h-8 mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <p className={`mb-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
              <span className="font-semibold">{label}</span>
            </p>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {selectedFile 
                ? selectedFile.name 
                : `Upload ${multiple ? 'files' : 'a file'} (max ${maxSize}MB)`}
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={accept}
            multiple={multiple}
            onChange={handleFileChange}
          />
        </label>
        {error && <p className={`mt-2 text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{error}</p>}
        {selectedFile && (
          <div className="mt-4 flex items-center">
            <File className={`w-5 h-5 mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{selectedFile.name}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;