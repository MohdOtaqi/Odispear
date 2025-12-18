import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { generateAccessToken, generateRefreshToken } from '../utils/tokens';
import { AuthRequest } from '../middleware/auth';
import { sendPasswordResetEmail } from '../services/emailService';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, username, password } = req.body;

    // Check if user exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      throw new AppError('Email or username already exists', 400);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await query(
      `INSERT INTO users (email, username, password_hash, display_name, status)
       VALUES ($1, $2, $3, $4, 'offline')
       RETURNING id, email, username, display_name, avatar_url, status, created_at`,
      [email, username, passwordHash, username]
    );

    const user = result.rows[0];

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email, user.username);
    const refreshToken = generateRefreshToken();

    // Store refresh token
    await query(
      `INSERT INTO sessions (user_id, refresh_token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
      [user.id, refreshToken]
    );

    res.status(201).json({
      user,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    // Find user
    const result = await query(
      `SELECT id, email, username, password_hash, display_name, avatar_url, status
       FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid email or password', 401);
    }

    const user = result.rows[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email, user.username);
    const refreshToken = generateRefreshToken();

    // Store refresh token
    await query(
      `INSERT INTO sessions (user_id, refresh_token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
      [user.id, refreshToken]
    );

    // Update user status
    await query(
      'UPDATE users SET status = $1 WHERE id = $2',
      ['online', user.id]
    );

    delete user.password_hash;

    res.json({
      user,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await query('DELETE FROM sessions WHERE refresh_token = $1', [refreshToken]);
    }

    // Update user status
    await query(
      'UPDATE users SET status = $1 WHERE id = $2',
      ['offline', req.user!.id]
    );

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token required', 400);
    }

    // Validate refresh token
    const result = await query(
      `SELECT s.user_id, u.email, u.username 
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.refresh_token = $1 AND s.expires_at > NOW()`,
      [refreshToken]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const { user_id, email, username } = result.rows[0];

    // Generate new tokens
    const newAccessToken = generateAccessToken(user_id, email, username);
    const newRefreshToken = generateRefreshToken();

    // Delete old refresh token and create new one
    await query('DELETE FROM sessions WHERE refresh_token = $1', [refreshToken]);
    await query(
      `INSERT INTO sessions (user_id, refresh_token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
      [user_id, newRefreshToken]
    );

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await query(
      `SELECT id, email, username, display_name, avatar_url, status, status_text, created_at
       FROM users WHERE id = $1`,
      [req.user!.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { display_name, status, status_text, avatar_url } = req.body;

    const result = await query(
      `UPDATE users 
       SET display_name = COALESCE($1, display_name),
           status = COALESCE($2, status),
           status_text = COALESCE($3, status_text),
           avatar_url = COALESCE($4, avatar_url)
       WHERE id = $5
       RETURNING id, email, username, display_name, avatar_url, status, status_text`,
      [display_name, status, status_text, avatar_url, req.user!.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const googleAuthCallback = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user as any;
    
    if (!user) {
      throw new AppError('Authentication failed', 401);
    }

    const accessToken = generateAccessToken(user.id, user.email, user.username);
    const refreshToken = generateRefreshToken();

    await query(
      `INSERT INTO sessions (user_id, refresh_token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
      [user.id, refreshToken]
    );

    await query(
      'UPDATE users SET status = $1 WHERE id = $2',
      ['online', user.id]
    );

    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback?token=${accessToken}&refresh=${refreshToken}`);
  } catch (error) {
    next(error);
  }
};

export const requestPasswordReset = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    const result = await query(
      'SELECT id, email, username FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.json({ message: 'If an account exists, a password reset email will be sent.' });
    }

    const user = result.rows[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    await query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
      [user.id, tokenHash]
    );

    await sendPasswordResetEmail(user.email, resetToken);

    res.json({ message: 'If an account exists, a password reset email will be sent.' });
  } catch (error) {
    console.error('[Auth] Password reset request error:', error);
    res.json({ message: 'If an account exists, a password reset email will be sent.' });
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      throw new AppError('Token and new password are required', 400);
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const result = await query(
      `SELECT user_id FROM password_reset_tokens 
       WHERE token = $1 AND expires_at > NOW() AND used = FALSE`,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    const { user_id } = result.rows[0];
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, user_id]
    );

    await query(
      'UPDATE password_reset_tokens SET used = TRUE WHERE token = $1',
      [tokenHash]
    );

    await query(
      'DELETE FROM sessions WHERE user_id = $1',
      [user_id]
    );

    res.json({ message: 'Password reset successful. Please login with your new password.' });
  } catch (error) {
    next(error);
  }
};
