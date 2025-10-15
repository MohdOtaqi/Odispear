import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface NotificationToastProps {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const config = {
    success: {
      icon: CheckCircle,
      bgClass: 'from-green-900/90 to-emerald-900/90',
      iconColor: 'text-green-400',
      borderColor: 'border-green-500/50',
    },
    error: {
      icon: AlertCircle,
      bgClass: 'from-red-900/90 to-pink-900/90',
      iconColor: 'text-red-400',
      borderColor: 'border-red-500/50',
    },
    warning: {
      icon: AlertTriangle,
      bgClass: 'from-yellow-900/90 to-orange-900/90',
      iconColor: 'text-yellow-400',
      borderColor: 'border-yellow-500/50',
    },
    info: {
      icon: Info,
      bgClass: 'from-blue-900/90 to-cyan-900/90',
      iconColor: 'text-blue-400',
      borderColor: 'border-blue-500/50',
    },
  };

  const { icon: Icon, bgClass, iconColor, borderColor } = config[type];

  return (
    <div
      className={`
        min-w-[320px] max-w-md bg-gradient-to-r ${bgClass} backdrop-blur-lg
        border ${borderColor} rounded-lg shadow-2xl p-4
        animate-slide-in-right hover-lift
      `}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`${iconColor} flex-shrink-0 animate-scale-in`}>
          <Icon className="w-6 h-6" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white mb-1">{title}</h4>
          {message && <p className="text-sm text-gray-300">{message}</p>}
        </div>

        {/* Close Button */}
        <button
          onClick={() => onClose(id)}
          className="flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4 text-gray-400 hover:text-white" />
        </button>
      </div>

      {/* Progress Bar */}
      {duration > 0 && (
        <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-white/50 rounded-full"
            style={{
              animation: `shrink ${duration}ms linear`,
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default NotificationToast;
