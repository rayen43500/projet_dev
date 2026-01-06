import React from 'react';
import { LucideIcon } from 'lucide-react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  className?: string;
  dot?: boolean;
}

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  icon: Icon,
  className = '',
  dot = false
}: BadgeProps) {
  const baseClasses = 'inline-flex items-center font-medium rounded-full transition duration-200';
  
  const variantClasses = {
    default: 'bg-gray-50 text-gray-700 border border-gray-100',
    primary: 'bg-primary-50 text-primary-700 border border-primary-100',
    success: 'bg-success-50 text-success-700 border border-success-100',
    warning: 'bg-warning-50 text-warning-700 border border-warning-100',
    danger: 'bg-danger-50 text-danger-700 border border-danger-100',
    info: 'bg-info-50 text-info-700 border border-info-100',
    outline: 'bg-transparent text-gray-700 border border-gray-300'
  };
  
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };
  
  const iconSize = size === 'xs' ? 'w-2 h-2' : size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5';
  const iconMargin = 'mr-1';
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
  
  return (
    <span className={classes}>
      {dot && (
        <div className={`${iconSize} rounded-full bg-current opacity-60 ${iconMargin}`} />
      )}
      {Icon && <Icon className={`${iconSize} ${iconMargin}`} />}
      {children}
    </span>
  );
}
