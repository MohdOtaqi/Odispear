import api from './api';

interface VoiceToken {
  token: string;
  appId: string;
  channelName: string;
  uid: number;
  expiresIn: number;
}

interface VoiceUser {
  user_id: string;
  username: string;
  avatar_url?: string;
  muted: boolean;
  deafened: boolean;
  joined_at: string;
}

interface VoiceStats {
  current_users: number;
  active_days: number;
  avg_duration_seconds: number;
}

export const voiceAPI = {
  // Get token to join voice channel
  getVoiceToken: (channelId: string) =>
    api.get<VoiceToken>(`/voice/channels/${channelId}/token`),

  // Get users currently in voice channel
  getVoiceUsers: (channelId: string) =>
    api.get<VoiceUser[]>(`/voice/channels/${channelId}/users`),

  // Update voice state (mute/deafen)
  updateVoiceState: (channelId: string, data: { muted?: boolean; deafened?: boolean }) =>
    api.patch(`/voice/channels/${channelId}/state`, data),

  // Get voice channel statistics
  getVoiceStats: (channelId: string) =>
    api.get<VoiceStats>(`/voice/channels/${channelId}/stats`),
};
