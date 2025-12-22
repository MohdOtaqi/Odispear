import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
    Room,
    RoomEvent,
    Track,
    LocalParticipant,
    RemoteParticipant,
    Participant,
    LocalAudioTrack,
    ConnectionState,
    ConnectionQuality,
    createLocalAudioTrack,
} from 'livekit-client';
import { createRNNoiseSuppressedStream, destroyRNNoise } from '../../lib/rnnNoiseProcessor';
import { useVoiceUsersStore } from '../../store/voiceUsersStore';
import { useAuthStore } from '../../store/authStore';
import { socketManager } from '../../lib/socket';
import {
    playJoinSound,
    playLeaveSound,
    playMuteSound,
    playUnmuteSound,
    playDeafenSound,
    playUndeafenSound,
    playConnectSound,
    playDisconnectSound,
} from '../../lib/voiceSounds';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || '';

// Screen share settings for compatibility
export interface ScreenShareSettings {
    resolution: '720p' | '1080p' | '1440p' | '4k' | 'source';
    fps: 30 | 60 | 120 | 'max';
}

export const RESOLUTION_OPTIONS = [
    { value: '720p', label: '720p (1280x720)', width: 1280, height: 720 },
    { value: '1080p', label: '1080p (1920x1080)', width: 1920, height: 1080 },
    { value: '1440p', label: '1440p (2560x1440)', width: 2560, height: 1440 },
    { value: '4k', label: '4k (3840x2160)', width: 3840, height: 2160 },
    { value: 'source', label: 'Source Resolution', width: 0, height: 0 },
];

export const FPS_OPTIONS = [
    { value: 30, label: '30 FPS' },
    { value: 60, label: '60 FPS' },
    { value: 120, label: '120 FPS' },
    { value: 'max', label: 'Max FPS' },
];

// Adapted participant type for component compatibility
export interface VoiceParticipant {
    identity: string;
    name: string;
    isLocal: boolean;
    isMuted: boolean;
    isSpeaking: boolean;
    // Compatibility aliases
    session_id: string;
    user_id: string;
    user_name: string;
    local: boolean;
    audio: boolean;
}

// Context types
interface LiveKitContextType {
    // Connection state
    isConnected: boolean;
    isConnecting: boolean;
    channelId: string | null;
    roomName: string | null;

    // Local participant controls
    isMuted: boolean;
    isDeafened: boolean;
    isVideoEnabled: boolean;
    isScreenSharing: boolean;
    screenShareParticipant: string | null;

    // Participants
    participants: Participant[];
    localParticipant: Participant | null;
    speakingParticipants: Set<string>;
    connectionQuality: 'excellent' | 'good' | 'poor' | 'lost' | 'unknown';

    // Screen share settings
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

    // Room access (for video rendering)
    getRoom: () => Room | null;
}

const LiveKitContext = createContext<LiveKitContextType | null>(null);

export const useLiveKitVoice = () => {
    const context = useContext(LiveKitContext);
    if (!context) {
        throw new Error('useLiveKitVoice must be used within a LiveKitProvider');
    }
    return context;
};

// Alias for backward compatibility with existing components using useVoiceChat
export const useVoiceChat = useLiveKitVoice;

export const LiveKitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const roomRef = useRef<Room | null>(null);
    const processedTrackRef = useRef<LocalAudioTrack | null>(null);

    // State
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [channelId, setChannelId] = useState<string | null>(null);
    const [roomName, setRoomName] = useState<string | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isDeafened, setIsDeafened] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [screenShareParticipant, setScreenShareParticipant] = useState<string | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [localParticipant, setLocalParticipant] = useState<Participant | null>(null);
    const [speakingParticipants, setSpeakingParticipants] = useState<Set<string>>(new Set());
    const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'lost' | 'unknown'>('unknown');
    const [screenShareSettings, setScreenShareSettings] = useState<ScreenShareSettings>({ resolution: '1080p', fps: 30 });
    const [settings, setSettings] = useState({ inputVolume: 100, outputVolume: 100 });

    // Get token from backend
    const getToken = async (channelId: string): Promise<{ token: string; roomName: string; livekitUrl: string }> => {
        const response = await fetch(`${API_BASE}/v1/voice/livekit-token/${channelId}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to get LiveKit token');
        }

        return response.json();
    };

    // Update participants list
    const updateParticipants = useCallback(() => {
        if (!roomRef.current) return;

        const allParticipants: Participant[] = [
            roomRef.current.localParticipant,
            ...Array.from(roomRef.current.remoteParticipants.values()),
        ];

        setParticipants(allParticipants);
        setLocalParticipant(roomRef.current.localParticipant);
    }, []);

    // Sync mute state from actual track state (source of truth)
    const syncMuteStateFromTrack = useCallback(() => {
        if (!roomRef.current) return;

        const localP = roomRef.current.localParticipant;
        // isMicrophoneEnabled is TRUE when NOT muted
        const actuallyMuted = !localP.isMicrophoneEnabled;

        console.log('[LiveKit] Syncing mute state - isMicrophoneEnabled:', localP.isMicrophoneEnabled, 'actuallyMuted:', actuallyMuted);

        setIsMuted(actuallyMuted);

        // Update voice store
        if (channelId) {
            const currentUser = useAuthStore.getState().user;
            if (currentUser) {
                useVoiceUsersStore.getState().updateUserState(channelId, currentUser.id, { muted: actuallyMuted });
            }
        }
    }, [channelId]);

    // Join a voice channel
    const joinChannel = useCallback(async (channelIdParam: string, channelName: string) => {
        if (isConnecting) return;

        // If already connected to this channel, do nothing
        if (isConnected && channelId === channelIdParam) {
            return;
        }

        // If connected to different channel, leave first
        if (isConnected && channelId !== channelIdParam) {
            await leaveChannel();
        }

        setIsConnecting(true);

        try {
            // Get token from backend
            const { token, roomName: room, livekitUrl } = await getToken(channelIdParam);
            console.log('[LiveKit] Got token for room:', room);

            // Create room
            const roomInstance = new Room({
                adaptiveStream: true,
                dynacast: true,
            });

            roomRef.current = roomInstance;

            // Set up event listeners
            roomInstance.on(RoomEvent.Connected, () => {
                console.log('[LiveKit] Connected to room');
                setIsConnected(true);
                setIsConnecting(false);
                setLocalParticipant(roomInstance.localParticipant);
                updateParticipants();
                playConnectSound();
                toast.success(`Joined ${channelName}`);
            });

            roomInstance.on(RoomEvent.Disconnected, () => {
                console.log('[LiveKit] Disconnected from room');
                setIsConnected(false);
                setChannelId(null);
                setRoomName(null);
                setParticipants([]);
                setLocalParticipant(null);
                playDisconnectSound();
            });

            roomInstance.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
                console.log('[LiveKit] Participant connected:', participant.identity);
                updateParticipants();
                playJoinSound();

                // Add to voice store - default to UNMUTED since their track hasn't published yet
                // Actual state will be set once we receive their audio track in TrackSubscribed
                useVoiceUsersStore.getState().addUser(channelIdParam, {
                    id: participant.identity,
                    username: participant.name || participant.identity,
                    muted: false, // Default to unmuted - will be updated when track arrives
                    deafened: false,
                });
            });

            roomInstance.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
                console.log('[LiveKit] Participant disconnected:', participant.identity);
                updateParticipants();
                playLeaveSound();

                // Remove from voice store
                useVoiceUsersStore.getState().removeUser(channelIdParam, participant.identity);
            });

            roomInstance.on(RoomEvent.ActiveSpeakersChanged, (speakers: Participant[]) => {
                const speakerIds = new Set(speakers.map(s => s.identity));
                setSpeakingParticipants(speakerIds);
            });

            // Listen for track mute/unmute changes (for ALL participants including local)
            roomInstance.on(RoomEvent.TrackMuted, (publication, participant) => {
                console.log('[LiveKit] Track muted for:', participant.identity, 'isLocal:', participant === roomInstance.localParticipant);
                updateParticipants();

                // Sync state for local participant
                if (participant === roomInstance.localParticipant) {
                    setIsMuted(true);
                    const currentUser = useAuthStore.getState().user;
                    if (currentUser && channelIdParam) {
                        useVoiceUsersStore.getState().updateUserState(channelIdParam, currentUser.id, { muted: true });
                    }
                } else {
                    // Update voice store for remote participant
                    useVoiceUsersStore.getState().updateUserState(channelIdParam, participant.identity, { muted: true });
                }
            });

            roomInstance.on(RoomEvent.TrackUnmuted, (publication, participant) => {
                console.log('[LiveKit] Track unmuted for:', participant.identity, 'isLocal:', participant === roomInstance.localParticipant);
                updateParticipants();

                // Sync state for local participant
                if (participant === roomInstance.localParticipant) {
                    setIsMuted(false);
                    const currentUser = useAuthStore.getState().user;
                    if (currentUser && channelIdParam) {
                        useVoiceUsersStore.getState().updateUserState(channelIdParam, currentUser.id, { muted: false });
                    }
                } else {
                    // Update voice store for remote participant
                    useVoiceUsersStore.getState().updateUserState(channelIdParam, participant.identity, { muted: false });
                }
            });

            roomInstance.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
                if (track.kind === Track.Kind.Audio) {
                    // Create audio element for remote audio
                    const audioEl = track.attach();
                    audioEl.id = `audio-${participant.identity}`;
                    document.body.appendChild(audioEl);
                    console.log('[LiveKit] Attached audio track for:', participant.identity);
                }
                // Detect screen share from remote participants
                if (track.kind === Track.Kind.Video && track.source === Track.Source.ScreenShare) {
                    console.log('[LiveKit] Screen share track received from:', participant.identity);
                    setScreenShareParticipant(participant.identity);
                }
            });

            roomInstance.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
                if (track.kind === Track.Kind.Audio) {
                    const audioEl = document.getElementById(`audio-${participant.identity}`);
                    if (audioEl) audioEl.remove();
                    track.detach();
                }
                // Clean up screen share when remote user stops sharing
                if (track.kind === Track.Kind.Video && track.source === Track.Source.ScreenShare) {
                    console.log('[LiveKit] Screen share track removed from:', participant.identity);
                    setScreenShareParticipant(null);
                }
            });

            // Connect to room
            await roomInstance.connect(livekitUrl, token);

            // Create audio track with noise suppression
            console.log('[LiveKit] Creating audio track with noise suppression...');
            const rawStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            });

            // Apply aggressive noise suppression
            const processedStream = await createRNNoiseSuppressedStream(rawStream);
            const audioTrack = processedStream.getAudioTracks()[0];

            // Create LiveKit track from processed audio
            const localAudioTrack = new LocalAudioTrack(audioTrack, undefined, false);
            processedTrackRef.current = localAudioTrack;

            // Publish the track
            await roomInstance.localParticipant.publishTrack(localAudioTrack);
            console.log('[LiveKit] ✅ Published audio track with noise suppression');

            // Ensure initial mute state is synced (track starts unmuted)
            setIsMuted(false);

            setChannelId(channelIdParam);
            setRoomName(room);

            // Notify backend via socket
            socketManager.joinVoice(channelIdParam);

            // Add self to voice store
            const currentUser = useAuthStore.getState().user;
            if (currentUser) {
                useVoiceUsersStore.getState().removeUserFromAllChannels(currentUser.id);
                useVoiceUsersStore.getState().addUser(channelIdParam, {
                    id: currentUser.id,
                    username: currentUser.username,
                    avatar_url: currentUser.avatar_url,
                    muted: false, // Track starts unmuted
                    deafened: false,
                });
            }

        } catch (error) {
            console.error('[LiveKit] Failed to join channel:', error);
            toast.error('Failed to join voice channel');
            setIsConnecting(false);
        }
    }, [isConnected, isConnecting, channelId, updateParticipants]);

    // Leave channel
    const leaveChannel = useCallback(async () => {
        if (roomRef.current) {
            try {
                await roomRef.current.disconnect();
            } catch (e) {
                console.warn('[LiveKit] Error disconnecting:', e);
            }
            roomRef.current = null;
        }

        if (processedTrackRef.current) {
            processedTrackRef.current.stop();
            processedTrackRef.current = null;
        }

        destroyRNNoise();

        if (channelId) {
            socketManager.leaveVoice(channelId);

            const currentUser = useAuthStore.getState().user;
            if (currentUser) {
                useVoiceUsersStore.getState().removeUser(channelId, currentUser.id);
            }
        }

        setIsConnected(false);
        setChannelId(null);
        setRoomName(null);
        setParticipants([]);
        setIsMuted(false);
        setIsDeafened(false);
    }, [channelId]);

    // Toggle mute - directly control the underlying MediaStreamTrack
    const toggleMute = useCallback(async () => {
        if (!roomRef.current) {
            console.warn('[LiveKit] toggleMute: No room');
            return;
        }

        // IMPORTANT: If user is deafened, they cannot unmute - must undeafen first
        const newMuted = !isMuted;
        if (isDeafened && !newMuted) {
            console.log('[LiveKit] toggleMute: Cannot unmute while deafened');
            toast.error('You must undeafen to unmute');
            return;
        }

        console.log('[LiveKit] toggleMute: isMuted=', isMuted, 'newMuted=', newMuted);

        try {
            // Method 1: Control the underlying MediaStreamTrack directly
            if (processedTrackRef.current) {
                const mediaTrack = processedTrackRef.current.mediaStreamTrack;
                if (mediaTrack) {
                    // Setting enabled to false stops audio transmission
                    mediaTrack.enabled = !newMuted;
                    console.log('[LiveKit] MediaStreamTrack.enabled set to:', !newMuted);
                }

                // Also call mute/unmute on the LiveKit track for proper signaling
                if (newMuted) {
                    await processedTrackRef.current.mute();
                } else {
                    await processedTrackRef.current.unmute();
                }
            }

            // Method 2: Also use setMicrophoneEnabled as backup signaling
            try {
                await roomRef.current.localParticipant.setMicrophoneEnabled(!newMuted);
            } catch (e) {
                // This may fail for custom tracks, that's OK
                console.log('[LiveKit] setMicrophoneEnabled fallback:', e);
            }

            // Update React state
            setIsMuted(newMuted);

            if (newMuted) {
                playMuteSound();
                toast('Microphone muted', { icon: '🔇' });
            } else {
                playUnmuteSound();
                toast('Microphone unmuted', { icon: '🎤' });
            }

            // Update voice store
            if (channelId) {
                const currentUser = useAuthStore.getState().user;
                if (currentUser) {
                    useVoiceUsersStore.getState().updateUserState(channelId, currentUser.id, { muted: newMuted });
                }
            }

            socketManager.updateVoiceState({ muted: newMuted });
            console.log('[LiveKit] Mute toggle complete. Audio should be:', newMuted ? 'MUTED' : 'ACTIVE');
        } catch (error) {
            console.error('[LiveKit] Failed to toggle mute:', error);
            toast.error('Failed to toggle microphone');
        }
    }, [isMuted, isDeafened, channelId]);

    // Toggle deafen
    const toggleDeafen = useCallback(() => {
        if (!roomRef.current) return;

        const newDeafened = !isDeafened;

        // Mute all remote audio
        roomRef.current.remoteParticipants.forEach((participant) => {
            participant.audioTrackPublications.forEach((pub) => {
                if (pub.track) {
                    const audioEl = document.getElementById(`audio-${participant.identity}`) as HTMLAudioElement;
                    if (audioEl) {
                        audioEl.muted = newDeafened;
                    }
                }
            });
        });

        setIsDeafened(newDeafened);

        // Auto-mute when deafening
        if (newDeafened && !isMuted) {
            toggleMute();
        }

        if (newDeafened) {
            playDeafenSound();
            toast('Deafened', { icon: '🔇' });
        } else {
            playUndeafenSound();
            toast('Undeafened', { icon: '🔊' });
        }

        // Update voice store
        if (channelId) {
            const currentUser = useAuthStore.getState().user;
            if (currentUser) {
                useVoiceUsersStore.getState().updateUserState(channelId, currentUser.id, { deafened: newDeafened });
            }
        }

        socketManager.updateVoiceState({ deafened: newDeafened });
    }, [isDeafened, isMuted, channelId, toggleMute]);

    // Toggle video - enable/disable camera
    const toggleVideo = useCallback(async () => {
        if (!roomRef.current) {
            console.warn('[LiveKit] toggleVideo: No room');
            return;
        }

        const newVideoEnabled = !isVideoEnabled;
        console.log('[LiveKit] toggleVideo: isVideoEnabled=', isVideoEnabled, 'newVideoEnabled=', newVideoEnabled);

        try {
            // Use LiveKit's built-in camera control
            await roomRef.current.localParticipant.setCameraEnabled(newVideoEnabled);
            setIsVideoEnabled(newVideoEnabled);

            if (newVideoEnabled) {
                toast('Camera enabled', { icon: '📹' });
            } else {
                toast('Camera disabled', { icon: '📷' });
            }

            console.log('[LiveKit] Video toggle complete. Camera is:', newVideoEnabled ? 'ON' : 'OFF');
        } catch (error) {
            console.error('[LiveKit] Failed to toggle video:', error);
            toast.error('Failed to toggle camera');
        }
    }, [isVideoEnabled]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (roomRef.current) {
                roomRef.current.disconnect();
            }
            destroyRNNoise();
        };
    }, []);

    const value: LiveKitContextType = {
        isConnected,
        isConnecting,
        channelId,
        roomName,
        isMuted,
        isDeafened,
        isVideoEnabled,
        isScreenSharing,
        screenShareParticipant,
        participants,
        localParticipant,
        speakingParticipants,
        connectionQuality,
        screenShareSettings,
        setScreenShareSettings,
        joinChannel,
        leaveChannel,
        toggleMute,
        toggleDeafen,
        toggleVideo,
        toggleScreenShare: async () => {
            if (!roomRef.current) {
                console.warn('[LiveKit] toggleScreenShare: No room');
                return;
            }

            const newScreenSharing = !isScreenSharing;
            console.log('[LiveKit] toggleScreenShare: isScreenSharing=', isScreenSharing, 'newScreenSharing=', newScreenSharing);

            try {
                if (newScreenSharing) {
                    // Look up resolution from options
                    const resOption = RESOLUTION_OPTIONS.find(r => r.value === screenShareSettings.resolution) || RESOLUTION_OPTIONS[1];
                    const fps = screenShareSettings.fps === 'max' ? 144 : screenShareSettings.fps;

                    console.log('[LiveKit] Screen share settings:', {
                        resolution: screenShareSettings.resolution,
                        width: resOption.width,
                        height: resOption.height,
                        fps
                    });

                    await roomRef.current.localParticipant.setScreenShareEnabled(true, {
                        audio: true, // Always enable system audio
                        contentHint: 'detail',
                    } as any);
                    setScreenShareParticipant(roomRef.current.localParticipant.identity);
                    toast('Screen sharing started', { icon: '🖥️' });
                } else {
                    await roomRef.current.localParticipant.setScreenShareEnabled(false);
                    setScreenShareParticipant(null);
                    toast('Screen sharing stopped', { icon: '🖥️' });
                }
                setIsScreenSharing(newScreenSharing);
                console.log('[LiveKit] Screen share:', newScreenSharing ? 'STARTED' : 'STOPPED');
            } catch (error: any) {
                if (error.name === 'NotAllowedError') {
                    console.log('[LiveKit] Screen share cancelled by user');
                } else {
                    console.error('[LiveKit] Failed to toggle screen share:', error);
                    toast.error('Failed to share screen');
                }
            }
        },
        settings,
        setInputVolume: (volume: number) => setSettings(s => ({ ...s, inputVolume: volume })),
        setOutputVolume: (volume: number) => setSettings(s => ({ ...s, outputVolume: volume })),
        setInputDevice: async (deviceId: string) => {
            if (!roomRef.current) return;
            try {
                if (processedTrackRef.current) {
                    await roomRef.current.localParticipant.unpublishTrack(processedTrackRef.current);
                    processedTrackRef.current.stop();
                    processedTrackRef.current = null;
                }
                destroyRNNoise();

                const rawStream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        deviceId: { exact: deviceId },
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                    },
                });

                const processedStream = await createRNNoiseSuppressedStream(rawStream);
                const audioTrack = processedStream.getAudioTracks()[0];
                const localAudioTrack = new LocalAudioTrack(audioTrack, undefined, false);
                processedTrackRef.current = localAudioTrack;

                if (isMuted) {
                    localAudioTrack.mute();
                }

                await roomRef.current.localParticipant.publishTrack(localAudioTrack);
                console.log('[LiveKit] ✅ Switched to input device:', deviceId);
                toast.success('Microphone changed');
            } catch (error) {
                console.error('[LiveKit] Failed to switch input device:', error);
                toast.error('Failed to switch microphone');
            }
        },
        setOutputDevice: async (deviceId: string) => {
            if (roomRef.current) {
                const audioElements = document.querySelectorAll<HTMLAudioElement>('[id^="audio-"]');
                for (const audioEl of audioElements) {
                    try {
                        if (audioEl.setSinkId) {
                            await audioEl.setSinkId(deviceId);
                        }
                    } catch (e) {
                        console.warn('[LiveKit] Could not set output device for', audioEl.id, e);
                    }
                }
                console.log('[LiveKit] ✅ Switched to output device:', deviceId);
                toast.success('Speaker changed');
            }
        },
        getRoom: () => roomRef.current,
    };

    return (
        <LiveKitContext.Provider value={value}>
            {children}
        </LiveKitContext.Provider>
    );
};

export default LiveKitProvider;
