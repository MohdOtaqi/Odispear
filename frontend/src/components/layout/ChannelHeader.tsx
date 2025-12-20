import React from 'react';
import { motion } from 'framer-motion';
import { Hash, Volume2, Users, Bell, Search, Pin, Settings, Sparkles } from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';

interface ChannelHeaderProps {
  channelName: string;
  channelType?: 'text' | 'voice';
  topic?: string;
  memberCount?: number;
  onToggleMembers?: () => void;
  onOpenSettings?: () => void;
}

const HeaderButton = ({ tooltip, onClick, children, isActive }: {
  tooltip: string;
  onClick?: () => void;
  children: React.ReactNode;
  isActive?: boolean;
}) => (
  <Tooltip content={tooltip} position="bottom">
    <motion.button
      onClick={onClick}
      className={`p-2 rounded-lg transition-colors ${isActive
          ? 'text-mot-gold bg-mot-gold/10'
          : 'text-gray-400 hover:text-white hover:bg-mot-gold/10'
        }`}
      aria-label={tooltip}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      {children}
    </motion.button>
  </Tooltip>
);

export const ChannelHeader = React.memo<ChannelHeaderProps>(({
  channelName,
  channelType = 'text',
  topic,
  memberCount,
  onToggleMembers,
  onOpenSettings,
}) => {
  const Icon = channelType === 'voice' ? Volume2 : Hash;

  return (
    <motion.div
      className="h-14 px-4 flex items-center justify-between border-b border-mot-border bg-mot-surface/80 backdrop-blur-md"
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Left: Channel Info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <motion.div
          className="p-1.5 rounded-lg bg-mot-gold/10"
          whileHover={{ scale: 1.1, rotate: 5 }}
        >
          <Icon className="w-5 h-5 text-mot-gold" />
        </motion.div>
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="font-semibold text-white truncate">{channelName}</h1>
          {channelType === 'voice' && (
            <motion.span
              className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Live
            </motion.span>
          )}
        </div>
        {topic && (
          <>
            <div className="w-px h-5 bg-mot-border hidden sm:block" />
            <p className="text-sm text-gray-400 truncate hidden sm:block">{topic}</p>
          </>
        )}
      </div>

      {/* Right: Actions */}
      <motion.div
        className="flex items-center gap-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <HeaderButton tooltip="Notification Settings">
          <Bell className="w-5 h-5" />
        </HeaderButton>

        <HeaderButton tooltip="Pinned Messages">
          <Pin className="w-5 h-5" />
        </HeaderButton>

        {memberCount !== undefined && (
          <HeaderButton tooltip={`Member List (${memberCount})`} onClick={onToggleMembers}>
            <div className="relative">
              <Users className="w-5 h-5" />
              <motion.span
                className="absolute -top-1 -right-1 w-4 h-4 bg-mot-gold text-mot-black text-[10px] font-bold rounded-full flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500 }}
              >
                {memberCount > 99 ? '99+' : memberCount}
              </motion.span>
            </div>
          </HeaderButton>
        )}

        <HeaderButton tooltip="Search">
          <Search className="w-5 h-5" />
        </HeaderButton>

        {onOpenSettings && (
          <HeaderButton tooltip="Channel Settings" onClick={onOpenSettings}>
            <Settings className="w-5 h-5" />
          </HeaderButton>
        )}
      </motion.div>
    </motion.div>
  );
});

ChannelHeader.displayName = 'ChannelHeader';
