import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { GuildList } from '../components/layout/GuildList';
import { Sidebar } from '../components/layout/Sidebar';
import { DMList } from '../components/layout/DMList';
import { MemberList } from '../components/layout/MemberList';
import { MessageList } from '../components/chat/MessageList';
import { MessageInput } from '../components/chat/MessageInput';
import { CreateGuildModal } from '../components/modals/CreateGuildModal';
import { UserSettingsModal } from '../components/modals/UserSettingsModal';
import { FriendsPage } from './FriendsPage';
import UserProfile from '../components/UserProfile';
import { VoiceChat } from '../components/VoiceChat';
import { useAuthStore } from '../store/authStore';
import { useGuildStore } from '../store/guildStore';
import { useMessageStore } from '../store/messageStore';
import { useDMStore } from '../store/dmStore';
import { socketManager } from '../lib/socket';
import { Hash, Users, Settings, User } from 'lucide-react';
import toast from 'react-hot-toast';

export const MainApp: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentChannelId, setCurrentChannelId] = useState<string | null>(null);
  const [currentDMChannelId, setCurrentDMChannelId] = useState<string | null>(null);
  const [showCreateGuild, setShowCreateGuild] = useState(false);
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  const [selectedVoiceChannelId, setSelectedVoiceChannelId] = useState<string | null>(null);

  const { user, isAuthenticated } = useAuthStore();
  const { guilds, currentGuild, channels, fetchGuilds, selectGuild } = useGuildStore();
  const { 
    loadMessages, 
    handleNewMessage, 
    handleMessageUpdate, 
    handleMessageDelete, 
    handleTypingStart, 
    handleTypingStop,
    setCurrentChannel 
  } = useMessageStore();
  const {
    currentDMChannel,
    fetchDMChannels,
    selectDMChannel,
    handleNewDMMessage,
    handleDMMessageUpdate,
    handleDMMessageDelete,
  } = useDMStore();

  const isOnFriendsPage = location.pathname.includes('/friends');
  const isOnDMsPage = location.pathname.includes('/dms');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    fetchGuilds();
    fetchDMChannels();

    // Set up WebSocket listeners
    socketManager.on('message.create', handleNewMessage);
    socketManager.on('message.update', handleMessageUpdate);
    socketManager.on('message.delete', handleMessageDelete);
    socketManager.on('typing.start', handleTypingStart);
    socketManager.on('typing.stop', handleTypingStop);
    socketManager.on('dm.message.create', handleNewDMMessage);
    socketManager.on('dm.message.update', handleDMMessageUpdate);
    socketManager.on('dm.message.delete', handleDMMessageDelete);

    // Friend notifications
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
    };
  }, [isAuthenticated]);

  const handleGuildSelect = async (guildId: string) => {
    await selectGuild(guildId);
    navigate('/app');
  };

  const handleChannelSelect = async (channelId: string) => {
    setCurrentChannelId(channelId);
    setCurrentChannel(channelId);
    await loadMessages(channelId);
  };

  const handleDMSelect = (dmChannelId: string) => {
    setCurrentDMChannelId(dmChannelId);
    selectDMChannel(dmChannelId);
    navigate(`/app/dms/${dmChannelId}`);
  };

  const handleVoiceChannelJoin = (channelId: string) => {
    setSelectedVoiceChannelId(channelId);
    setShowVoiceChat(true);
  };

  const currentChannel = channels.find((c) => c.id === currentChannelId);

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/5 via-blue-900/5 to-purple-900/5 pointer-events-none" />
      
      {/* Left Navigation */}
      <div className="flex flex-col w-[72px] bg-[#1e1f22]">
        {/* Friends/DM Button */}
        <button
          onClick={() => navigate('/app/friends')}
          className={`w-12 h-12 m-2 rounded-xl flex items-center justify-center transition-all ${
            isOnFriendsPage || isOnDMsPage
              ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
          }`}
          title="Friends & DMs"
        >
          <Users className="w-6 h-6" />
        </button>

        <div className="h-px bg-white/10 mx-2 mb-2" />

        {/* Guild List */}
        <GuildList
          currentGuildId={currentGuild?.id}
          onGuildSelect={handleGuildSelect}
          onCreateGuild={() => setShowCreateGuild(true)}
        />

        {/* Bottom Actions */}
        <div className="mt-auto p-2 space-y-2">
          <button
            onClick={() => setShowUserProfile(true)}
            className="w-12 h-12 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all flex items-center justify-center"
            title="My Profile"
          >
            <User className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowUserSettings(true)}
            className="w-12 h-12 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all flex items-center justify-center"
            title="User Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      <Routes>
        <Route path="/friends" element={<><DMList currentDMChannelId={currentDMChannelId || undefined} onDMSelect={handleDMSelect} /><FriendsPage /></>} />
        
        <Route path="/dms/:dmId" element={
          <>
            <DMList currentDMChannelId={currentDMChannelId || undefined} onDMSelect={handleDMSelect} />
            <div className="flex-1 flex flex-col relative">
              {currentDMChannel ? (
                <>
                  <div className="h-12 px-4 flex items-center justify-between border-b border-white/5 glass-effect backdrop-blur-sm shadow-sm">
                    <div className="flex items-center flex-1 min-w-0">
                      <Users className="h-5 w-5 text-purple-400 mr-2" />
                      <h3 className="font-bold text-white">
                        {currentDMChannel.type === 'group_dm'
                          ? currentDMChannel.name || 'Group DM'
                          : currentDMChannel.participants?.find((p: any) => p.user_id !== user?.id)?.username || 'DM'}
                      </h3>
                    </div>
                  </div>
                  <MessageList channelId={currentDMChannel.id} isDM />
                  <MessageInput channelId={currentDMChannel.id} isDM />
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center animate-fade-in">
                    <Users className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Select a DM</h3>
                    <p className="text-gray-400">Choose a conversation to start chatting</p>
                  </div>
                </div>
              )}
            </div>
          </>
        } />

        <Route path="/" element={
          <>
            {currentGuild ? (
              <>
                <Sidebar 
                  currentChannelId={currentChannelId || undefined} 
                  onChannelSelect={handleChannelSelect}
                  onVoiceChannelJoin={handleVoiceChannelJoin}
                />

                <div className="flex-1 flex flex-col relative">
                  {currentChannel ? (
                    <>
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
            ) : guilds.length === 0 ? (
              <div className="flex-1 flex items-center justify-center relative">
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
            ) : null}
          </>
        } />
      </Routes>

      {/* Modals */}
      <CreateGuildModal isOpen={showCreateGuild} onClose={() => setShowCreateGuild(false)} />
      <UserSettingsModal isOpen={showUserSettings} onClose={() => setShowUserSettings(false)} />
      
      {user && (
        <UserProfile
          isOpen={showUserProfile}
          onClose={() => setShowUserProfile(false)}
          user={{
            id: user.id,
            username: user.username,
            discriminator: '0001',
            avatar: user.avatar_url,
            status: user.status as any,
            customStatus: user.status_text,
            createdAt: (user as any).created_at || new Date().toISOString(),
            bio: '',
            level: 5,
            xp: 250,
          }}
        />
      )}

      {/* Voice Chat */}
      {showVoiceChat && selectedVoiceChannelId && (
        <VoiceChat
          channelId={selectedVoiceChannelId}
          onLeave={() => {
            setShowVoiceChat(false);
            setSelectedVoiceChannelId(null);
          }}
        />
      )}
    </div>
  );
};
