import React, { useState, useCallback } from 'react';
import { X, Hash, Users, Shield, Settings as SettingsIcon, Trash2 } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useGuildStore } from '../../store/guildStore';
import toast from 'react-hot-toast';

interface ServerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  guildId: string;
}

const tabs = [
  { id: 'overview', label: 'Overview', icon: SettingsIcon },
  { id: 'roles', label: 'Roles', icon: Shield },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'channels', label: 'Channels', icon: Hash },
];

export const ServerSettingsModal = React.memo<ServerSettingsModalProps>(({ isOpen, onClose, guildId }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const { currentGuild, updateGuild, deleteGuild } = useGuildStore();
  
  const [name, setName] = useState(currentGuild?.name || '');
  const [description, setDescription] = useState(currentGuild?.description || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = useCallback(async () => {
    setIsLoading(true);
    try {
      await updateGuild(guildId, { name, description });
      toast.success('Server updated successfully!');
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update server');
    } finally {
      setIsLoading(false);
    }
  }, [guildId, name, description, updateGuild, onClose]);

  const handleDelete = useCallback(async () => {
    if (!confirm('Are you sure you want to delete this server? This action cannot be undone.')) return;
    
    setIsLoading(true);
    try {
      await deleteGuild(guildId);
      toast.success('Server deleted');
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete server');
    } finally {
      setIsLoading(false);
    }
  }, [guildId, deleteGuild, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-4xl h-[600px] bg-[#313338] rounded-2xl shadow-2xl flex overflow-hidden animate-scale-in">
        {/* Sidebar */}
        <div className="w-60 bg-[#2b2d31] p-4 flex flex-col">
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-gray-400 uppercase mb-2">Server Settings</h2>
          </div>
          
          <nav className="flex-1 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:bg-white/5 hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto pt-4 border-t border-white/10">
            <button
              onClick={handleDelete}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/20 transition-colors"
              disabled={isLoading}
            >
              <Trash2 className="w-4 h-4" />
              Delete Server
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h1 className="text-xl font-bold text-white">
              {tabs.find(t => t.id === activeTab)?.label}
            </h1>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <Input
                  label="Server Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Awesome Server"
                  required
                />
                
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What's your server about?"
                    rows={4}
                    maxLength={500}
                    className="w-full px-4 py-3 bg-[#1e1f22] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all resize-none"
                  />
                </div>

                <div className="pt-4 border-t border-white/10">
                  <h3 className="text-sm font-semibold text-white mb-3">Server Info</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Server ID:</span>
                      <span className="text-gray-300 font-mono">{guildId.substring(0, 12)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Members:</span>
                      <span className="text-gray-300">Loading...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'roles' && (
              <div>
                <p className="text-gray-400 mb-4">Manage server roles and permissions</p>
                <Badge variant="info">Coming soon - Role management UI</Badge>
              </div>
            )}

            {activeTab === 'members' && (
              <div>
                <p className="text-gray-400 mb-4">View and manage server members</p>
                <Badge variant="info">Coming soon - Member management UI</Badge>
              </div>
            )}

            {activeTab === 'channels' && (
              <div>
                <p className="text-gray-400 mb-4">Organize your channels</p>
                <Badge variant="info">Coming soon - Channel management UI</Badge>
              </div>
            )}
          </div>

          {/* Footer */}
          {activeTab === 'overview' && (
            <div className="flex justify-end gap-3 p-6 border-t border-white/10">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave} loading={isLoading}>
                Save Changes
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ServerSettingsModal.displayName = 'ServerSettingsModal';
