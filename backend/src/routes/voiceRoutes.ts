import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getVoiceToken, getGuildVoiceUsers } from '../controllers/voiceController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get voice token for joining a channel
router.get('/channels/:channelId/token', getVoiceToken);

// Get all users currently in voice channels for a guild
router.get('/guilds/:guildId/users', getGuildVoiceUsers);

export default router;