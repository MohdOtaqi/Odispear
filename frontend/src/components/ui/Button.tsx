import React, { useRef, useState } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';

interface ButtonProps extends Omit<HTMLMotionProps<"button">, 'size'> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'link' | 'outline' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  ripple?: boolean;
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
      ripple = true,
      children,
      disabled,
      onClick,
      ...props
    }, ref) => {
      const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
      const buttonRef = useRef<HTMLButtonElement>(null);

      const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (ripple && buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const id = Date.now();

          setRipples(prev => [...prev, { x, y, id }]);
          setTimeout(() => {
            setRipples(prev => prev.filter(r => r.id !== id));
          }, 600);
        }
        onClick?.(e);
      };

      const baseStyles = 'relative inline-flex items-center justify-center gap-2 font-medium overflow-hidden transition-colors duration-200 focus-ring disabled:opacity-50 disabled:cursor-not-allowed';

      const variants = {
        primary: 'bg-gradient-to-b from-mot-gold-light via-mot-gold to-mot-gold-deep text-mot-black font-bold shadow-lg',
        secondary: 'bg-mot-surface hover:bg-mot-surface-subtle text-white border border-mot-border hover:border-mot-gold/50',
        success: 'bg-gradient-to-b from-green-500 to-green-600 text-white shadow-lg shadow-green-500/25',
        danger: 'bg-gradient-to-b from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25',
        ghost: 'hover:bg-mot-gold/10 text-gray-300 hover:text-mot-gold',
        link: 'text-mot-gold hover:text-mot-gold-light hover:underline underline-offset-4',
        outline: 'border-2 border-mot-gold text-mot-gold bg-transparent hover:bg-mot-gold/10',
        glass: 'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 shadow-xl',
      };

      const sizes = {
        sm: 'h-8 px-3 text-sm rounded-lg',
        md: 'h-10 px-4 text-base rounded-xl',
        lg: 'h-12 px-6 text-lg rounded-xl',
        icon: 'h-10 w-10 rounded-xl',
      };

      const hoverEffects = {
        primary: { scale: 1.02, boxShadow: "0 0 30px rgba(212, 175, 55, 0.5)" },
        secondary: { scale: 1.02 },
        success: { scale: 1.02, boxShadow: "0 0 25px rgba(34, 197, 94, 0.4)" },
        danger: { scale: 1.02, boxShadow: "0 0 25px rgba(239, 68, 68, 0.4)" },
        ghost: { scale: 1.02 },
        link: { scale: 1 },
        outline: { scale: 1.02, boxShadow: "0 0 20px rgba(212, 175, 55, 0.3)" },
        glass: { scale: 1.02, boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)" },
      };

      return (
        <motion.button
          ref={(node) => {
            (buttonRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
          }}
          className={cn(
            baseStyles,
            variants[variant],
            sizes[size],
            loading && 'opacity-70 cursor-wait',
            className
          )}
          disabled={disabled || loading}
          onClick={handleClick}
          whileHover={!disabled ? hoverEffects[variant] : undefined}
          whileTap={!disabled ? { scale: 0.98 } : undefined}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          {...props}
        >
          {/* Ripple effects */}
          {ripples.map(({ x, y, id }) => (
            <motion.span
              key={id}
              className="absolute bg-white/30 rounded-full pointer-events-none"
              initial={{ width: 0, height: 0, x, y, opacity: 0.5 }}
              animate={{ width: 300, height: 300, x: x - 150, y: y - 150, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          ))}

          {/* Content */}
          {loading ? (
            <motion.div
              className="h-4 w-4 border-2 border-current border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          ) : (
            <>
              {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
              {children}
              {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
            </>
          )}
        </motion.button>
      );
    }
  )
);

Button.displayName = 'Button';
