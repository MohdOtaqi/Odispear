import React, { useEffect, useState } from 'react';
import { Mic, MicOff, Headphones, HeadphonesOff, Volume2, User, Signal } from 'lucide-react';
import { useVoiceChat } from './VoiceChatProvider';
import { Tooltip } from '../ui/Tooltip';

interface VoiceParticipantsProps {
  channelId: string;
  channelName: string;
}

interface Participant {
  id: string;
  username: string;
  avatar_url?: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  volume: number;
  ping: number;
}

export const VoiceParticipants: React.FC<VoiceParticipantsProps> = ({ channelId, channelName }) => {
  const { participants, localParticipant, isConnected } = useVoiceChat();
  const [speakingUsers, setSpeakingUsers] = useState<Set<string>>(new Set());
  const [userVolumes, setUserVolumes] = useState<Map<string, number>>(new Map());

  // Detect speaking users
  useEffect(() => {
    if (!isConnected) return;

    const checkSpeaking = () => {
      const newSpeaking = new Set<string>();
      
      participants.forEach(participant => {
        // Check if participant is speaking based on audio level
        if (participant.audio && !participant.local) {
          const audioTrack = participant.tracks?.audio?.track;
          if (audioTrack && audioTrack.readyState === 'live') {
            // Simulate speaking detection (in real app, use Web Audio API)
            const isSpeaking = Math.random() > 0.8; // Mock - replace with actual audio detection
            if (isSpeaking) {
              newSpeaking.add(participant.session_id);
            }
          }
        }
      });

      // Add local participant if speaking
      if (localParticipant?.audio && !localParticipant.audioTrack?.muted) {
        const isSpeaking = Math.random() > 0.9; // Mock for local
        if (isSpeaking) {
          newSpeaking.add(localParticipant.session_id);
        }
      }

      setSpeakingUsers(newSpeaking);
    };

    const interval = setInterval(checkSpeaking, 100);
    return () => clearInterval(interval);
  }, [participants, localParticipant, isConnected]);

  // Format participant data
  const formattedParticipants = participants.map(p => ({
    id: p.session_id,
    username: p.user_name || 'Unknown',
    avatar_url: p.user_id ? `https://ui-avatars.com/api/?name=${p.user_name}&background=5865F2&color=fff` : undefined,
    isMuted: !p.audio || false,
    isDeafened: false,
    isSpeaking: speakingUsers.has(p.session_id),
    volume: userVolumes.get(p.session_id) || 100,
    ping: 32, // Use actual network latency from VoicePanelAdvanced
  }));

  if (!isConnected || participants.length === 0) {
    return (
      <div className="p-4">
        <div className="text-sm font-semibold text-gray-400 uppercase mb-3">
          Voice Channel — {channelName}
        </div>
        <div className="text-center py-8 text-gray-500">
          <Volume2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No one's here yet</p>
          <p className="text-xs mt-1">Be the first to join!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="text-sm font-semibold text-gray-400 uppercase mb-3 flex items-center justify-between">
        <span>Voice Channel — {channelName}</span>
        <span className="text-xs normal-case">
          {formattedParticipants.length} {formattedParticipants.length === 1 ? 'member' : 'members'}
        </span>
      </div>

      <div className="space-y-2">
        {formattedParticipants.map((participant) => (
          <ParticipantItem key={participant.id} participant={participant} />
        ))}
      </div>
    </div>
  );
};

const ParticipantItem: React.FC<{ participant: Participant }> = ({ participant }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div
      className={`
        flex items-center gap-3 p-2 rounded-lg transition-all duration-200
        ${isHovered ? 'bg-white/5' : ''}
        ${participant.isSpeaking ? 'bg-green-500/10' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar with speaking ring */}
      <div className="relative">
        <div
          className={`
            absolute inset-0 rounded-full transition-all duration-300
            ${participant.isSpeaking 
              ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-[#2b2d31] animate-pulse' 
              : ''
            }
          `}
        />
        <Avatar
          src={participant.avatar_url}
          alt={participant.username}
          fallback={participant.username.charAt(0).toUpperCase()}
          size="sm"
          className="relative z-10"
        />
        
        {/* Status indicator */}
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#2b2d31] rounded-full flex items-center justify-center z-20">
          {participant.isDeafened ? (
            <HeadphonesOff className="w-3 h-3 text-red-500" />
          ) : participant.isMuted ? (
            <MicOff className="w-3 h-3 text-red-500" />
          ) : participant.isSpeaking ? (
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          ) : (
            <div className="w-2 h-2 bg-gray-500 rounded-full" />
          )}
        </div>
      </div>

      {/* Username and status */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`
            font-medium truncate
            ${participant.isSpeaking ? 'text-green-400' : 'text-gray-200'}
          `}>
            {participant.username}
          </span>
          {participant.isSpeaking && (
            <Volume2 className="w-3 h-3 text-green-400 animate-pulse" />
          )}
        </div>
        
        {/* Connection quality */}
        {isHovered && (
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex items-center gap-1">
              <Signal className={`w-3 h-3 ${
                participant.ping < 30 ? 'text-green-400' :
                participant.ping < 60 ? 'text-yellow-400' :
                'text-red-400'
              }`} />
              <span className="text-xs text-gray-500">{participant.ping}ms</span>
            </div>
          </div>
        )}
      </div>

      {/* Volume control (shown on hover) */}
      {isHovered && (
        <div className="flex items-center gap-1">
          <Tooltip content={`Volume: ${participant.volume}%`}>
            <input
              type="range"
              min="0"
              max="200"
              value={participant.volume}
              onChange={(e) => {
                // Handle volume change
                console.log('Volume changed:', e.target.value);
              }}
              className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #10b981 0%, #10b981 ${participant.volume / 2}%, #4b5563 ${participant.volume / 2}%, #4b5563 100%)`
              }}
            />
          </Tooltip>
        </div>
      )}

      {/* Action buttons (shown on hover) */}
      {isHovered && (
        <div className="flex items-center gap-1">
          <Tooltip content={participant.isMuted ? "User is muted" : "Mute user"}>
            <button className="p-1.5 hover:bg-white/10 rounded transition-colors">
              {participant.isMuted ? (
                <MicOff className="w-4 h-4 text-red-500" />
              ) : (
                <Mic className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </Tooltip>
          
          <Tooltip content={participant.isDeafened ? "User is deafened" : "Deafen user"}>
            <button className="p-1.5 hover:bg-white/10 rounded transition-colors">
              {participant.isDeafened ? (
                <HeadphonesOff className="w-4 h-4 text-red-500" />
              ) : (
                <Headphones className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </Tooltip>
        </div>
      )}
    </div>
  );
};

export default VoiceParticipants;
