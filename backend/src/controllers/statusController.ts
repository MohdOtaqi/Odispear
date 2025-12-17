import { Request, Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';
import logger from '../config/logger';
import redisClient, { isRedisEnabled } from '../config/redis';

// Helper to safely call Redis methods
const safeRedis = {
  async sMembers(key: string): Promise<string[]> {
    if (!isRedisEnabled() || !redisClient) return [];
    try { return await redisClient.sMembers(key); } catch (e) { return []; }
  },
  async sIsMember(key: string, member: string): Promise<boolean> {
    if (!isRedisEnabled() || !redisClient) return false;
    try { return await redisClient.sIsMember(key, member); } catch (e) { return false; }
  },
  async sAdd(key: string, member: string): Promise<void> {
    if (!isRedisEnabled() || !redisClient) return;
    try { await redisClient.sAdd(key, member); } catch (e) { /* ignore */ }
  },
  async sRem(key: string, member: string): Promise<void> {
    if (!isRedisEnabled() || !redisClient) return;
    try { await redisClient.sRem(key, member); } catch (e) { /* ignore */ }
  },
  async setEx(key: string, seconds: number, value: string): Promise<void> {
    if (!isRedisEnabled() || !redisClient) return;
    try { await redisClient.setEx(key, seconds, value); } catch (e) { /* ignore */ }
  },
  async del(key: string): Promise<void> {
    if (!isRedisEnabled() || !redisClient) return;
    try { await redisClient.del(key); } catch (e) { /* ignore */ }
  },
};

// Get all online users
export const getOnlineUsers = async (req: Request, res: Response) => {
  try {
    // Get online users from Redis
    const onlineUserIds = await safeRedis.sMembers('online_users');
    
    if (onlineUserIds.length === 0) {
      return res.json([]);
    }
    
    // Get user details from database
    const result = await pool.query(
      `SELECT id, username, display_name, avatar_url, status, custom_status
       FROM users 
       WHERE id = ANY($1::uuid[])`,
      [onlineUserIds]
    );
    
    res.json(result.rows);
  } catch (error) {
    logger.error('Failed to get online users:', error);
    res.status(500).json({ error: 'Failed to get online users' });
  }
};

// Get user status
export const getUserStatus = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Check if user is online in Redis
    const isOnline = await safeRedis.sIsMember('online_users', userId);
    
    // Get user details from database
    const result = await pool.query(
      `SELECT id, username, display_name, avatar_url, status, custom_status, last_seen
       FROM users 
       WHERE id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    user.is_online = isOnline;
    
    res.json(user);
  } catch (error) {
    logger.error('Failed to get user status:', error);
    res.status(500).json({ error: 'Failed to get user status' });
  }
};

// Update user status (online, idle, dnd, invisible)
export const updateUserStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { status } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Validate status
    const validStatuses = ['online', 'idle', 'dnd', 'invisible'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    // Update in database
    const result = await pool.query(
      `UPDATE users 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, username, display_name, status, custom_status`,
      [status, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update in Redis if not invisible
    if (status !== 'invisible') {
      await safeRedis.sAdd('online_users', userId);
      await safeRedis.setEx(`user_status:${userId}`, 3600, status);
    } else {
      await safeRedis.sRem('online_users', userId);
      await safeRedis.del(`user_status:${userId}`);
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Failed to update user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
};

// Set custom status message
export const setCustomStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { customStatus } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Validate custom status length
    if (customStatus && customStatus.length > 128) {
      return res.status(400).json({ error: 'Custom status too long (max 128 characters)' });
    }
    
    // Update in database
    const result = await pool.query(
      `UPDATE users 
       SET custom_status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, username, display_name, status, custom_status`,
      [customStatus, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Store in Redis for quick access
    await safeRedis.setEx(`custom_status:${userId}`, 3600, customStatus);
    
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Failed to set custom status:', error);
    res.status(500).json({ error: 'Failed to set custom status' });
  }
};

// Clear custom status
export const clearCustomStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Clear in database
    const result = await pool.query(
      `UPDATE users 
       SET custom_status = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, username, display_name, status, custom_status`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Clear in Redis
    await safeRedis.del(`custom_status:${userId}`);
    
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Failed to clear custom status:', error);
    res.status(500).json({ error: 'Failed to clear custom status' });
  }
};