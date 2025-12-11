import React, { useState, useEffect, useCallback } from 'react';
import { Search, MoreVertical, UserMinus, Ban, Clock } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import api from '../../lib/api';
import toast from 'react-hot-toast';

interface Member {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  roles: { id: string; name: string; color: string }[];
  joined_at: string;
}

interface MembersManagerProps {
  guildId: string;
}

export const MembersManager: React.FC<MembersManagerProps> = ({ guildId }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    try {
      const { data } = await api.get(`/guilds/${guildId}/members`);
      setMembers(data);
    } catch (error) {
      toast.error('Failed to load members');
    } finally {
      setIsLoading(false);
    }
  }, [guildId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleKick = async (userId: string, username: string) => {
    if (!confirm(`Kick ${username} from the server?`)) return;
    
    try {
      await api.post(`/guilds/${guildId}/kick`, { user_id: userId });
      setMembers(prev => prev.filter(m => m.user_id !== userId));
      toast.success(`${username} has been kicked`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to kick member');
    }
    setActionMenuOpen(null);
  };

  const handleBan = async (userId: string, username: string) => {
    const reason = prompt(`Ban ${username}? Enter reason (optional):`);
    if (reason === null) return;
    
    try {
      await api.post(`/guilds/${guildId}/ban`, { user_id: userId, reason });
      setMembers(prev => prev.filter(m => m.user_id !== userId));
      toast.success(`${username} has been banned`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to ban member');
    }
    setActionMenuOpen(null);
  };

  const handleTimeout = async (userId: string, username: string) => {
    const duration = prompt(`Timeout ${username} for how many minutes?`, '10');
    if (!duration) return;
    
    try {
      await api.post(`/guilds/${guildId}/mute`, { 
        user_id: userId, 
        duration: parseInt(duration) * 60,
        reason: 'Timeout'
      });
      toast.success(`${username} has been timed out for ${duration} minutes`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to timeout member');
    }
    setActionMenuOpen(null);
  };

  const filteredMembers = members.filter(m => 
    m.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.display_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <div className="text-gray-400 text-center py-8">Loading members...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search members..."
          className="w-full pl-10 pr-4 py-2 bg-mot-surface border border-mot-border rounded-lg text-white placeholder-gray-500 focus:border-mot-gold focus:ring-2 focus:ring-mot-gold/20 focus:outline-none"
        />
      </div>

      {/* Members Count */}
      <div className="text-sm text-gray-400">
        {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}
      </div>

      {/* Members List */}
      <div className="space-y-2">
        {filteredMembers.map(member => (
          <div
            key={member.user_id}
            className="flex items-center gap-3 p-3 bg-mot-surface rounded-lg border border-mot-border hover:border-mot-gold/30 transition-colors"
          >
            <Avatar
              src={member.avatar_url || undefined}
              alt={member.username}
              size="md"
              fallback={member.username.charAt(0)}
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-white truncate">
                  {member.display_name || member.username}
                </span>
                {member.roles.some(r => r.name === '@everyone') && member.roles.length === 1 ? null : (
                  member.roles.slice(0, 3).map(role => (
                    <span
                      key={role.id}
                      className="px-1.5 py-0.5 text-xs rounded"
                      style={{ backgroundColor: `${role.color}20`, color: role.color }}
                    >
                      {role.name}
                    </span>
                  ))
                )}
              </div>
              <div className="text-sm text-gray-400">@{member.username}</div>
            </div>

            {/* Actions Menu */}
            <div className="relative">
              <button
                onClick={() => setActionMenuOpen(actionMenuOpen === member.user_id ? null : member.user_id)}
                className="p-2 text-gray-400 hover:text-white hover:bg-mot-gold/10 rounded-lg transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {actionMenuOpen === member.user_id && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-mot-surface-subtle border border-mot-border rounded-lg shadow-xl z-50 overflow-hidden">
                  <button
                    onClick={() => handleTimeout(member.user_id, member.username)}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-mot-gold/10 transition-colors"
                  >
                    <Clock className="w-4 h-4" />
                    Timeout
                  </button>
                  <button
                    onClick={() => handleKick(member.user_id, member.username)}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-yellow-400 hover:bg-yellow-500/10 transition-colors"
                  >
                    <UserMinus className="w-4 h-4" />
                    Kick
                  </button>
                  <button
                    onClick={() => handleBan(member.user_id, member.username)}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Ban className="w-4 h-4" />
                    Ban
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
