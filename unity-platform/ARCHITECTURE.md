# Unity Platform Architecture

## System Overview

Unity Platform is a real-time chat and collaboration platform built with:
- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + TypeScript + Tailwind CSS
- **Database**: PostgreSQL
- **Cache/Pub-Sub**: Redis
- **Real-time**: Socket.IO WebSocket

## Architecture Diagram

```
┌─────────────┐
│   Client    │
│   (React)   │
└──────┬──────┘
       │
       │ HTTP/WS
       ├────────────────┐
       ▼                ▼
┌─────────────┐   ┌─────────────┐
│   Express   │   │  Socket.IO  │
│   API       │   │  WebSocket  │
└──────┬──────┘   └──────┬──────┘
       │                 │
       ├─────────────────┘
       │
       ├──────────┬──────────┐
       ▼          ▼          ▼
  ┌────────┐ ┌────────┐ ┌────────┐
  │PostgreSQL Redis  │   S3     │
  └────────┘ └────────┘ └────────┘
```

## Backend Structure

```
backend/
├── src/
│   ├── config/         # Configuration (DB, Redis, Logger)
│   ├── controllers/    # Business logic handlers
│   ├── middleware/     # Auth, validation, permissions
│   ├── models/         # (Optional) Data models
│   ├── routes/         # API route definitions
│   ├── services/       # External service integrations
│   ├── utils/          # Helper functions
│   ├── websocket/      # WebSocket handlers
│   └── index.ts        # Entry point
└── package.json
```

## Frontend Structure

```
frontend/
├── src/
│   ├── components/     # React components
│   │   ├── ui/         # Reusable UI components
│   │   ├── chat/       # Chat-specific components
│   │   └── layout/     # Layout components
│   ├── pages/          # Page components
│   ├── store/          # Zustand state management
│   ├── lib/            # Utilities (API, socket)
│   ├── App.tsx         # Main app component
│   └── main.tsx        # Entry point
└── package.json
```

## Database Schema

### Core Tables

- `users` - User accounts
- `guilds` - Servers/communities
- `guild_members` - Guild membership
- `channels` - Text/voice channels
- `messages` - Chat messages
- `roles` - Permission roles
- `role_assignments` - User role mapping

### Feature Tables

- `events` - Calendar events
- `tournaments` - Tournament data
- `voice_sessions` - Voice channel sessions
- `webhooks` - Webhook integrations
- `bots` - Bot accounts
- `audit_logs` - Moderation logs
- `moderation_actions` - Bans, mutes, etc.

## Authentication Flow

```
1. User submits credentials
2. Backend validates & generates JWT
3. JWT stored in localStorage
4. JWT sent in Authorization header
5. Middleware validates JWT on each request
6. WebSocket authenticates using JWT
```

## Real-time Communication

### WebSocket Events

1. **Connection**: User connects with JWT token
2. **Guild Subscription**: Auto-join guild rooms
3. **Channel Subscription**: Join specific channel rooms
4. **Event Broadcasting**: Server broadcasts to subscribed rooms
5. **Presence Management**: Track online/offline status

## Permission System

Permissions are stored as bitwise flags:
- View Channel (1 << 0)
- Send Messages (1 << 1)
- Manage Messages (1 << 2)
- Manage Channels (1 << 3)
- Manage Guild (1 << 4)
- Ban Members (1 << 6)
- Administrator (1 << 13)

## State Management

### Frontend State (Zustand)

- `authStore` - User authentication
- `guildStore` - Guild data & operations
- `messageStore` - Messages & real-time updates

## API Design Principles

1. **RESTful**: Standard HTTP methods
2. **Versioned**: `/api/v1/` prefix
3. **Authenticated**: JWT Bearer tokens
4. **Validated**: Joi schema validation
5. **Consistent**: Standard error responses

## Performance Optimizations

1. **Database Indexes**: On frequently queried fields
2. **Redis Caching**: User presence, session data
3. **Message Pagination**: Limit query results
4. **Optimistic UI**: Instant client updates
5. **WebSocket Rooms**: Targeted broadcasting

## Security Measures

1. **Password Hashing**: bcrypt (10 rounds)
2. **JWT Expiry**: 7-day tokens
3. **Rate Limiting**: 100 req/min per IP
4. **CORS**: Configured origin restrictions
5. **Helmet**: Security headers
6. **Input Validation**: Joi schemas

## Scalability Considerations

### Horizontal Scaling
- Stateless API servers
- Redis for shared session state
- Database connection pooling

### Future Improvements
- Message queue (RabbitMQ/Kafka)
- CDN for static assets
- Database read replicas
- Microservices architecture
