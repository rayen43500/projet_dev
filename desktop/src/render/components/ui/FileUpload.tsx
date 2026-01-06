import React, { useRef, useState } from 'react';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';
import Button from './Button';

interface FileUploadProps {
  label?: string;
  error?: string;
  helperText?: string;
  accept?: string;
  maxSize?: number; // en MB
  onFileSelect?: (file: File | null) => void;
  onFileRemove?: () => void;
  className?: string;
  disabled?: boolean;
  multiple?: boolean;
}

export default function FileUpload({
  label,
  error,
  helperText,
  accept = '.pdf',
  maxSize = 10, // 10MB par défaut
  onFileSelect,
  onFileRemove,
  className = '',
  disabled = false,
  multiple = false
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    setUploadError(null);
    
    // Vérifier la taille du fichier
    if (file.size > maxSize * 1024 * 1024) {
      setUploadError(`Le fichier est trop volumineux. Taille maximale : ${maxSize}MB`);
      return;
    }
    
    // Vérifier le type de fichier
    if (accept && !file.name.toLowerCase().match(accept.replace('*', '.*'))) {
      setUploadError(`Type de fichier non supporté. Types acceptés : ${accept}`);
      return;
    }
    
    setSelectedFile(file);
    onFileSelect?.(file);
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    setUploadError(null);
    onFileRemove?.();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <div
        className={`relative border-2 border-dashed rounded-lg transition-all duration-200 ${
          dragActive
            ? 'border-primary-500 bg-primary-50'
            : error || uploadError
            ? 'border-danger-500 bg-danger-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="hidden"
          disabled={disabled}
        />
        
        {selectedFile ? (
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <FileText className="w-8 h-8 text-primary-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-success-500" />
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFileRemove();
                }}
                className="ml-3"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center">
            <Upload className={`mx-auto h-12 w-12 ${
              dragActive ? 'text-primary-500' : 'text-gray-400'
            }`} />
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-900">
                {dragActive ? 'Déposez le fichier ici' : 'Cliquez pour sélectionner ou glissez-déposez'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {accept} jusqu'à {maxSize}MB
              </p>
            </div>
          </div>
        )}
      </div>
      
      {(error || uploadError) && (
        <p className="mt-2 text-sm text-danger-600 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error || uploadError}
        </p>
      )}
      
      {helperText && !error && !uploadError && (
        <p className="mt-2 text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
}
