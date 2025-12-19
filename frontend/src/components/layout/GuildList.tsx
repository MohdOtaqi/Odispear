import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useGuildStore } from '../../store/guildStore';
import { Tooltip } from '../ui/Tooltip';
import { magneticSpring } from '../../lib/animations';

interface GuildListProps {
  currentGuildId?: string;
  onGuildSelect: (guildId: string) => void;
  onCreateGuild: () => void;
}

const GuildButton = React.memo<{
  guild: { id: string; name: string; icon_url?: string };
  isActive: boolean;
  onClick: () => void;
}>(({ guild, isActive, onClick }) => (
  <Tooltip content={guild.name} position="right">
    <motion.button
      onClick={onClick}
      whileHover={{
        scale: 1.1,
        y: -2,
        boxShadow: isActive
          ? "0 0 25px rgba(212, 175, 55, 0.6)"
          : "0 0 20px rgba(212, 175, 55, 0.4)"
      }}
      whileTap={{ scale: 0.95 }}
      transition={magneticSpring}
      className={cn(
        'w-12 h-12 rounded-full bg-mot-surface hover:bg-mot-gold transition-colors duration-200',
        'flex items-center justify-center text-white font-semibold text-lg relative group',
        isActive ? 'rounded-xl bg-mot-gold text-mot-black' : 'hover:rounded-xl hover:text-mot-black'
      )}
      aria-label={guild.name}
    >
      {guild.icon_url ? (
        <img
          src={guild.icon_url}
          alt={guild.name}
          className="w-full h-full rounded-full object-cover"
          loading="lazy"
        />
      ) : (
        <span>{guild.name.charAt(0).toUpperCase()}</span>
      )}
      {/* Active indicator with glow */}
      {isActive && (
        <motion.div
          layoutId="activeGuildIndicator"
          className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-mot-gold rounded-r-full"
          style={{ boxShadow: "0 0 10px rgba(212, 175, 55, 0.8)" }}
        />
      )}
    </motion.button>
  </Tooltip>
));

GuildButton.displayName = 'GuildButton';

export const GuildList = React.memo<GuildListProps>(({
  currentGuildId,
  onGuildSelect,
  onCreateGuild,
}) => {
  const guilds = useGuildStore((state) => state.guilds);

  const handleGuildClick = useCallback((guildId: string) => {
    onGuildSelect(guildId);
  }, [onGuildSelect]);

  return (
    <>
      {/* Guild List with staggered animation */}
      {guilds.map((guild, index) => (
        <motion.div
          key={guild.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            delay: index * 0.05,
            ...magneticSpring
          }}
        >
          <GuildButton
            guild={guild}
            isActive={guild.id === currentGuildId}
            onClick={() => handleGuildClick(guild.id)}
          />
        </motion.div>
      ))}

      {/* Create Guild Button with hover effects */}
      <Tooltip content="Add a Server" position="right">
        <motion.button
          onClick={onCreateGuild}
          whileHover={{
            scale: 1.1,
            y: -2,
            boxShadow: "0 0 20px rgba(212, 175, 55, 0.4)",
            rotate: 90
          }}
          whileTap={{ scale: 0.9 }}
          transition={magneticSpring}
          className="w-12 h-12 rounded-2xl bg-mot-surface-subtle hover:bg-mot-gold flex items-center justify-center transition-colors text-mot-gold hover:text-mot-black"
          aria-label="Add a Server"
        >
          <Plus className="h-6 w-6" />
        </motion.button>
      </Tooltip>
    </>
  );
});

GuildList.displayName = 'GuildList';
