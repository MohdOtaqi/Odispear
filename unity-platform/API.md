# Unity Platform API Documentation

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Base URL

```
http://localhost:3000/api/v1
```

## Endpoints

### Authentication

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "password123"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "user": { "id": "uuid", "username": "...", ... },
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token"
}
```

### Guilds

#### Create Guild
```http
POST /guilds
Authorization: Bearer <token>

{
  "name": "My Guild",
  "description": "Description",
  "template_type": "esports"
}
```

#### Get User Guilds
```http
GET /guilds
Authorization: Bearer <token>
```

#### Join Guild by Invite
```http
POST /guilds/invites/:code/join
Authorization: Bearer <token>
```

### Channels

#### Create Channel
```http
POST /channels/guilds/:guildId/channels
Authorization: Bearer <token>

{
  "name": "general",
  "type": "text",
  "topic": "General discussion"
}
```

#### Send Message
```http
POST /channels/:channelId/messages
Authorization: Bearer <token>

{
  "content": "Hello world!",
  "reply_to_id": "optional-uuid"
}
```

### Events

#### Create Event
```http
POST /events/guilds/:guildId/events
Authorization: Bearer <token>

{
  "name": "Tournament",
  "description": "Weekly tournament",
  "event_type": "tournament",
  "start_time": "2025-01-20T18:00:00Z",
  "max_participants": 32
}
```

#### RSVP to Event
```http
POST /events/:eventId/rsvp
Authorization: Bearer <token>

{
  "status": "going"
}
```

### Moderation

#### Ban User
```http
POST /moderation/guilds/:guildId/ban
Authorization: Bearer <token>

{
  "user_id": "uuid",
  "reason": "Violation of rules"
}
```

#### Get Audit Logs
```http
GET /moderation/guilds/:guildId/audit-logs?limit=50
Authorization: Bearer <token>
```

### Webhooks

#### Create Webhook
```http
POST /webhooks/guilds/:guildId/webhooks
Authorization: Bearer <token>

{
  "channel_id": "uuid",
  "name": "My Webhook"
}
```

#### Execute Webhook
```http
POST /webhooks/:token

{
  "content": "Message from webhook",
  "username": "Bot Name"
}
```

## WebSocket Events

Connect to WebSocket at `ws://localhost:3000` with auth token.

### Client → Server

- `channel.join` - Join channel for updates
- `typing.start` - Start typing indicator
- `typing.stop` - Stop typing indicator
- `voice.join` - Join voice channel
- `voice.leave` - Leave voice channel

### Server → Client

- `message.create` - New message created
- `message.update` - Message edited
- `message.delete` - Message deleted
- `presence.update` - User status changed
- `typing.start` - User started typing
- `typing.stop` - User stopped typing
- `voice.user_joined` - User joined voice
- `voice.user_left` - User left voice

## Error Responses

All errors return:
```json
{
  "error": "Error message",
  "status": 400
}
```

Common status codes:
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error
