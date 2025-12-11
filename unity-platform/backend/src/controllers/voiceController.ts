import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import axios from 'axios';

const DAILY_API_KEY = process.env.DAILY_API_KEY;
const DAILY_DOMAIN = process.env.DAILY_DOMAIN;
const dailyApi = axios.create({
  baseURL: 'https://api.daily.co/v1',
  headers: {
    'Authorization': `Bearer ${DAILY_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

// Note: Daily.co region selection requires paid plan
// Free tier uses automatic region selection

// Creates or gets a Daily.co room for the channel
export const getVoiceToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { channelId } = req.params;
    const userId = req.user!.id;
    
    // Note: Daily.co free tier doesn't support geo selection, so we use default
    // Region selection would require paid plan
    console.log(`[Voice] Getting token for channel ${channelId}, user ${userId}`);

    if (!DAILY_API_KEY || !DAILY_DOMAIN) {
      throw new AppError('Voice service not configured', 500);
    }

    // Simple room name without region (geo requires paid plan)
    const roomName = `channel-${channelId.substring(0, 8)}`;
    
    // 1. Try to get the existing room
    let room;
    try {
      const roomResponse = await dailyApi.get(`/rooms/${roomName}`);
      room = roomResponse.data;
    } catch (error: any) {
      // If room doesn't exist, create it
      if (error.response && error.response.status === 404) {
        console.log(`Creating Daily.co room: ${roomName}`);
        const createResponse = await dailyApi.post('/rooms', {
          name: roomName,
          privacy: 'public',
          properties: {
            enable_chat: true,
            start_video_off: true,
            start_audio_off: false,
            enable_advanced_chat: false,
            // Room expires in 24 hours
            exp: Math.floor(Date.now() / 1000) + 86400
          }
        });
        room = createResponse.data;
        console.log(`Created Daily.co room: ${room.url}`);
      } else {
        throw error; // Re-throw other errors
      }
    }

    // 2. Generate a meeting token for the user
    const tokenResponse = await dailyApi.post('/meeting-tokens', {
      properties: {
        room_name: roomName,
        user_id: userId,
        user_name: req.user?.username || 'Guest',
      }
    });

    res.json({
      token: tokenResponse.data.token,
      roomUrl: room.url
    });

  } catch (error: any) {
    console.error('Daily.co API error:', error.response?.data || error.message);
    next(new AppError('Failed to create or join voice room', 500));
  }
};

// These other functions are no longer needed for Daily.co's simple setup
export const getVoiceChannelUsers = async (req: AuthRequest, res: Response) => {
  res.json([]);
};
export const updateVoiceState = async (req: AuthRequest, res: Response) => {
  res.json({ success: true });
};
export const getVoiceStats = async (req: AuthRequest, res: Response) => {
  res.json({ current_users: 0 });
};