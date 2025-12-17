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
  const [isLoading, setIsLoading] = useState(false);
  
  const { currentGuild, selectGuild } = useGuildStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelName.trim() || !currentGuild) return;

    setIsLoading(true);
    try {
      await api.post(`/guilds/${currentGuild.id}/channels`, {
        name: channelName.toLowerCase().replace(/\s+/g, '-'),
        type: channelType
      });

      toast.success(`Created ${channelType} channel: ${channelName}`);
      
      // Refresh the guild to get new channels
      await selectGuild(currentGuild.id);
      
      // Reset and close
      setChannelName('');
      setChannelType('text');
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
      <div className="relative bg-mot-surface-subtle rounded-lg p-6 w-[440px] shadow-xl border border-mot-border">
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
                  ? 'border-mot-gold bg-mot-gold/10'
                  : 'border-mot-border hover:border-mot-gold/30'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                channelType === 'text' ? 'bg-mot-gold' : 'bg-gray-700'
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
                  ? 'border-mot-gold bg-mot-gold/10'
                  : 'border-mot-border hover:border-mot-gold/30'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                channelType === 'voice' ? 'bg-mot-gold' : 'bg-gray-700'
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
            className="mb-6"
            required
          />

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
              variant="primary"
            >
              Create Channel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
