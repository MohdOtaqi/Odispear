import api from './api';

interface DailyToken {
  token: string;
  roomUrl: string;
}

export const voiceAPI = {
  // Get token to join Daily.co room with optimal region
  getVoiceToken: (channelId: string, region?: string) =>
    api.get<DailyToken>(`/voice/channels/${channelId}/token`, {
      params: region ? { region } : undefined,
    }),
};