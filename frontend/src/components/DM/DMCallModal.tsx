import React, { useEffect, useRef, useState } from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Monitor, X } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import api from '../../lib/api';
import toast from 'react-hot-toast';

interface DMCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelId: string;
  participantName: string;
  participantAvatar?: string;
  initialVideo?: boolean;
}

export const DMCallModal: React.FC<DMCallModalProps> = ({
  isOpen,
  onClose,
  channelId,
  participantName,
  participantAvatar,
  initialVideo = false
}) => {
  const [isConnecting, setIsConnecting] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(initialVideo);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionTimeout, setConnectionTimeout] = useState(30); // 30 second timeout
  const callFrameRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCall();
      // Start connection timeout countdown
      timeoutRef.current = setInterval(() => {
        setConnectionTimeout(prev => {
          if (prev <= 1) {
            // Timeout reached - cancel call
            if (timeoutRef.current) {
              clearInterval(timeoutRef.current);
            }
            toast.error('Connection timed out. Please try again.');
            handleEndCall();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current);
      }
      if (callFrameRef.current) {
        callFrameRef.current.destroy();
        callFrameRef.current = null;
      }
    };
  }, [isOpen]);

  const startCall = async () => {
    try {
      setIsConnecting(true);

      // Get call token from backend
      const { data } = await api.post(`/dm/${channelId}/call`, { video: initialVideo });

      // Import Daily.co
      const DailyIframe = (await import('@daily-co/daily-js')).default;

      // Create Daily.co call frame
      if (containerRef.current) {
        callFrameRef.current = DailyIframe.createFrame(containerRef.current, {
          showLeaveButton: false,
          showFullscreenButton: true,
          iframeStyle: {
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: '8px'
          }
        });

        // Join the call
        await callFrameRef.current.join({
          url: data.roomUrl,
          token: data.token
        });

        // Stop timeout timer - connection successful
        if (timeoutRef.current) {
          clearInterval(timeoutRef.current);
        }

        setIsConnecting(false);

        // Start call duration timer
        timerRef.current = setInterval(() => {
          setCallDuration(prev => prev + 1);
        }, 1000);

        // Listen for call events
        callFrameRef.current.on('left-meeting', () => {
          handleEndCall();
        });
      }
    } catch (error) {
      console.error('Failed to start call:', error);
      toast.error('Failed to start call');
      onClose();
    }
  };

  const handleEndCall = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (timeoutRef.current) {
      clearInterval(timeoutRef.current);
    }
    if (callFrameRef.current) {
      callFrameRef.current.leave();
      callFrameRef.current.destroy();
      callFrameRef.current = null;
    }
    onClose();
  };

  const toggleMute = () => {
    if (callFrameRef.current) {
      const newMuted = !isMuted;
      callFrameRef.current.setLocalAudio(!newMuted);
      setIsMuted(newMuted);
    }
  };

  const toggleVideo = () => {
    if (callFrameRef.current) {
      const newVideoOn = !isVideoOn;
      callFrameRef.current.setLocalVideo(newVideoOn);
      setIsVideoOn(newVideoOn);
    }
  };

  const toggleScreenShare = async () => {
    if (callFrameRef.current) {
      if (isScreenSharing) {
        callFrameRef.current.stopScreenShare();
      } else {
        callFrameRef.current.startScreenShare();
      }
      setIsScreenSharing(!isScreenSharing);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="relative w-full max-w-4xl h-[600px] bg-mot-surface-subtle rounded-xl shadow-2xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={handleEndCall}
          className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Connecting state */}
        {isConnecting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-mot-surface-subtle z-10">
            <Avatar
              src={participantAvatar}
              alt={participantName}
              size="xl"
              fallback={participantName.charAt(0)}
            />
            <h3 className="text-xl font-semibold text-white mt-4">{participantName}</h3>
            <p className="text-gray-400 mt-2">Connecting...</p>
            <p className="text-sm text-gray-500 mt-1">Timeout in {connectionTimeout}s</p>
            <div className="mt-4 flex gap-4">
              <div className="w-3 h-3 rounded-full bg-mot-gold animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-3 h-3 rounded-full bg-mot-gold animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-3 h-3 rounded-full bg-mot-gold animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>

            {/* Cancel/Disconnect button */}
            <button
              onClick={handleEndCall}
              className="mt-8 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-full transition-colors flex items-center gap-2"
            >
              <PhoneOff className="w-5 h-5" />
              Cancel Call
            </button>
          </div>
        )}

        {/* Video container */}
        <div ref={containerRef} className="w-full h-full" />

        {/* Call duration */}
        {!isConnecting && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-black/50 rounded-full text-white text-sm">
            {formatDuration(callDuration)}
          </div>
        )}

        {/* Controls */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3 bg-black/70 rounded-full">
          <button
            onClick={toggleMute}
            className={`p-4 rounded-full transition-colors ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full transition-colors ${!isVideoOn ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
          >
            {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          <button
            onClick={toggleScreenShare}
            className={`p-4 rounded-full transition-colors ${isScreenSharing ? 'bg-mot-gold text-mot-black' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
          >
            <Monitor className="w-5 h-5" />
          </button>

          <button
            onClick={handleEndCall}
            className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
