import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

export default function Card({ 
  children, 
  className = '', 
  hover = false,
  padding = 'md',
  variant = 'default',
  rounded = 'xl'
}: CardProps) {
  const baseClasses = 'bg-white transition-all duration-200 electron-card';
  
  const variantClasses = {
    default: 'border border-gray-200 shadow-md',
    elevated: 'border border-gray-200 shadow-lg',
    outlined: 'border-2 border-gray-300 shadow-none bg-white',
    filled: 'bg-gray-50 border border-gray-200 shadow-sm'
  };
  
  const hoverClasses = hover ? 'hover:shadow-lg hover:border-gray-300 cursor-pointer' : '';
  
  const paddingClasses = {
    none: '',
    xs: 'p-2',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };
  
  const roundedClasses = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl'
  };
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${hoverClasses} ${paddingClasses[padding]} ${roundedClasses[rounded]} ${className}`;
  
  return (
    <div className={classes}>
      {children}
    </div>
  );
}
