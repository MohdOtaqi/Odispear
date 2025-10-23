import { Router } from 'express';
import * as memberController from '../controllers/memberController';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { checkGuildPermission, Permission } from '../middleware/permissions';
import Joi from 'joi';

const router = Router();

const updateNicknameSchema = Joi.object({
  nickname: Joi.string().max(32).allow(null, ''),
});

const kickMemberSchema = Joi.object({
  reason: Joi.string().max(500).allow(''),
});

const banMemberSchema = Joi.object({
  reason: Joi.string().max(500).allow(''),
  delete_message_days: Joi.number().integer().min(0).max(7),
});

const muteDeafenSchema = Joi.object({
  muted: Joi.boolean(),
  deafened: Joi.boolean(),
});

// Member management
router.get('/guilds/:guildId/members/:userId', authenticateToken, memberController.getMemberWithRoles);
router.patch('/guilds/:guildId/members/:userId/nickname', authenticateToken, checkGuildPermission(Permission.MANAGE_GUILD), validate(updateNicknameSchema), memberController.updateMemberNickname);
router.patch('/guilds/:guildId/members/:userId/voice', authenticateToken, checkGuildPermission(Permission.MUTE_MEMBERS), validate(muteDeafenSchema), memberController.updateMemberMuteDeafen);

// Kick and ban
router.delete('/guilds/:guildId/members/:userId/kick', authenticateToken, checkGuildPermission(Permission.KICK_MEMBERS), validate(kickMemberSchema), memberController.kickMember);
router.post('/guilds/:guildId/bans/:userId', authenticateToken, checkGuildPermission(Permission.BAN_MEMBERS), validate(banMemberSchema), memberController.banMember);
router.delete('/guilds/:guildId/bans/:userId', authenticateToken, checkGuildPermission(Permission.BAN_MEMBERS), memberController.unbanMember);
router.get('/guilds/:guildId/bans', authenticateToken, checkGuildPermission(Permission.BAN_MEMBERS), memberController.getBannedMembers);

export default router;
