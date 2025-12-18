import axios from 'axios';

// Use relative URL - works for both local dev and tunnel since frontend is served from backend
const BACKEND_URL = '/api/v1';

const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - skip auth for login/register/refresh
api.interceptors.request.use(
  (config) => {
    const isAuthEndpoint = config.url?.includes('/auth/login') || 
                          config.url?.includes('/auth/register') ||
                          config.url?.includes('/auth/refresh');
    
    if (!isAuthEndpoint) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh and network errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle network errors gracefully
    if (!error.response) {
      console.error('[API] Network error - server may be offline');
      return Promise.reject({
        message: 'Network error. Please check your internet connection.',
        isNetworkError: true,
        originalError: error
      });
    }

    // Handle 401 Unauthorized - attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post('/api/v1/auth/refresh', {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Force logout on refresh failure
        console.error('[API] Token refresh failed - logging out');
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject({
          message: 'Session expired. Please log in again.',
          isAuthError: true,
          originalError: refreshError
        });
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      return Promise.reject({
        message: 'You do not have permission to perform this action.',
        isForbidden: true,
        originalError: error
      });
    }

    // Handle 404 Not Found
    if (error.response?.status === 404) {
      return Promise.reject({
        message: 'The requested resource was not found.',
        isNotFound: true,
        originalError: error
      });
    }

    // Handle 500+ Server Errors
    if (error.response?.status >= 500) {
      return Promise.reject({
        message: 'Server error. Please try again later.',
        isServerError: true,
        originalError: error
      });
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
    api.post(`/invites/${code}/use`),
  leaveGuild: (id: string) =>
    api.delete(`/guilds/${id}/leave`),
};

// Channel APIs
export const channelAPI = {
  create: (guildId: string, data: any) =>
    api.post(`/guilds/${guildId}/channels`, data),
  getGuildChannels: (guildId: string) =>
    api.get(`/guilds/${guildId}/channels`),
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
  sendRequest: (username: string) =>
    api.post('/friends/request', { username }),
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
    api.post(`/guilds/${guildId}/events`, data),
  getGuildEvents: (guildId: string, params?: any) =>
    api.get(`/guilds/${guildId}/events`, { params }),
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
