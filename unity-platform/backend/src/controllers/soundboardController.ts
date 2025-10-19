import { Request, Response } from 'express';
import pool from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { uploadToS3, deleteFromS3 } from '../services/s3Service';
import { v4 as uuidv4 } from 'uuid';

export const getSounds = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const guildId = req.query.guildId as string;

    let query = `
      SELECT 
        s.*,
        u.username as creator_name,
        u.avatar_url as creator_avatar,
        EXISTS(
          SELECT 1 FROM soundboard_favorites sf 
          WHERE sf.sound_id = s.id AND sf.user_id = $1
        ) as is_favorite
      FROM soundboard_sounds s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.deleted_at IS NULL
    `;
    
    const params: any[] = [userId];
    
    if (guildId) {
      query += ` AND (s.guild_id = $2 OR s.guild_id IS NULL)`;
      params.push(guildId);
    } else {
      query += ` AND s.guild_id IS NULL`;
    }
    
    query += ` ORDER BY s.created_at DESC`;

    const result = await pool.query(query, params);
    
    const sounds = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      url: row.url,
      emoji: row.emoji,
      duration: row.duration,
      userId: row.user_id,
      guildId: row.guild_id,
      volume: row.volume || 100,
      favorite: row.is_favorite,
      category: row.category,
      creatorName: row.creator_name,
      creatorAvatar: row.creator_avatar,
      createdAt: row.created_at
    }));

    res.json({ sounds });
  } catch (error) {
    console.error('Get sounds error:', error);
    res.status(500).json({ error: 'Failed to fetch sounds' });
  }
};

export const uploadSound = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { name, emoji, category, guildId } = req.body;
    const file = req.file;

    if (!file) {
      throw new AppError('No audio file provided', 400);
    }

    // Upload to S3
    const soundId = uuidv4();
    const key = `soundboard/${userId}/${soundId}-${file.originalname}`;
    const url = await uploadToS3(file.buffer, key, file.mimetype);

    // Get audio duration (simplified - in real app, use audio processing library)
    const duration = Math.random() * 10 + 1; // Mock duration

    // Save to database
    const result = await pool.query(
      `INSERT INTO soundboard_sounds 
       (id, name, url, emoji, duration, user_id, guild_id, category, volume)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [soundId, name, url, emoji || '🔊', duration, userId, guildId, category || 'custom', 100]
    );

    const sound = {
      id: result.rows[0].id,
      name: result.rows[0].name,
      url: result.rows[0].url,
      emoji: result.rows[0].emoji,
      duration: result.rows[0].duration,
      userId: result.rows[0].user_id,
      guildId: result.rows[0].guild_id,
      volume: result.rows[0].volume,
      favorite: false,
      category: result.rows[0].category
    };

    res.status(201).json(sound);
  } catch (error) {
    console.error('Upload sound error:', error);
    res.status(500).json({ error: 'Failed to upload sound' });
  }
};

export const deleteSound = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const soundId = req.params.soundId;

    // Check ownership
    const checkResult = await pool.query(
      'SELECT * FROM soundboard_sounds WHERE id = $1 AND user_id = $2',
      [soundId, userId]
    );

    if (checkResult.rows.length === 0) {
      throw new AppError('Sound not found or unauthorized', 404);
    }

    const sound = checkResult.rows[0];

    // Delete from S3
    if (sound.url) {
      const key = sound.url.split('.com/')[1];
      await deleteFromS3(key);
    }

    // Soft delete from database
    await pool.query(
      'UPDATE soundboard_sounds SET deleted_at = NOW() WHERE id = $1',
      [soundId]
    );

    res.json({ message: 'Sound deleted successfully' });
  } catch (error) {
    console.error('Delete sound error:', error);
    res.status(500).json({ error: 'Failed to delete sound' });
  }
};

export const toggleFavorite = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const soundId = req.params.soundId;

    // Check if already favorited
    const checkResult = await pool.query(
      'SELECT * FROM soundboard_favorites WHERE user_id = $1 AND sound_id = $2',
      [userId, soundId]
    );

    if (checkResult.rows.length > 0) {
      // Remove favorite
      await pool.query(
        'DELETE FROM soundboard_favorites WHERE user_id = $1 AND sound_id = $2',
        [userId, soundId]
      );
      res.json({ favorite: false });
    } else {
      // Add favorite
      await pool.query(
        'INSERT INTO soundboard_favorites (user_id, sound_id) VALUES ($1, $2)',
        [userId, soundId]
      );
      res.json({ favorite: true });
    }
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
};

export const playSound = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { soundId, channelId } = req.body;

    // Get sound details
    const soundResult = await pool.query(
      'SELECT * FROM soundboard_sounds WHERE id = $1 AND deleted_at IS NULL',
      [soundId]
    );

    if (soundResult.rows.length === 0) {
      throw new AppError('Sound not found', 404);
    }

    const sound = soundResult.rows[0];

    // Log play event
    await pool.query(
      `INSERT INTO soundboard_plays 
       (sound_id, user_id, channel_id, played_at)
       VALUES ($1, $2, $3, NOW())`,
      [soundId, userId, channelId]
    );

    // Emit to voice channel if connected
    const io = req.app.get('io');
    io.to(`voice:${channelId}`).emit('soundboard:play', {
      soundId: sound.id,
      url: sound.url,
      name: sound.name,
      emoji: sound.emoji,
      userId,
      volume: sound.volume
    });

    res.json({ message: 'Sound played', sound });
  } catch (error) {
    console.error('Play sound error:', error);
    res.status(500).json({ error: 'Failed to play sound' });
  }
};

export const getGuildSounds = async (req: Request, res: Response) => {
  try {
    const guildId = req.params.guildId;
    const userId = req.user?.id;

    const result = await pool.query(
      `SELECT 
        s.*,
        u.username as creator_name,
        u.avatar_url as creator_avatar,
        EXISTS(
          SELECT 1 FROM soundboard_favorites sf 
          WHERE sf.sound_id = s.id AND sf.user_id = $2
        ) as is_favorite,
        COUNT(sp.id) as play_count
      FROM soundboard_sounds s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN soundboard_plays sp ON s.id = sp.sound_id
      WHERE s.guild_id = $1 AND s.deleted_at IS NULL
      GROUP BY s.id, u.username, u.avatar_url
      ORDER BY play_count DESC, s.created_at DESC`,
      [guildId, userId]
    );

    const sounds = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      url: row.url,
      emoji: row.emoji,
      duration: row.duration,
      userId: row.user_id,
      guildId: row.guild_id,
      volume: row.volume || 100,
      favorite: row.is_favorite,
      category: row.category,
      creatorName: row.creator_name,
      creatorAvatar: row.creator_avatar,
      playCount: parseInt(row.play_count),
      createdAt: row.created_at
    }));

    res.json({ sounds });
  } catch (error) {
    console.error('Get guild sounds error:', error);
    res.status(500).json({ error: 'Failed to fetch guild sounds' });
  }
};
