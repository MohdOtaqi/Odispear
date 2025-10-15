import React from 'react';
import { MessageCircle, Phone, MoreVertical, Crown, Shield } from 'lucide-react';

interface UserCardProps {
  user: {
    username: string;
    discriminator: string;
    avatar?: string;
    banner?: string;
    status: 'online' | 'idle' | 'dnd' | 'offline';
    customStatus?: string;
    bio?: string;
    badges?: string[];
    roles?: Array<{ name: string; color: string }>;
    activity?: {
      type: 'playing' | 'streaming' | 'listening' | 'watching';
      name: string;
      details?: string;
    };
  };
  position: { x: number; y: number };
  onClose: () => void;
  onMessage?: () => void;
  onCall?: () => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, position, onClose, onMessage, onCall }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'dnd': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getBadgeIcon = (badge: string) => {
    switch (badge) {
      case 'admin': return <Shield className="w-4 h-4 text-red-400" />;
      case 'premium': return <Crown className="w-4 h-4 text-yellow-400" />;
      default: return null;
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 w-80 bg-[#1e1f22] rounded-lg shadow-2xl overflow-hidden animate-scale-in"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      >
        {/* Banner */}
        <div className="h-16 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 relative">
          {user.banner && (
            <img src={user.banner} alt="Banner" className="w-full h-full object-cover" />
          )}
        </div>

        {/* Content */}
        <div className="p-4 pb-3">
          {/* Avatar */}
          <div className="relative -mt-10 mb-3">
            <div className="inline-block relative">
              <div className="w-20 h-20 rounded-full border-4 border-[#1e1f22] bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-2xl font-bold shadow-xl">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username} className="w-full h-full rounded-full object-cover" />
                ) : (
                  user.username[0].toUpperCase()
                )}
              </div>
              <div className={`absolute bottom-0 right-0 w-6 h-6 ${getStatusColor(user.status)} rounded-full border-4 border-[#1e1f22]`} />
            </div>
          </div>

          {/* Username & Badges */}
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-white">{user.username}</h3>
              {user.badges && (
                <div className="flex gap-1">
                  {user.badges.map((badge, idx) => (
                    <div key={idx}>{getBadgeIcon(badge)}</div>
                  ))}
                </div>
              )}
            </div>
            <span className="text-sm text-gray-400">#{user.discriminator}</span>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/10 mb-3" />

          {/* Custom Status */}
          {user.customStatus && (
            <div className="mb-3 p-2 bg-[#2b2d31] rounded text-sm text-gray-300">
              {user.customStatus}
            </div>
          )}

          {/* Activity */}
          {user.activity && (
            <div className="mb-3 p-3 bg-[#2b2d31] rounded">
              <div className="text-xs font-semibold text-gray-400 mb-1 uppercase">
                {user.activity.type}
              </div>
              <div className="text-sm font-semibold text-white">{user.activity.name}</div>
              {user.activity.details && (
                <div className="text-xs text-gray-400 mt-1">{user.activity.details}</div>
              )}
            </div>
          )}

          {/* Roles */}
          {user.roles && user.roles.length > 0 && (
            <div className="mb-3">
              <div className="text-xs font-semibold text-gray-400 mb-2 uppercase">Roles</div>
              <div className="flex flex-wrap gap-1">
                {user.roles.map((role, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 rounded text-xs font-semibold"
                    style={{ backgroundColor: role.color + '20', color: role.color }}
                  >
                    {role.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Bio */}
          {user.bio && (
            <div className="mb-3">
              <div className="text-xs font-semibold text-gray-400 mb-1 uppercase">About Me</div>
              <div className="text-sm text-gray-300">{user.bio}</div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={onMessage}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 rounded transition-all hover-lift flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Message
            </button>
            <button
              onClick={onCall}
              className="px-3 bg-[#2b2d31] hover:bg-[#383a40] text-white rounded transition-colors hover-lift"
            >
              <Phone className="w-4 h-4" />
            </button>
            <button className="px-3 bg-[#2b2d31] hover:bg-[#383a40] text-white rounded transition-colors hover-lift">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserCard;
