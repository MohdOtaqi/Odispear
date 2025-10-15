import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.memo(
  React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, label, error, leftIcon, rightIcon, ...props }, ref) => {
      return (
        <div className="w-full">
          {label && (
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              {label}
              {props.required && <span className="text-red-400 ml-1">*</span>}
            </label>
          )}
          <div className="relative">
            {leftIcon && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                {leftIcon}
              </div>
            )}
            <input
              type={type}
              className={cn(
                'flex h-11 w-full rounded-lg border border-white/10 bg-[#1e1f22] px-4 py-2 text-white',
                'text-sm placeholder:text-gray-500 transition-all duration-200',
                'focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'hover:border-white/20',
                leftIcon && 'pl-10',
                rightIcon && 'pr-10',
                error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
                className
              )}
              ref={ref}
              {...props}
            />
            {rightIcon && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {rightIcon}
              </div>
            )}
          </div>
          {error && (
            <p className="mt-1.5 text-sm text-red-400 animate-slide-up">{error}</p>
          )}
        </div>
      );
    }
  )
);

Input.displayName = 'Input';
