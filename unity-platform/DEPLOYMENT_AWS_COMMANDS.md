# Unity Platform - AWS Deployment Commands

## Server Details
- **IP:** 16.171.225.46
- **Path:** /var/www/Odispear/unity-platform
- **Database:** unity_platform (user: unity_app)
- **PM2 Apps:** unity-backend, unity-frontend

## Quick Deployment (Copy & Paste)

### Connect to Server
```bash
ssh ubuntu@16.171.225.46
```

### Full Deployment Process
```bash
cd /var/www/Odispear/unity-platform

# Pull latest changes
git pull origin main

# Rebuild backend
cd backend
npm install
npm run build

# Restart backend
cd ..
pm2 restart unity-backend

# Check logs
pm2 logs unity-backend --lines 30

# Monitor for Daily.co room creation
pm2 logs unity-backend | grep -i "daily"
```

### Frontend Update (if needed)
```bash
cd /var/www/Odispear/unity-platform/frontend
npm install
npm run build
pm2 restart unity-frontend
```

## PM2 Commands Reference

### Status & Monitoring
```bash
# Check all app status
pm2 status

# Monitor in real-time
pm2 monit

# View logs (last 30 lines)
pm2 logs unity-backend --lines 30
pm2 logs unity-frontend --lines 30

# View logs in real-time
pm2 logs unity-backend
pm2 logs unity-frontend

# Filter logs for Daily.co
pm2 logs unity-backend | grep -i "daily"
pm2 logs unity-backend | grep -i "room"
pm2 logs unity-backend | grep -i "creating"
```

### Restart & Reload
```bash
# Restart single app
pm2 restart unity-backend

# Restart all apps
pm2 restart all

# Reload with zero downtime
pm2 reload unity-backend

# Stop and start
pm2 stop unity-backend
pm2 start unity-backend
```

### Delete & Reset
```bash
# Delete app from PM2
pm2 delete unity-backend
pm2 delete unity-frontend

# Delete all
pm2 delete all

# Start fresh
cd /var/www/Odispear/unity-platform
pm2 start ecosystem.config.js
pm2 save
```

## Database Commands

### Check Database
```bash
sudo -u postgres psql -d unity_platform -c "SELECT COUNT(*) FROM users;"
sudo -u postgres psql -d unity_platform -c "SELECT COUNT(*) FROM guilds;"
sudo -u postgres psql -d unity_platform -c "SELECT * FROM guild_invites LIMIT 5;"
```

### Run Migrations
```bash
cd /var/www/Odispear/unity-platform/database

# Run specific migration
sudo -u postgres psql -d unity_platform -f user_profile_migration.sql
sudo -u postgres psql -d unity_platform -f guild_invites_migration.sql
```

## Nginx Commands

### Check Nginx Status
```bash
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx
```

### View Nginx Logs
```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

## Service Health Checks

### Check if Services are Running
```bash
# Backend
curl http://localhost:3000/health

# Frontend
curl http://localhost:5173

# Public Access
curl http://16.171.225.46/health
curl http://16.171.225.46:3000/health
```

### Check Redis
```bash
redis-cli ping
# Should return: PONG
```

### Check PostgreSQL
```bash
sudo systemctl status postgresql
```

## Environment Variables

### View Current Environment
```bash
# Backend
cat /var/www/Odispear/unity-platform/backend/.env

# Frontend
cat /var/www/Odispear/unity-platform/frontend/.env
```

### Update Environment Variables
```bash
cd /var/www/Odispear/unity-platform/backend
nano .env
# Make changes
# Save with Ctrl+X, then Y, then Enter
pm2 restart unity-backend
```

## Troubleshooting

### Backend Won't Start
```bash
# Check logs for errors
pm2 logs unity-backend --err --lines 50

# Check if port 3000 is in use
sudo lsof -i :3000

# Kill process on port 3000
sudo kill -9 $(sudo lsof -t -i:3000)

# Restart
pm2 restart unity-backend
```

### Frontend Won't Start
```bash
# Check logs
pm2 logs unity-frontend --err --lines 50

# Check if port 5173 is in use
sudo lsof -i :5173

# Rebuild frontend
cd /var/www/Odispear/unity-platform/frontend
npm run build
pm2 restart unity-frontend
```

### Database Connection Issues
```bash
# Test database connection
sudo -u postgres psql -d unity_platform -c "SELECT NOW();"

# Check if PostgreSQL is running
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Redis Connection Issues
```bash
# Check Redis
redis-cli ping

# Restart Redis
sudo systemctl restart redis-server

# Check Redis status
sudo systemctl status redis-server
```

## Daily.co Voice Testing

### Test Voice Room Creation
```bash
# Monitor logs for Daily.co room creation
pm2 logs unity-backend | grep -i "creating daily"

# Test API endpoint directly
curl -X POST http://localhost:3000/api/v1/voice/channels/YOUR_CHANNEL_ID/token \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Check Daily.co API Status
```bash
# Test Daily.co API connectivity
curl -H "Authorization: Bearer 558446b4f880406375a3fec3cfb4f87c3c725608a2a660986fff5d61ecd060f0" \
  https://api.daily.co/v1/rooms | jq
```

## Git Commands

### Check Current Branch
```bash
cd /var/www/Odispear/unity-platform
git branch
git status
```

### Pull Specific Branch
```bash
git fetch origin
git checkout main
git pull origin main
```

### Discard Local Changes
```bash
git reset --hard origin/main
```

## Backup Commands

### Backup Database
```bash
sudo -u postgres pg_dump unity_platform > /tmp/unity_backup_$(date +%Y%m%d).sql
```

### Backup Files
```bash
tar -czf /tmp/unity_backup_$(date +%Y%m%d).tar.gz /var/www/Odispear/unity-platform
```

## Performance Monitoring

### System Resources
```bash
# CPU and Memory
top

# Disk usage
df -h

# App memory usage
pm2 list
```

### Network Connections
```bash
# Active connections
sudo netstat -tulpn | grep node

# WebSocket connections
sudo netstat -an | grep 3000 | grep ESTABLISHED | wc -l
```

## Complete Restart Procedure

If everything is broken, use this:
```bash
# Stop all services
pm2 stop all

# Pull latest code
cd /var/www/Odispear/unity-platform
git pull origin main

# Rebuild backend
cd backend
npm install
npm run build

# Rebuild frontend
cd ../frontend
npm install
npm run build

# Restart all
cd ..
pm2 restart all

# Check status
pm2 status
pm2 logs --lines 50
```

## Quick Links

- **Frontend:** http://16.171.225.46
- **Backend API:** http://16.171.225.46:3000
- **Health Check:** http://16.171.225.46:3000/health
- **API Docs:** http://16.171.225.46:3000/api/docs
- **Daily.co Dashboard:** https://dashboard.daily.co

## Environment File Locations

- Backend: `/var/www/Odispear/unity-platform/backend/.env`
- Frontend: `/var/www/Odispear/unity-platform/frontend/.env`
- PM2 Config: `/var/www/Odispear/unity-platform/ecosystem.config.js`
- Nginx Config: `/etc/nginx/sites-available/unity-platform`
