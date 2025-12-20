import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

export const Tooltip = React.memo<TooltipProps>(({
  children,
  content,
  position = 'top',
  delay = 200,
  className
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

  const animationOrigin = {
    top: { y: 5 },
    bottom: { y: -5 },
    left: { x: 5 },
    right: { x: -5 },
  };

  const arrowPosition = {
    top: { bottom: -4, left: '50%', transform: 'translateX(-50%) rotate(45deg)' },
    bottom: { top: -4, left: '50%', transform: 'translateX(-50%) rotate(45deg)' },
    left: { right: -4, top: '50%', transform: 'translateY(-50%) rotate(45deg)' },
    right: { left: -4, top: '50%', transform: 'translateY(-50%) rotate(45deg)' },
  };

  return (
    <div
      className={cn("relative inline-block", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <AnimatePresence>
        {isVisible && content && (
          <motion.div
            className={cn(
              'absolute z-tooltip px-3 py-2 bg-mot-surface-subtle/95 backdrop-blur-md text-white text-sm rounded-xl shadow-xl border border-mot-border whitespace-nowrap pointer-events-none',
              positions[position]
            )}
            initial={{ opacity: 0, scale: 0.9, ...animationOrigin[position] }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, ...animationOrigin[position] }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            {content}
            {/* Arrow */}
            <div
              className="absolute w-2 h-2 bg-mot-surface-subtle border-mot-border"
              style={{
                ...arrowPosition[position],
                borderTop: position === 'bottom' ? '1px solid' : 'none',
                borderLeft: position === 'right' ? '1px solid' : 'none',
                borderBottom: position === 'top' ? '1px solid' : 'none',
                borderRight: position === 'left' ? '1px solid' : 'none',
                borderColor: 'inherit'
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

Tooltip.displayName = 'Tooltip';
