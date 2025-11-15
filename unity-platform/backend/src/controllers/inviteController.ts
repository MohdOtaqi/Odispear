import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

// Generate invite link for a server
export const createInvite = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { guildId } = req.params;
    const { maxUses, maxAge, temporary } = req.body;
    const userId = req.user!.id;

    // Check if user has permission to create invites
    const memberResult = await query(
      'SELECT * FROM guild_members WHERE guild_id = $1 AND user_id = $2',
      [guildId, userId]
    );

    if (memberResult.rows.length === 0) {
      throw new AppError('You are not a member of this server', 403);
    }

    // Generate unique invite code
    const inviteCode = uuidv4().substring(0, 8);
    const expiresAt = maxAge ? new Date(Date.now() + maxAge * 1000) : null;

    const result = await query(
      `INSERT INTO guild_invites (guild_id, code, creator_id, max_uses, max_age, temporary, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [guildId, inviteCode, userId, maxUses || null, maxAge || null, temporary || false, expiresAt]
    );

    res.status(201).json({
      ...result.rows[0],
      url: `${process.env.FRONTEND_URL}/invite/${inviteCode}`
    });
  } catch (error) {
    next(error);
  }
};

// Get all invites for a server
export const getGuildInvites = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { guildId } = req.params;
    const userId = req.user!.id;

    // Check if user is admin or owner
    const guildResult = await query(
      'SELECT owner_id FROM guilds WHERE id = $1',
      [guildId]
    );

    if (guildResult.rows.length === 0) {
      throw new AppError('Server not found', 404);
    }

    const result = await query(
      `SELECT i.*, u.username as creator_username, u.avatar_url as creator_avatar
       FROM guild_invites i
       JOIN users u ON i.creator_id = u.id
       WHERE i.guild_id = $1 AND (i.expires_at IS NULL OR i.expires_at > NOW())
       ORDER BY i.created_at DESC`,
      [guildId]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// Use an invite link
export const useInvite = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code } = req.params;
    const userId = req.user!.id;

    // Get invite details
    const inviteResult = await query(
      `SELECT i.*, g.name as guild_name, g.icon_url as guild_icon
       FROM guild_invites i
       JOIN guilds g ON i.guild_id = g.id
       WHERE i.code = $1 AND (i.expires_at IS NULL OR i.expires_at > NOW())`,
      [code]
    );

    if (inviteResult.rows.length === 0) {
      throw new AppError('Invalid or expired invite', 404);
    }

    const invite = inviteResult.rows[0];

    // Check if already a member
    const memberCheck = await query(
      'SELECT * FROM guild_members WHERE guild_id = $1 AND user_id = $2',
      [invite.guild_id, userId]
    );

    if (memberCheck.rows.length > 0) {
      return res.json({
        message: 'You are already a member of this server',
        guild_id: invite.guild_id
      });
    }

    // Check if invite has uses left
    if (invite.max_uses && invite.uses >= invite.max_uses) {
      throw new AppError('This invite has reached its maximum uses', 410);
    }

    // Add user to guild
    await query(
      'INSERT INTO guild_members (guild_id, user_id) VALUES ($1, $2)',
      [invite.guild_id, userId]
    );

    // Assign @everyone role
    const everyoneRoleResult = await query(
      'SELECT id FROM roles WHERE guild_id = $1 AND name = $2',
      [invite.guild_id, '@everyone']
    );

    if (everyoneRoleResult.rows.length > 0) {
      await query(
        'INSERT INTO role_assignments (guild_id, user_id, role_id) VALUES ($1, $2, $3)',
        [invite.guild_id, userId, everyoneRoleResult.rows[0].id]
      );
    }

    // Increment invite uses
    await query(
      'UPDATE guild_invites SET uses = uses + 1 WHERE id = $1',
      [invite.id]
    );

    res.json({
      message: 'Successfully joined server',
      guild: {
        id: invite.guild_id,
        name: invite.guild_name,
        icon: invite.guild_icon
      }
    });
  } catch (error) {
    next(error);
  }
};

// Delete an invite
export const deleteInvite = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code } = req.params;
    const userId = req.user!.id;

    const inviteResult = await query(
      'SELECT * FROM guild_invites WHERE code = $1',
      [code]
    );

    if (inviteResult.rows.length === 0) {
      throw new AppError('Invite not found', 404);
    }

    const invite = inviteResult.rows[0];

    // Check if user can delete (creator or server owner)
    const guildResult = await query(
      'SELECT owner_id FROM guilds WHERE id = $1',
      [invite.guild_id]
    );

    if (invite.creator_id !== userId && guildResult.rows[0].owner_id !== userId) {
      throw new AppError('You do not have permission to delete this invite', 403);
    }

    await query('DELETE FROM guild_invites WHERE code = $1', [code]);

    res.json({ message: 'Invite deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Get invite info (for preview)
export const getInviteInfo = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code } = req.params;

    const result = await query(
      `SELECT 
        g.id, g.name, g.description, g.icon_url,
        (SELECT COUNT(*) FROM guild_members WHERE guild_id = g.id) as member_count,
        (SELECT COUNT(*) FROM guild_members WHERE guild_id = g.id AND user_id IN 
          (SELECT id FROM users WHERE status != 'offline')) as online_count
       FROM guild_invites i
       JOIN guilds g ON i.guild_id = g.id
       WHERE i.code = $1 AND (i.expires_at IS NULL OR i.expires_at > NOW())`,
      [code]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid or expired invite', 404);
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};
