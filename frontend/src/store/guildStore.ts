import { create } from 'zustand';
import { guildAPI, channelAPI } from '../lib/api';
import toast from 'react-hot-toast';

interface Guild {
  id: string;
  name: string;
  description?: string;
  icon_url?: string;
  banner_url?: string;
  owner_id: string;
  template_type?: string;
}

interface Channel {
  id: string;
  guild_id: string;
  name: string;
  type: 'text' | 'voice' | 'stage' | 'docs';
  topic?: string;
  position: number;
  parent_id?: string;
}

interface GuildState {
  guilds: Guild[];
  currentGuild: Guild | null;
  channels: Channel[];
  isLoading: boolean;
  error: string | null;
  fetchGuilds: () => Promise<void>;
  createGuild: (data: any) => Promise<Guild>;
  selectGuild: (guildId: string) => Promise<void>;
  updateGuild: (guildId: string, data: any) => Promise<void>;
  deleteGuild: (guildId: string) => Promise<void>;
  createChannel: (guildId: string, data: any) => Promise<void>;
  deleteChannel: (channelId: string) => Promise<void>;
  joinGuildByInvite: (code: string) => Promise<void>;
  clearError: () => void;
}

export const useGuildStore = create<GuildState>((set, get) => ({
  guilds: [],
  currentGuild: null,
  channels: [],
  isLoading: false,
  error: null,

  fetchGuilds: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await guildAPI.getUserGuilds();
      set({ guilds: response.data, isLoading: false });
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to fetch guilds';
      set({ error: errorMsg, isLoading: false });
      toast.error(errorMsg);
    }
  },

  createGuild: async (data: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await guildAPI.create(data);
      const newGuild = response.data;
      set((state) => ({
        guilds: [...state.guilds, newGuild],
        isLoading: false,
      }));
      toast.success(`Server "${newGuild.name}" created!`);
      return newGuild;
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to create guild';
      set({ error: errorMsg, isLoading: false });
      toast.error(errorMsg);
      throw error;
    }
  },

  selectGuild: async (guildId: string) => {
    set({ isLoading: true, error: null });
    try {
      const [guildResponse, channelsResponse] = await Promise.all([
        guildAPI.getGuild(guildId),
        channelAPI.getGuildChannels(guildId),
      ]);

      set({
        currentGuild: guildResponse.data,
        channels: channelsResponse.data,
        isLoading: false,
      });

      // Join guild room for real-time voice events
      import('../lib/socket').then(({ socketManager }) => {
        socketManager.joinGuild(guildId);
      });
      
      // Fetch voice users for this guild (async, don't block)
      import('../store/voiceUsersStore').then(({ useVoiceUsersStore }) => {
        useVoiceUsersStore.getState().fetchGuildVoiceUsers(guildId);
      });
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to load guild';
      set({ error: errorMsg, isLoading: false });
      toast.error(errorMsg);
    }
  },

  updateGuild: async (guildId: string, data: any) => {
    try {
      const response = await guildAPI.updateGuild(guildId, data);
      set((state) => ({
        guilds: state.guilds.map((g) =>
          g.id === guildId ? response.data : g
        ),
        currentGuild:
          state.currentGuild?.id === guildId
            ? response.data
            : state.currentGuild,
      }));
      toast.success('Server updated');
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to update guild';
      set({ error: errorMsg });
      toast.error(errorMsg);
      throw error;
    }
  },

  deleteGuild: async (guildId: string) => {
    try {
      await guildAPI.deleteGuild(guildId);
      set((state) => ({
        guilds: state.guilds.filter((g) => g.id !== guildId),
        currentGuild:
          state.currentGuild?.id === guildId ? null : state.currentGuild,
      }));
      toast.success('Server deleted');
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to delete guild';
      set({ error: errorMsg });
      toast.error(errorMsg);
      throw error;
    }
  },

  createChannel: async (guildId: string, data: any) => {
    try {
      const response = await channelAPI.create(guildId, data);
      set((state) => ({
        channels: [...state.channels, response.data],
      }));
      toast.success(`Channel "${response.data.name}" created`);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to create channel';
      set({ error: errorMsg });
      toast.error(errorMsg);
      throw error;
    }
  },

  deleteChannel: async (channelId: string) => {
    try {
      await channelAPI.deleteChannel(channelId);
      set((state) => ({
        channels: state.channels.filter((c) => c.id !== channelId),
      }));
      toast.success('Channel deleted');
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to delete channel';
      set({ error: errorMsg });
      toast.error(errorMsg);
      throw error;
    }
  },

  joinGuildByInvite: async (code: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await guildAPI.joinByInvite(code);
      await get().fetchGuilds();
      set({ isLoading: false });
      toast.success(`Joined server "${response.data.guild.name}"!`);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to join guild';
      set({ error: errorMsg, isLoading: false });
      toast.error(errorMsg);
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
