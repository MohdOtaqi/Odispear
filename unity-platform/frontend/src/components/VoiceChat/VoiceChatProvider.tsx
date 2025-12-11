import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import Daily, { DailyCall, DailyParticipant } from '@daily-co/daily-js';
import { voiceAPI } from '../../lib/voiceAPI';
import { socketManager } from '../../lib/socket';
import { createNoiseSuppressedStream, destroyRNNoise } from '../../lib/audioProcessor';
import toast from 'react-hot-toast';

// Voice Chat Context State
interface VoiceChatState {
  isConnected: boolean;
  isConnecting: boolean;
  channelId: string | null;
  participants: DailyParticipant[];
  localParticipant: DailyParticipant | null;
  isDeafened: boolean;
  speakingParticipants: Set<string>; // session_ids of currently speaking participants
  
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
  const [speakingParticipants, setSpeakingParticipants] = useState<Set<string>>(new Set());

  const [settings, setSettings] = useState({ inputVolume: 1, outputVolume: 1 });

  const joinChannel = useCallback(async (channelIdParam: string, channelName: string) => {
    if (isConnecting || isConnected) {
      toast.error('Already in a voice channel');
      return;
    }

    // Check if we're on HTTPS or localhost (required for microphone access)
    const isSecureContext = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    if (!isSecureContext) {
      toast.error('Voice chat requires HTTPS. Please use HTTPS to access this site.');
      console.error('Voice chat requires HTTPS. Current protocol:', window.location.protocol);
      return;
    }

    // Check if browser supports media devices
    if (!navigator.mediaDevices) {
      toast.error('Your browser does not support voice chat');
      console.error('MediaDevices API not available');
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
      console.log('[Voice] Got token, room URL:', roomUrl);

      // 3. Create Daily call object
      let co;
      try {
        co = Daily.createCallObject({
          strictMode: false,
          subscribeToTracksAutomatically: true,
          showLeaveButton: false,
          showFullscreenButton: false,
        });
        callObjectRef.current = co;
      } catch (createError) {
        console.error('Failed to create Daily call object:', createError);
        toast.error('Failed to initialize voice chat. Please check your browser compatibility.');
        setIsConnecting(false);
        return;
      }

      // 4. Set up event listeners
      co.on('joined-meeting', async (e) => {
        console.log('[Voice] Joined meeting:', e);
        console.log('[Voice] Local participant:', e.participants.local);
        console.log('[Voice] Local audio enabled:', e.participants.local?.audio);
        setIsConnected(true);
        setIsConnecting(false);
        setParticipants(Object.values(e.participants));
        setLocalParticipant(e.participants.local);
        toast.success(`Joined ${channelName}`);
        
        // Apply noise suppression after joining
        try {
          // Get microphone with noise suppression
          const rawStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              channelCount: 1,
              sampleRate: 48000,
            },
            video: false,
          });
          
          // Apply our custom noise gate
          const processedStream = await createNoiseSuppressedStream(rawStream);
          const audioTrack = processedStream.getAudioTracks()[0];
          
          if (audioTrack && callObjectRef.current) {
            // Set the custom audio track
            await callObjectRef.current.setInputDevicesAsync({
              audioSource: audioTrack,
            });
            console.log('[Voice] ✅ Noise suppression enabled!');
            toast.success('Noise suppression enabled', { duration: 2000 });
          }
        } catch (err) {
          console.warn('[Voice] Could not enable noise suppression:', err);
        }
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
        console.log('[Voice] Participant joined:', e.participant);
        setParticipants((prev) => [...prev, e.participant]);
      });

      co.on('participant-left', (e) => {
        console.log('[Voice] Participant left:', e.participant);
        setParticipants((prev) => prev.filter(p => p.session_id !== e.participant.session_id));
        // Remove audio element when participant leaves
        const audioEl = document.getElementById(`audio-${e.participant.session_id}`);
        if (audioEl) audioEl.remove();
      });

      co.on('participant-updated', (e) => {
        setParticipants((prev) => prev.map(p => p.session_id === e.participant.session_id ? e.participant : p));
        if(e.participant.local) {
          setLocalParticipant(e.participant);
        }
      });

      // Handle audio tracks - create audio elements for remote participants ONLY
      co.on('track-started', (e) => {
        const isLocal = e.participant?.local === true;
        console.log('[Voice] Track started:', e.track?.kind, 'from', e.participant?.session_id, 'local:', isLocal);
        
        // IMPORTANT: Only handle remote audio tracks to prevent loopback/echo
        if (e.track?.kind === 'audio' && !isLocal && e.participant?.session_id) {
          const existingAudio = document.getElementById(`audio-${e.participant.session_id}`);
          if (existingAudio) existingAudio.remove();
          
          // Create audio element for this participant
          const audioEl = document.createElement('audio');
          audioEl.id = `audio-${e.participant.session_id}`;
          audioEl.autoplay = true;
          audioEl.setAttribute('playsinline', 'true');
          audioEl.srcObject = new MediaStream([e.track]);
          audioEl.style.display = 'none';
          document.body.appendChild(audioEl);
          
          console.log('[Voice] Created audio element for participant:', e.participant.session_id);
          
          // Try to play (may need user interaction)
          audioEl.play().catch(err => {
            console.warn('[Voice] Audio autoplay blocked:', err);
          });
        }
      });

      co.on('track-stopped', (e) => {
        console.log('[Voice] Track stopped:', e.track?.kind, 'from', e.participant?.session_id);
        if (e.track?.kind === 'audio' && e.participant?.session_id) {
          const audioEl = document.getElementById(`audio-${e.participant.session_id}`);
          if (audioEl) audioEl.remove();
        }
      });

      co.on('error', (e) => {
        console.error("Daily.co error:", e);
        toast.error(e.errorMsg || 'Voice chat error');
        setIsConnecting(false);
      });

      // Speaking detection via active-speaker-change event
      const speakingTimeouts: Record<string, ReturnType<typeof setTimeout>> = {};
      
      co.on('active-speaker-change', (e) => {
        console.log('[Voice] Active speaker changed:', e.activeSpeaker);
        const peerId = e.activeSpeaker?.peerId;
        if (peerId) {
          // Clear any existing timeout for this peer
          if (speakingTimeouts[peerId]) {
            clearTimeout(speakingTimeouts[peerId]);
          }
          
          // Add to speaking set
          setSpeakingParticipants(prev => {
            const next = new Set(prev);
            next.add(peerId);
            return next;
          });
          
          // Clear after 1.5 seconds of no activity
          speakingTimeouts[peerId] = setTimeout(() => {
            setSpeakingParticipants(p => {
              const updated = new Set(p);
              updated.delete(peerId);
              return updated;
            });
            delete speakingTimeouts[peerId];
          }, 1500);
        }
      });

      // 5. Join the meeting
      await co.join({
        url: roomUrl,
        token: token,
        startAudioOff: false,
        startVideoOff: true,
      });
      
      // 6. Enable noise cancellation (Krisp-powered, same as Discord)
      try {
        await co.updateInputSettings({
          audio: {
            processor: {
              type: 'noise-cancellation',
            },
          },
        });
        console.log('[Voice] Noise cancellation enabled');
      } catch (ncError) {
        console.warn('[Voice] Noise cancellation not available:', ncError);
        // Fall back to browser's built-in noise suppression
      }
      
      setChannelId(channelIdParam);
      
      // Notify server via WebSocket so other users see us in voice channel
      socketManager.joinVoice(channelIdParam);

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
    const currentChannelId = channelId;
    
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
    
    // Cleanup RNNoise
    destroyRNNoise();
    
    // Notify server via WebSocket
    if (currentChannelId) {
      socketManager.leaveVoice(currentChannelId);
    }
  }, [channelId]);

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
    // Volume control not directly supported by Daily.co API
    // Just store the preference
    setSettings(s => ({...s, inputVolume: volume}));
  }, []);

  const setOutputVolume = useCallback((volume: number) => {
    // Volume control not directly supported by Daily.co API
    // Just store the preference  
    setSettings(s => ({...s, outputVolume: volume}));
  }, []);

  // Listen for global keybind events
  useEffect(() => {
    const handleToggleMute = () => toggleMute();
    const handleToggleDeafen = () => toggleDeafen();
    const handlePTTStart = () => {
      if (callObjectRef.current && !callObjectRef.current.localAudio()) {
        callObjectRef.current.setLocalAudio(true);
      }
    };
    const handlePTTEnd = () => {
      if (callObjectRef.current && callObjectRef.current.localAudio()) {
        callObjectRef.current.setLocalAudio(false);
      }
    };

    window.addEventListener('voice:toggle-mute', handleToggleMute);
    window.addEventListener('voice:toggle-deafen', handleToggleDeafen);
    window.addEventListener('voice:ptt-start', handlePTTStart);
    window.addEventListener('voice:ptt-end', handlePTTEnd);

    return () => {
      window.removeEventListener('voice:toggle-mute', handleToggleMute);
      window.removeEventListener('voice:toggle-deafen', handleToggleDeafen);
      window.removeEventListener('voice:ptt-start', handlePTTStart);
      window.removeEventListener('voice:ptt-end', handlePTTEnd);
    };
  }, [toggleMute, toggleDeafen]);

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
    speakingParticipants,
    joinChannel,
    leaveChannel,
    toggleMute,
    toggleDeafen,
    settings: {
      ...settings,
      inputVolume: settings.inputVolume,
      outputVolume: settings.outputVolume,
    },
    setInputVolume,
    setOutputVolume,
  };

  return <VoiceChatContext.Provider value={value}>{children}</VoiceChatContext.Provider>;
};