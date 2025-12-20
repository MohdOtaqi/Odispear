import React, { useEffect, useRef, useState } from 'react';
import { Volume2, Mic, MicOff, Headphones, Video, Monitor, Users, PhoneOff, Settings, VolumeX, ChevronDown, X, Maximize2 } from 'lucide-react';
import { useVoiceChat, RESOLUTION_OPTIONS, FPS_OPTIONS, ScreenShareSettings } from './VoiceChatProvider';
import { useAuthStore } from '../../store/authStore';
import { useVoiceUsersStore } from '../../store/voiceUsersStore';

// Component to render a participant's video
const ParticipantVideo: React.FC<{ sessionId: string; isScreen?: boolean; isLocal?: boolean; getCallObject: () => any; className?: string }> = ({
  sessionId,
  isScreen = false,
  isLocal = false,
  getCallObject,
  className
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const retryRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const callObject = getCallObject();
    if (!callObject || !videoRef.current) return;

    const updateVideo = () => {
      // For local participant, use 'local' key; for remote, use session_id
      const participantKey = isLocal ? 'local' : sessionId;
      const participant = callObject.participants()[participantKey];
      if (!participant || !videoRef.current) return;

      // Get the correct track based on whether it's screen share or camera
      const trackKey = isScreen ? 'screenVideo' : 'video';
      const tracks = participant.tracks?.[trackKey];

      // Try multiple track sources
      const track = tracks?.track || tracks?.persistentTrack;

      if (track && track.readyState === 'live') {
        if (videoRef.current.srcObject !== null) {
          const currentStream = videoRef.current.srcObject as MediaStream;
          const currentTrack = currentStream.getVideoTracks()[0];
          if (currentTrack?.id === track.id) return; // Same track, skip
        }
        videoRef.current.srcObject = new MediaStream([track]);
        videoRef.current.play().catch(console.error);
        // Clear retry interval once we have a valid track
        if (retryRef.current) {
          clearInterval(retryRef.current);
          retryRef.current = null;
        }
      }
    };

    // Initial update with slight delay for local tracks
    setTimeout(updateVideo, isLocal ? 200 : 50);

    // Retry periodically until track is available (for local video which may take time)
    if (isLocal) {
      retryRef.current = setInterval(updateVideo, 500);
      // Stop retrying after 5 seconds
      setTimeout(() => {
        if (retryRef.current) {
          clearInterval(retryRef.current);
          retryRef.current = null;
        }
      }, 5000);
    }

    // Listen for track updates
    const handleTrackStarted = (event: any) => {
      const isMatchingParticipant = isLocal
        ? event.participant?.local === true
        : event.participant?.session_id === sessionId;

      if (isMatchingParticipant) {
        setTimeout(updateVideo, 100);
      }
    };

    const handleParticipantUpdated = (event: any) => {
      const isMatchingParticipant = isLocal
        ? event.participant?.local === true
        : event.participant?.session_id === sessionId;

      if (isMatchingParticipant) {
        updateVideo();
      }
    };

    callObject.on('track-started', handleTrackStarted);
    callObject.on('participant-updated', handleParticipantUpdated);

    return () => {
      callObject.off('track-started', handleTrackStarted);
      callObject.off('participant-updated', handleParticipantUpdated);
      if (retryRef.current) {
        clearInterval(retryRef.current);
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [sessionId, isScreen, isLocal, getCallObject]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className={className || `absolute inset-0 w-full h-full ${isScreen ? 'object-contain' : 'object-cover'} bg-black`}
    />
  );
};

interface VoiceUser {
  id: string;
  username: string;
  avatar_url?: string;
  muted?: boolean;
  deafened?: boolean;
  speaking?: boolean;
  session_id?: string;
  hasVideo?: boolean;
  hasScreen?: boolean;
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

  // Get voice users from store to look up avatar URLs
  const voiceChannelUsersMap = useVoiceUsersStore(state => state.voiceChannelUsers);
  const channelVoiceUsers = voiceChannelUsersMap[channelId] || [];

  const {
    isConnected,
    channelId: currentChannelId,
    localParticipant,
    isDeafened,
    toggleMute,
    toggleDeafen,
    toggleVideo,
    toggleScreenShare,
    isVideoEnabled,
    isScreenSharing,
    screenShareParticipant,
    speakingParticipants,
    participants,
    getCallObject,
    screenShareSettings,
    setScreenShareSettings
  } = useVoiceChat();

  const [showScreenShareSettings, setShowScreenShareSettings] = useState(false);
  const [expandedVideo, setExpandedVideo] = useState<{ sessionId: string; username: string; isLocal: boolean } | null>(null);
  const [isScreenShareMaximized, setIsScreenShareMaximized] = useState(false);
  const isInThisChannel = isConnected && currentChannelId === channelId;
  const isMuted = localParticipant?.audio === false;
  const isSpeaking = localParticipant?.session_id ? speakingParticipants.has(localParticipant.session_id) : false;

  // Helper to find avatar_url from voiceUsersStore
  const findAvatarUrl = (userId: string) => {
    const voiceUser = channelVoiceUsers.find(u => u.id === userId);
    return voiceUser?.avatar_url;
  };

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
        session_id: localParticipant?.session_id,
        hasVideo: isVideoEnabled,
        hasScreen: isScreenSharing,
        isLocal: true
      },
      ...participants.filter(p => !p.local).map(p => ({
        id: p.user_id || p.session_id,
        username: p.user_name || 'User',
        avatar_url: findAvatarUrl(p.user_id || p.session_id),
        muted: !p.audio,
        deafened: false,
        speaking: speakingParticipants.has(p.session_id),
        session_id: p.session_id,
        hasVideo: p.video === true,
        hasScreen: p.screen === true,
        isLocal: false
      }))
    ]
    : connectedUsers;

  // Check if local user is the one screen sharing
  const isLocalScreenSharing = isScreenSharing && screenShareParticipant === localParticipant?.session_id;

  return (
    <div className="flex-1 flex flex-col bg-mot-background relative">
      {/* Header */}
      <div className="h-12 px-4 flex items-center gap-3 border-b border-mot-border bg-mot-surface shadow-sm">
        <Volume2 className="w-5 h-5 text-gray-400" />
        <span className="font-semibold text-white">{channelName}</span>
      </div>

      {/* Screen Share View - Full width when someone is sharing */}
      {(screenShareParticipant || isScreenSharing) && (
        <div className={`${isScreenShareMaximized ? 'fixed inset-0 z-50' : 'flex-1'} flex items-center justify-center bg-black`}>
          <div className={`relative ${isScreenShareMaximized ? 'w-full h-full' : 'w-full h-full'} overflow-hidden`}>
            <ParticipantVideo
              sessionId={screenShareParticipant || localParticipant?.session_id || ''}
              isScreen={true}
              isLocal={isLocalScreenSharing || (!screenShareParticipant && isScreenSharing)}
              getCallObject={getCallObject}
            />
            <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/70 rounded-lg flex items-center gap-2 z-10">
              <Monitor className="w-4 h-4 text-mot-gold" />
              <span className="text-white text-sm">
                {isLocalScreenSharing || (!screenShareParticipant && isScreenSharing)
                  ? 'You are sharing'
                  : `${allUsers.find(u => u.session_id === screenShareParticipant)?.username || 'Someone'} is sharing`}
              </span>
            </div>
            {/* Maximize/Minimize button */}
            <button
              onClick={() => setIsScreenShareMaximized(!isScreenShareMaximized)}
              className="absolute top-4 right-4 p-2 bg-black/70 rounded-lg hover:bg-black/90 transition-colors z-10"
              title={isScreenShareMaximized ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isScreenShareMaximized ? <X className="w-5 h-5 text-white" /> : <Maximize2 className="w-5 h-5 text-white" />}
            </button>
          </div>
        </div>
      )}

      {/* Main Content - User Cards Grid */}
      <div className={`${screenShareParticipant || isScreenSharing ? 'h-48' : 'flex-1'} flex flex-wrap content-center justify-center gap-4 p-8 overflow-y-auto`}>
        {allUsers.length > 0 ? (
          allUsers.map((voiceUser: any) => (
            <div
              key={voiceUser.id}
              onClick={() => voiceUser.hasVideo && voiceUser.session_id && setExpandedVideo({
                sessionId: voiceUser.session_id,
                username: voiceUser.username,
                isLocal: voiceUser.isLocal
              })}
              className={`relative ${screenShareParticipant || isScreenSharing ? 'w-32 h-24' : 'w-[280px] h-[200px]'} rounded-xl overflow-hidden transition-all cursor-pointer hover:scale-105 ${voiceUser.speaking
                ? 'ring-4 ring-green-500 shadow-lg shadow-green-500/30'
                : 'ring-2 ring-mot-border hover:ring-mot-gold'
                }`}
              style={{
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
              }}
            >
              {/* Video Feed */}
              {voiceUser.hasVideo && voiceUser.session_id && (
                <ParticipantVideo
                  sessionId={voiceUser.session_id}
                  isLocal={voiceUser.isLocal}
                  getCallObject={getCallObject}
                />
              )}

              {/* User Avatar - Show when no video */}
              {!voiceUser.hasVideo && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`relative ${voiceUser.speaking ? 'animate-pulse' : ''}`}>
                    <div className={`${screenShareParticipant ? 'w-12 h-12' : 'w-24 h-24'} rounded-full overflow-hidden border-4 ${voiceUser.speaking ? 'border-green-500' : 'border-mot-gold/30'
                      }`}>
                      <div className="w-full h-full bg-gradient-to-br from-mot-gold to-mot-gold-dark flex items-center justify-center">
                        {voiceUser.avatar_url ? (
                          <img
                            src={voiceUser.avatar_url.startsWith('http') ? voiceUser.avatar_url : `${import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://n0tmot.com/api' : 'http://localhost:5000')}${voiceUser.avatar_url}`}
                            alt={voiceUser.username}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`${voiceUser.avatar_url ? 'hidden' : ''} w-full h-full flex items-center justify-center ${screenShareParticipant ? 'text-lg' : 'text-3xl'} font-bold text-mot-black`}>
                          {voiceUser.username.charAt(0).toUpperCase()}
                        </div>
                      </div>
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
              )}

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
            className={`p-3 rounded-full transition-colors ${isMuted
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
            className={`p-3 rounded-full transition-colors ${isDeafened
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

          {/* Video */}
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full transition-colors ${isVideoEnabled
              ? 'bg-mot-gold text-mot-black'
              : 'hover:bg-white/10 text-gray-400 hover:text-white'
              }`}
            title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            <div className="relative">
              <Video className="w-5 h-5" />
              {!isVideoEnabled && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-7 h-0.5 bg-red-500 rotate-45 rounded-full" />
                </div>
              )}
            </div>
          </button>

          {/* Screen Share with Settings */}
          <div className="relative">
            <div className="flex items-center">
              <button
                onClick={toggleScreenShare}
                className={`p-3 rounded-l-full transition-colors ${isScreenSharing
                  ? 'bg-mot-gold text-mot-black'
                  : 'hover:bg-white/10 text-gray-400 hover:text-white'
                  }`}
                title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
              >
                <Monitor className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowScreenShareSettings(!showScreenShareSettings)}
                className={`p-3 rounded-r-full border-l border-white/10 transition-colors ${showScreenShareSettings
                  ? 'bg-white/20 text-white'
                  : 'hover:bg-white/10 text-gray-400 hover:text-white'
                  }`}
                title="Screen share settings"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Screen Share Settings Dropdown */}
            {showScreenShareSettings && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 bg-[#1e1f22] rounded-lg shadow-xl border border-white/10 p-4 z-50">
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Screen Share Quality
                </h4>

                {/* Resolution */}
                <div className="mb-3">
                  <label className="text-xs text-gray-400 mb-1.5 block">Resolution</label>
                  <select
                    value={screenShareSettings.resolution}
                    onChange={(e) => setScreenShareSettings({
                      ...screenShareSettings,
                      resolution: e.target.value as ScreenShareSettings['resolution']
                    })}
                    className="w-full bg-[#2b2d31] text-white text-sm rounded-lg px-3 py-2 border border-white/10 focus:outline-none focus:ring-2 focus:ring-mot-gold"
                  >
                    {RESOLUTION_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* FPS */}
                <div className="mb-3">
                  <label className="text-xs text-gray-400 mb-1.5 block">Frame Rate</label>
                  <select
                    value={screenShareSettings.fps}
                    onChange={(e) => setScreenShareSettings({
                      ...screenShareSettings,
                      fps: e.target.value === 'max' ? 'max' : Number(e.target.value) as ScreenShareSettings['fps']
                    })}
                    className="w-full bg-[#2b2d31] text-white text-sm rounded-lg px-3 py-2 border border-white/10 focus:outline-none focus:ring-2 focus:ring-mot-gold"
                  >
                    {FPS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  Settings apply when you start sharing
                </p>
              </div>
            )}
          </div>

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

      {/* Expanded Video Modal */}
      {expandedVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-8"
          onClick={() => setExpandedVideo(null)}
        >
          <div
            className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden ring-4 ring-mot-gold"
            onClick={(e) => e.stopPropagation()}
          >
            <ParticipantVideo
              sessionId={expandedVideo.sessionId}
              isLocal={expandedVideo.isLocal}
              getCallObject={getCallObject}
            />
            <div className="absolute bottom-4 left-4 px-4 py-2 bg-black/70 rounded-lg">
              <span className="text-white font-medium">{expandedVideo.username}</span>
            </div>
            <button
              onClick={() => setExpandedVideo(null)}
              className="absolute top-4 right-4 p-2 bg-black/70 rounded-lg hover:bg-red-500/80 transition-colors"
              title="Close"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
