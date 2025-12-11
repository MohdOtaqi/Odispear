import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline' | 'glow';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  icon,
  iconPosition = 'left',
  ...props
}) => {
  const variants = {
    primary: `
      bg-gradient-to-r from-purple-600 to-blue-600 
      hover:from-purple-500 hover:to-blue-500
      text-white font-semibold
      shadow-lg shadow-purple-500/25
      hover:shadow-xl hover:shadow-purple-500/40
      hover:-translate-y-0.5
      active:translate-y-0 active:shadow-md
    `,
    secondary: `
      bg-white/[0.05] hover:bg-white/[0.1]
      border border-white/[0.1] hover:border-white/[0.2]
      text-white
      hover:-translate-y-0.5
    `,
    ghost: `
      bg-transparent hover:bg-white/[0.05]
      text-gray-300 hover:text-white
    `,
    danger: `
      bg-gradient-to-r from-red-600 to-pink-600
      hover:from-red-500 hover:to-pink-500
      text-white font-semibold
      shadow-lg shadow-red-500/25
      hover:shadow-xl hover:shadow-red-500/40
      hover:-translate-y-0.5
    `,
    success: `
      bg-gradient-to-r from-emerald-600 to-teal-600
      hover:from-emerald-500 hover:to-teal-500
      text-white font-semibold
      shadow-lg shadow-emerald-500/25
      hover:shadow-xl hover:shadow-emerald-500/40
      hover:-translate-y-0.5
    `,
    outline: `
      bg-transparent
      border-2 border-purple-500/50 hover:border-purple-400
      text-purple-400 hover:text-purple-300
      hover:bg-purple-500/10
      hover:-translate-y-0.5
    `,
    glow: `
      bg-gradient-to-r from-purple-600 to-blue-600
      text-white font-semibold
      shadow-[0_0_20px_rgba(139,92,246,0.5)]
      hover:shadow-[0_0_30px_rgba(139,92,246,0.7)]
      hover:-translate-y-0.5
      animate-pulse-subtle
    `,
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
    md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
    lg: 'px-6 py-3 text-base rounded-xl gap-2',
    xl: 'px-8 py-4 text-lg rounded-2xl gap-3',
  };

  return (
    <button
      className={cn(
        'relative inline-flex items-center justify-center',
        'transition-all duration-200 ease-out',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
        'focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 focus:ring-offset-transparent',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>}
          <span>{children}</span>
          {icon && iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
        </>
      )}
    </button>
  );
};
