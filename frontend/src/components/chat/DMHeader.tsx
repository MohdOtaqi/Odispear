import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Video, Pin, Users, UserCircle, MoreVertical, Bell, BellOff, Search, Sparkles } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Tooltip } from '../ui/Tooltip';
import { UserProfileModal } from '../UserProfileModal';
import { DMCallModal } from '../DM/DMCallModal';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

interface DMParticipant {
  id: string;
  user_id?: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  status?: 'online' | 'idle' | 'dnd' | 'offline';
}

interface DMChannel {
  id: string;
  type?: 'dm' | 'group_dm';
  name?: string;
  participants: DMParticipant[];
}

interface DMHeaderProps {
  channel: DMChannel;
  onStartCall?: (type: 'voice' | 'video') => void;
}

const HeaderButton = ({ tooltip, onClick, children, isActive, danger }: {
  tooltip: string;
  onClick?: () => void;
  children: React.ReactNode;
  isActive?: boolean;
  danger?: boolean;
}) => (
  <Tooltip content={tooltip} position="bottom">
    <motion.button
      onClick={onClick}
      className={`p-2 rounded-xl transition-colors ${isActive
          ? 'text-mot-gold bg-mot-gold/10'
          : danger
            ? 'text-gray-400 hover:text-red-400 hover:bg-red-500/10'
            : 'text-gray-400 hover:text-mot-gold hover:bg-mot-gold/10'
        }`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      {children}
    </motion.button>
  </Tooltip>
);

export const DMHeader: React.FC<DMHeaderProps> = ({ channel, onStartCall }) => {
  const { user } = useAuthStore();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callWithVideo, setCallWithVideo] = useState(false);

  const otherParticipant = channel.participants?.find(
    (p) => (p.id !== user?.id && p.user_id !== user?.id)
  ) || channel.participants?.[0];

  const isGroupDM = channel.type === 'group_dm' || (channel.participants?.length || 0) > 2;
  const displayName = isGroupDM
    ? channel.name || 'Group DM'
    : otherParticipant?.display_name || otherParticipant?.username || 'Unknown';

  const handleOpenProfile = () => {
    if (otherParticipant) {
      setSelectedUserId(otherParticipant.id || otherParticipant.user_id || null);
      setShowProfileModal(true);
    }
  };

  const handleVoiceCall = () => {
    setCallWithVideo(false);
    setShowCallModal(true);
    onStartCall?.('voice');
  };

  const handleVideoCall = () => {
    setCallWithVideo(true);
    setShowCallModal(true);
    onStartCall?.('video');
  };

  const toggleMute = () => {
    setMuted(!muted);
    toast(muted ? 'Unmuted conversation' : 'Muted conversation', { icon: muted ? '🔔' : '🔕' });
  };

  const statusColors = {
    online: 'bg-green-500',
    idle: 'bg-amber-500',
    dnd: 'bg-red-500',
    offline: 'bg-gray-500'
  };

  return (
    <>
      <motion.div
        className="h-14 px-4 flex items-center justify-between border-b border-mot-border bg-mot-surface/80 backdrop-blur-md"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Left side - User info */}
        <div className="flex items-center flex-1 min-w-0">
          {isGroupDM ? (
            <motion.div
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-mot-gold/30 to-amber-500/30 flex items-center justify-center mr-3"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <Users className="h-5 w-5 text-mot-gold" />
            </motion.div>
          ) : (
            <motion.button
              onClick={handleOpenProfile}
              className="flex items-center"
              whileHover={{ scale: 1.05 }}
            >
              <Avatar
                src={otherParticipant?.avatar_url}
                alt={displayName}
                size="md"
                status={otherParticipant?.status}
                fallback={displayName.charAt(0)}
                ring
                ringColor="rgba(212, 175, 55, 0.3)"
              />
            </motion.button>
          )}

          <div className="ml-3 min-w-0">
            <motion.button
              onClick={handleOpenProfile}
              className="font-semibold text-white hover:text-mot-gold truncate block transition-colors"
              whileHover={{ x: 2 }}
            >
              {displayName}
            </motion.button>
            {!isGroupDM && otherParticipant?.status && (
              <div className="flex items-center gap-1.5">
                <motion.span
                  className={`w-2 h-2 rounded-full ${statusColors[otherParticipant.status]}`}
                  animate={otherParticipant.status === 'online' ? { scale: [1, 1.2, 1] } : undefined}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-xs text-gray-400 capitalize">
                  {otherParticipant.status === 'dnd' ? 'Do Not Disturb' : otherParticipant.status}
                </span>
              </div>
            )}
            {isGroupDM && (
              <span className="text-xs text-gray-400">
                {channel.participants?.length || 0} Members
              </span>
            )}
          </div>
        </div>

        {/* Right side - Actions */}
        <motion.div
          className="flex items-center gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <HeaderButton tooltip="Start Voice Call" onClick={handleVoiceCall}>
            <Phone className="h-5 w-5" />
          </HeaderButton>

          <HeaderButton tooltip="Start Video Call" onClick={handleVideoCall}>
            <Video className="h-5 w-5" />
          </HeaderButton>

          <div className="w-px h-6 bg-mot-border mx-1" />

          <HeaderButton tooltip="Pinned Messages">
            <Pin className="h-5 w-5" />
          </HeaderButton>

          {!isGroupDM && (
            <HeaderButton tooltip="View Profile" onClick={handleOpenProfile}>
              <UserCircle className="h-5 w-5" />
            </HeaderButton>
          )}

          {isGroupDM && (
            <HeaderButton tooltip="Show Members">
              <Users className="h-5 w-5" />
            </HeaderButton>
          )}

          <HeaderButton tooltip="Search">
            <Search className="h-5 w-5" />
          </HeaderButton>

          <HeaderButton
            tooltip={muted ? 'Unmute Conversation' : 'Mute Conversation'}
            onClick={toggleMute}
            isActive={muted}
          >
            <AnimatePresence mode="wait">
              {muted ? (
                <motion.div
                  key="muted"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                >
                  <BellOff className="h-5 w-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="unmuted"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                >
                  <Bell className="h-5 w-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </HeaderButton>

          <HeaderButton tooltip="More Options">
            <MoreVertical className="h-5 w-5" />
          </HeaderButton>
        </motion.div>
      </motion.div>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfileModal && selectedUserId && (
          <UserProfileModal
            userId={selectedUserId}
            onClose={() => setShowProfileModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Call Modal */}
      <DMCallModal
        isOpen={showCallModal}
        onClose={() => setShowCallModal(false)}
        channelId={channel.id}
        participantName={displayName}
        participantAvatar={otherParticipant?.avatar_url}
        initialVideo={callWithVideo}
      />
    </>
  );
};
