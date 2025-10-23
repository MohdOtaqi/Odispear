import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// Auth APIs
export const authAPI = {
  register: (data: { email: string; username: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),
  getCurrentUser: () =>
    api.get('/auth/me'),
  updateProfile: (data: any) =>
    api.patch('/auth/me', data),
};

// Guild APIs
export const guildAPI = {
  create: (data: any) =>
    api.post('/guilds', data),
  getUserGuilds: () =>
    api.get('/guilds'),
  getGuild: (id: string) =>
    api.get(`/guilds/${id}`),
  updateGuild: (id: string, data: any) =>
    api.patch(`/guilds/${id}`, data),
  deleteGuild: (id: string) =>
    api.delete(`/guilds/${id}`),
  getMembers: (id: string) =>
    api.get(`/guilds/${id}/members`),
  createInvite: (id: string, data?: any) =>
    api.post(`/guilds/${id}/invites`, data),
  joinByInvite: (code: string) =>
    api.post(`/guilds/invites/${code}/join`),
  leaveGuild: (id: string) =>
    api.delete(`/guilds/${id}/leave`),
};

// Channel APIs
export const channelAPI = {
  create: (guildId: string, data: any) =>
    api.post(`/channels/guilds/${guildId}/channels`, data),
  getGuildChannels: (guildId: string) =>
    api.get(`/channels/guilds/${guildId}/channels`),
  getChannel: (id: string) =>
    api.get(`/channels/${id}`),
  updateChannel: (id: string, data: any) =>
    api.patch(`/channels/${id}`, data),
  deleteChannel: (id: string) =>
    api.delete(`/channels/${id}`),
  getMessages: (id: string, params?: any) =>
    api.get(`/channels/${id}/messages`, { params }),
  sendMessage: (id: string, data: any) =>
    api.post(`/channels/${id}/messages`, data),
  updateMessage: (messageId: string, data: any) =>
    api.patch(`/channels/messages/${messageId}`, data),
  deleteMessage: (messageId: string) =>
    api.delete(`/channels/messages/${messageId}`),
  addReaction: (messageId: string, emoji: string) =>
    api.post(`/channels/messages/${messageId}/reactions`, { emoji }),
  removeReaction: (messageId: string, emoji: string) =>
    api.delete(`/channels/messages/${messageId}/reactions/${emoji}`),
};

// DM APIs
export const dmAPI = {
  getDMChannels: () =>
    api.get('/dm/channels'),
  createDM: (userId: string) =>
    api.post('/dm/create', { user_id: userId }),
  createGroupDM: (userIds: string[], name?: string) =>
    api.post('/dm/create-group', { user_ids: userIds, name }),
  getDMMessages: (dmChannelId: string, params?: any) =>
    api.get(`/dm/${dmChannelId}/messages`, { params }),
  sendDMMessage: (dmChannelId: string, data: any) =>
    api.post(`/dm/${dmChannelId}/messages`, data),
  updateDMMessage: (messageId: string, data: any) =>
    api.patch(`/dm/messages/${messageId}`, data),
  deleteDMMessage: (messageId: string) =>
    api.delete(`/dm/messages/${messageId}`),
  addDMReaction: (messageId: string, emoji: string) =>
    api.post(`/dm/messages/${messageId}/reactions`, { emoji }),
  removeDMReaction: (messageId: string, emoji: string) =>
    api.delete(`/dm/messages/${messageId}/reactions/${emoji}`),
  leaveGroupDM: (dmChannelId: string) =>
    api.delete(`/dm/${dmChannelId}/leave`),
};

// Friends APIs
export const friendsAPI = {
  getFriends: () =>
    api.get('/friends'),
  getPendingRequests: () =>
    api.get('/friends/pending'),
  getSentRequests: () =>
    api.get('/friends/sent'),
  getBlocked: () =>
    api.get('/friends/blocked'),
  sendRequest: (userId: string) =>
    api.post('/friends/request', { friend_id: userId }),
  acceptRequest: (friendshipId: string) =>
    api.post(`/friends/${friendshipId}/accept`),
  rejectRequest: (friendshipId: string) =>
    api.post(`/friends/${friendshipId}/reject`),
  removeFriend: (friendshipId: string) =>
    api.delete(`/friends/${friendshipId}`),
  blockUser: (userId: string) =>
    api.post('/friends/block', { user_id: userId }),
  unblockUser: (friendshipId: string) =>
    api.delete(`/friends/blocked/${friendshipId}`),
  searchUsers: (query: string) =>
    api.get('/friends/search', { params: { q: query } }),
};

// Voice APIs
export const voiceAPI = {
  getVoiceToken: (channelId: string) =>
    api.get(`/voice/channels/${channelId}/token`),
  getVoiceUsers: (channelId: string) =>
    api.get(`/voice/channels/${channelId}/users`),
  updateVoiceState: (channelId: string, data: { muted?: boolean; deafened?: boolean }) =>
    api.patch(`/voice/channels/${channelId}/state`, data),
  getVoiceStats: (channelId: string) =>
    api.get(`/voice/channels/${channelId}/stats`),
};

// Event APIs
export const eventAPI = {
  create: (guildId: string, data: any) =>
    api.post(`/events/guilds/${guildId}/events`, data),
  getGuildEvents: (guildId: string, params?: any) =>
    api.get(`/events/guilds/${guildId}/events`, { params }),
  getEvent: (id: string) =>
    api.get(`/events/${id}`),
  updateEvent: (id: string, data: any) =>
    api.patch(`/events/${id}`, data),
  deleteEvent: (id: string) =>
    api.delete(`/events/${id}`),
  rsvp: (id: string, status: string) =>
    api.post(`/events/${id}/rsvp`, { status }),
  getRSVPs: (id: string) =>
    api.get(`/events/${id}/rsvps`),
  createTournament: (eventId: string, data: any) =>
    api.post(`/events/${eventId}/tournament`, data),
  getTournament: (id: string) =>
    api.get(`/events/tournaments/${id}`),
  joinTournament: (id: string, data: any) =>
    api.post(`/events/tournaments/${id}/join`, data),
};
