import React, { useState, useEffect } from 'react';
import { Mic, MicOff, PhoneOff, Volume2, VolumeX, Settings, User, Wifi, WifiOff, Activity } from 'lucide-react';
import { useVoiceChat } from './VoiceChatProvider';
// Keep your settings modal, it can still set state in the provider
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
    participants,
    isDeafened,
    leaveChannel,
    toggleMute,
    toggleDeafen,
  } = useVoiceChat();

  const [showSettings, setShowSettings] = useState(false);
  const [ping, setPing] = useState<number>(0);
  const [packetLoss, setPacketLoss] = useState<number>(0);

  // Measure real network latency
  useEffect(() => {
    if (!isConnected) {
      setPing(0);
      setPacketLoss(0);
      return;
    }

    const measureLatency = async () => {
      const start = performance.now();
      try {
        // Ping the backend API to measure network latency
        await fetch('/health', { method: 'HEAD' });
        const latency = Math.round(performance.now() - start);
        setPing(latency);
      } catch (error) {
        console.error('Latency measurement failed:', error);
      }
    };

    // Measure latency every 3 seconds
    const interval = setInterval(measureLatency, 3000);
    measureLatency(); // Initial measurement

    return () => clearInterval(interval);
  }, [isConnected]);

  // Simulate packet loss calculation (Daily.co provides this via quality stats)
  useEffect(() => {
    if (localParticipant?.quality) {
      const quality = localParticipant.quality;
      // Estimate packet loss based on quality
      const loss = quality.network?.level === 'bad' ? 5 : quality.network?.level === 'low' ? 2 : 0;
      setPacketLoss(loss);
    }
  }, [localParticipant]);

  const handleLeave = async () => {
    await leaveChannel();
    onLeave();
  };

  const connectionQuality: 'good' | 'low' | 'bad' = (localParticipant?.quality?.network?.level as 'good' | 'low' | 'bad') || 'good';
  const connectionColor: Record<'good' | 'low' | 'bad', string> = {
    good: 'text-green-500',
    low: 'text-yellow-500',
    bad: 'text-red-500',
  };
  const qualityColorClass = connectionColor[connectionQuality] || 'text-gray-500';

  return (
    <div className="w-full bg-neutral-850 border-t border-neutral-700 animate-slide-up">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isConnected && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
          <span className="text-sm font-semibold text-white">{isConnecting ? "Connecting..." : channelName}</span>
        </div>
        <div className="flex items-center gap-3">
          {isConnected ? (
            <>
              <div className="flex items-center gap-1">
                <Wifi className={`w-4 h-4 ${qualityColorClass}`} />
                <span className={`text-xs ${qualityColorClass}`}>
                  {ping}ms
                </span>
              </div>
              {packetLoss > 0 && (
                <div className="flex items-center gap-1">
                  <Activity className="w-3 h-3 text-yellow-500" />
                  <span className="text-xs text-yellow-500">
                    {packetLoss}% loss
                  </span>
                </div>
              )}
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-500">Offline</span>
            </>
          )}
        </div>
      </div>

      {/* Users List */}
      <div className="px-4 py-3 max-h-48 overflow-y-auto custom-scrollbar">
        <div className="space-y-2">
          {/* All Participants (Local + Remote) */}
          {participants.map((p) => {
            const isLocal = p.local;
            const isMuted = p.audioTrack ? !p.audioTrack.enabled : p.audio === false;
            const audioLevel = (p.audioTrack as any)?.level * 100 || 0;
            const isSpeaking = p.isSpeaking;

            return (
              <div key={p.session_id} className="flex items-center gap-3 p-2 rounded-lg bg-neutral-800/50">
                <div className="relative">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${isLocal ? 'from-purple-600 to-blue-600' : 'from-blue-600 to-cyan-600'} flex items-center justify-center font-semibold text-sm ${isSpeaking ? 'ring-2 ring-green-500' : ''}`}>
                    {p.user_name ? p.user_name[0].toUpperCase() : <User className="w-4 h-4 text-white" />}
                  </div>
                  {isMuted && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center">
                      <MicOff className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">{isLocal ? "You" : p.user_name}</div>
                  <div className="mt-1 h-1 bg-neutral-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-100"
                      style={{ width: `${isSpeaking ? (audioLevel > 5 ? audioLevel : 5) : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 py-3 border-t border-neutral-700 space-y-3">
        {/* Action Buttons */}
        <div className="grid grid-cols-4 gap-2">
          {/* Mute */}
          <button
            onClick={toggleMute}
            disabled={!isConnected}
            className={`p-3 rounded-lg transition-all hover-lift ${
              localParticipant?.audio === false
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-300'
            }`}
            title={localParticipant?.audio === false ? 'Unmute' : 'Mute'}
          >
            {localParticipant?.audio === false ? <MicOff className="w-5 h-5 mx-auto" /> : <Mic className="w-5 h-5 mx-auto" />}
          </button>

          {/* Deafen */}
          <button
            onClick={toggleDeafen}
            disabled={!isConnected}
            className={`p-3 rounded-lg transition-all hover-lift ${
              isDeafened
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-300'
            }`}
            title={isDeafened ? 'Undeafen' : 'Deafen'}
          >
            {isDeafened ? <VolumeX className="w-5 h-5 mx-auto" /> : <Volume2 className="w-5 h-5 mx-auto" />}
          </button>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(true)}
            className="p-3 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-neutral-300 transition-all hover-lift"
            title="Voice Settings"
          >
            <Settings className="w-5 h-5 mx-auto" />
          </button>

          {/* Disconnect */}
          <button
            onClick={handleLeave}
            className="p-3 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all hover-lift"
            title="Leave Channel"
          >
            <PhoneOff className="w-5 h-5 mx-auto" />
          </button>
        </div>
      </div>

      {/* Settings Modal (This can remain as it just updates context) */}
      {showSettings && (
        <VoiceSettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
};