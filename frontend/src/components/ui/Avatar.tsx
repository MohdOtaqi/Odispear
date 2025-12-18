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
    if (alt) {
      const firstChar = alt.charAt(0);
      if (/\d/.test(firstChar)) return firstChar;
      return firstChar.toUpperCase();
    }
    return '?';
  };

  const getImageUrl = (url?: string) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // For production, use the domain's API endpoint
    const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://n0tmot.com/api' : 'http://localhost:5000');
    return `${apiUrl}${url.startsWith('/') ? url : `/${url}`}`;
  };

  const imageUrl = getImageUrl(src);

  return (
    <div className={cn('relative inline-block flex-shrink-0', className)}>
      <div
        className={cn(
          'rounded-full overflow-hidden bg-gradient-to-br from-mot-gold-light to-mot-gold flex items-center justify-center font-semibold text-mot-black transition-transform duration-200',
          sizeClasses[size],
          onClick && 'cursor-pointer hover:scale-105'
        )}
        onClick={onClick}
      >
        {imageUrl && !imageError ? (
          <img 
            src={imageUrl} 
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
            'absolute bottom-0 right-0 rounded-full border-mot-surface ring-2 ring-mot-surface',
            statusSize[size],
            statusColors[status]
          )}
        />
      )}
    </div>
  );
});
