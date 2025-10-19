import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AgoraRTC, { 
  IAgoraRTCClient, 
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser,
  UID 
} from 'agora-rtc-sdk-ng';
import api from '../../lib/api';
import toast from 'react-hot-toast';

// Voice Chat Context State
interface VoiceChatState {
  // Connection
  isConnected: boolean;
  isConnecting: boolean;
  channelId: string | null;
  channelName: string | null;
  
  // Users
  localUser: {
    id: string;
    username: string;
    audioLevel: number;
    isMuted: boolean;
    isDeafened: boolean;
    isSpeaking: boolean;
  } | null;
  remoteUsers: Map<UID, {
    uid: UID;
    username: string;
    audioLevel: number;
    isMuted: boolean;
    isSpeaking: boolean;
  }>;
  
  // Audio Settings
  settings: {
    // Volumes
    inputVolume: number;
    outputVolume: number;
    
    // Voice Mode
    pushToTalk: boolean;
    pushToTalkKey: string;
    voiceActivation: boolean;
    voiceThreshold: number;
    
    // Audio Quality
    audioQuality: 'low' | 'medium' | 'high' | 'music';
    
    // Processing
    noiseSuppression: boolean;
    echoCancellation: boolean;
    autoGainControl: boolean;
    
    // Effects
    pitchShift: number;
    voiceChanger: 'none' | 'robot' | 'child' | 'elder' | 'monster';
    
    // Devices
    selectedMicrophone?: string;
    selectedSpeaker?: string;
  };
  
  // Actions
  joinChannel: (channelId: string, channelName: string) => Promise<void>;
  leaveChannel: () => Promise<void>;
  toggleMute: () => void;
  toggleDeafen: () => void;
  setInputVolume: (volume: number) => void;
  setOutputVolume: (volume: number) => void;
  updateSettings: (settings: Partial<VoiceChatState['settings']>) => void;
  setPushToTalkActive: (active: boolean) => void;
}

const VoiceChatContext = createContext<VoiceChatState | null>(null);

export const useVoiceChat = () => {
  const context = useContext(VoiceChatContext);
  if (!context) {
    throw new Error('useVoiceChat must be used within VoiceChatProvider');
  }
  return context;
};

// Agora Client Configuration
const agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

export const VoiceChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [channelId, setChannelId] = useState<string | null>(null);
  const [channelName, setChannelName] = useState<string | null>(null);
  const [localUser, setLocalUser] = useState<VoiceChatState['localUser']>(null);
  const [remoteUsers, setRemoteUsers] = useState<VoiceChatState['remoteUsers']>(new Map());
  const [settings, setSettings] = useState<VoiceChatState['settings']>({
    inputVolume: 100,
    outputVolume: 100,
    pushToTalk: false,
    pushToTalkKey: 'Space',
    voiceActivation: true,
    voiceThreshold: 30,
    audioQuality: 'high',
    noiseSuppression: true,
    echoCancellation: true,
    autoGainControl: true,
    pitchShift: 0,
    voiceChanger: 'none',
  });

  // Refs
  const localAudioTrack = useRef<IMicrophoneAudioTrack | null>(null);
  const isPushToTalkActive = useRef(false);
  const audioLevelInterval = useRef<NodeJS.Timeout | null>(null);

  // Join Voice Channel
  const joinChannel = useCallback(async (channelIdParam: string, channelNameParam: string) => {
    if (isConnecting || isConnected) return;

    setIsConnecting(true);
    try {
      // Get Agora token from backend
      const response = await api.get(`/voice/channels/${channelIdParam}/token`);
      const { appId, token, uid, channelId: agoraChannel } = response.data;

      if (!appId) {
        throw new Error('Agora App ID not configured');
      }

      // Join the channel
      await agoraClient.join(appId, agoraChannel, token, uid);

      // Create and publish local audio track
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        encoderConfig: settings.audioQuality === 'music' ? 'music_standard' : 'speech_standard',
        AEC: settings.echoCancellation,
        AGC: settings.autoGainControl,
        ANS: settings.noiseSuppression,
      });

      localAudioTrack.current = audioTrack;
      
      // Set initial volume
      audioTrack.setVolume(settings.inputVolume);

      // Publish the track
      await agoraClient.publish([audioTrack]);

      // Set state
      setIsConnected(true);
      setChannelId(channelIdParam);
      setChannelName(channelNameParam);
      setLocalUser({
        id: uid.toString(),
        username: 'You',
        audioLevel: 0,
        isMuted: false,
        isDeafened: false,
        isSpeaking: false,
      });

      // Start audio level monitoring
      startAudioLevelMonitoring();

      toast.success(`Joined ${channelNameParam}`);
    } catch (error: any) {
      console.error('Failed to join voice channel:', error);
      toast.error(error.message || 'Failed to join voice channel');
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, isConnected, settings]);

  // Leave Voice Channel
  const leaveChannel = useCallback(async () => {
    try {
      // Stop audio level monitoring
      if (audioLevelInterval.current) {
        clearInterval(audioLevelInterval.current);
        audioLevelInterval.current = null;
      }

      // Stop and close local track
      if (localAudioTrack.current) {
        localAudioTrack.current.stop();
        localAudioTrack.current.close();
        localAudioTrack.current = null;
      }

      // Leave the channel
      await agoraClient.leave();

      // Reset state
      setIsConnected(false);
      setChannelId(null);
      setChannelName(null);
      setLocalUser(null);
      setRemoteUsers(new Map());

      toast.success('Left voice channel');
    } catch (error) {
      console.error('Failed to leave voice channel:', error);
      toast.error('Failed to leave voice channel');
    }
  }, []);

  // Toggle Mute
  const toggleMute = useCallback(() => {
    if (!localAudioTrack.current || !localUser) return;

    const newMutedState = !localUser.isMuted;
    localAudioTrack.current.setEnabled(!newMutedState);
    
    setLocalUser(prev => prev ? { ...prev, isMuted: newMutedState } : null);
    toast.success(newMutedState ? 'Microphone muted' : 'Microphone unmuted');
  }, [localUser]);

  // Toggle Deafen
  const toggleDeafen = useCallback(() => {
    if (!localUser) return;

    const newDeafenedState = !localUser.isDeafened;
    
    // Mute all remote users
    remoteUsers.forEach((_, uid) => {
      const remoteUser = agoraClient.remoteUsers.find(u => u.uid === uid);
      if (remoteUser?.audioTrack) {
        remoteUser.audioTrack.setVolume(newDeafenedState ? 0 : settings.outputVolume);
      }
    });

    setLocalUser(prev => prev ? { ...prev, isDeafened: newDeafenedState } : null);
    toast.success(newDeafenedState ? 'Deafened' : 'Undeafened');
  }, [localUser, remoteUsers, settings.outputVolume]);

  // Set Input Volume
  const setInputVolume = useCallback((volume: number) => {
    if (localAudioTrack.current) {
      localAudioTrack.current.setVolume(volume);
    }
    setSettings(prev => ({ ...prev, inputVolume: volume }));
  }, []);

  // Set Output Volume
  const setOutputVolume = useCallback((volume: number) => {
    remoteUsers.forEach((_, uid) => {
      const remoteUser = agoraClient.remoteUsers.find(u => u.uid === uid);
      if (remoteUser?.audioTrack && !localUser?.isDeafened) {
        remoteUser.audioTrack.setVolume(volume);
      }
    });
    setSettings(prev => ({ ...prev, outputVolume: volume }));
  }, [remoteUsers, localUser]);

  // Update Settings
  const updateSettings = useCallback((newSettings: Partial<VoiceChatState['settings']>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Set Push-to-Talk Active
  const setPushToTalkActive = useCallback((active: boolean) => {
    if (!localAudioTrack.current || !settings.pushToTalk) return;

    isPushToTalkActive.current = active;
    localAudioTrack.current.setEnabled(active);
    
    setLocalUser(prev => prev ? { ...prev, isMuted: !active, isSpeaking: active } : null);
  }, [settings.pushToTalk]);

  // Audio Level Monitoring
  const startAudioLevelMonitoring = useCallback(() => {
    if (audioLevelInterval.current) return;

    audioLevelInterval.current = setInterval(() => {
      // Monitor local audio level
      if (localAudioTrack.current) {
        const level = localAudioTrack.current.getVolumeLevel() * 100;
        setLocalUser(prev => {
          if (!prev) return null;
          const isSpeaking = level > settings.voiceThreshold;
          
          // Auto voice activation
          if (settings.voiceActivation && !settings.pushToTalk) {
            if (isSpeaking && prev.isMuted) {
              localAudioTrack.current?.setEnabled(true);
            } else if (!isSpeaking && !prev.isMuted) {
              localAudioTrack.current?.setEnabled(false);
            }
          }
          
          return { ...prev, audioLevel: level, isSpeaking };
        });
      }

      // Monitor remote users audio levels
      agoraClient.remoteUsers.forEach(remoteUser => {
        if (remoteUser.audioTrack) {
          const level = remoteUser.audioTrack.getVolumeLevel() * 100;
          setRemoteUsers(prev => {
            const newMap = new Map(prev);
            const user = newMap.get(remoteUser.uid);
            if (user) {
              newMap.set(remoteUser.uid, {
                ...user,
                audioLevel: level,
                isSpeaking: level > 10,
              });
            }
            return newMap;
          });
        }
      });
    }, 100);
  }, [settings.voiceThreshold, settings.voiceActivation, settings.pushToTalk]);

  // Agora Event Listeners
  useEffect(() => {
    // User joined
    const handleUserJoined = (user: IAgoraRTCRemoteUser) => {
      console.log('User joined:', user.uid);
      setRemoteUsers(prev => {
        const newMap = new Map(prev);
        newMap.set(user.uid, {
          uid: user.uid,
          username: `User ${user.uid}`,
          audioLevel: 0,
          isMuted: false,
          isSpeaking: false,
        });
        return newMap;
      });
    };

    // User left
    const handleUserLeft = (user: IAgoraRTCRemoteUser) => {
      console.log('User left:', user.uid);
      setRemoteUsers(prev => {
        const newMap = new Map(prev);
        newMap.delete(user.uid);
        return newMap;
      });
    };

    // User published
    const handleUserPublished = async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
      if (mediaType === 'audio') {
        await agoraClient.subscribe(user, mediaType);
        if (user.audioTrack && !localUser?.isDeafened) {
          user.audioTrack.play();
          user.audioTrack.setVolume(settings.outputVolume);
        }
      }
    };

    // User unpublished
    const handleUserUnpublished = (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
      if (mediaType === 'audio') {
        setRemoteUsers(prev => {
          const newMap = new Map(prev);
          const remoteUser = newMap.get(user.uid);
          if (remoteUser) {
            newMap.set(user.uid, { ...remoteUser, isMuted: true });
          }
          return newMap;
        });
      }
    };

    agoraClient.on('user-joined', handleUserJoined);
    agoraClient.on('user-left', handleUserLeft);
    agoraClient.on('user-published', handleUserPublished);
    agoraClient.on('user-unpublished', handleUserUnpublished);

    return () => {
      agoraClient.off('user-joined', handleUserJoined);
      agoraClient.off('user-left', handleUserLeft);
      agoraClient.off('user-published', handleUserPublished);
      agoraClient.off('user-unpublished', handleUserUnpublished);
    };
  }, [settings.outputVolume, localUser?.isDeafened]);

  // Keyboard listeners for Push-to-Talk
  useEffect(() => {
    if (!settings.pushToTalk) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === settings.pushToTalkKey && !e.repeat) {
        setPushToTalkActive(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === settings.pushToTalkKey) {
        setPushToTalkActive(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [settings.pushToTalk, settings.pushToTalkKey, setPushToTalkActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isConnected) {
        leaveChannel();
      }
    };
  }, [isConnected, leaveChannel]);

  const value: VoiceChatState = {
    isConnected,
    isConnecting,
    channelId,
    channelName,
    localUser,
    remoteUsers,
    settings,
    joinChannel,
    leaveChannel,
    toggleMute,
    toggleDeafen,
    setInputVolume,
    setOutputVolume,
    updateSettings,
    setPushToTalkActive,
  };

  return <VoiceChatContext.Provider value={value}>{children}</VoiceChatContext.Provider>;
};
