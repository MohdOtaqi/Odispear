import React, { useState, useEffect } from 'react';
import { MessageSquare, Hash, Users, Clock, Pin, Lock, Archive, ChevronRight, Plus, Filter, TrendingUp, Star, Tag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';

interface Thread {
  id: string;
  title: string;
  author: {
    id: string;
    username: string;
    avatar: string;
  };
  content: string;
  tags: string[];
  createdAt: Date;
  lastActivity: Date;
  messageCount: number;
  participantCount: number;
  isPinned: boolean;
  isLocked: boolean;
  isArchived: boolean;
  participants: {
    id: string;
    username: string;
    avatar: string;
  }[];
}

interface ForumChannel {
  id: string;
  name: string;
  description: string;
  availableTags: {
    id: string;
    name: string;
    color: string;
    emoji?: string;
  }[];
  defaultSortOrder: 'latest' | 'creation';
  defaultLayout: 'list' | 'grid';
}

export const ThreadsForums: React.FC<{ channelId: string }> = ({ channelId }) => {
  const { user } = useAuthStore();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [forumChannel, setForumChannel] = useState<ForumChannel | null>(null);
  const [showCreateThread, setShowCreateThread] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'oldest'>('latest');
  const [layout, setLayout] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState('');

  // New thread form
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadContent, setNewThreadContent] = useState('');
  const [newThreadTags, setNewThreadTags] = useState<string[]>([]);

  useEffect(() => {
    fetchForumChannel();
    fetchThreads();
  }, [channelId]);

  const fetchForumChannel = async () => {
    try {
      const response = await api.get(`/channels/${channelId}/forum`);
      setForumChannel(response.data);
      setLayout(response.data.defaultLayout || 'list');
    } catch (error) {
      // Mock data
      setForumChannel({
        id: channelId,
        name: 'general-forum',
        description: 'Discuss anything and everything',
        availableTags: [
          { id: '1', name: 'Question', color: '#3b82f6', emoji: '❓' },
          { id: '2', name: 'Discussion', color: '#10b981', emoji: '💬' },
          { id: '3', name: 'Announcement', color: '#f59e0b', emoji: '📢' },
          { id: '4', name: 'Help', color: '#ef4444', emoji: '🆘' },
          { id: '5', name: 'Showcase', color: '#8b5cf6', emoji: '✨' },
          { id: '6', name: 'Feedback', color: '#ec4899', emoji: '💭' },
        ],
        defaultSortOrder: 'latest',
        defaultLayout: 'list'
      });
    }
  };

  const fetchThreads = async () => {
    try {
      const response = await api.get(`/channels/${channelId}/threads`);
      setThreads(response.data);
    } catch (error) {
      // Mock data
      setThreads([
        {
          id: '1',
          title: 'Welcome to the new forum channel! 🎉',
          author: {
            id: '1',
            username: 'Admin',
            avatar: 'https://ui-avatars.com/api/?name=Admin&background=e74c3c&color=fff'
          },
          content: 'This is our brand new forum channel where you can create threads for longer discussions...',
          tags: ['Announcement', 'Discussion'],
          createdAt: new Date(Date.now() - 2 * 86400000),
          lastActivity: new Date(Date.now() - 60000),
          messageCount: 45,
          participantCount: 12,
          isPinned: true,
          isLocked: false,
          isArchived: false,
          participants: [
            { id: '2', username: 'User1', avatar: 'https://ui-avatars.com/api/?name=User1' },
            { id: '3', username: 'User2', avatar: 'https://ui-avatars.com/api/?name=User2' },
            { id: '4', username: 'User3', avatar: 'https://ui-avatars.com/api/?name=User3' },
          ]
        },
        {
          id: '2',
          title: 'How do I use voice channels effectively?',
          author: {
            id: '5',
            username: 'NewUser',
            avatar: 'https://ui-avatars.com/api/?name=NewUser&background=3b82f6&color=fff'
          },
          content: 'I\'m new here and trying to understand the best practices for voice channels...',
          tags: ['Question', 'Help'],
          createdAt: new Date(Date.now() - 3600000),
          lastActivity: new Date(Date.now() - 1800000),
          messageCount: 8,
          participantCount: 4,
          isPinned: false,
          isLocked: false,
          isArchived: false,
          participants: [
            { id: '6', username: 'Helper1', avatar: 'https://ui-avatars.com/api/?name=Helper1' },
            { id: '7', username: 'Helper2', avatar: 'https://ui-avatars.com/api/?name=Helper2' },
          ]
        },
        {
          id: '3',
          title: 'Share your best gaming moments! 🎮',
          author: {
            id: '8',
            username: 'GamerPro',
            avatar: 'https://ui-avatars.com/api/?name=GamerPro&background=8b5cf6&color=fff'
          },
          content: 'Let\'s share our epic gaming moments and clips in this thread!',
          tags: ['Showcase', 'Discussion'],
          createdAt: new Date(Date.now() - 7200000),
          lastActivity: new Date(Date.now() - 3600000),
          messageCount: 23,
          participantCount: 8,
          isPinned: false,
          isLocked: false,
          isArchived: false,
          participants: [
            { id: '9', username: 'Gamer1', avatar: 'https://ui-avatars.com/api/?name=Gamer1' },
            { id: '10', username: 'Gamer2', avatar: 'https://ui-avatars.com/api/?name=Gamer2' },
            { id: '11', username: 'Gamer3', avatar: 'https://ui-avatars.com/api/?name=Gamer3' },
          ]
        }
      ]);
    }
  };

  const createThread = async () => {
    if (!newThreadTitle.trim() || !newThreadContent.trim()) return;

    try {
      const response = await api.post(`/channels/${channelId}/threads`, {
        title: newThreadTitle,
        content: newThreadContent,
        tags: newThreadTags
      });
      
      setThreads([response.data, ...threads]);
      setShowCreateThread(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create thread:', error);
    }
  };

  const resetForm = () => {
    setNewThreadTitle('');
    setNewThreadContent('');
    setNewThreadTags([]);
  };

  const filteredAndSortedThreads = () => {
    let filtered = [...threads];

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(thread =>
        thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        thread.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(thread =>
        thread.tags.some(tag => selectedTags.includes(tag))
      );
    }

    // Sort
    switch (sortBy) {
      case 'latest':
        filtered.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
        break;
      case 'popular':
        filtered.sort((a, b) => b.messageCount - a.messageCount);
        break;
      case 'oldest':
        filtered.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        break;
    }

    // Pinned threads first
    return [
      ...filtered.filter(t => t.isPinned),
      ...filtered.filter(t => !t.isPinned)
    ];
  };

  const ThreadCard: React.FC<{ thread: Thread }> = ({ thread }) => (
    <div className={`bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4 hover:border-purple-500/50 transition-all cursor-pointer group ${
      thread.isPinned ? 'border-yellow-500/30' : ''
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <img
            src={thread.author.avatar}
            alt={thread.author.username}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors flex items-center gap-2">
              {thread.isPinned && <Pin className="w-4 h-4 text-yellow-500" />}
              {thread.isLocked && <Lock className="w-4 h-4 text-red-500" />}
              {thread.title}
            </h3>
            <p className="text-sm text-gray-400">
              by {thread.author.username} · {formatDistanceToNow(thread.createdAt)} ago
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-purple-400 transition-colors" />
      </div>

      {/* Content Preview */}
      <p className="text-gray-300 text-sm mb-3 line-clamp-2">{thread.content}</p>

      {/* Tags */}
      {thread.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {thread.tags.map(tag => {
            const tagConfig = forumChannel?.availableTags.find(t => t.name === tag);
            return (
              <span
                key={tag}
                className="px-2 py-1 text-xs rounded-full font-medium"
                style={{
                  backgroundColor: tagConfig?.color + '20',
                  color: tagConfig?.color || '#9ca3af'
                }}
              >
                {tagConfig?.emoji} {tag}
              </span>
            );
          })}
        </div>
      )}

      {/* Footer Stats */}
      <div className="flex items-center justify-between text-sm text-gray-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            <span>{thread.messageCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{thread.participantCount}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {thread.participants.slice(0, 3).map(p => (
              <img
                key={p.id}
                src={p.avatar}
                alt={p.username}
                className="w-6 h-6 rounded-full border-2 border-gray-800"
                title={p.username}
              />
            ))}
            {thread.participants.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-gray-700 border-2 border-gray-800 flex items-center justify-center text-xs text-gray-400">
                +{thread.participants.length - 3}
              </div>
            )}
          </div>
          <span className="text-xs">
            Last: {formatDistanceToNow(thread.lastActivity)} ago
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Hash className="w-5 h-5 text-gray-400" />
              {forumChannel?.name || 'Forum'}
            </h2>
            {forumChannel?.description && (
              <p className="text-sm text-gray-400 mt-1">{forumChannel.description}</p>
            )}
          </div>
          <button
            onClick={() => setShowCreateThread(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:shadow-lg transition-all hover:scale-105 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Thread
          </button>
        </div>

        {/* Filters and Controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            {/* Search */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search threads..."
              className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            {/* Tags Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              {forumChannel?.availableTags.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => {
                    setSelectedTags(prev =>
                      prev.includes(tag.name)
                        ? prev.filter(t => t !== tag.name)
                        : [...prev, tag.name]
                    );
                  }}
                  className={`px-2 py-1 text-xs rounded-full font-medium transition-all ${
                    selectedTags.includes(tag.name)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {tag.emoji} {tag.name}
                </button>
              ))}
            </div>
          </div>

          {/* Sort and Layout */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="latest">Latest Activity</option>
              <option value="popular">Most Popular</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Threads List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        <div className={layout === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : 'space-y-3'}>
          {filteredAndSortedThreads().map(thread => (
            <ThreadCard key={thread.id} thread={thread} />
          ))}
        </div>

        {filteredAndSortedThreads().length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-400 mb-2">No threads yet</h3>
            <p className="text-gray-500">Be the first to start a discussion!</p>
          </div>
        )}
      </div>

      {/* Create Thread Modal */}
      {showCreateThread && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl p-6 animate-scale-in">
            <h3 className="text-xl font-bold text-white mb-4">Create New Thread</h3>
            
            <input
              type="text"
              value={newThreadTitle}
              onChange={(e) => setNewThreadTitle(e.target.value)}
              placeholder="Thread title..."
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
            />

            <textarea
              value={newThreadContent}
              onChange={(e) => setNewThreadContent(e.target.value)}
              placeholder="What would you like to discuss?"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 h-32 resize-none mb-4"
            />

            {/* Tags */}
            <div className="mb-4">
              <label className="text-sm text-gray-400 mb-2 block">Tags (select up to 5)</label>
              <div className="flex flex-wrap gap-2">
                {forumChannel?.availableTags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => {
                      if (newThreadTags.includes(tag.name)) {
                        setNewThreadTags(prev => prev.filter(t => t !== tag.name));
                      } else if (newThreadTags.length < 5) {
                        setNewThreadTags(prev => [...prev, tag.name]);
                      }
                    }}
                    className={`px-3 py-1.5 text-sm rounded-full font-medium transition-all ${
                      newThreadTags.includes(tag.name)
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {tag.emoji} {tag.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateThread(false);
                  resetForm();
                }}
                className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createThread}
                disabled={!newThreadTitle.trim() || !newThreadContent.trim()}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Thread
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreadsForums;
