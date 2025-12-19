import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { GuildList } from '../components/layout/GuildList';
import { Sidebar } from '../components/layout/Sidebar';
import { DMList } from '../components/layout/DMList';
import { MemberList } from '../components/layout/MemberList';
import { MessageList } from '../components/chat/MessageList';
import { MessageInput } from '../components/chat/MessageInput';
import { DMHeader } from '../components/chat/DMHeader';
import { CreateGuildModal } from '../components/modals/CreateGuildModal';
import { UserSettingsModal } from '../components/modals/UserSettingsModal';
import { FriendsPage } from './FriendsPage';
import UserProfile from '../components/UserProfile';
import { UserProfileModal } from '../components/UserProfileModal';
import { ServerSettings } from '../components/ServerSettings/ServerSettings';
import { InviteModal } from '../components/modals/InviteModal';
import { ProfileEditor } from '../components/ProfileEditor/ProfileEditor';
import { ServerDropdown } from '../components/ServerMenu/ServerDropdown';
import { CreateChannelModal } from '../components/modals/CreateChannelModal';
import { CreateCategoryModal } from '../components/modals/CreateCategoryModal';
import { VoicePanelAdvanced } from '../components/VoiceChat/VoicePanelAdvanced';
import { VoiceChannelView } from '../components/VoiceChat/VoiceChannelView';
import { useVoiceChat } from '../components/VoiceChat/VoiceChatProvider';
import { useAuthStore } from '../store/authStore';
import { useGuildStore } from '../store/guildStore';
import { useMessageStore } from '../store/messageStore';
import { useDMStore } from '../store/dmStore';
import { useFriendsStore } from '../store/friendsStore';
import { socketManager } from '../lib/socket';
import { guildAPI } from '../lib/api';
import { Hash, Users, Settings, User, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMobileDetection } from '../hooks/useMobileDetection';
import MobileHeader from '../components/mobile/MobileHeader';
import MobileSidebar from '../components/mobile/MobileSidebar';
import { DefaultWelcome } from '../components/DefaultWelcome';
import AdComponent from '../components/ads/AdComponent';

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
  const [showServerSettings, setShowServerSettings] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Mobile State
  const { isMobile } = useMobileDetection();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMembersOpen, setMobileMembersOpen] = useState(false);

  const { user, isAuthenticated } = useAuthStore();
  const { guilds, currentGuild, channels, fetchGuilds, selectGuild } = useGuildStore();
  const { joinChannel: joinVoiceChannel, leaveChannel: leaveVoiceChannel } = useVoiceChat();
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
    dmChannels,
    currentDMChannel,
    fetchDMChannels,
    selectDMChannel,
    handleNewDMMessage,
    handleDMMessageUpdate,
    handleDMMessageDelete,
  } = useDMStore();

  const isOnFriendsPage = location.pathname.includes('/friends');
  const isOnDMsPage = location.pathname.includes('/dms');

  // Sync DM channel from URL
  useEffect(() => {
    const match = location.pathname.match(/\/app\/dms\/(.+)/);
    if (match && dmChannels.length > 0) {
      const dmId = match[1];
      if (dmId && dmId !== currentDMChannelId) {
        setCurrentDMChannelId(dmId);
        selectDMChannel(dmId);
      }
    }
  }, [location.pathname, dmChannels]);

  // Fetch members when guild changes
  const fetchMembers = async () => {
    if (currentGuild?.id) {
      try {
        const res = await guildAPI.getMembers(currentGuild.id);
        setMembers(res.data);
      } catch (err) {
        console.error('Failed to fetch members:', err);
      }
    } else {
      setMembers([]);
    }
  };

  useEffect(() => {
    fetchMembers();

    // Also refresh members every 30 seconds to catch any missed presence updates
    const interval = setInterval(fetchMembers, 30000);
    return () => clearInterval(interval);
  }, [currentGuild?.id]);

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
      // Refresh pending requests immediately
      useFriendsStore.getState().fetchPendingRequests();
    });

    socketManager.on('friend.accepted', (data: any) => {
      toast.success(`${data.username || 'Friend'} accepted your friend request`);
      // Refresh friends and requests lists immediately
      const friendsStore = useFriendsStore.getState();
      friendsStore.fetchFriends();
      friendsStore.fetchSentRequests();
      useFriendsStore.getState().fetchPendingRequests();
    });

    // Presence updates - update member status in real-time
    const handlePresenceUpdate = (data: { user_id: string; status: string; username?: string }) => {
      console.log('Presence update received:', data);
      setMembers(prev => {
        // Check if user exists in members list
        const userExists = prev.some(m => m.id === data.user_id);
        if (userExists) {
          return prev.map(member =>
            member.id === data.user_id
              ? { ...member, status: data.status }
              : member
          );
        }
        return prev;
      });
    };
    socketManager.on('presence.update', handlePresenceUpdate);

    return () => {
      socketManager.off('message.create', handleNewMessage);
      socketManager.off('message.update', handleMessageUpdate);
      socketManager.off('message.delete', handleMessageDelete);
      socketManager.off('typing.start', handleTypingStart);
      socketManager.off('typing.stop', handleTypingStop);
      socketManager.off('dm.message.create', handleNewDMMessage);
      socketManager.off('dm.message.update', handleDMMessageUpdate);
      socketManager.off('dm.message.delete', handleDMMessageDelete);
      socketManager.off('presence.update', handlePresenceUpdate);
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

  const handleVoiceChannelJoin = async (channelId: string) => {
    const channel = channels.find(c => c.id === channelId);
    if (!channel) return;

    // Set current channel to the voice channel so view switches to it
    setCurrentChannelId(channelId);

    try {
      await joinVoiceChannel(channelId, channel.name);
      setSelectedVoiceChannelId(channelId);
      setShowVoiceChat(true);
    } catch (error) {
      console.error('Failed to join voice channel:', error);
    }
  };

  const currentChannel = channels.find((c) => c.id === currentChannelId);

  return (
    <div className="h-screen flex overflow-hidden bg-mot-black">
      {/* Ambient Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-mot-gold/3 rounded-full blur-[200px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-mot-gold/2 rounded-full blur-[150px]" />
      </div>

      {/* Left Navigation - Unified Sidebar - HIDDEN ON MOBILE */}
      <div className="hidden md:flex flex-col w-[80px] bg-mot-surface py-3 items-center gap-2 overflow-y-auto custom-scrollbar">
        {/* MOT Logo */}
        <button
          onClick={() => navigate('/app/friends')}
          className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all hover:scale-105"
          title="Friends & DMs"
        >
          <img
            src="/MOT.gif"
            alt="MOT"
            className={`w-16 h-16 rounded-xl transition-all ${isOnFriendsPage || isOnDMsPage
              ? 'drop-shadow-[0_0_12px_rgba(245,166,35,0.6)]'
              : 'opacity-90 hover:opacity-100 hover:drop-shadow-[0_0_8px_rgba(245,166,35,0.4)]'
              }`}
          />
        </button>

        <div className="w-8 h-0.5 bg-mot-border rounded-full" />

        {/* Guild List - Inline */}
        <div className="flex-1 flex flex-col items-center gap-2 overflow-y-auto custom-scrollbar">
          {/* Guilds will be rendered here */}
          <GuildList
            currentGuildId={currentGuild?.id}
            onGuildSelect={handleGuildSelect}
            onCreateGuild={() => setShowCreateGuild(true)}
          />
        </div>

        <div className="w-8 h-0.5 bg-mot-border rounded-full" />

        {/* Bottom Actions */}
        <button
          onClick={() => setShowProfileEditor(true)}
          className="w-12 h-12 rounded-2xl bg-mot-surface-subtle hover:bg-mot-gold text-gray-400 hover:text-mot-black transition-all flex items-center justify-center hover:rounded-xl"
          title="Edit Profile"
          data-profile-editor-trigger
        >
          <User className="w-5 h-5" />
        </button>
        <button
          onClick={() => setShowUserSettings(true)}
          className="w-12 h-12 rounded-2xl bg-mot-surface-subtle hover:bg-mot-gold text-gray-400 hover:text-mot-black transition-all flex items-center justify-center hover:rounded-xl"
          title="User Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      <Routes>
        <Route path="/friends" element={<><DMList className="hidden md:flex" channels={dmChannels as any} currentDMChannelId={currentDMChannelId || undefined} onDMSelect={handleDMSelect} /><FriendsPage /></>} />

        <Route path="/dms/:dmId" element={
          <>
            <DMList className="hidden md:flex" channels={dmChannels as any} currentDMChannelId={currentDMChannelId || undefined} onDMSelect={handleDMSelect} />
            <div className="flex-1 flex flex-col relative w-full">
              {currentDMChannel ? (
                <>
                  <DMHeader channel={currentDMChannel as any} />
                  <MessageList channelId={currentDMChannel.id} isDM />
                  <MessageInput channelId={currentDMChannel.id} isDM />
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center animate-fade-in">
                    <Users className="w-16 h-16 text-mot-gold mx-auto mb-4" />
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
                {/* Desktop Sidebar - HIDDEN ON MOBILE */}
                <div className="hidden md:flex flex-col w-60 bg-neutral-850">
                  {/* Server Dropdown Menu */}
                  <ServerDropdown
                    onOpenServerSettings={() => setShowServerSettings(true)}
                    onOpenInvite={() => setShowInviteModal(true)}
                    onCreateChannel={() => setShowCreateChannel(true)}
                    onCreateCategory={() => setShowCreateCategory(true)}
                  />

                  <Sidebar
                    currentChannelId={currentChannelId || undefined}
                    onChannelSelect={handleChannelSelect}
                    onVoiceChannelJoin={handleVoiceChannelJoin}
                    onOpenServerSettings={() => setShowServerSettings(true)}
                    onOpenInvite={() => setShowInviteModal(true)}
                    onCreateChannel={() => setShowCreateChannel(true)}
                  />

                  {/* Voice Panel */}
                  {showVoiceChat && selectedVoiceChannelId && (
                    <VoicePanelAdvanced
                      channelName={channels.find(c => c.id === selectedVoiceChannelId)?.name || 'Voice Channel'}
                      onLeave={async () => {
                        await leaveVoiceChannel();
                        setShowVoiceChat(false);
                        setSelectedVoiceChannelId(null);
                      }}
                    />
                  )}
                </div>

                {/* Mobile Sidebar & Header */}
                <MobileSidebar
                  isOpen={mobileMenuOpen}
                  onClose={() => setMobileMenuOpen(false)}
                  channels={channels}
                  currentChannel={currentChannelId || undefined}
                  onChannelClick={handleChannelSelect}
                  currentGuildId={currentGuild.id}
                  onGuildSelect={handleGuildSelect}
                  onCreateGuild={() => setShowCreateGuild(true)}
                />

                <div className="flex-1 flex flex-col relative w-full pb-20 md:pb-0">
                  {/* Mobile Header */}
                  {isMobile && (
                    <MobileHeader
                      title={currentChannel?.name || 'Channel'}
                      subtitle={currentChannel?.topic}
                      onMenuClick={() => setMobileMenuOpen(true)}
                      onMembersClick={() => setMobileMembersOpen(true)}
                    />
                  )}

                  {/* Show Voice Channel View when connected to voice AND viewing voice channel */}
                  {showVoiceChat && selectedVoiceChannelId && currentChannelId === selectedVoiceChannelId ? (
                    <VoiceChannelView
                      channelId={selectedVoiceChannelId}
                      channelName={channels.find(c => c.id === selectedVoiceChannelId)?.name || 'Voice Channel'}
                      connectedUsers={[]}
                      onJoinVoice={() => handleVoiceChannelJoin(selectedVoiceChannelId)}
                      onLeave={async () => {
                        await leaveVoiceChannel();
                        setShowVoiceChat(false);
                        setSelectedVoiceChannelId(null);
                      }}
                    />
                  ) : currentChannel ? (
                    <>
                      {/* Desktop Channel Header - HIDDEN ON MOBILE */}
                      <div className="hidden md:flex h-12 px-4 items-center justify-between border-b border-mot-border bg-mot-surface shadow-sm">
                        <div className="flex items-center flex-1 min-w-0">
                          <div className="w-6 h-6 rounded bg-mot-gold/20 flex items-center justify-center mr-2">
                            <Hash className="h-4 w-4 text-mot-gold" />
                          </div>
                          <h3 className="font-bold text-white">{currentChannel?.name || 'Channel'}</h3>
                          {currentChannel?.topic && (
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
                        <div className="w-20 h-20 bg-mot-gold/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-float">
                          <Hash className="w-10 h-10 text-mot-gold" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No Channel Selected</h3>
                        <p className="text-gray-400">Select a channel to start chatting</p>
                      </div>
                    </div>
                  )}
                </div>

                <MemberList
                  className="hidden lg:block"
                  members={members}
                  ownerId={currentGuild.owner_id}
                  guildId={currentGuild.id}
                  onMemberClick={(member) => setSelectedMemberId(member.id)}
                  onMemberAction={fetchMembers}
                />

                {/* Mobile Member List Drawer */}
                {isMobile && (
                  <>
                    <div
                      className={`fixed inset-0 bg-black/80 z-40 transition-opacity ${mobileMembersOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                      onClick={() => setMobileMembersOpen(false)}
                    />
                    <div className={`fixed inset-y-0 right-0 z-50 transform transition-transform duration-300 ${mobileMembersOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                      <div className="h-full flex flex-col">
                        <div className="bg-mot-surface border-b border-mot-border p-4 flex justify-between items-center">
                          <h3 className="font-bold text-white">Members</h3>
                          <button onClick={() => setMobileMembersOpen(false)}>
                            <X className="w-5 h-5 text-gray-400" />
                          </button>
                        </div>
                        <MemberList
                          className="w-[280px] h-full"
                          members={members}
                          ownerId={currentGuild.owner_id}
                          guildId={currentGuild.id}
                          onMemberClick={(member) => {
                            setSelectedMemberId(member.id);
                            setMobileMembersOpen(false);
                          }}
                          onMemberAction={fetchMembers}
                        />
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : guilds.length === 0 ? (
              <div className="flex-1 flex items-center justify-center relative">
                {/* Empty State Content */}
                <div className="absolute top-20 left-20 w-64 h-64 bg-mot-gold/5 rounded-full blur-3xl animate-float" />
                <div className="absolute bottom-20 right-20 w-80 h-80 bg-mot-gold/3 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />

                <div className="text-center relative z-10 animate-scale-in">
                  <div className="mx-auto mb-6">
                    <img src="/MOT.gif" alt="MOT" className="w-20 h-20 mx-auto" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-3">Welcome to <span className="text-mot-gold">MOT</span>!</h2>
                  <p className="text-gray-400 mb-6 text-lg">Create or join a server to get started</p>
                  <button
                    onClick={() => setShowCreateGuild(true)}
                    className="px-8 py-3 bg-gradient-to-b from-mot-gold-light via-mot-gold to-mot-gold-deep text-mot-black font-bold rounded-xl transition-all hover:scale-105 shadow-gold-glow"
                  >
                    Create Your First Server
                  </button>
                </div>
              </div>
            ) : (
              <DefaultWelcome />
            )}
          </>
        } />
      </Routes>


      {/* Modals */}
      <CreateGuildModal isOpen={showCreateGuild} onClose={() => setShowCreateGuild(false)} />
      <UserSettingsModal isOpen={showUserSettings} onClose={() => setShowUserSettings(false)} />
      {currentGuild && (
        <>
          <ServerSettings
            isOpen={showServerSettings}
            onClose={() => setShowServerSettings(false)}
            guildId={currentGuild.id}
          />
          <InviteModal
            isOpen={showInviteModal}
            onClose={() => setShowInviteModal(false)}
            guildId={currentGuild.id}
            guildName={currentGuild.name}
          />
        </>
      )}
      <ProfileEditor isOpen={showProfileEditor} onClose={() => setShowProfileEditor(false)} />
      <CreateChannelModal isOpen={showCreateChannel} onClose={() => setShowCreateChannel(false)} />
      <CreateCategoryModal isOpen={showCreateCategory} onClose={() => setShowCreateCategory(false)} />

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

      {/* User Profile Modal - opens when clicking on a member */}
      {selectedMemberId && (
        <UserProfileModal
          userId={selectedMemberId}
          onClose={() => setSelectedMemberId(null)}
          guildId={currentGuild?.id}
        />
      )}

      {/* Mobile Ad - Fixed at bottom */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-mot-surface border-t border-mot-border p-2 safe-area-inset-bottom">
          <AdComponent
            adFormat="horizontal"
            className="w-full max-w-lg mx-auto"
            fallbackContent={
              <div className="bg-mot-surface/50 rounded-lg p-2 text-center border border-mot-border/50">
                <p className="text-xs text-gray-500">Support the platform</p>
                <p className="text-[10px] text-gray-600">Ad space available</p>
              </div>
            }
          />
        </div>
      )}

    </div>
  );
};
