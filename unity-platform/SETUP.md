# Unity Platform Setup Guide

Complete setup instructions for running Unity Platform locally.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- npm or yarn

## Quick Start

### 1. Install Dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Setup Database

```bash
createdb unity_platform
psql -d unity_platform -f database/schema.sql
psql -d unity_platform -f database/seed.sql
```

### 3. Configure Environment

Backend `.env`:
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/unity_platform
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
PORT=3000
```

Frontend `.env`:
```
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

### 4. Start Services

```bash
# Terminal 1: Redis
redis-server

# Terminal 2: Backend
cd backend && npm run dev

# Terminal 3: Frontend
cd frontend && npm run dev
```

Access at: `http://localhost:5173`

## Test Credentials

- Email: admin@unity.com
- Password: password123

## API Docs

`http://localhost:3000/api/docs`
