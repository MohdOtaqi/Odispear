import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export const updateMemberNickname = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { guildId, userId } = req.params;
    const { nickname } = req.body;

    const result = await query(
      `UPDATE guild_members
       SET nickname = $1
       WHERE guild_id = $2 AND user_id = $3
       RETURNING *`,
      [nickname || null, guildId, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Member not found', 404);
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const kickMember = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { guildId, userId } = req.params;
    const kickedBy = req.user!.id;

    // Verify target is not guild owner
    const guildCheck = await query(
      'SELECT owner_id FROM guilds WHERE id = $1',
      [guildId]
    );

    if (guildCheck.rows[0]?.owner_id === userId) {
      throw new AppError('Cannot kick guild owner', 400);
    }

    if (userId === kickedBy) {
      throw new AppError('Cannot kick yourself', 400);
    }

    // Delete member
    await query(
      'DELETE FROM guild_members WHERE guild_id = $1 AND user_id = $2',
      [guildId, userId]
    );

    // Log to audit log
    await query(
      `INSERT INTO audit_logs (guild_id, user_id, action_type, target_user_id, reason)
       VALUES ($1, $2, 'MEMBER_KICK', $3, $4)`,
      [guildId, kickedBy, userId, req.body.reason || 'No reason provided']
    );

    res.json({ message: 'Member kicked successfully' });
  } catch (error) {
    next(error);
  }
};

export const banMember = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { guildId, userId } = req.params;
    const { reason, delete_message_days } = req.body;
    const bannedBy = req.user!.id;

    // Verify target is not guild owner
    const guildCheck = await query(
      'SELECT owner_id FROM guilds WHERE id = $1',
      [guildId]
    );

    if (guildCheck.rows[0]?.owner_id === userId) {
      throw new AppError('Cannot ban guild owner', 400);
    }

    if (userId === bannedBy) {
      throw new AppError('Cannot ban yourself', 400);
    }

    // Remove from guild
    await query(
      'DELETE FROM guild_members WHERE guild_id = $1 AND user_id = $2',
      [guildId, userId]
    );

    // Add to banned users
    const result = await query(
      `INSERT INTO banned_users (guild_id, user_id, banned_by, reason)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (guild_id, user_id) DO UPDATE
       SET banned_by = $3, reason = $4, banned_at = NOW()
       RETURNING *`,
      [guildId, userId, bannedBy, reason || 'No reason provided']
    );

    // Optionally delete recent messages
    if (delete_message_days && delete_message_days > 0) {
      await query(
        `UPDATE messages
         SET deleted_at = NOW()
         WHERE channel_id IN (SELECT id FROM channels WHERE guild_id = $1)
         AND author_id = $2
         AND created_at > NOW() - INTERVAL '${delete_message_days} days'`,
        [guildId, userId]
      );
    }

    // Log to audit log
    await query(
      `INSERT INTO audit_logs (guild_id, user_id, action_type, target_user_id, reason)
       VALUES ($1, $2, 'MEMBER_BAN', $3, $4)`,
      [guildId, bannedBy, userId, reason || 'No reason provided']
    );

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const unbanMember = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { guildId, userId } = req.params;

    await query(
      'DELETE FROM banned_users WHERE guild_id = $1 AND user_id = $2',
      [guildId, userId]
    );

    // Log to audit log
    await query(
      `INSERT INTO audit_logs (guild_id, user_id, action_type, target_user_id, reason)
       VALUES ($1, $2, 'MEMBER_UNBAN', $3, 'Unbanned')`,
      [guildId, req.user!.id, userId]
    );

    res.json({ message: 'Member unbanned successfully' });
  } catch (error) {
    next(error);
  }
};

export const getBannedMembers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { guildId } = req.params;

    const result = await query(
      `SELECT 
        bu.*,
        u.username,
        u.display_name,
        u.avatar_url,
        ub.username as banned_by_username
       FROM banned_users bu
       JOIN users u ON bu.user_id = u.id
       LEFT JOIN users ub ON bu.banned_by = ub.id
       WHERE bu.guild_id = $1
       ORDER BY bu.banned_at DESC`,
      [guildId]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

export const getMemberWithRoles = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { guildId, userId } = req.params;

    const memberResult = await query(
      `SELECT 
        gm.*,
        u.username,
        u.display_name,
        u.avatar_url,
        u.status,
        u.status_text
       FROM guild_members gm
       JOIN users u ON gm.user_id = u.id
       WHERE gm.guild_id = $1 AND gm.user_id = $2`,
      [guildId, userId]
    );

    if (memberResult.rows.length === 0) {
      throw new AppError('Member not found', 404);
    }

    const rolesResult = await query(
      `SELECT r.*
       FROM roles r
       JOIN role_assignments ra ON r.id = ra.role_id
       WHERE ra.guild_id = $1 AND ra.user_id = $2
       ORDER BY r.position DESC`,
      [guildId, userId]
    );

    const member = memberResult.rows[0];
    member.roles = rolesResult.rows;

    res.json(member);
  } catch (error) {
    next(error);
  }
};

export const updateMemberMuteDeafen = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { guildId, userId } = req.params;
    const { muted, deafened } = req.body;

    const result = await query(
      `UPDATE guild_members
       SET muted = COALESCE($1, muted),
           deafened = COALESCE($2, deafened)
       WHERE guild_id = $3 AND user_id = $4
       RETURNING *`,
      [muted, deafened, guildId, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Member not found', 404);
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};
