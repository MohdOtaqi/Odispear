import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Bell, Lock, Palette, LogOut, Keyboard, Settings } from 'lucide-react';
import { KeybindsManager } from '../KeybindsManager';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { scaleVariants, staggerContainer, staggerItem, magneticSpring, slideRightVariants } from '../../lib/animations';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const tabs = [
  { id: 'account', label: 'My Account', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'keybinds', label: 'Keybinds', icon: Keyboard },
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={scaleVariants}
            className="w-full max-w-4xl max-h-[85vh] bg-mot-surface-subtle rounded-2xl shadow-2xl border border-mot-gold/20 flex overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sidebar */}
            <div className="w-60 bg-mot-surface p-4 flex flex-col flex-shrink-0 border-r border-mot-border">
              <motion.div
                className="mb-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Settings className="w-4 h-4 text-mot-gold" />
                  <h2 className="text-xs font-semibold text-gray-400 uppercase">User Settings</h2>
                </div>
              </motion.div>

              <motion.nav
                className="flex-1 space-y-1"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {tabs.map((tab, index) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <motion.button
                      key={tab.id}
                      variants={staggerItem}
                      onClick={() => setActiveTab(tab.id)}
                      whileHover={{ x: 4, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive
                          ? 'bg-mot-gold/20 text-mot-gold'
                          : 'text-gray-400 hover:bg-mot-gold/10 hover:text-gray-300'
                        }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                      {isActive && (
                        <motion.div
                          layoutId="activeTabIndicator"
                          className="ml-auto w-1.5 h-1.5 rounded-full bg-mot-gold"
                        />
                      )}
                    </motion.button>
                  );
                })}
              </motion.nav>

              <motion.div
                className="mt-auto pt-4 border-t border-mot-border"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <motion.button
                  onClick={handleLogout}
                  whileHover={{ x: 4, backgroundColor: "rgba(239, 68, 68, 0.2)" }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </motion.button>
              </motion.div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col">
              {/* Header */}
              <motion.div
                className="flex items-center justify-between p-6 border-b border-mot-border"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h1 className="text-xl font-bold text-white">
                  {tabs.find(t => t.id === activeTab)?.label}
                </h1>
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 text-gray-400 hover:text-mot-gold hover:bg-mot-gold/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </motion.div>

              {/* Content Area with tab transitions */}
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <AnimatePresence mode="wait">
                  {activeTab === 'account' && (
                    <motion.div
                      key="account"
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={slideRightVariants}
                      className="space-y-6"
                    >
                      <motion.div
                        className="flex items-center gap-4 p-4 bg-mot-surface rounded-xl border border-mot-border"
                        whileHover={{ borderColor: "rgba(212, 175, 55, 0.3)" }}
                      >
                        <motion.div
                          className="relative"
                          whileHover={{ scale: 1.05 }}
                        >
                          <Avatar
                            src={user?.avatar_url}
                            alt={user?.username}
                            fallback={user?.username?.charAt(0)}
                            size="lg"
                          />
                          <motion.div
                            className="absolute -inset-1 bg-gradient-to-r from-mot-gold to-amber-500 rounded-full opacity-0"
                            whileHover={{ opacity: 0.3 }}
                          />
                        </motion.div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-white">{user?.username}</h3>
                          <p className="text-sm text-gray-400">@{user?.username}</p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => {
                            const profileEditor = document.querySelector('[data-profile-editor-trigger]') as HTMLButtonElement;
                            if (profileEditor) {
                              profileEditor.click();
                              onClose();
                            }
                          }}
                          className="bg-mot-gold/20 border-mot-gold text-mot-gold hover:bg-mot-gold/30"
                        >
                          Change Avatar
                        </Button>
                      </motion.div>

                      <motion.div variants={staggerItem}>
                        <Input
                          label="Username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="username"
                          required
                        />
                      </motion.div>

                      <motion.div variants={staggerItem}>
                        <Input
                          label="Email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="email@example.com"
                          required
                        />
                      </motion.div>

                      <motion.div variants={staggerItem}>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                          Status Text
                        </label>
                        <input
                          type="text"
                          placeholder="What's on your mind?"
                          maxLength={128}
                          className="w-full h-11 px-4 py-2 bg-mot-surface border border-mot-border rounded-lg text-white placeholder-gray-500 focus:border-mot-gold focus:ring-2 focus:ring-mot-gold/20 focus:outline-none transition-all"
                        />
                      </motion.div>
                    </motion.div>
                  )}

                  {activeTab === 'appearance' && (
                    <motion.div
                      key="appearance"
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={slideRightVariants}
                      className="space-y-4"
                    >
                      <p className="text-gray-400">Customize how Unity looks on your device</p>
                      <div className="grid grid-cols-2 gap-4">
                        <motion.button
                          className="p-4 bg-mot-surface border-2 border-mot-gold rounded-xl"
                          whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(212, 175, 55, 0.3)" }}
                        >
                          <div className="aspect-video bg-gradient-to-br from-mot-gold-deep to-mot-black rounded-lg mb-2" />
                          <p className="text-sm font-medium text-white">Dark (Current)</p>
                        </motion.button>
                        <motion.button
                          className="p-4 bg-white/5 border-2 border-white/10 rounded-xl opacity-50"
                          whileHover={{ opacity: 0.7 }}
                        >
                          <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-300 rounded-lg mb-2" />
                          <p className="text-sm font-medium text-white">Light (Coming Soon)</p>
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'keybinds' && (
                    <motion.div
                      key="keybinds"
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={slideRightVariants}
                      className="-m-6"
                    >
                      <KeybindsManager />
                    </motion.div>
                  )}

                  {activeTab === 'notifications' && (
                    <motion.div
                      key="notifications"
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={slideRightVariants}
                      className="space-y-4"
                    >
                      <p className="text-gray-400">Manage your notification preferences</p>
                      {['Direct Messages', 'Server Messages', 'Friend Requests', 'Mentions'].map((item, index) => (
                        <motion.label
                          key={item}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.01, borderColor: "rgba(212, 175, 55, 0.3)" }}
                          className="flex items-center justify-between p-4 bg-mot-surface rounded-xl cursor-pointer transition-colors border border-mot-border"
                        >
                          <span className="text-white">{item}</span>
                          <input
                            type="checkbox"
                            defaultChecked
                            className="w-5 h-5 rounded border-gray-600 text-mot-gold focus:ring-mot-gold"
                          />
                        </motion.label>
                      ))}
                    </motion.div>
                  )}

                  {activeTab === 'privacy' && (
                    <motion.div
                      key="privacy"
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={slideRightVariants}
                      className="space-y-4"
                    >
                      <p className="text-gray-400">Control your privacy and safety settings</p>
                      {['Allow DMs from server members', 'Show online status', 'Allow friend requests'].map((item, index) => (
                        <motion.label
                          key={item}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.01, borderColor: "rgba(212, 175, 55, 0.3)" }}
                          className="flex items-center justify-between p-4 bg-mot-surface rounded-xl cursor-pointer transition-colors border border-mot-border"
                        >
                          <span className="text-white">{item}</span>
                          <input
                            type="checkbox"
                            defaultChecked
                            className="w-5 h-5 rounded border-gray-600 text-mot-gold focus:ring-mot-gold"
                          />
                        </motion.label>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              {activeTab === 'account' && (
                <motion.div
                  className="flex justify-end gap-3 p-6 border-t border-mot-border"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Button variant="secondary" onClick={onClose}>
                    Cancel
                  </Button>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button variant="primary" onClick={handleSave} loading={isLoading}>
                      Save Changes
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

UserSettingsModal.displayName = 'UserSettingsModal';
