import React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  count?: number;
}

export const Skeleton = React.memo<SkeletonProps>(({ 
  className,
  variant = 'text',
  width,
  height,
  count = 1
}) => {
  const variants = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const skeletonElement = (
    <div
      className={cn(
        'skeleton bg-white/5',
        variants[variant],
        className
      )}
      style={{
        width: width || (variant === 'circular' ? height : '100%'),
        height: height || (variant === 'text' ? '1rem' : '100%'),
      }}
    />
  );

  if (count === 1) {
    return skeletonElement;
  }

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={i > 0 ? 'mt-2' : ''}>
          {skeletonElement}
        </div>
      ))}
    </>
  );
});

Skeleton.displayName = 'Skeleton';
