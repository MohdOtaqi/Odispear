import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, Volume2, Speaker } from 'lucide-react';
import { useVoiceChat } from './LiveKitProvider';

interface VoiceSettingsModalProps {
  onClose: () => void;
}

type TabType = 'devices' | 'voice';

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({ onClose }) => {
  const { settings, setInputVolume, setOutputVolume, setInputDevice, setOutputDevice } = useVoiceChat();
  const [activeTab, setActiveTab] = useState<TabType>('devices');
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [speakers, setSpeakers] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState<string>(() => localStorage.getItem('selectedMicId') || 'default');
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>(() => localStorage.getItem('selectedSpeakerId') || 'default');
  const [testingMic, setTestingMic] = useState(false);
  const [micTestLevel, setMicTestLevel] = useState(0);
  const [localInputVolume, setLocalInputVolume] = useState(settings.inputVolume * 100 || 100);
  const [localOutputVolume, setLocalOutputVolume] = useState(settings.outputVolume * 100 || 100);
  const testAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const devices = await navigator.mediaDevices.enumerateDevices();

      const mics = devices.filter(device => device.kind === 'audioinput');
      const spkrs = devices.filter(device => device.kind === 'audiooutput');

      setMicrophones(mics);
      setSpeakers(spkrs);

      // Clean up the stream
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Failed to load devices:', error);
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

  const tabs = [
    { id: 'devices' as TabType, label: 'Audio Devices', icon: Mic },
    { id: 'voice' as TabType, label: 'Voice Settings', icon: Volume2 },
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

          {/* Voice Settings Tab */}
          {activeTab === 'voice' && (
            <div className="space-y-6">
              {/* Audio Quality Info */}
              <div className="p-4 bg-neutral-800 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-2">Voice Quality</h3>
                <p className="text-sm text-neutral-400">
                  LiveKit automatically optimizes audio quality based on your connection.
                </p>
              </div>

              {/* Noise Suppression Info */}
              <div className="p-4 bg-neutral-800 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-2">Noise Suppression</h3>
                <p className="text-sm text-neutral-400">
                  Professional-grade noise suppression with noise gate removes background noise.
                </p>
              </div>

              {/* Echo Cancellation Info */}
              <div className="p-4 bg-neutral-800 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-2">Echo Cancellation</h3>
                <p className="text-sm text-neutral-400">
                  Echo cancellation is enabled by default to prevent audio feedback.
                </p>
              </div>

              {/* Auto Gain Control Info */}
              <div className="p-4 bg-neutral-800 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-2">Automatic Gain Control</h3>
                <p className="text-sm text-neutral-400">
                  Your microphone sensitivity is automatically adjusted for optimal volume.
                </p>
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
