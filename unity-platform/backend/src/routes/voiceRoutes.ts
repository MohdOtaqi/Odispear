import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getVoiceToken,
  getVoiceChannelUsers,
  updateVoiceState,
  getVoiceStats,
} from '../controllers/voiceController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get voice token for joining a channel
router.get('/channels/:channelId/token', getVoiceToken);

// Get current users in voice channel
router.get('/channels/:channelId/users', getVoiceChannelUsers);

// Update voice state (mute/deafen)
router.patch('/channels/:channelId/state', updateVoiceState);

// Get voice channel statistics
router.get('/channels/:channelId/stats', getVoiceStats);

export default router;
