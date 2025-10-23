import { create } from 'zustand';
import { channelAPI } from '../lib/api';
import { socketManager } from '../lib/socket';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  channel_id: string;
  author_id: string;
  content: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  created_at: string;
  edited_at?: string;
  reply_to_id?: string;
  attachments?: any[];
}

interface MessageState {
  messages: Record<string, Message[]>;
  currentChannelId: string | null;
  isLoading: boolean;
  error: string | null;
  typingUsers: Record<string, Set<string>>;
  loadMessages: (channelId: string) => Promise<void>;
  sendMessage: (channelId: string, content: string, replyToId?: string) => Promise<void>;
  updateMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  setCurrentChannel: (channelId: string) => void;
  handleNewMessage: (message: Message) => void;
  handleMessageUpdate: (message: Message) => void;
  handleMessageDelete: (data: { message_id: string }) => void;
  handleTypingStart: (data: { user_id: string; username: string; channel_id: string }) => void;
  handleTypingStop: (data: { user_id: string; channel_id: string }) => void;
  clearError: () => void;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  messages: {},
  currentChannelId: null,
  isLoading: false,
  error: null,
  typingUsers: {},

  loadMessages: async (channelId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await channelAPI.getMessages(channelId, { limit: 50 });
      set((state) => ({
        messages: {
          ...state.messages,
          [channelId]: response.data.reverse(), // Reverse to show oldest first
        },
        isLoading: false,
      }));
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to load messages';
      set({ error: errorMsg, isLoading: false });
      toast.error(errorMsg);
    }
  },

  sendMessage: async (channelId: string, content: string, replyToId?: string) => {
    try {
      await channelAPI.sendMessage(channelId, {
        content,
        reply_to_id: replyToId,
      });
      // Message will be added via WebSocket event
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to send message';
      set({ error: errorMsg });
      toast.error(errorMsg);
      throw error;
    }
  },

  updateMessage: async (messageId: string, content: string) => {
    try {
      await channelAPI.updateMessage(messageId, { content });
      // Message will be updated via WebSocket event
      toast.success('Message updated');
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to update message';
      set({ error: errorMsg });
      toast.error(errorMsg);
      throw error;
    }
  },

  deleteMessage: async (messageId: string) => {
    try {
      await channelAPI.deleteMessage(messageId);
      // Message will be removed via WebSocket event
      toast.success('Message deleted');
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to delete message';
      set({ error: errorMsg });
      toast.error(errorMsg);
      throw error;
    }
  },

  addReaction: async (messageId: string, emoji: string) => {
    try {
      await channelAPI.addReaction(messageId, emoji);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to add reaction';
      set({ error: errorMsg });
      toast.error(errorMsg);
    }
  },

  setCurrentChannel: (channelId: string) => {
    const { currentChannelId } = get();
    
    // Leave previous channel
    if (currentChannelId && currentChannelId !== channelId) {
      socketManager.leaveChannel(currentChannelId);
    }
    
    set({ currentChannelId: channelId });
    socketManager.joinChannel(channelId);
  },

  handleNewMessage: (message: Message) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [message.channel_id]: [
          ...(state.messages[message.channel_id] || []),
          message,
        ],
      },
    }));
  },

  handleMessageUpdate: (message: Message) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [message.channel_id]: (state.messages[message.channel_id] || []).map(
          (m) => (m.id === message.id ? message : m)
        ),
      },
    }));
  },

  handleMessageDelete: (data: { message_id: string }) => {
    set((state) => {
      const newMessages = { ...state.messages };
      Object.keys(newMessages).forEach((channelId) => {
        newMessages[channelId] = newMessages[channelId].filter(
          (m) => m.id !== data.message_id
        );
      });
      return { messages: newMessages };
    });
  },

  handleTypingStart: (data) => {
    set((state) => {
      const newTypingUsers = { ...state.typingUsers };
      if (!newTypingUsers[data.channel_id]) {
        newTypingUsers[data.channel_id] = new Set();
      }
      newTypingUsers[data.channel_id].add(data.username);
      return { typingUsers: newTypingUsers };
    });

    setTimeout(() => {
      get().handleTypingStop({
        user_id: data.user_id,
        channel_id: data.channel_id,
      });
    }, 5000);
  },

  handleTypingStop: (data) => {
    set((state) => {
      const newTypingUsers = { ...state.typingUsers };
      if (newTypingUsers[data.channel_id]) {
        newTypingUsers[data.channel_id] = new Set(
          Array.from(newTypingUsers[data.channel_id])
        );
      }
      return { typingUsers: newTypingUsers };
    });
  },

  clearError: () => set({ error: null }),
}));
