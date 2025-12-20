import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface SwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked = false,
  onChange,
  disabled = false,
  className = '',
  size = 'md',
  label
}) => {
  const handleClick = () => {
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  const sizes = {
    sm: { track: 'h-5 w-9', thumb: 'h-3.5 w-3.5', translate: 'translateX(16px)' },
    md: { track: 'h-6 w-11', thumb: 'h-4 w-4', translate: 'translateX(20px)' },
    lg: { track: 'h-7 w-14', thumb: 'h-5 w-5', translate: 'translateX(28px)' },
  };

  const currentSize = sizes[size];

  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <motion.button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          'relative inline-flex items-center rounded-full transition-colors',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-mot-gold focus-visible:ring-offset-2 focus-visible:ring-offset-mot-surface',
          currentSize.track,
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        animate={{
          backgroundColor: checked ? '#D4AF37' : '#4B5563',
          boxShadow: checked ? '0 0 15px rgba(212, 175, 55, 0.4)' : 'none'
        }}
        transition={{ duration: 0.2 }}
        whileTap={!disabled ? { scale: 0.95 } : undefined}
      >
        {/* Track glow when active */}
        {checked && (
          <motion.div
            className="absolute inset-0 rounded-full bg-mot-gold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            layoutId="switchGlow"
          />
        )}

        {/* Thumb */}
        <motion.span
          className={cn(
            'absolute left-0.5 rounded-full bg-white shadow-lg',
            currentSize.thumb
          )}
          animate={{
            x: checked ? parseInt(currentSize.translate.match(/\d+/)?.[0] || '0') : 0,
          }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </motion.button>

      {label && (
        <span className={cn(
          "text-sm",
          disabled ? "text-gray-500" : "text-gray-300"
        )}>
          {label}
        </span>
      )}
    </div>
  );
};

export default Switch;
