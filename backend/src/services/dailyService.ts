import axios, { AxiosInstance } from 'axios';
import { AppError } from '../middleware/errorHandler';

interface DailyConfig {
  apiKey: string;
  domain: string;
}

// Multiple Daily.co API keys for fallback
const DAILY_CONFIGS: DailyConfig[] = [
  {
    apiKey: process.env.DAILY_API_KEY || '558446b4f880406375a3fec3cfb4f87c3c725608a2a660986fff5d61ecd060f0',
    domain: process.env.DAILY_DOMAIN || 'https://odispear.daily.co'
  },
  {
    apiKey: '78045a13c89dd20d52759a7ac115a91df152ae8cbff49fee8aa219e096ca62c5',
    domain: 'https://kea8631draughtier.daily.co'
  },
  {
    apiKey: 'b0da56a07b1933ef70ceae445bec99609963869427356f607acdbfc389e2da3d',
    domain: 'https://macaw37698minating.daily.co'
  }
];

let currentConfigIndex = 0;

function getCurrentDailyApi(): AxiosInstance {
  const config = DAILY_CONFIGS[currentConfigIndex];
  return axios.create({
    baseURL: 'https://api.daily.co/v1',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json'
    }
  });
}

function getCurrentDomain(): string {
  return DAILY_CONFIGS[currentConfigIndex].domain;
}

async function retryWithFallback<T>(
  operation: (api: AxiosInstance) => Promise<T>,
  operationName: string
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < DAILY_CONFIGS.length; i++) {
    try {
      const api = getCurrentDailyApi();
      console.log(`[DailyService] Attempting ${operationName} with config ${currentConfigIndex + 1}/${DAILY_CONFIGS.length}`);
      const result = await operation(api);
      console.log(`[DailyService] ${operationName} successful with config ${currentConfigIndex + 1}`);
      return result;
    } catch (error: any) {
      lastError = error;
      console.error(`[DailyService] ${operationName} failed with config ${currentConfigIndex + 1}:`, error.response?.data || error.message);
      
      // Move to next config
      currentConfigIndex = (currentConfigIndex + 1) % DAILY_CONFIGS.length;
      
      // If we've tried all configs, throw error
      if (i === DAILY_CONFIGS.length - 1) {
        throw new AppError(
          `All Daily.co API keys failed for ${operationName}. Please contact support.`,
          503
        );
      }
    }
  }
  
  throw lastError;
}

export async function getOrCreateRoom(roomName: string) {
  return retryWithFallback(async (api) => {
    try {
      // Try to get existing room
      const roomResponse = await api.get(`/rooms/${roomName}`);
      return roomResponse.data;
    } catch (error: any) {
      // If room doesn't exist, create it
      if (error.response && error.response.status === 404) {
        console.log(`[DailyService] Creating new room: ${roomName}`);
        const createResponse = await api.post('/rooms', {
          name: roomName,
          privacy: 'public',
          properties: {
            enable_screenshare: true,
            enable_chat: false,
            start_audio_off: false,
            start_video_off: true,
            enable_recording: 'cloud',
            max_participants: 50
          }
        });
        return createResponse.data;
      }
      throw error;
    }
  }, 'getOrCreateRoom');
}

export async function generateMeetingToken(roomName: string, userId: string, userName: string) {
  return retryWithFallback(async (api) => {
    const tokenResponse = await api.post('/meeting-tokens', {
      properties: {
        room_name: roomName,
        user_id: userId,
        user_name: userName,
        is_owner: false,
        enable_screenshare: true,
        start_audio_off: false,
        start_video_off: true
      }
    });
    return tokenResponse.data.token;
  }, 'generateMeetingToken');
}

export function getCurrentDailyDomain(): string {
  return getCurrentDomain();
}

export async function deleteRoom(roomName: string): Promise<void> {
  return retryWithFallback(async (api) => {
    await api.delete(`/rooms/${roomName}`);
  }, 'deleteRoom');
}
