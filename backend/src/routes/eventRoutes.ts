import { Router } from 'express';
import * as eventController from '../controllers/eventController';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { checkGuildPermission, isGuildMember, Permission } from '../middleware/permissions';
import Joi from 'joi';

const router = Router();

const createEventSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(2000).allow(''),
  event_type: Joi.string().valid('general', 'tournament', 'meeting', 'stream'),
  start_time: Joi.date().iso().required(),
  end_time: Joi.date().iso().allow(null),
  channel_id: Joi.string().uuid().allow(null),
  max_participants: Joi.number().integer().min(1).allow(null),
  image_url: Joi.string().uri().allow(''),
  metadata: Joi.object().allow(null),
});

const rsvpSchema = Joi.object({
  status: Joi.string().valid('going', 'maybe', 'not_going').required(),
});

const createTournamentSchema = Joi.object({
  bracket_type: Joi.string().valid('single_elimination', 'double_elimination', 'round_robin').required(),
  team_size: Joi.number().integer().min(1).required(),
  max_teams: Joi.number().integer().min(2).allow(null),
});

router.post('/guilds/:guildId/events', authenticateToken, checkGuildPermission(Permission.MANAGE_EVENTS), validate(createEventSchema), eventController.createEvent);
router.get('/guilds/:guildId/events', authenticateToken, isGuildMember, eventController.getGuildEvents);
router.get('/events/:id', authenticateToken, eventController.getEvent);
router.patch('/events/:id', authenticateToken, checkGuildPermission(Permission.MANAGE_EVENTS), eventController.updateEvent);
router.delete('/events/:id', authenticateToken, checkGuildPermission(Permission.MANAGE_EVENTS), eventController.deleteEvent);
router.post('/events/:id/rsvp', authenticateToken, validate(rsvpSchema), eventController.rsvpEvent);
router.get('/events/:id/rsvps', authenticateToken, eventController.getEventRSVPs);
router.post('/events/:eventId/tournament', authenticateToken, checkGuildPermission(Permission.MANAGE_EVENTS), validate(createTournamentSchema), eventController.createTournament);
router.get('/tournaments/:id', authenticateToken, eventController.getTournament);
router.post('/tournaments/:id/join', authenticateToken, eventController.joinTournament);

export default router;
