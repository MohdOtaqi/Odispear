import React, { useState } from 'react';
import { Mic, MicOff, PhoneOff, Volume2, VolumeX, Settings, User, Wifi, WifiOff } from 'lucide-react';
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
    settings,
    leaveChannel,
    toggleMute,
    toggleDeafen,
    setInputVolume,
    setOutputVolume,
  } = useVoiceChat();

  const [showSettings, setShowSettings] = useState(false);

  const handleLeave = async () => {
    await leaveChannel();
    onLeave();
  };

  const connectionQuality = localParticipant?.quality?.network?.level || 'good';
  const connectionColor = {
    good: 'text-green-500',
    low: 'text-yellow-500',
    bad: 'text-red-500',
  }[connectionQuality] || 'text-gray-500';

  return (
    <div className="w-full bg-neutral-850 border-t border-neutral-700 animate-slide-up">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isConnected && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
          <span className="text-sm font-semibold text-white">{isConnecting ? "Connecting..." : channelName}</span>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? <Wifi className={`w-4 h-4 ${connectionColor}`} /> : <WifiOff className="w-4 h-4 text-gray-500" />}
          <span className={`text-xs ${connectionColor} capitalize`}>{isConnected ? connectionQuality : 'Offline'}</span>
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