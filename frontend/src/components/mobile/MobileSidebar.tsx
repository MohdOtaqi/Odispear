import React, { useState } from 'react';
import { X, Menu, Hash, Volume2, ChevronDown, ChevronRight, Settings } from 'lucide-react';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  channels: any[];
  currentChannel?: string;
  onChannelClick: (channelId: string) => void;
}

/**
 * Mobile-optimized sidebar with slide-in animation
 * Touch-friendly tap targets (min 44x44px)
 * Smooth transitions and gestures
 */

const MobileSidebar: React.FC<MobileSidebarProps> = ({
  isOpen,
  onClose,
  channels,
  currentChannel,
  onChannelClick
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const handleChannelClick = (channelId: string) => {
    onChannelClick(channelId);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/70 z-40 transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 bottom-0 w-[280px] bg-mot-surface z-50 transform transition-transform duration-300 ease-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-mot-border">
          <h2 className="text-lg font-bold text-white">Channels</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-mot-surface-subtle rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Channels List */}
        <div className="overflow-y-auto h-[calc(100vh-64px)] pb-safe">
          <div className="p-2 space-y-1">
            {channels.map((channel) => {
              if (channel.type === 'category') {
                const isExpanded = expandedCategories.has(channel.id);
                return (
                  <div key={channel.id}>
                    <button
                      onClick={() => toggleCategory(channel.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-mot-surface-subtle rounded-lg transition-all min-h-[44px]"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      <span className="text-xs font-semibold uppercase tracking-wide">
                        {channel.name}
                      </span>
                    </button>
                    {isExpanded && channel.children?.map((child: any) => (
                      <button
                        key={child.id}
                        onClick={() => handleChannelClick(child.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 ml-4 rounded-lg transition-all min-h-[44px] ${
                          currentChannel === child.id
                            ? 'bg-mot-gold/10 text-mot-gold'
                            : 'text-gray-300 hover:bg-mot-surface-subtle hover:text-white'
                        }`}
                      >
                        {child.type === 'voice' ? (
                          <Volume2 className="w-5 h-5 flex-shrink-0" />
                        ) : (
                          <Hash className="w-5 h-5 flex-shrink-0" />
                        )}
                        <span className="truncate">{child.name}</span>
                      </button>
                    ))}
                  </div>
                );
              }

              return (
                <button
                  key={channel.id}
                  onClick={() => handleChannelClick(channel.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all min-h-[44px] ${
                    currentChannel === channel.id
                      ? 'bg-mot-gold/10 text-mot-gold'
                      : 'text-gray-300 hover:bg-mot-surface-subtle hover:text-white'
                  }`}
                >
                  {channel.type === 'voice' ? (
                    <Volume2 className="w-5 h-5 flex-shrink-0" />
                  ) : (
                    <Hash className="w-5 h-5 flex-shrink-0" />
                  )}
                  <span className="truncate">{channel.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-mot-black border-t border-mot-border pb-safe">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-mot-surface hover:bg-mot-surface-subtle rounded-xl transition-all min-h-[48px]">
            <Settings className="w-5 h-5 text-gray-400" />
            <span className="text-white font-medium">Settings</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default MobileSidebar;
