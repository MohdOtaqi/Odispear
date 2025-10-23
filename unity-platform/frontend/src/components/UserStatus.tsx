import React, { useState, useRef, useEffect } from 'react';
import { Circle, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import toast from 'react-hot-toast';

type UserStatus = 'online' | 'idle' | 'dnd' | 'offline';

interface StatusOption {
  value: UserStatus;
  label: string;
  color: string;
  description: string;
}

const STATUS_OPTIONS: StatusOption[] = [
  { value: 'online', label: 'Online', color: '#23a55a', description: 'Available to chat' },
  { value: 'idle', label: 'Idle', color: '#f0b232', description: 'Away from keyboard' },
  { value: 'dnd', label: 'Do Not Disturb', color: '#f23f43', description: 'Do not disturb me' },
  { value: 'offline', label: 'Invisible', color: '#80848e', description: 'Appear offline' },
];

export const UserStatus: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentStatus = (user?.status as UserStatus) || 'online';
  const currentStatusOption = STATUS_OPTIONS.find(s => s.value === currentStatus) || STATUS_OPTIONS[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStatusChange = async (newStatus: UserStatus) => {
    if (newStatus === currentStatus || loading) return;

    setLoading(true);
    try {
      const { data } = await api.patch('/status/update', { status: newStatus });
      updateUser({ ...user, status: newStatus });
      toast.success(`Status changed to ${STATUS_OPTIONS.find(s => s.value === newStatus)?.label}`);
      setIsOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-lg transition-colors w-full"
        disabled={loading}
      >
        <Circle
          className="w-3 h-3"
          style={{ fill: currentStatusOption.color, color: currentStatusOption.color }}
        />
        <span className="text-sm text-gray-300 flex-1 text-left">{currentStatusOption.label}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-56 bg-[#1e1f22] rounded-lg shadow-2xl border border-white/10 overflow-hidden animate-scale-in z-50">
          <div className="p-2">
            <div className="text-xs font-semibold text-gray-400 uppercase px-2 py-1 mb-1">
              Set Status
            </div>
            {STATUS_OPTIONS.map((status) => {
              const isActive = status.value === currentStatus;
              return (
                <button
                  key={status.value}
                  onClick={() => handleStatusChange(status.value)}
                  disabled={loading}
                  className={`w-full flex items-start gap-3 px-2 py-2 rounded hover:bg-purple-500/20 transition-colors ${
                    isActive ? 'bg-purple-500/10' : ''
                  }`}
                >
                  <Circle
                    className="w-4 h-4 mt-0.5 flex-shrink-0"
                    style={{ fill: status.color, color: status.color }}
                  />
                  <div className="flex-1 text-left">
                    <div className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-300'}`}>
                      {status.label}
                    </div>
                    <div className="text-xs text-gray-500">
                      {status.description}
                    </div>
                  </div>
                  {isActive && (
                    <Circle className="w-2 h-2 fill-purple-500 text-purple-500 mt-1.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
