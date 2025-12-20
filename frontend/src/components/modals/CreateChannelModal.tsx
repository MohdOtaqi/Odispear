import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Hash, Volume2, Loader2, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useGuildStore } from '../../store/guildStore';
import api from '../../lib/api';
import toast from 'react-hot-toast';

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChannelTypeCard = ({
  type,
  icon: Icon,
  title,
  description,
  selected,
  onClick
}: {
  type: 'text' | 'voice';
  icon: any;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) => (
  <motion.button
    type="button"
    onClick={onClick}
    className={`w-full p-4 rounded-xl border transition-all flex items-center gap-4 ${selected
        ? 'border-mot-gold bg-mot-gold/10 shadow-lg shadow-mot-gold/10'
        : 'border-mot-border hover:border-mot-gold/30 hover:bg-white/5'
      }`}
    whileHover={{ scale: 1.01 }}
    whileTap={{ scale: 0.99 }}
  >
    <motion.div
      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${selected ? 'bg-gradient-to-br from-mot-gold to-amber-600' : 'bg-gray-700'
        }`}
      animate={selected ? { scale: [1, 1.1, 1] } : {}}
      transition={{ duration: 0.3 }}
    >
      <Icon className="w-6 h-6 text-white" />
    </motion.div>
    <div className="text-left flex-1">
      <div className="font-semibold text-white">{title}</div>
      <div className="text-sm text-gray-400">{description}</div>
    </div>
    {selected && (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="w-5 h-5 rounded-full bg-mot-gold flex items-center justify-center"
      >
        <motion.div
          className="w-2 h-2 rounded-full bg-white"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      </motion.div>
    )}
  </motion.button>
);

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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative bg-mot-surface/95 backdrop-blur-xl rounded-2xl p-6 w-[480px] shadow-2xl border border-mot-gold/20"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            {/* Decorative glow */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-mot-gold/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between mb-6 relative">
              <div className="flex items-center gap-3">
                <motion.div
                  className="p-2 rounded-xl bg-mot-gold/10"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Sparkles className="w-5 h-5 text-mot-gold" />
                </motion.div>
                <h2 className="text-xl font-bold text-white">Create Channel</h2>
              </div>
              <motion.button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Channel Type Selection */}
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-3 font-medium">Channel Type</p>
              <motion.div
                className="space-y-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <ChannelTypeCard
                  type="text"
                  icon={Hash}
                  title="Text Channel"
                  description="Send messages, images, GIFs, and more"
                  selected={channelType === 'text'}
                  onClick={() => setChannelType('text')}
                />

                <ChannelTypeCard
                  type="voice"
                  icon={Volume2}
                  title="Voice Channel"
                  description="Hang out together with voice and video"
                  selected={channelType === 'voice'}
                  onClick={() => setChannelType('voice')}
                />
              </motion.div>
            </div>

            {/* Form */}
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="mb-6">
                <Input
                  label="Channel Name"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder={channelType === 'text' ? 'new-channel' : 'New Voice Channel'}
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  {channelType === 'text' ? 'Channel names use lowercase and dashes' : 'Pick a name for your voice channel'}
                </p>
              </div>

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
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    disabled={!channelName.trim() || isLoading}
                    variant="primary"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </span>
                    ) : (
                      'Create Channel'
                    )}
                  </Button>
                </motion.div>
              </div>
            </motion.form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
