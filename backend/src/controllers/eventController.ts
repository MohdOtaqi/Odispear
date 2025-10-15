import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query, getClient } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export const createEvent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { guildId } = req.params;
    const {
      name,
      description,
      event_type,
      start_time,
      end_time,
      channel_id,
      max_participants,
      image_url,
      metadata,
    } = req.body;
    const userId = req.user!.id;

    const result = await query(
      `INSERT INTO events (
        guild_id, creator_id, name, description, event_type,
        start_time, end_time, channel_id, max_participants, image_url, metadata
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        guildId,
        userId,
        name,
        description,
        event_type || 'general',
        start_time,
        end_time,
        channel_id,
        max_participants,
        image_url,
        metadata ? JSON.stringify(metadata) : null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const getGuildEvents = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { guildId } = req.params;
    const { upcoming } = req.query;

    let queryText = `
      SELECT e.*, u.username as creator_username,
             COUNT(DISTINCT er.id) FILTER (WHERE er.status = 'going') as going_count
      FROM events e
      JOIN users u ON e.creator_id = u.id
      LEFT JOIN event_rsvps er ON e.id = er.event_id
      WHERE e.guild_id = $1
    `;

    if (upcoming === 'true') {
      queryText += ' AND e.start_time > NOW()';
    }

    queryText += ` GROUP BY e.id, u.username ORDER BY e.start_time`;

    const result = await query(queryText, [guildId]);

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

export const getEvent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT e.*, u.username as creator_username,
              COUNT(DISTINCT er.id) FILTER (WHERE er.status = 'going') as going_count,
              COUNT(DISTINCT er.id) FILTER (WHERE er.status = 'maybe') as maybe_count
       FROM events e
       JOIN users u ON e.creator_id = u.id
       LEFT JOIN event_rsvps er ON e.id = er.event_id
       WHERE e.id = $1
       GROUP BY e.id, u.username`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Event not found', 404);
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      start_time,
      end_time,
      channel_id,
      max_participants,
      image_url,
    } = req.body;

    const result = await query(
      `UPDATE events 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           start_time = COALESCE($3, start_time),
           end_time = COALESCE($4, end_time),
           channel_id = COALESCE($5, channel_id),
           max_participants = COALESCE($6, max_participants),
           image_url = COALESCE($7, image_url)
       WHERE id = $8
       RETURNING *`,
      [name, description, start_time, end_time, channel_id, max_participants, image_url, id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Event not found', 404);
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    await query('DELETE FROM events WHERE id = $1', [id]);

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const rsvpEvent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user!.id;

    const result = await query(
      `INSERT INTO event_rsvps (event_id, user_id, status)
       VALUES ($1, $2, $3)
       ON CONFLICT (event_id, user_id) 
       DO UPDATE SET status = $3, updated_at = NOW()
       RETURNING *`,
      [id, userId, status]
    );

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const getEventRSVPs = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT er.*, u.username, u.display_name, u.avatar_url
       FROM event_rsvps er
       JOIN users u ON er.user_id = u.id
       WHERE er.event_id = $1
       ORDER BY er.created_at`,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

export const createTournament = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { eventId } = req.params;
    const { bracket_type, team_size, max_teams } = req.body;

    // Verify event exists and get guild_id
    const eventResult = await query(
      'SELECT guild_id FROM events WHERE id = $1',
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      throw new AppError('Event not found', 404);
    }

    const result = await query(
      `INSERT INTO tournaments (event_id, guild_id, bracket_type, team_size, max_teams)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [eventId, eventResult.rows[0].guild_id, bracket_type, team_size, max_teams]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const getTournament = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT t.*, e.name as event_name, e.start_time
       FROM tournaments t
       JOIN events e ON t.event_id = e.id
       WHERE t.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Tournament not found', 404);
    }

    // Get teams
    const teamsResult = await query(
      `SELECT tt.*, u.username as captain_username,
              COUNT(ttm.id) as member_count
       FROM tournament_teams tt
       JOIN users u ON tt.captain_id = u.id
       LEFT JOIN tournament_team_members ttm ON tt.id = ttm.team_id
       WHERE tt.tournament_id = $1
       GROUP BY tt.id, u.username`,
      [id]
    );

    res.json({
      ...result.rows[0],
      teams: teamsResult.rows,
    });
  } catch (error) {
    next(error);
  }
};

export const joinTournament = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { team_name } = req.body;
    const userId = req.user!.id;

    // Create team
    const teamResult = await client.query(
      `INSERT INTO tournament_teams (tournament_id, team_name, captain_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id, team_name, userId]
    );

    const team = teamResult.rows[0];

    // Add captain as member
    await client.query(
      'INSERT INTO tournament_team_members (team_id, user_id) VALUES ($1, $2)',
      [team.id, userId]
    );

    await client.query('COMMIT');

    res.status(201).json(team);
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};
