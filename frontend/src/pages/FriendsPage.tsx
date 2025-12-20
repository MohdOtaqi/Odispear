import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Users, Clock, X, MessageSquare, Search, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { useFriendsStore } from '../store/friendsStore';
import { useDMStore } from '../store/dmStore';
import { UserProfileModal } from '../components/UserProfileModal';
import api from '../lib/api';
import toast from 'react-hot-toast';

const tabs = [
  { id: 'online', label: 'Online', icon: Users },
  { id: 'all', label: 'All', icon: Users },
  { id: 'pending', label: 'Pending', icon: Clock },
  { id: 'add', label: 'Add Friend', icon: UserPlus },
];

const FriendCard = ({ friend, onOpenDM, onRemove, onClick, index }: any) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: Math.min(index * 0.05, 0.5), type: "spring", stiffness: 300, damping: 25 }}
      whileHover={{ scale: 1.01, x: 4 }}
      onClick={onClick}
      className="flex items-center gap-4 p-4 bg-mot-surface/80 backdrop-blur-sm rounded-2xl border border-mot-border hover:border-mot-gold/30 transition-colors group cursor-pointer"
    >
      <Avatar
        src={friend.avatar_url}
        alt={friend.username}
        size="md"
        status={friend.status}
        fallback={friend.username.charAt(0)}
        ring
        ringColor="rgba(212, 175, 55, 0.3)"
      />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-white truncate">{friend.display_name || friend.username}</div>
        <div className="text-sm text-gray-400 flex items-center gap-2">
          <motion.span
            className={`w-2 h-2 rounded-full ${friend.status === 'online' ? 'bg-green-500' :
                friend.status === 'idle' ? 'bg-amber-500' :
                  friend.status === 'dnd' ? 'bg-red-500' : 'bg-gray-500'
              }`}
            animate={friend.status === 'online' ? { scale: [1, 1.2, 1] } : undefined}
            transition={{ duration: 2, repeat: Infinity }}
          />
          {friend.status === 'online' && 'Online'}
          {friend.status === 'idle' && 'Idle'}
          {friend.status === 'dnd' && 'Do Not Disturb'}
          {friend.status === 'offline' && 'Offline'}
        </div>
      </div>
      <motion.div
        className="flex gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onOpenDM(friend.id, e);
          }}
          className="opacity-0 group-hover:opacity-100"
        >
          <MessageSquare className="w-4 h-4 mr-1" />
          Message
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onRemove(friend.id);
          }}
          className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100"
        >
          <X className="w-4 h-4" />
        </Button>
      </motion.div>
    </motion.div>
  );
};

export const FriendsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('online');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { friends, pendingRequests, fetchFriends, fetchPendingRequests, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, removeFriend } = useFriendsStore();
  const { fetchDMChannels } = useDMStore();

  const handleOpenDM = async (friendId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      toast.loading('Opening DM...', { id: 'dm-open' });
      const response = await api.post('/dm/create', { recipientId: friendId });
      toast.success('DM opened!', { id: 'dm-open' });
      await fetchDMChannels();
      const dmChannel = response.data;
      navigate(`/app/dms/${dmChannel.id}`);
    } catch (error: any) {
      console.error('Failed to create DM:', error);
      toast.error(error.response?.data?.message || 'Failed to open DM', { id: 'dm-open' });
    }
  };

  useEffect(() => {
    fetchFriends();
    fetchPendingRequests();
  }, [fetchFriends, fetchPendingRequests]);

  const onlineFriends = friends.filter(f => f.status !== 'offline');

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      await sendFriendRequest(searchQuery);
      setSearchQuery('');
    } catch (error) {
      // Error handled in store
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-mot-surface-subtle via-mot-surface to-mot-surface-subtle">
      {/* Header */}
      <motion.div
        className="h-14 px-6 flex items-center gap-4 border-b border-mot-border bg-mot-surface/80 backdrop-blur-md"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <Users className="w-6 h-6 text-mot-gold" />
        <h1 className="font-bold text-white text-lg">Friends</h1>

        <div className="flex items-center gap-1 ml-4">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-colors ${isActive
                    ? 'text-mot-black'
                    : 'text-gray-400 hover:text-white'
                  }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-mot-gold rounded-xl"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {tab.label}
                  {tab.id === 'pending' && pendingRequests.length > 0 && (
                    <Badge variant="error" size="sm" pulse>
                      {pendingRequests.length}
                    </Badge>
                  )}
                </span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          {activeTab === 'add' ? (
            <motion.div
              key="add"
              className="max-w-2xl mx-auto p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <motion.div
                className="text-center mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <motion.div
                  className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-mot-gold to-amber-500 flex items-center justify-center"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <UserPlus className="w-10 h-10 text-mot-black" />
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-2">Add Friend</h2>
                <p className="text-gray-400">You can add friends with their MOT username.</p>
              </motion.div>

              <motion.form
                onSubmit={handleAddFriend}
                className="flex gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex-1">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter username"
                    leftIcon={<Search className="w-4 h-4" />}
                    variant="glass"
                  />
                </div>
                <Button type="submit" variant="primary" size="lg">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Send Request
                </Button>
              </motion.form>
            </motion.div>
          ) : activeTab === 'pending' ? (
            <motion.div
              key="pending"
              className="p-4 space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {pendingRequests.length === 0 ? (
                <motion.div
                  className="text-center py-20 text-gray-500"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Clock className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg">No pending friend requests</p>
                </motion.div>
              ) : (
                pendingRequests.map((request, index) => (
                  <motion.div
                    key={request.request_id}
                    className="flex items-center gap-4 p-4 bg-mot-surface/80 backdrop-blur-sm rounded-2xl border border-mot-border hover:border-mot-gold/30 transition-colors cursor-pointer"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => setSelectedUserId(request.id)}
                  >
                    <Avatar
                      src={request.avatar_url}
                      alt={request.username}
                      size="md"
                      status={request.status as any}
                      fallback={request.username.charAt(0)}
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-white">{request.display_name || request.username}</div>
                      <div className="text-sm text-gray-400">@{request.username}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          acceptFriendRequest(request.request_id);
                        }}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          rejectFriendRequest(request.request_id);
                        }}
                      >
                        Decline
                      </Button>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          ) : (
            <motion.div
              key="friends"
              className="p-4 space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AnimatePresence>
                {(activeTab === 'online' ? onlineFriends : friends).length === 0 ? (
                  <motion.div
                    className="text-center py-20 text-gray-500"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg">No friends {activeTab === 'online' ? 'online' : 'yet'}</p>
                    <p className="text-sm mt-2">Add some friends to get started!</p>
                  </motion.div>
                ) : (
                  (activeTab === 'online' ? onlineFriends : friends).map((friend, index) => (
                    <FriendCard
                      key={friend.id}
                      friend={friend}
                      index={index}
                      onOpenDM={handleOpenDM}
                      onRemove={removeFriend}
                      onClick={() => setSelectedUserId(friend.id)}
                    />
                  ))
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* User Profile Modal */}
      <AnimatePresence>
        {selectedUserId && (
          <UserProfileModal
            userId={selectedUserId}
            onClose={() => setSelectedUserId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
