import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { AlertCircle, Check } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'glass';
}

export const Input = React.memo(
  React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, label, error, success, hint, leftIcon, rightIcon, variant = 'default', ...props }, ref) => {
      const [isFocused, setIsFocused] = useState(false);

      const variants = {
        default: 'bg-mot-surface border-mot-border',
        glass: 'bg-white/5 backdrop-blur-md border-white/10',
      };

      return (
        <div className="w-full">
          {label && (
            <motion.label
              className="block text-sm font-semibold text-gray-300 mb-2"
              animate={{ color: isFocused ? '#D4AF37' : '#D1D5DB' }}
              transition={{ duration: 0.2 }}
            >
              {label}
              {props.required && <span className="text-red-400 ml-1">*</span>}
            </motion.label>
          )}
          <div className="relative group">
            {/* Glow effect on focus */}
            <AnimatePresence>
              {isFocused && !error && (
                <motion.div
                  className="absolute -inset-0.5 bg-gradient-to-r from-mot-gold/50 to-amber-500/50 rounded-xl blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
              )}
            </AnimatePresence>

            {leftIcon && (
              <motion.div
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10"
                animate={{ color: isFocused ? '#D4AF37' : '#9CA3AF' }}
              >
                {leftIcon}
              </motion.div>
            )}

            <motion.input
              type={type}
              className={cn(
                'relative flex h-11 w-full rounded-xl border px-4 py-2 text-white',
                'text-sm placeholder:text-gray-500 transition-colors duration-200',
                'focus:outline-none focus:border-mot-gold',
                'disabled:cursor-not-allowed disabled:opacity-50',
                variants[variant],
                leftIcon && 'pl-10',
                rightIcon && 'pr-10',
                error && 'border-red-500 focus:border-red-500',
                success && 'border-green-500 focus:border-green-500',
                className
              )}
              ref={ref}
              onFocus={(e) => {
                setIsFocused(true);
                props.onFocus?.(e);
              }}
              onBlur={(e) => {
                setIsFocused(false);
                props.onBlur?.(e);
              }}
              {...props}
            />

            {rightIcon && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 z-10">
                {rightIcon}
              </div>
            )}

            {/* Success/Error icons */}
            {(error || success) && !rightIcon && (
              <motion.div
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                {error ? (
                  <AlertCircle className="w-5 h-5 text-red-400" />
                ) : (
                  <Check className="w-5 h-5 text-green-400" />
                )}
              </motion.div>
            )}
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.p
                className="mt-1.5 text-sm text-red-400 flex items-center gap-1"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
              >
                {error}
              </motion.p>
            )}
            {hint && !error && (
              <motion.p
                className="mt-1.5 text-sm text-gray-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {hint}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      );
    }
  )
);

Input.displayName = 'Input';
