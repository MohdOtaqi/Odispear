import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { connectRedis } from './config/redis';
import { setupWebSocketHandlers } from './websocket/optimizedHandler';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import logger from './config/logger';
import { validateEnvironment } from './utils/validation';
import { requestLogger } from './middleware/requestLogger';
import { securityHeaders } from './middleware/securityHeaders';
import { performStartupChecks } from './utils/startup';

import authRoutes from './routes/authRoutes';
import guildRoutes from './routes/guildRoutes';
import channelRoutes from './routes/channelRoutes';
import eventRoutes from './routes/eventRoutes';
import moderationRoutes from './routes/moderationRoutes';
import webhookRoutes from './routes/webhookRoutes';
import friendsRoutes from './routes/friendsRoutes';
import dmRoutes from './routes/dmRoutes';
import rolesRoutes from './routes/rolesRoutes';
import memberRoutes from './routes/memberRoutes';
import voiceRoutes from './routes/voiceRoutes';
import statusRoutes from './routes/statusRoutes';
import reactionRoutes from './routes/reactionRoutes';
import soundboardRoutes from './routes/soundboardRoutes';

dotenv.config();
validateEnvironment();

const app = express();
const httpServer = createServer(app);

// Allow multiple CORS origins for local development
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:5173', 'http://localhost:8080'];

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(securityHeaders);
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(requestLogger);
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
});

app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/guilds', guildRoutes);
app.use('/api/v1/channels', channelRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/moderation', moderationRoutes);
app.use('/api/v1/webhooks', webhookRoutes);
app.use('/api/v1/friends', friendsRoutes);
app.use('/api/v1/dm', dmRoutes);
app.use('/api/v1/roles', rolesRoutes);
app.use('/api/v1/members', memberRoutes);
app.use('/api/v1/voice', voiceRoutes);
app.use('/api/v1/status', statusRoutes);
app.use('/api/v1/reactions', reactionRoutes);
app.use('/api/v1/soundboard', soundboardRoutes);

// API documentation route
app.get('/api/docs', (req, res) => {
  res.json({
    name: 'Unity Platform API',
    version: '1.0.0',
    description: 'Real-time chat and collaboration platform API',
    endpoints: {
      auth: {
        'POST /api/v1/auth/register': 'Register new user',
        'POST /api/v1/auth/login': 'Login user',
        'POST /api/v1/auth/logout': 'Logout user',
        'POST /api/v1/auth/refresh': 'Refresh access token',
        'GET /api/v1/auth/me': 'Get current user',
        'PATCH /api/v1/auth/me': 'Update user profile',
      },
      guilds: {
        'POST /api/v1/guilds': 'Create guild',
        'GET /api/v1/guilds': 'Get user guilds',
        'GET /api/v1/guilds/:id': 'Get guild details',
        'PATCH /api/v1/guilds/:id': 'Update guild',
        'DELETE /api/v1/guilds/:id': 'Delete guild',
        'GET /api/v1/guilds/:id/members': 'Get guild members',
        'POST /api/v1/guilds/:id/invites': 'Create invite',
        'POST /api/v1/guilds/invites/:code/join': 'Join guild by invite',
      },
      channels: {
        'POST /api/v1/channels/guilds/:guildId/channels': 'Create channel',
        'GET /api/v1/channels/guilds/:guildId/channels': 'Get guild channels',
        'GET /api/v1/channels/:id': 'Get channel',
        'PATCH /api/v1/channels/:id': 'Update channel',
        'DELETE /api/v1/channels/:id': 'Delete channel',
        'GET /api/v1/channels/:id/messages': 'Get messages',
        'POST /api/v1/channels/:id/messages': 'Send message',
      },
      events: {
        'POST /api/v1/events/guilds/:guildId/events': 'Create event',
        'GET /api/v1/events/guilds/:guildId/events': 'Get guild events',
        'GET /api/v1/events/:id': 'Get event',
        'POST /api/v1/events/:id/rsvp': 'RSVP to event',
      },
      websocket: {
        'connect': 'Connect to WebSocket with auth token',
        'channel.join': 'Join channel for real-time updates',
        'typing.start': 'Broadcast typing indicator',
        'voice.join': 'Join voice channel',
      },
    },
  });
});

// Error handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Setup WebSocket handlers
setupWebSocketHandlers(io);

// Start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Connect to Redis
    await connectRedis();
    logger.info('Connected to Redis');

    // Perform startup checks
    const checksPass = await performStartupChecks();
    if (!checksPass && process.env.NODE_ENV === 'production') {
      logger.error('Startup checks failed. Exiting...');
      process.exit(1);
    }

    // Start HTTP server
    httpServer.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`📚 API documentation: http://localhost:${PORT}/api/docs`);
      logger.info(`❤️  Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export { io };
