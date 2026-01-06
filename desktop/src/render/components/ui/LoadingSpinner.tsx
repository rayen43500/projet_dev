import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  text = 'Chargement...', 
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative">
        {/* Spinner principal */}
        <div className={`${sizeClasses[size]} border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin`}></div>
        
        {/* Spinner secondaire pour l'effet de profondeur */}
        <div className={`absolute inset-0 ${sizeClasses[size]} border-4 border-transparent border-t-blue-300 rounded-full animate-spin`} 
             style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
      </div>
      
      {text && (
        <p className="mt-4 text-sm font-medium text-gray-600 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}
