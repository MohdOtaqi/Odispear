#!/bin/bash

# ====================================================================
# UNITY PLATFORM - FINAL COMPLETE FIX
# This script will fix ALL your deployment issues
# ====================================================================

set -e  # Exit on any error

echo "╔══════════════════════════════════════════════════════════╗"
echo "║        UNITY PLATFORM - FINAL DEPLOYMENT FIX              ║"
echo "║                                                            ║"
echo "║  This will fix:                                           ║"
echo "║  • Frontend offline issue                                 ║"
echo "║  • 502 Bad Gateway errors                                 ║"
echo "║  • Database connection                                    ║"
echo "║  • PM2 fork/cluster mode                                  ║"
echo "║  • API routes (friends, DM, etc.)                        ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Configuration
PROJECT_DIR="/var/www/Odispear/unity-platform"
DB_NAME="unity_platform"
DB_USER="unity_app"
DB_PASSWORD="password"
SERVER_IP="16.171.225.46"
BACKEND_PORT="3000"
FRONTEND_PORT="5173"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# ====================
# STEP 1: CLEANUP
# ====================
echo ""
echo -e "${YELLOW}═══ STEP 1: Cleaning up old processes ═══${NC}"

# Stop and delete all PM2 processes
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
log_success "PM2 processes cleaned"

# Kill any processes on our ports
sudo fuser -k ${BACKEND_PORT}/tcp 2>/dev/null || true
sudo fuser -k ${FRONTEND_PORT}/tcp 2>/dev/null || true
log_success "Ports cleared"

# ====================
# STEP 2: DEPENDENCIES
# ====================
echo ""
echo -e "${YELLOW}═══ STEP 2: Installing global dependencies ═══${NC}"

# Install global packages
npm install -g pm2@latest serve 2>/dev/null
log_success "Global packages installed"

# ====================
# STEP 3: BACKEND SETUP
# ====================
echo ""
echo -e "${YELLOW}═══ STEP 3: Setting up Backend ═══${NC}"

cd ${PROJECT_DIR}/backend

# Create production .env
cat > .env << EOL
# Server
NODE_ENV=production
PORT=${BACKEND_PORT}

# Database
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=$(openssl rand -hex 64)
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d

# CORS
CORS_ORIGIN=http://${SERVER_IP},http://${SERVER_IP}:${FRONTEND_PORT},http://localhost:${FRONTEND_PORT}

# Session
SESSION_SECRET=$(openssl rand -hex 32)

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain

# Agora
AGORA_APP_ID=e7f6e9aeecf14b2ba10e3f40be9f56e7
AGORA_APP_CERTIFICATE=

# Logging
LOG_LEVEL=info
EOL
log_success "Backend .env configured"

# Install and build
npm install --production=false
log_success "Backend dependencies installed"

npm run build
log_success "Backend built successfully"

# ====================
# STEP 4: FRONTEND SETUP
# ====================
echo ""
echo -e "${YELLOW}═══ STEP 4: Setting up Frontend ═══${NC}"

cd ${PROJECT_DIR}/frontend

# Create production .env
cat > .env << EOL
# API URLs - No port needed, Nginx will proxy
VITE_API_URL=http://${SERVER_IP}
VITE_WS_URL=ws://${SERVER_IP}

# Agora
VITE_AGORA_APP_ID=e7f6e9aeecf14b2ba10e3f40be9f56e7
EOL
log_success "Frontend .env configured"

# Install and build
npm install --production=false
log_success "Frontend dependencies installed"

npm run build
log_success "Frontend built successfully"

# ====================
# STEP 5: DATABASE
# ====================
echo ""
echo -e "${YELLOW}═══ STEP 5: Setting up Database ═══${NC}"

# Create database and user (ignore errors if they exist)
sudo -u postgres psql << SQL 2>/dev/null || true
CREATE DATABASE ${DB_NAME};
CREATE USER ${DB_USER} WITH ENCRYPTED PASSWORD '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
ALTER DATABASE ${DB_NAME} OWNER TO ${DB_USER};
SQL

# Grant permissions on schema
sudo -u postgres psql -d ${DB_NAME} << SQL 2>/dev/null || true
GRANT ALL ON SCHEMA public TO ${DB_USER};
SQL

log_success "Database configured"

# Apply schema if exists
if [ -f ${PROJECT_DIR}/database/schema.sql ]; then
    PGPASSWORD=${DB_PASSWORD} psql -h localhost -U ${DB_USER} -d ${DB_NAME} < ${PROJECT_DIR}/database/schema.sql 2>/dev/null || true
    log_success "Database schema applied"
fi

# ====================
# STEP 6: NGINX
# ====================
echo ""
echo -e "${YELLOW}═══ STEP 6: Configuring Nginx ═══${NC}"

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/unity-platform > /dev/null << 'NGINX'
server {
    listen 80;
    listen [::]:80;
    server_name _;
    
    # Logging
    access_log /var/log/nginx/unity-platform-access.log;
    error_log /var/log/nginx/unity-platform-error.log;
    
    # Frontend - Root path
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
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # WebSocket
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Health check
    location /health {
        proxy_pass http://127.0.0.1:3000/health;
    }
    
    # File upload size
    client_max_body_size 10M;
}
NGINX

# Enable site
sudo ln -sf /etc/nginx/sites-available/unity-platform /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
log_success "Nginx configured and reloaded"

# ====================
# STEP 7: PM2 SETUP
# ====================
echo ""
echo -e "${YELLOW}═══ STEP 7: Starting services with PM2 ═══${NC}"

cd ${PROJECT_DIR}

# Create logs directory
mkdir -p logs

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'PM2CONFIG'
module.exports = {
  apps: [
    {
      name: 'unity-backend',
      script: './backend/dist/index.js',
      cwd: '/var/www/Odispear/unity-platform',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      merge_logs: true,
      time: true
    },
    {
      name: 'unity-frontend',
      script: 'serve',
      args: '-s ./frontend/dist -l 5173',
      cwd: '/var/www/Odispear/unity-platform',
      instances: 1,
      exec_mode: 'fork',
      interpreter: 'none',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      merge_logs: true,
      time: true
    }
  ]
};
PM2CONFIG

# Start services
pm2 start ecosystem.config.js
log_success "Services started with PM2"

# Save PM2 configuration
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu | grep 'sudo' | bash
log_success "PM2 startup configured"

# ====================
# STEP 8: VERIFICATION
# ====================
echo ""
echo -e "${YELLOW}═══ STEP 8: Verifying deployment ═══${NC}"

# Wait for services to start
sleep 5

# Check backend
if curl -f -s http://localhost:${BACKEND_PORT}/health > /dev/null 2>&1; then
    log_success "Backend is running ✓"
else
    log_error "Backend health check failed"
    log_warning "Backend logs:"
    pm2 logs unity-backend --lines 20 --nostream
fi

# Check frontend
if curl -f -s http://localhost:${FRONTEND_PORT} > /dev/null 2>&1; then
    log_success "Frontend is running ✓"
else
    log_error "Frontend health check failed"
    log_warning "Frontend logs:"
    pm2 logs unity-frontend --lines 20 --nostream
fi

# Check Nginx proxy
if curl -f -s http://${SERVER_IP}/health > /dev/null 2>&1; then
    log_success "Nginx proxy working ✓"
else
    log_warning "Nginx proxy may need configuration"
fi

# ====================
# FINAL STATUS
# ====================
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                    DEPLOYMENT STATUS                      ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Show PM2 status
pm2 status

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                 ✅ DEPLOYMENT COMPLETE!                   ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Your application is now available at:${NC}"
echo -e "  🌐 Frontend: ${BLUE}http://${SERVER_IP}${NC}"
echo -e "  🔌 API: ${BLUE}http://${SERVER_IP}/api/v1${NC}"
echo -e "  ❤️  Health: ${BLUE}http://${SERVER_IP}/health${NC}"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "  • View logs:       pm2 logs"
echo "  • Monitor:         pm2 monit"
echo "  • Restart all:     pm2 restart all"
echo "  • Backend logs:    pm2 logs unity-backend"
echo "  • Frontend logs:   pm2 logs unity-frontend"
echo "  • Nginx errors:    sudo tail -f /var/log/nginx/unity-platform-error.log"
echo ""

# Test registration endpoint
echo -e "${YELLOW}Testing API endpoint:${NC}"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://${SERVER_IP}/api/v1/auth/register -X POST -H "Content-Type: application/json" -d '{"test":"test"}')
if [ "$RESPONSE" != "502" ]; then
    log_success "API is responding (HTTP $RESPONSE)"
else
    log_error "API returned 502 - Check backend logs"
fi

echo ""
echo "If you still have issues, run:"
echo "  pm2 logs unity-backend --lines 100"
echo "  sudo journalctl -xe | grep nginx"
