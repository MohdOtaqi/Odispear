import React, { useState } from 'react';
import { Mic, MicOff, PhoneOff, Volume2, VolumeX, Settings, User, Wifi } from 'lucide-react';
import { useVoiceChat } from './VoiceChatProvider';
import { VoiceSettingsModal } from './VoiceSettingsModal';
import toast from 'react-hot-toast';

interface VoicePanelAdvancedProps {
  channelId: string;
  channelName: string;
  onLeave: () => void;
}

export const VoicePanelAdvanced: React.FC<VoicePanelAdvancedProps> = ({
  channelId,
  channelName,
  onLeave,
}) => {
  const {
    isConnected,
    isConnecting,
    localUser,
    remoteUsers,
    settings,
    joinChannel,
    leaveChannel,
    toggleMute,
    toggleDeafen,
    setInputVolume,
    setOutputVolume,
  } = useVoiceChat();

  const [showSettings, setShowSettings] = useState(false);

  // Auto-join when mounted
  React.useEffect(() => {
    if (!isConnected && !isConnecting) {
      joinChannel(channelId, channelName);
    }
  }, [channelId, channelName, isConnected, isConnecting, joinChannel]);

  const handleLeave = async () => {
    await leaveChannel();
    onLeave();
  };

  const getConnectionQuality = () => {
    if (!isConnected) return 'Disconnected';
    // You can implement actual quality detection based on network stats
    return 'Good';
  };

  const connectionColor = {
    Good: 'text-green-500',
    Fair: 'text-yellow-500',
    Poor: 'text-red-500',
    Disconnected: 'text-gray-500',
  }[getConnectionQuality()];

  return (
    <div className="w-full bg-neutral-850 border-t border-neutral-700 animate-slide-up">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-semibold text-white">{channelName}</span>
        </div>
        <div className="flex items-center gap-2">
          <Wifi className={`w-4 h-4 ${connectionColor}`} />
          <span className={`text-xs ${connectionColor}`}>{getConnectionQuality()}</span>
        </div>
      </div>

      {/* Users List */}
      <div className="px-4 py-3 max-h-48 overflow-y-auto custom-scrollbar">
        <div className="space-y-2">
          {/* Local User */}
          {localUser && (
            <div className="flex items-center gap-3 p-2 rounded-lg bg-neutral-800/50">
              <div className="relative">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center font-semibold text-sm ${localUser.isSpeaking ? 'ring-2 ring-green-500' : ''}`}>
                  {localUser.username[0]}
                </div>
                {localUser.isMuted && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center">
                    <MicOff className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white flex items-center gap-2">
                  {localUser.username}
                  {settings.pushToTalk && localUser.isSpeaking && (
                    <span className="text-xs text-green-500 font-semibold">Speaking...</span>
                  )}
                </div>
                {/* Audio Level Bar */}
                <div className="mt-1 h-1 bg-neutral-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-100"
                    style={{ width: `${localUser.audioLevel}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Remote Users */}
          {Array.from(remoteUsers.values()).map((user) => (
            <div key={user.uid} className="flex items-center gap-3 p-2 rounded-lg bg-neutral-800/30 hover:bg-neutral-800/50 transition-colors">
              <div className="relative">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center font-semibold text-sm ${user.isSpeaking ? 'ring-2 ring-green-500' : ''}`}>
                  <User className="w-4 h-4 text-white" />
                </div>
                {user.isMuted && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center">
                    <MicOff className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-neutral-300">{user.username}</div>
                {/* Audio Level Bar */}
                <div className="mt-1 h-1 bg-neutral-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-100"
                    style={{ width: `${user.audioLevel}%` }}
                  />
                </div>
              </div>
            </div>
          ))}

          {/* No other users */}
          {remoteUsers.size === 0 && isConnected && (
            <div className="text-center py-4 text-neutral-500 text-sm">
              No one else is in the channel
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 py-3 border-t border-neutral-700 space-y-3">
        {/* Volume Controls */}
        <div className="space-y-2">
          {/* Input Volume */}
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-neutral-400" />
            <input
              type="range"
              min="0"
              max="100"
              value={settings.inputVolume}
              onChange={(e) => setInputVolume(Number(e.target.value))}
              className="flex-1 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider-thumb-primary"
            />
            <span className="text-xs text-neutral-400 w-8 text-right">{settings.inputVolume}%</span>
          </div>

          {/* Output Volume */}
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-neutral-400" />
            <input
              type="range"
              min="0"
              max="100"
              value={settings.outputVolume}
              onChange={(e) => setOutputVolume(Number(e.target.value))}
              className="flex-1 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider-thumb-primary"
            />
            <span className="text-xs text-neutral-400 w-8 text-right">{settings.outputVolume}%</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-4 gap-2">
          {/* Mute */}
          <button
            onClick={toggleMute}
            disabled={!isConnected}
            className={`p-3 rounded-lg transition-all hover-lift ${
              localUser?.isMuted
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-300'
            }`}
            title={localUser?.isMuted ? 'Unmute' : 'Mute'}
          >
            {localUser?.isMuted ? <MicOff className="w-5 h-5 mx-auto" /> : <Mic className="w-5 h-5 mx-auto" />}
          </button>

          {/* Deafen */}
          <button
            onClick={toggleDeafen}
            disabled={!isConnected}
            className={`p-3 rounded-lg transition-all hover-lift ${
              localUser?.isDeafened
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-300'
            }`}
            title={localUser?.isDeafened ? 'Undeafen' : 'Deafen'}
          >
            {localUser?.isDeafened ? <VolumeX className="w-5 h-5 mx-auto" /> : <Volume2 className="w-5 h-5 mx-auto" />}
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

        {/* Push-to-Talk Indicator */}
        {settings.pushToTalk && (
          <div className="text-center py-2 px-3 bg-neutral-800 rounded-lg border border-neutral-700">
            <span className="text-xs text-neutral-400">
              Hold <kbd className="px-1.5 py-0.5 bg-neutral-700 rounded text-white font-mono">{settings.pushToTalkKey}</kbd> to speak
            </span>
          </div>
        )}

        {/* Connection Status */}
        {isConnecting && (
          <div className="text-center text-sm text-neutral-400">
            <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent mr-2" />
            Connecting...
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <VoiceSettingsModal onClose={() => setShowSettings(false)} />
      )}

      <style>{`
        .slider-thumb-primary::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #8b5cf6;
          cursor: pointer;
        }
        .slider-thumb-primary::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #8b5cf6;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
};
