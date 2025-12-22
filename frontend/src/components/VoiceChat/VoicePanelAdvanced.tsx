import React, { useState, useEffect } from 'react';
import { Mic, MicOff, PhoneOff, Volume2, VolumeX, Settings, Wifi, Loader2 } from 'lucide-react';
import { useVoiceChat } from './LiveKitProvider';
import { VoiceSettingsModal } from './VoiceSettingsModal';

interface VoicePanelAdvancedProps {
  channelName: string;
  onLeave: () => void;
}

export const VoicePanelAdvanced: React.FC<VoicePanelAdvancedProps> = ({
  channelName,
  onLeave,
}) => {
  const {
    isConnected,
    isConnecting,
    localParticipant,
    isDeafened,
    leaveChannel,
    toggleMute,
    toggleDeafen,
  } = useVoiceChat();

  const [showSettings, setShowSettings] = useState(false);
  const [ping, setPing] = useState<number>(0);

  // Measure real network latency
  useEffect(() => {
    if (!isConnected) {
      setPing(0);
      return;
    }

    const measureLatency = async () => {
      const start = performance.now();
      try {
        await fetch('/health', { method: 'HEAD' });
        const latency = Math.round(performance.now() - start);
        setPing(latency);
      } catch (error) {
        console.error('Latency measurement failed:', error);
      }
    };

    const interval = setInterval(measureLatency, 3000);
    measureLatency();

    return () => clearInterval(interval);
  }, [isConnected]);

  const handleLeave = async () => {
    await leaveChannel();
    onLeave();
  };

  const isMuted = localParticipant?.audio === false;

  // Handle mute - if deafened, clicking mute does undeafen first
  const handleMuteClick = () => {
    if (isDeafened) {
      // Can't unmute while deafened - do nothing or show toast
      return;
    }
    toggleMute();
  };

  // Handle deafen - also mutes when deafening
  const handleDeafenClick = () => {
    toggleDeafen();
  };

  const connectionQuality = (localParticipant?.quality?.network?.level as 'good' | 'low' | 'bad') || 'good';
  const qualityColorClass = {
    good: 'text-green-500',
    low: 'text-yellow-500',
    bad: 'text-red-500',
  }[connectionQuality] || 'text-gray-500';

  return (
    <div className="w-full bg-mot-surface border-t border-mot-border">
      {/* Connection Status Header */}
      <div className="px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {isConnecting ? (
            <Loader2 className="w-3 h-3 text-mot-gold animate-spin" />
          ) : isConnected ? (
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          ) : (
            <div className="w-2 h-2 bg-gray-500 rounded-full" />
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium text-green-500">
              {isConnecting ? 'Connecting...' : 'Voice Connected'}
            </span>
            <span className="text-xs text-gray-400 truncate">{channelName}</span>
          </div>
        </div>

        {isConnected && (
          <div className="flex items-center gap-1">
            <Wifi className={`w-3 h-3 ${qualityColorClass}`} />
            <span className={`text-xs ${qualityColorClass}`}>{ping}ms</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="px-3 py-2 border-t border-mot-border flex items-center justify-center gap-2">
        {/* Mute */}
        <button
          onClick={handleMuteClick}
          disabled={!isConnected || isDeafened}
          className={`p-2.5 rounded-lg transition-all ${isMuted || isDeafened
            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
            : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
            } ${isDeafened ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={isDeafened ? 'Undeafen first to unmute' : isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted || isDeafened ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {/* Deafen */}
        <button
          onClick={handleDeafenClick}
          disabled={!isConnected}
          className={`p-2.5 rounded-lg transition-all ${isDeafened
            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
            : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
          title={isDeafened ? 'Undeafen' : 'Deafen'}
        >
          {isDeafened ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Settings */}
        <button
          onClick={() => setShowSettings(true)}
          className="p-2.5 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-all"
          title="Voice Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Disconnect */}
        <button
          onClick={handleLeave}
          className="p-2.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
          title="Disconnect"
        >
          <PhoneOff className="w-4 h-4" />
        </button>
      </div>

      {showSettings && (
        <VoiceSettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
};