import { create } from 'zustand';
import { dmAPI } from '../lib/api';
import { socketManager } from '../lib/socket';
import toast from 'react-hot-toast';

interface DMChannel {
  id: string;
  type: 'dm' | 'group_dm';
  name?: string;
  icon_url?: string;
  participants: DMParticipant[];
  last_message?: DMMessage;
  created_at: string;
}

interface DMParticipant {
  id: string;
  user_id: string;
  dm_channel_id: string;
  username: string;
  avatar_url?: string;
  status?: string;
}

interface DMMessage {
  id: string;
  dm_channel_id: string;
  author_id: string;
  author_username: string;
  author_avatar?: string;
  content: string;
  attachments?: any[];
  reply_to_id?: string;
  created_at: string;
  edited_at?: string;
}

interface DMStore {
  dmChannels: DMChannel[];
  currentDMChannel: DMChannel | null;
  messages: Record<string, DMMessage[]>;
  typingUsers: Record<string, string[]>;
  loading: boolean;
  error: string | null;

  // Actions
  fetchDMChannels: () => Promise<void>;
  createDM: (userId: string) => Promise<DMChannel | null>;
  createGroupDM: (userIds: string[], name?: string) => Promise<DMChannel | null>;
  selectDMChannel: (dmChannelId: string) => void;
  loadDMMessages: (dmChannelId: string) => Promise<void>;
  sendDMMessage: (dmChannelId: string, content: string, attachments?: any[]) => Promise<void>;
  updateDMMessage: (messageId: string, content: string) => Promise<void>;
  deleteDMMessage: (messageId: string) => Promise<void>;
  addDMReaction: (messageId: string, emoji: string) => Promise<void>;
  removeDMReaction: (messageId: string, emoji: string) => Promise<void>;
  leaveGroupDM: (dmChannelId: string) => Promise<void>;

  // WebSocket handlers
  handleNewDMMessage: (message: DMMessage) => void;
  handleDMMessageUpdate: (message: DMMessage) => void;
  handleDMMessageDelete: (data: { message_id: string; dm_channel_id: string }) => void;
  handleDMTypingStart: (data: { user_id: string; username: string; dm_channel_id: string }) => void;
  handleDMTypingStop: (data: { user_id: string; dm_channel_id: string }) => void;
}

export const useDMStore = create<DMStore>((set, get) => ({
  dmChannels: [],
  currentDMChannel: null,
  messages: {},
  typingUsers: {},
  loading: false,
  error: null,

  fetchDMChannels: async () => {
    set({ loading: true, error: null });
    try {
      const response = await dmAPI.getDMChannels();
      set({ dmChannels: response.data, loading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to fetch DM channels', loading: false });
      toast.error('Failed to load DM channels');
    }
  },

  createDM: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await dmAPI.createDM(userId);
      const dmChannel = response.data;

      set((state) => ({
        dmChannels: [dmChannel, ...state.dmChannels],
        currentDMChannel: dmChannel,
        loading: false,
      }));

      // Join the DM channel via WebSocket
      socketManager.emit('dm.join', { dm_channel_id: dmChannel.id });

      toast.success('DM channel created');
      return dmChannel;
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to create DM', loading: false });
      toast.error(error.response?.data?.error || 'Failed to create DM');
      return null;
    }
  },

  createGroupDM: async (userIds: string[], name?: string) => {
    set({ loading: true, error: null });
    try {
      const response = await dmAPI.createGroupDM(userIds, name);
      const dmChannel = response.data;

      set((state) => ({
        dmChannels: [dmChannel, ...state.dmChannels],
        currentDMChannel: dmChannel,
        loading: false,
      }));

      socketManager.emit('dm.join', { dm_channel_id: dmChannel.id });
      toast.success('Group DM created');
      return dmChannel;
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to create group DM', loading: false });
      toast.error('Failed to create group DM');
      return null;
    }
  },

  selectDMChannel: (dmChannelId: string) => {
    const channel = get().dmChannels.find((c) => c.id === dmChannelId);
    if (channel) {
      // Leave previous channel
      if (get().currentDMChannel) {
        socketManager.emit('dm.leave', { dm_channel_id: get().currentDMChannel!.id });
      }

      set({ currentDMChannel: channel });
      socketManager.emit('dm.join', { dm_channel_id: dmChannelId });

      // Load messages if not already loaded
      if (!get().messages[dmChannelId]) {
        get().loadDMMessages(dmChannelId);
      }
    }
  },

  loadDMMessages: async (dmChannelId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await dmAPI.getDMMessages(dmChannelId, { limit: 50 });
      set((state) => ({
        messages: {
          ...state.messages,
          [dmChannelId]: response.data,
        },
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to load messages', loading: false });
      toast.error('Failed to load messages');
    }
  },

  sendDMMessage: async (dmChannelId: string, content: string, attachments?: any[]) => {
    try {
      // Send message to API - the WebSocket event will add it to the store
      // This prevents duplicates from both API response + WebSocket event
      await dmAPI.sendDMMessage(dmChannelId, { content, attachments });
    } catch (error: any) {
      toast.error('Failed to send message');
    }
  },

  updateDMMessage: async (messageId: string, content: string) => {
    try {
      await dmAPI.updateDMMessage(messageId, { content });
      // Message will be updated via WebSocket event
    } catch (error: any) {
      toast.error('Failed to update message');
    }
  },

  deleteDMMessage: async (messageId: string) => {
    try {
      await dmAPI.deleteDMMessage(messageId);
      // Message will be removed via WebSocket event
    } catch (error: any) {
      toast.error('Failed to delete message');
    }
  },

  addDMReaction: async (messageId: string, emoji: string) => {
    try {
      await dmAPI.addDMReaction(messageId, emoji);
    } catch (error: any) {
      toast.error('Failed to add reaction');
    }
  },

  removeDMReaction: async (messageId: string, emoji: string) => {
    try {
      await dmAPI.removeDMReaction(messageId, emoji);
    } catch (error: any) {
      toast.error('Failed to remove reaction');
    }
  },

  leaveGroupDM: async (dmChannelId: string) => {
    try {
      await dmAPI.leaveGroupDM(dmChannelId);
      set((state) => ({
        dmChannels: state.dmChannels.filter((c) => c.id !== dmChannelId),
        currentDMChannel: state.currentDMChannel?.id === dmChannelId ? null : state.currentDMChannel,
      }));
      socketManager.emit('dm.leave', { dm_channel_id: dmChannelId });
      toast.success('Left group DM');
    } catch (error: any) {
      toast.error('Failed to leave group DM');
    }
  },

  // WebSocket handlers
  handleNewDMMessage: (message: DMMessage) => {
    set((state) => {
      const channelMessages = state.messages[message.dm_channel_id] || [];
      // Avoid duplicates (sender already added their message)
      if (channelMessages.some((m) => m.id === message.id)) {
        return state;
      }
      return {
        messages: {
          ...state.messages,
          [message.dm_channel_id]: [...channelMessages, message],
        },
      };
    });

    // Update last message in channel list
    set((state) => ({
      dmChannels: state.dmChannels.map((c) =>
        c.id === message.dm_channel_id ? { ...c, last_message: message } : c
      ),
    }));
  },

  handleDMMessageUpdate: (message: DMMessage) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [message.dm_channel_id]: state.messages[message.dm_channel_id]?.map((m) =>
          m.id === message.id ? message : m
        ) || [],
      },
    }));
  },

  handleDMMessageDelete: (data: { message_id: string; dm_channel_id: string }) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [data.dm_channel_id]: state.messages[data.dm_channel_id]?.filter(
          (m) => m.id !== data.message_id
        ) || [],
      },
    }));
  },

  handleDMTypingStart: (data: { user_id: string; username: string; dm_channel_id: string }) => {
    set((state) => {
      const currentTyping = state.typingUsers[data.dm_channel_id] || [];
      if (!currentTyping.includes(data.username)) {
        return {
          typingUsers: {
            ...state.typingUsers,
            [data.dm_channel_id]: [...currentTyping, data.username],
          },
        };
      }
      return state;
    });

    // Auto-remove after 5 seconds
    setTimeout(() => {
      get().handleDMTypingStop({ user_id: data.user_id, dm_channel_id: data.dm_channel_id });
    }, 5000);
  },

  handleDMTypingStop: (data: { user_id: string; dm_channel_id: string }) => {
    set((state) => ({
      typingUsers: {
        ...state.typingUsers,
        [data.dm_channel_id]: (state.typingUsers[data.dm_channel_id] || []).filter(
          (username) => username !== data.user_id
        ),
      },
    }));
  },
}));
