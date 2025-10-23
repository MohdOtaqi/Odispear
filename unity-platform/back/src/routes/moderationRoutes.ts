import { Router } from 'express';
import * as moderationController from '../controllers/moderationController';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { checkGuildPermission, Permission } from '../middleware/permissions';
import Joi from 'joi';

const router = Router();

const banUserSchema = Joi.object({
  user_id: Joi.string().uuid().required(),
  reason: Joi.string().max(500).allow(''),
});

const muteUserSchema = Joi.object({
  user_id: Joi.string().uuid().required(),
  reason: Joi.string().max(500).allow(''),
  duration: Joi.number().integer().min(60).allow(null),
});

const wordFilterSchema = Joi.object({
  pattern: Joi.string().required(),
  action: Joi.string().valid('delete', 'warn', 'timeout'),
});

router.post('/guilds/:guildId/ban', authenticateToken, checkGuildPermission(Permission.BAN_MEMBERS), validate(banUserSchema), moderationController.banUser);
router.post('/guilds/:guildId/kick', authenticateToken, checkGuildPermission(Permission.KICK_MEMBERS), validate(banUserSchema), moderationController.kickUser);
router.post('/guilds/:guildId/mute', authenticateToken, checkGuildPermission(Permission.MUTE_MEMBERS), validate(muteUserSchema), moderationController.muteUser);
router.delete('/guilds/:guildId/bans/:userId', authenticateToken, checkGuildPermission(Permission.BAN_MEMBERS), moderationController.unbanUser);
router.get('/guilds/:guildId/bans', authenticateToken, checkGuildPermission(Permission.BAN_MEMBERS), moderationController.getBannedUsers);
router.get('/guilds/:guildId/audit-logs', authenticateToken, checkGuildPermission(Permission.MANAGE_GUILD), moderationController.getAuditLogs);
router.post('/guilds/:guildId/word-filters', authenticateToken, checkGuildPermission(Permission.MANAGE_GUILD), validate(wordFilterSchema), moderationController.addWordFilter);
router.get('/guilds/:guildId/word-filters', authenticateToken, checkGuildPermission(Permission.MANAGE_GUILD), moderationController.getWordFilters);
router.delete('/word-filters/:filterId', authenticateToken, moderationController.deleteWordFilter);

export default router;
