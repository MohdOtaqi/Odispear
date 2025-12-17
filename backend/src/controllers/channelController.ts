import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { io } from '../index';

export const createChannel = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { guildId } = req.params;
    const { name, type, topic, parent_id, nsfw } = req.body;

    const result = await query(
      `INSERT INTO channels (guild_id, name, type, topic, parent_id, nsfw)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [guildId, name, type, topic, parent_id, nsfw || false]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const getGuildChannels = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { guildId } = req.params;

    const result = await query(
      'SELECT * FROM channels WHERE guild_id = $1 ORDER BY position, created_at',
      [guildId]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

export const getChannel = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM channels WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Channel not found', 404);
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const updateChannel = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, topic, position, nsfw, rate_limit_per_user } = req.body;

    const result = await query(
      `UPDATE channels 
       SET name = COALESCE($1, name),
           topic = COALESCE($2, topic),
           position = COALESCE($3, position),
           nsfw = COALESCE($4, nsfw),
           rate_limit_per_user = COALESCE($5, rate_limit_per_user)
       WHERE id = $6
       RETURNING *`,
      [name, topic, position, nsfw, rate_limit_per_user, id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Channel not found', 404);
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const deleteChannel = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    await query('DELETE FROM channels WHERE id = $1', [id]);

    res.json({ message: 'Channel deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getChannelMessages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { limit = 50, before, after } = req.query;

    let queryText = `
      SELECT m.*, u.username, u.display_name, u.avatar_url,
             json_agg(json_build_object(
               'id', ma.id,
               'filename', ma.filename,
               'file_url', ma.file_url,
               'file_size', ma.file_size,
               'mime_type', ma.mime_type
             )) FILTER (WHERE ma.id IS NOT NULL) as attachments
      FROM messages m
      JOIN users u ON m.author_id = u.id
      LEFT JOIN message_attachments ma ON m.id = ma.message_id
      WHERE m.channel_id = $1 AND m.deleted_at IS NULL
    `;

    const params: any[] = [id];
    let paramCount = 1;

    if (before) {
      paramCount++;
      queryText += ` AND m.created_at < (SELECT created_at FROM messages WHERE id = $${paramCount})`;
      params.push(before);
    }

    if (after) {
      paramCount++;
      queryText += ` AND m.created_at > (SELECT created_at FROM messages WHERE id = $${paramCount})`;
      params.push(after);
    }

    queryText += ` GROUP BY m.id, u.username, u.display_name, u.avatar_url`;
    queryText += ` ORDER BY m.created_at ASC LIMIT $${paramCount + 1}`;
    params.push(limit);

    const result = await query(queryText, params);

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

export const createMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { content, reply_to_id } = req.body;
    const userId = req.user!.id;

    const result = await query(
      `INSERT INTO messages (channel_id, author_id, content, reply_to_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, userId, content, reply_to_id]
    );

    const message = result.rows[0];

    // Get user info
    const userResult = await query(
      'SELECT username, display_name, avatar_url FROM users WHERE id = $1',
      [userId]
    );

    const fullMessage = {
      ...message,
      ...userResult.rows[0],
      attachments: [],
    };

    // Broadcast new message to all users in the channel via WebSocket
    io.to(`channel:${id}`).emit('message.create', fullMessage);

    res.status(201).json(fullMessage);
  } catch (error) {
    next(error);
  }
};

export const updateMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user!.id;

    const result = await query(
      `UPDATE messages 
       SET content = $1, edited_at = NOW()
       WHERE id = $2 AND author_id = $3 AND deleted_at IS NULL
       RETURNING *`,
      [content, messageId, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Message not found or unauthorized', 404);
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const deleteMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { messageId } = req.params;
    const userId = req.user!.id;

    const result = await query(
      `UPDATE messages 
       SET deleted_at = NOW()
       WHERE id = $1 AND (author_id = $2 OR $2 IN (
         SELECT gm.user_id FROM guild_members gm
         JOIN channels c ON c.guild_id = gm.guild_id
         JOIN role_assignments ra ON ra.user_id = gm.user_id
         JOIN roles r ON r.id = ra.role_id
         WHERE c.id = messages.channel_id 
         AND (r.permissions & ${1 << 2}) > 0
       ))
       RETURNING id`,
      [messageId, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Message not found or unauthorized', 404);
    }

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const addReaction = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user!.id;

    await query(
      `INSERT INTO message_reactions (message_id, user_id, emoji)
       VALUES ($1, $2, $3)
       ON CONFLICT (message_id, user_id, emoji) DO NOTHING`,
      [messageId, userId, emoji]
    );

    res.json({ message: 'Reaction added' });
  } catch (error) {
    next(error);
  }
};

export const removeReaction = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { messageId, emoji } = req.params;
    const userId = req.user!.id;

    await query(
      'DELETE FROM message_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3',
      [messageId, userId, emoji]
    );

    res.json({ message: 'Reaction removed' });
  } catch (error) {
    next(error);
  }
};
