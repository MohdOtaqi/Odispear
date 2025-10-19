# 🔧 Unity Platform - Complete Deployment Fix Guide

## ⚠️ Current Issues Identified

1. **502 Bad Gateway** - Backend not accessible through Nginx
2. **Frontend Offline** - PM2 shows frontend as stopped
3. **Fork vs Cluster Mode** - PM2 running in wrong mode
4. **API Routes** - Friends/DM routes returning 500/404 errors
5. **Voice Chat** - Agora App ID issues

## ✅ Complete Fix Solution

### 📋 Pre-Deployment Checklist

Before deploying, ensure you have:
- [ ] PostgreSQL installed and running
- [ ] Redis installed and running
- [ ] Node.js 16+ installed
- [ ] PM2 installed globally (`npm install -g pm2`)
- [ ] Nginx installed and running
- [ ] `serve` package installed globally (`npm install -g serve`)

### 🚀 Step-by-Step Deployment Fix

#### Step 1: Upload Files to AWS

Upload these files to your AWS server using FileZilla/SCP:

```bash
# Connect via FileZilla or use SCP
scp -r unity-platform/* ubuntu@16.171.225.46:/var/www/Odispear/unity-platform/
```

**Files to Upload:**
```
backend/
├── src/
│   ├── controllers/
│   │   ├── statusController.ts ✅
│   │   └── reactionController.ts ✅
│   ├── routes/
│   │   ├── statusRoutes.ts ✅
│   │   ├── reactionRoutes.ts ✅
│   │   ├── friendsRoutes.ts ✅
│   │   └── dmRoutes.ts ✅
│   ├── services/
│   │   └── socketService.ts ✅
│   └── index.ts ✅ (updated)
├── .env.production ✅
└── package.json

frontend/
├── src/
│   ├── components/
│   │   ├── VoiceChat/ ✅ (all 5 files)
│   │   ├── chat/
│   │   │   ├── MessageReactions.tsx ✅
│   │   │   └── FileUploadPreview.tsx ✅
│   │   └── UserStatusSelector.tsx ✅
│   └── pages/
│       └── MainApp.tsx ✅ (updated)
├── .env.production ✅
└── package.json

Root files:
├── ecosystem.config.js ✅
├── fix-all-issues.sh ✅
└── deploy-fix.sh ✅
```

#### Step 2: SSH to Server and Run Fix Script

```bash
# SSH to your server
ssh ubuntu@16.171.225.46

# Navigate to project
cd /var/www/Odispear/unity-platform

# Make script executable
chmod +x fix-all-issues.sh

# Run the complete fix script
./fix-all-issues.sh
```

### 🔍 What the Fix Script Does

1. **Stops all PM2 processes** - Cleans slate
2. **Installs dependencies** - Ensures serve and pm2 are installed
3. **Creates proper .env files** - Both backend and frontend
4. **Builds both applications** - Fresh builds
5. **Sets up database** - Creates DB and user if needed
6. **Configures Nginx** - Proper reverse proxy setup
7. **Starts services in fork mode** - Fixes the cluster issue
8. **Tests everything** - Verifies services are running

### 📝 Environment Configuration

#### Backend .env (Production)
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://unity_app:password@localhost:5432/unity_platform
REDIS_URL=redis://localhost:6379
JWT_SECRET=[auto-generated]
CORS_ORIGIN=http://16.171.225.46
AGORA_APP_ID=e7f6e9aeecf14b2ba10e3f40be9f56e7
```

#### Frontend .env (Production)
```env
VITE_API_URL=http://16.171.225.46
VITE_WS_URL=ws://16.171.225.46
VITE_AGORA_APP_ID=e7f6e9aeecf14b2ba10e3f40be9f56e7
```

### 🔧 Manual Fixes (If Script Fails)

#### Fix 1: PM2 Fork Mode Issue
```bash
# Delete all PM2 processes
pm2 delete all

# Start backend in fork mode (not cluster)
cd /var/www/Odispear/unity-platform
pm2 start backend/dist/index.js --name unity-backend --max-memory-restart 1G

# Start frontend with serve in fork mode
pm2 start "serve -s frontend/dist -p 5173" --name unity-frontend --max-memory-restart 500M

# Save configuration
pm2 save
pm2 startup
```

#### Fix 2: Nginx Configuration
```nginx
# /etc/nginx/sites-available/unity-platform
server {
    listen 80;
    server_name 16.171.225.46;
    
    # Frontend
    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
# Apply Nginx config
sudo ln -sf /etc/nginx/sites-available/unity-platform /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### Fix 3: Database Setup
```bash
# Create database and user
sudo -u postgres psql
CREATE DATABASE unity_platform;
CREATE USER unity_app WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE unity_platform TO unity_app;
\q

# Apply schema
cd /var/www/Odispear/unity-platform
PGPASSWORD=password psql -h localhost -U unity_app -d unity_platform < database/schema.sql
```

### 🧪 Testing After Deployment

#### Test Backend Health
```bash
# Local test
curl http://localhost:3000/health

# External test
curl http://16.171.225.46/api/v1/auth/health
```

#### Test Frontend
```bash
# Local test
curl http://localhost:5173

# External test (from your browser)
http://16.171.225.46
```

#### Check Logs
```bash
# PM2 logs
pm2 logs unity-backend --lines 100
pm2 logs unity-frontend --lines 100

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# System logs
sudo journalctl -u nginx -n 50
```

### 🎯 Expected Results

After running the fix:

✅ **PM2 Status** should show:
```
┌─────┬──────────────────┬─────────┬─────┬───────────┬──────────┬──────────┐
│ id  │ name             │ mode    │ ↺   │ status    │ cpu      │ memory   │
├─────┼──────────────────┼─────────┼─────┼───────────┼──────────┼──────────┤
│ 0   │ unity-backend    │ fork    │ 0   │ online    │ 0%       │ 90.5mb   │
│ 1   │ unity-frontend   │ fork    │ 0   │ online    │ 0%       │ 40.2mb   │
└─────┴──────────────────┴─────────┴─────┴───────────┴──────────┴──────────┘
```

✅ **Access Points**:
- Frontend: `http://16.171.225.46`
- Backend API: `http://16.171.225.46/api/v1`
- Health Check: `http://16.171.225.46/health`
- WebSocket: `ws://16.171.225.46/socket.io`

### 🐛 Troubleshooting

#### Issue: Frontend still offline
```bash
# Check if port 5173 is in use
sudo lsof -i :5173

# Kill the process if needed
sudo kill -9 [PID]

# Restart frontend
pm2 restart unity-frontend
```

#### Issue: 502 Bad Gateway persists
```bash
# Check if backend is actually running
curl http://localhost:3000/health

# Check backend logs
pm2 logs unity-backend --lines 200

# Common issues:
# - Database connection failed (check PostgreSQL)
# - Redis not running (sudo systemctl start redis)
# - Port 3000 already in use
```

#### Issue: Cannot login/register
```bash
# Check database connection
PGPASSWORD=password psql -h localhost -U unity_app -d unity_platform -c "SELECT 1;"

# Check CORS settings in backend .env
# Make sure CORS_ORIGIN includes http://16.171.225.46
```

#### Issue: Voice chat not working
The Agora App ID might be invalid. To fix:
1. Go to https://console.agora.io
2. Create a new project
3. Get new App ID
4. Update in both backend and frontend .env files
5. Rebuild and restart

### 📊 Monitoring Commands

```bash
# Real-time monitoring
pm2 monit

# Service status
pm2 status

# Restart all services
pm2 restart all

# Stop all services
pm2 stop all

# View logs
pm2 logs

# Flush logs
pm2 flush
```

### ✅ Success Indicators

You'll know everything is working when:

1. ✅ Can access `http://16.171.225.46` in browser
2. ✅ Can register a new account
3. ✅ Can login and stay logged in after refresh
4. ✅ Can send messages in real-time
5. ✅ Can add friends without 500 errors
6. ✅ Can join voice channels (if Agora configured)
7. ✅ PM2 shows both services as "online" in fork mode
8. ✅ No 502 errors in browser

### 🚨 Emergency Rollback

If something goes wrong:
```bash
# Stop everything
pm2 stop all
sudo systemctl stop nginx

# Restore from Git
cd /var/www/Odispear/unity-platform
git stash
git pull origin main

# Start fresh
./deploy-fix.sh
```

## 📞 Common Error Solutions

### Error: "EADDRINUSE: port 3000 already in use"
```bash
sudo lsof -i :3000
sudo kill -9 [PID]
pm2 restart unity-backend
```

### Error: "Cannot connect to PostgreSQL"
```bash
sudo systemctl status postgresql
sudo systemctl start postgresql
```

### Error: "Redis connection refused"
```bash
sudo systemctl status redis
sudo systemctl start redis-server
```

### Error: "PM2 command not found"
```bash
npm install -g pm2
pm2 update
```

## 🎉 Final Notes

Once everything is running:
- The app should be fully functional at `http://16.171.225.46`
- All Discord-like features should work
- Voice chat will work if Agora is properly configured
- The app will auto-start on server reboot

For any issues not covered here, check:
1. PM2 logs: `pm2 logs`
2. Nginx error log: `sudo tail -f /var/log/nginx/error.log`
3. Browser console (F12)
4. Network tab in browser DevTools

Good luck with your deployment! 🚀
