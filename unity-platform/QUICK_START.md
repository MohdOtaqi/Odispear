# Unity Platform - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+

### Option 1: Automated Setup (Recommended)

**Windows:**
```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup.ps1
```

**Linux/Mac:**
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### Option 2: Manual Setup

1. **Install Dependencies**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Configure Environment**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   # Edit backend/.env with your settings

   # Frontend
   cp frontend/.env.example frontend/.env
   ```

3. **Setup Database**
   ```bash
   createdb unity_platform
   cd backend && npm run migrate
   ```

4. **Start Services**
   ```bash
   # Terminal 1: Redis
   redis-server

   # Terminal 2: Backend
   cd backend && npm run dev

   # Terminal 3: Frontend
   cd frontend && npm run dev
   ```

5. **Access Application**
   Open http://localhost:5173

## 🐳 Docker Quick Start

```bash
# Start everything with Docker
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## 🧪 Test Credentials

If you loaded seed data:
- **Email:** admin@unity.com
- **Password:** password123

## 📚 Next Steps

- Read [SETUP.md](./SETUP.md) for detailed setup
- Read [API.md](./API.md) for API documentation
- Read [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment

## 🆘 Troubleshooting

**Database connection failed?**
- Ensure PostgreSQL is running
- Check DATABASE_URL in backend/.env

**Redis connection failed?**
- Start Redis: `redis-server`
- Check REDIS_URL in backend/.env

**Port already in use?**
- Frontend: Change port in `frontend/vite.config.ts`
- Backend: Change PORT in `backend/.env`

## 📖 Documentation

- [Main README](./README.md)
- [Architecture](./ARCHITECTURE.md)
- [Production Checklist](./PRODUCTION_CHECKLIST.md)
