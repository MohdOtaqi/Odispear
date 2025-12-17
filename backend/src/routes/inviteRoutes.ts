import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import * as inviteController from '../controllers/inviteController';

const router = Router();

// PUBLIC ROUTES (no authentication required)
// Get invite info (for preview) - must be BEFORE authentication middleware
router.get('/invites/:code', inviteController.getInviteInfo);

// PROTECTED ROUTES (authentication required)
router.use(authenticateToken);

// Create invite for a guild
router.post('/guilds/:guildId/invites', inviteController.createInvite);

// Get all invites for a guild
router.get('/guilds/:guildId/invites', inviteController.getGuildInvites);

// Use an invite
router.post('/invites/:code/use', inviteController.useInvite);

// Delete an invite
router.delete('/invites/:code', inviteController.deleteInvite);

export default router;
