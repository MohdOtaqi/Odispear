import { Router } from 'express';
import * as guildController from '../controllers/guildController';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { checkGuildPermission, isGuildMember, Permission } from '../middleware/permissions';
import Joi from 'joi';

const router = Router();

const createGuildSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).allow(''),
  template_type: Joi.string().valid('community', 'esports', 'study', 'custom'),
});

const updateGuildSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  description: Joi.string().max(500).allow(''),
  icon_url: Joi.string().uri().allow(''),
  banner_url: Joi.string().uri().allow(''),
});

router.post('/', authenticateToken, validate(createGuildSchema), guildController.createGuild);
router.get('/', authenticateToken, guildController.getUserGuilds);
router.get('/:id', authenticateToken, isGuildMember, guildController.getGuild);
router.patch('/:id', authenticateToken, checkGuildPermission(Permission.MANAGE_GUILD), validate(updateGuildSchema), guildController.updateGuild);
router.delete('/:id', authenticateToken, checkGuildPermission(Permission.MANAGE_GUILD), guildController.deleteGuild);
router.get('/:id/members', authenticateToken, isGuildMember, guildController.getGuildMembers);
router.post('/:id/invites', authenticateToken, isGuildMember, guildController.createInvite);
router.post('/invites/:code/join', authenticateToken, guildController.joinGuildByInvite);
router.delete('/:id/leave', authenticateToken, guildController.leaveGuild);

export default router;
