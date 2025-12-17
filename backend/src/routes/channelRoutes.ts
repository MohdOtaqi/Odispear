import { Router } from 'express';
import * as channelController from '../controllers/channelController';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { checkGuildPermission, checkChannelPermission, Permission } from '../middleware/permissions';
import Joi from 'joi';

const router = Router();

const createChannelSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  type: Joi.string().valid('text', 'voice', 'stage', 'docs', 'category').required(),
  topic: Joi.string().max(500).allow(''),
  parent_id: Joi.string().uuid().allow(null),
  nsfw: Joi.boolean(),
});

const updateChannelSchema = Joi.object({
  name: Joi.string().min(1).max(100),
  topic: Joi.string().max(500).allow(''),
  position: Joi.number().integer().min(0),
  nsfw: Joi.boolean(),
  rate_limit_per_user: Joi.number().integer().min(0).max(21600),
});

const createMessageSchema = Joi.object({
  content: Joi.string().min(1).max(2000).required(),
  reply_to_id: Joi.string().uuid().allow(null),
});

router.post('/guilds/:guildId/channels', authenticateToken, checkGuildPermission(Permission.MANAGE_CHANNELS), validate(createChannelSchema), channelController.createChannel);
router.get('/guilds/:guildId/channels', authenticateToken, channelController.getGuildChannels);
router.get('/channels/:id', authenticateToken, checkChannelPermission(Permission.VIEW_CHANNEL), channelController.getChannel);
router.patch('/channels/:id', authenticateToken, checkChannelPermission(Permission.MANAGE_CHANNELS), validate(updateChannelSchema), channelController.updateChannel);
router.delete('/channels/:id', authenticateToken, checkChannelPermission(Permission.MANAGE_CHANNELS), channelController.deleteChannel);
router.get('/channels/:id/messages', authenticateToken, checkChannelPermission(Permission.VIEW_CHANNEL), channelController.getChannelMessages);
router.post('/channels/:id/messages', authenticateToken, checkChannelPermission(Permission.SEND_MESSAGES), validate(createMessageSchema), channelController.createMessage);
router.patch('/channels/messages/:messageId', authenticateToken, channelController.updateMessage);
router.delete('/channels/messages/:messageId', authenticateToken, channelController.deleteMessage);
router.post('/channels/messages/:messageId/reactions', authenticateToken, channelController.addReaction);
router.delete('/channels/messages/:messageId/reactions/:emoji', authenticateToken, channelController.removeReaction);

export default router;
