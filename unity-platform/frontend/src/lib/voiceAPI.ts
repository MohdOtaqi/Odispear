import api from './api';

interface DailyToken {
  token: string;
  roomUrl: string;
}

export const voiceAPI = {
  // Get token to join Daily.co room
  getVoiceToken: (channelId: string) =>
    api.get<DailyToken>(`/voice/channels/${channelId}/token`),
};