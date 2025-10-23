import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { query } from '../config/database';
import { AppError } from './errorHandler';

// Permission bits
export enum Permission {
  VIEW_CHANNEL = 1 << 0,
  SEND_MESSAGES = 1 << 1,
  MANAGE_MESSAGES = 1 << 2,
  MANAGE_CHANNELS = 1 << 3,
  MANAGE_GUILD = 1 << 4,
  KICK_MEMBERS = 1 << 5,
  BAN_MEMBERS = 1 << 6,
  MANAGE_ROLES = 1 << 7,
  MANAGE_WEBHOOKS = 1 << 8,
  CONNECT_VOICE = 1 << 9,
  SPEAK_VOICE = 1 << 10,
  MUTE_MEMBERS = 1 << 11,
  MANAGE_EVENTS = 1 << 12,
  ADMINISTRATOR = 1 << 13,
}

export const checkGuildPermission = (requiredPermission: Permission) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const guildId = req.params.guildId || req.params.id;
      const userId = req.user!.id;

      // Check if user is guild owner
      const guildResult = await query(
        'SELECT owner_id FROM guilds WHERE id = $1',
        [guildId]
      );

      if (guildResult.rows.length === 0) {
        throw new AppError('Guild not found', 404);
      }

      if (guildResult.rows[0].owner_id === userId) {
        return next();
      }

      // Get user roles and permissions
      const roleResult = await query(
        `SELECT r.permissions 
         FROM role_assignments ra
         JOIN roles r ON ra.role_id = r.id
         WHERE ra.user_id = $1 AND ra.guild_id = $2`,
        [userId, guildId]
      );

      let userPermissions = 0;
      for (const role of roleResult.rows) {
        userPermissions |= parseInt(role.permissions);
      }

      // Check for administrator permission
      if (userPermissions & Permission.ADMINISTRATOR) {
        return next();
      }

      // Check specific permission
      if (!(userPermissions & requiredPermission)) {
        throw new AppError('Insufficient permissions', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const checkChannelPermission = (requiredPermission: Permission) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const channelId = req.params.channelId || req.params.id;
      const userId = req.user!.id;

      // Get channel and guild
      const channelResult = await query(
        'SELECT guild_id FROM channels WHERE id = $1',
        [channelId]
      );

      if (channelResult.rows.length === 0) {
        throw new AppError('Channel not found', 404);
      }

      const guildId = channelResult.rows[0].guild_id;

      // Check if user is guild owner
      const guildResult = await query(
        'SELECT owner_id FROM guilds WHERE id = $1',
        [guildId]
      );

      if (guildResult.rows[0].owner_id === userId) {
        return next();
      }

      // Get base role permissions
      const roleResult = await query(
        `SELECT r.permissions 
         FROM role_assignments ra
         JOIN roles r ON ra.role_id = r.id
         WHERE ra.user_id = $1 AND ra.guild_id = $2`,
        [userId, guildId]
      );

      let userPermissions = 0;
      for (const role of roleResult.rows) {
        userPermissions |= parseInt(role.permissions);
      }

      // Check for administrator permission
      if (userPermissions & Permission.ADMINISTRATOR) {
        return next();
      }

      // Get channel-specific overrides
      const overrideResult = await query(
        `SELECT allow, deny FROM channel_permissions
         WHERE channel_id = $1 AND (
           user_id = $2 OR 
           role_id IN (SELECT role_id FROM role_assignments WHERE user_id = $2 AND guild_id = $3)
         )`,
        [channelId, userId, guildId]
      );

      for (const override of overrideResult.rows) {
        const allow = parseInt(override.allow);
        const deny = parseInt(override.deny);
        
        userPermissions = (userPermissions & ~deny) | allow;
      }

      // Check specific permission
      if (!(userPermissions & requiredPermission)) {
        throw new AppError('Insufficient permissions', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const isGuildMember = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const guildId = req.params.guildId || req.params.id;
    const userId = req.user!.id;

    const result = await query(
      'SELECT id FROM guild_members WHERE guild_id = $1 AND user_id = $2',
      [guildId, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Not a member of this guild', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};
