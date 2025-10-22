import React, { useCallback, useMemo } from 'react';
import { Hash, Volume2, Calendar, Plus, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useGuildStore } from '../../store/guildStore';
import { Tooltip } from '../ui/Tooltip';

interface SidebarProps {
  currentChannelId?: string;
  onChannelSelect: (channelId: string) => void;
  onVoiceChannelJoin?: (channelId: string) => void;
}

const ChannelButton = React.memo<{
  channel: { id: string; name: string; type: string };
  isActive: boolean;
  onClick: () => void;
}>(({ channel, isActive, onClick }) => {
  const Icon = channel.type === 'voice' ? Volume2 : Hash;
  
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-all duration-150',
        'hover:bg-white/10 hover:text-white',
        isActive
          ? 'bg-white/10 text-white'
          : 'text-gray-400'
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="truncate font-medium">{channel.name}</span>
    </button>
  );
});

ChannelButton.displayName = 'ChannelButton';

export const Sidebar = React.memo<SidebarProps>(({
  currentChannelId,
  onChannelSelect,
  onVoiceChannelJoin,
}) => {
  const { currentGuild, channels } = useGuildStore();

  const textChannels = useMemo(() => channels.filter((c) => c.type === 'text'), [channels]);
  const voiceChannels = useMemo(() => channels.filter((c) => c.type === 'voice'), [channels]);

  const handleChannelClick = useCallback((channelId: string) => {
    onChannelSelect(channelId);
  }, [onChannelSelect]);

  if (!currentGuild) {
    return null;
  }

  return (
    <div className="flex-1 bg-[#2b2d31] flex flex-col overflow-hidden">
      {/* Guild Header */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-white/10 shadow-sm hover:bg-white/5 cursor-pointer transition-colors group">
        <h2 className="font-semibold truncate text-white">{currentGuild.name}</h2>
        <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors" />
      </div>

      {/* Channels */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Text Channels */}
        {textChannels.length > 0 && (
          <div className="p-2">
            <div className="flex items-center justify-between px-2 py-1 text-xs font-semibold text-gray-400 uppercase">
              <span className="flex items-center gap-1">
                <ChevronDown className="h-3 w-3" />
                Text Channels
              </span>
              <Tooltip content="Create Channel" position="top">
                <button className="hover:text-white transition-colors" aria-label="Create Channel">
                  <Plus className="h-4 w-4" />
                </button>
              </Tooltip>
            </div>
            <div className="space-y-0.5 mt-1">
              {textChannels.map((channel) => (
                <ChannelButton
                  key={channel.id}
                  channel={channel}
                  isActive={channel.id === currentChannelId}
                  onClick={() => handleChannelClick(channel.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Voice Channels */}
        {voiceChannels.length > 0 && (
          <div className="p-2">
            <div className="flex items-center justify-between px-2 py-1 text-xs font-semibold text-gray-400 uppercase">
              <span className="flex items-center gap-1">
                <ChevronDown className="h-3 w-3" />
                Voice Channels
              </span>
              <Tooltip content="Create Channel" position="top">
                <button className="hover:text-white transition-colors" aria-label="Create Channel">
                  <Plus className="h-4 w-4" />
                </button>
              </Tooltip>
            </div>
            <div className="space-y-0.5 mt-1">
              {voiceChannels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => onVoiceChannelJoin?.(channel.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-all duration-150 hover:bg-white/10 hover:text-white text-gray-400"
                >
                  <Volume2 className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate font-medium">{channel.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <div className="p-2 border-t border-white/10">
        <Tooltip content="Events Calendar" position="top">
          <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-white/10 hover:text-white text-gray-400 transition-all">
            <Calendar className="h-4 w-4" />
            <span>Events</span>
          </button>
        </Tooltip>
      </div>
    </div>
  );
});

Sidebar.displayName = 'Sidebar';
