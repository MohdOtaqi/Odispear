import React, { useMemo, useState } from 'react';
import { Avatar } from '../ui/Avatar';
import { Crown, MessageSquare } from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';
import { UserProfileModal } from '../UserProfileModal';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';

interface Member {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  nickname?: string;
}

interface MemberListProps {
  members: Member[];
  ownerId?: string;
  guildId?: string;
}

const MemberItem = React.memo<{
  member: Member;
  isOwner: boolean;
  onProfileClick: (userId: string) => void;
  onMessageClick: (userId: string) => void;
}>(({ member, isOwner, onProfileClick, onMessageClick }) => {
  const displayName = member.nickname || member.display_name || member.username;
  
  return (
    <div className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/10 group transition-all duration-150">
      <button
        onClick={() => onProfileClick(member.id)}
        className="flex items-center gap-2 flex-1 min-w-0"
      >
        <Avatar
          src={member.avatar_url}
          alt={member.username}
          fallback={member.username.charAt(0)}
          size="sm"
          status={member.status}
        />
        <div className="flex-1 min-w-0 text-left">
          <div className="text-sm font-medium truncate flex items-center gap-1 text-gray-300 group-hover:text-white transition-colors">
            {displayName}
            {isOwner && (
              <Tooltip content="Server Owner" position="top">
                <Crown className="h-3 w-3 text-yellow-500 flex-shrink-0" />
              </Tooltip>
            )}
          </div>
        </div>
      </button>
      <Tooltip content={`Message ${displayName}`} position="left">
        <button
          onClick={() => onMessageClick(member.id)}
          className="p-1 hover:bg-white/10 rounded"
        >
          <MessageSquare className="h-4 w-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </Tooltip>
    </div>
  );
});

MemberItem.displayName = 'MemberItem';

export const MemberList = React.memo<MemberListProps>(({ members, ownerId, guildId }) => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const { onlineMembers, offlineMembers } = useMemo(() => ({
    onlineMembers: members.filter((m) => m.status !== 'offline'),
    offlineMembers: members.filter((m) => m.status === 'offline'),
  }), [members]);

  const handleProfileClick = (userId: string) => {
    setSelectedUserId(userId);
  };

  const handleMessageClick = async (userId: string) => {
    try {
      const { data } = await api.post('/dm/create', { user_id: userId });
      navigate(`/app/dms/${data.id}`);
    } catch (error: any) {
      toast.error('Failed to create DM');
    }
  };

  return (
    <div className="w-60 bg-[#2b2d31] flex flex-col overflow-y-auto custom-scrollbar border-l border-white/5">
      <div className="p-3">
        {onlineMembers.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-semibold text-gray-400 uppercase mb-2 px-2">
              Online — {onlineMembers.length}
            </div>
            <div className="space-y-0.5">
              {onlineMembers.map((member) => (
                <MemberItem
                  key={member.id}
                  member={member}
                  isOwner={member.id === ownerId}
                  onProfileClick={handleProfileClick}
                  onMessageClick={handleMessageClick}
                />
              ))}
            </div>
          </div>
        )}

        {offlineMembers.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase mb-2 px-2">
              Offline — {offlineMembers.length}
            </div>
            <div className="space-y-0.5">
              {offlineMembers.map((member) => (
                <MemberItem
                  key={member.id}
                  member={member}
                  isOwner={member.id === ownerId}
                  onProfileClick={handleProfileClick}
                  onMessageClick={handleMessageClick}
                />
              ))}
            </div>
          </div>
        )}

        {members.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No members found</p>
          </div>
        )}
      </div>
      
      {/* Profile Modal */}
      {selectedUserId && (
        <UserProfileModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          guildId={guildId}
        />
      )}
    </div>
  );
});

MemberList.displayName = 'MemberList';
