import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import redisClient, { isRedisEnabled } from '../config/redis';
import logger from '../config/logger';

interface AuthSocket extends Socket {
  userId?: string;
  username?: string;
}

// Cache for frequently accessed data (in-memory + Redis)
const userGuildsCache = new Map<string, string[]>();
const CACHE_TTL = 300; // 5 minutes

// Optimized: Batch database queries
async function getUserGuilds(userId: string): Promise<string[]> {
  // Check in-memory cache first
  if (userGuildsCache.has(userId)) {
    return userGuildsCache.get(userId)!;
  }

  // Check Redis cache (only if Redis is available)
  if (isRedisEnabled() && redisClient) {
    try {
      const cachedGuilds = await redisClient.get(`user:${userId}:guilds`);
      if (cachedGuilds) {
        const guilds = JSON.parse(cachedGuilds);
        userGuildsCache.set(userId, guilds);
        return guilds;
      }
    } catch (e) {
      // Redis error - continue without cache
    }
  }

  // Query database
  const result = await query(
    'SELECT guild_id FROM guild_members WHERE user_id = $1',
    [userId]
  );
  const guildIds = result.rows.map((row: any) => row.guild_id);

  // Cache in Redis and memory (only if Redis is available)
  if (isRedisEnabled() && redisClient) {
    try {
      await redisClient.set(
        `user:${userId}:guilds`,
        JSON.stringify(guildIds),
        { EX: CACHE_TTL }
      );
    } catch (e) {
      // Redis error - continue without cache
    }
  }
  userGuildsCache.set(userId, guildIds);

  return guildIds;
}

export const setupWebSocketHandlers = (io: Server) => {
  // Optimized: Enable compression
  io.engine.on('connection', (rawSocket) => {
    rawSocket.on('upgradeError', (err: Error) => {
      logger.error('WebSocket upgrade error:', err);
    });
  });

  // Authentication middleware
  io.use(async (socket: AuthSocket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
        username: string;
      };

      socket.userId = decoded.userId;
      socket.username = decoded.username;

      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket: AuthSocket) => {
    const userId = socket.userId!;
    const username = socket.username!;

    logger.info(`User connected: ${username} (${userId})`);

    // Optimized: Join user to their personal room
    socket.join(`user:${userId}`);

    // Optimized: Batch operations for guild joining
    try {
      const guildIds = await getUserGuilds(userId);

      // Join all guild rooms at once
      for (const guildId of guildIds) {
        socket.join(`guild:${guildId}`);
      }

      // Optimized: Update presence in Redis (non-blocking)
      const presencePromises: Promise<any>[] = [
        query('UPDATE users SET status = $1, last_seen = NOW() WHERE id = $2', ['online', userId]),
      ];
      if (isRedisEnabled() && redisClient) {
        presencePromises.push(redisClient.set(`presence:${userId}`, 'online', { EX: 300 }));
      }
      Promise.all(presencePromises).catch((err) => logger.error('Error updating presence:', err));

      // Optimized: Broadcast presence only to relevant guilds (batched)
      const presenceData = {
        user_id: userId,
        username,
        status: 'online',
        timestamp: Date.now(),
      };

      for (const guildId of guildIds) {
        socket.to(`guild:${guildId}`).emit('presence.update', presenceData);
      }
    } catch (error) {
      logger.error('Error setting up user connection:', error);
    }

    // Optimized: Debounced typing indicators
    const typingTimeouts = new Map<string, NodeJS.Timeout>();

    socket.on('typing.start', (data: { channel_id: string }) => {
      const channelId = data.channel_id;

      // Clear existing timeout
      if (typingTimeouts.has(channelId)) {
        clearTimeout(typingTimeouts.get(channelId)!);
      }

      // Broadcast typing
      socket.to(`channel:${channelId}`).emit('typing.start', {
        user_id: userId,
        username,
        channel_id: channelId,
      });

      // Auto-stop after 5 seconds
      const timeout = setTimeout(() => {
        socket.to(`channel:${channelId}`).emit('typing.stop', {
          user_id: userId,
          channel_id: channelId,
        });
        typingTimeouts.delete(channelId);
      }, 5000);

      typingTimeouts.set(channelId, timeout);
    });

    socket.on('typing.stop', (data: { channel_id: string }) => {
      const channelId = data.channel_id;

      if (typingTimeouts.has(channelId)) {
        clearTimeout(typingTimeouts.get(channelId)!);
        typingTimeouts.delete(channelId);
      }

      socket.to(`channel:${channelId}`).emit('typing.stop', {
        user_id: userId,
        channel_id: channelId,
      });
    });

    // Guild join - join guild room to receive voice and other guild events
    socket.on('guild.join', async (data: { guild_id: string }) => {
      try {
        const guildId = data.guild_id;

        // Check if user is a member of the guild
        const result = await query(
          'SELECT id FROM guild_members WHERE guild_id = $1 AND user_id = $2',
          [guildId, userId]
        );

        if (result.rows.length > 0) {
          socket.join(`guild:${guildId}`);
          logger.debug(`User ${userId} joined guild room: ${guildId}`);
        }
      } catch (error) {
        logger.error('Error joining guild:', error);
      }
    });

    socket.on('guild.leave', (data: { guild_id: string }) => {
      socket.leave(`guild:${data.guild_id}`);
    });

    // Optimized: Channel join with permission check
    socket.on('channel.join', async (data: { channel_id: string }) => {
      try {
        const channelId = data.channel_id;

        // Optimized: Check Redis cache for permissions
        const cacheKey = `access:${userId}:${channelId}`;
        let cachedAccess: string | null = null;

        if (isRedisEnabled() && redisClient) {
          try {
            cachedAccess = await redisClient.get(cacheKey);
          } catch (e) { /* Redis error */ }
        }

        let hasAccess = false;

        if (cachedAccess !== null) {
          hasAccess = cachedAccess === '1';
        } else {
          // Query database
          const result = await query(
            `SELECT c.id FROM channels c
             JOIN guild_members gm ON c.guild_id = gm.guild_id
             WHERE c.id = $1 AND gm.user_id = $2`,
            [channelId, userId]
          );

          hasAccess = result.rows.length > 0;

          // Cache result for 5 minutes
          if (isRedisEnabled() && redisClient) {
            try {
              await redisClient.set(cacheKey, hasAccess ? '1' : '0', { EX: CACHE_TTL });
            } catch (e) { /* Redis error */ }
          }
        }

        if (hasAccess) {
          socket.join(`channel:${channelId}`);
          socket.emit('channel.joined', { channel_id: channelId });
        } else {
          socket.emit('error', { message: 'No access to channel', code: 'NO_ACCESS' });
        }
      } catch (error) {
        logger.error('Error joining channel:', error);
        socket.emit('error', { message: 'Failed to join channel', code: 'JOIN_ERROR' });
      }
    });

    socket.on('channel.leave', (data: { channel_id: string }) => {
      socket.leave(`channel:${data.channel_id}`);
    });

    // Optimized: DM channel join
    socket.on('dm.join', async (data: { dm_channel_id: string }) => {
      try {
        const dmChannelId = data.dm_channel_id;
        const cacheKey = `dm:access:${userId}:${dmChannelId}`;

        let hasAccess = false;
        let cachedAccess: string | null = null;

        if (isRedisEnabled() && redisClient) {
          try {
            cachedAccess = await redisClient.get(cacheKey);
          } catch (e) { /* Redis error */ }
        }

        if (cachedAccess !== null) {
          hasAccess = cachedAccess === '1';
        } else {
          const result = await query(
            'SELECT id FROM dm_participants WHERE dm_channel_id = $1 AND user_id = $2',
            [dmChannelId, userId]
          );

          hasAccess = result.rows.length > 0;
          if (isRedisEnabled() && redisClient) {
            try {
              await redisClient.set(cacheKey, hasAccess ? '1' : '0', { EX: CACHE_TTL });
            } catch (e) { /* Redis error */ }
          }
        }

        if (hasAccess) {
          socket.join(`dm:${dmChannelId}`);
          socket.emit('dm.joined', { dm_channel_id: dmChannelId });
        }
      } catch (error) {
        logger.error('Error joining DM:', error);
      }
    });

    socket.on('dm.leave', (data: { dm_channel_id: string }) => {
      socket.leave(`dm:${data.dm_channel_id}`);
    });

    // Optimized: Voice channel handling
    socket.on('voice.join', async (data: { channel_id: string }) => {
      try {
        const channelId = data.channel_id;
        logger.info(`[Voice] User ${userId} (${username}) joining voice channel: ${channelId}`);

        // Get the guild_id for this channel to broadcast to all guild members
        const channelResult = await query(
          'SELECT guild_id FROM channels WHERE id = $1',
          [channelId]
        );
        const guildId = channelResult.rows[0]?.guild_id;
        logger.info(`[Voice] Channel ${channelId} belongs to guild: ${guildId}`);

        // Get user's avatar for display
        const userResult = await query(
          'SELECT avatar_url FROM users WHERE id = $1',
          [userId]
        );
        const avatarUrl = userResult.rows[0]?.avatar_url;

        // Insert voice session - use simpler INSERT with explicit conflict handling
        logger.info(`[Voice] Inserting voice session for user ${userId} in channel ${channelId}`);

        // First, mark any existing active sessions for this user in this channel as left
        await query(
          `UPDATE voice_sessions SET left_at = NOW() WHERE channel_id = $1 AND user_id = $2 AND left_at IS NULL`,
          [channelId, userId]
        );

        // Now insert fresh session
        const result = await query(
          `INSERT INTO voice_sessions (channel_id, user_id)
           VALUES ($1, $2)
           RETURNING *`,
          [channelId, userId]
        );
        logger.info(`[Voice] Voice session created:`, result.rows[0]);

        socket.join(`voice:${channelId}`);

        // Broadcast to ALL guild members so they can see who's in voice channels
        const voiceJoinData = {
          user_id: userId,
          username,
          avatar_url: avatarUrl,
          channel_id: channelId,
          session_id: result.rows[0].id,
          muted: false,
          deafened: false,
        };

        // Check how many sockets are in the guild room
        const guildRoom = io.sockets.adapter.rooms.get(`guild:${guildId}`);
        const socketsInGuild = guildRoom ? guildRoom.size : 0;
        logger.info(`[Voice] Broadcasting voice.user_joined to guild:${guildId} (${socketsInGuild} sockets in room)`);

        // Broadcast to guild (so everyone in sidebar sees the user)
        if (guildId) {
          socket.to(`guild:${guildId}`).emit('voice.user_joined', voiceJoinData);
          logger.info(`[Voice] Emitted voice.user_joined to guild room`);
        }
        // Also broadcast to channel room
        socket.to(`channel:${channelId}`).emit('voice.user_joined', voiceJoinData);

        // Send current participants to the new joiner
        const participants = await query(
          `SELECT vs.user_id, u.username, u.avatar_url, vs.muted, vs.deafened
           FROM voice_sessions vs
           JOIN users u ON vs.user_id = u.id
           WHERE vs.channel_id = $1 AND vs.left_at IS NULL`,
          [channelId]
        );
        logger.info(`[Voice] Sending ${participants.rows.length} participants to joining user`);

        socket.emit('voice.participants', {
          channel_id: channelId,
          participants: participants.rows,
        });
      } catch (error) {
        logger.error('Error joining voice:', error);
      }
    });

    socket.on('voice.leave', async (data: { channel_id: string }) => {
      try {
        const channelId = data.channel_id;

        // Get the guild_id for this channel
        const channelResult = await query(
          'SELECT guild_id FROM channels WHERE id = $1',
          [channelId]
        );
        const guildId = channelResult.rows[0]?.guild_id;

        await query(
          `UPDATE voice_sessions 
           SET left_at = NOW()
           WHERE channel_id = $1 AND user_id = $2 AND left_at IS NULL`,
          [channelId, userId]
        );

        socket.leave(`voice:${channelId}`);

        const voiceLeaveData = {
          user_id: userId,
          channel_id: channelId,
        };

        // Broadcast to guild (so everyone in sidebar sees the user left)
        if (guildId) {
          socket.to(`guild:${guildId}`).emit('voice.user_left', voiceLeaveData);
        }
        // Also broadcast to channel room
        socket.to(`channel:${channelId}`).emit('voice.user_left', voiceLeaveData);
      } catch (error) {
        logger.error('Error leaving voice:', error);
      }
    });

    // Optimized: Voice state updates (mute/deafen) - no database writes for temporary states
    socket.on(
      'voice.state_update',
      (data: { channel_id: string; muted?: boolean; deafened?: boolean }) => {
        // Broadcast state immediately (optimistic update)
        socket.to(`voice:${data.channel_id}`).emit('voice.state_update', {
          user_id: userId,
          channel_id: data.channel_id,
          muted: data.muted,
          deafened: data.deafened,
        });

        // Update database asynchronously (non-blocking)
        if (data.muted !== undefined || data.deafened !== undefined) {
          query(
            `UPDATE voice_sessions 
             SET muted = COALESCE($1, muted), deafened = COALESCE($2, deafened)
             WHERE channel_id = $3 AND user_id = $4 AND left_at IS NULL`,
            [data.muted, data.deafened, data.channel_id, userId]
          ).catch((err) => logger.error('Error updating voice state:', err));
        }
      }
    );

    // Optimized: Disconnect handler
    socket.on('disconnect', async () => {
      logger.info(`User disconnected: ${username} (${userId})`);

      // Clear typing timeouts
      typingTimeouts.forEach((timeout) => clearTimeout(timeout));
      typingTimeouts.clear();

      // Only set offline if Redis is available (for production)
      // For local dev without Redis, immediately set offline
      if (!isRedisEnabled()) {
        // Without Redis, immediately mark as offline
        try {
          await query('UPDATE users SET status = $1, last_seen = NOW() WHERE id = $2', [
            'offline',
            userId,
          ]);

          const guildIds = await getUserGuilds(userId);

          for (const guildId of guildIds) {
            io.to(`guild:${guildId}`).emit('presence.update', {
              user_id: userId,
              username,
              status: 'offline',
              timestamp: Date.now(),
            });
          }

          userGuildsCache.delete(userId);
        } catch (error) {
          logger.error('Error handling disconnect:', error);
        }
      } else {
        // With Redis, use delayed check for reconnections
        setTimeout(async () => {
          try {
            let isOnline: string | null = null;
            if (redisClient) {
              try {
                isOnline = await redisClient.get(`presence:${userId}`);
              } catch (e) { /* Redis error */ }
            }

            if (!isOnline) {
              await query('UPDATE users SET status = $1, last_seen = NOW() WHERE id = $2', [
                'offline',
                userId,
              ]);

              const guildIds = await getUserGuilds(userId);

              for (const guildId of guildIds) {
                io.to(`guild:${guildId}`).emit('presence.update', {
                  user_id: userId,
                  username,
                  status: 'offline',
                  timestamp: Date.now(),
                });
              }

              userGuildsCache.delete(userId);
            }
          } catch (error) {
            logger.error('Error handling disconnect:', error);
          }
        }, 5000); // 5 second grace period
      }

      // Close all active voice sessions immediately
      query(
        `UPDATE voice_sessions 
         SET left_at = NOW()
         WHERE user_id = $1 AND left_at IS NULL`,
        [userId]
      ).catch((err) => logger.error('Error closing voice sessions:', err));
    });
  });

  // Optimized: Periodic cache cleanup
  setInterval(() => {
    // Clear old in-memory cache entries (keep only last 1000 users)
    if (userGuildsCache.size > 1000) {
      const entries = Array.from(userGuildsCache.entries());
      const toKeep = entries.slice(-1000);
      userGuildsCache.clear();
      toKeep.forEach(([key, value]) => userGuildsCache.set(key, value));
    }
  }, 60000); // Every minute

  return io;
};

// Helper functions for broadcasting (optimized)
export const broadcastMessage = (io: Server, channelId: string, message: any) => {
  io.to(`channel:${channelId}`).emit('message.create', message);
};

export const broadcastMessageUpdate = (io: Server, channelId: string, message: any) => {
  io.to(`channel:${channelId}`).emit('message.update', message);
};

export const broadcastMessageDelete = (io: Server, channelId: string, messageId: string) => {
  io.to(`channel:${channelId}`).emit('message.delete', { message_id: messageId });
};

export const broadcastDMMessage = (io: Server, dmChannelId: string, message: any) => {
  io.to(`dm:${dmChannelId}`).emit('dm.message.create', message);
};

export const broadcastDMMessageUpdate = (io: Server, dmChannelId: string, message: any) => {
  io.to(`dm:${dmChannelId}`).emit('dm.message.update', message);
};

export const broadcastDMMessageDelete = (io: Server, dmChannelId: string, messageId: string) => {
  io.to(`dm:${dmChannelId}`).emit('dm.message.delete', { message_id: messageId });
};

export const notifyFriendRequest = (io: Server, userId: string, data: any) => {
  io.to(`user:${userId}`).emit('friend.request', data);
};

export const notifyFriendAccepted = (io: Server, userId: string, data: any) => {
  io.to(`user:${userId}`).emit('friend.accepted', data);
};
