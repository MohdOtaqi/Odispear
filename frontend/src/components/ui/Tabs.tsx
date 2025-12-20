import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface Tab {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  variant?: 'underline' | 'pills' | 'segment';
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
  variant = 'underline'
}) => {
  const containerStyles = {
    underline: 'flex gap-1 border-b border-mot-border',
    pills: 'flex gap-2 p-1 bg-mot-surface rounded-xl',
    segment: 'flex p-1 bg-mot-surface-subtle rounded-lg border border-mot-border',
  };

  const activeStyles = {
    underline: 'text-mot-gold',
    pills: 'text-mot-black',
    segment: 'text-mot-black',
  };

  const inactiveStyles = {
    underline: 'text-gray-400 hover:text-white',
    pills: 'text-gray-400 hover:text-white',
    segment: 'text-gray-400 hover:text-white',
  };

  return (
    <div className={cn(containerStyles[variant], className)}>
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;

        return (
          <motion.button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative flex items-center gap-2 px-4 py-2.5 font-medium transition-colors z-10',
              variant === 'underline' && '-mb-px',
              variant === 'segment' && 'flex-1 justify-center rounded-md',
              variant === 'pills' && 'rounded-lg',
              isActive ? activeStyles[variant] : inactiveStyles[variant]
            )}
            whileHover={{ scale: variant !== 'segment' ? 1.02 : 1 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Active indicator - sliding */}
            {isActive && variant === 'underline' && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-mot-gold rounded-full"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}

            {isActive && variant === 'pills' && (
              <motion.div
                layoutId="activeTabPill"
                className="absolute inset-0 bg-mot-gold rounded-lg"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}

            {isActive && variant === 'segment' && (
              <motion.div
                layoutId="activeTabSegment"
                className="absolute inset-0 bg-mot-gold rounded-md shadow-lg"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}

            <span className="relative z-10 flex items-center gap-2">
              {tab.icon && <tab.icon className="w-4 h-4" />}
              {tab.label}
              {tab.badge !== undefined && (
                <motion.span
                  className={cn(
                    "px-1.5 py-0.5 text-xs rounded-full",
                    isActive
                      ? "bg-white/20 text-current"
                      : "bg-gray-500/30 text-gray-400"
                  )}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  {tab.badge}
                </motion.span>
              )}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
};

export default Tabs;
