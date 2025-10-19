import { Server as SocketServer } from 'socket.io';
import logger from '../config/logger';
import redisClient from '../config/redis';

class SocketService {
  private io: SocketServer | null = null;
  private userSocketMap: Map<string, string> = new Map(); // userId -> socketId
  private socketUserMap: Map<string, string> = new Map(); // socketId -> userId

  // Initialize socket service with io instance
  init(io: SocketServer) {
    this.io = io;
    logger.info('Socket service initialized');
  }

  // Handle user connection
  async handleUserConnect(userId: string, socketId: string) {
    this.userSocketMap.set(userId, socketId);
    this.socketUserMap.set(socketId, userId);
    
    // Add to Redis online users
    await redisClient.sAdd('online_users', userId);
    
    // Set user status in Redis
    await redisClient.setEx(`user_status:${userId}`, 3600, 'online');
    
    logger.info(`User ${userId} connected with socket ${socketId}`);
  }

  // Handle user disconnect
  async handleUserDisconnect(socketId: string) {
    const userId = this.socketUserMap.get(socketId);
    
    if (userId) {
      this.userSocketMap.delete(userId);
      this.socketUserMap.delete(socketId);
      
      // Remove from Redis online users
      await redisClient.sRem('online_users', userId);
      
      // Clear user status in Redis
      await redisClient.del(`user_status:${userId}`);
      
      logger.info(`User ${userId} disconnected`);
    }
  }

  // Emit to specific user
  emitToUser(userId: string, event: string, data: any) {
    const socketId = this.userSocketMap.get(userId);
    if (socketId && this.io) {
      this.io.to(socketId).emit(event, data);
    }
  }

  // Emit to multiple users
  emitToUsers(userIds: string[], event: string, data: any) {
    userIds.forEach(userId => {
      this.emitToUser(userId, event, data);
    });
  }

  // Broadcast to all connected users except sender
  broadcast(senderSocketId: string, event: string, data: any) {
    if (this.io) {
      this.io.except(senderSocketId).emit(event, data);
    }
  }

  // Emit to channel members
  emitToChannel(channelId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(`channel:${channelId}`).emit(event, data);
    }
  }

  // Emit to guild members
  emitToGuild(guildId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(`guild:${guildId}`).emit(event, data);
    }
  }

  // Join user to a room
  joinRoom(socketId: string, room: string) {
    if (this.io) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.join(room);
        logger.debug(`Socket ${socketId} joined room ${room}`);
      }
    }
  }

  // Leave room
  leaveRoom(socketId: string, room: string) {
    if (this.io) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.leave(room);
        logger.debug(`Socket ${socketId} left room ${room}`);
      }
    }
  }

  // Get online users count
  async getOnlineUsersCount(): Promise<number> {
    const onlineUsers = await redisClient.sMembers('online_users');
    return onlineUsers.length;
  }

  // Get user status
  async getUserStatus(userId: string): Promise<string | null> {
    const status = await redisClient.get(`user_status:${userId}`);
    return status;
  }

  // Update user status
  async updateUserStatus(userId: string, status: string) {
    if (status === 'invisible') {
      await redisClient.sRem('online_users', userId);
      await redisClient.del(`user_status:${userId}`);
    } else {
      await redisClient.sAdd('online_users', userId);
      await redisClient.setEx(`user_status:${userId}`, 3600, status);
    }
    
    // Emit status update to all users
    if (this.io) {
      this.io.emit('user.status_updated', { userId, status });
    }
  }

  // Handle typing indicators
  async setUserTyping(userId: string, channelId: string, isTyping: boolean) {
    const key = `typing:${channelId}`;
    
    if (isTyping) {
      await redisClient.sAdd(key, userId);
      await redisClient.expire(key, 10); // Auto-expire after 10 seconds
    } else {
      await redisClient.sRem(key, userId);
    }
    
    // Emit typing update to channel members
    this.emitToChannel(channelId, 'typing.update', {
      userId,
      channelId,
      isTyping
    });
  }

  // Get typing users in a channel
  async getTypingUsers(channelId: string): Promise<string[]> {
    const users = await redisClient.sMembers(`typing:${channelId}`);
    return users;
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;