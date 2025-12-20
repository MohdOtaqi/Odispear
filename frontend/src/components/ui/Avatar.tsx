import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  status?: 'online' | 'idle' | 'dnd' | 'offline';
  className?: string;
  onClick?: () => void;
  ring?: boolean;
  ringColor?: string;
  animated?: boolean;
}

export const Avatar = React.memo<AvatarProps>(({
  src,
  alt = 'Avatar',
  fallback,
  size = 'md',
  status,
  className,
  onClick,
  ring = false,
  ringColor = 'rgba(212, 175, 55, 0.5)',
  animated = true,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const sizeClasses = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-xl',
    '2xl': 'h-24 w-24 text-2xl',
  };

  const statusSize = {
    xs: 'h-2 w-2 border',
    sm: 'h-2.5 w-2.5 border-2',
    md: 'h-3 w-3 border-2',
    lg: 'h-3.5 w-3.5 border-2',
    xl: 'h-4 w-4 border-2',
    '2xl': 'h-5 w-5 border-2',
  };

  const statusColors = {
    online: 'bg-green-500',
    idle: 'bg-amber-500',
    dnd: 'bg-red-500',
    offline: 'bg-gray-500',
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
    const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://n0tmot.com/api' : 'http://localhost:5000');
    return `${apiUrl}${url.startsWith('/') ? url : `/${url}`}`;
  };

  const imageUrl = getImageUrl(src);

  return (
    <motion.div
      className={cn('relative inline-block flex-shrink-0', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glow ring effect */}
      {ring && animated && (
        <motion.div
          className="absolute -inset-1 rounded-full opacity-0"
          style={{
            background: `radial-gradient(circle, ${ringColor} 0%, transparent 70%)`
          }}
          animate={{
            opacity: isHovered ? 0.8 : 0,
            scale: isHovered ? 1.1 : 1
          }}
          transition={{ duration: 0.2 }}
        />
      )}

      <motion.div
        className={cn(
          'relative rounded-full overflow-hidden bg-gradient-to-br from-mot-gold-light to-mot-gold flex items-center justify-center font-semibold text-mot-black',
          sizeClasses[size],
          onClick && 'cursor-pointer'
        )}
        onClick={onClick}
        whileHover={animated && onClick ? { scale: 1.05 } : undefined}
        whileTap={animated && onClick ? { scale: 0.95 } : undefined}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {imageUrl && !imageError ? (
          <motion.img
            src={imageUrl}
            alt={alt}
            className="h-full w-full object-cover"
            onError={() => setImageError(true)}
            loading="lazy"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          />
        ) : (
          <span>{getFallbackText()}</span>
        )}
      </motion.div>

      {/* Status indicator */}
      {status && (
        <motion.div
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-mot-surface',
            statusSize[size],
            statusColors[status]
          )}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          {/* Pulse animation for online status */}
          {status === 'online' && animated && (
            <motion.div
              className="absolute inset-0 rounded-full bg-green-500"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </motion.div>
      )}
    </motion.div>
  );
});

Avatar.displayName = 'Avatar';
