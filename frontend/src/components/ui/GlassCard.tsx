import React from 'react';
import { cn } from '../../lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'hover' | 'glow' | 'gradient';
  noPadding?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  variant = 'default',
  noPadding = false,
  ...props
}) => {
  const variants = {
    default: 'bg-white/[0.02] border-white/[0.05]',
    hover: 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05] hover:border-white/[0.1] transition-all duration-300',
    glow: 'bg-white/[0.02] border-purple-500/20 shadow-[0_0_30px_rgba(139,92,246,0.15)]',
    gradient: 'bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10 border-white/[0.08]',
  };

  return (
    <div
      className={cn(
        'relative backdrop-blur-xl rounded-2xl border overflow-hidden',
        variants[variant],
        !noPadding && 'p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const GlassCardShine: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500',
      'bg-gradient-to-r from-transparent via-white/[0.05] to-transparent',
      '-translate-x-full group-hover:translate-x-full transition-transform duration-1000',
      className
    )}
  />
);
