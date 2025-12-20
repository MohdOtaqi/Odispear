import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'gold' | 'premium';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  pulse?: boolean;
  icon?: React.ReactNode;
}

export const Badge = React.memo<BadgeProps>(({
  children,
  variant = 'default',
  size = 'sm',
  className,
  pulse = false,
  icon
}) => {
  const variants = {
    default: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    success: 'bg-green-500/20 text-green-400 border-green-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    error: 'bg-red-500/20 text-red-400 border-red-500/30',
    info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    gold: 'bg-mot-gold/20 text-mot-gold border-mot-gold/30',
    premium: 'bg-gradient-to-r from-mot-gold/30 to-amber-500/30 text-mot-gold border-mot-gold/50',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <motion.span
      className={cn(
        'relative inline-flex items-center gap-1.5 font-medium rounded-full border',
        variants[variant],
        sizes[size],
        className
      )}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      whileHover={{ scale: 1.05 }}
    >
      {/* Pulse effect */}
      {pulse && (
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-current"
          animate={{ scale: [1, 1.2], opacity: [0.5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
        />
      )}

      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </motion.span>
  );
});

Badge.displayName = 'Badge';
