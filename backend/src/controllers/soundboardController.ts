import { Request, Response } from 'express';
import pool from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import { uploadToS3, deleteFromS3, isS3Configured, uploadLocally } from '../services/s3Service';
import { io } from '../index'; // Import io for WebSocket events

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
  };
  file?: Express.Multer.File;
}

export const getSounds = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const guildId = req.query.guildId as string;

    let queryText = `
      SELECT 
        s.*,
        u.username as creator_name,
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
      queryText += ` AND (s.guild_id = $2 OR s.guild_id IS NULL)`;
      params.push(guildId);
    } else {
      queryText += ` AND s.guild_id IS NULL`; // For DMs or general sounds
    }
    
    queryText += ` ORDER BY s.name ASC`;

    const result = await pool.query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get sounds error:', error);
    res.status(500).json({ error: 'Failed to fetch sounds' });
  }
};

export const uploadSound = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { name, emoji, category, guildId } = req.body;
    const file = req.file;

    if (!file || !userId) {
      throw new AppError('No audio file or user provided', 400);
    }

    // Upload to S3 or local storage
    const soundId = uuidv4();
    const key = `soundboard/${guildId || 'user'}/${userId}/${soundId}-${file.originalname}`;
    const url = isS3Configured() 
      ? await uploadToS3(file.buffer, key, file.mimetype)
      : await uploadLocally(file, 'soundboard');

    // In a real app, you'd use a library like 'music-metadata' to get duration
    const duration = Math.floor(Math.random() * 10) + 1; // Mock duration

    const result = await pool.query(
      `INSERT INTO soundboard_sounds 
       (id, name, url, emoji, duration, user_id, guild_id, category)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [soundId, name, url, emoji || '🔊', duration, userId, guildId || null, category || 'custom']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Upload sound error:', error);
    res.status(500).json({ error: 'Failed to upload sound' });
  }
};

export const deleteSound = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { soundId } = req.params;

    const checkResult = await pool.query(
      'SELECT url, user_id FROM soundboard_sounds WHERE id = $1',
      [soundId]
    );

    if (checkResult.rows.length === 0) {
      throw new AppError('Sound not found', 404);
    }

    const sound = checkResult.rows[0];
    // Add check for guild permissions later if needed
    if (sound.user_id !== userId) {
        throw new AppError('Unauthorized', 403);
    }

    if (isS3Configured() && sound.url.includes('s3')) {
      const key = sound.url.split('.com/')[1];
      await deleteFromS3(key);
    }

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

export const toggleFavorite = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { soundId } = req.params;

        const checkResult = await pool.query(
        'SELECT 1 FROM soundboard_favorites WHERE user_id = $1 AND sound_id = $2',
        [userId, soundId]
        );

        if (checkResult.rows.length > 0) {
        await pool.query(
            'DELETE FROM soundboard_favorites WHERE user_id = $1 AND sound_id = $2',
            [userId, soundId]
        );
        res.json({ favorite: false });
        } else {
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

export const playSound = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { soundId, channelId } = req.body;

    const soundResult = await pool.query(
      'SELECT * FROM soundboard_sounds WHERE id = $1 AND deleted_at IS NULL',
      [soundId]
    );

    if (soundResult.rows.length === 0) {
      throw new AppError('Sound not found', 404);
    }
    const sound = soundResult.rows[0];

    await pool.query(
      `INSERT INTO soundboard_plays (sound_id, user_id, channel_id) VALUES ($1, $2, $3)`,
      [soundId, userId, channelId]
    );

    // Emit to voice channel
    io.to(`voice:${channelId}`).emit('soundboard:play', {
        sound: {
            id: sound.id,
            url: sound.url,
            volume: sound.volume,
        },
        userId,
    });

    res.json({ message: 'Sound played' });
  } catch (error) {
    console.error('Play sound error:', error);
    res.status(500).json({ error: 'Failed to play sound' });
  }
};

export const getGuildSounds = async (req: AuthRequest, res: Response) => {
    try {
        const { guildId } = req.params;
        const userId = req.user?.id;

        const result = await pool.query(
        `SELECT 
            s.*,
            EXISTS(
            SELECT 1 FROM soundboard_favorites sf 
            WHERE sf.sound_id = s.id AND sf.user_id = $2
            ) as is_favorite
        FROM soundboard_sounds s
        WHERE s.guild_id = $1 AND s.deleted_at IS NULL
        ORDER BY s.name ASC`,
        [guildId, userId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Get guild sounds error:', error);
        res.status(500).json({ error: 'Failed to fetch guild sounds' });
    }
};
