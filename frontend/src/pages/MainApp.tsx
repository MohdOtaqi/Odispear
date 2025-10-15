import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GuildList } from '../components/layout/GuildList';
import { Sidebar } from '../components/layout/Sidebar';
import { MemberList } from '../components/layout/MemberList';
import { MessageList } from '../components/chat/MessageList';
import { MessageInput } from '../components/chat/MessageInput';
import { CreateGuildModal } from '../components/modals/CreateGuildModal';
import { useAuthStore } from '../store/authStore';
import { useGuildStore } from '../store/guildStore';
import { useMessageStore } from '../store/messageStore';
import { socketManager } from '../lib/socket';
import { Hash } from 'lucide-react';

export const MainApp: React.FC = () => {
  const navigate = useNavigate();
  const [currentChannelId, setCurrentChannelId] = useState<string | null>(null);
  const [showCreateGuild, setShowCreateGuild] = useState(false);

  const { user, isAuthenticated } = useAuthStore();
  const { guilds, currentGuild, channels, fetchGuilds, selectGuild } = useGuildStore();
  const { loadMessages, handleNewMessage, handleMessageUpdate, handleMessageDelete, handleTypingStart, handleTypingStop } = useMessageStore();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    fetchGuilds();

    // Set up WebSocket listeners
    socketManager.on('message.create', handleNewMessage);
    socketManager.on('message.update', handleMessageUpdate);
    socketManager.on('message.delete', handleMessageDelete);
    socketManager.on('typing.start', handleTypingStart);
    socketManager.on('typing.stop', handleTypingStop);

    return () => {
      socketManager.off('message.create', handleNewMessage);
      socketManager.off('message.update', handleMessageUpdate);
      socketManager.off('message.delete', handleMessageDelete);
      socketManager.off('typing.start', handleTypingStart);
      socketManager.off('typing.stop', handleTypingStop);
    };
  }, [isAuthenticated]);

  const handleGuildSelect = async (guildId: string) => {
    await selectGuild(guildId);
  };

  const handleChannelSelect = async (channelId: string) => {
    setCurrentChannelId(channelId);
    await loadMessages(channelId);
  };

  const currentChannel = channels.find((c) => c.id === currentChannelId);

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/5 via-blue-900/5 to-purple-900/5 pointer-events-none" />
      
      <GuildList
        currentGuildId={currentGuild?.id}
        onGuildSelect={handleGuildSelect}
        onCreateGuild={() => setShowCreateGuild(true)}
      />

      {currentGuild && (
        <>
          <Sidebar
            currentChannelId={currentChannelId || undefined}
            onChannelSelect={handleChannelSelect}
          />

          <div className="flex-1 flex flex-col relative">
            {currentChannel ? (
              <>
                {/* Enhanced Channel Header */}
                <div className="h-12 px-4 flex items-center justify-between border-b border-white/5 glass-effect backdrop-blur-sm shadow-sm">
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mr-2 animate-glow">
                      <Hash className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="font-bold text-white">{currentChannel.name}</h3>
                    {currentChannel.topic && (
                      <>
                        <div className="mx-3 w-px h-4 bg-white/10" />
                        <p className="text-sm text-gray-400 truncate">
                          {currentChannel.topic}
                        </p>
                      </>
                    )}
                  </div>
                </div>
                <MessageList channelId={currentChannel.id} />
                <MessageInput channelId={currentChannel.id} />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center animate-fade-in">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-float">
                    <Hash className="w-10 h-10 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">No Channel Selected</h3>
                  <p className="text-gray-400">Select a channel to start chatting</p>
                </div>
              </div>
            )}
          </div>

          <MemberList members={[]} ownerId={currentGuild.owner_id} />
        </>
      )}

      {!currentGuild && guilds.length === 0 && (
        <div className="flex-1 flex items-center justify-center relative">
          {/* Floating Orbs */}
          <div className="absolute top-20 left-20 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
          
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
      <CreateGuildModal
        isOpen={showCreateGuild}
        onClose={() => setShowCreateGuild(false)}
      />
    </div>
  );
};
