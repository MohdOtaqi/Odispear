import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import Daily, { DailyCall, DailyParticipant } from '@daily-co/daily-js';
import { voiceAPI } from '../../lib/api';
import toast from 'react-hot-toast';

// Voice Chat Context State
interface VoiceChatState {
  isConnected: boolean;
  isConnecting: boolean;
  channelId: string | null;
  participants: DailyParticipant[];
  localParticipant: DailyParticipant | null;
  
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
  const [callObject, setCallObject] = useState<DailyCall | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [channelId, setChannelId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<DailyParticipant[]>([]);
  const [localParticipant, setLocalParticipant] = useState<DailyParticipant | null>(null);
  const [isDeafened, setIsDeafened] = useState(false);

  const [settings, setSettings] = useState({ inputVolume: 1, outputVolume: 1 });

  const joinChannel = useCallback(async (channelIdParam: string, channelName: string) => {
    if (isConnecting || isConnected) return;

    setIsConnecting(true);
    
    try {
      // 1. Get token from our backend
      const { data } = await voiceAPI.getVoiceToken(channelIdParam);
      const { token, roomUrl } = data;

      // 2. Create Daily call object
      const co = Daily.createCallObject();
      setCallObject(co);

      // 3. Set up event listeners
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
        co.destroy();
        setCallObject(null);
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

      // 4. Join the meeting
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
    }
  }, [isConnecting, isConnected]);

  const leaveChannel = useCallback(async () => {
    if (callObject) {
      await callObject.leave();
    }
  }, [callObject]);

  const toggleMute = useCallback(() => {
    if (callObject) {
      const isMuted = callObject.localAudio();
      callObject.setLocalAudio(!isMuted);
    }
  }, [callObject]);

  const toggleDeafen = useCallback(() => {
    if (callObject) {
      const newDeafenedState = !isDeafened;
      for (const p of participants) {
        if (!p.local) {
          callObject.updateParticipant(p.session_id, {
            setAudio: newDeafenedState ? false : true
          });
        }
      }
      setIsDeafened(newDeafenedState);
      // Also mute self
      if (newDeafenedState && callObject.localAudio()) {
        callObject.setLocalAudio(false);
      }
      toast.success(newDeafenedState ? 'Deafened' : 'Undeafened');
    }
  }, [callObject, isDeafened, participants]);

  const setInputVolume = useCallback((volume: number) => {
    if (callObject) {
      callObject.setInputDevicesAsync({ audioGain: volume / 100 });
      setSettings(s => ({...s, inputVolume: volume}));
    }
  }, [callObject]);

  const setOutputVolume = useCallback((volume: number) => {
    if (callObject) {
      callObject.setOutputDeviceAsync({ outputGain: volume / 100 });
      setSettings(s => ({...s, outputVolume: volume}));
    }
  }, [callObject]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      callObject?.destroy();
    };
  }, [callObject]);

  const value: VoiceChatState = {
    isConnected,
    isConnecting,
    channelId,
    participants,
    localParticipant,
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