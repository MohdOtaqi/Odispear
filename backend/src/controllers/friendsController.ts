import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query, getClient } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { io } from '../index';

export const sendFriendRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username } = req.body;
    const userId = req.user!.id;

    // Find user by username
    const userResult = await query(
      'SELECT id, username FROM users WHERE username = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    const friendId = userResult.rows[0].id;

    if (friendId === userId) {
      throw new AppError('Cannot send friend request to yourself', 400);
    }

    // Check if friendship already exists
    const existingResult = await query(
      `SELECT id, status FROM friendships 
       WHERE (user_id = $1 AND friend_id = $2) 
       OR (user_id = $2 AND friend_id = $1)`,
      [userId, friendId]
    );

    if (existingResult.rows.length > 0) {
      const status = existingResult.rows[0].status;
      if (status === 'accepted') {
        throw new AppError('Already friends', 400);
      } else if (status === 'pending') {
        throw new AppError('Friend request already sent', 400);
      } else if (status === 'blocked') {
        throw new AppError('Cannot send friend request', 400);
      }
    }

    // Create friend request
    const result = await query(
      `INSERT INTO friendships (user_id, friend_id, status)
       VALUES ($1, $2, 'pending')
       RETURNING id, user_id, friend_id, status, created_at`,
      [userId, friendId]
    );

    // Notify recipient about friend request via WebSocket
    io.to(`user:${friendId}`).emit('friend.request', {
      request_id: result.rows[0].id,
      user_id: userId,
      username: req.user?.username,
    });

    res.status(201).json({
      ...result.rows[0],
      username: userResult.rows[0].username,
    });
  } catch (error) {
    next(error);
  }
};

export const acceptFriendRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { requestId } = req.params;
    const userId = req.user!.id;

    const result = await query(
      `UPDATE friendships 
       SET status = 'accepted'
       WHERE id = $1 AND friend_id = $2 AND status = 'pending'
       RETURNING *`,
      [requestId, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Friend request not found', 404);
    }

    // Get the user who sent the request so we can notify them
    const senderId = result.rows[0].user_id;

    // Notify the sender that their friend request was accepted
    io.to(`user:${senderId}`).emit('friend.accepted', {
      user_id: userId,
      username: req.user?.username,
      friend_id: senderId,
    });

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const rejectFriendRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { requestId } = req.params;
    const userId = req.user!.id;

    await query(
      'DELETE FROM friendships WHERE id = $1 AND friend_id = $2 AND status = $3',
      [requestId, userId, 'pending']
    );

    res.json({ message: 'Friend request rejected' });
  } catch (error) {
    next(error);
  }
};

export const removeFriend = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { friendId } = req.params;
    const userId = req.user!.id;

    await query(
      `DELETE FROM friendships 
       WHERE ((user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1))
       AND status = 'accepted'`,
      [userId, friendId]
    );

    res.json({ message: 'Friend removed' });
  } catch (error) {
    next(error);
  }
};

export const blockUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId: targetUserId } = req.params;
    const userId = req.user!.id;

    if (targetUserId === userId) {
      throw new AppError('Cannot block yourself', 400);
    }

    // Remove existing friendship if any
    await query(
      `DELETE FROM friendships 
       WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`,
      [userId, targetUserId]
    );

    // Create block entry
    const result = await query(
      `INSERT INTO friendships (user_id, friend_id, status)
       VALUES ($1, $2, 'blocked')
       ON CONFLICT (user_id, friend_id) 
       DO UPDATE SET status = 'blocked'
       RETURNING *`,
      [userId, targetUserId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const unblockUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId: targetUserId } = req.params;
    const userId = req.user!.id;

    await query(
      'DELETE FROM friendships WHERE user_id = $1 AND friend_id = $2 AND status = $3',
      [userId, targetUserId, 'blocked']
    );

    res.json({ message: 'User unblocked' });
  } catch (error) {
    next(error);
  }
};

export const getFriends = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;

    const result = await query(
      `SELECT 
        u.id, u.username, u.display_name, u.avatar_url, u.status, u.status_text,
        f.created_at as friends_since
       FROM friendships f
       JOIN users u ON (
         CASE 
           WHEN f.user_id = $1 THEN u.id = f.friend_id
           ELSE u.id = f.user_id
         END
       )
       WHERE (f.user_id = $1 OR f.friend_id = $1) AND f.status = 'accepted'
       ORDER BY u.username`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

export const getPendingRequests = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;

    const result = await query(
      `SELECT 
        f.id as request_id,
        u.id, u.username, u.display_name, u.avatar_url, u.status,
        f.created_at
       FROM friendships f
       JOIN users u ON u.id = f.user_id
       WHERE f.friend_id = $1 AND f.status = 'pending'
       ORDER BY f.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

export const getSentRequests = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;

    const result = await query(
      `SELECT 
        f.id as request_id,
        u.id, u.username, u.display_name, u.avatar_url, u.status,
        f.created_at
       FROM friendships f
       JOIN users u ON u.id = f.friend_id
       WHERE f.user_id = $1 AND f.status = 'pending'
       ORDER BY f.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

export const getBlockedUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;

    const result = await query(
      `SELECT 
        u.id, u.username, u.display_name, u.avatar_url,
        f.created_at as blocked_at
       FROM friendships f
       JOIN users u ON u.id = f.friend_id
       WHERE f.user_id = $1 AND f.status = 'blocked'
       ORDER BY f.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

export const searchUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { q } = req.query;
    const userId = req.user!.id;

    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      throw new AppError('Search query must be at least 2 characters', 400);
    }

    const searchTerm = `%${q.trim()}%`;

    const result = await query(
      `SELECT 
        u.id, u.username, u.display_name, u.avatar_url, u.status,
        f.status as friendship_status
       FROM users u
       LEFT JOIN friendships f ON (
         (f.user_id = $1 AND f.friend_id = u.id) OR
         (f.friend_id = $1 AND f.user_id = u.id)
       )
       WHERE u.id != $1 
       AND (u.username ILIKE $2 OR u.display_name ILIKE $2)
       ORDER BY u.username
       LIMIT 20`,
      [userId, searchTerm]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};
