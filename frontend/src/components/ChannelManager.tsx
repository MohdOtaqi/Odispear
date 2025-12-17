import React, { useState, useEffect } from 'react';
import { Hash, Volume2, Mic, Video, Calendar, MessageSquare, Lock, Plus, Settings, Trash2, Edit, Save, X, ChevronRight, ChevronDown, Users, Shield, Clock, Eye, EyeOff, Folder, Move, Copy, Bell, BellOff } from 'lucide-react';
import api from '../lib/api';
import { useGuildStore } from '../store/guildStore';

interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'announcement' | 'stage' | 'forum';
  position: number;
  topic?: string;
  nsfw: boolean;
  rate_limit: number;
  user_limit?: number;
  bitrate?: number;
  parent_id?: string;
}

interface Category {
  id: string;
  name: string;
  position: number;
  channels: Channel[];
  collapsed?: boolean;
}

interface ChannelManagerProps {
  guildId: string;
  onClose?: () => void;
}

export const ChannelManager: React.FC<ChannelManagerProps> = ({ guildId, onClose }) => {
  const { selectedGuild } = useGuildStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [creatingChannel, setCreatingChannel] = useState(false);
  const [channelType, setChannelType] = useState<Channel['type']>('text');
  const [parentCategory, setParentCategory] = useState<string>('');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const [channelSettings, setChannelSettings] = useState({
    name: '',
    topic: '',
    nsfw: false,
    rate_limit: 0,
    user_limit: 0,
    bitrate: 64000
  });

  useEffect(() => {
    fetchChannels();
  }, [guildId]);

  const fetchChannels = async () => {
    try {
      const response = await api.get(`/guilds/${guildId}/channels`);
      organizeChannels(response.data);
    } catch (error) {
      const mockChannels: Channel[] = [
        { id: '1', name: 'general', type: 'text', position: 0, nsfw: false, rate_limit: 0, parent_id: 'cat1' },
        { id: '2', name: 'announcements', type: 'announcement', position: 1, nsfw: false, rate_limit: 0, parent_id: 'cat1' },
        { id: '3', name: 'voice-chat', type: 'voice', position: 0, nsfw: false, rate_limit: 0, user_limit: 10, bitrate: 64000, parent_id: 'cat2' },
        { id: '4', name: 'stage', type: 'stage', position: 1, nsfw: false, rate_limit: 0, parent_id: 'cat2' }
      ];

      const mockCategories: Category[] = [
        { id: 'cat1', name: 'TEXT CHANNELS', position: 0, channels: mockChannels.filter(c => c.parent_id === 'cat1') },
        { id: 'cat2', name: 'VOICE CHANNELS', position: 1, channels: mockChannels.filter(c => c.parent_id === 'cat2') }
      ];

      setCategories(mockCategories);
    }
  };

  const organizeChannels = (channels: Channel[]) => {
    const cats: Category[] = [];
    const categoryChannels = channels.filter(c => !c.parent_id);
    const regularChannels = channels.filter(c => c.parent_id);

    categoryChannels.forEach(cat => {
      cats.push({
        id: cat.id,
        name: cat.name,
        position: cat.position,
        channels: regularChannels.filter(c => c.parent_id === cat.id).sort((a, b) => a.position - b.position)
      });
    });

    setCategories(cats.sort((a, b) => a.position - b.position));
  };

  const getChannelIcon = (type: Channel['type']) => {
    switch (type) {
      case 'voice': return Volume2;
      case 'announcement': return Bell;
      case 'stage': return Mic;
      case 'forum': return MessageSquare;
      default: return Hash;
    }
  };

  const createChannel = async () => {
    try {
      const newChannel = {
        ...channelSettings,
        type: channelType,
        parent_id: parentCategory || undefined
      };

      await api.post(`/guilds/${guildId}/channels`, newChannel);
      fetchChannels();
      resetForm();
      setCreatingChannel(false);
    } catch (error) {
      console.error('Failed to create channel:', error);
    }
  };

  const updateChannel = async () => {
    if (!editingChannel) return;
    try {
      await api.patch(`/guilds/${guildId}/channels/${editingChannel.id}`, editingChannel);
      fetchChannels();
      setEditingChannel(null);
      setSelectedChannel(null);
    } catch (error) {
      console.error('Failed to update channel:', error);
    }
  };

  const deleteChannel = async (channelId: string) => {
    if (!window.confirm('Are you sure you want to delete this channel?')) return;
    try {
      await api.delete(`/guilds/${guildId}/channels/${channelId}`);
      fetchChannels();
      if (selectedChannel?.id === channelId) {
        setSelectedChannel(null);
      }
    } catch (error) {
      console.error('Failed to delete channel:', error);
    }
  };

  const duplicateChannel = async (channel: Channel) => {
    try {
      const duplicate = { ...channel, name: `${channel.name}-copy`, id: undefined };
      await api.post(`/guilds/${guildId}/channels`, duplicate);
      fetchChannels();
    } catch (error) {
      console.error('Failed to duplicate channel:', error);
    }
  };

  const createCategory = async () => {
    try {
      await api.post(`/guilds/${guildId}/channels`, { name: 'New Category', type: 'category' });
      fetchChannels();
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  const toggleCategory = (categoryId: string) => {
    const newCollapsed = new Set(collapsedCategories);
    if (newCollapsed.has(categoryId)) {
      newCollapsed.delete(categoryId);
    } else {
      newCollapsed.add(categoryId);
    }
    setCollapsedCategories(newCollapsed);
  };

  const resetForm = () => {
    setChannelSettings({ name: '', topic: '', nsfw: false, rate_limit: 0, user_limit: 0, bitrate: 64000 });
    setChannelType('text');
    setParentCategory('');
  };

  return (
    <div className="flex h-full bg-gray-900">
      {/* Channel List */}
      <div className="w-80 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Channels</h3>
            <div className="flex items-center gap-2">
              <button onClick={createCategory} className="p-1.5 bg-gray-700 rounded hover:bg-gray-600" title="Create Category">
                <Folder className="w-4 h-4 text-gray-300" />
              </button>
              <button onClick={() => setCreatingChannel(true)} className="p-1.5 bg-purple-600 rounded hover:bg-purple-700" title="Create Channel">
                <Plus className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          {categories.map((category) => (
            <div key={category.id} className="mb-4">
              <div className="flex items-center justify-between px-2 py-1 hover:bg-gray-800 rounded group">
                <button onClick={() => toggleCategory(category.id)} className="flex items-center gap-1 text-xs font-semibold text-gray-400 uppercase">
                  {collapsedCategories.has(category.id) ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {category.name}
                </button>
              </div>

              {!collapsedCategories.has(category.id) && (
                <div className="ml-2 mt-1 space-y-1">
                  {category.channels.map((channel) => {
                    const Icon = getChannelIcon(channel.type);
                    return (
                      <div key={channel.id} className={`group flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors ${
                          selectedChannel?.id === channel.id ? 'bg-gray-800 text-white' : 'hover:bg-gray-800 text-gray-400 hover:text-gray-200'
                        }`} onClick={() => { setSelectedChannel(channel); setEditingChannel(null); }}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <span className="text-sm">{channel.name}</span>
                          {channel.nsfw && <span className="text-xs bg-red-900/50 text-red-400 px-1 rounded">NSFW</span>}
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                          <button onClick={(e) => { e.stopPropagation(); duplicateChannel(channel); }} className="p-1 hover:bg-gray-700 rounded" title="Duplicate">
                            <Copy className="w-3 h-3" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setEditingChannel(channel); setSelectedChannel(channel); }} className="p-1 hover:bg-gray-700 rounded" title="Edit">
                            <Edit className="w-3 h-3" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); deleteChannel(channel.id); }} className="p-1 hover:bg-red-900/50 rounded" title="Delete">
                            <Trash2 className="w-3 h-3 text-red-400" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Channel Settings */}
      {(selectedChannel || editingChannel || creatingChannel) && (
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-3xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {creatingChannel ? 'Create Channel' : editingChannel ? 'Edit Channel' : 'Channel Settings'}
              </h2>
              <div className="flex items-center gap-2">
                {(editingChannel || creatingChannel) && (
                  <>
                    <button onClick={() => { setEditingChannel(null); setCreatingChannel(false); resetForm(); }}
                      className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600">Cancel</button>
                    <button onClick={creatingChannel ? createChannel : updateChannel}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      {creatingChannel ? 'Create' : 'Save'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Channel Type Selection */}
            {creatingChannel && (
              <div className="mb-6 p-4 bg-gray-800 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-4">Channel Type</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { type: 'text', icon: Hash, label: 'Text Channel', desc: 'Send messages, images, GIFs' },
                    { type: 'voice', icon: Volume2, label: 'Voice Channel', desc: 'Voice and video chat' },
                    { type: 'announcement', icon: Bell, label: 'Announcement', desc: 'Important updates' },
                    { type: 'stage', icon: Mic, label: 'Stage Channel', desc: 'Host events' },
                    { type: 'forum', icon: MessageSquare, label: 'Forum', desc: 'Organized discussions' }
                  ].map(({ type, icon: Icon, label, desc }) => (
                    <button key={type} onClick={() => setChannelType(type as Channel['type'])}
                      className={`p-3 border rounded-lg transition-colors ${channelType === type
                        ? 'border-purple-500 bg-purple-900/20 text-purple-400' : 'border-gray-700 hover:border-gray-600 text-gray-400'}`}>
                      <Icon className="w-5 h-5 mb-2 mx-auto" />
                      <div className="text-sm font-medium">{label}</div>
                      <div className="text-xs text-gray-500 mt-1">{desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Basic Settings */}
            <div className="mb-6 p-4 bg-gray-800 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Channel Name</label>
                  <input type="text" value={creatingChannel ? channelSettings.name : editingChannel ? editingChannel.name : selectedChannel?.name || ''}
                    onChange={(e) => { if (creatingChannel) { setChannelSettings({ ...channelSettings, name: e.target.value });
                    } else if (editingChannel) { setEditingChannel({ ...editingChannel, name: e.target.value }); }}}
                    disabled={!editingChannel && !creatingChannel}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"/>
                </div>

                {(channelType === 'text' || channelType === 'announcement' || channelType === 'forum') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Topic</label>
                    <textarea value={creatingChannel ? channelSettings.topic : editingChannel ? editingChannel.topic || '' : selectedChannel?.topic || ''}
                      onChange={(e) => { if (creatingChannel) { setChannelSettings({ ...channelSettings, topic: e.target.value });
                      } else if (editingChannel) { setEditingChannel({ ...editingChannel, topic: e.target.value }); }}}
                      disabled={!editingChannel && !creatingChannel} rows={3}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 resize-none"/>
                  </div>
                )}

                {creatingChannel && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Category</label>
                    <select value={parentCategory} onChange={(e) => setParentCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                      <option value="">No Category</option>
                      {categories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                    </select>
                  </div>
                )}

                <label className="flex items-center gap-3">
                  <input type="checkbox" checked={creatingChannel ? channelSettings.nsfw : editingChannel ? editingChannel.nsfw : selectedChannel?.nsfw || false}
                    onChange={(e) => { if (creatingChannel) { setChannelSettings({ ...channelSettings, nsfw: e.target.checked });
                    } else if (editingChannel) { setEditingChannel({ ...editingChannel, nsfw: e.target.checked }); }}}
                    disabled={!editingChannel && !creatingChannel}
                    className="w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500 disabled:opacity-50"/>
                  <div>
                    <div className="text-sm font-medium text-gray-300">NSFW Channel</div>
                    <div className="text-xs text-gray-500">Users must confirm they are 18+ to view</div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelManager;
