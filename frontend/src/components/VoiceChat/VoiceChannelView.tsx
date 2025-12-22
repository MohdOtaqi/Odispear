import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Volume2, Mic, MicOff, Headphones, Video, Monitor, Users, PhoneOff, Settings, VolumeX, ChevronDown, X, Maximize2, MessageSquare, User, UserX } from 'lucide-react';
import { useVoiceChat, RESOLUTION_OPTIONS, FPS_OPTIONS, ScreenShareSettings } from './LiveKitProvider';
import { useAuthStore } from '../../store/authStore';
import { useVoiceUsersStore } from '../../store/voiceUsersStore';
import { UserProfileModal } from '../UserProfileModal';
import { Track, Participant } from 'livekit-client';

// Component to render a participant's video using LiveKit with PiP support
const ParticipantVideo: React.FC<{
  participant: Participant;
  isScreen?: boolean;
  isLocal?: boolean;
  className?: string;
  showPiPButton?: boolean;
}> = ({
  participant,
  isScreen = false,
  isLocal = false,
  className,
  showPiPButton = true
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isInPiP, setIsInPiP] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
      if (!participant || !videoRef.current) return;

      const attachTrack = () => {
        // Get the correct track based on whether it's screen share or camera
        const trackSource = isScreen ? Track.Source.ScreenShare : Track.Source.Camera;

        // Try to get the track publication for this source
        const publication = participant.getTrackPublication(trackSource);
        if (publication?.track && videoRef.current) {
          publication.track.attach(videoRef.current);
          console.log('[ParticipantVideo] Attached', isScreen ? 'screen' : 'camera', 'track for:', participant.identity);
        } else {
          // Fallback: iterate through all video publications
          participant.videoTrackPublications.forEach((pub) => {
            if (pub.track && pub.source === trackSource && videoRef.current) {
              pub.track.attach(videoRef.current);
              console.log('[ParticipantVideo] Attached via fallback:', isScreen ? 'screen' : 'camera', 'for:', participant.identity);
            }
          });
        }
      };

      // Attach track initially
      attachTrack();

      // Listen for track subscribed/published events
      const handleTrackSubscribed = () => attachTrack();
      const handleTrackUnsubscribed = () => {
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      };

      participant.on('trackSubscribed', handleTrackSubscribed);
      participant.on('trackPublished', handleTrackSubscribed);
      participant.on('trackUnsubscribed', handleTrackUnsubscribed);

      return () => {
        participant.off('trackSubscribed', handleTrackSubscribed);
        participant.off('trackPublished', handleTrackSubscribed);
        participant.off('trackUnsubscribed', handleTrackUnsubscribed);
        // Detach tracks
        participant.videoTrackPublications.forEach((publication) => {
          if (publication.track) {
            publication.track.detach(videoRef.current!);
          }
        });
      };
    }, [participant, isScreen]);

    // Handle PiP state changes
    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      const handleEnterPiP = () => setIsInPiP(true);
      const handleLeavePiP = () => setIsInPiP(false);

      video.addEventListener('enterpictureinpicture', handleEnterPiP);
      video.addEventListener('leavepictureinpicture', handleLeavePiP);

      return () => {
        video.removeEventListener('enterpictureinpicture', handleEnterPiP);
        video.removeEventListener('leavepictureinpicture', handleLeavePiP);
      };
    }, []);

    // Toggle PiP mode
    const togglePiP = async () => {
      const video = videoRef.current;
      if (!video) return;

      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else if (document.pictureInPictureEnabled) {
          await video.requestPictureInPicture();
        }
      } catch (error) {
        console.error('[PiP] Failed to toggle:', error);
      }
    };

    // Check if PiP is supported
    const isPiPSupported = 'pictureInPictureEnabled' in document && document.pictureInPictureEnabled;

    return (
      <div
        className="relative w-full h-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={className || `absolute inset-0 w-full h-full ${isScreen ? 'object-contain' : 'object-cover'} bg-black`}
        />

        {/* PiP Button - appears on hover */}
        {showPiPButton && isPiPSupported && isHovered && (
          <button
            onClick={togglePiP}
            className="absolute top-2 right-2 p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white transition-all duration-200 backdrop-blur-sm z-10"
            title={isInPiP ? 'Exit Picture-in-Picture' : 'Picture-in-Picture'}
          >
            {isInPiP ? (
              <X className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        )}

        {/* PiP indicator */}
        {isInPiP && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-white text-sm font-medium">Playing in Picture-in-Picture</div>
          </div>
        )}
      </div>
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

  // State for context menu and profile modal
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; userId: string; username: string; isLocal: boolean; sessionId?: string } | null>(null);
  const [userVolumes, setUserVolumes] = useState<Record<string, number>>({}); // Per-user volume (0-200)

  // Handle right-click on user card
  const handleContextMenu = useCallback((e: React.MouseEvent, voiceUser: any) => {
    e.preventDefault();
    e.stopPropagation();
    // Don't show menu for own user, but still prevent browser context menu
    if (voiceUser.id === user?.id) return;
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      userId: voiceUser.id,
      username: voiceUser.username,
      isLocal: voiceUser.isLocal,
      sessionId: voiceUser.session_id
    });
  }, [user?.id]);

  // Handle clicking user card to open profile
  const handleUserClick = useCallback((e: React.MouseEvent, voiceUser: any) => {
    e.stopPropagation();
    if (voiceUser.hasVideo && voiceUser.session_id) {
      // If has video, expand video (existing behavior)
      setExpandedVideo({
        sessionId: voiceUser.session_id,
        username: voiceUser.username,
        isLocal: voiceUser.isLocal
      });
    } else if (voiceUser.id !== user?.id) {
      // Otherwise open profile modal (not for self)
      setSelectedUserId(voiceUser.id);
    }
  }, [user?.id]);

  const {
    isConnected,
    channelId: currentChannelId,
    localParticipant,
    isMuted,
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
    getRoom,
    screenShareSettings,
    setScreenShareSettings
  } = useVoiceChat();

  const [showScreenShareSettings, setShowScreenShareSettings] = useState(false);
  const [expandedVideo, setExpandedVideo] = useState<{ sessionId: string; username: string; isLocal: boolean } | null>(null);
  const [isScreenShareMaximized, setIsScreenShareMaximized] = useState(false);
  const isInThisChannel = isConnected && currentChannelId === channelId;
  // LiveKit: use isMuted from context instead of localParticipant.audio
  // LiveKit: use identity instead of session_id for participant identification
  const localParticipantId = localParticipant?.identity || localParticipant?.sid;
  const isSpeaking = localParticipantId ? speakingParticipants.has(localParticipantId) : false;

  // Helper to find avatar_url from voiceUsersStore
  const findAvatarUrl = (userId: string) => {
    const voiceUser = channelVoiceUsers.find(u => u.id === userId);
    return voiceUser?.avatar_url;
  };

  // Build the list of users from participants
  // Note: LiveKit uses 'identity' not 'session_id', 'name' not 'user_name', 'isLocal' not 'local'
  const allUsers = isInThisChannel && user
    ? [
      {
        id: user.id,
        username: user.username,
        avatar_url: user.avatar_url,
        muted: isMuted,
        deafened: isDeafened,
        speaking: isSpeaking,
        session_id: localParticipant?.identity || localParticipant?.sid || user.id,
        hasVideo: isVideoEnabled,
        hasScreen: isScreenSharing,
        isLocal: true
      },
      // Filter and map remote participants using LiveKit properties
      ...participants
        .filter(p => !p.isLocal)
        .map(p => ({
          id: p.identity || p.sid,
          username: p.name || 'User',
          avatar_url: findAvatarUrl(p.identity || p.sid),
          muted: p.isMicrophoneEnabled === false,
          deafened: false,
          speaking: speakingParticipants.has(p.identity),
          session_id: p.identity || p.sid,
          hasVideo: p.isCameraEnabled === true,
          hasScreen: p.isScreenShareEnabled === true,
          isLocal: false
        }))
    ]
    : connectedUsers;

  // Check if local user is the one screen sharing
  const isLocalScreenSharing = isScreenSharing && screenShareParticipant === localParticipant?.identity;

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
              participant={
                // For local screen sharing, use localParticipant
                // For remote screen sharing, find the participant by identity
                screenShareParticipant && screenShareParticipant !== localParticipant?.identity
                  ? (participants.find(p => p.identity === screenShareParticipant) || localParticipant)!
                  : localParticipant!
              }
              isScreen={true}
              isLocal={isLocalScreenSharing || (!screenShareParticipant && isScreenSharing)}
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
              onClick={(e) => handleUserClick(e, voiceUser)}
              onContextMenu={(e) => handleContextMenu(e, voiceUser)}
              className={`relative ${screenShareParticipant || isScreenSharing ? 'w-32 h-24' : 'w-[280px] h-[200px]'} rounded-xl overflow-hidden transition-all cursor-pointer hover:scale-105 ${voiceUser.speaking
                ? 'ring-4 ring-green-500 shadow-lg shadow-green-500/30'
                : 'ring-2 ring-mot-border hover:ring-mot-gold'
                }`}
              style={{
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
              }}
            >
              {/* Video Feed - show if participant has video enabled */}
              {voiceUser.hasVideo && (() => {
                // Find the actual LiveKit Participant object
                const livekitParticipant = voiceUser.isLocal
                  ? localParticipant
                  : participants.find(p => (p.identity || p.sid) === voiceUser.session_id);

                if (livekitParticipant) {
                  return (
                    <ParticipantVideo
                      participant={livekitParticipant}
                      isScreen={false}
                      isLocal={voiceUser.isLocal}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  );
                }
                return (
                  <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">Video loading...</span>
                  </div>
                );
              })()}

              {/* User Avatar - Show when no video */}
              {!voiceUser.hasVideo && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className={`relative ${voiceUser.speaking ? 'animate-pulse' : ''}`}>
                    <div
                      className={`${screenShareParticipant ? 'w-12 h-12' : 'w-24 h-24'} rounded-full overflow-hidden border-4 transition-all duration-200 ${voiceUser.speaking
                        ? 'border-green-400 shadow-[0_0_20px_rgba(74,222,128,0.7),0_0_40px_rgba(74,222,128,0.4)]'
                        : 'border-mot-gold/30'
                        }`}
                    >
                      <div className="w-full h-full bg-gradient-to-br from-mot-gold to-mot-gold-dark flex items-center justify-center">
                        {voiceUser.avatar_url ? (
                          <img
                            src={voiceUser.avatar_url.startsWith('http') ? voiceUser.avatar_url : `${import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://n0tmot.com/api' : 'http://localhost:5000')}${voiceUser.avatar_url}`}
                            alt={voiceUser.username}
                            className="w-full h-full object-cover pointer-events-none select-none"
                            draggable={false}
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

            {/* Screen Share Settings Dropdown - Glassmorphism Style */}
            {showScreenShareSettings && (
              <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-72 bg-gradient-to-b from-[#1a1a2e]/95 to-[#0f0f1a]/98 backdrop-blur-xl rounded-xl shadow-2xl border border-mot-gold/20 overflow-hidden z-50">
                {/* Header */}
                <div className="px-4 py-3 border-b border-white/10 bg-mot-gold/5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-mot-gold/20">
                      <Monitor className="w-4 h-4 text-mot-gold" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Screen Share Quality</h4>
                      <p className="text-[10px] text-gray-400">Configure your stream settings</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  {/* Quick Presets */}
                  <div>
                    <label className="text-xs text-gray-400 mb-2 block font-medium">Quick Presets</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setScreenShareSettings({ resolution: '720p', fps: 30 })}
                        className={`p-2 rounded-lg border text-center transition-all ${screenShareSettings.resolution === '720p' && screenShareSettings.fps === 30
                          ? 'bg-mot-gold/20 border-mot-gold/50 text-mot-gold'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                          }`}
                      >
                        <span className="text-xs font-semibold block">720p</span>
                        <span className="text-[10px] opacity-70">30 FPS</span>
                      </button>
                      <button
                        onClick={() => setScreenShareSettings({ resolution: '1080p', fps: 30 })}
                        className={`p-2 rounded-lg border text-center transition-all ${screenShareSettings.resolution === '1080p' && screenShareSettings.fps === 30
                          ? 'bg-mot-gold/20 border-mot-gold/50 text-mot-gold'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                          }`}
                      >
                        <span className="text-xs font-semibold block">1080p</span>
                        <span className="text-[10px] opacity-70">30 FPS</span>
                      </button>
                      <button
                        onClick={() => setScreenShareSettings({ resolution: '1080p', fps: 60 })}
                        className={`p-2 rounded-lg border text-center transition-all relative ${screenShareSettings.resolution === '1080p' && screenShareSettings.fps === 60
                          ? 'bg-mot-gold/20 border-mot-gold/50 text-mot-gold'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                          }`}
                      >
                        <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 text-[8px] font-bold bg-mot-gold text-black rounded-full">HD</span>
                        <span className="text-xs font-semibold block">1080p</span>
                        <span className="text-[10px] opacity-70">60 FPS</span>
                      </button>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">or customize</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>

                  {/* Resolution */}
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block font-medium">Resolution</label>
                    <select
                      value={screenShareSettings.resolution}
                      onChange={(e) => setScreenShareSettings({
                        ...screenShareSettings,
                        resolution: e.target.value as ScreenShareSettings['resolution']
                      })}
                      className="w-full bg-white/5 text-white text-sm rounded-lg px-3 py-2.5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-mot-gold/50 focus:border-mot-gold/50 transition-all cursor-pointer appearance-none"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1rem' }}
                    >
                      {RESOLUTION_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* FPS */}
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block font-medium">Frame Rate</label>
                    <select
                      value={screenShareSettings.fps}
                      onChange={(e) => setScreenShareSettings({
                        ...screenShareSettings,
                        fps: e.target.value === 'max' ? 'max' : Number(e.target.value) as ScreenShareSettings['fps']
                      })}
                      className="w-full bg-white/5 text-white text-sm rounded-lg px-3 py-2.5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-mot-gold/50 focus:border-mot-gold/50 transition-all cursor-pointer appearance-none"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1rem' }}
                    >
                      {FPS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 bg-black/20 border-t border-white/5">
                  <p className="text-[10px] text-gray-500 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-mot-gold animate-pulse" />
                    Settings apply when you start sharing
                  </p>
                </div>
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
            <div className="w-full h-full bg-gray-900 flex items-center justify-center">
              <span className="text-gray-400">Expanded video view</span>
            </div>
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

      {/* Context Menu for voice users */}
      {contextMenu && (
        <div
          className="fixed z-[100] bg-mot-surface border border-mot-gold/30 rounded-xl shadow-2xl py-2 min-w-[220px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* User header */}
          <div className="px-4 py-2 border-b border-mot-border mb-2">
            <p className="text-sm font-medium text-white">{contextMenu.username}</p>
          </div>

          {/* Volume slider */}
          <div className="px-4 py-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">User Volume</span>
              <span className="text-xs text-mot-gold font-medium">{userVolumes[contextMenu.userId] ?? 100}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              value={userVolumes[contextMenu.userId] ?? 100}
              onChange={(e) => {
                const volume = parseInt(e.target.value);
                setUserVolumes(prev => ({ ...prev, [contextMenu.userId]: volume }));
                // Apply volume to audio element if exists
                if (contextMenu.sessionId) {
                  const audioEl = document.getElementById(`audio-${contextMenu.sessionId}`) as HTMLAudioElement;
                  if (audioEl) {
                    audioEl.volume = volume / 100;
                  }
                }
              }}
              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-mot-gold"
            />
          </div>

          <div className="border-t border-mot-border my-2" />

          {/* Profile actions */}
          <button
            onClick={() => {
              setSelectedUserId(contextMenu.userId);
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-200 hover:bg-mot-gold/10 hover:text-white transition-colors"
          >
            <User className="w-4 h-4" />
            View Profile
          </button>
          <button
            onClick={() => {
              // TODO: Open DM with this user
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-200 hover:bg-mot-gold/10 hover:text-white transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            Message
          </button>
          <button
            onClick={() => {
              // TODO: Add friend request
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-200 hover:bg-mot-gold/10 hover:text-white transition-colors"
          >
            <Users className="w-4 h-4" />
            Add Friend
          </button>

          <div className="border-t border-mot-border my-2" />

          {/* Moderation actions */}
          <button
            onClick={() => {
              // TODO: Server mute this user
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-200 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <MicOff className="w-4 h-4" />
            Server Mute
          </button>
          <button
            onClick={() => {
              // TODO: Server deafen this user
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-200 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <VolumeX className="w-4 h-4" />
            Server Deafen
          </button>
          <button
            onClick={() => {
              // TODO: Disconnect this user from voice
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-200 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <UserX className="w-4 h-4" />
            Disconnect
          </button>

          <div className="border-t border-mot-border my-2" />

          {/* Dangerous actions at bottom */}
          <button
            onClick={() => {
              // TODO: Kick user from server
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-orange-400 hover:bg-orange-500/10 transition-colors"
          >
            <UserX className="w-4 h-4" />
            Kick
          </button>
          <button
            onClick={() => {
              // TODO: Ban user from server
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <UserX className="w-4 h-4" />
            Ban
          </button>
        </div>
      )}

      {/* Click outside to close context menu */}
      {contextMenu && (
        <div
          className="fixed inset-0 z-[99]"
          onClick={() => setContextMenu(null)}
        />
      )}

      {/* User Profile Modal */}
      {selectedUserId && (
        <UserProfileModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  );
};
