# 🚀 Local Development Setup Guide

This guide will help you set up Unity Platform for local development on Windows.

## Current Status

Based on your setup:
- ✅ Docker is running with PostgreSQL, Redis, and backend
- ✅ Frontend is being served on `http://localhost:8080`
- ✅ Backend is running on `http://localhost:3000`
- ❌ CORS issue preventing authentication (NOW FIXED!)
- ❌ Local backend not connecting to Docker database

---

## Quick Fix for CORS Issue

The CORS issue has been **FIXED**! The backend now accepts requests from both:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:8080` (Docker nginx)

---

## Option 1: Use Docker (Recommended - Already Working)

Since your Docker setup is already running, you just need to ensure the database is initialized:

### Step 1: Check Docker Status

```powershell
docker ps
```

You should see:
- `unity-postgres` (PostgreSQL)
- `unity-redis` (Redis)
- `unity-backend` (Backend API)
- `unity-nginx` (Frontend)

### Step 2: Verify Database Schema

Check if the database has tables:

```powershell
# Connect to PostgreSQL container
docker exec -it unity-postgres psql -U postgres -d unity_platform

# Inside PostgreSQL, list tables:
\dt

# You should see tables like: users, guilds, channels, messages, etc.
# If no tables, exit and run initialization:
\q
```

### Step 3: Initialize Database (if needed)

If the database is empty:

```powershell
# Load schema
docker exec -i unity-postgres psql -U postgres -d unity_platform < database/schema.sql

# Load sample data (optional)
docker exec -i unity-postgres psql -U postgres -d unity_platform < database/seed.sql
```

### Step 4: Restart Backend Container

After database initialization:

```powershell
docker restart unity-backend
```

### Step 5: Test

Open your browser to `http://localhost:8080` and try to register/login!

---

## Option 2: Run Backend Locally (Hybrid Approach)

Keep PostgreSQL and Redis in Docker, but run the backend locally for easier debugging.

### Step 1: Update Backend .env

Create/edit `backend/.env`:

```env
NODE_ENV=development
PORT=3000

# Connect to Docker PostgreSQL
DATABASE_URL=postgresql://postgres:changeme@localhost:5432/unity_platform

# Connect to Docker Redis
REDIS_URL=redis://localhost:6379

# JWT Secret (use any long random string for dev)
JWT_SECRET=dev-secret-change-in-production-make-this-very-long-and-random-string
JWT_EXPIRES_IN=7d

# CORS - Allow both Vite and Docker nginx ports
CORS_ORIGIN=http://localhost:5173,http://localhost:8080

# AWS S3 (optional - leave empty for local dev)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
AWS_REGION=us-east-1

# Rate limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### Step 2: Stop Docker Backend (Keep DB and Redis)

```powershell
docker stop unity-backend
```

### Step 3: Install Backend Dependencies

```powershell
cd backend
npm install
```

### Step 4: Run Backend Locally

```powershell
cd backend
npm run dev
```

You should see:
```
🚀 Server running on port 3000
📦 Environment: development
Connected to Redis
```

### Step 5: Frontend Options

**Option A: Use Docker Nginx (Port 8080)**
- Already running
- Access: `http://localhost:8080`

**Option B: Run Vite Dev Server (Port 5173)**
```powershell
cd frontend
npm install
npm run dev
```
- Access: `http://localhost:5173`
- Hot reload enabled

---

## Option 3: Full Local Setup (No Docker)

Run everything locally without Docker.

### Prerequisites

1. **PostgreSQL** - Install from https://www.postgresql.org/download/windows/
2. **Redis** - Install from https://github.com/microsoftarchive/redis/releases
3. **Node.js** - Already installed

### Step 1: Install PostgreSQL Locally

1. Download PostgreSQL installer
2. During installation:
   - Password: `changeme` (or remember what you set)
   - Port: `5432`
   - Install pgAdmin (optional but helpful)

3. Add to PATH (if not done by installer):
   ```
   C:\Program Files\PostgreSQL\15\bin
   ```

### Step 2: Initialize Database

Run the setup script:

```powershell
# From project root
.\setup-database.bat
```

Or manually:

```powershell
# Create database
createdb -U postgres unity_platform

# Load schema
psql -U postgres -d unity_platform -f database\schema.sql

# Load sample data (optional)
psql -U postgres -d unity_platform -f database\seed.sql
```

### Step 3: Install and Start Redis

1. Download Redis for Windows
2. Install as Windows service (it will auto-start)
3. Verify:
   ```powershell
   redis-cli ping
   # Should return: PONG
   ```

### Step 4: Configure Backend

Edit `backend/.env` (use local PostgreSQL and Redis):

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:changeme@localhost:5432/unity_platform
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-secret-change-in-production-make-this-very-long-and-random
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173,http://localhost:8080
```

### Step 5: Start Everything

**Terminal 1 - Backend:**
```powershell
cd backend
npm install
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm install
npm run dev
```

**Terminal 3 - Redis (if not running as service):**
```powershell
redis-server
```

---

## Verification & Testing

### 1. Check Backend Health

```powershell
curl http://localhost:3000/health
```

Should return: `{"status":"ok","timestamp":"..."}`

### 2. Check Database Connection

```powershell
# Connect to database
psql -U postgres -d unity_platform

# List tables
\dt

# Check users table
SELECT * FROM users;

# Exit
\q
```

### 3. Check Redis Connection

```powershell
redis-cli
ping  # Should return PONG
exit
```

### 4. Test Frontend

1. Open browser to `http://localhost:5173` or `http://localhost:8080`
2. Open Developer Tools (F12) → Console
3. Try to register a new account
4. Check for errors

---

## Common Issues & Solutions

### Issue 1: CORS Error
**Error:** `Access-Control-Allow-Origin header has a value 'http://localhost:5173' that is not equal to the supplied origin`

**Solution:** ✅ ALREADY FIXED in the code! Backend now allows both ports.

If still seeing this:
1. Restart backend: `npm run dev`
2. Clear browser cache (Ctrl+Shift+Del)
3. Try again

---

### Issue 2: Database Connection Failed
**Error:** `Connection refused` or `ECONNREFUSED`

**Solution:**
1. Check PostgreSQL is running:
   ```powershell
   # For Docker:
   docker ps | findstr postgres
   
   # For local:
   Get-Service | findstr postgresql
   ```

2. Verify connection string in `.env`:
   ```env
   # Docker PostgreSQL:
   DATABASE_URL=postgresql://postgres:changeme@localhost:5432/unity_platform
   
   # Local PostgreSQL (might need different password):
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/unity_platform
   ```

3. Test connection:
   ```powershell
   psql -U postgres -h localhost -d unity_platform
   ```

---

### Issue 3: Redis Connection Failed
**Error:** `Redis connection failed`

**Solution:**
1. Check Redis is running:
   ```powershell
   # For Docker:
   docker ps | findstr redis
   
   # For local:
   redis-cli ping
   ```

2. If not running:
   ```powershell
   # Docker:
   docker start unity-redis
   
   # Local (as service):
   net start redis
   
   # Local (manual):
   redis-server
   ```

---

### Issue 4: Port Already in Use
**Error:** `Port 3000 is already in use`

**Solution:**
1. Check what's using the port:
   ```powershell
   netstat -ano | findstr :3000
   ```

2. Kill the process (get PID from above command):
   ```powershell
   taskkill /F /PID <PID>
   ```

3. Or use different port in `.env`:
   ```env
   PORT=3001
   ```

---

### Issue 5: Tables Don't Exist
**Error:** `relation "users" does not exist`

**Solution:** Database schema not loaded. Run:
```powershell
# For Docker:
docker exec -i unity-postgres psql -U postgres -d unity_platform < database/schema.sql

# For local:
psql -U postgres -d unity_platform -f database\schema.sql
```

---

## Environment Variables Reference

### Backend `.env`

```env
# Server
NODE_ENV=development
PORT=3000

# Database (choose one based on your setup)
# Docker PostgreSQL:
DATABASE_URL=postgresql://postgres:changeme@localhost:5432/unity_platform
# Local PostgreSQL:
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/unity_platform

# Redis (choose one)
# Docker Redis:
REDIS_URL=redis://localhost:6379
# Local Redis:
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=dev-secret-change-in-production-make-this-very-long-and-random
JWT_EXPIRES_IN=7d

# CORS (multiple origins supported)
CORS_ORIGIN=http://localhost:5173,http://localhost:8080

# AWS S3 (optional for local dev)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
AWS_REGION=us-east-1

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend `.env`

```env
# For Vite dev server:
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

---

## Next Steps

1. ✅ Fixed CORS issue in backend
2. ✅ Choose one of the 3 setup options above
3. ✅ Initialize the database
4. ✅ Start backend and frontend
5. ✅ Test registration/login

---

## Need Help?

If you encounter any issues:

1. Check backend logs in the terminal
2. Check browser console (F12) for frontend errors
3. Verify all services are running
4. Check database has tables: `psql -U postgres -d unity_platform -c "\dt"`
5. Test API health: `curl http://localhost:3000/health`

---

## Development Workflow

Once everything is set up:

**Daily Start:**
```powershell
# Option 1: Docker (easiest)
docker-compose up

# Option 2: Local
# Terminal 1:
cd backend && npm run dev

# Terminal 2:
cd frontend && npm run dev
```

**Daily Stop:**
```powershell
# Option 1: Docker
docker-compose down

# Option 2: Local
# Ctrl+C in each terminal
```

---

## Sample Test Account (if you loaded seed.sql)

After loading seed data, you can login with:
- **Email:** `admin@unity.com`
- **Password:** `Admin123!`

Or register a new account through the UI.

---

**Happy coding! 🚀**
