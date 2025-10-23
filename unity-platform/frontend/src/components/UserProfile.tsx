import React, { useState } from 'react';
import { X, Camera, Edit2, Check, Shield, Crown, Zap } from 'lucide-react';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    username: string;
    discriminator: string;
    avatar?: string;
    banner?: string;
    bio?: string;
    status: 'online' | 'idle' | 'dnd' | 'offline';
    customStatus?: string;
    roles?: Array<{ name: string; color: string }>;
    badges?: string[];
    createdAt: string;
    level?: number;
    xp?: number;
  };
}

const UserProfile: React.FC<UserProfileProps> = ({ isOpen, onClose, user }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState(user.bio || '');
  const [customStatus, setCustomStatus] = useState(user.customStatus || '');

  if (!isOpen) return null;

  const getBadgeIcon = (badge: string) => {
    switch (badge) {
      case 'admin':
        return <Shield className="w-5 h-5 text-red-400" />;
      case 'premium':
        return <Crown className="w-5 h-5 text-yellow-400" />;
      case 'early':
        return <Zap className="w-5 h-5 text-blue-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'idle':
        return 'bg-yellow-500';
      case 'dnd':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Profile Card */}
      <div className="relative w-full max-w-2xl mx-4 bg-[#1e1f22] rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Banner */}
        <div className="relative h-32 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 animate-shimmer">
          {user.banner && (
            <img src={user.banner} alt="Banner" className="w-full h-full object-cover" />
          )}
          <button className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors">
            <Camera className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors z-10"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Avatar Section */}
        <div className="relative px-6 pb-6">
          <div className="relative -mt-16 mb-4">
            <div className="relative inline-block">
              <div className="w-32 h-32 rounded-full border-8 border-[#1e1f22] bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-4xl font-bold shadow-2xl hover-lift">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username} className="w-full h-full rounded-full object-cover" />
                ) : (
                  user.username[0].toUpperCase()
                )}
              </div>
              <div className={`absolute bottom-2 right-2 w-8 h-8 ${getStatusColor(user.status)} rounded-full border-4 border-[#1e1f22] animate-ripple`} />
              <button className="absolute bottom-0 right-0 p-2 bg-purple-600 hover:bg-purple-700 rounded-full shadow-lg transition-all hover-scale">
                <Camera className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* User Info */}
          <div className="space-y-4">
            {/* Username and Badges */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl font-bold text-white">{user.username}</h2>
                <span className="text-gray-400">#{user.discriminator}</span>
                {user.badges && (
                  <div className="flex gap-1 ml-2">
                    {user.badges.map((badge, idx) => (
                      <div key={idx} className="hover-scale cursor-pointer">
                        {getBadgeIcon(badge)}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Roles */}
              {user.roles && user.roles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {user.roles.map((role, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full text-xs font-semibold animate-slide-in-right"
                      style={{ backgroundColor: role.color + '20', color: role.color }}
                    >
                      {role.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Level & XP */}
            {user.level !== undefined && (
              <div className="bg-[#2b2d31] rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Level</span>
                  <span className="text-purple-400 font-bold text-lg">{user.level}</span>
                </div>
                <div className="w-full bg-[#1e1f22] rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-500"
                    style={{ width: `${((user.xp || 0) % 100)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-400 text-right">
                  {user.xp || 0} / {(Math.floor((user.xp || 0) / 100) + 1) * 100} XP
                </div>
              </div>
            )}

            {/* Custom Status */}
            <div className="bg-[#2b2d31] rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-300">Custom Status</span>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1 hover:bg-[#1e1f22] rounded transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
              {isEditing ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customStatus}
                    onChange={(e) => setCustomStatus(e.target.value)}
                    placeholder="Set a custom status..."
                    className="flex-1 bg-[#1e1f22] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                    maxLength={128}
                  />
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                  >
                    <Check className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-400">
                  {customStatus || 'No custom status set'}
                </p>
              )}
            </div>

            {/* Bio */}
            <div className="bg-[#2b2d31] rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-300">About Me</span>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1 hover:bg-[#1e1f22] rounded transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
              {isEditing ? (
                <div className="space-y-2">
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    className="w-full bg-[#1e1f22] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none resize-none"
                    rows={4}
                    maxLength={190}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{bio.length}/190</span>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 whitespace-pre-wrap">
                  {bio || 'No bio set'}
                </p>
              )}
            </div>

            {/* Member Since */}
            <div className="bg-[#2b2d31] rounded-lg p-4">
              <span className="text-sm font-semibold text-gray-300 block mb-1">
                Unity Platform Member Since
              </span>
              <span className="text-sm text-gray-400">
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg transition-all hover-lift">
                Send Message
              </button>
              <button className="px-4 bg-[#2b2d31] hover:bg-[#383a40] text-white font-medium py-3 rounded-lg transition-colors">
                More
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
