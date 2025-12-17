import React, { useState, useRef, useEffect } from 'react';
import { 
  Settings, UserPlus, LogOut, Shield, FolderPlus,
  ChevronDown, Plus, Palette, Bell 
} from 'lucide-react';
import { useGuildStore } from '../../store/guildStore';
import { useAuthStore } from '../../store/authStore';

interface ServerDropdownProps {
  onOpenServerSettings: () => void;
  onOpenInvite: () => void;
  onCreateChannel: () => void;
  onCreateCategory: () => void;
  onLeaveServer?: () => void;
}

export const ServerDropdown: React.FC<ServerDropdownProps> = ({
  onOpenServerSettings,
  onOpenInvite,
  onCreateChannel,
  onCreateCategory,
  onLeaveServer
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { currentGuild } = useGuildStore();
  const { user } = useAuthStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!currentGuild) return null;

  const isOwner = currentGuild.owner_id === user?.id;

  return (
    <div ref={dropdownRef} className="relative">
      {/* Server Header Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-12 px-4 flex items-center justify-between border-b border-white/10 hover:bg-white/5 transition-colors group"
      >
        <h2 className="font-semibold truncate text-white">{currentGuild.name}</h2>
        <ChevronDown 
          className={`h-4 w-4 text-gray-400 group-hover:text-white transition-all ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-mot-surface border border-mot-border rounded-b-lg shadow-xl z-50 overflow-hidden animate-slide-down">
          <div className="py-2">
            {/* Invite People */}
            <button
              onClick={() => {
                onOpenInvite();
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 flex items-center gap-3 hover:bg-mot-gold/20 text-mot-gold hover:text-mot-gold-light transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              <span className="text-sm font-medium">Invite People</span>
            </button>

            {/* Server Settings (Owner/Admin only) */}
            {isOwner && (
              <button
                onClick={() => {
                  onOpenServerSettings();
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 flex items-center gap-3 hover:bg-white/5 text-gray-300 hover:text-white transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span className="text-sm font-medium">Server Settings</span>
              </button>
            )}

            <div className="my-1 border-t border-white/10" />

            {/* Create Channel */}
            <button
              onClick={() => {
                onCreateChannel();
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 flex items-center gap-3 hover:bg-white/5 text-gray-300 hover:text-white transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm font-medium">Create Channel</span>
            </button>

            {/* Create Category */}
            <button
              onClick={() => { onCreateCategory(); setIsOpen(false); }}
              className="w-full px-3 py-2 flex items-center gap-3 hover:bg-white/5 text-gray-300 hover:text-white transition-colors"
            >
              <FolderPlus className="h-4 w-4" />
              <span className="text-sm font-medium">Create Category</span>
            </button>

            <div className="my-1 border-t border-white/10" />

            {/* Notification Settings */}
            <button
              className="w-full px-3 py-2 flex items-center gap-3 hover:bg-white/5 text-gray-300 hover:text-white transition-colors"
            >
              <Bell className="h-4 w-4" />
              <span className="text-sm font-medium">Notification Settings</span>
            </button>

            {/* Privacy Settings */}
            <button
              className="w-full px-3 py-2 flex items-center gap-3 hover:bg-white/5 text-gray-300 hover:text-white transition-colors"
            >
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">Privacy Settings</span>
            </button>

            {!isOwner && (
              <>
                <div className="my-1 border-t border-white/10" />
                
                {/* Leave Server */}
                <button
                  onClick={() => {
                    if (onLeaveServer) {
                      onLeaveServer();
                    }
                    setIsOpen(false);
                  }}
                  className="w-full px-3 py-2 flex items-center gap-3 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm font-medium">Leave Server</span>
                </button>
              </>
            )}
          </div>

          {/* Server Boost Status */}
          <div className="px-3 py-2 border-t border-mot-border bg-mot-gold/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-mot-gold" />
                <span className="text-xs text-gray-400">Server Boost</span>
              </div>
              <span className="text-xs text-mot-gold font-bold">Level 0</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slide-down {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-slide-down {
    animation: slide-down 0.2s ease-out;
  }
`;
document.head.appendChild(style);
