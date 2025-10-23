import React, { useState } from 'react';
import { Hash, Volume2, Settings, Bell, Pin, Users, Search, Smile, Plus, Gift, Image as ImageIcon, Paperclip } from 'lucide-react';
import MessageComponent from '../components/MessageComponent';

const Dashboard: React.FC = () => {
  const [message, setMessage] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('general');

  // Mock data
  const guild = {
    name: 'Unity Gaming Community',
    icon: 'U',
  };

  const channels = [
    { id: 'general', name: 'general', type: 'text', unread: 3 },
    { id: 'announcements', name: 'announcements', type: 'text', unread: 0 },
    { id: 'team-chat', name: 'team-chat', type: 'text', unread: 1 },
    { id: 'voice-1', name: 'General Voice', type: 'voice', participants: 2 },
    { id: 'voice-2', name: 'Team Room', type: 'voice', participants: 0 },
  ];

  const messages = [
    {
      id: '1',
      author: {
        username: 'Admin User',
        avatar: undefined,
        color: '#8b5cf6',
      },
      content: 'Welcome to Unity Gaming Community! 🎮 Ready to dominate?',
      timestamp: new Date().toISOString(),
      reactions: [
        { emoji: '🔥', count: 5, reacted: true },
        { emoji: '👍', count: 3, reacted: false },
      ],
    },
    {
      id: '2',
      author: {
        username: 'ProGamer',
        avatar: undefined,
        color: '#3b82f6',
      },
      content: 'LFG for the tournament this weekend! Who\'s in?',
      timestamp: new Date().toISOString(),
      reactions: [
        { emoji: '⚔️', count: 7, reacted: true },
      ],
    },
  ];

  const members = [
    { id: '1', username: 'Admin User', status: 'online', avatar: 'A', role: 'Owner', roleColor: '#f59e0b' },
    { id: '2', username: 'ProGamer', status: 'online', avatar: 'P', role: 'Member', roleColor: '#8b5cf6' },
    { id: '3', username: 'Designer', status: 'idle', avatar: 'D', role: 'Member', roleColor: '#10b981' },
    { id: '4', username: 'Moderator', status: 'dnd', avatar: 'M', role: 'Moderator', roleColor: '#ef4444' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'dnd': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="h-screen flex">
      {/* Server List */}
      <div className="w-18 glass-effect flex-col items-center py-3 gap-3 border-r border-white/5 hidden md:flex">
        {/* Home */}
        <button className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 hover:rounded-xl flex items-center justify-center text-white font-bold transition-all hover-lift animate-glow">
          {guild.icon}
        </button>

        <div className="w-8 h-px bg-white/10" />

        {/* Other Servers */}
        {['G', 'E', 'S'].map((server, idx) => (
          <button
            key={idx}
            className="w-12 h-12 rounded-full bg-[#2b2d31] hover:bg-purple-600 hover:rounded-xl flex items-center justify-center text-gray-300 hover:text-white font-bold transition-all hover-lift"
          >
            {server}
          </button>
        ))}

        <button className="w-12 h-12 rounded-full bg-[#2b2d31] hover:bg-green-600 hover:rounded-xl flex items-center justify-center text-green-500 hover:text-white transition-all hover-lift mt-auto">
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Channel Sidebar */}
      <div className="w-60 glass-effect flex flex-col border-r border-white/5">
        {/* Guild Header */}
        <div className="h-12 px-4 flex items-center justify-between border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors">
          <h2 className="font-bold truncate">{guild.name}</h2>
          <Settings className="w-4 h-4 text-gray-400" />
        </div>

        {/* Channels */}
        <div className="flex-1 overflow-y-auto scrollbar-custom p-2">
          <div className="mb-4">
            <div className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase flex items-center justify-between">
              Text Channels
              <Plus className="w-3 h-3 cursor-pointer hover:text-white transition-colors" />
            </div>
            {channels.filter(c => c.type === 'text').map((channel) => (
              <button
                key={channel.id}
                onClick={() => setSelectedChannel(channel.id)}
                className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded transition-all hover-lift ${
                  selectedChannel === channel.id
                    ? 'bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-white'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  <span className="text-sm">{channel.name}</span>
                </div>
                {channel.unread > 0 && (
                  <span className="bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full animate-pulse">
                    {channel.unread}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div>
            <div className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase flex items-center justify-between">
              Voice Channels
              <Plus className="w-3 h-3 cursor-pointer hover:text-white transition-colors" />
            </div>
            {channels.filter(c => c.type === 'voice').map((channel) => (
              <button
                key={channel.id}
                className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded text-gray-400 hover:bg-white/5 hover:text-white transition-all"
              >
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  <span className="text-sm">{channel.name}</span>
                </div>
                {channel.participants > 0 && (
                  <span className="text-xs text-green-400">{channel.participants}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* User Panel */}
        <div className="h-14 px-2 py-2 border-t border-white/5 bg-[#1e1f22]">
          <div className="flex items-center gap-2 px-2 rounded hover:bg-white/5 transition-colors cursor-pointer">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-sm font-bold">
                U
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1e1f22]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">Username</div>
              <div className="text-xs text-gray-400 truncate">#1234</div>
            </div>
            <Settings className="w-4 h-4 text-gray-400 hover:text-white transition-colors" />
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Channel Header */}
        <div className="h-12 px-4 flex items-center justify-between border-b border-white/5 glass-effect">
          <div className="flex items-center gap-2">
            <Hash className="w-5 h-5 text-gray-400" />
            <h3 className="font-bold">{selectedChannel}</h3>
            <div className="w-px h-4 bg-white/10 mx-2" />
            <p className="text-sm text-gray-400 truncate">Welcome to Unity Gaming Community!</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-white/5 rounded transition-colors tooltip" data-tooltip="Notifications">
              <Bell className="w-5 h-5 text-gray-400" />
            </button>
            <button className="p-2 hover:bg-white/5 rounded transition-colors tooltip" data-tooltip="Pinned">
              <Pin className="w-5 h-5 text-gray-400" />
            </button>
            <button className="p-2 hover:bg-white/5 rounded transition-colors tooltip" data-tooltip="Members">
              <Users className="w-5 h-5 text-gray-400" />
            </button>
            <div className="w-px h-6 bg-white/10 mx-1" />
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                className="w-36 bg-[#1e1f22] border border-white/5 rounded pl-9 pr-3 py-1.5 text-sm text-white focus:border-purple-500 focus:outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-custom">
          {messages.map((msg) => (
            <MessageComponent key={msg.id} message={msg} />
          ))}
        </div>

        {/* Message Input */}
        <div className="px-4 py-4 border-t border-white/5">
          <div className="flex items-end gap-3">
            <button className="p-2 hover:bg-white/5 rounded transition-colors tooltip" data-tooltip="Upload">
              <Plus className="w-5 h-5 text-gray-400" />
            </button>
            <div className="flex-1 bg-[#2b2d31] rounded-lg border border-white/5 focus-within:border-purple-500 transition-all">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Message #${selectedChannel}`}
                className="w-full bg-transparent px-4 py-3 text-sm text-white focus:outline-none"
              />
              <div className="flex items-center gap-1 px-3 pb-2">
                <button className="p-1 hover:bg-white/10 rounded transition-colors tooltip" data-tooltip="Attach">
                  <Paperclip className="w-4 h-4 text-gray-400" />
                </button>
                <button className="p-1 hover:bg-white/10 rounded transition-colors tooltip" data-tooltip="Image">
                  <ImageIcon className="w-4 h-4 text-gray-400" />
                </button>
                <button className="p-1 hover:bg-white/10 rounded transition-colors tooltip" data-tooltip="GIF">
                  <Gift className="w-4 h-4 text-gray-400" />
                </button>
                <button className="p-1 hover:bg-white/10 rounded transition-colors tooltip" data-tooltip="Emoji">
                  <Smile className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Member List */}
      <div className="w-60 glass-effect border-l border-white/5 overflow-y-auto scrollbar-custom p-3">
        <div className="text-xs font-semibold text-gray-400 uppercase mb-2">
          Members — {members.length}
        </div>
        <div className="space-y-1">
          {members.map((member) => (
            <button
              key={member.id}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5 transition-all hover-lift group"
            >
              <div className="relative">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: member.roleColor }}
                >
                  {member.avatar}
                </div>
                <div className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor(member.status)} rounded-full border-2 border-[#1e1f22]`} />
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="text-sm font-medium text-white truncate group-hover:text-purple-400 transition-colors">
                  {member.username}
                </div>
                <div className="text-xs text-gray-400 truncate">{member.role}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
