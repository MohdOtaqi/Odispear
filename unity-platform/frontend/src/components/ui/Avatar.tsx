import React, { useState } from 'react';
import { cn } from '../../lib/utils';

interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'idle' | 'dnd' | 'offline';
  className?: string;
  onClick?: () => void;
}

export const Avatar = React.memo<AvatarProps>(({
  src,
  alt = 'Avatar',
  fallback,
  size = 'md',
  status,
  className,
  onClick,
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-xl',
  };

  const statusSize = {
    xs: 'h-2 w-2 border',
    sm: 'h-2.5 w-2.5 border-2',
    md: 'h-3 w-3 border-2',
    lg: 'h-3.5 w-3.5 border-2',
    xl: 'h-4 w-4 border-2',
  };

  const statusColors = {
    online: 'bg-[#23a559]',
    idle: 'bg-[#f0b232]',
    dnd: 'bg-[#f23f43]',
    offline: 'bg-[#80848e]',
  };

  const getFallbackText = () => {
    if (fallback) return fallback;
    if (alt) return alt.charAt(0).toUpperCase();
    return '?';
  };

  return (
    <div className={cn('relative inline-block flex-shrink-0', className)}>
      <div
        className={cn(
          'rounded-full overflow-hidden bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center font-semibold text-white transition-transform duration-200',
          sizeClasses[size],
          onClick && 'cursor-pointer hover:scale-105'
        )}
        onClick={onClick}
      >
        {src && !imageError ? (
          <img 
            src={src} 
            alt={alt} 
            className="h-full w-full object-cover"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <span>{getFallbackText()}</span>
        )}
      </div>
      {status && (
        <div
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-[#1e1f22] ring-2 ring-[#1e1f22]',
            statusSize[size],
            statusColors[status]
          )}
        />
      )}
    </div>
  );
});
