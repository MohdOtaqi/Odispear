# 🚀 START HERE - Unity Platform Setup

## Welcome to Unity Platform!

This is your complete Discord + Guilded MVP. Everything is ready to run.

## ⚡ Quick Start (5 minutes)

### Windows Users
```powershell
# Run this command in PowerShell (as Administrator if needed)
cd C:\Users\WDAGUtilityAccount\CascadeProjects\unity-platform
powershell -ExecutionPolicy Bypass -File scripts\setup.ps1
```

### What Happens Next?
The setup script will:
1. ✅ Check your system (Node.js, PostgreSQL, Redis)
2. ✅ Install all dependencies (backend + frontend)
3. ✅ Create environment configuration files
4. ✅ Guide you through the remaining steps

## 📋 Prerequisites

Make sure you have these installed:
- **Node.js 18+**: https://nodejs.org/
- **PostgreSQL 14+**: https://www.postgresql.org/download/windows/
- **Redis 6+**: https://github.com/microsoftarchive/redis/releases

## 🎯 After Running Setup Script

### 1. Configure Environment
Edit `backend/.env` with your database credentials:
```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/unity_platform
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-generated-secret-key
```

Generate a secure JWT_SECRET:
```powershell
# In PowerShell
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

### 2. Create Database
```powershell
# Option A: Using psql command line
createdb unity_platform

# Option B: Using pgAdmin
# Create a new database named "unity_platform"
```

### 3. Run Database Migrations
```powershell
cd backend
npm run migrate
```

### 4. Start Everything

**Terminal 1 - Redis:**
```powershell
redis-server
```

**Terminal 2 - Backend:**
```powershell
cd backend
npm run dev
```

**Terminal 3 - Frontend:**
```powershell
cd frontend
npm run dev
```

### 5. Access Your Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Docs**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/health

## 🐳 Alternative: Docker Setup

If you have Docker installed:
```powershell
docker-compose up -d
```

That's it! Everything runs automatically.

## 🧪 Test Login

If you ran seed data, use:
- **Email**: admin@unity.com
- **Password**: password123

Otherwise, create a new account at http://localhost:5173/register

## 📚 Documentation

- **[QUICK_START.md](./QUICK_START.md)** - Detailed setup guide
- **[SETUP.md](./SETUP.md)** - Full configuration options
- **[API.md](./API.md)** - API endpoints reference
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment
- **[PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)** - Pre-launch checklist

## 🆘 Troubleshooting

### "Cannot find module" errors in IDE?
✅ **Normal!** These will disappear after running `npm install`. They're just TypeScript checking before dependencies exist.

### Database connection failed?
1. Make sure PostgreSQL is running
2. Check your DATABASE_URL in `backend/.env`
3. Verify database exists: `psql -l`

### Redis connection failed?
1. Start Redis: `redis-server`
2. Test connection: `redis-cli ping` (should return "PONG")

### Port already in use?
- Frontend (5173): Edit `frontend/vite.config.ts`
- Backend (3000): Edit `PORT` in `backend/.env`

### Need help?
1. Check logs in terminal
2. Review [SETUP.md](./SETUP.md) troubleshooting section
3. Verify all prerequisites are installed

## ✅ What's Included

Your Unity Platform has:
- ✅ Real-time chat with WebSocket
- ✅ Voice channel management
- ✅ Guild/Server creation
- ✅ Event calendar with RSVP
- ✅ Tournament system
- ✅ Moderation tools
- ✅ Bot API & Webhooks
- ✅ Role-based permissions
- ✅ Complete security features
- ✅ Production-ready deployment configs

## 🎉 You're All Set!

Once you complete the steps above, your Unity Platform will be running locally and ready for development or production deployment.

**Next Step**: Run the setup script and follow the prompts!

```powershell
powershell -ExecutionPolicy Bypass -File scripts\setup.ps1
```
