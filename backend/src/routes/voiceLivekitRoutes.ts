import { Router, Request, Response } from 'express';
import { AccessToken, VideoGrant } from 'livekit-server-sdk';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// LiveKit configuration from environment
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || 'APIodispear';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || 'GBIyVJz+duwb9XMVVc6A63NTRhMiQsGpWzOW3mT82Aw=';
const LIVEKIT_URL = process.env.LIVEKIT_URL || 'wss://n0tmot.com/livekit/';

/**
 * Generate a LiveKit access token for a user to join a voice channel
 * GET /api/voice/livekit-token/:channelId
 */
router.get('/livekit-token/:channelId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { channelId } = req.params;
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Create room name from channel ID (LiveKit rooms are named by channel)
    const roomName = `channel-${channelId.substring(0, 8)}`;

    // Create access token
    const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: user.id,
      name: user.username,
    });

    // Grant permissions for this room
    const videoGrant: VideoGrant = {
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    };

    token.addGrant(videoGrant);

    // Set token expiry (24 hours)
    token.ttl = '24h';

    // Generate the JWT
    const jwt = await token.toJwt();

    console.log(`[LiveKit] Generated token for user ${user.username} (${user.id}) to room ${roomName}`);

    res.json({
      token: jwt,
      roomName,
      livekitUrl: LIVEKIT_URL,
    });
  } catch (error) {
    console.error('[LiveKit] Token generation error:', error);
    res.status(500).json({ error: 'Failed to generate voice token' });
  }
});

/**
 * Get LiveKit room info (for debugging)
 * GET /api/voice/livekit-info
 */
router.get('/livekit-info', authenticateToken, async (_req: Request, res: Response): Promise<void> => {
  res.json({
    livekitUrl: LIVEKIT_URL,
    hasApiKey: !!LIVEKIT_API_KEY,
    hasApiSecret: !!LIVEKIT_API_SECRET,
  });
});

export default router;
