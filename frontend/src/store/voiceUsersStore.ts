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
  removeUserFromAllChannels: (userId: string) => void;
  updateUserState: (channelId: string, userId: string, state: { muted?: boolean; deafened?: boolean }) => void;
  clearChannel: (channelId: string) => void;
  clearAll: () => void;
  fetchGuildVoiceUsers: (guildId: string) => Promise<void>;
  initializeListeners: () => void;
}

export const useVoiceUsersStore = create<VoiceUsersState>((set, get) => ({
  voiceChannelUsers: {},

  addUser: (channelId, user) => {
    console.log('[VoiceStore] addUser called:', { channelId, userId: user.id, username: user.username });
    set((state) => {
      // First, remove the user from ALL channels (prevents duplicate appearances)
      const cleanedChannels: Record<string, VoiceUser[]> = {};
      let removedFromChannels: string[] = [];
      for (const [chId, users] of Object.entries(state.voiceChannelUsers)) {
        const hadUser = users.some(u => u.id === user.id);
        cleanedChannels[chId] = users.filter(u => u.id !== user.id);
        if (hadUser && chId !== channelId) {
          removedFromChannels.push(chId);
        }
      }
      console.log('[VoiceStore] Removed user from channels:', removedFromChannels);

      // Now add the user to the new channel
      const currentUsers = cleanedChannels[channelId] || [];
      const newState = {
        voiceChannelUsers: {
          ...cleanedChannels,
          [channelId]: [...currentUsers, user],
        },
      };
      console.log('[VoiceStore] New state:', Object.keys(newState.voiceChannelUsers).map(k => `${k}: ${newState.voiceChannelUsers[k].length} users`));
      return newState;
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

  removeUserFromAllChannels: (userId) => {
    set((state) => {
      const cleanedChannels: Record<string, VoiceUser[]> = {};
      for (const [chId, users] of Object.entries(state.voiceChannelUsers)) {
        cleanedChannels[chId] = users.filter(u => u.id !== userId);
      }
      return { voiceChannelUsers: cleanedChannels };
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

      // IMPORTANT: Merge with existing state instead of replacing
      // This prevents stale API data from overwriting socket-updated clean state
      set((state) => {
        const newState = { ...state.voiceChannelUsers };

        // Only add data for channels we don't already have data for
        // Socket events should take priority over API data
        for (const [channelId, users] of Object.entries(response.data as Record<string, VoiceUser[]>)) {
          // If we already have users for this channel from sockets, don't overwrite
          if (!newState[channelId] || newState[channelId].length === 0) {
            newState[channelId] = users;
          }
        }

        console.log('[VoiceStore] Merged state (not replaced):', Object.keys(newState).map(k => `${k}: ${newState[k]?.length || 0} users`));
        return { voiceChannelUsers: newState };
      });
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
      console.log('[VoiceStore] Voice participants received for channel:', data.channel_id, 'with', data.participants.length, 'participants');

      // IMPORTANT: When we receive participants for a new channel,
      // remove ANY of these users from ALL other channels to prevent duplicates
      set((state) => {
        // Get the user IDs from the new participants
        const participantUserIds = data.participants.map(p => p.user_id);

        // Clean up these users from all OTHER channels
        const cleanedChannels: Record<string, VoiceUser[]> = {};
        for (const [chId, users] of Object.entries(state.voiceChannelUsers)) {
          if (chId !== data.channel_id) {
            // Filter out users who are in the new channel's participants
            cleanedChannels[chId] = users.filter(u => !participantUserIds.includes(u.id));
            if (cleanedChannels[chId].length === 0) {
              delete cleanedChannels[chId]; // Remove empty channel entries
            }
          }
        }

        // Now set the new channel's participants
        const newState = {
          ...cleanedChannels,
          [data.channel_id]: data.participants.map(p => ({
            id: p.user_id,
            username: p.username,
            avatar_url: p.avatar_url,
            muted: p.muted || false,
            deafened: p.deafened || false,
          })),
        };

        console.log('[VoiceStore] After voice.participants cleanup:', Object.keys(newState).map(k => `${k}: ${newState[k]?.length || 0} users`));
        return { voiceChannelUsers: newState };
      });
    });
  },
}));
