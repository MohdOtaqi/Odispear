import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query, getClient } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export const banUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    const { guildId } = req.params;
    const { user_id, reason } = req.body;
    const moderatorId = req.user!.id;

    // Ban user
    await client.query(
      `INSERT INTO banned_users (guild_id, user_id, moderator_id, reason)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (guild_id, user_id) DO NOTHING`,
      [guildId, user_id, moderatorId, reason]
    );

    // Remove from guild
    await client.query(
      'DELETE FROM guild_members WHERE guild_id = $1 AND user_id = $2',
      [guildId, user_id]
    );

    // Log action
    await client.query(
      `INSERT INTO moderation_actions (guild_id, user_id, moderator_id, action_type, reason)
       VALUES ($1, $2, $3, 'ban', $4)`,
      [guildId, user_id, moderatorId, reason]
    );

    // Audit log
    await client.query(
      `INSERT INTO audit_logs (guild_id, user_id, action_type, target_type, target_id, reason)
       VALUES ($1, $2, 'user.ban', 'user', $3, $4)`,
      [guildId, moderatorId, user_id, reason]
    );

    await client.query('COMMIT');

    res.json({ message: 'User banned successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

export const kickUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    const { guildId } = req.params;
    const { user_id, reason } = req.body;
    const moderatorId = req.user!.id;

    // Remove from guild
    await client.query(
      'DELETE FROM guild_members WHERE guild_id = $1 AND user_id = $2',
      [guildId, user_id]
    );

    // Log action
    await client.query(
      `INSERT INTO moderation_actions (guild_id, user_id, moderator_id, action_type, reason)
       VALUES ($1, $2, $3, 'kick', $4)`,
      [guildId, user_id, moderatorId, reason]
    );

    // Audit log
    await client.query(
      `INSERT INTO audit_logs (guild_id, user_id, action_type, target_type, target_id, reason)
       VALUES ($1, $2, 'user.kick', 'user', $3, $4)`,
      [guildId, moderatorId, user_id, reason]
    );

    await client.query('COMMIT');

    res.json({ message: 'User kicked successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

export const muteUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { guildId } = req.params;
    const { user_id, reason, duration } = req.body;
    const moderatorId = req.user!.id;

    const expiresAt = duration 
      ? new Date(Date.now() + duration * 1000) 
      : null;

    await query(
      `INSERT INTO moderation_actions (guild_id, user_id, moderator_id, action_type, reason, expires_at)
       VALUES ($1, $2, $3, 'mute', $4, $5)`,
      [guildId, user_id, moderatorId, reason, expiresAt]
    );

    await query(
      `INSERT INTO audit_logs (guild_id, user_id, action_type, target_type, target_id, reason)
       VALUES ($1, $2, 'user.mute', 'user', $3, $4)`,
      [guildId, moderatorId, user_id, reason]
    );

    res.json({ message: 'User muted successfully' });
  } catch (error) {
    next(error);
  }
};

export const unbanUser = async (
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

    res.json({ message: 'User unbanned successfully' });
  } catch (error) {
    next(error);
  }
};

export const getBannedUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { guildId } = req.params;

    const result = await query(
      `SELECT bu.*, u.username, u.display_name, m.username as moderator_username
       FROM banned_users bu
       JOIN users u ON bu.user_id = u.id
       JOIN users m ON bu.moderator_id = m.id
       WHERE bu.guild_id = $1
       ORDER BY bu.banned_at DESC`,
      [guildId]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

export const getAuditLogs = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { guildId } = req.params;
    const { limit = 50, action_type } = req.query;

    let queryText = `
      SELECT al.*, u.username
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.guild_id = $1
    `;

    const params: any[] = [guildId];

    if (action_type) {
      params.push(action_type);
      queryText += ` AND al.action_type = $${params.length}`;
    }

    queryText += ` ORDER BY al.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await query(queryText, params);

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

export const addWordFilter = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { guildId } = req.params;
    const { pattern, action } = req.body;

    const result = await query(
      `INSERT INTO word_filters (guild_id, pattern, action)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [guildId, pattern, action || 'delete']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const getWordFilters = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { guildId } = req.params;

    const result = await query(
      'SELECT * FROM word_filters WHERE guild_id = $1 ORDER BY created_at',
      [guildId]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

export const deleteWordFilter = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { filterId } = req.params;

    await query('DELETE FROM word_filters WHERE id = $1', [filterId]);

    res.json({ message: 'Word filter deleted successfully' });
  } catch (error) {
    next(error);
  }
};
