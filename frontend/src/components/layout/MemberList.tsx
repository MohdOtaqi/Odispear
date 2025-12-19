import React, { useMemo, useState, useCallback } from 'react';
import { Avatar } from '../ui/Avatar';
import { Crown, MessageSquare, UserMinus, Ban, Clock, ShieldAlert } from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';

interface Member {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  nickname?: string;
}

interface MemberListProps {
  members: Member[];
  ownerId?: string;
  guildId?: string;
  onMemberClick?: (member: Member) => void;
  onMemberAction?: () => void;
  className?: string;
}

interface ContextMenuProps {
  x: number;
  y: number;
  member: Member;
  isOwner: boolean;
  guildId?: string;
  onClose: () => void;
  onAction?: () => void;
}

const MemberContextMenu: React.FC<ContextMenuProps> = ({ x, y, member, isOwner, guildId, onClose, onAction }) => {
  const { user } = useAuthStore();
  const [showTimeoutOptions, setShowTimeoutOptions] = useState(false);

  const isSelf = user?.id === member.id;

  const handleKick = async () => {
    if (!guildId) return;
    try {
      await api.post(`/moderation/guilds/${guildId}/kick`, { user_id: member.id, reason: 'Kicked by moderator' });
      toast.success(`${member.username} has been kicked`);
      onAction?.();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to kick member');
    }
    onClose();
  };

  const handleBan = async () => {
    if (!guildId) return;
    try {
      await api.post(`/moderation/guilds/${guildId}/ban`, { user_id: member.id, reason: 'Banned by moderator' });
      toast.success(`${member.username} has been banned`);
      onAction?.();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to ban member');
    }
    onClose();
  };

  const handleTimeout = async (duration: number) => {
    if (!guildId) return;
    try {
      await api.post(`/moderation/guilds/${guildId}/mute`, { user_id: member.id, duration, reason: 'Timed out by moderator' });
      toast.success(`${member.username} has been timed out`);
      onAction?.();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to timeout member');
    }
    onClose();
  };

  // Don't show moderation options for self or owner
  const canModerate = !isSelf && !isOwner && guildId;

  // Calculate position to ensure menu stays on screen
  const menuWidth = 200;
  const menuHeight = showTimeoutOptions ? 350 : 200;
  const adjustedX = Math.min(x, window.innerWidth - menuWidth - 20);
  const adjustedY = Math.min(y, window.innerHeight - menuHeight - 20);

  return (
    <>
      <div className="fixed inset-0 z-[100]" onClick={onClose} />
      <div
        className="fixed z-[101] bg-[#1a1a1c] border border-neutral-700 rounded-lg shadow-2xl py-2 min-w-[200px] max-h-[80vh] overflow-y-auto"
        style={{ left: Math.max(10, adjustedX), top: Math.max(10, adjustedY) }}
      >
        <div className="px-4 py-3 border-b border-neutral-700 bg-[#1a1a1c]">
          <p className="text-sm font-semibold text-white">{member.display_name || member.username}</p>
          <p className="text-xs text-neutral-400">@{member.username}</p>
        </div>

        {canModerate && (
          <div className="py-1">
            <button
              onClick={handleKick}
              className="w-full px-4 py-2.5 text-left text-sm text-neutral-200 hover:bg-neutral-700 flex items-center gap-3 transition-colors"
            >
              <UserMinus className="h-4 w-4 text-neutral-400" />
              Kick
            </button>

            <button
              onClick={handleBan}
              className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/20 flex items-center gap-3 transition-colors"
            >
              <Ban className="h-4 w-4" />
              Ban
            </button>

            <div>
              <button
                onClick={() => setShowTimeoutOptions(!showTimeoutOptions)}
                className="w-full px-4 py-2.5 text-left text-sm text-neutral-200 hover:bg-neutral-700 flex items-center gap-3 transition-colors"
              >
                <Clock className="h-4 w-4 text-neutral-400" />
                Timeout
                <span className="ml-auto text-xs text-neutral-500">{showTimeoutOptions ? '▼' : '▶'}</span>
              </button>

              {showTimeoutOptions && (
                <div className="bg-[#141416] border-t border-neutral-700 py-1">
                  {[
                    { label: '60 seconds', value: 60 },
                    { label: '5 minutes', value: 300 },
                    { label: '10 minutes', value: 600 },
                    { label: '1 hour', value: 3600 },
                    { label: '1 day', value: 86400 },
                    { label: '1 week', value: 604800 },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => handleTimeout(opt.value)}
                      className="w-full px-8 py-2 text-left text-sm text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {!canModerate && !isSelf && (
          <div className="px-4 py-3 text-xs text-neutral-500 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            {isOwner ? 'Cannot moderate owner' : 'No moderation permissions'}
          </div>
        )}
      </div>
    </>
  );
};

const MemberItem = React.memo<{
  member: Member;
  isOwner: boolean;
  guildId?: string;
  onClick?: () => void;
  onAction?: () => void;
}>(({ member, isOwner, guildId, onClick, onAction }) => {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const displayName = member.nickname || member.display_name || member.username;

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  return (
    <>
      <Tooltip content={`View ${displayName}'s profile`} position="left">
        <button
          onClick={onClick}
          onContextMenu={handleContextMenu}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-mot-gold/10 group transition-all duration-150"
        >
          <Avatar
            src={member.avatar_url}
            alt={member.username}
            fallback={member.username.charAt(0)}
            size="sm"
            status={member.status}
          />
          <div className="flex-1 min-w-0 text-left">
            <div className="text-sm font-medium truncate flex items-center gap-1 text-gray-300 group-hover:text-white transition-colors">
              {displayName}
              {isOwner && (
                <Tooltip content="Server Owner" position="top">
                  <Crown className="h-3 w-3 text-mot-gold flex-shrink-0" />
                </Tooltip>
              )}
            </div>
          </div>
          <MessageSquare className="h-4 w-4 text-mot-gold opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </Tooltip>

      {contextMenu && (
        <MemberContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          member={member}
          isOwner={isOwner}
          guildId={guildId}
          onClose={() => setContextMenu(null)}
          onAction={onAction}
        />
      )}
    </>
  );
});

MemberItem.displayName = 'MemberItem';

export const MemberList = React.memo<MemberListProps>(({ members, ownerId, guildId, onMemberClick, onMemberAction, className }) => {
  const { onlineMembers, offlineMembers } = useMemo(() => ({
    onlineMembers: members.filter((m) => m.status !== 'offline'),
    offlineMembers: members.filter((m) => m.status === 'offline'),
  }), [members]);

  return (
    <div className={cn("w-60 bg-mot-surface flex flex-col h-full border-l border-mot-border", className)}>
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3">
        {onlineMembers.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-semibold text-gray-400 uppercase mb-2 px-2">
              Online — {onlineMembers.length}
            </div>
            <div className="space-y-0.5">
              {onlineMembers.map((member) => (
                <MemberItem
                  key={member.id}
                  member={member}
                  isOwner={member.id === ownerId}
                  guildId={guildId}
                  onClick={() => onMemberClick?.(member)}
                  onAction={onMemberAction}
                />
              ))}
            </div>
          </div>
        )}

        {offlineMembers.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase mb-2 px-2">
              Offline — {offlineMembers.length}
            </div>
            <div className="space-y-0.5">
              {offlineMembers.map((member) => (
                <MemberItem
                  key={member.id}
                  member={member}
                  isOwner={member.id === ownerId}
                  guildId={guildId}
                  onClick={() => onMemberClick?.(member)}
                  onAction={onMemberAction}
                />
              ))}
            </div>
          </div>
        )}

        {members.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No members found</p>
          </div>
        )}
      </div>


    </div>
  );
});

MemberList.displayName = 'MemberList';
