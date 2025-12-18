import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { query } from '../config/database';
import * as dailyService from '../services/dailyService';

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
    const userName = req.user?.username || 'Guest';
    
    console.log(`[Voice] Getting token for channel ${channelId}, user ${userId}`);

    const roomName = `channel-${channelId.substring(0, 8)}`;
    
    // Use centralized Daily.co service with automatic fallback
    const room = await dailyService.getOrCreateRoom(roomName);
    const token = await dailyService.generateMeetingToken(roomName, userId, userName);
    const domain = dailyService.getCurrentDailyDomain();

    res.json({
      token,
      roomUrl: room.url,
      domain
    });

  } catch (error: any) {
    console.error('[Voice] Failed to get voice token:', error.message);
    next(error);
  }
};

// Get all users currently in voice channels for a guild

export const getGuildVoiceUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { guildId } = req.params;
    
    // Get all active voice sessions for channels in this guild
    const result = await query(
      `SELECT vs.channel_id, vs.user_id, u.username, u.avatar_url, vs.muted, vs.deafened
       FROM voice_sessions vs
       JOIN channels c ON vs.channel_id = c.id
       JOIN users u ON vs.user_id = u.id
       WHERE c.guild_id = $1 AND vs.left_at IS NULL
       ORDER BY vs.joined_at`,
      [guildId]
    );

    // Group by channel_id
    const voiceUsers: Record<string, any[]> = {};
    for (const row of result.rows) {
      if (!voiceUsers[row.channel_id]) {
        voiceUsers[row.channel_id] = [];
      }
      voiceUsers[row.channel_id].push({
        id: row.user_id,
        username: row.username,
        avatar_url: row.avatar_url,
        muted: row.muted || false,
        deafened: row.deafened || false,
      });
    }

    res.json(voiceUsers);
  } catch (error) {
    next(new AppError('Failed to get voice users', 500));
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