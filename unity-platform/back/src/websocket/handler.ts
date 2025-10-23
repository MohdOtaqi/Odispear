import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import redisClient from '../config/redis';
import logger from '../config/logger';

interface AuthSocket extends Socket {
  userId?: string;
  username?: string;
}

export const setupWebSocketHandlers = (io: Server) => {
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
    logger.info(`User connected: ${socket.username} (${socket.userId})`);

    // Join user to their guilds
    try {
      const guildResult = await query(
        `SELECT guild_id FROM guild_members WHERE user_id = $1`,
        [socket.userId]
      );

      for (const row of guildResult.rows) {
        socket.join(`guild:${row.guild_id}`);
      }

      // Update user presence
      await query(
        'UPDATE users SET status = $1 WHERE id = $2',
        ['online', socket.userId]
      );

      await redisClient.set(`presence:${socket.userId}`, 'online', { EX: 300 });

      // Broadcast presence update
      for (const row of guildResult.rows) {
        io.to(`guild:${row.guild_id}`).emit('presence.update', {
          user_id: socket.userId,
          username: socket.username,
          status: 'online',
        });
      }
    } catch (error) {
      logger.error('Error setting up user connection:', error);
    }

    // Handle channel join
    socket.on('channel.join', async (data: { channel_id: string }) => {
      try {
        // Verify user has access to channel
        const channelResult = await query(
          `SELECT c.id FROM channels c
           JOIN guild_members gm ON c.guild_id = gm.guild_id
           WHERE c.id = $1 AND gm.user_id = $2`,
          [data.channel_id, socket.userId]
        );

        if (channelResult.rows.length > 0) {
          socket.join(`channel:${data.channel_id}`);
          socket.emit('channel.joined', { channel_id: data.channel_id });
        }
      } catch (error) {
        logger.error('Error joining channel:', error);
      }
    });

    // Handle DM channel join
    socket.on('dm.join', async (data: { dm_channel_id: string }) => {
      try {
        // Verify user is participant
        const participantResult = await query(
          'SELECT id FROM dm_participants WHERE dm_channel_id = $1 AND user_id = $2',
          [data.dm_channel_id, socket.userId]
        );

        if (participantResult.rows.length > 0) {
          socket.join(`dm:${data.dm_channel_id}`);
          socket.emit('dm.joined', { dm_channel_id: data.dm_channel_id });
        }
      } catch (error) {
        logger.error('Error joining DM:', error);
      }
    });

    // Handle DM channel leave
    socket.on('dm.leave', (data: { dm_channel_id: string }) => {
      socket.leave(`dm:${data.dm_channel_id}`);
    });

    // Handle channel leave
    socket.on('channel.leave', (data: { channel_id: string }) => {
      socket.leave(`channel:${data.channel_id}`);
    });

    // Handle typing indicator
    socket.on('typing.start', (data: { channel_id: string }) => {
      socket.to(`channel:${data.channel_id}`).emit('typing.start', {
        user_id: socket.userId,
        username: socket.username,
        channel_id: data.channel_id,
      });
    });

    socket.on('typing.stop', (data: { channel_id: string }) => {
      socket.to(`channel:${data.channel_id}`).emit('typing.stop', {
        user_id: socket.userId,
        channel_id: data.channel_id,
      });
    });

    // Handle voice state updates
    socket.on('voice.join', async (data: { channel_id: string }) => {
      try {
        const result = await query(
          `INSERT INTO voice_sessions (channel_id, user_id)
           VALUES ($1, $2)
           RETURNING *`,
          [data.channel_id, socket.userId]
        );

        socket.join(`voice:${data.channel_id}`);
        
        io.to(`channel:${data.channel_id}`).emit('voice.user_joined', {
          user_id: socket.userId,
          username: socket.username,
          channel_id: data.channel_id,
          session_id: result.rows[0].id,
        });
      } catch (error) {
        logger.error('Error joining voice:', error);
      }
    });

    socket.on('voice.leave', async (data: { channel_id: string }) => {
      try {
        await query(
          `UPDATE voice_sessions 
           SET left_at = NOW()
           WHERE channel_id = $1 AND user_id = $2 AND left_at IS NULL`,
          [data.channel_id, socket.userId]
        );

        socket.leave(`voice:${data.channel_id}`);
        
        io.to(`channel:${data.channel_id}`).emit('voice.user_left', {
          user_id: socket.userId,
          channel_id: data.channel_id,
        });
      } catch (error) {
        logger.error('Error leaving voice:', error);
      }
    });

    socket.on('voice.state_update', (data: { channel_id: string; muted?: boolean; deafened?: boolean }) => {
      io.to(`voice:${data.channel_id}`).emit('voice.state_update', {
        user_id: socket.userId,
        ...data,
      });
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      logger.info(`User disconnected: ${socket.username} (${socket.userId})`);

      try {
        // Update presence after delay (user might reconnect)
        setTimeout(async () => {
          const stillConnected = await redisClient.get(`presence:${socket.userId}`);
          
          if (!stillConnected) {
            await query(
              'UPDATE users SET status = $1 WHERE id = $2',
              ['offline', socket.userId]
            );

            // Get user's guilds and broadcast
            const guildResult = await query(
              `SELECT guild_id FROM guild_members WHERE user_id = $1`,
              [socket.userId]
            );

            for (const row of guildResult.rows) {
              io.to(`guild:${row.guild_id}`).emit('presence.update', {
                user_id: socket.userId,
                username: socket.username,
                status: 'offline',
              });
            }
          }
        }, 5000);

        // Close any active voice sessions
        await query(
          `UPDATE voice_sessions 
           SET left_at = NOW()
           WHERE user_id = $1 AND left_at IS NULL`,
          [socket.userId]
        );
      } catch (error) {
        logger.error('Error handling disconnect:', error);
      }
    });
  });

  return io;
};

// Helper function to broadcast messages
export const broadcastMessage = (io: Server, channelId: string, message: any) => {
  io.to(`channel:${channelId}`).emit('message.create', message);
};

export const broadcastMessageUpdate = (io: Server, channelId: string, message: any) => {
  io.to(`channel:${channelId}`).emit('message.update', message);
};

export const broadcastMessageDelete = (io: Server, channelId: string, messageId: string) => {
  io.to(`channel:${channelId}`).emit('message.delete', { message_id: messageId });
};

// Helper functions for DM messages
export const broadcastDMMessage = (io: Server, dmChannelId: string, message: any) => {
  io.to(`dm:${dmChannelId}`).emit('dm.message.create', message);
};

export const broadcastDMMessageUpdate = (io: Server, dmChannelId: string, message: any) => {
  io.to(`dm:${dmChannelId}`).emit('dm.message.update', message);
};

export const broadcastDMMessageDelete = (io: Server, dmChannelId: string, messageId: string) => {
  io.to(`dm:${dmChannelId}`).emit('dm.message.delete', { message_id: messageId });
};

// Helper function to notify friend request
export const notifyFriendRequest = (io: Server, userId: string, data: any) => {
  io.to(`user:${userId}`).emit('friend.request', data);
};

export const notifyFriendAccepted = (io: Server, userId: string, data: any) => {
  io.to(`user:${userId}`).emit('friend.accepted', data);
};
