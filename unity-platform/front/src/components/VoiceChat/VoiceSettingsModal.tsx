import React, { useState, useEffect } from 'react';
import { X, Mic, Volume2, Keyboard, Sliders } from 'lucide-react';
import { useVoiceChat } from './VoiceChatProvider';
import AgoraRTC from 'agora-rtc-sdk-ng';

interface VoiceSettingsModalProps {
  onClose: () => void;
}

type TabType = 'devices' | 'voice' | 'keybindings' | 'advanced';

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({ onClose }) => {
  const { settings, updateSettings } = useVoiceChat();
  const [activeTab, setActiveTab] = useState<TabType>('devices');
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [speakers, setSpeakers] = useState<MediaDeviceInfo[]>([]);
  const [testingMic, setTestingMic] = useState(false);
  const [micTestLevel, setMicTestLevel] = useState(0);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const mics = await AgoraRTC.getMicrophones();
      // Note: getSpeakers is not available in Web SDK
      // Speakers are controlled by the browser/OS
      setMicrophones(mics);
      setSpeakers([]); // No speaker enumeration in browser
    } catch (error) {
      console.error('Failed to load devices:', error);
    }
  };

  const handleMicTest = async () => {
    if (testingMic) {
      setTestingMic(false);
      setMicTestLevel(0);
      return;
    }

    setTestingMic(true);
    try {
      const track = await AgoraRTC.createMicrophoneAudioTrack();
      const interval = setInterval(() => {
        const level = track.getVolumeLevel() * 100;
        setMicTestLevel(level);
      }, 100);

      setTimeout(() => {
        clearInterval(interval);
        track.stop();
        track.close();
        setTestingMic(false);
        setMicTestLevel(0);
      }, 3000);
    } catch (error) {
      console.error('Mic test failed:', error);
      setTestingMic(false);
    }
  };

  const tabs = [
    { id: 'devices' as TabType, label: 'Audio Devices', icon: Mic },
    { id: 'voice' as TabType, label: 'Voice Settings', icon: Volume2 },
    { id: 'keybindings' as TabType, label: 'Keybindings', icon: Keyboard },
    { id: 'advanced' as TabType, label: 'Advanced', icon: Sliders },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-neutral-850 rounded-xl shadow-2xl border border-neutral-700 w-full max-w-2xl max-h-[80vh] flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-700">
          <h2 className="text-xl font-bold text-white">Voice Settings</h2>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-700 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-neutral-400 hover:text-neutral-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="font-medium text-sm">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Audio Devices Tab */}
          {activeTab === 'devices' && (
            <div className="space-y-6">
              {/* Microphone */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Input Device
                </label>
                <select
                  value={settings.selectedMicrophone || ''}
                  onChange={(e) => updateSettings({ selectedMicrophone: e.target.value })}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="">Default Microphone</option>
                  {microphones.map((mic) => (
                    <option key={mic.deviceId} value={mic.deviceId}>
                      {mic.label || `Microphone ${mic.deviceId.substring(0, 8)}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Input Volume */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Input Volume: {settings.inputVolume}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.inputVolume}
                  onChange={(e) => updateSettings({ inputVolume: Number(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Mic Test */}
              <div>
                <button
                  onClick={handleMicTest}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    testingMic
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  {testingMic ? 'Stop Test' : 'Test Microphone'}
                </button>
                {testingMic && (
                  <div className="mt-3 h-2 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-100"
                      style={{ width: `${micTestLevel}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Output Volume */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Output Volume: {settings.outputVolume}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.outputVolume}
                  onChange={(e) => updateSettings({ outputVolume: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Voice Settings Tab */}
          {activeTab === 'voice' && (
            <div className="space-y-6">
              {/* Audio Quality */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Audio Quality
                </label>
                <select
                  value={settings.audioQuality}
                  onChange={(e) => updateSettings({ audioQuality: e.target.value as any })}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="low">Low (8 kHz)</option>
                  <option value="medium">Medium (16 kHz)</option>
                  <option value="high">High (48 kHz)</option>
                  <option value="music">Music (48 kHz stereo)</option>
                </select>
                <p className="mt-2 text-xs text-neutral-400">
                  Higher quality uses more bandwidth
                </p>
              </div>

              {/* Noise Suppression */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">Noise Suppression</div>
                  <div className="text-xs text-neutral-400">Reduce background noise</div>
                </div>
                <label className="relative inline-block w-12 h-6">
                  <input
                    type="checkbox"
                    checked={settings.noiseSuppression}
                    onChange={(e) => updateSettings({ noiseSuppression: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-full h-full bg-neutral-700 peer-checked:bg-purple-600 rounded-full transition-colors cursor-pointer peer-focus:ring-2 peer-focus:ring-purple-500"></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                </label>
              </div>

              {/* Echo Cancellation */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">Echo Cancellation</div>
                  <div className="text-xs text-neutral-400">Prevent audio feedback</div>
                </div>
                <label className="relative inline-block w-12 h-6">
                  <input
                    type="checkbox"
                    checked={settings.echoCancellation}
                    onChange={(e) => updateSettings({ echoCancellation: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-full h-full bg-neutral-700 peer-checked:bg-purple-600 rounded-full transition-colors cursor-pointer peer-focus:ring-2 peer-focus:ring-purple-500"></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                </label>
              </div>

              {/* Auto Gain Control */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">Auto Gain Control</div>
                  <div className="text-xs text-neutral-400">Automatically adjust volume</div>
                </div>
                <label className="relative inline-block w-12 h-6">
                  <input
                    type="checkbox"
                    checked={settings.autoGainControl}
                    onChange={(e) => updateSettings({ autoGainControl: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-full h-full bg-neutral-700 peer-checked:bg-purple-600 rounded-full transition-colors cursor-pointer peer-focus:ring-2 peer-focus:ring-purple-500"></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                </label>
              </div>

              {/* Voice Changer */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Voice Changer (Fun!)
                </label>
                <select
                  value={settings.voiceChanger}
                  onChange={(e) => updateSettings({ voiceChanger: e.target.value as any })}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="none">None</option>
                  <option value="robot">🤖 Robot</option>
                  <option value="child">👶 Child</option>
                  <option value="elder">👴 Elder</option>
                  <option value="monster">👹 Monster</option>
                </select>
              </div>
            </div>
          )}

          {/* Keybindings Tab */}
          {activeTab === 'keybindings' && (
            <div className="space-y-6">
              {/* Voice Mode */}
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Voice Mode
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 bg-neutral-800 rounded-lg cursor-pointer hover:bg-neutral-700 transition-colors">
                    <input
                      type="radio"
                      checked={settings.voiceActivation}
                      onChange={() => updateSettings({ voiceActivation: true, pushToTalk: false })}
                      className="w-4 h-4 text-purple-600"
                    />
                    <div>
                      <div className="font-medium text-white">Voice Activity</div>
                      <div className="text-xs text-neutral-400">Automatically transmit when you speak</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-neutral-800 rounded-lg cursor-pointer hover:bg-neutral-700 transition-colors">
                    <input
                      type="radio"
                      checked={settings.pushToTalk}
                      onChange={() => updateSettings({ pushToTalk: true, voiceActivation: false })}
                      className="w-4 h-4 text-purple-600"
                    />
                    <div>
                      <div className="font-medium text-white">Push to Talk</div>
                      <div className="text-xs text-neutral-400">Hold a key to transmit</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Push to Talk Key */}
              {settings.pushToTalk && (
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Push to Talk Key
                  </label>
                  <select
                    value={settings.pushToTalkKey}
                    onChange={(e) => updateSettings({ pushToTalkKey: e.target.value })}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="Space">Space</option>
                    <option value="ControlLeft">Left Ctrl</option>
                    <option value="ControlRight">Right Ctrl</option>
                    <option value="AltLeft">Left Alt</option>
                    <option value="AltRight">Right Alt</option>
                    <option value="Backquote">` (Backtick)</option>
                  </select>
                </div>
              )}

              {/* Voice Activation Threshold */}
              {settings.voiceActivation && (
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Voice Activation Threshold: {settings.voiceThreshold}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.voiceThreshold}
                    onChange={(e) => updateSettings({ voiceThreshold: Number(e.target.value) })}
                    className="w-full"
                  />
                  <p className="mt-2 text-xs text-neutral-400">
                    Lower = more sensitive (may pick up background noise)
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Advanced Tab */}
          {activeTab === 'advanced' && (
            <div className="space-y-6">
              {/* Pitch Shift */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Pitch Adjustment: {settings.pitchShift > 0 ? '+' : ''}{settings.pitchShift}
                </label>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  value={settings.pitchShift}
                  onChange={(e) => updateSettings({ pitchShift: Number(e.target.value) })}
                  className="w-full"
                />
                <p className="mt-2 text-xs text-neutral-400">
                  Adjust voice pitch (semitones)
                </p>
              </div>

              {/* Debug Info */}
              <div className="p-4 bg-neutral-800 rounded-lg border border-neutral-700">
                <div className="text-sm font-semibold text-white mb-2">Debug Information</div>
                <div className="space-y-1 text-xs text-neutral-400 font-mono">
                  <div>SDK Version: {AgoraRTC.VERSION}</div>
                  <div>Audio Quality: {settings.audioQuality}</div>
                  <div>Noise Suppression: {settings.noiseSuppression ? 'On' : 'Off'}</div>
                  <div>Echo Cancellation: {settings.echoCancellation ? 'On' : 'Off'}</div>
                  <div>AGC: {settings.autoGainControl ? 'On' : 'Off'}</div>
                </div>
              </div>

              {/* Reset Button */}
              <button
                onClick={() => {
                  updateSettings({
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
                }}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Reset to Defaults
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-neutral-700">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
