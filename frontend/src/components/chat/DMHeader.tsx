import React, { useState } from 'react';
import { Phone, Video, Pin, Users, UserCircle, MoreVertical, Bell, BellOff, Search } from 'lucide-react';
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

export const DMHeader: React.FC<DMHeaderProps> = ({ channel, onStartCall }) => {
  const { user } = useAuthStore();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callWithVideo, setCallWithVideo] = useState(false);

  // Find the other participant (not the current user)
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

  return (
    <>
      <div className="h-12 px-4 flex items-center justify-between border-b border-mot-border bg-mot-surface shadow-sm">
        {/* Left side - User info */}
        <div className="flex items-center flex-1 min-w-0">
          {isGroupDM ? (
            <div className="w-8 h-8 rounded-full bg-mot-gold/20 flex items-center justify-center mr-3">
              <Users className="h-4 w-4 text-mot-gold" />
            </div>
          ) : (
            <button
              onClick={handleOpenProfile}
              className="flex items-center hover:opacity-80 transition-opacity"
            >
              <Avatar
                src={otherParticipant?.avatar_url}
                alt={displayName}
                size="sm"
                status={otherParticipant?.status}
                fallback={displayName.charAt(0)}
              />
            </button>
          )}
          
          <div className="ml-3 min-w-0">
            <button
              onClick={handleOpenProfile}
              className="font-semibold text-white hover:underline truncate block"
            >
              {displayName}
            </button>
            {!isGroupDM && otherParticipant?.status && (
              <span className="text-xs text-gray-400 capitalize">
                {otherParticipant.status === 'dnd' ? 'Do Not Disturb' : otherParticipant.status}
              </span>
            )}
            {isGroupDM && (
              <span className="text-xs text-gray-400">
                {channel.participants?.length || 0} Members
              </span>
            )}
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-1">
          <Tooltip content="Start Voice Call" position="bottom">
            <button
              onClick={handleVoiceCall}
              className="p-2 text-gray-400 hover:text-mot-gold hover:bg-mot-gold/10 rounded-md transition-colors"
            >
              <Phone className="h-5 w-5" />
            </button>
          </Tooltip>

          <Tooltip content="Start Video Call" position="bottom">
            <button
              onClick={handleVideoCall}
              className="p-2 text-gray-400 hover:text-mot-gold hover:bg-mot-gold/10 rounded-md transition-colors"
            >
              <Video className="h-5 w-5" />
            </button>
          </Tooltip>

          <div className="w-px h-6 bg-mot-border mx-1" />

          <Tooltip content="Pinned Messages" position="bottom">
            <button className="p-2 text-gray-400 hover:text-mot-gold hover:bg-mot-gold/10 rounded-md transition-colors">
              <Pin className="h-5 w-5" />
            </button>
          </Tooltip>

          {!isGroupDM && (
            <Tooltip content="View Profile" position="bottom">
              <button
                onClick={handleOpenProfile}
                className="p-2 text-gray-400 hover:text-mot-gold hover:bg-mot-gold/10 rounded-md transition-colors"
              >
                <UserCircle className="h-5 w-5" />
              </button>
            </Tooltip>
          )}

          {isGroupDM && (
            <Tooltip content="Show Members" position="bottom">
              <button className="p-2 text-gray-400 hover:text-mot-gold hover:bg-mot-gold/10 rounded-md transition-colors">
                <Users className="h-5 w-5" />
              </button>
            </Tooltip>
          )}

          <Tooltip content="Search" position="bottom">
            <button className="p-2 text-gray-400 hover:text-mot-gold hover:bg-mot-gold/10 rounded-md transition-colors">
              <Search className="h-5 w-5" />
            </button>
          </Tooltip>

          <Tooltip content={muted ? 'Unmute Conversation' : 'Mute Conversation'} position="bottom">
            <button
              onClick={toggleMute}
              className="p-2 text-gray-400 hover:text-mot-gold hover:bg-mot-gold/10 rounded-md transition-colors"
            >
              {muted ? <BellOff className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
            </button>
          </Tooltip>

          <Tooltip content="More Options" position="bottom">
            <button className="p-2 text-gray-400 hover:text-mot-gold hover:bg-mot-gold/10 rounded-md transition-colors">
              <MoreVertical className="h-5 w-5" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Profile Modal */}
      {showProfileModal && selectedUserId && (
        <UserProfileModal
          userId={selectedUserId}
          onClose={() => setShowProfileModal(false)}
        />
      )}

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
