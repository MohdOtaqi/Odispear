import React, { useState } from 'react';
import { X, Hash, Volume2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useGuildStore } from '../../store/guildStore';
import api from '../../lib/api';
import toast from 'react-hot-toast';

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateChannelModal: React.FC<CreateChannelModalProps> = ({ isOpen, onClose }) => {
  const [channelName, setChannelName] = useState('');
  const [channelType, setChannelType] = useState<'text' | 'voice'>('text');
  const [bitrate, setBitrate] = useState(64);
  const [userLimit, setUserLimit] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const { currentGuild, selectGuild } = useGuildStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelName.trim() || !currentGuild) return;

    setIsLoading(true);
    try {
      const payload: any = {
        guild_id: currentGuild.id,
        name: channelName.toLowerCase().replace(/\s+/g, '-'),
        type: channelType
      };

      // Add voice channel specific settings
      if (channelType === 'voice') {
        payload.bitrate = bitrate * 1000; // Convert to bps
        payload.user_limit = userLimit || null;
      }

      await api.post(`/channels/guilds/${currentGuild.id}/channels`, payload);

      toast.success(`Created ${channelType} channel: ${channelName}`);
      
      // Refresh the guild to get new channels
      await selectGuild(currentGuild.id);
      
      // Reset and close
      setChannelName('');
      setChannelType('text');
      setBitrate(64);
      setUserLimit(0);
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create channel');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-[#313338] rounded-lg p-6 w-[440px] shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Create Channel</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Channel Type Selection */}
        <div className="mb-6">
          <p className="text-sm text-gray-400 mb-3">Channel Type</p>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setChannelType('text')}
              className={`w-full p-3 rounded-lg border transition-all flex items-center gap-3 ${
                channelType === 'text'
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                channelType === 'text' ? 'bg-purple-500' : 'bg-gray-700'
              }`}>
                <Hash className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="font-medium text-white">Text Channel</div>
                <div className="text-sm text-gray-400">Send messages, images, GIFs, and more</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setChannelType('voice')}
              className={`w-full p-3 rounded-lg border transition-all flex items-center gap-3 ${
                channelType === 'voice'
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                channelType === 'voice' ? 'bg-purple-500' : 'bg-gray-700'
              }`}>
                <Volume2 className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="font-medium text-white">Voice Channel</div>
                <div className="text-sm text-gray-400">Hang out together with voice and video</div>
              </div>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Input
            label="Channel Name"
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
            placeholder={channelType === 'text' ? 'new-channel' : 'New Voice Channel'}
            className="mb-4"
            required
          />

          {/* Voice Channel Options */}
          {channelType === 'voice' && (
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bitrate (kbps)
                </label>
                <select
                  value={bitrate}
                  onChange={(e) => setBitrate(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-[#1e1f22] border border-white/10 rounded-lg text-white focus:border-purple-500 focus:outline-none transition-all"
                >
                  <option value={8}>8 kbps</option>
                  <option value={16}>16 kbps</option>
                  <option value={32}>32 kbps</option>
                  <option value={64}>64 kbps (Standard)</option>
                  <option value={96}>96 kbps (High)</option>
                  <option value={128}>128 kbps (Very High)</option>
                  <option value={256}>256 kbps (Premium)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Higher bitrate = better audio quality</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  User Limit
                </label>
                <select
                  value={userLimit}
                  onChange={(e) => setUserLimit(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-[#1e1f22] border border-white/10 rounded-lg text-white focus:border-purple-500 focus:outline-none transition-all"
                >
                  <option value={0}>No limit</option>
                  <option value={2}>2 users</option>
                  <option value={5}>5 users</option>
                  <option value={10}>10 users</option>
                  <option value={25}>25 users</option>
                  <option value={50}>50 users</option>
                  <option value={99}>99 users</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Maximum number of users in this channel</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!channelName.trim() || isLoading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Create Channel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
