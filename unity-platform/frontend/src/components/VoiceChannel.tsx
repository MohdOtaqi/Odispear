import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Headphones,
  HeadphonesOff,
  Video,
  VideoOff,
  PhoneOff,
  Settings,
  Users,
  Share2,
} from 'lucide-react';

interface VoiceChannelProps {
  channelName: string;
  participants: Array<{
    id: string;
    username: string;
    avatar?: string;
    isMuted: boolean;
    isDeafened: boolean;
    isSpeaking: boolean;
    isVideoOn: boolean;
  }>;
  onLeave: () => void;
}

const VoiceChannel: React.FC<VoiceChannelProps> = ({
  channelName,
  participants,
  onLeave,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  return (
    <div className="bg-[#1e1f22] border-t border-purple-600/20 animate-slide-in-up">
      {/* Voice Channel Header */}
      <div className="px-4 py-2 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-b border-purple-600/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-ripple" />
            <span className="text-sm font-semibold text-green-400">
              Voice Connected
            </span>
            <span className="text-xs text-gray-400">/ {channelName}</span>
          </div>
          <button
            onClick={onLeave}
            className="p-1.5 rounded hover:bg-red-600/20 transition-colors group"
          >
            <PhoneOff className="w-4 h-4 text-gray-400 group-hover:text-red-400" />
          </button>
        </div>
      </div>

      {/* Participants */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-gray-400">
          <Users className="w-3 h-3" />
          <span>IN VOICE — {participants.length}</span>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-3">
          {participants.map((participant) => (
            <div
              key={participant.id}
              className="relative group animate-scale-in"
            >
              {/* Avatar */}
              <div
                className={`
                  relative w-full aspect-square rounded-lg overflow-hidden
                  ${participant.isSpeaking ? 'ring-2 ring-green-500 animate-ripple' : ''}
                  hover-lift cursor-pointer
                `}
              >
                {participant.isVideoOn ? (
                  <div className="w-full h-full bg-gradient-to-br from-purple-900 to-blue-900 flex items-center justify-center">
                    <Video className="w-6 h-6 text-gray-400" />
                  </div>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-xl font-bold">
                    {participant.avatar ? (
                      <img
                        src={participant.avatar}
                        alt={participant.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      participant.username[0].toUpperCase()
                    )}
                  </div>
                )}

                {/* Status Indicators */}
                <div className="absolute bottom-1 right-1 flex gap-1">
                  {participant.isMuted && (
                    <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
                      <MicOff className="w-3 h-3 text-white" />
                    </div>
                  )}
                  {participant.isDeafened && (
                    <div className="w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center">
                      <HeadphonesOff className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>

                {/* Speaking Indicator */}
                {participant.isSpeaking && (
                  <div className="absolute inset-0 border-2 border-green-500 rounded-lg animate-pulse" />
                )}
              </div>

              {/* Username */}
              <div className="mt-1 text-xs text-center truncate text-gray-300">
                {participant.username}
              </div>
            </div>
          ))}
        </div>

        {/* Voice Controls */}
        <div className="flex items-center justify-center gap-2 pt-2 border-t border-white/5">
          {/* Microphone */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`
              p-3 rounded-lg transition-all hover-lift
              ${
                isMuted
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-[#2b2d31] hover:bg-[#383a40]'
              }
            `}
          >
            {isMuted ? (
              <MicOff className="w-5 h-5 text-white" />
            ) : (
              <Mic className="w-5 h-5 text-white" />
            )}
          </button>

          {/* Headphones */}
          <button
            onClick={() => setIsDeafened(!isDeafened)}
            className={`
              p-3 rounded-lg transition-all hover-lift
              ${
                isDeafened
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-[#2b2d31] hover:bg-[#383a40]'
              }
            `}
          >
            {isDeafened ? (
              <HeadphonesOff className="w-5 h-5 text-white" />
            ) : (
              <Headphones className="w-5 h-5 text-white" />
            )}
          </button>

          {/* Video */}
          <button
            onClick={() => setIsVideoOn(!isVideoOn)}
            className={`
              p-3 rounded-lg transition-all hover-lift
              ${
                isVideoOn
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : 'bg-[#2b2d31] hover:bg-[#383a40]'
              }
            `}
          >
            {isVideoOn ? (
              <Video className="w-5 h-5 text-white" />
            ) : (
              <VideoOff className="w-5 h-5 text-white" />
            )}
          </button>

          {/* Screen Share */}
          <button
            onClick={() => setIsScreenSharing(!isScreenSharing)}
            className={`
              p-3 rounded-lg transition-all hover-lift
              ${
                isScreenSharing
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-[#2b2d31] hover:bg-[#383a40]'
              }
            `}
          >
            <Share2 className="w-5 h-5 text-white" />
          </button>

          {/* Settings */}
          <button className="p-3 rounded-lg bg-[#2b2d31] hover:bg-[#383a40] transition-all hover-lift">
            <Settings className="w-5 h-5 text-white" />
          </button>

          {/* Disconnect */}
          <button
            onClick={onLeave}
            className="p-3 rounded-lg bg-red-600 hover:bg-red-700 transition-all hover-lift"
          >
            <PhoneOff className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceChannel;
