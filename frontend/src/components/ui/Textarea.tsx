import React, { forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { AlertCircle } from 'lucide-react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
  hint?: string;
  variant?: 'default' | 'glass';
  showCount?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, label, hint, variant = 'default', showCount, maxLength, className = '', ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [charCount, setCharCount] = useState(props.value?.toString().length || 0);

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

          <textarea
            ref={ref}
            maxLength={maxLength}
            className={cn(
              'relative w-full min-h-[100px] px-4 py-3 rounded-xl border text-white',
              'placeholder:text-gray-500 resize-none',
              'focus:outline-none focus:border-mot-gold',
              'transition-colors duration-200',
              variants[variant],
              error && 'border-red-500 focus:border-red-500',
              className
            )}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            onChange={(e) => {
              setCharCount(e.target.value.length);
              props.onChange?.(e);
            }}
            {...props}
          />
        </div>

        <div className="flex justify-between items-center mt-1.5">
          <AnimatePresence mode="wait">
            {error ? (
              <motion.p
                className="text-sm text-red-400 flex items-center gap-1"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
              >
                <AlertCircle className="w-4 h-4" />
                {error}
              </motion.p>
            ) : hint ? (
              <motion.p className="text-sm text-gray-500">
                {hint}
              </motion.p>
            ) : (
              <span />
            )}
          </AnimatePresence>

          {showCount && maxLength && (
            <motion.span
              className={cn(
                "text-sm",
                charCount >= maxLength ? "text-red-400" : "text-gray-500"
              )}
              animate={{
                scale: charCount >= maxLength * 0.9 ? [1, 1.1, 1] : 1
              }}
            >
              {charCount}/{maxLength}
            </motion.span>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
