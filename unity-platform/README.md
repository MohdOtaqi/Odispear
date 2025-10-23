# Unity Platform

> 🎮 A community-first real-time chat and collaboration platform combining Discord's instant social features with Guilded's team and esports tooling.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

**[Quick Start](./QUICK_START.md)** | **[Documentation](./SETUP.md)** | **[API Docs](./API.md)** | **[Deployment](./DEPLOYMENT.md)**

## Features

- **Real-time Messaging**: WebSocket-based instant messaging with threads, reactions, and file attachments
- **Voice Channels**: Low-latency voice chat with cloud recordings
- **Guilds & Channels**: Create servers with text, voice, and stage channels
- **Events & Calendar**: Built-in event scheduling with RSVP and reminders
- **Roles & Permissions**: Granular permission system with channel overrides
- **Moderation Tools**: Comprehensive moderation with audit logs, bans, mutes, and word filters
- **Tournament System**: Built-in bracket creation and match scheduling
- **Integrated Docs**: Lightweight Markdown documents in channels
- **Bot API & Webhooks**: Extensible integration system

## Tech Stack

### Frontend
- React 18 + TypeScript
- Tailwind CSS + shadcn/ui components
- Zustand for state management
- React Router for navigation
- WebRTC for voice

### Backend
- Node.js + Express + TypeScript
- PostgreSQL database
- Redis for caching and pub/sub
- Socket.IO for WebSocket communication
- JWT authentication
- AWS S3 for file storage

## Project Structure

```
unity-platform/
├── backend/          # Node.js API server
│   ├── src/
│   │   ├── config/   # Configuration files
│   │   ├── controllers/ # Route controllers
│   │   ├── middleware/  # Express middleware
│   │   ├── models/      # Database models
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic
│   │   ├── websocket/   # WebSocket handlers
│   │   └── index.ts     # Entry point
│   └── package.json
├── frontend/         # React web app
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── store/       # Zustand stores
│   │   ├── lib/         # Utilities
│   │   └── App.tsx      # Main app
│   └── package.json
└── database/         # Database migrations
```

## 🚀 Quick Start

Get up and running in under 5 minutes:

```bash
# Automated setup (Windows)
powershell -ExecutionPolicy Bypass -File scripts/setup.ps1

# Automated setup (Linux/Mac)
chmod +x scripts/setup.sh && ./scripts/setup.sh

# Or use Docker
docker-compose up -d
```

**[See detailed setup instructions →](./QUICK_START.md)**

## 📋 System Requirements

- **Node.js** 18.0.0 or higher
- **PostgreSQL** 14.0 or higher
- **Redis** 6.0 or higher
- **npm** or **yarn** package manager
- **4GB RAM** minimum (8GB recommended)
- **20GB disk space** for data and logs

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/unity_platform
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=your-bucket
PORT=3000
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

## API Documentation

API documentation is available at `/api/docs` when running the backend server.

## Contributing

This is an MVP project. See the roadmap in the documentation for planned features.

## License

MIT
