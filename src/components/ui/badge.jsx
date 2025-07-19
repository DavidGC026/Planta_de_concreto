import React from 'react';
import { cn } from '@/lib/utils';

const Badge = ({ 
  children, 
  variant = 'default', 
  size = 'default',
  className = '',
  ...props 
}) => {
  const baseStyles = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors";
  
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/80",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/80",
    outline: "text-foreground border border-input bg-background hover:bg-accent hover:text-accent-foreground"
  };

  const sizes = {
    default: "text-xs",
    sm: "text-[10px]",
    lg: "text-sm px-3 py-1"
  };

  // Fallback variants usando colores específicos
  const variantStyles = {
    default: "bg-blue-100 text-blue-800 border-blue-200",
    secondary: "bg-gray-100 text-gray-800 border-gray-200", 
    destructive: "bg-red-100 text-red-800 border-red-200",
    outline: "bg-white text-gray-700 border-gray-300"
  };

  const sizeStyles = {
    default: "text-xs px-2.5 py-0.5",
    sm: "text-[10px] px-2 py-0.5",
    lg: "text-sm px-3 py-1"
  };

  return (
    <div 
      className={cn(
        baseStyles,
        variantStyles[variant] || variantStyles.default,
        sizeStyles[size] || sizeStyles.default,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export { Badge };
