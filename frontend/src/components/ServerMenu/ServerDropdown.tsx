import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, UserPlus, LogOut, Shield, FolderPlus,
  ChevronDown, Plus, Palette, Bell, Sparkles, Crown
} from 'lucide-react';
import { useGuildStore } from '../../store/guildStore';
import { useAuthStore } from '../../store/authStore';

interface ServerDropdownProps {
  onOpenServerSettings: () => void;
  onOpenInvite: () => void;
  onCreateChannel: () => void;
  onCreateCategory: () => void;
  onLeaveServer?: () => void;
}

const MenuItem = ({ icon: Icon, label, onClick, variant = 'default', badge }: {
  icon: any;
  label: string;
  onClick?: () => void;
  variant?: 'default' | 'gold' | 'danger';
  badge?: string;
}) => {
  const variants = {
    default: 'text-gray-300 hover:text-white hover:bg-white/5',
    gold: 'text-mot-gold hover:text-mot-gold-light hover:bg-mot-gold/10',
    danger: 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
  };

  return (
    <motion.button
      onClick={onClick}
      className={`w-full px-3 py-2.5 flex items-center gap-3 transition-colors rounded-lg mx-1 ${variants[variant]}`}
      style={{ width: 'calc(100% - 8px)' }}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="text-sm font-medium flex-1 text-left">{label}</span>
      {badge && (
        <span className="text-xs font-bold text-mot-gold">{badge}</span>
      )}
    </motion.button>
  );
};

export const ServerDropdown: React.FC<ServerDropdownProps> = ({
  onOpenServerSettings,
  onOpenInvite,
  onCreateChannel,
  onCreateCategory,
  onLeaveServer
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { currentGuild } = useGuildStore();
  const { user } = useAuthStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!currentGuild) return null;

  const isOwner = currentGuild.owner_id === user?.id;

  return (
    <div ref={dropdownRef} className="relative">
      {/* Server Header Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-12 px-4 flex items-center justify-between border-b border-mot-border hover:bg-mot-gold/5 transition-colors group"
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="font-semibold truncate text-white">{currentGuild.name}</h2>
          {isOwner && (
            <Crown className="w-3.5 h-3.5 text-mot-gold flex-shrink-0" />
          )}
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-mot-gold transition-colors" />
        </motion.div>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute top-full left-2 right-2 bg-mot-surface/95 backdrop-blur-xl border border-mot-gold/20 rounded-xl shadow-2xl z-50 overflow-hidden mt-1"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <div className="py-2">
              {/* Invite People */}
              <MenuItem
                icon={UserPlus}
                label="Invite People"
                variant="gold"
                onClick={() => { onOpenInvite(); setIsOpen(false); }}
              />

              {/* Server Settings (Owner/Admin only) */}
              {isOwner && (
                <MenuItem
                  icon={Settings}
                  label="Server Settings"
                  onClick={() => { onOpenServerSettings(); setIsOpen(false); }}
                />
              )}

              <div className="my-2 mx-3 border-t border-white/10" />

              {/* Create Channel */}
              <MenuItem
                icon={Plus}
                label="Create Channel"
                onClick={() => { onCreateChannel(); setIsOpen(false); }}
              />

              {/* Create Category */}
              <MenuItem
                icon={FolderPlus}
                label="Create Category"
                onClick={() => { onCreateCategory(); setIsOpen(false); }}
              />

              <div className="my-2 mx-3 border-t border-white/10" />

              {/* Notification Settings */}
              <MenuItem icon={Bell} label="Notification Settings" />

              {/* Privacy Settings */}
              <MenuItem icon={Shield} label="Privacy Settings" />

              {!isOwner && (
                <>
                  <div className="my-2 mx-3 border-t border-white/10" />

                  {/* Leave Server */}
                  <MenuItem
                    icon={LogOut}
                    label="Leave Server"
                    variant="danger"
                    onClick={() => { if (onLeaveServer) onLeaveServer(); setIsOpen(false); }}
                  />
                </>
              )}
            </div>

            {/* Server Boost Status */}
            <motion.div
              className="px-3 py-3 border-t border-mot-gold/20 bg-gradient-to-r from-mot-gold/10 to-transparent"
              whileHover={{ backgroundColor: 'rgba(212, 175, 55, 0.15)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="h-4 w-4 text-mot-gold" />
                  </motion.div>
                  <span className="text-sm text-gray-300">Server Boost</span>
                </div>
                <span className="text-sm text-mot-gold font-bold">Level 0</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
