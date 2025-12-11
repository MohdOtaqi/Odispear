import { create } from 'zustand';
import { socketManager } from '../lib/socket';

interface VoiceUser {
  id: string;
  username: string;
  avatar_url?: string;
  muted?: boolean;
  deafened?: boolean;
}

interface VoiceUsersState {
  // Map of channel_id -> array of users
  voiceChannelUsers: Record<string, VoiceUser[]>;
  
  // Actions
  addUser: (channelId: string, user: VoiceUser) => void;
  removeUser: (channelId: string, userId: string) => void;
  updateUserState: (channelId: string, userId: string, state: { muted?: boolean; deafened?: boolean }) => void;
  clearChannel: (channelId: string) => void;
  initializeListeners: () => void;
}

export const useVoiceUsersStore = create<VoiceUsersState>((set, get) => ({
  voiceChannelUsers: {},

  addUser: (channelId, user) => {
    set((state) => {
      const currentUsers = state.voiceChannelUsers[channelId] || [];
      // Don't add if already exists
      if (currentUsers.some(u => u.id === user.id)) {
        return state;
      }
      return {
        voiceChannelUsers: {
          ...state.voiceChannelUsers,
          [channelId]: [...currentUsers, user],
        },
      };
    });
  },

  removeUser: (channelId, userId) => {
    set((state) => {
      const currentUsers = state.voiceChannelUsers[channelId] || [];
      return {
        voiceChannelUsers: {
          ...state.voiceChannelUsers,
          [channelId]: currentUsers.filter(u => u.id !== userId),
        },
      };
    });
  },

  updateUserState: (channelId, userId, newState) => {
    set((state) => {
      const currentUsers = state.voiceChannelUsers[channelId] || [];
      return {
        voiceChannelUsers: {
          ...state.voiceChannelUsers,
          [channelId]: currentUsers.map(u => 
            u.id === userId ? { ...u, ...newState } : u
          ),
        },
      };
    });
  },

  clearChannel: (channelId) => {
    set((state) => {
      const newUsers = { ...state.voiceChannelUsers };
      delete newUsers[channelId];
      return { voiceChannelUsers: newUsers };
    });
  },

  initializeListeners: () => {
    // Listen for voice events from WebSocket
    socketManager.on('voice.user_joined', (data: {
      user_id: string;
      username: string;
      avatar_url?: string;
      channel_id: string;
      muted?: boolean;
      deafened?: boolean;
    }) => {
      console.log('[VoiceStore] User joined voice:', data);
      get().addUser(data.channel_id, {
        id: data.user_id,
        username: data.username,
        avatar_url: data.avatar_url,
        muted: data.muted || false,
        deafened: data.deafened || false,
      });
    });

    socketManager.on('voice.user_left', (data: {
      user_id: string;
      channel_id: string;
    }) => {
      console.log('[VoiceStore] User left voice:', data);
      get().removeUser(data.channel_id, data.user_id);
    });

    socketManager.on('voice.state_update', (data: {
      user_id: string;
      channel_id: string;
      muted?: boolean;
      deafened?: boolean;
    }) => {
      console.log('[VoiceStore] Voice state update:', data);
      get().updateUserState(data.channel_id, data.user_id, {
        muted: data.muted,
        deafened: data.deafened,
      });
    });
  },
}));
