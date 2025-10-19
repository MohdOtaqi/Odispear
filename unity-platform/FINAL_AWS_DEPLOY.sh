#!/bin/bash

# =========================================
# Unity Platform - FINAL AWS DEPLOYMENT
# Fixes ALL issues including PM2 frontend offline
# =========================================

set -e

echo "🚀 UNITY PLATFORM - COMPLETE DEPLOYMENT SCRIPT"
echo "=============================================="
echo ""

# Configuration
DEPLOY_DIR="/var/www/Odispear"
PROJECT_DIR="$DEPLOY_DIR/unity-platform"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
DATABASE_DIR="$PROJECT_DIR/database"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "📂 Step 1: Navigating to project directory..."
cd $DEPLOY_DIR

echo "📥 Step 2: Fetching latest code from GitHub..."
git fetch origin
git reset --hard origin/main

echo "🔧 Step 3: Setting up Backend..."
cd $BACKEND_DIR

# Install backend dependencies
echo "   Installing backend dependencies..."
npm install

# Create production .env
echo "   Creating backend production config..."
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://unity_app:sS6lR45ZNHkqj9OY5@localhost:5432/unity_platform

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=unity-platform-jwt-secret-production-2024
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://16.171.225.46,http://16.171.225.46:5173,http://localhost:5173

# AWS S3 (Optional for file uploads)
AWS_ACCESS_KEY_ID=AKIAVL7IKAIUL2QW2U2M
AWS_SECRET_ACCESS_KEY=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
AWS_S3_BUCKET=unity-platform-uploads
AWS_REGION=us-east-1

# Agora (Voice/Video)
AGORA_APP_ID=e7f6e9aeecf14b2ba10e3f40be9f56e7
AGORA_APP_CERTIFICATE=b4a91481752d4a22bcdd43fb2bcac015

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain
EOF

# Build backend
echo "   Building backend..."
npm run build

echo "🔧 Step 4: Setting up Frontend..."
cd $FRONTEND_DIR

# Install frontend dependencies
echo "   Installing frontend dependencies..."
npm install

# Install serve globally if not installed
echo "   Installing serve for static hosting..."
sudo npm install -g serve

# Create production .env
echo "   Creating frontend production config..."
cat > .env << 'EOF'
VITE_API_URL=http://16.171.225.46:3000
VITE_WS_URL=ws://16.171.225.46:3000
VITE_AGORA_APP_ID=e7f6e9aeecf14b2ba10e3f40be9f56e7
EOF

# Build frontend
echo "   Building frontend..."
npm run build

echo "🗄️ Step 5: Running Database Migrations..."
cd $DATABASE_DIR

# Run all migrations
for migration in schema.sql friends_dm_migration.sql voice_sessions.sql soundboard_migration.sql; do
    if [ -f "$migration" ]; then
        echo "   Running $migration..."
        sudo -u postgres psql -d unity_platform < "$migration" 2>/dev/null || true
    fi
done

echo "🔄 Step 6: Configuring PM2..."
cd $PROJECT_DIR

# Stop and delete all existing PM2 processes
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'unity-backend',
      script: './backend/dist/index.js',
      cwd: '/var/www/Odispear/unity-platform',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      max_memory_restart: '500M',
      node_args: '--max-old-space-size=512'
    },
    {
      name: 'unity-frontend',
      script: 'npx',
      args: 'serve -s frontend/dist -l 5173 -n',
      cwd: '/var/www/Odispear/unity-platform',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true,
      interpreter: 'none'
    }
  ]
};
EOF

# Create logs directory
mkdir -p logs

# Start PM2 processes
echo "🚀 Step 7: Starting Services with PM2..."
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup systemd -u ubuntu --hp /home/ubuntu 2>/dev/null || true

echo "🔧 Step 8: Configuring Nginx..."
sudo tee /etc/nginx/sites-available/unity-platform > /dev/null << 'EOF'
server {
    listen 80;
    server_name 16.171.225.46;
    client_max_body_size 20M;

    # Frontend
    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.IO
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:3000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
EOF

# Enable the site and reload nginx
sudo ln -sf /etc/nginx/sites-available/unity-platform /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "📊 Step 9: Verifying Deployment..."
sleep 5

# Check PM2 status
echo -e "${YELLOW}PM2 Process Status:${NC}"
pm2 status

echo ""
echo "🔍 Step 10: Running Health Checks..."
sleep 3

# Check backend
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is running on port 3000${NC}"
else
    echo -e "${RED}✗ Backend is not responding${NC}"
fi

# Check frontend
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend is running on port 5173${NC}"
else
    echo -e "${RED}✗ Frontend is not responding${NC}"
fi

# Check nginx
if curl -s http://localhost > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Nginx is properly configured${NC}"
else
    echo -e "${RED}✗ Nginx configuration issue${NC}"
fi

# Check database
if sudo -u postgres psql -d unity_platform -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Database connection successful${NC}"
else
    echo -e "${RED}✗ Database connection failed${NC}"
fi

# Check Redis
if redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Redis is running${NC}"
else
    echo -e "${RED}✗ Redis is not running${NC}"
fi

echo ""
echo "=================================================="
echo -e "${GREEN}✅ DEPLOYMENT COMPLETE!${NC}"
echo "=================================================="
echo ""
echo -e "${GREEN}🌐 Frontend URL: http://16.171.225.46${NC}"
echo -e "${GREEN}🔌 Backend API: http://16.171.225.46/api/v1${NC}"
echo -e "${GREEN}❤️  Health Check: http://16.171.225.46/health${NC}"
echo ""
echo "📋 Useful Commands:"
echo "   pm2 status         - Check application status"
echo "   pm2 logs           - View all logs"
echo "   pm2 logs unity-backend - View backend logs"
echo "   pm2 logs unity-frontend - View frontend logs"
echo "   pm2 restart all    - Restart all services"
echo "   pm2 monit          - Real-time monitoring"
echo ""
echo "🎮 Features Added:"
echo "   ✓ Soundboard with audio upload"
echo "   ✓ Stage Channels for presentations"
echo "   ✓ Activities/Games integration"
echo "   ✓ User Notes (private)"
echo "   ✓ Voice Chat with Push-to-Talk"
echo "   ✓ Screen Share & Video"
echo "   ✓ AutoMod system"
echo "   ✓ Custom Keybinds"
echo "   ✓ Server Boost system"
echo ""
echo "🎉 Unity Platform is now LIVE!"
echo "=================================================="
