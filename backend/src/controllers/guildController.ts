import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query, getClient } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { generateInviteCode } from '../utils/tokens';
import { Permission } from '../middleware/permissions';

export const createGuild = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    const { name, description, template_type } = req.body;
    const userId = req.user!.id;

    // Create guild
    const guildResult = await client.query(
      `INSERT INTO guilds (name, description, owner_id, template_type)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, description, userId, template_type || 'custom']
    );

    const guild = guildResult.rows[0];

    // Add owner as member
    await client.query(
      'INSERT INTO guild_members (guild_id, user_id) VALUES ($1, $2)',
      [guild.id, userId]
    );

    // Create default @everyone role
    const everyoneRole = await client.query(
      `INSERT INTO roles (guild_id, name, permissions, position)
       VALUES ($1, '@everyone', $2, 0)
       RETURNING *`,
      [guild.id, Permission.VIEW_CHANNEL | Permission.SEND_MESSAGES | Permission.CONNECT_VOICE]
    );

    // Assign @everyone role to owner
    await client.query(
      'INSERT INTO role_assignments (guild_id, user_id, role_id) VALUES ($1, $2, $3)',
      [guild.id, userId, everyoneRole.rows[0].id]
    );

    // Create default channels based on template
    const channels = getDefaultChannels(template_type);
    
    for (const channel of channels) {
      await client.query(
        `INSERT INTO channels (guild_id, name, type, topic, position)
         VALUES ($1, $2, $3, $4, $5)`,
        [guild.id, channel.name, channel.type, channel.topic, channel.position]
      );
    }

    await client.query('COMMIT');

    res.status(201).json(guild);
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

function getDefaultChannels(templateType: string) {
  const common = [
    { name: 'general', type: 'text', topic: 'General discussion', position: 0 },
    { name: 'announcements', type: 'text', topic: 'Important announcements', position: 1 },
    { name: 'General Voice', type: 'voice', topic: null, position: 2 },
  ];

  if (templateType === 'esports') {
    return [
      ...common,
      { name: 'team-chat', type: 'text', topic: 'Team coordination', position: 3 },
      { name: 'tournaments', type: 'text', topic: 'Tournament information', position: 4 },
      { name: 'Team Voice', type: 'voice', topic: null, position: 5 },
      { name: 'Scrims', type: 'voice', topic: null, position: 6 },
    ];
  } else if (templateType === 'study') {
    return [
      ...common,
      { name: 'homework-help', type: 'text', topic: 'Ask questions', position: 3 },
      { name: 'resources', type: 'text', topic: 'Study materials', position: 4 },
      { name: 'Study Room', type: 'voice', topic: null, position: 5 },
    ];
  }

  return common;
}

export const getGuild = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM guilds WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Guild not found', 404);
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const getUserGuilds = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;

    const result = await query(
      `SELECT g.* FROM guilds g
       JOIN guild_members gm ON g.id = gm.guild_id
       WHERE gm.user_id = $1
       ORDER BY g.name`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

export const updateGuild = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, description, icon_url, banner_url } = req.body;

    const result = await query(
      `UPDATE guilds 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           icon_url = COALESCE($3, icon_url),
           banner_url = COALESCE($4, banner_url)
       WHERE id = $5
       RETURNING *`,
      [name, description, icon_url, banner_url, id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Guild not found', 404);
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const deleteGuild = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    await query('DELETE FROM guilds WHERE id = $1', [id]);

    res.json({ message: 'Guild deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getGuildMembers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT u.id, u.username, u.display_name, u.avatar_url, u.status,
              gm.nickname, gm.joined_at
       FROM guild_members gm
       JOIN users u ON gm.user_id = u.id
       WHERE gm.guild_id = $1
       ORDER BY gm.joined_at`,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

export const createInvite = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { max_uses, expires_in } = req.body;
    const userId = req.user!.id;

    const code = generateInviteCode();
    const expiresAt = expires_in 
      ? new Date(Date.now() + expires_in * 1000) 
      : null;

    const result = await query(
      `INSERT INTO invites (guild_id, inviter_id, code, max_uses, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, userId, code, max_uses || 0, expiresAt]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const joinGuildByInvite = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    const { code } = req.params;
    const userId = req.user!.id;

    // Get invite
    const inviteResult = await client.query(
      `SELECT * FROM invites 
       WHERE code = $1 
       AND (expires_at IS NULL OR expires_at > NOW())
       AND (max_uses = 0 OR uses < max_uses)`,
      [code]
    );

    if (inviteResult.rows.length === 0) {
      throw new AppError('Invalid or expired invite', 404);
    }

    const invite = inviteResult.rows[0];

    // Check if already a member
    const memberCheck = await client.query(
      'SELECT id FROM guild_members WHERE guild_id = $1 AND user_id = $2',
      [invite.guild_id, userId]
    );

    if (memberCheck.rows.length > 0) {
      await client.query('COMMIT');
      return res.json({ message: 'Already a member', guild_id: invite.guild_id });
    }

    // Add as member
    await client.query(
      'INSERT INTO guild_members (guild_id, user_id) VALUES ($1, $2)',
      [invite.guild_id, userId]
    );

    // Assign @everyone role
    const everyoneRole = await client.query(
      'SELECT id FROM roles WHERE guild_id = $1 AND name = $2',
      [invite.guild_id, '@everyone']
    );

    if (everyoneRole.rows.length > 0) {
      await client.query(
        'INSERT INTO role_assignments (guild_id, user_id, role_id) VALUES ($1, $2, $3)',
        [invite.guild_id, userId, everyoneRole.rows[0].id]
      );
    }

    // Increment invite uses
    await client.query(
      'UPDATE invites SET uses = uses + 1 WHERE id = $1',
      [invite.id]
    );

    await client.query('COMMIT');

    res.json({ message: 'Joined guild successfully', guild_id: invite.guild_id });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

export const leaveGuild = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if owner
    const guildResult = await query(
      'SELECT owner_id FROM guilds WHERE id = $1',
      [id]
    );

    if (guildResult.rows.length === 0) {
      throw new AppError('Guild not found', 404);
    }

    if (guildResult.rows[0].owner_id === userId) {
      throw new AppError('Owner cannot leave guild. Transfer ownership or delete the guild.', 400);
    }

    // Remove member
    await query(
      'DELETE FROM guild_members WHERE guild_id = $1 AND user_id = $2',
      [id, userId]
    );

    res.json({ message: 'Left guild successfully' });
  } catch (error) {
    next(error);
  }
};
