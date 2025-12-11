import React from 'react';
import { MessageSquare, Users, Plus } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Tooltip } from '../ui/Tooltip';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';

interface DMChannel {
  id: string;
  type: 'dm' | 'group_dm';
  name?: string;
  participants: Array<{
    id: string;
    username: string;
    avatar_url?: string;
    status: 'online' | 'idle' | 'dnd' | 'offline';
  }>;
  lastMessage?: {
    content: string;
    timestamp: string;
  };
  unreadCount?: number;
}

interface DMListProps {
  channels?: DMChannel[];
  currentDMChannelId?: string;
  currentChannelId?: string; // Backward compatibility
  onDMSelect?: (dmChannelId: string) => void;
  onChannelSelect?: (channelId: string) => void; // Backward compatibility
  onCreateDM?: () => void;
}

export const DMList = React.memo<DMListProps>(({
  channels = [],
  currentDMChannelId,
  currentChannelId,
  onDMSelect,
  onChannelSelect,
  onCreateDM,
}) => {
  const { user } = useAuthStore();
  const handleSelect = onDMSelect || onChannelSelect || (() => {});
  const activeId = currentDMChannelId || currentChannelId;

  return (
    <div className="w-60 bg-mot-surface flex flex-col">
      {/* Header */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-mot-border">
        <h2 className="font-semibold text-white">Direct Messages</h2>
        {onCreateDM && (
          <Tooltip content="Create DM" position="bottom">
            <button
              onClick={onCreateDM}
              className="p-1 text-gray-400 hover:text-mot-gold transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </Tooltip>
        )}
      </div>

      {/* DM List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {channels.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No messages yet</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {channels.map((channel) => {
              const isActive = channel.id === activeId;
              // Find the other participant (not the current user)
              const otherParticipant = channel.participants?.find(
                (p: any) => p.id !== user?.id && p.user_id !== user?.id
              ) || channel.participants?.[0];

              return (
                <button
                  key={channel.id}
                  onClick={() => handleSelect(channel.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-2 py-2 rounded-md transition-all',
                    'hover:bg-mot-gold/10',
                    isActive && 'bg-mot-gold/20 border-l-2 border-mot-gold'
                  )}
                >
                  {/* Avatar */}
                  {channel.participants?.length === 2 || channel.type === 'dm' ? (
                    <Avatar
                      src={otherParticipant?.avatar_url}
                      alt={otherParticipant?.username || 'User'}
                      size="md"
                      status={otherParticipant?.status}
                      fallback={otherParticipant?.username?.charAt(0) || 'U'}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-gray-400" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="font-medium text-white truncate">
                      {channel.participants?.length === 2 || channel.type === 'dm'
                        ? otherParticipant?.username || 'Unknown'
                        : channel.name || 'Group Chat'}
                    </div>
                    {channel.lastMessage && (
                      <div className="text-xs text-gray-400 truncate">
                        {channel.lastMessage.content}
                      </div>
                    )}
                  </div>

                  {/* Unread Badge */}
                  {channel.unreadCount && channel.unreadCount > 0 && (
                    <div className="flex-shrink-0 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-bold">
                        {channel.unreadCount > 9 ? '9+' : channel.unreadCount}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

DMList.displayName = 'DMList';
