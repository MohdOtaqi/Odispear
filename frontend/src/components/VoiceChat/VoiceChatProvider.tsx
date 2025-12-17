import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import Daily, { DailyCall, DailyParticipant } from '@daily-co/daily-js';
import { voiceAPI } from '../../lib/voiceAPI';
import { socketManager } from '../../lib/socket';
import { createNoiseSuppressedStream, destroyRNNoise } from '../../lib/audioProcessor';
import toast from 'react-hot-toast';

// Screen share quality presets
export interface ScreenShareSettings {
  resolution: '720p' | '1080p' | '1440p' | '4k' | 'source';
  fps: 30 | 60 | 120 | 'max';
}

export const RESOLUTION_OPTIONS = [
  { value: '720p', label: '720p (1280x720)', width: 1280, height: 720 },
  { value: '1080p', label: '1080p (1920x1080)', width: 1920, height: 1080 },
  { value: '1440p', label: '1440p (2560x1440)', width: 2560, height: 1440 },
  { value: '4k', label: '4K (3840x2160)', width: 3840, height: 2160 },
  { value: 'source', label: 'Source (Native)', width: undefined, height: undefined },
] as const;

export const FPS_OPTIONS = [
  { value: 30, label: '30 FPS' },
  { value: 60, label: '60 FPS' },
  { value: 120, label: '120 FPS' },
  { value: 'max', label: 'Max (Unlimited)' },
] as const;

// Voice Chat Context State
interface VoiceChatState {
  isConnected: boolean;
  isConnecting: boolean;
  channelId: string | null;
  participants: DailyParticipant[];
  localParticipant: DailyParticipant | null;
  isDeafened: boolean;
  speakingParticipants: Set<string>; // session_ids of currently speaking participants

  // Video/Screen sharing state
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  screenShareParticipant: string | null; // session_id of screen sharer

  // Screen share quality settings
  screenShareSettings: ScreenShareSettings;
  setScreenShareSettings: (settings: ScreenShareSettings) => void;

  // Actions
  joinChannel: (channelId: string, channelName: string) => Promise<void>;
  leaveChannel: () => Promise<void>;
  toggleMute: () => void;
  toggleDeafen: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => void;

  // Settings
  settings: {
    inputVolume: number;
    outputVolume: number;
  };
  setInputVolume: (volume: number) => void;
  setOutputVolume: (volume: number) => void;
  setInputDevice: (deviceId: string) => Promise<void>;
  setOutputDevice: (deviceId: string) => Promise<void>;

  // Get call object for video rendering
  getCallObject: () => DailyCall | null;
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
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenShareParticipant, setScreenShareParticipant] = useState<string | null>(null);

  const [settings, setSettings] = useState({ inputVolume: 1, outputVolume: 1 });

  // Screen share quality settings - load from localStorage or use defaults
  const [screenShareSettings, setScreenShareSettingsState] = useState<ScreenShareSettings>(() => {
    try {
      const saved = localStorage.getItem('screenShareSettings');
      if (saved) return JSON.parse(saved);
    } catch { }
    return { resolution: '1080p', fps: 60 };
  });

  const setScreenShareSettings = useCallback((newSettings: ScreenShareSettings) => {
    setScreenShareSettingsState(newSettings);
    localStorage.setItem('screenShareSettings', JSON.stringify(newSettings));
  }, []);

  const getCallObject = useCallback(() => callObjectRef.current, []);

  const joinChannel = useCallback(async (channelIdParam: string, channelName: string) => {
    // If already connecting, wait
    if (isConnecting) {
      return;
    }

    // If already in the same channel, do nothing
    if (isConnected && channelId === channelIdParam) {
      return;
    }

    // If in a different channel, leave first then join
    if (isConnected && channelId !== channelIdParam) {
      // Leave current channel first
      if (callObjectRef.current) {
        try {
          await callObjectRef.current.leave();
          await callObjectRef.current.destroy();
        } catch (e) {
          console.warn('Error leaving previous channel:', e);
        }
        callObjectRef.current = null;
      }
      if (channelId) {
        socketManager.leaveVoice(channelId);
      }
      setIsConnected(false);
      setChannelId(null);
      setParticipants([]);
      setLocalParticipant(null);
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

        // Apply noise suppression in background (don't block join)
        setTimeout(async () => {
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
            }
          } catch (err) {
            console.warn('[Voice] Could not enable noise suppression:', err);
          }
        }, 500);
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

        // Clear screen share state if this participant was sharing
        setScreenShareParticipant(prev => {
          if (prev === e.participant.session_id) {
            setIsScreenSharing(false);
            return null;
          }
          return prev;
        });
      });

      co.on('participant-updated', (e) => {
        setParticipants((prev) => prev.map(p => p.session_id === e.participant.session_id ? e.participant : p));
        if (e.participant.local) {
          setLocalParticipant(e.participant);
          // Update local video state
          setIsVideoEnabled(e.participant.video === true);
        }

        // Check for screen sharing
        if (e.participant.screen) {
          setScreenShareParticipant(e.participant.session_id);
        } else {
          // Clear screen share if this participant stopped sharing
          setScreenShareParticipant(prev => prev === e.participant.session_id ? null : prev);
          // Also update local screen sharing state if it's us
          if (e.participant.local && !e.participant.screen) {
            setIsScreenSharing(false);
          }
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

      // Speaking detection via active-speaker-change event (more responsive)
      const speakingTimeouts: Record<string, ReturnType<typeof setTimeout>> = {};

      co.on('active-speaker-change', (e) => {
        const peerId = e.activeSpeaker?.peerId;
        if (peerId) {
          // Clear any existing timeout for this peer
          if (speakingTimeouts[peerId]) {
            clearTimeout(speakingTimeouts[peerId]);
          }

          // Add to speaking set immediately
          setSpeakingParticipants(prev => {
            const next = new Set(prev);
            next.add(peerId);
            return next;
          });

          // Clear after 300ms of no activity (more responsive)
          speakingTimeouts[peerId] = setTimeout(() => {
            setSpeakingParticipants(p => {
              const updated = new Set(p);
              updated.delete(peerId);
              return updated;
            });
            delete speakingTimeouts[peerId];
          }, 300);
        }
      });

      // Also use participant-updated for more real-time speaking detection
      co.on('participant-updated', (e) => {
        // Check audio level for speaking detection
        if (e.participant?.tracks?.audio?.state === 'playable') {
          const peerId = e.participant.session_id;
          // If audio is being sent, consider them speaking briefly
          if (speakingTimeouts[peerId]) {
            clearTimeout(speakingTimeouts[peerId]);
          }
          setSpeakingParticipants(prev => {
            const next = new Set(prev);
            next.add(peerId);
            return next;
          });
          speakingTimeouts[peerId] = setTimeout(() => {
            setSpeakingParticipants(p => {
              const updated = new Set(p);
              updated.delete(peerId);
              return updated;
            });
          }, 300);
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

      // Mute/unmute all remote audio elements to actually stop hearing
      const audioElements = document.querySelectorAll('audio[id^="audio-"]');
      audioElements.forEach((audio: Element) => {
        (audio as HTMLAudioElement).muted = newDeafenedState;
      });

      // Also update participant subscriptions
      for (const p of participants) {
        if (!p.local) {
          callObjectRef.current.updateParticipant(p.session_id, {
            setAudio: !newDeafenedState
          });
        }
      }

      setIsDeafened(newDeafenedState);

      // Also mute self when deafened
      if (newDeafenedState && callObjectRef.current.localAudio()) {
        callObjectRef.current.setLocalAudio(false);
      }

      toast.success(newDeafenedState ? 'Deafened' : 'Undeafened');
    }
  }, [isDeafened, participants]);

  const toggleVideo = useCallback(async () => {
    if (callObjectRef.current) {
      const currentVideo = callObjectRef.current.localVideo();
      try {
        await callObjectRef.current.setLocalVideo(!currentVideo);
        setIsVideoEnabled(!currentVideo);
        toast.success(!currentVideo ? 'Camera on' : 'Camera off');
      } catch (error) {
        console.error('Failed to toggle video:', error);
        toast.error('Failed to toggle camera');
      }
    }
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (callObjectRef.current) {
      try {
        if (isScreenSharing) {
          await callObjectRef.current.stopScreenShare();
          setIsScreenSharing(false);
          toast.success('Stopped screen sharing');
        } else {
          // Get resolution settings
          const resOption = RESOLUTION_OPTIONS.find(r => r.value === screenShareSettings.resolution);
          const fpsValue = screenShareSettings.fps === 'max' ? undefined : screenShareSettings.fps;

          // Build video constraints based on settings
          const videoConstraints: MediaTrackConstraints = {};
          if (resOption?.width) {
            videoConstraints.width = { ideal: resOption.width };
            videoConstraints.height = { ideal: resOption.height };
          }
          if (fpsValue) {
            videoConstraints.frameRate = { ideal: fpsValue };
          }

          // Start screen share with user-configured settings
          await callObjectRef.current.startScreenShare({
            displayMediaOptions: {
              video: Object.keys(videoConstraints).length > 0 ? videoConstraints : true,
              audio: true // Include system audio if available
            }
          });
          setIsScreenSharing(true);
          const fpsLabel = screenShareSettings.fps === 'max' ? 'Max FPS' : `${screenShareSettings.fps} FPS`;
          toast.success(`Screen sharing: ${screenShareSettings.resolution} @ ${fpsLabel}`);
        }
      } catch (error: any) {
        console.error('Failed to toggle screen share:', error);
        if (error.message?.includes('Permission denied')) {
          toast.error('Screen sharing permission denied');
        } else {
          toast.error('Failed to share screen');
        }
        setIsScreenSharing(false);
      }
    }
  }, [isScreenSharing, screenShareSettings]);

  const setInputVolume = useCallback((volume: number) => {
    // Volume control not directly supported by Daily.co API
    // Just store the preference
    setSettings(s => ({ ...s, inputVolume: volume }));
  }, []);

  const setOutputVolume = useCallback((volume: number) => {
    // Apply volume to all audio elements
    const normalizedVolume = volume / 100;
    const audioElements = document.querySelectorAll('audio[id^="audio-"]');
    audioElements.forEach((audio: Element) => {
      (audio as HTMLAudioElement).volume = normalizedVolume;
    });
    setSettings(s => ({ ...s, outputVolume: volume }));
  }, []);

  const setInputDevice = useCallback(async (deviceId: string) => {
    if (callObjectRef.current) {
      try {
        await callObjectRef.current.setInputDevicesAsync({
          audioDeviceId: deviceId === 'default' ? undefined : deviceId
        });
        console.log('[Voice] Input device changed to:', deviceId);
      } catch (error) {
        console.error('Failed to set input device:', error);
      }
    }
  }, []);

  const setOutputDevice = useCallback(async (deviceId: string) => {
    // Apply to all audio elements using setSinkId
    const audioElements = document.querySelectorAll('audio[id^="audio-"]');
    audioElements.forEach((audio: Element) => {
      const htmlAudio = audio as HTMLAudioElement;
      if ((htmlAudio as any).setSinkId) {
        (htmlAudio as any).setSinkId(deviceId === 'default' ? '' : deviceId).catch(console.error);
      }
    });
    console.log('[Voice] Output device changed to:', deviceId);
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
    isVideoEnabled,
    isScreenSharing,
    screenShareParticipant,
    screenShareSettings,
    setScreenShareSettings,
    joinChannel,
    leaveChannel,
    toggleMute,
    toggleDeafen,
    toggleVideo,
    toggleScreenShare,
    settings: {
      ...settings,
      inputVolume: settings.inputVolume,
      outputVolume: settings.outputVolume,
    },
    setInputVolume,
    setOutputVolume,
    setInputDevice,
    setOutputDevice,
    getCallObject,
  };

  return <VoiceChatContext.Provider value={value}>{children}</VoiceChatContext.Provider>;
};