import { Router } from 'express';
import * as rolesController from '../controllers/rolesController';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { checkGuildPermission, isGuildMember, Permission } from '../middleware/permissions';
import Joi from 'joi';

const router = Router();

const createRoleSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).allow(null, ''),
  permissions: Joi.number().integer().min(0),
  mentionable: Joi.boolean(),
  hoisted: Joi.boolean(),
});

const updateRoleSchema = Joi.object({
  name: Joi.string().min(1).max(100),
  color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).allow(null, ''),
  permissions: Joi.number().integer().min(0),
  mentionable: Joi.boolean(),
  hoisted: Joi.boolean(),
});

const updatePositionsSchema = Joi.object({
  positions: Joi.array().items(
    Joi.object({
      roleId: Joi.string().uuid().required(),
      position: Joi.number().integer().min(0).required(),
    })
  ).required(),
});

const channelPermissionSchema = Joi.object({
  roleId: Joi.string().uuid(),
  userId: Joi.string().uuid(),
  allow: Joi.number().integer().min(0),
  deny: Joi.number().integer().min(0),
});

// Role CRUD
router.post('/guilds/:guildId/roles', authenticateToken, checkGuildPermission(Permission.MANAGE_ROLES), validate(createRoleSchema), rolesController.createRole);
router.get('/guilds/:guildId/roles', authenticateToken, isGuildMember, rolesController.getGuildRoles);
router.patch('/guilds/:guildId/roles/:roleId', authenticateToken, checkGuildPermission(Permission.MANAGE_ROLES), validate(updateRoleSchema), rolesController.updateRole);
router.delete('/guilds/:guildId/roles/:roleId', authenticateToken, checkGuildPermission(Permission.MANAGE_ROLES), rolesController.deleteRole);
router.patch('/guilds/:guildId/roles/positions', authenticateToken, checkGuildPermission(Permission.MANAGE_ROLES), validate(updatePositionsSchema), rolesController.updateRolePositions);
// Also support short paths
router.patch('/roles/:roleId', authenticateToken, rolesController.updateRole);
router.delete('/roles/:roleId', authenticateToken, rolesController.deleteRole);

// Role assignments
router.post('/guilds/:guildId/members/:userId/roles/:roleId', authenticateToken, checkGuildPermission(Permission.MANAGE_ROLES), rolesController.assignRole);
router.delete('/guilds/:guildId/members/:userId/roles/:roleId', authenticateToken, checkGuildPermission(Permission.MANAGE_ROLES), rolesController.removeRole);
router.get('/guilds/:guildId/members/:userId/roles', authenticateToken, isGuildMember, rolesController.getMemberRoles);

// Channel permission overrides
router.post('/channels/:channelId/permissions', authenticateToken, checkGuildPermission(Permission.MANAGE_CHANNELS), validate(channelPermissionSchema), rolesController.setChannelPermissionOverride);
router.get('/channels/:channelId/permissions', authenticateToken, isGuildMember, rolesController.getChannelPermissionOverrides);
router.delete('/channels/:channelId/permissions/:overrideId', authenticateToken, checkGuildPermission(Permission.MANAGE_CHANNELS), rolesController.deleteChannelPermissionOverride);

export default router;
