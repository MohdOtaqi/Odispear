import React, { useRef } from 'react';
import { cn } from '../../lib/utils';

interface GoldButtonProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline' | 'ghost';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  icon?: React.ReactNode;
}

export const GoldButton: React.FC<GoldButtonProps> = ({
  children,
  size = 'md',
  variant = 'solid',
  className,
  onClick,
  disabled = false,
  type = 'button',
  icon,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    buttonRef.current.style.setProperty('--mouse-x', `${x}%`);
    buttonRef.current.style.setProperty('--mouse-y', `${y}%`);
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm gap-1.5',
    md: 'px-6 py-3 text-base gap-2',
    lg: 'px-8 py-4 text-lg gap-2.5',
  };

  const variants = {
    solid: cn(
      'bg-gradient-to-b from-[#FFD93D] via-[#F5A623] to-[#C4841D]',
      'text-[#0A0A0B] font-bold',
      'shadow-gold-glow-sm',
      'hover:shadow-gold-glow hover:scale-[1.02]',
      'active:scale-[0.98] active:shadow-none',
    ),
    outline: cn(
      'bg-transparent',
      'border-2 border-mot-gold',
      'text-mot-gold font-semibold',
      'hover:bg-mot-gold/10 hover:shadow-gold-glow-sm',
      'active:bg-mot-gold/20',
    ),
    ghost: cn(
      'bg-transparent',
      'text-mot-gold font-medium',
      'hover:bg-mot-gold/10',
      'active:bg-mot-gold/20',
    ),
  };

  return (
    <button
      ref={buttonRef}
      type={type}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      disabled={disabled}
      className={cn(
        // Base styles
        'relative overflow-hidden rounded-xl',
        'transition-all duration-300 ease-out',
        'focus:outline-none focus:ring-2 focus:ring-mot-gold/50 focus:ring-offset-2 focus:ring-offset-mot-black',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
        
        // Flex layout
        'inline-flex items-center justify-center',
        
        // Size
        sizes[size],
        
        // Variant
        variants[variant],
        
        className
      )}
    >
      {/* Radial glow effect that follows cursor */}
      {variant === 'solid' && (
        <span
          className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: `radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.3) 0%, transparent 60%)`
          }}
        />
      )}
      
      {/* Shimmer effect */}
      <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
      
      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {icon}
        {children}
      </span>
    </button>
  );
};

// Magnetic Button variant - follows cursor
export const MagneticGoldButton: React.FC<GoldButtonProps> = (props) => {
  const buttonRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!buttonRef.current) return;
    const { left, top, width, height } = buttonRef.current.getBoundingClientRect();
    const x = (e.clientX - left - width / 2) * 0.2;
    const y = (e.clientY - top - height / 2) * 0.2;
    buttonRef.current.style.transform = `translate(${x}px, ${y}px)`;
  };

  const handleMouseLeave = () => {
    if (buttonRef.current) {
      buttonRef.current.style.transform = 'translate(0, 0)';
    }
  };

  return (
    <div
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="inline-block transition-transform duration-200 ease-out"
    >
      <GoldButton {...props} />
    </div>
  );
};
