import React from 'react';
import { Volume2, Mic, MicOff, Headphones, Video, Monitor, Users, PhoneOff, MoreHorizontal, VolumeX } from 'lucide-react';
import { useVoiceChat } from './VoiceChatProvider';
import { useAuthStore } from '../../store/authStore';

interface VoiceUser {
  id: string;
  username: string;
  avatar_url?: string;
  muted?: boolean;
  deafened?: boolean;
  speaking?: boolean;
}

interface VoiceChannelViewProps {
  channelId: string;
  channelName: string;
  connectedUsers?: VoiceUser[];
  onJoinVoice: () => void;
  onLeave: () => void;
}

export const VoiceChannelView: React.FC<VoiceChannelViewProps> = ({
  channelId,
  channelName,
  connectedUsers = [],
  onJoinVoice,
  onLeave,
}) => {
  const { user } = useAuthStore();
  const { isConnected, channelId: currentChannelId, localParticipant, isDeafened, toggleMute, toggleDeafen, speakingParticipants, participants } = useVoiceChat();
  const isInThisChannel = isConnected && currentChannelId === channelId;
  const isMuted = localParticipant?.audio === false;
  const isSpeaking = localParticipant?.session_id ? speakingParticipants.has(localParticipant.session_id) : false;

  // Build the list of users from participants
  const allUsers = isInThisChannel && user 
    ? [
        { 
          id: user.id, 
          username: user.username, 
          avatar_url: user.avatar_url, 
          muted: isMuted, 
          deafened: isDeafened, 
          speaking: isSpeaking,
          session_id: localParticipant?.session_id 
        }, 
        ...participants.filter(p => !p.local).map(p => ({
          id: p.user_id || p.session_id,
          username: p.user_name || 'User',
          avatar_url: undefined,
          muted: !p.audio,
          deafened: false,
          speaking: speakingParticipants.has(p.session_id),
          session_id: p.session_id
        }))
      ]
    : connectedUsers;

  return (
    <div className="flex-1 flex flex-col bg-mot-background relative">
      {/* Header */}
      <div className="h-12 px-4 flex items-center gap-3 border-b border-mot-border bg-mot-surface shadow-sm">
        <Volume2 className="w-5 h-5 text-gray-400" />
        <span className="font-semibold text-white">{channelName}</span>
      </div>

      {/* Main Content - User Cards Grid */}
      <div className="flex-1 flex flex-wrap content-center justify-center gap-4 p-8 overflow-y-auto">
        {allUsers.length > 0 ? (
          allUsers.map((voiceUser) => (
            <div
              key={voiceUser.id}
              className={`relative w-[280px] h-[200px] rounded-xl overflow-hidden transition-all ${
                voiceUser.speaking 
                  ? 'ring-4 ring-green-500 shadow-lg shadow-green-500/30' 
                  : 'ring-2 ring-mot-border'
              }`}
              style={{
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
              }}
            >
              {/* User Avatar - Large centered */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`relative ${voiceUser.speaking ? 'animate-pulse' : ''}`}>
                  <div className={`w-24 h-24 rounded-full overflow-hidden border-4 ${
                    voiceUser.speaking ? 'border-green-500' : 'border-mot-gold/30'
                  }`}>
                    {voiceUser.avatar_url ? (
                      <img 
                        src={voiceUser.avatar_url} 
                        alt={voiceUser.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-mot-gold to-mot-gold-dark flex items-center justify-center text-3xl font-bold text-mot-black">
                        {voiceUser.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  {/* Mute/Deafen indicators */}
                  {(voiceUser.muted || voiceUser.deafened) && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                      {voiceUser.muted && (
                        <div className="p-1.5 bg-red-500 rounded-full shadow-lg">
                          <MicOff className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                      {voiceUser.deafened && (
                        <div className="p-1.5 bg-red-500 rounded-full shadow-lg">
                          <VolumeX className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Username at bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-center text-white font-medium truncate">
                  {voiceUser.username}
                  {voiceUser.id === user?.id && <span className="text-gray-400 text-sm ml-1">(You)</span>}
                </p>
              </div>

              {/* Speaking indicator */}
              {voiceUser.speaking && (
                <div className="absolute top-3 right-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-ping" />
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-mot-surface flex items-center justify-center">
              <Volume2 className="w-10 h-10 text-mot-gold" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">{channelName}</h2>
            <p className="text-gray-400 mb-6">No one is in this voice channel</p>
            {!isInThisChannel && (
              <button
                onClick={onJoinVoice}
                className="px-6 py-2.5 bg-mot-gold hover:bg-mot-gold-dark text-mot-black font-semibold rounded-lg transition-colors"
              >
                Join Voice
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom Controls Bar - Only show when connected */}
      {isInThisChannel && (
        <div className="h-16 px-4 flex items-center justify-center gap-2 bg-mot-surface border-t border-mot-border">
          {/* Mute */}
          <button
            onClick={toggleMute}
            className={`p-3 rounded-full transition-colors ${
              isMuted 
                ? 'bg-white/10 text-white' 
                : 'hover:bg-white/10 text-gray-400 hover:text-white'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            <div className="relative">
              <Mic className="w-5 h-5" />
              {isMuted && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-7 h-0.5 bg-red-500 rotate-45 rounded-full" />
                </div>
              )}
            </div>
          </button>

          {/* Deafen */}
          <button
            onClick={toggleDeafen}
            className={`p-3 rounded-full transition-colors ${
              isDeafened 
                ? 'bg-white/10 text-white' 
                : 'hover:bg-white/10 text-gray-400 hover:text-white'
            }`}
            title={isDeafened ? 'Undeafen' : 'Deafen'}
          >
            <div className="relative">
              <Headphones className="w-5 h-5" />
              {isDeafened && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-7 h-0.5 bg-red-500 rotate-45 rounded-full" />
                </div>
              )}
            </div>
          </button>

          {/* Video - Placeholder */}
          <button
            className="p-3 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title="Video"
          >
            <Video className="w-5 h-5" />
          </button>

          {/* Screen Share - Placeholder */}
          <button
            className="p-3 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title="Share Screen"
          >
            <Monitor className="w-5 h-5" />
          </button>

          {/* More options */}
          <button
            className="p-3 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title="More"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {/* Disconnect */}
          <button
            onClick={onLeave}
            className="p-3 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors ml-2"
            title="Disconnect"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Join button when not connected but others are */}
      {!isInThisChannel && allUsers.length > 0 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <button
            onClick={onJoinVoice}
            className="px-8 py-3 bg-mot-gold hover:bg-mot-gold-dark text-mot-black font-semibold rounded-lg transition-colors shadow-lg flex items-center gap-2"
          >
            <Users className="w-5 h-5" />
            Join Voice
          </button>
        </div>
      )}
    </div>
  );
};
