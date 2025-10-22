import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import Daily, { DailyCall, DailyParticipant } from '@daily-co/daily-js';
import { voiceAPI } from '../../lib/voiceAPI';
import toast from 'react-hot-toast';

// Voice Chat Context State
interface VoiceChatState {
  isConnected: boolean;
  isConnecting: boolean;
  channelId: string | null;
  participants: DailyParticipant[];
  localParticipant: DailyParticipant | null;
  isDeafened: boolean;
  
  // Actions
  joinChannel: (channelId: string, channelName: string) => Promise<void>;
  leaveChannel: () => Promise<void>;
  toggleMute: () => void;
  toggleDeafen: () => void; // Daily.co doesn't have "deafen", so we'll just mute all remote users
  
  // Settings (simplified for now)
  settings: {
    inputVolume: number;
    outputVolume: number;
  };
  setInputVolume: (volume: number) => void;
  setOutputVolume: (volume: number) => void;
}

const VoiceChatContext = createContext<VoiceChatState | null>(null);

export const useVoiceChat = () => {
  const context = useContext(VoiceChatContext);
  if (!context) {
    throw new Error('useVoiceChat must be used within VoiceChatProvider');
  }
  return context;
};

export const VoiceChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const callObjectRef = useRef<DailyCall | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [channelId, setChannelId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<DailyParticipant[]>([]);
  const [localParticipant, setLocalParticipant] = useState<DailyParticipant | null>(null);
  const [isDeafened, setIsDeafened] = useState(false);

  const [settings, setSettings] = useState({ inputVolume: 1, outputVolume: 1 });

  const joinChannel = useCallback(async (channelIdParam: string, channelName: string) => {
    if (isConnecting || isConnected) {
      toast.error('Already in a voice channel');
      return;
    }

    setIsConnecting(true);
    
    try {
      // 1. Destroy any existing call object first
      if (callObjectRef.current) {
        try {
          await callObjectRef.current.destroy();
        } catch (e) {
          console.warn('Error destroying previous call object:', e);
        }
        callObjectRef.current = null;
      }

      // 2. Get token from our backend
      const { data } = await voiceAPI.getVoiceToken(channelIdParam);
      const { token, roomUrl } = data;

      // 3. Create Daily call object with error handling
      const co = Daily.createCallObject({
        strictMode: false, // Allow operation even if browser doesn't support all features
      });
      callObjectRef.current = co;

      // 4. Set up event listeners
      co.on('joined-meeting', (e) => {
        setIsConnected(true);
        setIsConnecting(false);
        setParticipants(Object.values(e.participants));
        setLocalParticipant(e.participants.local);
        toast.success(`Joined ${channelName}`);
      });

      co.on('left-meeting', () => {
        setIsConnected(false);
        setChannelId(null);
        setParticipants([]);
        setLocalParticipant(null);
        if (callObjectRef.current) {
          callObjectRef.current.destroy();
          callObjectRef.current = null;
        }
      });

      co.on('participant-joined', (e) => {
        setParticipants((prev) => [...prev, e.participant]);
      });

      co.on('participant-left', (e) => {
        setParticipants((prev) => prev.filter(p => p.session_id !== e.participant.session_id));
      });

      co.on('participant-updated', (e) => {
        setParticipants((prev) => prev.map(p => p.session_id === e.participant.session_id ? e.participant : p));
        if(e.participant.local) {
          setLocalParticipant(e.participant);
        }
      });

      co.on('error', (e) => {
        console.error("Daily.co error:", e);
        toast.error(e.errorMsg || 'Voice chat error');
        setIsConnecting(false);
      });

      // 5. Join the meeting
      await co.join({
        url: roomUrl,
        token: token,
        startAudioOff: false,
        startVideoOff: true
      });
      
      setChannelId(channelIdParam);

    } catch (error: any) {
      console.error('Failed to join voice channel:', error);
      toast.error(error.response?.data?.error || 'Failed to join voice channel');
      setIsConnecting(false);
      
      // Cleanup on error
      if (callObjectRef.current) {
        try {
          await callObjectRef.current.destroy();
        } catch (e) {
          console.warn('Error cleaning up call object:', e);
        }
        callObjectRef.current = null;
      }
    }
  }, [isConnecting, isConnected]);

  const leaveChannel = useCallback(async () => {
    if (callObjectRef.current) {
      try {
        await callObjectRef.current.leave();
        // Destroy is called in the 'left-meeting' event handler
      } catch (error) {
        console.error('Error leaving channel:', error);
        // Force cleanup on error
        try {
          await callObjectRef.current.destroy();
        } catch (e) {
          console.warn('Error destroying call object:', e);
        }
        callObjectRef.current = null;
        setIsConnected(false);
        setChannelId(null);
      }
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (callObjectRef.current) {
      const isMuted = callObjectRef.current.localAudio();
      callObjectRef.current.setLocalAudio(!isMuted);
    }
  }, []);

  const toggleDeafen = useCallback(() => {
    if (callObjectRef.current) {
      const newDeafenedState = !isDeafened;
      for (const p of participants) {
        if (!p.local) {
          callObjectRef.current.updateParticipant(p.session_id, {
            setAudio: newDeafenedState ? false : true
          });
        }
      }
      setIsDeafened(newDeafenedState);
      // Also mute self
      if (newDeafenedState && callObjectRef.current.localAudio()) {
        callObjectRef.current.setLocalAudio(false);
      }
      toast.success(newDeafenedState ? 'Deafened' : 'Undeafened');
    }
  }, [isDeafened, participants]);

  const setInputVolume = useCallback((volume: number) => {
    if (callObjectRef.current) {
      callObjectRef.current.setInputDevicesAsync({ audioGain: volume / 100 });
      setSettings(s => ({...s, inputVolume: volume}));
    }
  }, []);

  const setOutputVolume = useCallback((volume: number) => {
    if (callObjectRef.current) {
      callObjectRef.current.setOutputDeviceAsync({ outputGain: volume / 100 });
      setSettings(s => ({...s, outputVolume: volume}));
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (callObjectRef.current) {
        callObjectRef.current.destroy();
        callObjectRef.current = null;
      }
    };
  }, []);

  const value: VoiceChatState = {
    isConnected,
    isConnecting,
    channelId,
    participants,
    localParticipant,
    isDeafened,
    joinChannel,
    leaveChannel,
    toggleMute,
    toggleDeafen,
    settings: {
      ...settings,
      inputVolume: settings.inputVolume,
      outputVolume: settings.outputVolume,
      // Add other settings from your modal if you keep it
    },
    setInputVolume,
    setOutputVolume,
  };

  return <VoiceChatContext.Provider value={value}>{children}</VoiceChatContext.Provider>;
};