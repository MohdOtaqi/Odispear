import React, { useState, useEffect } from 'react';
import { UserPlus, Users, Clock, X } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { useFriendsStore } from '../store/friendsStore';

const tabs = [
  { id: 'online', label: 'Online', icon: Users },
  { id: 'all', label: 'All', icon: Users },
  { id: 'pending', label: 'Pending', icon: Clock },
  { id: 'add', label: 'Add Friend', icon: UserPlus },
];

export const FriendsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('online');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { friends, pendingRequests, fetchFriends, fetchPendingRequests, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, removeFriend } = useFriendsStore();

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
    <div className="flex-1 flex flex-col bg-[#313338]">
      {/* Header */}
      <div className="h-12 px-4 flex items-center gap-4 border-b border-white/10 shadow-sm">
        <Users className="w-6 h-6 text-gray-400" />
        <h1 className="font-semibold text-white">Friends</h1>
        
        <div className="flex items-center gap-2 ml-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-300'
              }`}
            >
              {tab.label}
              {tab.id === 'pending' && pendingRequests.length > 0 && (
                <Badge variant="error" size="sm" className="ml-2">{pendingRequests.length}</Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'add' ? (
          <div className="max-w-2xl mx-auto p-8">
            <h2 className="text-xl font-bold text-white mb-2">Add Friend</h2>
            <p className="text-gray-400 mb-6">You can add friends with their Unity username.</p>
            
            <form onSubmit={handleAddFriend} className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter username"
                className="flex-1"
              />
              <Button type="submit" variant="primary">
                Send Friend Request
              </Button>
            </form>
          </div>
        ) : activeTab === 'pending' ? (
          <div className="p-4 space-y-2">
            {pendingRequests.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No pending friend requests</p>
              </div>
            ) : (
              pendingRequests.map((request) => (
                <div key={request.request_id} className="flex items-center gap-4 p-4 bg-[#2b2d31] rounded-lg hover:bg-white/5 transition-colors">
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
                      onClick={() => acceptFriendRequest(request.request_id)}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => rejectFriendRequest(request.request_id)}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {(activeTab === 'online' ? onlineFriends : friends).length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No friends {activeTab === 'online' ? 'online' : 'yet'}</p>
              </div>
            ) : (
              (activeTab === 'online' ? onlineFriends : friends).map((friend) => (
                <div key={friend.id} className="flex items-center gap-4 p-4 bg-[#2b2d31] rounded-lg hover:bg-white/5 transition-colors group">
                  <Avatar
                    src={friend.avatar_url}
                    alt={friend.username}
                    size="md"
                    status={friend.status}
                    fallback={friend.username.charAt(0)}
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-white">{friend.display_name || friend.username}</div>
                    <div className="text-sm text-gray-400">
                      {friend.status === 'online' && '🟢 Online'}
                      {friend.status === 'idle' && '🟡 Idle'}
                      {friend.status === 'dnd' && '🔴 Do Not Disturb'}
                      {friend.status === 'offline' && '⚫ Offline'}
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm">
                      Message
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFriend(friend.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
