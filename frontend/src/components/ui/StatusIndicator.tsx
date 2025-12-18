import React from 'react';

interface StatusIndicatorProps {
  status: 'online' | 'idle' | 'dnd' | 'offline';
  size?: 'sm' | 'md' | 'lg';
  showRing?: boolean;
  className?: string;
}

/**
 * Modern Status Indicator
 * Following 2025 design patterns with animated rings and clear states
 */

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = 'md',
  showRing = true,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const statusConfig = {
    online: {
      color: 'bg-green-500',
      ring: 'ring-green-500/50',
      label: 'Online'
    },
    idle: {
      color: 'bg-yellow-500',
      ring: 'ring-yellow-500/50',
      label: 'Idle'
    },
    dnd: {
      color: 'bg-red-500',
      ring: 'ring-red-500/50',
      label: 'Do Not Disturb'
    },
    offline: {
      color: 'bg-gray-500',
      ring: 'ring-gray-500/50',
      label: 'Offline'
    }
  };

  const config = statusConfig[status];

  return (
    <div 
      className={`relative inline-flex ${className}`}
      title={config.label}
      role="status"
      aria-label={config.label}
    >
      <span
        className={`
          ${sizeClasses[size]}
          ${config.color}
          rounded-full
          ${showRing && status !== 'offline' ? `ring-2 ${config.ring} animate-pulse` : ''}
          transition-all
        `}
      />
      {status === 'dnd' && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="w-1/2 h-0.5 bg-mot-black rounded-full" />
        </span>
      )}
    </div>
  );
};

export default StatusIndicator;
