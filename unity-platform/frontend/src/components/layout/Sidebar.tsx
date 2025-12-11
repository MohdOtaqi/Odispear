import React, { useCallback, useMemo, useState } from 'react';
import { Hash, Volume2, Calendar, Plus, ChevronDown, ChevronRight, MicOff, Mic, Headphones, Settings, PhoneOff, Signal } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useGuildStore } from '../../store/guildStore';
import { Tooltip } from '../ui/Tooltip';
import { Avatar } from '../ui/Avatar';
import { useVoiceChat } from '../VoiceChat/VoiceChatProvider';
import { useVoiceUsersStore } from '../../store/voiceUsersStore';

interface Channel {
  id: string;
  name: string;
  type: string;
  parent_id?: string | null;
}

interface VoiceUser {
  id: string;
  username: string;
  avatar_url?: string;
  muted?: boolean;
}

interface SidebarProps {
  currentChannelId?: string;
  onChannelSelect: (channelId: string) => void;
  onVoiceChannelJoin?: (channelId: string) => void;
  onVoiceChannelClick?: (channelId: string) => void;
  onOpenServerSettings?: () => void;
  onOpenInvite?: () => void;
  onCreateChannel?: (type: 'text' | 'voice') => void;
  voiceChannelUsers?: Record<string, VoiceUser[]>;
}

const ChannelButton = React.memo<{
  channel: Channel;
  isActive: boolean;
  onClick: () => void;
}>(({ channel, isActive, onClick }) => {
  const Icon = channel.type === 'voice' ? Volume2 : Hash;
  
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-all duration-150',
        'hover:bg-mot-gold/10 hover:text-white',
        isActive
          ? 'bg-mot-gold/20 text-white border-l-2 border-mot-gold'
          : 'text-gray-400'
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="truncate font-medium">{channel.name}</span>
    </button>
  );
});

ChannelButton.displayName = 'ChannelButton';

// Voice Channel with users shown below
const VoiceChannelButton = React.memo<{
  channel: Channel;
  isActive: boolean;
  users: VoiceUser[];
  onJoin: () => void;
  isConnected: boolean;
}>(({ channel, isActive, users, onJoin, isConnected }) => {
  return (
    <div className="space-y-0.5">
      <button
        onClick={onJoin}
        className={cn(
          'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-all duration-150',
          'hover:bg-mot-gold/10 hover:text-white',
          isActive
            ? 'bg-mot-gold/20 text-white'
            : 'text-gray-400'
        )}
      >
        <Volume2 className={cn("h-4 w-4 flex-shrink-0", isConnected && "text-green-400")} />
        <span className="truncate font-medium">{channel.name}</span>
      </button>
      
      {/* Users in voice channel */}
      {users.length > 0 && (
        <div className="ml-6 space-y-0.5">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-2 px-2 py-1 text-sm text-gray-300"
            >
              <Avatar
                src={user.avatar_url}
                alt={user.username}
                size="xs"
                fallback={user.username.charAt(0)}
              />
              <span className="truncate text-xs">{user.username}</span>
              {user.muted && <MicOff className="h-3 w-3 text-red-400 ml-auto" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

VoiceChannelButton.displayName = 'VoiceChannelButton';

export const Sidebar = React.memo<SidebarProps>(({
  currentChannelId,
  onChannelSelect,
  onVoiceChannelJoin,
  onCreateChannel,
  voiceChannelUsers = {},
}) => {
  const { currentGuild, channels } = useGuildStore();
  const { isConnected, channelId: connectedVoiceChannelId, localParticipant, toggleMute, toggleDeafen, leaveChannel, isDeafened } = useVoiceChat();
  
  // Get voice users from the global store (populated by WebSocket events)
  const storeVoiceUsers = useVoiceUsersStore(state => state.voiceChannelUsers);
  
  // Merge store users with prop-based users (fallback)
  const mergedVoiceUsers = { ...voiceChannelUsers, ...storeVoiceUsers };
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  // Organize channels by category
  const { categories, uncategorizedText, uncategorizedVoice } = useMemo(() => {
    const cats = channels.filter((c: Channel) => c.type === 'category');
    const uncatText = channels.filter((c: Channel) => c.type === 'text' && !c.parent_id);
    const uncatVoice = channels.filter((c: Channel) => c.type === 'voice' && !c.parent_id);
    return { categories: cats, uncategorizedText: uncatText, uncategorizedVoice: uncatVoice };
  }, [channels]);

  const getChannelsInCategory = useCallback((categoryId: string) => {
    return channels.filter((c: Channel) => c.parent_id === categoryId && c.type !== 'category');
  }, [channels]);

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const handleChannelClick = useCallback((channelId: string) => {
    onChannelSelect(channelId);
  }, [onChannelSelect]);

  if (!currentGuild) {
    return null;
  }

  return (
    <div className="flex-1 bg-mot-surface flex flex-col overflow-hidden">
      {/* Channels */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
        {/* Categories with their channels */}
        {categories.map((category: Channel) => {
          const categoryChannels = getChannelsInCategory(category.id);
          const isCollapsed = collapsedCategories.has(category.id);
          
          return (
            <div key={category.id}>
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between px-2 py-1 text-xs font-semibold text-gray-400 uppercase hover:text-white transition-colors"
              >
                <span className="flex items-center gap-1">
                  {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {category.name}
                </span>
                <Tooltip content="Create Channel" position="top">
                  <span 
                    onClick={(e) => { e.stopPropagation(); onCreateChannel?.('text'); }}
                    className="hover:text-mot-gold transition-colors cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                  </span>
                </Tooltip>
              </button>
              {!isCollapsed && (
                <div className="space-y-0.5 mt-1 ml-2">
                  {categoryChannels.map((channel: Channel) => (
                    channel.type === 'voice' ? (
                      <VoiceChannelButton
                        key={channel.id}
                        channel={channel}
                        isActive={channel.id === currentChannelId}
                        users={mergedVoiceUsers[channel.id] || []}
                        onJoin={() => onVoiceChannelJoin?.(channel.id)}
                        isConnected={isConnected && connectedVoiceChannelId === channel.id}
                      />
                    ) : (
                      <ChannelButton
                        key={channel.id}
                        channel={channel}
                        isActive={channel.id === currentChannelId}
                        onClick={() => handleChannelClick(channel.id)}
                      />
                    )
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Uncategorized Text Channels */}
        {uncategorizedText.length > 0 && (
          <div>
            <div className="flex items-center justify-between px-2 py-1 text-xs font-semibold text-gray-400 uppercase">
              <span className="flex items-center gap-1">
                <ChevronDown className="h-3 w-3" />
                Text Channels
              </span>
              <Tooltip content="Create Text Channel" position="top">
                <button 
                  onClick={() => onCreateChannel?.('text')}
                  className="hover:text-mot-gold transition-colors" 
                  aria-label="Create Text Channel"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </Tooltip>
            </div>
            <div className="space-y-0.5 mt-1">
              {uncategorizedText.map((channel: Channel) => (
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

        {/* Uncategorized Voice Channels */}
        {uncategorizedVoice.length > 0 && (
          <div>
            <div className="flex items-center justify-between px-2 py-1 text-xs font-semibold text-gray-400 uppercase">
              <span className="flex items-center gap-1">
                <ChevronDown className="h-3 w-3" />
                Voice Channels
              </span>
              <Tooltip content="Create Voice Channel" position="top">
                <button 
                  onClick={() => onCreateChannel?.('voice')}
                  className="hover:text-mot-gold transition-colors" 
                  aria-label="Create Voice Channel"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </Tooltip>
            </div>
            <div className="space-y-0.5 mt-1">
              {uncategorizedVoice.map((channel: Channel) => (
                <VoiceChannelButton
                  key={channel.id}
                  channel={channel}
                  isActive={channel.id === currentChannelId}
                  users={mergedVoiceUsers[channel.id] || []}
                  onJoin={() => onVoiceChannelJoin?.(channel.id)}
                  isConnected={isConnected && connectedVoiceChannelId === channel.id}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Voice Connected Panel - Shows when in voice */}
      {isConnected && connectedVoiceChannelId && (
        <div className="border-t border-white/10 bg-mot-surface-subtle">
          {/* Voice Status */}
          <div className="p-2">
            <div className="flex items-center gap-2 mb-2">
              <Signal className="h-4 w-4 text-green-400" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-green-400">Voice Connected</p>
                <p className="text-xs text-gray-400 truncate">
                  {channels.find((c: Channel) => c.id === connectedVoiceChannelId)?.name || 'Voice Channel'} / {currentGuild?.name}
                </p>
              </div>
            </div>
            
            {/* Voice Controls */}
            <div className="flex items-center gap-1">
              <Tooltip content={localParticipant?.audio === false ? 'Unmute' : 'Mute'} position="top">
                <button
                  onClick={toggleMute}
                  className={cn(
                    'flex-1 p-2 rounded-md transition-colors flex items-center justify-center',
                    localParticipant?.audio === false
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      : 'hover:bg-white/10 text-gray-400 hover:text-white'
                  )}
                >
                  {localParticipant?.audio === false ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
              </Tooltip>
              
              <Tooltip content={isDeafened ? 'Undeafen' : 'Deafen'} position="top">
                <button
                  onClick={toggleDeafen}
                  className={cn(
                    'flex-1 p-2 rounded-md transition-colors flex items-center justify-center',
                    isDeafened
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      : 'hover:bg-white/10 text-gray-400 hover:text-white'
                  )}
                >
                  <Headphones className="h-4 w-4" />
                </button>
              </Tooltip>
              
              <Tooltip content="Settings" position="top">
                <button
                  className="flex-1 p-2 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors flex items-center justify-center"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </Tooltip>
              
              <Tooltip content="Disconnect" position="top">
                <button
                  onClick={leaveChannel}
                  className="flex-1 p-2 rounded-md bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex items-center justify-center"
                >
                  <PhoneOff className="h-4 w-4" />
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      )}

      {/* Events Button - Only show when not in voice */}
      {!isConnected && (
        <div className="p-2 border-t border-white/10">
          <Tooltip content="Events Calendar" position="top">
            <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-white/10 hover:text-white text-gray-400 transition-all">
              <Calendar className="h-4 w-4" />
              <span>Events</span>
            </button>
          </Tooltip>
        </div>
      )}
    </div>
  );
});

Sidebar.displayName = 'Sidebar';
