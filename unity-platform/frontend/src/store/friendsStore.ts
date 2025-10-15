import { create } from 'zustand';
import { friendsAPI } from '../lib/api';
import toast from 'react-hot-toast';

interface Friend {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  status_text?: string;
  friends_since?: string;
}

interface FriendRequest {
  request_id: string;
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  status: string;
  created_at: string;
}

interface FriendsState {
  friends: Friend[];
  pendingRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  blocked: any[];
  isLoading: boolean;
  error: string | null;
  fetchFriends: () => Promise<void>;
  fetchPendingRequests: () => Promise<void>;
  fetchSentRequests: () => Promise<void>;
  sendFriendRequest: (username: string) => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  rejectFriendRequest: (requestId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
  searchUsers: (query: string) => Promise<any[]>;
  clearError: () => void;
}

export const useFriendsStore = create<FriendsState>((set, get) => ({
  friends: [],
  pendingRequests: [],
  sentRequests: [],
  blocked: [],
  isLoading: false,
  error: null,

  fetchFriends: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await friendsAPI.getFriends();
      set({ friends: response.data, isLoading: false });
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to fetch friends';
      set({ error: errorMsg, isLoading: false });
      toast.error(errorMsg);
    }
  },

  fetchPendingRequests: async () => {
    try {
      const response = await friendsAPI.getPendingRequests();
      set({ pendingRequests: response.data });
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to fetch requests';
      set({ error: errorMsg });
      toast.error(errorMsg);
    }
  },

  fetchSentRequests: async () => {
    try {
      const response = await friendsAPI.getSentRequests();
      set({ sentRequests: response.data });
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to fetch sent requests';
      set({ error: errorMsg });
      toast.error(errorMsg);
    }
  },

  sendFriendRequest: async (username: string) => {
    set({ isLoading: true, error: null });
    try {
      await friendsAPI.sendRequest(username);
      await get().fetchSentRequests();
      set({ isLoading: false });
      toast.success('Friend request sent');
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to send friend request';
      set({ error: errorMsg, isLoading: false });
      toast.error(errorMsg);
      throw error;
    }
  },

  acceptFriendRequest: async (requestId: string) => {
    try {
      await friendsAPI.acceptRequest(requestId);
      await get().fetchFriends();
      await get().fetchPendingRequests();
      toast.success('Friend request accepted');
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to accept request';
      set({ error: errorMsg });
      toast.error(errorMsg);
      throw error;
    }
  },

  rejectFriendRequest: async (requestId: string) => {
    try {
      await friendsAPI.rejectRequest(requestId);
      await get().fetchPendingRequests();
      toast.success('Friend request rejected');
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to reject request';
      set({ error: errorMsg });
      toast.error(errorMsg);
      throw error;
    }
  },

  removeFriend: async (friendId: string) => {
    try {
      await friendsAPI.removeFriend(friendId);
      set((state) => ({
        friends: state.friends.filter((f) => f.id !== friendId),
      }));
      toast.success('Friend removed');
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to remove friend';
      set({ error: errorMsg });
      toast.error(errorMsg);
      throw error;
    }
  },

  blockUser: async (userId: string) => {
    try {
      await friendsAPI.blockUser(userId);
      await get().fetchFriends();
      toast.success('User blocked');
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to block user';
      set({ error: errorMsg });
      toast.error(errorMsg);
      throw error;
    }
  },

  searchUsers: async (query: string) => {
    try {
      const response = await friendsAPI.searchUsers(query);
      return response.data;
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to search users';
      set({ error: errorMsg });
      toast.error(errorMsg);
      return [];
    }
  },

  clearError: () => set({ error: null }),
}));
