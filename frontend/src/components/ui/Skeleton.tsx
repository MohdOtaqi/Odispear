import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  count?: number;
  animated?: boolean;
}

export const Skeleton = React.memo<SkeletonProps>(({
  className,
  variant = 'text',
  width,
  height,
  count = 1,
  animated = true
}) => {
  const variants = {
    text: 'h-4 rounded-md',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
    card: 'rounded-2xl',
  };

  const SkeletonElement = ({ index }: { index: number }) => (
    <motion.div
      className={cn(
        'relative overflow-hidden bg-mot-surface-subtle',
        variants[variant],
        className
      )}
      style={{
        width: width || (variant === 'circular' ? height : '100%'),
        height: height || (variant === 'text' ? '1rem' : variant === 'card' ? '200px' : '100%'),
      }}
      initial={{ opacity: 0.5 }}
      animate={animated ? { opacity: [0.5, 0.8, 0.5] } : undefined}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: index * 0.1 }}
    >
      {/* Shimmer effect */}
      {animated && (
        <motion.div
          className="absolute inset-0 -translate-x-full"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
          }}
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: index * 0.1 }}
        />
      )}
    </motion.div>
  );

  if (count === 1) {
    return <SkeletonElement index={0} />;
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonElement key={i} index={i} />
      ))}
    </div>
  );
});

// Preset skeleton layouts
export const SkeletonCard = () => (
  <div className="p-4 space-y-3">
    <Skeleton variant="rectangular" height={150} />
    <Skeleton variant="text" width="80%" />
    <Skeleton variant="text" width="60%" />
  </div>
);

export const SkeletonAvatar = ({ size = 40 }: { size?: number }) => (
  <Skeleton variant="circular" width={size} height={size} />
);

export const SkeletonMessage = () => (
  <div className="flex gap-3 p-3">
    <Skeleton variant="circular" width={40} height={40} />
    <div className="flex-1 space-y-2">
      <Skeleton variant="text" width={120} />
      <Skeleton variant="text" width="80%" />
      <Skeleton variant="text" width="60%" />
    </div>
  </div>
);

Skeleton.displayName = 'Skeleton';
