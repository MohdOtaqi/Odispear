import React, { useState, useCallback, useEffect } from 'react';
import { X, Copy, Check, Users, Clock, Link2, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';
import toast from 'react-hot-toast';
import api from '../../lib/api';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  guildId: string;
  guildName: string;
}

interface Invite {
  id: string;
  code: string;
  uses: number;
  max_uses: number | null;
  expires_at: string | null;
  creator_username: string;
  created_at: string;
}

export const InviteModal = React.memo<InviteModalProps>(({ isOpen, onClose, guildId, guildName }) => {
  const [copied, setCopied] = useState(false);
  const [maxUses, setMaxUses] = useState(0);
  const [expiresIn, setExpiresIn] = useState(86400); // 24 hours
  const [isLoading, setIsLoading] = useState(false);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [currentInvite, setCurrentInvite] = useState<Invite | null>(null);
  const [showExisting, setShowExisting] = useState(false);
  
  const inviteUrl = currentInvite ? `${window.location.origin}/invite/${currentInvite.code}` : '';

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

  const fetchInvites = useCallback(async () => {
    if (!isOpen || !guildId) return;
    try {
      const { data } = await api.get(`/guilds/${guildId}/invites`);
      setInvites(data);
      if (data.length > 0 && !currentInvite) {
        setCurrentInvite(data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch invites:', error);
    }
  }, [guildId, isOpen, currentInvite]);

  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.post(`/guilds/${guildId}/invites`, {
        maxUses: maxUses || null,
        maxAge: expiresIn || null,
        temporary: false
      });
      setCurrentInvite(data);
      setInvites(prev => [data, ...prev]);
      toast.success('New invite created!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create invite');
    } finally {
      setIsLoading(false);
    }
  }, [guildId, maxUses, expiresIn]);

  const handleDelete = useCallback(async (code: string) => {
    try {
      await api.delete(`/invites/${code}`);
      setInvites(prev => prev.filter(inv => inv.code !== code));
      if (currentInvite?.code === code) {
        setCurrentInvite(invites.find(inv => inv.code !== code) || null);
      }
      toast.success('Invite deleted');
    } catch (error: any) {
      toast.error('Failed to delete invite');
    }
  }, [currentInvite, invites]);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-mot-surface-subtle rounded-2xl shadow-2xl border border-mot-border overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="p-6 border-b border-mot-border">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-white">Invite friends to {guildName}</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-mot-gold hover:bg-mot-gold/10 rounded-lg transition-colors"
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
                className="flex-1 h-11 px-4 py-2 bg-mot-surface border border-mot-border rounded-lg text-white font-mono text-sm"
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
                className="w-full h-11 px-4 py-2 bg-mot-surface border border-mot-border rounded-lg text-white focus:border-mot-gold focus:ring-2 focus:ring-mot-gold/20 focus:outline-none transition-all"
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

          {/* Existing Invites */}
          {invites.length > 0 && (
            <div>
              <button
                onClick={() => setShowExisting(!showExisting)}
                className="flex items-center justify-between w-full text-sm font-semibold text-gray-300 mb-2 hover:text-mot-gold transition-colors"
              >
                <span>
                  <Link2 className="w-4 h-4 inline mr-2" />
                  Existing Invites ({invites.length})
                </span>
                <span className="text-xs">{showExisting ? '▼' : '▶'}</span>
              </button>
              {showExisting && (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {invites.map(invite => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between p-2 bg-mot-surface rounded-lg hover:bg-mot-gold/10 transition-colors cursor-pointer"
                      onClick={() => setCurrentInvite(invite)}
                    >
                      <div className="flex-1 text-xs">
                        <span className="text-white font-mono">{invite.code}</span>
                        <span className="text-gray-500 ml-2">
                          {invite.uses}/{invite.max_uses || '∞'} uses
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(invite.code);
                        }}
                        className="p-1 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
