import React, { useState } from 'react';
import { cn } from '../../lib/utils';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export const Tooltip = React.memo<TooltipProps>(({ 
  children, 
  content, 
  position = 'top',
  delay = 300
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    const id = setTimeout(() => setIsVisible(true), delay);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    setIsVisible(false);
  };

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && content && (
        <div
          className={cn(
            'absolute z-tooltip px-3 py-1.5 bg-[#1e1f22] text-white text-sm rounded-lg shadow-xl border border-white/10 whitespace-nowrap pointer-events-none animate-scale-in',
            positions[position]
          )}
        >
          {content}
          <div className="absolute w-2 h-2 bg-[#1e1f22] border-white/10 rotate-45" 
            style={{
              [position === 'top' ? 'bottom' : position === 'bottom' ? 'top' : position === 'left' ? 'right' : 'left']: '-4px',
              left: position === 'top' || position === 'bottom' ? '50%' : undefined,
              top: position === 'left' || position === 'right' ? '50%' : undefined,
              transform: position === 'top' || position === 'bottom' ? 'translateX(-50%)' : 'translateY(-50%)',
              borderTop: position === 'bottom' ? '1px solid rgba(255,255,255,0.1)' : 'none',
              borderLeft: position === 'right' ? '1px solid rgba(255,255,255,0.1)' : 'none',
              borderBottom: position === 'top' ? '1px solid rgba(255,255,255,0.1)' : 'none',
              borderRight: position === 'left' ? '1px solid rgba(255,255,255,0.1)' : 'none',
            }}
          />
        </div>
      )}
    </div>
  );
});

Tooltip.displayName = 'Tooltip';
