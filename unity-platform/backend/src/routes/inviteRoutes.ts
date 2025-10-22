import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import * as inviteController from '../controllers/inviteController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Create invite for a guild
router.post('/guilds/:guildId/invites', inviteController.createInvite);

// Get all invites for a guild
router.get('/guilds/:guildId/invites', inviteController.getGuildInvites);

// Get invite info (for preview)
router.get('/invites/:code', inviteController.getInviteInfo);

// Use an invite
router.post('/invites/:code/use', inviteController.useInvite);

// Delete an invite
router.delete('/invites/:code', inviteController.deleteInvite);

export default router;
