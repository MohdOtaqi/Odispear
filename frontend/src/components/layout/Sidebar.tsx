import React, { useCallback, useMemo, useState } from 'react';
import { UserProfileModal } from '../UserProfileModal';
import { Hash, Volume2, Calendar, Plus, ChevronDown, ChevronRight, MicOff, Mic, Headphones, Settings, PhoneOff, Signal, Video, Monitor, Wifi } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useGuildStore } from '../../store/guildStore';
import { useAuthStore } from '../../store/authStore';
import { Tooltip } from '../ui/Tooltip';
import { Avatar } from '../ui/Avatar';
import { useVoiceChat } from '../VoiceChat/LiveKitProvider';
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
  deafened?: boolean;
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
        'w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-all duration-200 group',
        'hover:bg-mot-gold/10',
        isActive
          ? 'bg-mot-gold/15 text-white'
          : 'text-gray-400 hover:text-white'
      )}
    >
      <div className={cn(
        'p-1 rounded-md transition-colors',
        isActive ? 'bg-mot-gold/20' : 'bg-transparent group-hover:bg-mot-gold/10'
      )}>
        <Icon className={cn(
          "h-4 w-4 flex-shrink-0 transition-colors",
          isActive && "text-mot-gold"
        )} />
      </div>
      <span className="truncate font-medium">{channel.name}</span>
      {isActive && (
        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-mot-gold animate-pulse" />
      )}
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
  onUserClick?: (userId: string) => void;
}>(({ channel, isActive, users, onJoin, isConnected, onUserClick }) => {
  return (
    <div className="space-y-0.5">
      <button
        onClick={onJoin}
        className={cn(
          'w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-all duration-200 group',
          'hover:bg-mot-gold/10',
          isActive
            ? 'bg-mot-gold/15 text-white'
            : 'text-gray-400 hover:text-white'
        )}
      >
        <div className={cn(
          'p-1.5 rounded-lg transition-colors relative',
          isConnected ? 'bg-green-500/20' : users.length > 0 ? 'bg-mot-gold/10' : 'bg-transparent group-hover:bg-mot-gold/10'
        )}>
          <Volume2 className={cn(
            "h-4 w-4 flex-shrink-0 transition-colors",
            isConnected ? "text-green-400" : users.length > 0 ? "text-mot-gold" : ""
          )} />
          {isConnected && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          )}
        </div>
        <span className="truncate font-medium flex-1 text-left">{channel.name}</span>
        {users.length > 0 && (
          <span className="text-xs font-medium bg-mot-gold/20 text-mot-gold px-2 py-0.5 rounded-full">
            {users.length}
          </span>
        )}
      </button>

      {/* Users in voice channel - always show if there are users */}
      {users.length > 0 && (
        <div className="ml-3 pl-3 border-l-2 border-mot-gold/30 space-y-0.5">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => onUserClick?.(user.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onUserClick?.(user.id);
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm hover:bg-white/5 transition-colors group/user cursor-pointer text-left"
            >
              {/* Avatar with online ring */}
              <div className="relative">
                <Avatar
                  src={user.avatar_url}
                  alt={user.username}
                  size="xs"
                  fallback={user.username.charAt(0)}
                />
                {/* Speaking indicator - pulsing ring */}
                {!user.muted && (
                  <span className="absolute -inset-0.5 rounded-full border-2 border-green-500/50 animate-pulse" />
                )}
              </div>

              <span className={cn(
                "truncate text-xs font-medium flex-1",
                user.muted ? "text-gray-500" : "text-gray-200"
              )}>
                {user.username}
              </span>

              {/* Status indicators */}
              <div className="flex items-center gap-1">
                {user.deafened && (
                  <Headphones className="h-3 w-3 text-red-400" />
                )}
                {user.muted && (
                  <MicOff className="h-3 w-3 text-red-400" />
                )}
              </div>
            </button>
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
  const { user } = useAuthStore();
  const {
    isConnected,
    channelId: connectedVoiceChannelId,
    localParticipant,
    toggleMute,
    toggleDeafen,
    toggleVideo,
    toggleScreenShare,
    leaveChannel,
    isDeafened,
    isVideoEnabled,
    isScreenSharing,
    connectionQuality
  } = useVoiceChat();

  // Get voice users from the global store (populated by WebSocket events)
  // IMPORTANT: Only use store state - don't merge with props which can have stale data
  const storeVoiceUsers = useVoiceUsersStore(state => state.voiceChannelUsers);

  // Use only store users - props were causing stale data issues
  const mergedVoiceUsers = storeVoiceUsers;
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

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
                        onUserClick={setSelectedUserId}
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
                  onUserClick={setSelectedUserId}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Voice Connected Panel - Discord-like with Glassmorphism */}
      {isConnected && connectedVoiceChannelId && (
        <div className="border-t border-mot-gold/20 bg-gradient-to-b from-[#1a1a2e]/95 to-[#0f0f1a]/98 backdrop-blur-xl">
          {/* Voice Status Header */}
          <div className="px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Signal className="h-4 w-4 text-green-400" />
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-green-400">Voice Connected</p>
                <div className="flex items-center gap-1">
                  <Volume2 className="h-3 w-3 text-gray-500" />
                  <p className="text-[10px] text-gray-400 truncate">
                    {channels.find((c: Channel) => c.id === connectedVoiceChannelId)?.name || 'Voice Channel'} / {currentGuild?.name}
                  </p>
                </div>
              </div>
              {/* Connection quality indicator */}
              <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/30`}>
                <Wifi className={`h-3 w-3 ${connectionQuality === 'excellent' || connectionQuality === 'good' ? 'text-green-400' :
                  connectionQuality === 'poor' ? 'text-yellow-400' :
                    connectionQuality === 'lost' ? 'text-red-400' : 'text-gray-400'
                  }`} />
                <span className={`text-[10px] font-medium capitalize ${connectionQuality === 'excellent' || connectionQuality === 'good' ? 'text-green-400' :
                  connectionQuality === 'poor' ? 'text-yellow-400' :
                    connectionQuality === 'lost' ? 'text-red-400' : 'text-gray-400'
                  }`}>
                  {connectionQuality === 'unknown' ? 'Connecting...' : connectionQuality}
                </span>
              </div>
            </div>

            {/* Voice Controls - Discord Style */}
            <div className="flex items-center justify-between gap-1 mt-2">
              {/* Mute - Disabled when deafened */}
              <Tooltip content={isDeafened ? 'Deafened' : (!localParticipant?.isMicrophoneEnabled ? 'Unmute' : 'Mute')} position="top">
                <button
                  onClick={toggleMute}
                  disabled={isDeafened}
                  className={cn(
                    'flex-1 p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center relative group',
                    isDeafened
                      ? 'bg-neutral-800/50 cursor-not-allowed opacity-50'
                      : 'bg-white/5 hover:bg-white/10 border border-white/5',
                    !localParticipant?.isMicrophoneEnabled && !isDeafened && 'bg-red-500/20 border-red-500/30 hover:bg-red-500/30'
                  )}
                >
                  {!localParticipant?.isMicrophoneEnabled ? (
                    <MicOff className="h-4 w-4 text-red-400" />
                  ) : (
                    <Mic className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors" />
                  )}
                </button>
              </Tooltip>

              {/* Deafen */}
              <Tooltip content={isDeafened ? 'Undeafen' : 'Deafen'} position="top">
                <button
                  onClick={toggleDeafen}
                  className={cn(
                    'flex-1 p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center relative group',
                    'bg-white/5 hover:bg-white/10 border border-white/5',
                    isDeafened && 'bg-red-500/20 border-red-500/30 hover:bg-red-500/30'
                  )}
                >
                  <Headphones className={cn(
                    'h-4 w-4 transition-colors',
                    isDeafened ? 'text-red-400' : 'text-gray-400 group-hover:text-white'
                  )} />
                  {isDeafened && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-0.5 bg-red-400 rotate-45 rounded-full" />
                    </div>
                  )}
                </button>
              </Tooltip>

              {/* Video */}
              <Tooltip content={isVideoEnabled ? 'Turn Off Camera' : 'Turn On Camera'} position="top">
                <button
                  onClick={toggleVideo}
                  className={cn(
                    'flex-1 p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center relative group',
                    'bg-white/5 hover:bg-white/10 border border-white/5',
                    isVideoEnabled && 'bg-mot-gold/20 border-mot-gold/30 hover:bg-mot-gold/30'
                  )}
                >
                  <Video className={cn(
                    'h-4 w-4 transition-colors',
                    isVideoEnabled ? 'text-mot-gold' : 'text-gray-400 group-hover:text-white'
                  )} />
                  {!isVideoEnabled && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-0.5 bg-gray-500 rotate-45 rounded-full" />
                    </div>
                  )}
                </button>
              </Tooltip>

              {/* Screen Share */}
              <Tooltip content={isScreenSharing ? 'Stop Sharing' : 'Share Screen'} position="top">
                <button
                  onClick={toggleScreenShare}
                  className={cn(
                    'flex-1 p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center relative group',
                    'bg-white/5 hover:bg-white/10 border border-white/5',
                    isScreenSharing && 'bg-mot-gold/20 border-mot-gold/30 hover:bg-mot-gold/30'
                  )}
                >
                  <Monitor className={cn(
                    'h-4 w-4 transition-colors',
                    isScreenSharing ? 'text-mot-gold' : 'text-gray-400 group-hover:text-white'
                  )} />
                </button>
              </Tooltip>

              {/* Settings */}
              <Tooltip content="Voice Settings" position="top">
                <button
                  className="flex-1 p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-all duration-200 flex items-center justify-center group"
                >
                  <Settings className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors" />
                </button>
              </Tooltip>

              {/* Disconnect */}
              <Tooltip content="Disconnect" position="top">
                <button
                  onClick={leaveChannel}
                  className="flex-1 p-2.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 transition-all duration-200 flex items-center justify-center group"
                >
                  <PhoneOff className="h-4 w-4 text-red-400 group-hover:text-red-300 transition-colors" />
                </button>
              </Tooltip>
            </div>
          </div>

          {/* User Profile Section - Discord Style */}
          {user && (
            <div className="px-2 py-2 border-t border-white/5 bg-black/20">
              <div className="flex items-center gap-2 p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
                <div className="relative">
                  <Avatar
                    src={user.avatar_url}
                    alt={user.username}
                    size="sm"
                    fallback={user.username.charAt(0)}
                  />
                  {/* Online status dot */}
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0f0f1a]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{user.username}</p>
                  <p className="text-[10px] text-gray-500 truncate">Online</p>
                </div>
                <Settings className="h-4 w-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          )}
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

      {/* User Profile Modal for voice channel users */}
      {selectedUserId && (
        <UserProfileModal
          userId={selectedUserId}
          guildId={currentGuild?.id}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  );
});

Sidebar.displayName = 'Sidebar';
