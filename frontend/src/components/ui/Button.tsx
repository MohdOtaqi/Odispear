import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.memo(
  React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ 
      className, 
      variant = 'primary', 
      size = 'md', 
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props 
    }, ref) => {
      const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus-ring disabled:opacity-50 disabled:cursor-not-allowed';
      
      const variants = {
        primary: 'bg-gradient-to-b from-mot-gold-light via-mot-gold to-mot-gold-deep text-mot-black font-bold shadow-gold-glow-sm hover:shadow-gold-glow hover:scale-[1.02] active:scale-[0.98]',
        secondary: 'bg-mot-surface hover:bg-mot-surface-subtle text-white border border-mot-border hover:border-mot-gold/30',
        success: 'bg-green-600 hover:bg-green-700 text-white shadow-lg',
        danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg',
        ghost: 'hover:bg-mot-gold/10 text-gray-300 hover:text-mot-gold',
        link: 'text-mot-gold hover:text-mot-gold-light hover:underline',
      };

      const sizes = {
        sm: 'h-8 px-3 text-sm rounded-lg',
        md: 'h-10 px-4 text-base rounded-lg',
        lg: 'h-12 px-6 text-lg rounded-xl',
        icon: 'h-10 w-10 rounded-lg',
      };

      return (
        <button
          className={cn(
            baseStyles,
            variants[variant],
            sizes[size],
            loading && 'opacity-70 cursor-wait',
            className
          )}
          ref={ref}
          disabled={disabled || loading}
          {...props}
        >
          {loading ? (
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
              {children}
              {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
            </>
          )}
        </button>
      );
    }
  )
);

Button.displayName = 'Button';
