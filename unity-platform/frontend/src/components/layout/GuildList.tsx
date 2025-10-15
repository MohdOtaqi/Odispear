import React, { useCallback } from 'react';
import { Plus, Home } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useGuildStore } from '../../store/guildStore';
import { Tooltip } from '../ui/Tooltip';

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
    <button
      onClick={onClick}
      className={cn(
        'w-12 h-12 rounded-full bg-[#2b2d31] hover:bg-purple-600 transition-all duration-200',
        'flex items-center justify-center text-white font-semibold text-lg relative group',
        isActive ? 'rounded-xl bg-purple-600' : 'hover:rounded-xl'
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
      {isActive && (
        <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
      )}
    </button>
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
    <div className="w-18 bg-[#1e1f22] flex flex-col items-center py-3 gap-2 border-r border-white/5 custom-scrollbar overflow-y-auto">
      {/* Home Button */}
      <Tooltip content="Home" position="right">
        <button
          className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 flex items-center justify-center transition-all hover:rounded-xl shadow-lg animate-glow"
          aria-label="Home"
        >
          <Home className="h-6 w-6 text-white" />
        </button>
      </Tooltip>

      {/* Divider */}
      <div className="w-8 h-0.5 bg-white/10 rounded-full my-1" />

      {/* Guild List */}
      <div className="flex-1 overflow-y-auto space-y-2 w-full flex flex-col items-center custom-scrollbar">
        {guilds.map((guild) => (
          <GuildButton
            key={guild.id}
            guild={guild}
            isActive={guild.id === currentGuildId}
            onClick={() => handleGuildClick(guild.id)}
          />
        ))}
      </div>

      {/* Create Guild Button */}
      <Tooltip content="Add a Server" position="right">
        <button
          onClick={onCreateGuild}
          className="w-12 h-12 rounded-full bg-[#2b2d31] hover:bg-green-600 flex items-center justify-center transition-all hover:rounded-xl text-green-500 hover:text-white"
          aria-label="Add a Server"
        >
          <Plus className="h-6 w-6" />
        </button>
      </Tooltip>
    </div>
  );
});

GuildList.displayName = 'GuildList';
