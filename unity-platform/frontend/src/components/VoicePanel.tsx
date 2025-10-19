import React, { useEffect, useState, useRef } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng';
import { Mic, MicOff, PhoneOff, Volume2, VolumeX, Loader, User } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface VoicePanelProps {
  channelId: string;
  channelName: string;
  onLeave: () => void;
}

interface VoiceUser {
  uid: number | string;
  username: string;
  muted: boolean;
  audioLevel: number;
}

export const VoicePanel: React.FC<VoicePanelProps> = ({ channelId, channelName, onLeave }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [users, setUsers] = useState<VoiceUser[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const audioLevelIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize Agora client
  useEffect(() => {
    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    clientRef.current = client;

    // Setup event listeners
    client.on('user-published', async (user, mediaType) => {
      await client.subscribe(user, mediaType);

      if (mediaType === 'audio') {
        user.audioTrack?.play();

        setUsers((prev) => {
          const existing = prev.find((u) => u.uid === user.uid);
          if (existing) return prev;
          
          return [
            ...prev,
            {
              uid: user.uid as number | string,
              username: `User ${user.uid}`,
              muted: false,
              audioLevel: 0,
            },
          ];
        });
      }
    });

    client.on('user-unpublished', (user, mediaType) => {
      if (mediaType === 'audio') {
        setUsers((prev) => prev.filter((u) => u.uid !== user.uid));
      }
    });

    client.on('user-left', (user) => {
      setUsers((prev) => prev.filter((u) => u.uid !== user.uid));
    });

    return () => {
      leaveChannel();
    };
  }, []);

  // Join voice channel
  const joinChannel = async () => {
    if (!clientRef.current || isConnecting || isConnected) return;

    setIsConnecting(true);
    setError(null);

    try {
      // Get token from backend
      const response = await api.get(`/voice/channels/${channelId}/token`);
      const { token, appId, uid } = response.data;

      console.log('Voice credentials:', { appId, channelId, uid });
      console.log('Token length:', token?.length);

      if (!appId || !token) {
        throw new Error('Invalid Agora credentials received from server');
      }

      if (appId.length !== 32) {
        throw new Error('Invalid Agora App ID format. Please check your configuration.');
      }

      // Join the channel with Agora
      console.log('Attempting to join Agora channel...');
      await clientRef.current.join(appId, channelId, token, uid);

      // Create and publish audio track
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        encoderConfig: 'music_standard',
        AEC: true,
        ANS: true,
        AGC: true,
      });

      localAudioTrackRef.current = audioTrack;
      await clientRef.current.publish([audioTrack]);

      setIsConnected(true);
      setIsConnecting(false);
      startAudioLevelMonitoring();

      toast.success('Connected to voice channel');
    } catch (error: any) {
      console.error('Failed to join voice channel:', error);
      
      let errorMessage = 'Failed to join voice channel';
      
      // Handle specific Agora errors
      if (error.code === 'CAN_NOT_GET_GATEWAY_SERVER') {
        errorMessage = 'Invalid Agora App ID. Please configure valid Agora credentials in backend/.env';
      } else if (error.code === 'INVALID_TOKEN') {
        errorMessage = 'Invalid voice token. Please try again.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      setIsConnecting(false);
      setIsConnected(false);
    }
  };

  // Leave voice channel
  const leaveChannel = async () => {
    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
    }

    if (localAudioTrackRef.current) {
      localAudioTrackRef.current.stop();
      localAudioTrackRef.current.close();
      localAudioTrackRef.current = null;
    }

    if (clientRef.current) {
      await clientRef.current.leave();
    }

    setIsConnected(false);
    setIsMuted(false);
    setIsDeafened(false);
    setUsers([]);
  };

  // Toggle mute
  const toggleMute = async () => {
    if (!localAudioTrackRef.current) return;

    const newMutedState = !isMuted;
    await localAudioTrackRef.current.setEnabled(!newMutedState);
    setIsMuted(newMutedState);
  };

  // Toggle deafen
  const toggleDeafen = () => {
    const newDeafenedState = !isDeafened;

    if (clientRef.current) {
      const remoteUsers = clientRef.current.remoteUsers;
      remoteUsers.forEach((user) => {
        if (user.audioTrack) {
          user.audioTrack.setVolume(newDeafenedState ? 0 : 100);
        }
      });
    }

    setIsDeafened(newDeafenedState);

    if (newDeafenedState && !isMuted) {
      toggleMute();
    }
  };

  // Monitor audio levels
  const startAudioLevelMonitoring = () => {
    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
    }

    audioLevelIntervalRef.current = setInterval(() => {
      if (localAudioTrackRef.current) {
        const level = localAudioTrackRef.current.getVolumeLevel();
        setAudioLevel(Math.floor(level * 100));
      }
    }, 100);
  };

  // Auto-join on mount
  useEffect(() => {
    joinChannel();
  }, [channelId]);

  return (
    <div className="bg-neutral-850 border-t border-neutral-700 p-4">
      {/* Channel Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-primary-500 flex items-center gap-2">
          <Volume2 className="w-4 h-4" />
          {channelName}
        </h3>
        {isConnected && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-neutral-400">Connected</span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-lg">
          <p className="text-xs text-error">{error}</p>
          <button
            onClick={joinChannel}
            className="mt-2 text-xs text-primary-500 hover:text-primary-400 underline"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Connecting State */}
      {isConnecting && (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader className="w-8 h-8 text-primary-500 animate-spin mb-2" />
          <p className="text-sm text-neutral-400">Connecting...</p>
        </div>
      )}

      {/* Connected View */}
      {isConnected && (
        <>
          {/* Voice Users */}
          <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto custom-scrollbar">
            {users.map((user) => (
              <div
                key={user.uid}
                className="flex items-center gap-3 p-2 bg-neutral-800 rounded-lg hover:bg-neutral-750 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-semibold shadow-glow">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-200 truncate">{user.username}</p>
                </div>
                {user.muted && <MicOff className="w-4 h-4 text-error flex-shrink-0" />}
                {!user.muted && user.audioLevel > 0 && (
                  <div className="flex items-center gap-0.5">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-1 h-3 rounded-full transition-all ${
                          user.audioLevel > i * 33 ? 'bg-success' : 'bg-neutral-600'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {users.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-neutral-500">No other users in channel</p>
              </div>
            )}
          </div>

          {/* Audio Level Indicator */}
          {!isMuted && audioLevel > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <Mic className="w-3 h-3 text-success" />
                <span className="text-xs text-neutral-400">Your Audio</span>
              </div>
              <div className="h-2 bg-neutral-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-success transition-all duration-100"
                  style={{ width: `${audioLevel}%` }}
                />
              </div>
            </div>
          )}

          {/* Voice Controls */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={toggleMute}
              className={`p-3 rounded-lg transition-all flex items-center justify-center ${
                isMuted
                  ? 'bg-error hover:bg-error/80 text-white shadow-glow-accent'
                  : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-200'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleDeafen}
              className={`p-3 rounded-lg transition-all flex items-center justify-center ${
                isDeafened
                  ? 'bg-error hover:bg-error/80 text-white shadow-glow-accent'
                  : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-200'
              }`}
              title={isDeafened ? 'Undeafen' : 'Deafen'}
            >
              {isDeafened ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            <button
              onClick={() => {
                leaveChannel();
                onLeave();
              }}
              className="p-3 bg-error hover:bg-error/80 text-white rounded-lg transition-all flex items-center justify-center shadow-glow-accent"
              title="Leave Voice Channel"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
