import React, { useState } from 'react';
import { Circle, Moon, MinusCircle, XCircle, Smile } from 'lucide-react';

interface UserStatusSelectorProps {
  currentStatus: 'online' | 'idle' | 'dnd' | 'offline';
  customStatus?: string;
  onStatusChange: (status: 'online' | 'idle' | 'dnd' | 'offline') => void;
  onCustomStatusChange: (status: string) => void;
}

const UserStatusSelector: React.FC<UserStatusSelectorProps> = ({
  currentStatus,
  customStatus,
  onStatusChange,
  onCustomStatusChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customText, setCustomText] = useState(customStatus || '');

  const statuses = [
    {
      id: 'online' as const,
      label: 'Online',
      icon: Circle,
      color: 'text-green-500',
      bgColor: 'bg-green-500',
      description: 'Let everyone know you\'re here!',
    },
    {
      id: 'idle' as const,
      label: 'Idle',
      icon: Moon,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500',
      description: 'Away from keyboard',
    },
    {
      id: 'dnd' as const,
      label: 'Do Not Disturb',
      icon: MinusCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-500',
      description: 'You won\'t receive notifications',
    },
    {
      id: 'offline' as const,
      label: 'Invisible',
      icon: XCircle,
      color: 'text-gray-500',
      bgColor: 'bg-gray-500',
      description: 'Appear offline to others',
    },
  ];

  const currentStatusConfig = statuses.find(s => s.id === currentStatus);

  return (
    <div className="relative">
      {/* Status Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors w-full group"
      >
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center font-bold">
            U
          </div>
          <div className={`absolute bottom-0 right-0 w-3 h-3 ${currentStatusConfig?.bgColor} rounded-full border-2 border-[#1e1f22]`} />
        </div>
        <div className="flex-1 text-left min-w-0">
          <div className="text-sm font-semibold text-white truncate">Username</div>
          {customStatus && (
            <div className="text-xs text-gray-400 truncate">{customStatus}</div>
          )}
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-full left-0 mb-2 w-64 bg-[#1e1f22] rounded-lg shadow-2xl border border-purple-600/20 overflow-hidden z-50 animate-scale-in">
            {/* Custom Status */}
            <div className="p-3 border-b border-white/5">
              <div className="text-xs font-semibold text-gray-400 mb-2">SET A CUSTOM STATUS</div>
              <div className="flex gap-2">
                <button className="p-2 bg-[#2b2d31] hover:bg-[#383a40] rounded transition-colors">
                  <Smile className="w-4 h-4 text-gray-400" />
                </button>
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  onBlur={() => onCustomStatusChange(customText)}
                  placeholder="What's on your mind?"
                  className="flex-1 bg-[#2b2d31] border border-white/5 rounded px-3 py-1 text-sm text-white focus:border-purple-500 focus:outline-none"
                  maxLength={128}
                />
              </div>
            </div>

            {/* Status Options */}
            <div className="p-2">
              {statuses.map((status) => (
                <button
                  key={status.id}
                  onClick={() => {
                    onStatusChange(status.id);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded transition-all hover-lift
                    ${currentStatus === status.id ? 'bg-purple-600/20' : 'hover:bg-white/5'}
                  `}
                >
                  <status.icon className={`w-4 h-4 ${status.color}`} />
                  <div className="flex-1 text-left">
                    <div className="text-sm font-semibold text-white">{status.label}</div>
                    <div className="text-xs text-gray-400">{status.description}</div>
                  </div>
                  {currentStatus === status.id && (
                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserStatusSelector;
