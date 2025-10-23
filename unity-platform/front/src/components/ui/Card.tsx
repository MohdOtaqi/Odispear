import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glass?: boolean;
  onClick?: () => void;
}

export const Card = React.memo<CardProps>(({ 
  children, 
  className, 
  hover = false,
  glass = false,
  onClick 
}) => {
  return (
    <div
      className={cn(
        'rounded-xl p-6 border transition-all duration-200',
        glass 
          ? 'glass-effect border-white/5' 
          : 'bg-[#2b2d31] border-white/10',
        hover && 'hover:border-purple-500/30 hover-lift cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';
