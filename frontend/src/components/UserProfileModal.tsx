import React, { useState, useEffect } from 'react';
import { X, Mail, Phone, Calendar, MapPin, Link, Github, Twitter, Twitch, Youtube, Instagram, Globe, Shield, Crown, Zap, Star, Hash, AtSign, Copy, UserPlus, Ban, VolumeX, UserX, Flag, Settings, Gamepad, Music, Code, Book, Heart, Send, Users, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useGuildStore } from '../store/guildStore';
import { useDMStore } from '../store/dmStore';

interface UserProfile {
  id: string;
  username: string;
  discriminator: string;
  displayName: string;
  email?: string;
  avatar: string;
  banner?: string;
  bio?: string;
  pronouns?: string;
  status: 'online' | 'idle' | 'dnd' | 'invisible';
  customStatus?: string;
  activities: Activity[];
  createdAt: Date;
  joinedAt?: Date;
  roles: Role[];
  badges: Badge[];
  connections: Connection[];
  mutualGuilds: Guild[];
  mutualFriends: User[];
  note?: string;
  isBot: boolean;
  isPremium: boolean;
  premiumSince?: Date;
  accentColor?: string;
}

interface Activity {
  type: 'playing' | 'streaming' | 'listening' | 'watching' | 'competing';
  name: string;
  details?: string;
  state?: string;
  timestamps?: {
    start?: Date;
    end?: Date;
  };
  assets?: {
    largeImage?: string;
    largeText?: string;
    smallImage?: string;
    smallText?: string;
  };
}

interface Role {
  id: string;
  name: string;
  color: string;
  icon?: string;
  position: number;
  permissions: string[];
}

interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface Connection {
  type: 'github' | 'twitter' | 'twitch' | 'youtube' | 'instagram' | 'spotify' | 'reddit';
  name: string;
  url: string;
  verified: boolean;
}

interface Guild {
  id: string;
  name: string;
  icon: string;
}

interface User {
  id: string;
  username: string;
  avatar: string;
}

interface UserProfileModalProps {
  userId: string;
  onClose: () => void;
  guildId?: string;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ userId, onClose, guildId }) => {
  const { user: currentUser } = useAuthStore();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'about' | 'activity' | 'mutual' | 'roles'>('about');
  const [loading, setLoading] = useState(true);
  const [isFriend, setIsFriend] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [userNote, setUserNote] = useState('');
  const [editingNote, setEditingNote] = useState(false);
  const [creatingDM, setCreatingDM] = useState(false);
  const [showInviteMenu, setShowInviteMenu] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);

  const { guilds, fetchGuilds } = useGuildStore();
  const { fetchDMChannels } = useDMStore();

  useEffect(() => {
    if (guilds.length === 0) {
      fetchGuilds();
    }
  }, []);

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      // Fetch user profile from correct endpoint
      const profileRes = await api.get(`/users/${userId}`);
      const userData = profileRes.data;

      // Find mutual guilds (guilds where both current user and target user are members)
      const mutualGuilds = guilds.filter((g: any) => {
        // We'll need to check if target user is in these guilds
        // For now, show the current guild if viewing from a guild context
        return guildId && g.id === guildId;
      }).map((g: any) => ({
        id: g.id,
        name: g.name,
        icon: g.icon_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(g.name)}&background=6366f1&color=fff`
      }));

      // Helper to get full image URL for uploads
      const getImageUrl = (url?: string) => {
        if (!url) return null;
        if (url.startsWith('http://') || url.startsWith('https://')) {
          return url;
        }
        const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://n0tmot.com/api' : 'http://localhost:5000');
        return `${apiUrl}${url.startsWith('/') ? url : `/${url}`}`;
      };

      // Transform backend response to match UserProfile interface
      setProfile({
        id: userData.id,
        username: userData.username,
        discriminator: userData.discriminator || '0000',
        displayName: userData.display_name || userData.username,
        avatar: getImageUrl(userData.avatar_url) || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.username)}&background=6366f1&color=fff`,
        banner: getImageUrl(userData.banner_url) || undefined,
        bio: userData.bio || '',
        status: userData.status || 'offline',
        customStatus: userData.status_text || userData.custom_status || '',
        createdAt: new Date(userData.created_at),
        activities: [],
        roles: [],
        badges: [],
        connections: [],
        mutualGuilds: mutualGuilds,
        mutualFriends: [],
        isBot: false,
        isPremium: false,
      });

      // Try to fetch friends status
      try {
        const friendRes = await api.get('/friends');
        const friendsList = friendRes.data || [];
        setIsFriend(friendsList.some((f: any) => f.id === userId || f.friend_id === userId || f.user_id === userId));

        // Get mutual friends from friends list
        // (friends that are also friends with the target user - would need server support)
      } catch (e) {
        setIsFriend(false);
      }

      setIsBlocked(false);
      setUserNote('');
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      // Show basic info if API fails - don't use fake mock data
      setProfile({
        id: userId,
        username: 'Unknown User',
        discriminator: '0000',
        displayName: 'Unknown User',
        avatar: `https://ui-avatars.com/api/?name=?&background=6366f1&color=fff`,
        bio: '',
        status: 'invisible',
        createdAt: new Date(),
        activities: [],
        roles: [],
        badges: [],
        connections: [],
        mutualGuilds: [],
        mutualFriends: [],
        isBot: false,
        isPremium: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const generateMockProfile = (): UserProfile => ({
    id: userId,
    username: 'AlexGamer',
    discriminator: '1337',
    displayName: 'Alex',
    avatar: `https://ui-avatars.com/api/?name=Alex&background=6366f1&color=fff`,
    banner: 'https://source.unsplash.com/600x200/?gaming,abstract',
    bio: '🎮 Passionate gamer | 💻 Developer | 🎨 Creative mind\n\nLove playing FPS and RPG games. Always up for a good raid!',
    pronouns: 'they/them',
    status: 'online',
    customStatus: '🎮 Playing Valorant',
    activities: [
      {
        type: 'playing',
        name: 'Valorant',
        details: 'Competitive',
        state: 'In Queue',
        timestamps: { start: new Date(Date.now() - 30 * 60000) },
        assets: {
          largeImage: 'https://cdn.discordapp.com/app-assets/valorant.png',
          largeText: 'Valorant'
        }
      }
    ],
    createdAt: new Date('2020-01-15'),
    joinedAt: new Date('2021-06-20'),
    roles: [
      { id: '1', name: 'Admin', color: '#e74c3c', position: 10, permissions: ['ADMINISTRATOR'] },
      { id: '2', name: 'Gamer', color: '#3498db', position: 5, permissions: [] },
      { id: '3', name: 'Member', color: '#95a5a6', position: 1, permissions: [] }
    ],
    badges: [
      { id: '1', name: 'Early Supporter', icon: '⭐', description: 'Supported Unity early' },
      { id: '2', name: 'Nitro', icon: '💎', description: 'Unity Nitro subscriber' },
      { id: '3', name: 'Server Booster', icon: '🚀', description: 'Boosting 2 servers' }
    ],
    connections: [
      { type: 'github', name: 'alexgamer', url: 'https://github.com/alexgamer', verified: true },
      { type: 'twitter', name: '@alexgamer', url: 'https://twitter.com/alexgamer', verified: true },
      { type: 'twitch', name: 'alexgamerttv', url: 'https://twitch.tv/alexgamerttv', verified: false }
    ],
    mutualGuilds: [
      { id: '1', name: 'Gaming Hub', icon: 'https://ui-avatars.com/api/?name=Gaming+Hub' },
      { id: '2', name: 'Dev Community', icon: 'https://ui-avatars.com/api/?name=Dev+Community' }
    ],
    mutualFriends: [
      { id: '1', username: 'Sarah', avatar: 'https://ui-avatars.com/api/?name=Sarah' },
      { id: '2', username: 'Mike', avatar: 'https://ui-avatars.com/api/?name=Mike' }
    ],
    isBot: false,
    isPremium: true,
    premiumSince: new Date('2021-01-01'),
    accentColor: '#6366f1'
  });

  const handleSendFriendRequest = async () => {
    try {
      // Send friend request using username
      await api.post('/friends/request', { username: profile?.username });
      setIsFriend(true);
      toast.success('Friend request sent!');
    } catch (error: any) {
      console.error('Failed to send friend request:', error);
      toast.error(error.response?.data?.message || 'Failed to send friend request');
    }
  };

  const handleRemoveFriend = async () => {
    try {
      await api.delete(`/friends/${userId}`);
      setIsFriend(false);
    } catch (error) {
      console.error('Failed to remove friend:', error);
    }
  };

  const handleBlock = async () => {
    try {
      await api.post(`/friends/block/${userId}`);
      setIsBlocked(true);
    } catch (error) {
      console.error('Failed to block user:', error);
    }
  };

  const handleUnblock = async () => {
    try {
      await api.post(`/friends/unblock/${userId}`);
      setIsBlocked(false);
    } catch (error) {
      console.error('Failed to unblock user:', error);
    }
  };

  const handleSaveNote = async () => {
    try {
      await api.patch(`/users/${userId}/note`, { note: userNote });
      setEditingNote(false);
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  };

  const handleSendMessage = async () => {
    if (creatingDM) return;

    try {
      setCreatingDM(true);
      toast.loading('Opening DM...', { id: 'dm-create' });

      // Call API to create or get existing DM channel
      const response = await api.post('/dm/create', { recipientId: userId });
      const dmChannel = response.data;

      toast.success('DM opened!', { id: 'dm-create' });

      // Refresh DM list, close modal and navigate to DM
      await fetchDMChannels();
      onClose();
      navigate(`/app/dms/${dmChannel.id}`);

    } catch (error: any) {
      console.error('Failed to create DM:', error);
      const errorMessage = error.response?.data?.message || 'Failed to open DM';
      toast.error(errorMessage, { id: 'dm-create' });
    } finally {
      setCreatingDM(false);
    }
  };

  const copyUsername = () => {
    navigator.clipboard.writeText(`${profile?.username}#${profile?.discriminator}`);
  };

  const handleSendServerInvite = async (guildToInvite: { id: string; name: string }) => {
    if (sendingInvite) return;

    try {
      setSendingInvite(true);
      toast.loading(`Creating invite for ${guildToInvite.name}...`, { id: 'server-invite' });

      // Create an invite for the selected server
      const inviteResponse = await api.post(`/guilds/${guildToInvite.id}/invites`, {
        maxUses: 1,
        maxAge: 86400, // 24 hours
        temporary: false
      });

      const inviteUrl = inviteResponse.data.url || `${window.location.origin}/invite/${inviteResponse.data.code}`;

      // Create or get DM channel with the user
      const dmResponse = await api.post('/dm/create', { recipientId: userId });
      const dmChannel = dmResponse.data;

      // Send the invite link as a message
      await api.post(`/channels/${dmChannel.id}/messages`, {
        content: `Hey! I'd like to invite you to join **${guildToInvite.name}**! 🎉\n\n${inviteUrl}`
      });

      toast.success(`Invite sent to ${profile?.username}!`, { id: 'server-invite' });
      setShowInviteMenu(false);

    } catch (error: any) {
      console.error('Failed to send invite:', error);
      const errorMessage = error.response?.data?.error || 'Failed to send invite';
      toast.error(errorMessage, { id: 'server-invite' });
    } finally {
      setSendingInvite(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'dnd': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'playing': return <Gamepad className="w-4 h-4" />;
      case 'streaming': return <Twitch className="w-4 h-4" />;
      case 'listening': return <Music className="w-4 h-4" />;
      case 'watching': return <Youtube className="w-4 h-4" />;
      case 'competing': return <Zap className="w-4 h-4" />;
      default: return null;
    }
  };

  const getConnectionIcon = (type: string) => {
    switch (type) {
      case 'github': return <Github className="w-4 h-4" />;
      case 'twitter': return <Twitter className="w-4 h-4" />;
      case 'twitch': return <Twitch className="w-4 h-4" />;
      case 'youtube': return <Youtube className="w-4 h-4" />;
      case 'instagram': return <Instagram className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50">
        <div className="bg-mot-surface/80 backdrop-blur-xl border border-mot-gold/20 rounded-2xl p-8 animate-pulse">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-mot-gold"></div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-mot-surface/95 backdrop-blur-xl rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in relative border border-mot-gold/20 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Banner */}
        <div className="relative h-36 overflow-hidden rounded-t-3xl">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-mot-gold via-amber-500 to-mot-gold-light" />

          {/* Decorative pattern */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)',
            backgroundSize: '20px 20px'
          }} />

          {profile.banner && (
            <img src={profile.banner} alt="" className="w-full h-full object-cover" />
          )}

          {/* Gradient overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-mot-surface/95 to-transparent" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2.5 bg-black/40 backdrop-blur-sm rounded-xl text-white hover:bg-black/60 transition-all hover:rotate-90 hover:scale-110 border border-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Header */}
        <div className="relative px-6 pb-6">
          <div className="flex items-end justify-between -mt-12">
            <div className="flex items-end gap-4">
              <div className="relative">
                <img
                  src={profile.avatar}
                  alt={profile.username}
                  className="w-24 h-24 rounded-full border-4 border-gray-900"
                  style={{ borderColor: profile.accentColor || '#6366f1' }}
                />
                <div className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 border-gray-900 ${getStatusColor(profile.status)}`} />
              </div>
              <div className="pb-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-white">{profile.displayName || profile.username}</h2>
                  {profile.badges.map(badge => (
                    <span key={badge.id} title={badge.description} className="text-lg">
                      {badge.icon}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <span>{profile.username}#{profile.discriminator}</span>
                  <button onClick={copyUsername} className="hover:text-white transition-colors">
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                {profile.pronouns && (
                  <span className="text-sm text-gray-500">{profile.pronouns}</span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {userId !== currentUser?.id && (
              <div className="flex items-center gap-2 pb-2">
                <button
                  onClick={handleSendMessage}
                  className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                  title="Send Message"
                >
                  <Mail className="w-5 h-5 text-gray-400" />
                </button>

                {/* Send Server Invite Button */}
                <div className="relative">
                  <button
                    onClick={() => setShowInviteMenu(!showInviteMenu)}
                    className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                    title="Invite to Server"
                  >
                    <Send className="w-5 h-5 text-mot-gold" />
                  </button>

                  {/* Server Selection Dropdown */}
                  {showInviteMenu && (
                    <div className="absolute top-full right-0 mt-2 w-64 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-scale-in">
                      <div className="p-3 border-b border-gray-800">
                        <h4 className="text-sm font-semibold text-white">Invite to Server</h4>
                        <p className="text-xs text-gray-400 mt-1">Select a server to invite {profile?.username} to</p>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {guilds.length > 0 ? (
                          guilds.map((guild) => (
                            <button
                              key={guild.id}
                              onClick={() => handleSendServerInvite(guild)}
                              disabled={sendingInvite}
                              className="w-full flex items-center gap-3 p-3 hover:bg-gray-800 transition-colors disabled:opacity-50"
                            >
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-mot-gold-light to-mot-gold flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {guild.icon_url ? (
                                  <img src={guild.icon_url} alt={guild.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Users className="w-5 h-5 text-white" />
                                )}
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <p className="text-sm font-medium text-white truncate">{guild.name}</p>
                                <p className="text-xs text-gray-500">Click to send invite</p>
                              </div>
                              <ChevronDown className="w-4 h-4 text-gray-500 rotate-[-90deg]" />
                            </button>
                          ))
                        ) : (
                          <div className="p-4 text-center text-gray-500 text-sm">
                            No servers available
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {!isFriend && !isBlocked && (
                  <button
                    onClick={handleSendFriendRequest}
                    className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                    title="Add Friend"
                  >
                    <UserPlus className="w-5 h-5 text-green-400" />
                  </button>
                )}
                {isFriend && (
                  <button
                    onClick={handleRemoveFriend}
                    className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                    title="Remove Friend"
                  >
                    <UserX className="w-5 h-5 text-red-400" />
                  </button>
                )}
                {!isBlocked ? (
                  <button
                    onClick={handleBlock}
                    className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                    title="Block User"
                  >
                    <Ban className="w-5 h-5 text-red-400" />
                  </button>
                ) : (
                  <button
                    onClick={handleUnblock}
                    className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                    title="Unblock User"
                  >
                    <Shield className="w-5 h-5 text-green-400" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Custom Status */}
          {profile.customStatus && (
            <div className="mt-4 px-4 py-2 bg-gray-800 rounded-lg inline-block">
              <span className="text-sm text-gray-300">{profile.customStatus}</span>
            </div>
          )}

          {/* Tabs */}
          <div className="flex items-center gap-4 mt-6 border-b border-gray-800">
            <button
              onClick={() => setActiveTab('about')}
              className={`pb-3 px-1 text-sm font-medium transition-colors ${activeTab === 'about'
                ? 'text-mot-gold border-b-2 border-mot-gold'
                : 'text-gray-400 hover:text-white'
                }`}
            >
              About Me
            </button>
            {profile.activities.length > 0 && (
              <button
                onClick={() => setActiveTab('activity')}
                className={`pb-3 px-1 text-sm font-medium transition-colors ${activeTab === 'activity'
                  ? 'text-mot-gold border-b-2 border-mot-gold'
                  : 'text-gray-400 hover:text-white'
                  }`}
              >
                Activity
              </button>
            )}
            <button
              onClick={() => setActiveTab('mutual')}
              className={`pb-3 px-1 text-sm font-medium transition-colors ${activeTab === 'mutual'
                ? 'text-mot-gold border-b-2 border-mot-gold'
                : 'text-gray-400 hover:text-white'
                }`}
            >
              Mutual
            </button>
            {guildId && profile.roles.length > 0 && (
              <button
                onClick={() => setActiveTab('roles')}
                className={`pb-3 px-1 text-sm font-medium transition-colors ${activeTab === 'roles'
                  ? 'text-mot-gold border-b-2 border-mot-gold'
                  : 'text-gray-400 hover:text-white'
                  }`}
              >
                Roles
              </button>
            )}
          </div>

          {/* Tab Content */}
          <div className="mt-6 max-h-64 overflow-y-auto custom-scrollbar">
            {activeTab === 'about' && (
              <div className="space-y-4">
                {profile.bio && (
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">About Me</h3>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{profile.bio}</p>
                  </div>
                )}

                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Member Since</h3>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span>Unity: {format(profile.createdAt, 'MMM d, yyyy')}</span>
                    </div>
                    {profile.joinedAt && guildId && (
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Hash className="w-4 h-4 text-gray-500" />
                        <span>This Server: {format(profile.joinedAt, 'MMM d, yyyy')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {profile.connections.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Connections</h3>
                    <div className="space-y-2">
                      {profile.connections.map((conn, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getConnectionIcon(conn.type)}
                            <span className="text-sm text-gray-300">{conn.name}</span>
                            {conn.verified && <Shield className="w-3 h-3 text-blue-400" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Note */}
                {userId !== currentUser?.id && (
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Note</h3>
                    {editingNote ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={userNote}
                          onChange={(e) => setUserNote(e.target.value)}
                          className="flex-1 px-3 py-1 bg-mot-surface border border-mot-border rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-mot-gold/30"
                          placeholder="Add a note..."
                        />
                        <button
                          onClick={handleSaveNote}
                          className="px-3 py-1 bg-mot-gold text-mot-black text-sm rounded font-medium hover:bg-mot-gold-light transition-colors"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingNote(true)}
                        className="text-sm text-gray-400 hover:text-gray-300"
                      >
                        {userNote || 'Click to add a note'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-3">
                {profile.activities.map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg">
                    <div className="flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{activity.name}</span>
                        <span className="text-xs text-gray-500">
                          {activity.timestamps?.start &&
                            `for ${Math.floor((Date.now() - activity.timestamps.start.getTime()) / 60000)} minutes`
                          }
                        </span>
                      </div>
                      {activity.details && (
                        <p className="text-sm text-gray-400">{activity.details}</p>
                      )}
                      {activity.state && (
                        <p className="text-sm text-gray-400">{activity.state}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'mutual' && (
              <div className="space-y-4">
                {profile.mutualGuilds.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">
                      Mutual Servers ({profile.mutualGuilds.length})
                    </h3>
                    <div className="grid grid-cols-6 gap-2">
                      {profile.mutualGuilds.map(guild => (
                        <div key={guild.id} className="text-center">
                          <img
                            src={guild.icon}
                            alt={guild.name}
                            className="w-12 h-12 rounded-lg mx-auto mb-1"
                            title={guild.name}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {profile.mutualFriends.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">
                      Mutual Friends ({profile.mutualFriends.length})
                    </h3>
                    <div className="grid grid-cols-6 gap-2">
                      {profile.mutualFriends.map(friend => (
                        <div key={friend.id} className="text-center">
                          <img
                            src={friend.avatar}
                            alt={friend.username}
                            className="w-12 h-12 rounded-full mx-auto mb-1"
                            title={friend.username}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'roles' && (
              <div className="space-y-2">
                {profile.roles
                  .sort((a, b) => b.position - a.position)
                  .map(role => (
                    <div
                      key={role.id}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: role.color }}
                      />
                      <span className="text-sm text-gray-300">{role.name}</span>
                      {role.permissions.includes('ADMINISTRATOR') && (
                        <Crown className="w-4 h-4 text-yellow-500 ml-auto" />
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
