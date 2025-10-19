import React, { useState, useEffect, useRef } from 'react';
import { Monitor, MonitorOff, Video, VideoOff, Maximize2, Minimize2, Settings, X, Camera, Mic, MicOff, Users, Grid, List } from 'lucide-react';

interface ScreenShareVideoProps {
  channelId: string;
  userId: string;
  onClose?: () => void;
}

export const ScreenShareVideo: React.FC<ScreenShareVideoProps> = ({ channelId, userId, onClose }) => {
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [selectedScreen, setSelectedScreen] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [layout, setLayout] = useState<'grid' | 'speaker'>('speaker');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [screenQuality, setScreenQuality] = useState<'720p' | '1080p' | 'source'>('1080p');
  const [frameRate, setFrameRate] = useState(30);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenShareRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize local media
    initializeMedia();
    
    return () => {
      stopAllStreams();
    };
  }, []);

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Failed to initialize media:', error);
    }
  };

  const startScreenShare = async () => {
    try {
      const displayMediaOptions = {
        video: {
          cursor: 'always',
          displaySurface: 'monitor',
          frameRate: frameRate,
          ...(screenQuality === '720p' && { width: 1280, height: 720 }),
          ...(screenQuality === '1080p' && { width: 1920, height: 1080 })
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      };

      const screenStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
      
      setSelectedScreen(screenStream);
      setIsScreenSharing(true);
      
      if (screenShareRef.current) {
        screenShareRef.current.srcObject = screenStream;
      }

      // Handle screen share ended by user
      screenStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

      // Notify other participants
      broadcastScreenShare(screenStream);
    } catch (error) {
      console.error('Failed to start screen share:', error);
    }
  };

  const stopScreenShare = () => {
    if (selectedScreen) {
      selectedScreen.getTracks().forEach(track => track.stop());
      setSelectedScreen(null);
    }
    setIsScreenSharing(false);
  };

  const toggleVideo = async () => {
    if (isVideoOn) {
      // Stop video
      if (localStream) {
        localStream.getVideoTracks().forEach(track => track.stop());
      }
      setIsVideoOn(false);
    } else {
      // Start video
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 }
          }
        });
        
        if (localStream) {
          const videoTrack = videoStream.getVideoTracks()[0];
          localStream.addTrack(videoTrack);
        } else {
          setLocalStream(videoStream);
        }
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }
        
        setIsVideoOn(true);
      } catch (error) {
        console.error('Failed to start video:', error);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsAudioOn(!isAudioOn);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const stopAllStreams = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (selectedScreen) {
      selectedScreen.getTracks().forEach(track => track.stop());
    }
  };

  const broadcastScreenShare = (stream: MediaStream) => {
    // WebRTC implementation would go here
    console.log('Broadcasting screen share to participants');
  };

  // Mock participants
  useEffect(() => {
    setParticipants([
      { id: '1', name: 'John Doe', isVideo: true, isAudio: true, isSpeaking: false },
      { id: '2', name: 'Jane Smith', isVideo: false, isAudio: true, isSpeaking: true },
      { id: '3', name: 'Bob Johnson', isVideo: true, isAudio: false, isSpeaking: false }
    ]);
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-900/90 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <h2 className="text-white font-semibold">
            {isScreenSharing ? 'Screen Sharing' : isVideoOn ? 'Video Call' : 'Voice Channel'}
          </h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-800 rounded">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300">{participants.length + 1}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Layout Toggle */}
          <button
            onClick={() => setLayout(layout === 'grid' ? 'speaker' : 'grid')}
            className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
            title={layout === 'grid' ? 'Speaker View' : 'Grid View'}
          >
            {layout === 'grid' ? <List className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>

          {/* Settings */}
          <button
            className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Close */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 bg-gray-800 rounded-lg text-red-400 hover:text-red-300 transition-colors"
              title="Leave"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden">
        {layout === 'speaker' ? (
          <>
            {/* Main Speaker View */}
            <div className="absolute inset-0 flex items-center justify-center bg-gray-950">
              {isScreenSharing && (
                <video
                  ref={screenShareRef}
                  autoPlay
                  className="max-w-full max-h-full"
                />
              )}
              {!isScreenSharing && isVideoOn && (
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  className="max-w-full max-h-full"
                />
              )}
              {!isScreenSharing && !isVideoOn && (
                <div className="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center">
                  <Camera className="w-12 h-12 text-gray-600" />
                </div>
              )}
            </div>

            {/* Participant Thumbnails */}
            <div className="absolute bottom-20 right-4 flex flex-col gap-2">
              {participants.map(participant => (
                <div
                  key={participant.id}
                  className="w-40 h-28 bg-gray-900 rounded-lg overflow-hidden border-2 border-gray-800 relative"
                >
                  {participant.isVideo ? (
                    <div className="w-full h-full bg-gray-800"></div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-850">
                      <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-1 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white truncate">{participant.name}</span>
                      <div className="flex items-center gap-1">
                        {!participant.isAudio && <MicOff className="w-3 h-3 text-red-400" />}
                        {participant.isSpeaking && <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
            {/* Self View */}
            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
              {isVideoOn ? (
                <video ref={localVideoRef} autoPlay muted className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-850">
                  <div className="w-20 h-20 bg-gray-700 rounded-full"></div>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white">You</span>
                  <div className="flex items-center gap-1">
                    {!isAudioOn && <MicOff className="w-3 h-3 text-red-400" />}
                    {isScreenSharing && <Monitor className="w-3 h-3 text-purple-400" />}
                  </div>
                </div>
              </div>
            </div>

            {/* Participants */}
            {participants.map(participant => (
              <div key={participant.id} className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
                {participant.isVideo ? (
                  <div className="w-full h-full bg-gray-800"></div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-850">
                    <div className="w-20 h-20 bg-gray-700 rounded-full"></div>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white truncate">{participant.name}</span>
                    <div className="flex items-center gap-1">
                      {!participant.isAudio && <MicOff className="w-3 h-3 text-red-400" />}
                      {participant.isSpeaking && <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 bg-gray-900/90 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-4">
          {/* Screen Share Toggle */}
          <button
            onClick={isScreenSharing ? stopScreenShare : startScreenShare}
            className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
              isScreenSharing
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
            {isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
          </button>

          {/* Video Toggle */}
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-lg transition-all ${
              isVideoOn
                ? 'bg-gray-800 text-white hover:bg-gray-700'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {/* Audio Toggle */}
          <button
            onClick={toggleAudio}
            className={`p-3 rounded-lg transition-all ${
              isAudioOn
                ? 'bg-gray-800 text-white hover:bg-gray-700'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {isAudioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          {/* Leave Call */}
          <button
            onClick={() => {
              stopAllStreams();
              onClose?.();
            }}
            className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Leave
          </button>
        </div>

        {/* Quality Settings */}
        {isScreenSharing && (
          <div className="flex items-center justify-center gap-4 mt-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Quality:</span>
              <select
                value={screenQuality}
                onChange={(e) => setScreenQuality(e.target.value as any)}
                className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-gray-300"
              >
                <option value="720p">720p</option>
                <option value="1080p">1080p</option>
                <option value="source">Source</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">FPS:</span>
              <select
                value={frameRate}
                onChange={(e) => setFrameRate(Number(e.target.value))}
                className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-gray-300"
              >
                <option value="15">15</option>
                <option value="30">30</option>
                <option value="60">60</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScreenShareVideo;
