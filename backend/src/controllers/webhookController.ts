import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { generateWebhookToken } from '../utils/tokens';

export const createWebhook = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { guildId } = req.params;
    const { channel_id, name, avatar_url } = req.body;
    const userId = req.user!.id;

    const token = generateWebhookToken();

    const result = await query(
      `INSERT INTO webhooks (guild_id, channel_id, creator_id, name, token, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [guildId, channel_id, userId, name, token, avatar_url]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const getGuildWebhooks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { guildId } = req.params;

    const result = await query(
      `SELECT w.*, c.name as channel_name, u.username as creator_username
       FROM webhooks w
       JOIN channels c ON w.channel_id = c.id
       JOIN users u ON w.creator_id = u.id
       WHERE w.guild_id = $1
       ORDER BY w.created_at DESC`,
      [guildId]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

export const deleteWebhook = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { webhookId } = req.params;

    await query('DELETE FROM webhooks WHERE id = $1', [webhookId]);

    res.json({ message: 'Webhook deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const executeWebhook = async (
  req: Request<{ token: string }, any, { content: string; username?: string; avatar_url?: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token } = req.params;
    const { content, username, avatar_url } = req.body;

    // Verify webhook exists
    const webhookResult = await query(
      'SELECT * FROM webhooks WHERE token = $1',
      [token]
    );

    if (webhookResult.rows.length === 0) {
      throw new AppError('Invalid webhook token', 404);
    }

    const webhook = webhookResult.rows[0];

    // Create message with webhook info
    const result = await query(
      `INSERT INTO messages (channel_id, author_id, content, type)
       VALUES ($1, $2, $3, 'webhook')
       RETURNING *`,
      [webhook.channel_id, webhook.creator_id, content]
    );

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const createBot = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username, public: isPublic } = req.body;
    const userId = req.user!.id;

    // Create bot user
    const userResult = await query(
      `INSERT INTO users (username, email, password_hash, display_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [`${username}_bot`, `${username}@bot.local`, 'N/A', username]
    );

    const botUserId = userResult.rows[0].id;
    const token = generateWebhookToken();

    // Create bot entry
    const result = await query(
      `INSERT INTO bots (user_id, owner_id, token, public)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [botUserId, userId, token, isPublic || true]
    );

    res.status(201).json({
      ...result.rows[0],
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserBots = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;

    const result = await query(
      `SELECT b.*, u.username, u.display_name, u.avatar_url
       FROM bots b
       JOIN users u ON b.user_id = u.id
       WHERE b.owner_id = $1
       ORDER BY b.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

export const deleteBot = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { botId } = req.params;
    const userId = req.user!.id;

    // Get bot
    const botResult = await query(
      'SELECT user_id FROM bots WHERE id = $1 AND owner_id = $2',
      [botId, userId]
    );

    if (botResult.rows.length === 0) {
      throw new AppError('Bot not found', 404);
    }

    // Delete bot user
    await query('DELETE FROM users WHERE id = $1', [botResult.rows[0].user_id]);

    res.json({ message: 'Bot deleted successfully' });
  } catch (error) {
    next(error);
  }
};
