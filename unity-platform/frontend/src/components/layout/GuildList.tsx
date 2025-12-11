import React, { useCallback } from 'react';
import { Plus, Home, Users, Headphones, Settings, User, UserPlus, Cog } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useGuildStore } from '../../store/guildStore';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
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
        'w-12 h-12 rounded-full bg-mot-surface hover:bg-mot-gold transition-all duration-200',
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
      {isActive && (
        <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-mot-gold rounded-r-full" />
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
    <>
      {/* Guild List - No wrapper, rendered inline in MainApp */}
      {guilds.map((guild) => (
        <GuildButton
          key={guild.id}
          guild={guild}
          isActive={guild.id === currentGuildId}
          onClick={() => handleGuildClick(guild.id)}
        />
      ))}

      {/* Create Guild Button */}
      <Tooltip content="Add a Server" position="right">
        <button
          onClick={onCreateGuild}
          className="w-12 h-12 rounded-2xl bg-mot-surface-subtle hover:bg-mot-gold flex items-center justify-center transition-all hover:rounded-xl text-mot-gold hover:text-mot-black"
          aria-label="Add a Server"
        >
          <Plus className="h-6 w-6" />
        </button>
      </Tooltip>
    </>
  );
});

GuildList.displayName = 'GuildList';
