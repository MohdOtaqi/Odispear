import React, { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

  const canModerate = !isSelf && !isOwner && guildId;

  const menuWidth = 220;
  const menuHeight = showTimeoutOptions ? 350 : 200;
  const adjustedX = Math.min(x, window.innerWidth - menuWidth - 20);
  const adjustedY = Math.min(y, window.innerHeight - menuHeight - 20);

  return (
    <>
      <motion.div
        className="fixed inset-0 z-[100]"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.div
        className="fixed z-[101] bg-mot-surface-subtle/95 backdrop-blur-xl border border-mot-border rounded-xl shadow-2xl py-2 min-w-[220px] max-h-[80vh] overflow-hidden"
        style={{ left: Math.max(10, adjustedX), top: Math.max(10, adjustedY) }}
        initial={{ opacity: 0, scale: 0.9, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -10 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-mot-border">
          <p className="text-sm font-semibold text-white">{member.display_name || member.username}</p>
          <p className="text-xs text-gray-400">@{member.username}</p>
        </div>

        {canModerate && (
          <div className="py-1">
            <motion.button
              onClick={handleKick}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-mot-gold/10 flex items-center gap-3 transition-colors"
              whileHover={{ x: 4 }}
            >
              <UserMinus className="h-4 w-4 text-gray-400" />
              Kick
            </motion.button>

            <motion.button
              onClick={handleBan}
              className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/20 flex items-center gap-3 transition-colors"
              whileHover={{ x: 4 }}
            >
              <Ban className="h-4 w-4" />
              Ban
            </motion.button>

            <div>
              <motion.button
                onClick={() => setShowTimeoutOptions(!showTimeoutOptions)}
                className="w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-mot-gold/10 flex items-center gap-3 transition-colors"
                whileHover={{ x: 4 }}
              >
                <Clock className="h-4 w-4 text-gray-400" />
                Timeout
                <motion.span
                  className="ml-auto text-xs text-gray-500"
                  animate={{ rotate: showTimeoutOptions ? 90 : 0 }}
                >
                  ▶
                </motion.span>
              </motion.button>

              <AnimatePresence>
                {showTimeoutOptions && (
                  <motion.div
                    className="bg-mot-surface border-t border-mot-border py-1 overflow-hidden"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {[
                      { label: '60 seconds', value: 60 },
                      { label: '5 minutes', value: 300 },
                      { label: '10 minutes', value: 600 },
                      { label: '1 hour', value: 3600 },
                      { label: '1 day', value: 86400 },
                      { label: '1 week', value: 604800 },
                    ].map((opt, index) => (
                      <motion.button
                        key={opt.value}
                        onClick={() => handleTimeout(opt.value)}
                        className="w-full px-8 py-2 text-left text-sm text-gray-300 hover:bg-mot-gold/10 hover:text-white transition-colors"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        {opt.label}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {!canModerate && !isSelf && (
          <div className="px-4 py-3 text-xs text-gray-500 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            {isOwner ? 'Cannot moderate owner' : 'No moderation permissions'}
          </div>
        )}
      </motion.div>
    </>
  );
};

const MemberItem = React.memo<{
  member: Member;
  isOwner: boolean;
  guildId?: string;
  onClick?: () => void;
  onAction?: () => void;
  index: number;
}>(({ member, isOwner, guildId, onClick, onAction, index }) => {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const displayName = member.nickname || member.display_name || member.username;

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          delay: Math.min(index * 0.03, 0.5),
          type: "spring",
          stiffness: 300,
          damping: 25
        }}
      >
        <Tooltip content={`View ${displayName}'s profile`} position="left">
          <motion.button
            onClick={onClick}
            onContextMenu={handleContextMenu}
            className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-mot-gold/10 group transition-colors"
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            <Avatar
              src={member.avatar_url}
              alt={member.username}
              fallback={member.username.charAt(0)}
              size="sm"
              status={member.status}
              ring={isOwner}
              ringColor="rgba(212, 175, 55, 0.5)"
            />
            <div className="flex-1 min-w-0 text-left">
              <div className="text-sm font-medium truncate flex items-center gap-1.5 text-gray-300 group-hover:text-white transition-colors">
                {displayName}
                {isOwner && (
                  <Tooltip content="Server Owner" position="top">
                    <motion.span
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <Crown className="h-3.5 w-3.5 text-mot-gold flex-shrink-0" />
                    </motion.span>
                  </Tooltip>
                )}
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              whileHover={{ opacity: 1, scale: 1 }}
              className="opacity-0 group-hover:opacity-100"
            >
              <MessageSquare className="h-4 w-4 text-mot-gold" />
            </motion.div>
          </motion.button>
        </Tooltip>
      </motion.div>

      <AnimatePresence>
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
      </AnimatePresence>
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
      {/* Header */}
      <div className="p-3 border-b border-mot-border">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Members — {members.length}
        </h3>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2">
        {onlineMembers.length > 0 && (
          <div className="mb-4">
            <motion.div
              className="text-xs font-semibold text-green-400 uppercase mb-2 px-2 flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Online — {onlineMembers.length}
            </motion.div>
            <div className="space-y-0.5">
              {onlineMembers.map((member, index) => (
                <MemberItem
                  key={member.id}
                  member={member}
                  isOwner={member.id === ownerId}
                  guildId={guildId}
                  onClick={() => onMemberClick?.(member)}
                  onAction={onMemberAction}
                  index={index}
                />
              ))}
            </div>
          </div>
        )}

        {offlineMembers.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase mb-2 px-2">
              Offline — {offlineMembers.length}
            </div>
            <div className="space-y-0.5 opacity-60">
              {offlineMembers.map((member, index) => (
                <MemberItem
                  key={member.id}
                  member={member}
                  isOwner={member.id === ownerId}
                  guildId={guildId}
                  onClick={() => onMemberClick?.(member)}
                  onAction={onMemberAction}
                  index={index + onlineMembers.length}
                />
              ))}
            </div>
          </div>
        )}

        {members.length === 0 && (
          <motion.div
            className="text-center py-8 text-gray-500"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-sm">No members found</p>
          </motion.div>
        )}
      </div>
    </div>
  );
});

MemberList.displayName = 'MemberList';
