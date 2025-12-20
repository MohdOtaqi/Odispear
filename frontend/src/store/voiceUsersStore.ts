import { create } from 'zustand';
import { socketManager } from '../lib/socket';
import api from '../lib/api';

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
  clearAll: () => void;
  fetchGuildVoiceUsers: (guildId: string) => Promise<void>;
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

  clearAll: () => {
    set({ voiceChannelUsers: {} });
  },

  fetchGuildVoiceUsers: async (guildId: string) => {
    try {
      const response = await api.get(`/voice/guilds/${guildId}/users`);
      console.log('[VoiceStore] Fetched voice users for guild:', guildId, response.data);
      set({ voiceChannelUsers: response.data });
    } catch (error) {
      console.error('[VoiceStore] Failed to fetch voice users:', error);
    }
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
      console.log('[VoiceStore] Received voice.user_joined event:', data);
      get().addUser(data.channel_id, {
        id: data.user_id,
        username: data.username,
        avatar_url: data.avatar_url,
        muted: data.muted || false,
        deafened: data.deafened || false,
      });
      console.log('[VoiceStore] Updated voiceChannelUsers:', get().voiceChannelUsers);
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

    // Handle initial participants list when joining a channel
    socketManager.on('voice.participants', (data: {
      channel_id: string;
      participants: Array<{
        user_id: string;
        username: string;
        avatar_url?: string;
        muted?: boolean;
        deafened?: boolean;
      }>;
    }) => {
      console.log('[VoiceStore] Voice participants:', data);
      // Set all participants for this channel
      set((state) => ({
        voiceChannelUsers: {
          ...state.voiceChannelUsers,
          [data.channel_id]: data.participants.map(p => ({
            id: p.user_id,
            username: p.username,
            avatar_url: p.avatar_url,
            muted: p.muted || false,
            deafened: p.deafened || false,
          })),
        },
      }));
    });
  },
}));
