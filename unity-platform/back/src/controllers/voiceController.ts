import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { generateVoiceToken, validateVoiceAccess } from '../services/agoraService';
import { query } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';

// Get voice token for a channel
export const getVoiceToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { channelId } = req.params;
    const userId = req.user!.id;

    // Validate access
    const hasAccess = await validateVoiceAccess(userId, channelId, { query });

    if (!hasAccess) {
      throw new AppError('You do not have access to this voice channel', 403);
    }

    // Generate token (valid for 1 hour)
    const { token, appId, uid } = generateVoiceToken(channelId, userId, 'publisher', 3600);

    // Log voice channel join
    logger.info(`User ${userId} joining voice channel ${channelId}`);

    res.json({
      token,
      appId,
      channelName: channelId,
      uid,
      expiresIn: 3600,
    });
  } catch (error) {
    next(error);
  }
};

// Get current users in voice channel
export const getVoiceChannelUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { channelId } = req.params;

    const result = await query(
      `SELECT 
        vs.id as session_id,
        vs.user_id,
        u.username,
        u.avatar_url,
        vs.joined_at,
        vs.muted,
        vs.deafened
      FROM voice_sessions vs
      JOIN users u ON vs.user_id = u.id
      WHERE vs.channel_id = $1 AND vs.left_at IS NULL
      ORDER BY vs.joined_at ASC`,
      [channelId]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// Update voice state (mute/deafen)
export const updateVoiceState = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { channelId } = req.params;
    const userId = req.user!.id;
    const { muted, deafened } = req.body;

    await query(
      `UPDATE voice_sessions 
       SET muted = $1, deafened = $2, updated_at = NOW()
       WHERE channel_id = $3 AND user_id = $4 AND left_at IS NULL`,
      [muted, deafened, channelId, userId]
    );

    res.json({ success: true, muted, deafened });
  } catch (error) {
    next(error);
  }
};

// Get voice channel statistics
export const getVoiceStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { channelId } = req.params;

    const stats = await query(
      `SELECT 
        COUNT(*) as current_users,
        COUNT(DISTINCT DATE(joined_at)) as active_days,
        AVG(EXTRACT(EPOCH FROM (COALESCE(left_at, NOW()) - joined_at))) as avg_duration_seconds
      FROM voice_sessions
      WHERE channel_id = $1`,
      [channelId]
    );

    res.json(stats.rows[0]);
  } catch (error) {
    next(error);
  }
};
