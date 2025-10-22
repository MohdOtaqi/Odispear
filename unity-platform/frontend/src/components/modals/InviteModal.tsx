import React, { useState, useCallback } from 'react';
import { X, Copy, Check, Users, Clock } from 'lucide-react';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';
import toast from 'react-hot-toast';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  guildId: string;
  guildName: string;
}

export const InviteModal = React.memo<InviteModalProps>(({ isOpen, onClose, guildId, guildName }) => {
  const [copied, setCopied] = useState(false);
  const [maxUses, setMaxUses] = useState(0);
  const [expiresIn, setExpiresIn] = useState(86400); // 24 hours
  const [isLoading, setIsLoading] = useState(false);
  
  // Mock invite code - replace with actual API call
  const inviteCode = `unity.gg/${guildId.substring(0, 8)}`;
  const inviteUrl = `https://${inviteCode}`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success('Invite link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  }, [inviteUrl]);

  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: Call API to generate invite
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('New invite created!');
    } catch (error: any) {
      toast.error('Failed to create invite');
    } finally {
      setIsLoading(false);
    }
  }, [maxUses, expiresIn]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#313338] rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-white">Invite friends to {guildName}</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-400">Send a server invite link to a friend</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Invite Link */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Invite Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inviteUrl}
                readOnly
                className="flex-1 h-11 px-4 py-2 bg-[#1e1f22] border border-white/10 rounded-lg text-white font-mono text-sm"
              />
              <Tooltip content={copied ? 'Copied!' : 'Copy Link'}>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleCopy}
                  className="flex-shrink-0"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </Button>
              </Tooltip>
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Expire After
              </label>
              <select
                value={expiresIn}
                onChange={(e) => setExpiresIn(Number(e.target.value))}
                className="w-full h-11 px-4 py-2 bg-[#1e1f22] border border-white/10 rounded-lg text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all"
              >
                <option value={1800}>30 minutes</option>
                <option value={3600}>1 hour</option>
                <option value={21600}>6 hours</option>
                <option value={43200}>12 hours</option>
                <option value={86400}>1 day</option>
                <option value={604800}>7 days</option>
                <option value={0}>Never</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                <Users className="w-4 h-4 inline mr-2" />
                Max Number of Uses
              </label>
              <select
                value={maxUses}
                onChange={(e) => setMaxUses(Number(e.target.value))}
                className="w-full h-11 px-4 py-2 bg-[#1e1f22] border border-white/10 rounded-lg text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all"
              >
                <option value={0}>No limit</option>
                <option value={1}>1 use</option>
                <option value={5}>5 uses</option>
                <option value={10}>10 uses</option>
                <option value={25}>25 uses</option>
                <option value={50}>50 uses</option>
                <option value={100}>100 uses</option>
              </select>
            </div>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-sm text-blue-400">
              💡 Anyone with this link will be able to join this server
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-white/10">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handleGenerate} loading={isLoading}>
            Generate New Link
          </Button>
        </div>
      </div>
    </div>
  );
});

InviteModal.displayName = 'InviteModal';
