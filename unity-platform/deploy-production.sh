#!/bin/bash

# Unity Platform - Production Deployment Script
# This script handles all deployment issues including PM2 frontend offline problem

set -e

echo "🚀 Unity Platform Production Deployment Starting..."

# Configuration
GITHUB_REPO="https://github.com/MohdOtaqi/Odispear"
DEPLOY_DIR="/var/www/Odispear"
PROJECT_DIR="$DEPLOY_DIR/unity-platform"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
DB_NAME="unity_platform"
DB_USER="unity_app"
DB_PASS="sS6lR45ZNHkqj9OY5"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "📦 Step 1: Fetching latest code from GitHub..."
cd $DEPLOY_DIR
git fetch origin
git reset --hard origin/main

echo "📥 Step 2: Installing backend dependencies..."
cd $BACKEND_DIR
npm install

echo "🔧 Step 3: Setting up backend environment..."
cat > .env.production << EOF
# Server
NODE_ENV=production
PORT=3000

# Database - AWS
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=unity-platform-secret-key-2024-production
JWT_EXPIRES_IN=7d

# CORS - Update with your domain
CORS_ORIGIN=http://16.171.225.46,http://localhost:5173

# AWS S3 (for file uploads)
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID:-your-key}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY:-your-secret}
AWS_S3_BUCKET=unity-platform-uploads
AWS_REGION=us-east-1

# Agora Voice/Video
AGORA_APP_ID=e7f6e9aeecf14b2ba10e3f40be9f56e7
AGORA_APP_CERTIFICATE=b4a91481752d4a22bcdd43fb2bcac015

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
EOF

echo "🔨 Step 4: Building backend..."
npm run build

echo "📥 Step 5: Installing frontend dependencies..."
cd $FRONTEND_DIR
npm install

echo "🔧 Step 6: Setting up frontend environment..."
cat > .env.production << EOF
VITE_API_URL=http://16.171.225.46:3000
VITE_WS_URL=ws://16.171.225.46:3000
VITE_AGORA_APP_ID=e7f6e9aeecf14b2ba10e3f40be9f56e7
EOF

echo "🔨 Step 7: Building frontend..."
npm run build

echo "📦 Step 8: Installing serve globally for frontend..."
npm install -g serve

echo "🗄️ Step 9: Running database migrations..."
cd $PROJECT_DIR/database
if [ -f schema.sql ]; then
    sudo -u postgres psql -d $DB_NAME < schema.sql 2>/dev/null || true
fi
if [ -f friends_dm_migration.sql ]; then
    sudo -u postgres psql -d $DB_NAME < friends_dm_migration.sql 2>/dev/null || true
fi
if [ -f voice_sessions.sql ]; then
    sudo -u postgres psql -d $DB_NAME < voice_sessions.sql 2>/dev/null || true
fi

echo "🔄 Step 10: Stopping all PM2 processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

echo "🚀 Step 11: Starting backend with PM2..."
cd $BACKEND_DIR
pm2 start ecosystem.config.js --env production

echo "🚀 Step 12: Starting frontend with PM2 (fixing offline issue)..."
cd $FRONTEND_DIR
# Create a proper ecosystem config for frontend
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'unity-frontend',
      script: 'serve',
      args: '-s dist -l 5173 -n',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true
    }
  ]
};
EOF

# Start frontend with ecosystem config
pm2 start ecosystem.config.js

echo "💾 Step 13: Saving PM2 configuration..."
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu

echo "🔧 Step 14: Setting up Nginx (if needed)..."
sudo tee /etc/nginx/sites-available/unity-platform > /dev/null << EOF
server {
    listen 80;
    server_name 16.171.225.46;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/unity-platform /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

echo "📊 Step 15: Checking deployment status..."
pm2 status

echo -e "${GREEN}✅ DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}🌐 Frontend: http://16.171.225.46${NC}"
echo -e "${GREEN}🔌 Backend API: http://16.171.225.46:3000/api/v1${NC}"
echo -e "${GREEN}❤️ Health Check: http://16.171.225.46:3000/health${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "📋 Useful commands:"
echo "  pm2 status          - Check app status"
echo "  pm2 logs            - View all logs"
echo "  pm2 restart all     - Restart all apps"
echo "  pm2 monit           - Monitor apps"
echo ""

# Final verification
echo "🔍 Verifying deployment..."
sleep 3
curl -s http://localhost:3000/health > /dev/null && echo -e "${GREEN}✓ Backend is running${NC}" || echo -e "${RED}✗ Backend failed to start${NC}"
curl -s http://localhost:5173 > /dev/null && echo -e "${GREEN}✓ Frontend is running${NC}" || echo -e "${RED}✗ Frontend failed to start${NC}"

echo ""
echo "🎉 Unity Platform is now live at http://16.171.225.46"
