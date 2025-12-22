import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, Volume2, Speaker, Video } from 'lucide-react';
import { useVoiceChat } from './LiveKitProvider';
import { autoDetectSensitivity } from '../../hooks/useVoiceActivityDetection';
import { VoiceMode } from '../../hooks/usePushToTalk';

interface VoiceSettingsModalProps {
  onClose: () => void;
}

type TabType = 'devices' | 'voice' | 'video';

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({ onClose }) => {
  const { settings, setInputVolume, setOutputVolume, setInputDevice, setOutputDevice } = useVoiceChat();
  const [activeTab, setActiveTab] = useState<TabType>('devices');
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [speakers, setSpeakers] = useState<MediaDeviceInfo[]>([]);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState<string>(() => localStorage.getItem('selectedMicId') || 'default');
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>(() => localStorage.getItem('selectedSpeakerId') || 'default');
  const [selectedCamera, setSelectedCamera] = useState<string>(() => localStorage.getItem('selectedCameraId') || 'default');
  const [testingMic, setTestingMic] = useState(false);
  const [micTestLevel, setMicTestLevel] = useState(0);
  const [localInputVolume, setLocalInputVolume] = useState(settings.inputVolume * 100 || 100);
  const [localOutputVolume, setLocalOutputVolume] = useState(settings.outputVolume * 100 || 100);
  const testAudioRef = useRef<HTMLAudioElement | null>(null);

  // PTT/VAD Settings
  const [voiceMode, setVoiceMode] = useState<VoiceMode>(() =>
    (localStorage.getItem('voiceMode') as VoiceMode) || 'voice_activity'
  );
  const [pttKeybind, setPttKeybind] = useState<string>(() =>
    localStorage.getItem('pttKeybind') || 'Space'
  );
  const [pttReleaseDelay, setPttReleaseDelay] = useState<number>(() =>
    Number(localStorage.getItem('pttReleaseDelay')) || 100
  );
  const [vadSensitivity, setVadSensitivity] = useState<number>(() =>
    Number(localStorage.getItem('vadSensitivity')) || 50
  );
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);

  // Auto-detect VAD sensitivity
  const handleAutoDetectSensitivity = async () => {
    setIsAutoDetecting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recommended = await autoDetectSensitivity(stream);
      setVadSensitivity(recommended);
      localStorage.setItem('vadSensitivity', String(recommended));
      stream.getTracks().forEach(t => t.stop());
    } catch (error) {
      console.error('Failed to auto-detect sensitivity:', error);
    } finally {
      setIsAutoDetecting(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      const devices = await navigator.mediaDevices.enumerateDevices();

      const mics = devices.filter(device => device.kind === 'audioinput');
      const spkrs = devices.filter(device => device.kind === 'audiooutput');
      const cams = devices.filter(device => device.kind === 'videoinput');

      setMicrophones(mics);
      setSpeakers(spkrs);
      setCameras(cams);

      // Clean up the stream
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Failed to load devices:', error);
      // Try audio only if video fails
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const mics = devices.filter(device => device.kind === 'audioinput');
        const spkrs = devices.filter(device => device.kind === 'audiooutput');
        setMicrophones(mics);
        setSpeakers(spkrs);
        audioStream.getTracks().forEach(track => track.stop());
      } catch (e) {
        console.error('Failed to load audio devices:', e);
      }
    }
  };

  const handleMicChange = async (deviceId: string) => {
    setSelectedMic(deviceId);
    localStorage.setItem('selectedMicId', deviceId);

    // Apply to LiveKit using the context function
    try {
      if (deviceId !== 'default') {
        await setInputDevice(deviceId);
      }
      console.log('[Voice] Microphone changed to:', deviceId);
    } catch (error) {
      console.error('Failed to change microphone:', error);
    }
  };

  const handleSpeakerChange = async (deviceId: string) => {
    setSelectedSpeaker(deviceId);
    localStorage.setItem('selectedSpeakerId', deviceId);

    // Apply to LiveKit using the context function
    try {
      if (deviceId !== 'default') {
        await setOutputDevice(deviceId);
      }
      console.log('[Voice] Speaker changed to:', deviceId);
    } catch (error) {
      console.error('Failed to change speaker:', error);
    }

    // Also update any existing audio elements
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach((audio: HTMLAudioElement) => {
      if ((audio as any).setSinkId && deviceId !== 'default') {
        (audio as any).setSinkId(deviceId).catch(console.error);
      }
    });
  };

  const handleMicTest = async () => {
    if (testingMic) {
      setTestingMic(false);
      setMicTestLevel(0);
      return;
    }

    setTestingMic(true);
    try {
      const constraints: MediaStreamConstraints = {
        audio: selectedMic && selectedMic !== 'default'
          ? { deviceId: { exact: selectedMic } }
          : true
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      microphone.connect(analyser);

      const interval = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setMicTestLevel(average / 255 * 100);
      }, 100);

      setTimeout(() => {
        clearInterval(interval);
        stream.getTracks().forEach(track => track.stop());
        audioContext.close();
        setTestingMic(false);
        setMicTestLevel(0);
      }, 3000);
    } catch (error) {
      console.error('Mic test failed:', error);
      setTestingMic(false);
    }
  };

  const handleCameraChange = async (deviceId: string) => {
    setSelectedCamera(deviceId);
    localStorage.setItem('selectedCameraId', deviceId);
    console.log('[Voice] Camera changed to:', deviceId);
  };

  const tabs = [
    { id: 'devices' as TabType, label: 'Audio', icon: Mic },
    { id: 'video' as TabType, label: 'Video', icon: Video },
    { id: 'voice' as TabType, label: 'Voice', icon: Volume2 },
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
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === tab.id
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
                  value={selectedMic}
                  onChange={(e) => handleMicChange(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="default">Default Microphone</option>
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
                  value={localInputVolume}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setLocalInputVolume(value);
                    setInputVolume(value);
                  }}
                  className="w-full"
                />
              </div>

              {/* Mic Test */}
              <div>
                <button
                  onClick={handleMicTest}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${testingMic
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

              {/* Output Device */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Output Device
                </label>
                <select
                  value={selectedSpeaker}
                  onChange={(e) => handleSpeakerChange(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="default">Default Speaker</option>
                  {speakers.map((speaker) => (
                    <option key={speaker.deviceId} value={speaker.deviceId}>
                      {speaker.label || `Speaker ${speaker.deviceId.substring(0, 8)}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Output Volume */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Output Volume: {Math.round(localOutputVolume)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={localOutputVolume}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setLocalOutputVolume(value);
                    setOutputVolume(value);
                  }}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Video Tab - Camera Selection */}
          {activeTab === 'video' && (
            <div className="space-y-6">
              {/* Camera Selection */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Camera
                </label>
                <select
                  value={selectedCamera}
                  onChange={(e) => handleCameraChange(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="default">Default Camera</option>
                  {cameras.map((camera) => (
                    <option key={camera.deviceId} value={camera.deviceId}>
                      {camera.label || `Camera ${camera.deviceId.substring(0, 8)}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Video Quality */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Video Quality
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button className="p-3 rounded-lg border-2 border-neutral-700 bg-neutral-850 hover:border-neutral-600 transition-all">
                    <span className="block text-sm font-medium text-white">480p</span>
                    <span className="text-xs text-neutral-400">Low</span>
                  </button>
                  <button className="p-3 rounded-lg border-2 border-purple-500 bg-purple-500/20 transition-all">
                    <span className="block text-sm font-medium text-white">720p</span>
                    <span className="text-xs text-neutral-400">HD</span>
                  </button>
                  <button className="p-3 rounded-lg border-2 border-neutral-700 bg-neutral-850 hover:border-neutral-600 transition-all">
                    <span className="block text-sm font-medium text-white">1080p</span>
                    <span className="text-xs text-neutral-400">Full HD</span>
                  </button>
                </div>
              </div>

              {/* Video Features Info */}
              <div className="p-4 bg-neutral-800 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-2">Video Features</h3>
                <div className="space-y-2 text-sm text-neutral-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Picture-in-Picture support (hover on video for button)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Video toggle in voice panel sidebar</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                    <span>Background blur coming soon</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Voice Settings Tab - PTT/VAD Controls */}
          {activeTab === 'voice' && (
            <div className="space-y-6">
              {/* Voice Input Mode */}
              <div className="p-4 bg-neutral-800 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3">Input Mode</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      localStorage.setItem('voiceMode', 'voice_activity');
                      setVoiceMode('voice_activity');
                    }}
                    className={`p-4 rounded-lg border-2 transition-all ${voiceMode === 'voice_activity'
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-neutral-700 bg-neutral-850 hover:border-neutral-600'
                      }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Volume2 className="w-5 h-5 text-purple-400" />
                      <span className="font-semibold text-white">Voice Activity</span>
                    </div>
                    <p className="text-xs text-neutral-400 text-left">
                      Automatically transmit when you speak
                    </p>
                  </button>
                  <button
                    onClick={() => {
                      localStorage.setItem('voiceMode', 'push_to_talk');
                      setVoiceMode('push_to_talk');
                    }}
                    className={`p-4 rounded-lg border-2 transition-all ${voiceMode === 'push_to_talk'
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-neutral-700 bg-neutral-850 hover:border-neutral-600'
                      }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Mic className="w-5 h-5 text-purple-400" />
                      <span className="font-semibold text-white">Push to Talk</span>
                    </div>
                    <p className="text-xs text-neutral-400 text-left">
                      Hold a key to transmit audio
                    </p>
                  </button>
                </div>
              </div>

              {/* PTT Settings - Only show when PTT mode selected */}
              {voiceMode === 'push_to_talk' && (
                <div className="p-4 bg-neutral-800 rounded-lg space-y-4">
                  <h3 className="text-lg font-semibold text-white">Push to Talk Settings</h3>

                  {/* Keybind */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Shortcut Key
                    </label>
                    <select
                      value={pttKeybind}
                      onChange={(e) => {
                        setPttKeybind(e.target.value);
                        localStorage.setItem('pttKeybind', e.target.value);
                      }}
                      className="w-full bg-neutral-700 border border-neutral-600 rounded-lg px-4 py-2.5 text-white focus:border-purple-500 focus:outline-none"
                    >
                      <option value="Space">Space</option>
                      <option value="KeyV">V</option>
                      <option value="KeyT">T</option>
                      <option value="KeyG">G</option>
                      <option value="ControlLeft">Left Ctrl</option>
                      <option value="ControlRight">Right Ctrl</option>
                      <option value="ShiftLeft">Left Shift</option>
                      <option value="Backquote">` (Backtick)</option>
                      <option value="CapsLock">Caps Lock</option>
                    </select>
                    <p className="text-xs text-neutral-500 mt-1.5">
                      Hold this key to transmit audio
                    </p>
                  </div>

                  {/* Release Delay */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Release Delay: {pttReleaseDelay}ms
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="500"
                      step="50"
                      value={pttReleaseDelay}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        setPttReleaseDelay(value);
                        localStorage.setItem('pttReleaseDelay', String(value));
                      }}
                      className="w-full"
                    />
                    <p className="text-xs text-neutral-500 mt-1.5">
                      How long to keep transmitting after releasing the key
                    </p>
                  </div>
                </div>
              )}

              {/* VAD Settings - Only show when Voice Activity mode selected */}
              {voiceMode === 'voice_activity' && (
                <div className="p-4 bg-neutral-800 rounded-lg space-y-4">
                  <h3 className="text-lg font-semibold text-white">Voice Activity Settings</h3>

                  {/* Sensitivity */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Sensitivity: {vadSensitivity}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={vadSensitivity}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        setVadSensitivity(value);
                        localStorage.setItem('vadSensitivity', String(value));
                      }}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-neutral-500 mt-1">
                      <span>Quiet environment</span>
                      <span>Noisy environment</span>
                    </div>
                  </div>

                  {/* Auto Sensitivity Button */}
                  <button
                    onClick={handleAutoDetectSensitivity}
                    disabled={isAutoDetecting}
                    className="w-full py-2.5 px-4 bg-neutral-700 hover:bg-neutral-600 disabled:bg-neutral-700 disabled:text-neutral-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {isAutoDetecting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        Detecting...
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4" />
                        Auto-Detect Sensitivity
                      </>
                    )}
                  </button>
                  <p className="text-xs text-neutral-500 text-center">
                    Analyzes your environment for 2 seconds to find the optimal setting
                  </p>
                </div>
              )}

              {/* Audio Quality Info */}
              <div className="p-4 bg-neutral-800 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-2">Audio Processing</h3>
                <div className="space-y-2 text-sm text-neutral-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Noise suppression with noise gate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Echo cancellation enabled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Automatic gain control</span>
                  </div>
                </div>
              </div>
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
