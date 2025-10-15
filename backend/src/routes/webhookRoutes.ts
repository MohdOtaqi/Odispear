import { Router } from 'express';
import * as webhookController from '../controllers/webhookController';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { checkGuildPermission, Permission } from '../middleware/permissions';
import Joi from 'joi';

const router = Router();

const createWebhookSchema = Joi.object({
  channel_id: Joi.string().uuid().required(),
  name: Joi.string().min(1).max(100).required(),
  avatar_url: Joi.string().uri().allow(''),
});

const executeWebhookSchema = Joi.object({
  content: Joi.string().min(1).max(2000).required(),
  username: Joi.string().max(100),
  avatar_url: Joi.string().uri(),
});

const createBotSchema = Joi.object({
  username: Joi.string().min(3).max(50).required(),
  public: Joi.boolean(),
});

router.post('/guilds/:guildId/webhooks', authenticateToken, checkGuildPermission(Permission.MANAGE_WEBHOOKS), validate(createWebhookSchema), webhookController.createWebhook);
router.get('/guilds/:guildId/webhooks', authenticateToken, checkGuildPermission(Permission.MANAGE_WEBHOOKS), webhookController.getGuildWebhooks);
router.delete('/webhooks/:webhookId', authenticateToken, webhookController.deleteWebhook);
router.post('/webhooks/:token', validate(executeWebhookSchema), webhookController.executeWebhook);
router.post('/bots', authenticateToken, validate(createBotSchema), webhookController.createBot);
router.get('/bots', authenticateToken, webhookController.getUserBots);
router.delete('/bots/:botId', authenticateToken, webhookController.deleteBot);

export default router;
