import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge = React.memo<BadgeProps>(({ 
  children, 
  variant = 'default',
  size = 'sm',
  className 
}) => {
  const variants = {
    default: 'bg-purple-600/20 text-purple-400 border-purple-500/30',
    success: 'bg-green-600/20 text-green-400 border-green-500/30',
    warning: 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30',
    error: 'bg-red-600/20 text-red-400 border-red-500/30',
    info: 'bg-blue-600/20 text-blue-400 border-blue-500/30',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-full border',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';
