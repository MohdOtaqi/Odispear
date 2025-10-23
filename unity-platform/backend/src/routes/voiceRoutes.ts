import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getVoiceToken } from '../controllers/voiceController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get voice token for joining a channel (this is the only route we need)
router.get('/channels/:channelId/token', getVoiceToken);

export default router;