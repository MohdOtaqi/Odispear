import React from 'react';
import { Menu, Search, Users, MoreVertical, Phone, Video } from 'lucide-react';

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick: () => void;
  onMembersClick?: () => void;
  showVoiceCall?: boolean;
  showVideoCall?: boolean;
}

/**
 * Mobile-optimized header with touch-friendly controls
 * Sticky positioning for persistent access
 */

const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  subtitle,
  onMenuClick,
  onMembersClick,
  showVoiceCall,
  showVideoCall
}) => {
  return (
    <div className="sticky top-0 z-30 bg-mot-surface border-b border-mot-border md:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: Menu Button */}
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 hover:bg-mot-surface-subtle rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6 text-gray-300" />
        </button>

        {/* Center: Channel Info */}
        <div className="flex-1 mx-3 min-w-0">
          <h1 className="text-base font-semibold text-white truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-gray-400 truncate">
              {subtitle}
            </p>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {showVoiceCall && (
            <button
              className="p-2 hover:bg-mot-surface-subtle rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Voice call"
            >
              <Phone className="w-5 h-5 text-gray-300" />
            </button>
          )}
          
          {showVideoCall && (
            <button
              className="p-2 hover:bg-mot-surface-subtle rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Video call"
            >
              <Video className="w-5 h-5 text-gray-300" />
            </button>
          )}

          {onMembersClick && (
            <button
              onClick={onMembersClick}
              className="p-2 hover:bg-mot-surface-subtle rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="View members"
            >
              <Users className="w-5 h-5 text-gray-300" />
            </button>
          )}

          <button
            className="p-2 hover:bg-mot-surface-subtle rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="More options"
          >
            <MoreVertical className="w-5 h-5 text-gray-300" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileHeader;
