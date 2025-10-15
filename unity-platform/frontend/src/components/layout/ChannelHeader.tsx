import React from 'react';
import { Hash, Volume2, Users, Bell, Search, Pin, Settings } from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';

interface ChannelHeaderProps {
  channelName: string;
  channelType?: 'text' | 'voice';
  topic?: string;
  memberCount?: number;
  onToggleMembers?: () => void;
  onOpenSettings?: () => void;
}

export const ChannelHeader = React.memo<ChannelHeaderProps>(({
  channelName,
  channelType = 'text',
  topic,
  memberCount,
  onToggleMembers,
  onOpenSettings,
}) => {
  const Icon = channelType === 'voice' ? Volume2 : Hash;

  return (
    <div className="h-12 px-4 flex items-center justify-between border-b border-white/10 shadow-sm bg-[#313338]">
      {/* Left: Channel Info */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Icon className="w-5 h-5 text-gray-400 flex-shrink-0" />
        <h1 className="font-semibold text-white truncate">{channelName}</h1>
        {topic && (
          <>
            <div className="w-px h-6 bg-white/10" />
            <p className="text-sm text-gray-400 truncate">{topic}</p>
          </>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        <Tooltip content="Notification Settings" position="bottom">
          <button
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Notification Settings"
          >
            <Bell className="w-5 h-5" />
          </button>
        </Tooltip>

        <Tooltip content="Pinned Messages" position="bottom">
          <button
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Pinned Messages"
          >
            <Pin className="w-5 h-5" />
          </button>
        </Tooltip>

        {memberCount !== undefined && (
          <Tooltip content="Member List" position="bottom">
            <button
              onClick={onToggleMembers}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Member List"
            >
              <Users className="w-5 h-5" />
            </button>
          </Tooltip>
        )}

        <Tooltip content="Search" position="bottom">
          <button
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>
        </Tooltip>

        {onOpenSettings && (
          <Tooltip content="Channel Settings" position="bottom">
            <button
              onClick={onOpenSettings}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Channel Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
});

ChannelHeader.displayName = 'ChannelHeader';
