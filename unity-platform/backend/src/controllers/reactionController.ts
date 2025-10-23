import { Request, Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';
import logger from '../config/logger';
import { io } from '../index';

// Add reaction to a message
export const addReaction = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { messageId } = req.params;
    const { emoji } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (!emoji || emoji.length > 50) {
      return res.status(400).json({ error: 'Invalid emoji' });
    }
    
    // Check if message exists
    const messageCheck = await pool.query(
      'SELECT channel_id FROM messages WHERE id = $1',
      [messageId]
    );
    
    if (messageCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    const channelId = messageCheck.rows[0].channel_id;
    
    // Add or update reaction
    const result = await pool.query(
      `INSERT INTO message_reactions (message_id, user_id, emoji)
       VALUES ($1, $2, $3)
       ON CONFLICT (message_id, user_id, emoji)
       DO UPDATE SET created_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [messageId, userId, emoji]
    );
    
    // Emit socket event
    io.to(`channel:${channelId}`).emit('reaction.added', {
      messageId,
      userId,
      emoji,
      reaction: result.rows[0]
    });
    
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Failed to add reaction:', error);
    res.status(500).json({ error: 'Failed to add reaction' });
  }
};

// Remove reaction from a message
export const removeReaction = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { messageId, emoji } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Get channel ID for socket emission
    const messageCheck = await pool.query(
      'SELECT channel_id FROM messages WHERE id = $1',
      [messageId]
    );
    
    if (messageCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    const channelId = messageCheck.rows[0].channel_id;
    
    // Remove reaction
    const result = await pool.query(
      `DELETE FROM message_reactions 
       WHERE message_id = $1 AND user_id = $2 AND emoji = $3
       RETURNING *`,
      [messageId, userId, emoji]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reaction not found' });
    }
    
    // Emit socket event
    io.to(`channel:${channelId}`).emit('reaction.removed', {
      messageId,
      userId,
      emoji
    });
    
    res.json({ message: 'Reaction removed' });
  } catch (error) {
    logger.error('Failed to remove reaction:', error);
    res.status(500).json({ error: 'Failed to remove reaction' });
  }
};

// Get all reactions for a message
export const getReactions = async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    
    // Get reactions with user info
    const result = await pool.query(
      `SELECT 
         r.emoji,
         COUNT(r.user_id) as count,
         array_agg(
           json_build_object(
             'id', u.id,
             'username', u.username,
             'display_name', u.display_name,
             'avatar_url', u.avatar_url
           )
         ) as users
       FROM message_reactions r
       JOIN users u ON r.user_id = u.id
       WHERE r.message_id = $1
       GROUP BY r.emoji`,
      [messageId]
    );
    
    res.json(result.rows);
  } catch (error) {
    logger.error('Failed to get reactions:', error);
    res.status(500).json({ error: 'Failed to get reactions' });
  }
};

// Bulk add reactions (for initial load)
export const bulkAddReactions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { messageId } = req.params;
    const { emojis } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (!Array.isArray(emojis) || emojis.length > 20) {
      return res.status(400).json({ error: 'Invalid emojis array' });
    }
    
    // Check if message exists
    const messageCheck = await pool.query(
      'SELECT channel_id FROM messages WHERE id = $1',
      [messageId]
    );
    
    if (messageCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    const channelId = messageCheck.rows[0].channel_id;
    
    // Bulk insert reactions
    const values = emojis.map(emoji => `('${messageId}', '${userId}', '${emoji}')`).join(',');
    
    const result = await pool.query(
      `INSERT INTO message_reactions (message_id, user_id, emoji)
       VALUES ${values}
       ON CONFLICT (message_id, user_id, emoji)
       DO UPDATE SET created_at = CURRENT_TIMESTAMP
       RETURNING *`
    );
    
    // Emit socket event for each reaction
    emojis.forEach(emoji => {
      io.to(`channel:${channelId}`).emit('reaction.added', {
        messageId,
        userId,
        emoji
      });
    });
    
    res.json(result.rows);
  } catch (error) {
    logger.error('Failed to bulk add reactions:', error);
    res.status(500).json({ error: 'Failed to bulk add reactions' });
  }
};

// Get users who reacted with a specific emoji
export const getReactionUsers = async (req: Request, res: Response) => {
  try {
    const { messageId, emoji } = req.params;
    
    const result = await pool.query(
      `SELECT 
         u.id,
         u.username,
         u.display_name,
         u.avatar_url,
         r.created_at as reacted_at
       FROM message_reactions r
       JOIN users u ON r.user_id = u.id
       WHERE r.message_id = $1 AND r.emoji = $2
       ORDER BY r.created_at DESC`,
      [messageId, emoji]
    );
    
    res.json(result.rows);
  } catch (error) {
    logger.error('Failed to get reaction users:', error);
    res.status(500).json({ error: 'Failed to get reaction users' });
  }
};