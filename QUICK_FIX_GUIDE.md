# 🚨 QUICK FIX GUIDE - Unity Platform Deployment

## Your Current Issues (From the Screenshot):
1. **502 Bad Gateway** on `/api/v1/auth/register`
2. **Frontend is stopped** in PM2 (showing offline)
3. **Mode changed** from cluster to fork
4. **Frontend keeps restarting** (↺ 30 restarts)

## 🔥 IMMEDIATE FIX COMMANDS

Run these commands on your AWS server **in this exact order**:

```bash
# 1. SSH to your server
ssh ubuntu@16.171.225.46

# 2. Go to project directory
cd /var/www/Odispear/unity-platform

# 3. Stop everything
pm2 stop all
pm2 delete all

# 4. Fix Frontend (THIS IS THE MAIN ISSUE)
cd frontend
npm install -g serve  # Install serve globally if not installed
npm install            # Reinstall dependencies
npm run build         # Rebuild frontend

# 5. Fix Backend
cd ../backend
npm install
npm run build

# 6. Start Backend FIRST
cd ..
pm2 start backend/dist/index.js --name unity-backend

# 7. Start Frontend with npx (IMPORTANT - use npx not direct serve)
pm2 start "npx serve -s frontend/dist -l 5173" --name unity-frontend

# 8. Save PM2 config
pm2 save
pm2 startup

# 9. Check status
pm2 status
```

## 📝 CRITICAL FILES TO CHECK

### 1. Backend `.env` file (`/var/www/Odispear/unity-platform/backend/.env`)
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://unity_app:password@localhost:5432/unity_platform
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-here
CORS_ORIGIN=http://16.171.225.46
```

### 2. Frontend `.env` file (`/var/www/Odispear/unity-platform/frontend/.env`)
```env
VITE_API_URL=http://16.171.225.46
VITE_WS_URL=ws://16.171.225.46
VITE_AGORA_APP_ID=e7f6e9aeecf14b2ba10e3f40be9f56e7
```

### 3. Nginx config (`/etc/nginx/sites-available/unity-platform`)
```nginx
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
    
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Apply Nginx config:
```bash
sudo ln -sf /etc/nginx/sites-available/unity-platform /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔍 TROUBLESHOOTING

### If Frontend Still Shows Offline:
```bash
# Check what's wrong
pm2 logs unity-frontend --lines 50

# Common fix - serve not found
npm install -g serve

# Restart with different command
pm2 delete unity-frontend
pm2 start "npx serve -s /var/www/Odispear/unity-platform/frontend/dist -l 5173" --name unity-frontend
```

### If Backend Returns 502:
```bash
# Check backend logs
pm2 logs unity-backend --lines 100

# Common issues:
# 1. Database not running
sudo systemctl start postgresql

# 2. Redis not running  
sudo systemctl start redis-server

# 3. Port 3000 in use
sudo lsof -i :3000
sudo kill -9 [PID]
pm2 restart unity-backend
```

### If Database Connection Fails:
```bash
# Reset database
sudo -u postgres psql
DROP DATABASE IF EXISTS unity_platform;
CREATE DATABASE unity_platform;
CREATE USER unity_app WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE unity_platform TO unity_app;
\q

# Apply schema
cd /var/www/Odispear/unity-platform
PGPASSWORD=password psql -h localhost -U unity_app -d unity_platform < database/schema.sql
```

## ✅ SUCCESS INDICATORS

After running the fix, you should see:

```
┌─────┬──────────────────┬─────────┬─────┬───────────┬──────────┬──────────┐
│ id  │ name             │ mode    │ ↺   │ status    │ cpu      │ memory   │
├─────┼──────────────────┼─────────┼─────┼───────────┼──────────┼──────────┤
│ 0   │ unity-backend    │ fork    │ 0   │ online    │ 0.5%     │ 95.2mb   │
│ 1   │ unity-frontend   │ fork    │ 0   │ online    │ 0.2%     │ 42.1mb   │
└─────┴──────────────────┴─────────┴─────┴───────────┴──────────┴──────────┘
```

Both should show:
- **status**: `online` (not stopped)
- **↺**: `0` or low number (not 30+ restarts)
- **mode**: `fork` (this is OK)

## 🎯 TEST YOUR FIX

1. **Test Backend Health**:
```bash
curl http://localhost:3000/health
# Should return: {"status":"ok","timestamp":"..."}
```

2. **Test Frontend**:
```bash
curl http://localhost:5173
# Should return HTML content
```

3. **Test from Browser**:
- Open: http://16.171.225.46
- Try to register a new account
- Should work without 502 errors

## 📦 FILES TO UPLOAD

Before running the fix, upload these files from your local machine:

```bash
# From your local machine
scp -r unity-platform/* ubuntu@16.171.225.46:/var/www/Odispear/unity-platform/
```

Key files to upload:
- `backend/src/controllers/statusController.ts`
- `backend/src/controllers/reactionController.ts`  
- `backend/src/routes/statusRoutes.ts`
- `backend/src/routes/reactionRoutes.ts`
- `backend/src/services/socketService.ts`
- `frontend/src/components/VoiceChat/*` (entire folder)
- `frontend/src/components/chat/MessageReactions.tsx`
- `frontend/src/components/chat/FileUploadPreview.tsx`
- `FINAL_FIX_RUN_THIS.sh`

## 🚀 ALTERNATIVE: RUN THE COMPLETE FIX SCRIPT

If manual steps don't work, run the complete fix script:

```bash
cd /var/www/Odispear/unity-platform
chmod +x FINAL_FIX_RUN_THIS.sh
./FINAL_FIX_RUN_THIS.sh
```

This script will:
- ✅ Clean up all processes
- ✅ Install dependencies
- ✅ Create proper .env files
- ✅ Build both apps
- ✅ Configure database
- ✅ Setup Nginx
- ✅ Start services correctly
- ✅ Verify everything works

## 📞 STILL HAVING ISSUES?

Send me the output of:
```bash
pm2 logs --lines 100
sudo tail -50 /var/log/nginx/error.log
curl -v http://localhost:3000/health
curl -v http://localhost:5173
```

The main issue from your screenshot is the **frontend being offline**. The quick fix commands above should resolve this!
