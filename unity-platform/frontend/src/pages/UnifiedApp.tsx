import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GuildList } from '../components/layout/GuildList';
import { Sidebar } from '../components/layout/Sidebar';
import { DMList } from '../components/layout/DMList';
import { MemberList } from '../components/layout/MemberList';
import { MessageList } from '../components/chat/MessageList';
import { MessageInput } from '../components/chat/MessageInput';
import { CreateGuildModal } from '../components/modals/CreateGuildModal';
import { useAuthStore } from '../store/authStore';
import { useGuildStore } from '../store/guildStore';
import { useMessageStore } from '../store/messageStore';
import { useDMStore } from '../store/dmStore';
import { socketManager } from '../lib/socket';
import { Hash, Users } from 'lucide-react';
import toast from 'react-hot-toast';

type ViewMode = 'guilds' | 'dms';

export const UnifiedApp: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('guilds');
  const [currentChannelId, setCurrentChannelId] = useState<string | null>(null);
  const [currentDMChannelId, setCurrentDMChannelId] = useState<string | null>(null);
  const [showCreateGuild, setShowCreateGuild] = useState(false);

  const { user, isAuthenticated } = useAuthStore();
  const { guilds, currentGuild, channels, fetchGuilds, selectGuild } = useGuildStore();
  const {
    loadMessages,
    handleNewMessage,
    handleMessageUpdate,
    handleMessageDelete,
    handleTypingStart,
    handleTypingStop,
    setCurrentChannel,
  } = useMessageStore();

  const {
    dmChannels,
    currentDMChannel,
    fetchDMChannels,
    selectDMChannel,
    handleNewDMMessage,
    handleDMMessageUpdate,
    handleDMMessageDelete,
    handleDMTypingStart,
    handleDMTypingStop,
  } = useDMStore();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Fetch initial data
    fetchGuilds();
    fetchDMChannels();

    // Set up WebSocket listeners for guild messages
    socketManager.on('message.create', handleNewMessage);
    socketManager.on('message.update', handleMessageUpdate);
    socketManager.on('message.delete', handleMessageDelete);
    socketManager.on('typing.start', handleTypingStart);
    socketManager.on('typing.stop', handleTypingStop);

    // Set up WebSocket listeners for DM messages
    socketManager.on('dm.message.create', handleNewDMMessage);
    socketManager.on('dm.message.update', handleDMMessageUpdate);
    socketManager.on('dm.message.delete', handleDMMessageDelete);
    socketManager.on('dm.typing.start', handleDMTypingStart);
    socketManager.on('dm.typing.stop', handleDMTypingStop);

    // Friend request notifications
    socketManager.on('friend.request', (data: any) => {
      toast(`${data.username} sent you a friend request`, {
        icon: '👋',
        duration: 5000,
      });
    });

    socketManager.on('friend.accepted', (data: any) => {
      toast.success(`${data.username} accepted your friend request`);
    });

    return () => {
      socketManager.off('message.create', handleNewMessage);
      socketManager.off('message.update', handleMessageUpdate);
      socketManager.off('message.delete', handleMessageDelete);
      socketManager.off('typing.start', handleTypingStart);
      socketManager.off('typing.stop', handleTypingStop);
      socketManager.off('dm.message.create', handleNewDMMessage);
      socketManager.off('dm.message.update', handleDMMessageUpdate);
      socketManager.off('dm.message.delete', handleDMMessageDelete);
      socketManager.off('dm.typing.start', handleDMTypingStart);
      socketManager.off('dm.typing.stop', handleDMTypingStop);
    };
  }, [isAuthenticated]);

  const handleGuildSelect = async (guildId: string) => {
    setViewMode('guilds');
    setCurrentDMChannelId(null);
    await selectGuild(guildId);
  };

  const handleChannelSelect = async (channelId: string) => {
    setCurrentChannelId(channelId);
    setCurrentChannel(channelId);
    await loadMessages(channelId);
  };

  const handleDMSelect = (dmChannelId: string) => {
    setViewMode('dms');
    setCurrentChannelId(null);
    setCurrentDMChannelId(dmChannelId);
    selectDMChannel(dmChannelId);
  };

  const handleDMsClick = () => {
    setViewMode('dms');
    setCurrentChannelId(null);
    setCurrentDMChannelId(null);
  };

  const currentChannel = channels.find((c) => c.id === currentChannelId);

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/5 via-blue-900/5 to-purple-900/5 pointer-events-none" />

      {/* Guild List with DM Button */}
      <div className="flex flex-col">
        <button
          onClick={handleDMsClick}
          className={`w-12 h-12 m-2 rounded-xl flex items-center justify-center transition-all ${
            viewMode === 'dms'
              ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
          }`}
          title="Direct Messages"
        >
          <Users className="w-6 h-6" />
        </button>

        <GuildList
          currentGuildId={currentGuild?.id}
          onGuildSelect={handleGuildSelect}
          onCreateGuild={() => setShowCreateGuild(true)}
        />
      </div>

      {/* Sidebar - Show DM list or Channel list */}
      {viewMode === 'dms' ? (
        <DMList currentDMChannelId={currentDMChannelId || undefined} onDMSelect={handleDMSelect} />
      ) : currentGuild ? (
        <Sidebar currentChannelId={currentChannelId || undefined} onChannelSelect={handleChannelSelect} />
      ) : null}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative">
        {viewMode === 'guilds' && currentChannel ? (
          <>
            {/* Channel Header */}
            <div className="h-12 px-4 flex items-center justify-between border-b border-white/5 glass-effect backdrop-blur-sm shadow-sm">
              <div className="flex items-center flex-1 min-w-0">
                <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mr-2 animate-glow">
                  <Hash className="h-4 w-4 text-white" />
                </div>
                <h3 className="font-bold text-white">{currentChannel.name}</h3>
                {currentChannel.topic && (
                  <>
                    <div className="mx-3 w-px h-4 bg-white/10" />
                    <p className="text-sm text-gray-400 truncate">{currentChannel.topic}</p>
                  </>
                )}
              </div>
            </div>
            <MessageList channelId={currentChannel.id} />
            <MessageInput channelId={currentChannel.id} />
          </>
        ) : viewMode === 'dms' && currentDMChannel ? (
          <>
            {/* DM Header */}
            <div className="h-12 px-4 flex items-center justify-between border-b border-white/5 glass-effect backdrop-blur-sm shadow-sm">
              <div className="flex items-center flex-1 min-w-0">
                <Users className="h-5 w-5 text-purple-400 mr-2" />
                <h3 className="font-bold text-white">
                  {currentDMChannel.type === 'group_dm'
                    ? currentDMChannel.name || 'Group DM'
                    : currentDMChannel.participants.find((p) => p.user_id !== user?.id)?.username || 'DM'}
                </h3>
              </div>
            </div>
            <MessageList channelId={currentDMChannel.id} isDM />
            <MessageInput channelId={currentDMChannel.id} isDM />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center animate-fade-in">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-float">
                {viewMode === 'dms' ? (
                  <Users className="w-10 h-10 text-purple-400" />
                ) : (
                  <Hash className="w-10 h-10 text-purple-400" />
                )}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {viewMode === 'dms' ? 'No DM Selected' : 'No Channel Selected'}
              </h3>
              <p className="text-gray-400">
                {viewMode === 'dms'
                  ? 'Select a conversation to start chatting'
                  : 'Select a channel to start chatting'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Member List (only for guilds) */}
      {viewMode === 'guilds' && currentGuild && (
        <MemberList members={[]} ownerId={currentGuild.owner_id} />
      )}

      {/* Empty State */}
      {!currentGuild && guilds.length === 0 && viewMode === 'guilds' && (
        <div className="flex-1 flex items-center justify-center relative">
          <div className="absolute top-20 left-20 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl animate-float" />
          <div
            className="absolute bottom-20 right-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl animate-float"
            style={{ animationDelay: '1s' }}
          />

          <div className="text-center relative z-10 animate-scale-in">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-glow shadow-2xl">
              <Hash className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold gradient-text mb-3">Welcome to Unity Platform!</h2>
            <p className="text-gray-400 mb-6 text-lg">Create or join a server to get started</p>
            <button
              onClick={() => setShowCreateGuild(true)}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all hover-lift shadow-lg"
            >
              Create Your First Server
            </button>
          </div>
        </div>
      )}

      {/* Create Guild Modal */}
      <CreateGuildModal isOpen={showCreateGuild} onClose={() => setShowCreateGuild(false)} />
    </div>
  );
};
