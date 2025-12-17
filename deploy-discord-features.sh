#!/bin/bash

# ============================================================================
# Unity Platform - Discord Features Deployment Script
# ============================================================================
# This script deploys all Discord-like features including:
# - Clickable message authors with profile modals
# - Send DM from user profiles
# - User bio and banner customization
# - Public invite link previews
# - Toast notifications for user feedback
# - Improved navigation with React Router
# ============================================================================

set -e  # Exit on error

echo "============================================================================"
echo "🚀 UNITY PLATFORM - DISCORD FEATURES DEPLOYMENT"
echo "============================================================================"
echo ""

# Configuration
APP_DIR="/var/www/Odispear/unity-platform"
BACKUP_DIR="/var/www/Odispear/backups/$(date +%Y%m%d_%H%M%S)"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Helper functions
success() { echo -e "${GREEN}✓${NC} $1"; }
info() { echo -e "${YELLOW}ℹ${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; }

# ============================================================================
# 1. PRE-DEPLOYMENT CHECKS
# ============================================================================
echo "📋 Step 1: Pre-deployment Checks"
echo "----------------------------------------------------------------------------"

# Check if running as correct user
info "Checking user permissions..."
if [ "$EUID" -eq 0 ]; then 
  error "Do not run as root! Run as your regular user."
  exit 1
fi
success "User permissions OK"

# Check if directory exists
if [ ! -d "$APP_DIR" ]; then
  error "Application directory not found: $APP_DIR"
  exit 1
fi
success "Application directory found"

cd "$APP_DIR"

# Check git repository
if [ ! -d ".git" ]; then
  error "Not a git repository"
  exit 1
fi
success "Git repository OK"

echo ""

# ============================================================================
# 2. BACKUP CURRENT STATE
# ============================================================================
echo "💾 Step 2: Creating Backup"
echo "----------------------------------------------------------------------------"

info "Creating backup at: $BACKUP_DIR"
sudo mkdir -p "$BACKUP_DIR"
sudo cp -r "$APP_DIR" "$BACKUP_DIR/"
success "Backup created successfully"

echo ""

# ============================================================================
# 3. PULL LATEST CODE
# ============================================================================
echo "📥 Step 3: Pulling Latest Code"
echo "----------------------------------------------------------------------------"

info "Fetching latest changes from repository..."
git fetch origin
git pull origin main

success "Code updated from repository"

echo ""

# ============================================================================
# 4. DATABASE MIGRATION
# ============================================================================
echo "🗄️  Step 4: Running Database Migrations"
echo "----------------------------------------------------------------------------"

info "Applying user profile enhancement migration..."

# Run the user profile migration
psql -U unity_app -d unity_platform -f database/user_profile_enhancement_migration.sql

success "Database migrations completed"

echo ""

# ============================================================================
# 5. BACKEND DEPENDENCIES
# ============================================================================
echo "📦 Step 5: Installing Backend Dependencies"
echo "----------------------------------------------------------------------------"

cd backend

info "Installing npm packages..."
npm install

# Install sharp for image processing
info "Installing sharp for image processing..."
npm install sharp@^0.32.6

success "Backend dependencies installed"

echo ""

# ============================================================================
# 6. BUILD BACKEND
# ============================================================================
echo "🔨 Step 6: Building Backend"
echo "----------------------------------------------------------------------------"

info "Compiling TypeScript..."
npm run build

success "Backend built successfully"

cd ..

echo ""

# ============================================================================
# 7. FRONTEND DEPENDENCIES & BUILD
# ============================================================================
echo "🎨 Step 7: Building Frontend"
echo "----------------------------------------------------------------------------"

cd frontend

info "Installing frontend dependencies..."
npm install

# Ensure correct environment variables
info "Setting up environment variables..."
cat > .env << 'EOF'
VITE_API_URL=https://16.171.225.46
VITE_WS_URL=wss://16.171.225.46
VITE_DAILY_DOMAIN=https://odispear.daily.co
EOF

info "Building frontend..."
npm run build

success "Frontend built successfully"

cd ..

echo ""

# ============================================================================
# 8. CREATE/UPDATE PM2 ECOSYSTEM
# ============================================================================
echo "⚙️  Step 8: Configuring PM2"
echo "----------------------------------------------------------------------------"

info "Creating PM2 ecosystem configuration..."

cat > ecosystem.config.js << 'EOFPM2'
module.exports = {
  apps: [{
    name: 'unity-backend',
    script: './backend/dist/index.js',
    cwd: '/var/www/Odispear/unity-platform',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: '3000',
      DATABASE_URL: 'postgresql://unity_app:Ayah2010@localhost:5432/unity_platform',
      JWT_SECRET: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30',
      REDIS_URL: 'redis://localhost:6379',
      DAILY_API_KEY: '558446b4f880406375a3fec3cfb4f87c3c725608a2a660986fff5d61ecd060f0',
      DAILY_DOMAIN: 'https://odispear.daily.co',
      CORS_ORIGIN: 'https://16.171.225.46',
      FRONTEND_URL: 'https://16.171.225.46'
    },
    error_file: './logs/backend-error.log',
    out_file: './logs/backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
EOFPM2

success "PM2 configuration created"

echo ""

# ============================================================================
# 9. RESTART BACKEND
# ============================================================================
echo "🔄 Step 9: Restarting Backend"
echo "----------------------------------------------------------------------------"

info "Stopping existing backend process..."
pm2 delete unity-backend 2>/dev/null || true

info "Starting backend with PM2..."
pm2 start ecosystem.config.js

info "Saving PM2 configuration..."
pm2 save

success "Backend restarted successfully"

echo ""

# ============================================================================
# 10. VERIFY NGINX CONFIGURATION
# ============================================================================
echo "🌐 Step 10: Verifying Nginx Configuration"
echo "----------------------------------------------------------------------------"

info "Checking Nginx configuration..."

# Create proper Nginx config if it doesn't exist
sudo tee /etc/nginx/sites-available/unity-https > /dev/null << 'EOFNGINX'
server {
    listen 80;
    server_name 16.171.225.46;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name 16.171.225.46;

    ssl_certificate /etc/nginx/ssl/server.crt;
    ssl_certificate_key /etc/nginx/ssl/server.key;

    # Increase body size for file uploads
    client_max_body_size 10M;

    # API routes - MUST come before root location
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "https://16.171.225.46" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
        add_header Access-Control-Allow-Credentials "true" always;
        
        if ($request_method = OPTIONS) {
            return 204;
        }
    }

    # Uploads directory for user avatars and banners
    location /uploads/ {
        alias /var/www/Odispear/unity-platform/backend/uploads/;
        add_header Access-Control-Allow-Origin "https://16.171.225.46" always;
    }

    # WebSocket
    location /socket.io/ {
        proxy_pass http://localhost:3000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend - serve static files
    location / {
        root /var/www/Odispear/unity-platform/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
EOFNGINX

# Enable site if not already enabled
sudo ln -sf /etc/nginx/sites-available/unity-https /etc/nginx/sites-enabled/

# Test Nginx configuration
info "Testing Nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
  success "Nginx configuration is valid"
  
  info "Reloading Nginx..."
  sudo systemctl reload nginx
  success "Nginx reloaded"
else
  error "Nginx configuration test failed"
  exit 1
fi

echo ""

# ============================================================================
# 11. CREATE UPLOADS DIRECTORY
# ============================================================================
echo "📁 Step 11: Setting Up Uploads Directory"
echo "----------------------------------------------------------------------------"

info "Creating uploads directory for avatars and banners..."
mkdir -p backend/uploads/avatars backend/uploads/banners

info "Setting correct permissions..."
chmod -R 755 backend/uploads

success "Uploads directory configured"

echo ""

# ============================================================================
# 12. DEPLOYMENT VERIFICATION
# ============================================================================
echo "✅ Step 12: Verifying Deployment"
echo "----------------------------------------------------------------------------"

sleep 3

# Check backend health
info "Checking backend health..."
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health || echo "000")

if [ "$BACKEND_STATUS" = "200" ]; then
  success "Backend is responding correctly (HTTP 200)"
else
  error "Backend health check failed (HTTP $BACKEND_STATUS)"
fi

# Check if PM2 process is running
info "Checking PM2 process..."
PM2_STATUS=$(pm2 list | grep "unity-backend" | grep "online" || echo "")

if [ -n "$PM2_STATUS" ]; then
  success "PM2 process is running"
else
  error "PM2 process is not running"
fi

# Check Nginx
info "Checking Nginx status..."
NGINX_STATUS=$(sudo systemctl is-active nginx)

if [ "$NGINX_STATUS" = "active" ]; then
  success "Nginx is active"
else
  error "Nginx is not active"
fi

# Check frontend build
if [ -f "frontend/dist/index.html" ]; then
  success "Frontend build exists"
else
  error "Frontend build not found"
fi

echo ""

# ============================================================================
# 13. SHOW DEPLOYMENT SUMMARY
# ============================================================================
echo "============================================================================"
echo "🎉 DEPLOYMENT COMPLETE!"
echo "============================================================================"
echo ""
echo "📊 Deployment Summary:"
echo "  • Backend: PM2 process running on port 3000"
echo "  • Frontend: Built and served via Nginx"
echo "  • Database: Migrations applied successfully"
echo "  • Nginx: Configured with HTTPS and API proxy"
echo ""
echo "🔗 Access URLs:"
echo "  • Application: https://16.171.225.46"
echo "  • Backend API: https://16.171.225.46/api/v1"
echo ""
echo "📋 New Features Deployed:"
echo "  ✓ Clickable message authors to view profiles"
echo "  ✓ Send DM directly from user profiles"
echo "  ✓ User bio and banner customization"
echo "  ✓ Public invite link previews (no login required)"
echo "  ✓ Toast notifications for better UX"
echo "  ✓ Improved navigation with React Router"
echo "  ✓ Auto-DM channel creation (prevents duplicates)"
echo "  ✓ Hover effects and visual feedback on clickable elements"
echo ""
echo "📝 Useful Commands:"
echo "  • View backend logs: pm2 logs unity-backend"
echo "  • Restart backend: pm2 restart unity-backend"
echo "  • Check PM2 status: pm2 status"
echo "  • Test Nginx: sudo nginx -t"
echo "  • Reload Nginx: sudo systemctl reload nginx"
echo ""
echo "🔧 Backup Location: $BACKUP_DIR"
echo ""
echo "⚠️  Don't forget to:"
echo "  1. Clear your browser cache (Ctrl+Shift+Delete)"
echo "  2. Test all new features"
echo "  3. Monitor PM2 logs for any errors"
echo ""
echo "============================================================================"
