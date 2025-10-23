import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query, getClient } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export const createRole = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { guildId } = req.params;
    const { name, color, permissions, mentionable, hoisted } = req.body;

    // Get the highest position to place new role at top
    const positionResult = await query(
      'SELECT COALESCE(MAX(position), 0) + 1 as next_position FROM roles WHERE guild_id = $1',
      [guildId]
    );

    const result = await query(
      `INSERT INTO roles (guild_id, name, color, permissions, mentionable, hoisted, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        guildId,
        name,
        color || null,
        permissions || 0,
        mentionable !== false,
        hoisted || false,
        positionResult.rows[0].next_position,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const getGuildRoles = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { guildId } = req.params;

    const result = await query(
      `SELECT r.*, 
              COUNT(ra.id) as member_count
       FROM roles r
       LEFT JOIN role_assignments ra ON r.id = ra.role_id
       WHERE r.guild_id = $1
       GROUP BY r.id
       ORDER BY r.position DESC`,
      [guildId]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

export const updateRole = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { roleId } = req.params;
    const { name, color, permissions, mentionable, hoisted } = req.body;

    const result = await query(
      `UPDATE roles
       SET name = COALESCE($1, name),
           color = COALESCE($2, color),
           permissions = COALESCE($3, permissions),
           mentionable = COALESCE($4, mentionable),
           hoisted = COALESCE($5, hoisted)
       WHERE id = $6
       RETURNING *`,
      [name, color, permissions, mentionable, hoisted, roleId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Role not found', 404);
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const deleteRole = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { roleId } = req.params;

    // Check if it's @everyone role
    const roleCheck = await query(
      'SELECT name FROM roles WHERE id = $1',
      [roleId]
    );

    if (roleCheck.rows.length === 0) {
      throw new AppError('Role not found', 404);
    }

    if (roleCheck.rows[0].name === '@everyone') {
      throw new AppError('Cannot delete @everyone role', 400);
    }

    await query('DELETE FROM roles WHERE id = $1', [roleId]);

    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateRolePositions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    const { guildId } = req.params;
    const { positions } = req.body; // Array of { roleId, position }

    for (const { roleId, position } of positions) {
      await client.query(
        'UPDATE roles SET position = $1 WHERE id = $2 AND guild_id = $3',
        [position, roleId, guildId]
      );
    }

    await client.query('COMMIT');

    const result = await query(
      'SELECT * FROM roles WHERE guild_id = $1 ORDER BY position DESC',
      [guildId]
    );

    res.json(result.rows);
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

export const assignRole = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { guildId, userId, roleId } = req.params;

    // Verify role belongs to guild
    const roleCheck = await query(
      'SELECT id FROM roles WHERE id = $1 AND guild_id = $2',
      [roleId, guildId]
    );

    if (roleCheck.rows.length === 0) {
      throw new AppError('Role not found in this guild', 404);
    }

    // Verify user is member of guild
    const memberCheck = await query(
      'SELECT id FROM guild_members WHERE guild_id = $1 AND user_id = $2',
      [guildId, userId]
    );

    if (memberCheck.rows.length === 0) {
      throw new AppError('User is not a member of this guild', 404);
    }

    const result = await query(
      `INSERT INTO role_assignments (guild_id, user_id, role_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, role_id) DO NOTHING
       RETURNING *`,
      [guildId, userId, roleId]
    );

    res.json(result.rows[0] || { message: 'Role already assigned' });
  } catch (error) {
    next(error);
  }
};

export const removeRole = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { guildId, userId, roleId } = req.params;

    // Prevent removing @everyone role
    const roleCheck = await query(
      'SELECT name FROM roles WHERE id = $1',
      [roleId]
    );

    if (roleCheck.rows[0]?.name === '@everyone') {
      throw new AppError('Cannot remove @everyone role', 400);
    }

    await query(
      'DELETE FROM role_assignments WHERE guild_id = $1 AND user_id = $2 AND role_id = $3',
      [guildId, userId, roleId]
    );

    res.json({ message: 'Role removed successfully' });
  } catch (error) {
    next(error);
  }
};

export const getMemberRoles = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { guildId, userId } = req.params;

    const result = await query(
      `SELECT r.*
       FROM roles r
       JOIN role_assignments ra ON r.id = ra.role_id
       WHERE ra.guild_id = $1 AND ra.user_id = $2
       ORDER BY r.position DESC`,
      [guildId, userId]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

export const setChannelPermissionOverride = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { channelId } = req.params;
    const { roleId, userId, allow, deny } = req.body;

    if (!roleId && !userId) {
      throw new AppError('Must specify either roleId or userId', 400);
    }

    if (roleId && userId) {
      throw new AppError('Cannot specify both roleId and userId', 400);
    }

    const result = await query(
      `INSERT INTO channel_permissions (channel_id, role_id, user_id, allow, deny)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (channel_id, COALESCE(role_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid))
       DO UPDATE SET allow = $4, deny = $5
       RETURNING *`,
      [channelId, roleId || null, userId || null, allow || 0, deny || 0]
    );

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const getChannelPermissionOverrides = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { channelId } = req.params;

    const result = await query(
      `SELECT 
        cp.*,
        r.name as role_name,
        u.username as user_name
       FROM channel_permissions cp
       LEFT JOIN roles r ON cp.role_id = r.id
       LEFT JOIN users u ON cp.user_id = u.id
       WHERE cp.channel_id = $1`,
      [channelId]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

export const deleteChannelPermissionOverride = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { channelId, overrideId } = req.params;

    await query(
      'DELETE FROM channel_permissions WHERE id = $1 AND channel_id = $2',
      [overrideId, channelId]
    );

    res.json({ message: 'Permission override deleted successfully' });
  } catch (error) {
    next(error);
  }
};
