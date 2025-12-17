import React, { useEffect, useRef } from 'react';
import { User, AtSign, UserPlus, UserMinus, VolumeX, Mic, MicOff, Volume2, Ban, Shield, Copy, Phone, Video, MessageSquare, Info, Crown, Clock, UserX, Flag, Settings, Eye } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useGuildStore } from '../store/guildStore';

interface UserContextMenuProps {
  user: {
    id: string;
    username: string;
    avatar: string;
    status?: string;
    isVoice?: boolean;
    isMuted?: boolean;
    isDeafened?: boolean;
  };
  position: { x: number; y: number };
  onClose: () => void;
  onAction?: (action: string, userId: string) => void;
  guildId?: string;
  channelId?: string;
}

export const UserContextMenu: React.FC<UserContextMenuProps> = ({
  user,
  position,
  onClose,
  onAction,
  guildId,
  channelId
}) => {
  const { user: currentUser } = useAuthStore();
  const { selectedGuild } = useGuildStore();
  const menuRef = useRef<HTMLDivElement>(null);
  const isCurrentUser = currentUser?.id === user.id;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleAction = async (action: string) => {
    switch (action) {
      case 'message':
        window.location.href = `/app/dms/${user.id}`;
        break;
      case 'call':
        // Start voice call
        onAction?.('call', user.id);
        break;
      case 'video':
        // Start video call
        onAction?.('video', user.id);
        break;
      case 'mention':
        // Insert mention in message input
        onAction?.('mention', user.id);
        break;
      case 'profile':
        onAction?.('profile', user.id);
        break;
      case 'add_friend':
        await api.post('/friends/request', { userId: user.id });
        break;
      case 'remove_friend':
        await api.delete(`/friends/${user.id}`);
        break;
      case 'block':
        await api.post(`/friends/block/${user.id}`);
        break;
      case 'unblock':
        await api.post(`/friends/unblock/${user.id}`);
        break;
      case 'mute':
        onAction?.('mute', user.id);
        break;
      case 'unmute':
        onAction?.('unmute', user.id);
        break;
      case 'deafen':
        onAction?.('deafen', user.id);
        break;
      case 'undeafen':
        onAction?.('undeafen', user.id);
        break;
      case 'move':
        onAction?.('move', user.id);
        break;
      case 'disconnect':
        onAction?.('disconnect', user.id);
        break;
      case 'kick':
        if (window.confirm(`Are you sure you want to kick ${user.username}?`)) {
          await api.post(`/guilds/${guildId}/kick/${user.id}`);
        }
        break;
      case 'ban':
        if (window.confirm(`Are you sure you want to ban ${user.username}?`)) {
          await api.post(`/guilds/${guildId}/ban/${user.id}`);
        }
        break;
      case 'timeout':
        onAction?.('timeout', user.id);
        break;
      case 'manage_roles':
        onAction?.('manage_roles', user.id);
        break;
      case 'copy_id':
        navigator.clipboard.writeText(user.id);
        break;
      case 'copy_username':
        navigator.clipboard.writeText(user.username);
        break;
    }
    onClose();
  };

  // Calculate menu position to ensure it stays within viewport
  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    top: position.y,
    left: position.x,
    zIndex: 9999
  };

  // Adjust position if menu would overflow
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        menuRef.current.style.left = `${window.innerWidth - rect.width - 10}px`;
      }
      if (rect.bottom > window.innerHeight) {
        menuRef.current.style.top = `${window.innerHeight - rect.height - 10}px`;
      }
    }
  }, []);

  const isAdmin = true; // Check if current user is admin
  const isModerator = true; // Check if current user is moderator

  return (
    <div ref={menuRef} style={menuStyle} className="w-56 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl animate-scale-in">
      {/* User Info Header */}
      <div className="p-3 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={user.avatar} alt={user.username} className="w-10 h-10 rounded-full" />
            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 ${
              user.status === 'online' ? 'bg-green-500' :
              user.status === 'idle' ? 'bg-yellow-500' :
              user.status === 'dnd' ? 'bg-red-500' : 'bg-gray-500'
            }`} />
          </div>
          <div>
            <div className="font-semibold text-white text-sm">{user.username}</div>
            {user.status && (
              <div className="text-xs text-gray-400 capitalize">{user.status}</div>
            )}
          </div>
        </div>
      </div>

      <div className="py-1">
        {/* Profile */}
        <button onClick={() => handleAction('profile')}
          className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-3">
          <Eye className="w-4 h-4" />
          Profile
        </button>

        {!isCurrentUser && (
          <>
            {/* Communication */}
            <div className="border-t border-gray-800 my-1"></div>
            <button onClick={() => handleAction('message')}
              className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-3">
              <MessageSquare className="w-4 h-4" />
              Message
            </button>
            <button onClick={() => handleAction('mention')}
              className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-3">
              <AtSign className="w-4 h-4" />
              Mention
            </button>
            <button onClick={() => handleAction('call')}
              className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-3">
              <Phone className="w-4 h-4" />
              Call
            </button>
            <button onClick={() => handleAction('video')}
              className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-3">
              <Video className="w-4 h-4" />
              Video Call
            </button>

            {/* Friend Actions */}
            <div className="border-t border-gray-800 my-1"></div>
            <button onClick={() => handleAction('add_friend')}
              className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-3">
              <UserPlus className="w-4 h-4" />
              Add Friend
            </button>
            <button onClick={() => handleAction('block')}
              className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-800 hover:text-red-300 flex items-center gap-3">
              <Ban className="w-4 h-4" />
              Block
            </button>
          </>
        )}

        {/* Voice Actions */}
        {user.isVoice && !isCurrentUser && (isModerator || isAdmin) && (
          <>
            <div className="border-t border-gray-800 my-1"></div>
            {user.isMuted ? (
              <button onClick={() => handleAction('unmute')}
                className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-3">
                <Mic className="w-4 h-4" />
                Unmute
              </button>
            ) : (
              <button onClick={() => handleAction('mute')}
                className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-3">
                <MicOff className="w-4 h-4" />
                Server Mute
              </button>
            )}
            {user.isDeafened ? (
              <button onClick={() => handleAction('undeafen')}
                className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-3">
                <Volume2 className="w-4 h-4" />
                Undeafen
              </button>
            ) : (
              <button onClick={() => handleAction('deafen')}
                className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-3">
                <VolumeX className="w-4 h-4" />
                Server Deafen
              </button>
            )}
            <button onClick={() => handleAction('move')}
              className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-3">
              <UserX className="w-4 h-4" />
              Move To
            </button>
            <button onClick={() => handleAction('disconnect')}
              className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-800 hover:text-red-300 flex items-center gap-3">
              <UserX className="w-4 h-4" />
              Disconnect
            </button>
          </>
        )}

        {/* Moderation Actions */}
        {!isCurrentUser && guildId && (isModerator || isAdmin) && (
          <>
            <div className="border-t border-gray-800 my-1"></div>
            <button onClick={() => handleAction('timeout')}
              className="w-full px-3 py-2 text-left text-sm text-yellow-400 hover:bg-gray-800 hover:text-yellow-300 flex items-center gap-3">
              <Clock className="w-4 h-4" />
              Timeout
            </button>
            <button onClick={() => handleAction('kick')}
              className="w-full px-3 py-2 text-left text-sm text-orange-400 hover:bg-gray-800 hover:text-orange-300 flex items-center gap-3">
              <UserMinus className="w-4 h-4" />
              Kick
            </button>
            <button onClick={() => handleAction('ban')}
              className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-800 hover:text-red-300 flex items-center gap-3">
              <Ban className="w-4 h-4" />
              Ban
            </button>
          </>
        )}

        {/* Admin Actions */}
        {!isCurrentUser && guildId && isAdmin && (
          <>
            <div className="border-t border-gray-800 my-1"></div>
            <button onClick={() => handleAction('manage_roles')}
              className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-3">
              <Shield className="w-4 h-4" />
              Manage Roles
            </button>
          </>
        )}

        {/* Developer Actions */}
        <div className="border-t border-gray-800 my-1"></div>
        <button onClick={() => handleAction('copy_username')}
          className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-3">
          <Copy className="w-4 h-4" />
          Copy Username
        </button>
        <button onClick={() => handleAction('copy_id')}
          className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-3">
          <Copy className="w-4 h-4" />
          Copy User ID
        </button>
      </div>
    </div>
  );
};

export default UserContextMenu;
