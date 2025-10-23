import React, { useState, useCallback } from 'react';
import { X, User, Bell, Lock, Palette, LogOut } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const tabs = [
  { id: 'account', label: 'My Account', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy & Safety', icon: Lock },
];

export const UserSettingsModal = React.memo<UserSettingsModalProps>(({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('account');
  const { user, logout } = useAuthStore();
  
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: Implement update user API
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Settings saved!');
    } catch (error: any) {
      toast.error('Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  }, [username, email]);

  const handleLogout = useCallback(async () => {
    if (!confirm('Are you sure you want to logout?')) return;
    await logout();
    onClose();
  }, [logout, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-4xl h-[600px] bg-[#313338] rounded-2xl shadow-2xl flex overflow-hidden animate-scale-in">
        {/* Sidebar */}
        <div className="w-60 bg-[#2b2d31] p-4 flex flex-col">
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-gray-400 uppercase mb-2">User Settings</h2>
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
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
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
            {activeTab === 'account' && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-[#2b2d31] rounded-lg">
                  <Avatar
                    src={user?.avatar_url}
                    alt={user?.username || ''}
                    size="xl"
                    fallback={user?.username?.charAt(0) || 'U'}
                  />
                  <div>
                    <h3 className="text-lg font-bold text-white">{user?.display_name || user?.username}</h3>
                    <p className="text-sm text-gray-400">@{user?.username}</p>
                  </div>
                  <Button variant="secondary" size="sm" className="ml-auto">
                    Change Avatar
                  </Button>
                </div>

                <Input
                  label="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  required
                />

                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                />

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Status Text
                  </label>
                  <input
                    type="text"
                    placeholder="What's on your mind?"
                    maxLength={128}
                    className="w-full h-11 px-4 py-2 bg-[#1e1f22] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all"
                  />
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-4">
                <p className="text-gray-400">Customize how Unity looks on your device</p>
                <div className="grid grid-cols-2 gap-4">
                  <button className="p-4 bg-[#1e1f22] border-2 border-purple-500 rounded-lg">
                    <div className="aspect-video bg-gradient-to-br from-purple-900 to-blue-900 rounded mb-2" />
                    <p className="text-sm font-medium text-white">Dark (Current)</p>
                  </button>
                  <button className="p-4 bg-white/5 border-2 border-white/10 rounded-lg opacity-50">
                    <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-300 rounded mb-2" />
                    <p className="text-sm font-medium text-white">Light (Coming Soon)</p>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <p className="text-gray-400">Manage your notification preferences</p>
                {['Direct Messages', 'Server Messages', 'Friend Requests', 'Mentions'].map((item) => (
                  <label key={item} className="flex items-center justify-between p-4 bg-[#2b2d31] rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
                    <span className="text-white">{item}</span>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-5 h-5 rounded border-gray-600 text-purple-600 focus:ring-purple-500"
                    />
                  </label>
                ))}
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-4">
                <p className="text-gray-400">Control your privacy and safety settings</p>
                {['Allow DMs from server members', 'Show online status', 'Allow friend requests'].map((item) => (
                  <label key={item} className="flex items-center justify-between p-4 bg-[#2b2d31] rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
                    <span className="text-white">{item}</span>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-5 h-5 rounded border-gray-600 text-purple-600 focus:ring-purple-500"
                    />
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {activeTab === 'account' && (
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

UserSettingsModal.displayName = 'UserSettingsModal';
