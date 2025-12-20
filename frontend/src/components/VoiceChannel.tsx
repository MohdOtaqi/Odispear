import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Signal,
} from 'lucide-react';
import { Tooltip } from './ui/Tooltip';

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

const ControlButton = ({
  isActive,
  activeColor = 'red',
  onClick,
  children,
  tooltip
}: {
  isActive?: boolean;
  activeColor?: 'red' | 'green' | 'purple' | 'gold';
  onClick: () => void;
  children: React.ReactNode;
  tooltip: string;
}) => {
  const colors = {
    red: 'bg-red-500 hover:bg-red-600',
    green: 'bg-green-500 hover:bg-green-600',
    purple: 'bg-purple-500 hover:bg-purple-600',
    gold: 'bg-mot-gold hover:bg-mot-gold-light'
  };

  return (
    <Tooltip content={tooltip} position="top">
      <motion.button
        onClick={onClick}
        className={`p-3 rounded-xl transition-colors ${isActive
            ? colors[activeColor]
            : 'bg-mot-surface hover:bg-mot-surface-subtle'
          }`}
        whileHover={{ scale: 1.1, y: -2 }}
        whileTap={{ scale: 0.9 }}
        animate={isActive ? { boxShadow: `0 0 20px ${activeColor === 'red' ? 'rgba(239, 68, 68, 0.4)' : activeColor === 'green' ? 'rgba(34, 197, 94, 0.4)' : activeColor === 'purple' ? 'rgba(168, 85, 247, 0.4)' : 'rgba(212, 175, 55, 0.4)'}` } : { boxShadow: 'none' }}
      >
        {children}
      </motion.button>
    </Tooltip>
  );
};

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
    <motion.div
      className="bg-mot-surface border-t border-mot-border"
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      {/* Voice Channel Header */}
      <motion.div
        className="px-4 py-3 bg-gradient-to-r from-green-900/20 to-emerald-900/10 border-b border-mot-border"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className="flex items-center gap-2"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Signal className="w-4 h-4 text-green-400" />
              <span className="text-sm font-semibold text-green-400">Voice Connected</span>
            </motion.div>
            <span className="text-xs text-gray-500">/ {channelName}</span>
          </div>
          <motion.button
            onClick={onLeave}
            className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <PhoneOff className="w-4 h-4 text-red-400" />
          </motion.button>
        </div>
      </motion.div>

      {/* Participants */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-gray-400">
          <Users className="w-3 h-3" />
          <span>IN VOICE — {participants.length}</span>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-4">
          <AnimatePresence>
            {participants.map((participant, index) => (
              <motion.div
                key={participant.id}
                className="relative group"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.1, type: "spring" }}
              >
                {/* Avatar Container */}
                <motion.div
                  className={`relative w-full aspect-square rounded-xl overflow-hidden cursor-pointer`}
                  whileHover={{ scale: 1.05 }}
                >
                  {/* Speaking Ring */}
                  <AnimatePresence>
                    {participant.isSpeaking && (
                      <motion.div
                        className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.02, 1] }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                    )}
                  </AnimatePresence>

                  {/* Avatar */}
                  <div className={`relative w-full h-full ${participant.isSpeaking ? 'm-0.5' : ''}`}>
                    {participant.isVideoOn ? (
                      <div className="w-full h-full bg-gradient-to-br from-mot-gold/20 to-amber-600/20 flex items-center justify-center rounded-xl">
                        <Video className="w-6 h-6 text-gray-400" />
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-mot-gold to-amber-600 flex items-center justify-center text-xl font-bold text-mot-black rounded-xl">
                        {participant.avatar ? (
                          <img
                            src={participant.avatar}
                            alt={participant.username}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          participant.username[0].toUpperCase()
                        )}
                      </div>
                    )}
                  </div>

                  {/* Status Indicators */}
                  <div className="absolute bottom-1 right-1 flex gap-1">
                    <AnimatePresence>
                      {participant.isMuted && (
                        <motion.div
                          className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-lg"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <MicOff className="w-3 h-3 text-white" />
                        </motion.div>
                      )}
                      {participant.isDeafened && (
                        <motion.div
                          className="w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center shadow-lg"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <HeadphonesOff className="w-3 h-3 text-white" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>

                {/* Username */}
                <motion.div
                  className="mt-2 text-xs text-center truncate text-gray-300"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {participant.username}
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Voice Controls */}
        <motion.div
          className="flex items-center justify-center gap-2 pt-4 border-t border-mot-border"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <ControlButton
            isActive={isMuted}
            activeColor="red"
            onClick={() => setIsMuted(!isMuted)}
            tooltip={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <MicOff className="w-5 h-5 text-white" />
            ) : (
              <Mic className="w-5 h-5 text-gray-300" />
            )}
          </ControlButton>

          <ControlButton
            isActive={isDeafened}
            activeColor="red"
            onClick={() => setIsDeafened(!isDeafened)}
            tooltip={isDeafened ? 'Undeafen' : 'Deafen'}
          >
            {isDeafened ? (
              <HeadphonesOff className="w-5 h-5 text-white" />
            ) : (
              <Headphones className="w-5 h-5 text-gray-300" />
            )}
          </ControlButton>

          <ControlButton
            isActive={isVideoOn}
            activeColor="purple"
            onClick={() => setIsVideoOn(!isVideoOn)}
            tooltip={isVideoOn ? 'Turn Off Camera' : 'Turn On Camera'}
          >
            {isVideoOn ? (
              <Video className="w-5 h-5 text-white" />
            ) : (
              <VideoOff className="w-5 h-5 text-gray-300" />
            )}
          </ControlButton>

          <ControlButton
            isActive={isScreenSharing}
            activeColor="green"
            onClick={() => setIsScreenSharing(!isScreenSharing)}
            tooltip={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
          >
            <Share2 className={`w-5 h-5 ${isScreenSharing ? 'text-white' : 'text-gray-300'}`} />
          </ControlButton>

          <ControlButton
            onClick={() => { }}
            tooltip="Voice Settings"
          >
            <Settings className="w-5 h-5 text-gray-300" />
          </ControlButton>

          <motion.button
            onClick={onLeave}
            className="p-3 rounded-xl bg-red-500 hover:bg-red-600 transition-colors"
            whileHover={{ scale: 1.1, boxShadow: "0 0 20px rgba(239, 68, 68, 0.5)" }}
            whileTap={{ scale: 0.9 }}
          >
            <PhoneOff className="w-5 h-5 text-white" />
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default VoiceChannel;
