import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF and WebP are allowed.'));
    }
  }
});

export const uploadMiddleware = upload.single('file');

// Upload image (avatar or banner)
export const uploadImage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    const { type } = req.body; // 'avatar' or 'banner'
    const userId = req.user!.id;

    let processedPath = req.file.path;

    // Process image with sharp
    if (type === 'avatar') {
      // Resize avatar to 256x256
      const avatarPath = path.join(
        path.dirname(req.file.path),
        `avatar-${userId}-${Date.now()}.webp`
      );
      
      await sharp(req.file.path)
        .resize(256, 256, { fit: 'cover' })
        .webp({ quality: 90 })
        .toFile(avatarPath);

      // Delete original
      await fs.unlink(req.file.path);
      processedPath = avatarPath;

    } else if (type === 'banner') {
      // Resize banner to 1024x256
      const bannerPath = path.join(
        path.dirname(req.file.path),
        `banner-${userId}-${Date.now()}.webp`
      );
      
      await sharp(req.file.path)
        .resize(1024, 256, { fit: 'cover' })
        .webp({ quality: 90 })
        .toFile(bannerPath);

      // Delete original
      await fs.unlink(req.file.path);
      processedPath = bannerPath;
    }

    // Return URL
    const url = `/uploads/${path.basename(processedPath)}`;
    res.json({ url });

  } catch (error) {
    // Clean up file if error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (e) {
        console.error('Error deleting file:', e);
      }
    }
    next(error);
  }
};

// Update user profile
export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { display_name, bio, status_text, avatar_url, banner_url, custom_status } = req.body;

    const updates: any[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (display_name !== undefined) {
      updates.push(`display_name = $${paramCount++}`);
      values.push(display_name);
    }
    if (bio !== undefined) {
      updates.push(`bio = $${paramCount++}`);
      values.push(bio);
    }
    if (status_text !== undefined) {
      updates.push(`status_text = $${paramCount++}`);
      values.push(status_text);
    }
    if (custom_status !== undefined) {
      updates.push(`custom_status = $${paramCount++}`);
      values.push(custom_status);
    }
    if (avatar_url !== undefined) {
      updates.push(`avatar_url = $${paramCount++}`);
      values.push(avatar_url);
    }
    if (banner_url !== undefined) {
      updates.push(`banner_url = $${paramCount++}`);
      values.push(banner_url);
    }

    if (updates.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    values.push(userId);

    const result = await query(
      `UPDATE users 
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramCount}
       RETURNING id, username, email, display_name, avatar_url, banner_url, bio, status, status_text, custom_status, created_at`,
      values
    );

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// Change password
export const changePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError('Current and new passwords are required', 400);
    }

    if (newPassword.length < 6) {
      throw new AppError('New password must be at least 6 characters', 400);
    }

    // Get current password hash
    const userResult = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    // Verify current password
    const bcrypt = require('bcrypt');
    const isValid = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);

    if (!isValid) {
      throw new AppError('Current password is incorrect', 401);
    }

    // Hash new password
    const newHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newHash, userId]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

// Get user profile
export const getUserProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;

    const result = await query(
      `SELECT id, username, display_name, avatar_url, banner_url, bio, 
              status, status_text, custom_status, created_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};
