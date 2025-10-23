import React, { useState, useEffect } from 'react';
import AgoraRTC, { 
  IAgoraRTCClient, 
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser 
} from 'agora-rtc-sdk-ng';
import { Mic, MicOff, PhoneOff, Volume2, VolumeX, User, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

// Simple Voice Panel - Similar to agora-react-uikit approach
interface VoicePanelSimpleProps {
  channelId: string;
  channelName: string;
  onLeave: () => void;
}

export const VoicePanelSimple: React.FC<VoicePanelSimpleProps> = ({
  channelId,
  channelName,
  onLeave,
}) => {
  const [client] = useState<IAgoraRTCClient>(() => AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' }));
  const [localTrack, setLocalTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);

  // Join channel on mount
  useEffect(() => {
    joinChannel();
    return () => {
      leaveChannel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const joinChannel = async () => {
    if (isConnecting || isConnected) return;

    setIsConnecting(true);
    try {
      // Get Agora credentials from environment
      const appId = import.meta.env.VITE_AGORA_APP_ID;
      
      if (!appId) {
        throw new Error('Agora App ID not configured');
      }

      // Join the channel (using null token for testing)
      await client.join(appId, channelId, null, null);

      // Create and publish local audio track
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      setLocalTrack(audioTrack);
      await client.publish([audioTrack]);

      setIsConnected(true);
      toast.success(`Joined ${channelName}`);
    } catch (error: any) {
      console.error('Failed to join voice channel:', error);
      toast.error(error.message || 'Failed to join voice channel');
    } finally {
      setIsConnecting(false);
    }
  };

  const leaveChannel = async () => {
    if (localTrack) {
      localTrack.stop();
      localTrack.close();
    }
    await client.leave();
    setIsConnected(false);
    setRemoteUsers([]);
  };

  const toggleMute = () => {
    if (localTrack) {
      localTrack.setEnabled(isMuted);
      setIsMuted(!isMuted);
      toast.success(isMuted ? 'Unmuted' : 'Muted');
    }
  };

  const toggleDeafen = () => {
    const newDeafened = !isDeafened;
    remoteUsers.forEach(user => {
      if (user.audioTrack) {
        user.audioTrack.setVolume(newDeafened ? 0 : 100);
      }
    });
    setIsDeafened(newDeafened);
    toast.success(newDeafened ? 'Deafened' : 'Undeafened');
  };

  const handleLeave = async () => {
    await leaveChannel();
    onLeave();
  };

  // Agora event listeners
  useEffect(() => {
    const handleUserPublished = async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
      if (mediaType === 'audio') {
        await client.subscribe(user, mediaType);
        if (user.audioTrack) {
          user.audioTrack.play();
          if (isDeafened) {
            user.audioTrack.setVolume(0);
          }
        }
        setRemoteUsers(prev => [...prev, user]);
      }
    };

    const handleUserUnpublished = (user: IAgoraRTCRemoteUser) => {
      setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
    };

    const handleUserLeft = (user: IAgoraRTCRemoteUser) => {
      setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
    };

    client.on('user-published', handleUserPublished);
    client.on('user-unpublished', handleUserUnpublished);
    client.on('user-left', handleUserLeft);

    return () => {
      client.off('user-published', handleUserPublished);
      client.off('user-unpublished', handleUserUnpublished);
      client.off('user-left', handleUserLeft);
    };
  }, [client, isDeafened]);

  if (isConnecting) {
    return (
      <div className="w-full bg-neutral-850 border-t border-neutral-700 p-4">
        <div className="flex items-center justify-center gap-2 text-neutral-400">
          <Loader className="w-5 h-5 animate-spin" />
          <span>Connecting to {channelName}...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-neutral-850 border-t border-neutral-700 animate-slide-up">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-semibold text-white">{channelName}</span>
        </div>
        <button
          onClick={handleLeave}
          className="text-red-400 hover:text-red-300 transition-colors"
        >
          <PhoneOff className="w-4 h-4" />
        </button>
      </div>

      {/* Users */}
      <div className="px-4 py-3 max-h-32 overflow-y-auto custom-scrollbar">
        <div className="space-y-2">
          {/* Local User */}
          <div className="flex items-center gap-3 p-2 rounded-lg bg-neutral-800/50">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              {isMuted && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center">
                  <MicOff className="w-2 h-2 text-white" />
                </div>
              )}
            </div>
            <span className="text-sm font-medium text-white">You</span>
          </div>

          {/* Remote Users */}
          {remoteUsers.map((user) => (
            <div key={user.uid} className="flex items-center gap-3 p-2 rounded-lg bg-neutral-800/30">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-neutral-300">User {user.uid}</span>
            </div>
          ))}

          {remoteUsers.length === 0 && (
            <div className="text-center py-2 text-neutral-500 text-sm">
              No one else is here
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 py-3 border-t border-neutral-700">
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={toggleMute}
            className={`p-3 rounded-lg transition-all hover-lift ${
              isMuted
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-300'
            }`}
          >
            {isMuted ? <MicOff className="w-5 h-5 mx-auto" /> : <Mic className="w-5 h-5 mx-auto" />}
          </button>

          <button
            onClick={toggleDeafen}
            className={`p-3 rounded-lg transition-all hover-lift ${
              isDeafened
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-300'
            }`}
          >
            {isDeafened ? <VolumeX className="w-5 h-5 mx-auto" /> : <Volume2 className="w-5 h-5 mx-auto" />}
          </button>

          <button
            onClick={handleLeave}
            className="p-3 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all hover-lift"
          >
            <PhoneOff className="w-5 h-5 mx-auto" />
          </button>
        </div>
      </div>
    </div>
  );
};
