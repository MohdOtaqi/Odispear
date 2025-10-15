import React, { useState, useCallback } from 'react';
import { X, Sparkles } from 'lucide-react';
import { useGuildStore } from '../../store/guildStore';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';

interface CreateGuildModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateGuildModal: React.FC<CreateGuildModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [templateType, setTemplateType] = useState<string>('community');
  const [isLoading, setIsLoading] = useState(false);

  const { createGuild } = useGuildStore();

  const templates = [
    {
      type: 'community',
      label: 'Community',
      description: 'For friends and communities',
      icon: '👥',
    },
    {
      type: 'esports',
      label: 'Gaming & Esports',
      description: 'For competitive gaming',
      icon: '🎮',
    },
    {
      type: 'study',
      label: 'Study Group',
      description: 'For learning together',
      icon: '📚',
    },
    {
      type: 'custom',
      label: 'Custom',
      description: 'Start from scratch',
      icon: '⚡',
    },
  ];

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter a server name');
      return;
    }

    setIsLoading(true);
    try {
      await createGuild({
        name: name.trim(),
        description: description.trim() || undefined,
        template_type: templateType,
      });
      toast.success('Server created successfully!');
      onClose();
      setName('');
      setDescription('');
      setTemplateType('community');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create server');
    } finally {
      setIsLoading(false);
    }
  }, [name, description, templateType, createGuild, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#313338] rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="relative p-6 border-b border-white/10">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-blue-600/10" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center animate-glow">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Create Your Server</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Template Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3">
              Choose a Template
            </label>
            <div className="grid grid-cols-2 gap-3">
              {templates.map((template) => (
                <button
                  key={template.type}
                  type="button"
                  onClick={() => setTemplateType(template.type)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    templateType === template.type
                      ? 'border-purple-500 bg-purple-600/20'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="text-3xl mb-2">{template.icon}</div>
                  <div className="font-semibold text-white mb-1">
                    {template.label}
                  </div>
                  <div className="text-xs text-gray-400">
                    {template.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Server Name */}
          <Input
            label="Server Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Awesome Server"
            maxLength={100}
            disabled={isLoading}
            required
          />

          {/* Server Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's your server about?"
              rows={3}
              maxLength={500}
              className="w-full px-4 py-3 bg-[#1e1f22] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all resize-none hover:border-white/20"
              disabled={isLoading}
            />
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              size="lg"
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isLoading}
              disabled={!name.trim()}
              className="flex-1"
            >
              Create Server
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
