import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query, getClient } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export const createDM = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { recipientId } = req.body;
    const userId = req.user!.id;

    if (recipientId === userId) {
      throw new AppError('Cannot create DM with yourself', 400);
    }

    // Check if users are friends
    const friendshipCheck = await query(
      `SELECT id FROM friendships 
       WHERE ((user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1))
       AND status = 'accepted'`,
      [userId, recipientId]
    );

    if (friendshipCheck.rows.length === 0) {
      throw new AppError('Can only DM friends', 403);
    }

    // Use database function to get or create DM channel
    const result = await query(
      'SELECT get_or_create_dm_channel($1, $2) as channel_id',
      [userId, recipientId]
    );

    const channelId = result.rows[0].channel_id;

    // Get channel details with participant info
    const channelResult = await query(
      `SELECT 
        dmc.*,
        json_agg(
          json_build_object(
            'id', u.id,
            'username', u.username,
            'display_name', u.display_name,
            'avatar_url', u.avatar_url,
            'status', u.status
          )
        ) as participants
       FROM dm_channels dmc
       JOIN dm_participants dp ON dp.dm_channel_id = dmc.id
       JOIN users u ON u.id = dp.user_id
       WHERE dmc.id = $1
       GROUP BY dmc.id`,
      [channelId]
    );

    res.json(channelResult.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const createGroupDM = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    const { name, recipientIds } = req.body;
    const userId = req.user!.id;

    if (!Array.isArray(recipientIds) || recipientIds.length < 1 || recipientIds.length > 9) {
      throw new AppError('Group DM must have 1-9 recipients', 400);
    }

    // Create group DM channel
    const channelResult = await client.query(
      `INSERT INTO dm_channels (type, name)
       VALUES ('group_dm', $1)
       RETURNING *`,
      [name || 'Group Chat']
    );

    const channelId = channelResult.rows[0].id;

    // Add creator
    await client.query(
      'INSERT INTO dm_participants (dm_channel_id, user_id) VALUES ($1, $2)',
      [channelId, userId]
    );

    // Add recipients
    for (const recipientId of recipientIds) {
      await client.query(
        'INSERT INTO dm_participants (dm_channel_id, user_id) VALUES ($1, $2)',
        [channelId, recipientId]
      );
    }

    await client.query('COMMIT');

    // Get full channel details
    const fullChannelResult = await query(
      `SELECT 
        dmc.*,
        json_agg(
          json_build_object(
            'id', u.id,
            'username', u.username,
            'display_name', u.display_name,
            'avatar_url', u.avatar_url,
            'status', u.status
          )
        ) as participants
       FROM dm_channels dmc
       JOIN dm_participants dp ON dp.dm_channel_id = dmc.id
       JOIN users u ON u.id = dp.user_id
       WHERE dmc.id = $1
       GROUP BY dmc.id`,
      [channelId]
    );

    res.status(201).json(fullChannelResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

export const getDMChannels = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;

    const result = await query(
      `SELECT 
        dmc.*,
        json_agg(
          json_build_object(
            'id', u.id,
            'username', u.username,
            'display_name', u.display_name,
            'avatar_url', u.avatar_url,
            'status', u.status
          )
        ) as participants,
        (
          SELECT json_build_object(
            'content', dm.content,
            'author_id', dm.author_id,
            'created_at', dm.created_at
          )
          FROM dm_messages dm
          WHERE dm.dm_channel_id = dmc.id
          AND dm.deleted_at IS NULL
          ORDER BY dm.created_at DESC
          LIMIT 1
        ) as last_message
       FROM dm_channels dmc
       JOIN dm_participants dp ON dp.dm_channel_id = dmc.id
       JOIN users u ON u.id = dp.user_id
       WHERE dmc.id IN (
         SELECT dm_channel_id FROM dm_participants WHERE user_id = $1
       )
       GROUP BY dmc.id
       ORDER BY dmc.updated_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

export const getDMMessages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { channelId } = req.params;
    const { limit = 50, before, after } = req.query;
    const userId = req.user!.id;

    // Verify user is participant
    const participantCheck = await query(
      'SELECT id FROM dm_participants WHERE dm_channel_id = $1 AND user_id = $2',
      [channelId, userId]
    );

    if (participantCheck.rows.length === 0) {
      throw new AppError('Not a participant of this DM', 403);
    }

    let queryText = `
      SELECT m.*, u.username, u.display_name, u.avatar_url,
             json_agg(json_build_object(
               'id', ma.id,
               'filename', ma.filename,
               'file_url', ma.file_url,
               'file_size', ma.file_size,
               'mime_type', ma.mime_type
             )) FILTER (WHERE ma.id IS NOT NULL) as attachments
      FROM dm_messages m
      JOIN users u ON m.author_id = u.id
      LEFT JOIN dm_message_attachments ma ON m.id = ma.message_id
      WHERE m.dm_channel_id = $1 AND m.deleted_at IS NULL
    `;

    const params: any[] = [channelId];
    let paramCount = 1;

    if (before) {
      paramCount++;
      queryText += ` AND m.created_at < (SELECT created_at FROM dm_messages WHERE id = $${paramCount})`;
      params.push(before);
    }

    if (after) {
      paramCount++;
      queryText += ` AND m.created_at > (SELECT created_at FROM dm_messages WHERE id = $${paramCount})`;
      params.push(after);
    }

    queryText += ` GROUP BY m.id, u.username, u.display_name, u.avatar_url`;
    queryText += ` ORDER BY m.created_at DESC LIMIT $${paramCount + 1}`;
    params.push(limit);

    const result = await query(queryText, params);

    res.json(result.rows.reverse());
  } catch (error) {
    next(error);
  }
};

export const sendDMMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { channelId } = req.params;
    const { content, reply_to_id } = req.body;
    const userId = req.user!.id;

    // Verify user is participant
    const participantCheck = await query(
      'SELECT id FROM dm_participants WHERE dm_channel_id = $1 AND user_id = $2',
      [channelId, userId]
    );

    if (participantCheck.rows.length === 0) {
      throw new AppError('Not a participant of this DM', 403);
    }

    const result = await query(
      `INSERT INTO dm_messages (dm_channel_id, author_id, content, reply_to_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [channelId, userId, content, reply_to_id]
    );

    const message = result.rows[0];

    // Update DM channel updated_at
    await query(
      'UPDATE dm_channels SET updated_at = NOW() WHERE id = $1',
      [channelId]
    );

    // Get user info
    const userResult = await query(
      'SELECT username, display_name, avatar_url FROM users WHERE id = $1',
      [userId]
    );

    res.status(201).json({
      ...message,
      ...userResult.rows[0],
      attachments: [],
    });
  } catch (error) {
    next(error);
  }
};

export const updateDMMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user!.id;

    const result = await query(
      `UPDATE dm_messages 
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

export const deleteDMMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { messageId } = req.params;
    const userId = req.user!.id;

    const result = await query(
      `UPDATE dm_messages 
       SET deleted_at = NOW()
       WHERE id = $1 AND author_id = $2
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

export const addDMReaction = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user!.id;

    await query(
      `INSERT INTO dm_message_reactions (message_id, user_id, emoji)
       VALUES ($1, $2, $3)
       ON CONFLICT (message_id, user_id, emoji) DO NOTHING`,
      [messageId, userId, emoji]
    );

    res.json({ message: 'Reaction added' });
  } catch (error) {
    next(error);
  }
};

export const removeDMReaction = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { messageId, emoji } = req.params;
    const userId = req.user!.id;

    await query(
      'DELETE FROM dm_message_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3',
      [messageId, userId, emoji]
    );

    res.json({ message: 'Reaction removed' });
  } catch (error) {
    next(error);
  }
};

export const leaveDM = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { channelId } = req.params;
    const userId = req.user!.id;

    // Check if it's a group DM
    const channelResult = await query(
      'SELECT type FROM dm_channels WHERE id = $1',
      [channelId]
    );

    if (channelResult.rows.length === 0) {
      throw new AppError('DM channel not found', 404);
    }

    if (channelResult.rows[0].type === 'dm') {
      throw new AppError('Cannot leave 1-on-1 DM', 400);
    }

    await query(
      'DELETE FROM dm_participants WHERE dm_channel_id = $1 AND user_id = $2',
      [channelId, userId]
    );

    res.json({ message: 'Left group DM successfully' });
  } catch (error) {
    next(error);
  }
};
