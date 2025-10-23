import React, { useEffect, useState, useRef } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser,
} from 'agora-rtc-sdk-ng';
import { Mic, MicOff, PhoneOff, Volume2, VolumeX, Loader } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface VoiceChatProps {
  channelId: string;
  onLeave: () => void;
}

interface VoiceUser {
  uid: number;
  username: string;
  muted: boolean;
  audioLevel: number;
}

export const VoiceChat: React.FC<VoiceChatProps> = ({ channelId, onLeave }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [users, setUsers] = useState<VoiceUser[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const audioLevelIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
          if (existing) {
            return prev;
          }
          return [
            ...prev,
            {
              uid: user.uid,
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

    try {
      // Get token from backend
      const response = await api.get(`/voice/channels/${channelId}/token`);
      const { token, appId, uid } = response.data;

      // Join the channel
      await clientRef.current.join(appId, channelId, token, uid);

      // Create and publish audio track
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        encoderConfig: 'music_standard', // High quality audio
        AEC: true, // Acoustic Echo Cancellation
        ANS: true, // Automatic Noise Suppression
        AGC: true, // Automatic Gain Control
      });

      localAudioTrackRef.current = audioTrack;
      await clientRef.current.publish([audioTrack]);

      setIsConnected(true);
      setIsConnecting(false);

      // Start audio level monitoring
      startAudioLevelMonitoring();

      toast.success('Connected to voice channel');
    } catch (error: any) {
      console.error('Failed to join voice channel:', error);
      toast.error(error.response?.data?.error || 'Failed to join voice channel');
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

    toast(newMutedState ? 'Microphone muted' : 'Microphone unmuted', {
      icon: newMutedState ? '🔇' : '🎤',
      duration: 2000,
    });
  };

  // Toggle deafen
  const toggleDeafen = () => {
    const newDeafenedState = !isDeafened;

    // Mute all remote audio tracks
    if (clientRef.current) {
      const remoteUsers = clientRef.current.remoteUsers;
      remoteUsers.forEach((user) => {
        if (user.audioTrack) {
          user.audioTrack.setVolume(newDeafenedState ? 0 : 100);
        }
      });
    }

    setIsDeafened(newDeafenedState);

    // Auto-mute when deafening
    if (newDeafenedState && !isMuted) {
      toggleMute();
    }

    toast(newDeafenedState ? 'Audio deafened' : 'Audio enabled', {
      icon: newDeafenedState ? '🔇' : '🔊',
      duration: 2000,
    });
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
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 p-4 shadow-2xl">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          {/* Left: Voice Status */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
                }`}
              />
              <span className="text-sm text-gray-300">
                {isConnecting
                  ? 'Connecting...'
                  : isConnected
                  ? 'Voice Connected'
                  : 'Disconnected'}
              </span>
            </div>

            {/* Audio level indicator */}
            {isConnected && !isMuted && (
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 h-4 rounded-full transition-colors ${
                      audioLevel > i * 20 ? 'bg-green-500' : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Center: Users */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center -space-x-2">
              {users.slice(0, 5).map((user) => (
                <div
                  key={user.uid}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-xs font-semibold border-2 border-gray-900"
                  title={user.username}
                >
                  {user.username.charAt(0).toUpperCase()}
                </div>
              ))}
              {users.length > 5 && (
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white text-xs font-semibold border-2 border-gray-900">
                  +{users.length - 5}
                </div>
              )}
            </div>
            <span className="text-sm text-gray-400">
              {users.length} {users.length === 1 ? 'user' : 'users'}
            </span>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center space-x-2">
            {isConnecting ? (
              <button
                disabled
                className="p-3 bg-gray-700 text-gray-400 rounded-full cursor-not-allowed"
              >
                <Loader className="w-5 h-5 animate-spin" />
              </button>
            ) : (
              <>
                {/* Mute/Unmute */}
                <button
                  onClick={toggleMute}
                  disabled={!isConnected}
                  className={`p-3 rounded-full transition-all ${
                    isMuted
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                {/* Deafen/Undeafen */}
                <button
                  onClick={toggleDeafen}
                  disabled={!isConnected}
                  className={`p-3 rounded-full transition-all ${
                    isDeafened
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={isDeafened ? 'Undeafen' : 'Deafen'}
                >
                  {isDeafened ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>

                {/* Disconnect */}
                <button
                  onClick={() => {
                    leaveChannel();
                    onLeave();
                  }}
                  disabled={!isConnected}
                  className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Leave Voice Channel"
                >
                  <PhoneOff className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* User list (expanded view) */}
        {users.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <h4 className="text-sm font-semibold text-gray-300 mb-2">In Voice Channel</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {users.map((user) => (
                <div
                  key={user.uid}
                  className="flex items-center space-x-2 p-2 bg-gray-800 rounded-lg"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-300 truncate flex-1">
                    {user.username}
                  </span>
                  {user.muted && <MicOff className="w-3 h-3 text-red-500" />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
