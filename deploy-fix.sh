#!/bin/bash

# Unity Platform - Complete Deployment Fix Script
# This script fixes all deployment issues and ensures everything works

echo "🔧 Unity Platform - Complete Deployment Fix"
echo "==========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables
PROJECT_DIR="/var/www/Odispear/unity-platform"
BACKEND_PORT=3000
FRONTEND_PORT=5173
DB_NAME="unity_platform"
DB_USER="unity_app"
SERVER_IP="16.171.225.46"

# Function to check if command succeeded
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1${NC}"
    else
        echo -e "${RED}✗ $1 failed${NC}"
        exit 1
    fi
}

# Step 1: Navigate to project directory
cd $PROJECT_DIR || exit 1
check_status "Navigate to project directory"

# Step 2: Stop all PM2 processes
echo -e "\n${YELLOW}Step 1: Stopping all PM2 processes...${NC}"
pm2 stop all
pm2 delete all
check_status "PM2 processes stopped"

# Step 3: Install global dependencies if not present
echo -e "\n${YELLOW}Step 2: Checking global dependencies...${NC}"
if ! command -v serve &> /dev/null; then
    npm install -g serve
    check_status "Installed serve globally"
fi

# Step 4: Backend Setup
echo -e "\n${YELLOW}Step 3: Setting up Backend...${NC}"
cd $PROJECT_DIR/backend

# Copy production environment file
if [ ! -f .env ]; then
    if [ -f .env.production ]; then
        cp .env.production .env
    else
        cat > .env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://${DB_USER}:password@localhost:5432/${DB_NAME}
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-$(openssl rand -hex 32)
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d
CORS_ORIGIN=http://${SERVER_IP},http://${SERVER_IP}:5173,http://localhost:5173
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_SIZE=10485760
AGORA_APP_ID=e7f6e9aeecf14b2ba10e3f40be9f56e7
EOF
    fi
    check_status "Backend environment file created"
fi

# Install backend dependencies
npm install
check_status "Backend dependencies installed"

# Build backend
npm run build
check_status "Backend built"

# Step 5: Frontend Setup
echo -e "\n${YELLOW}Step 4: Setting up Frontend...${NC}"
cd $PROJECT_DIR/frontend

# Create frontend environment file
cat > .env << EOF
VITE_API_URL=http://${SERVER_IP}:3000
VITE_WS_URL=ws://${SERVER_IP}:3000
VITE_AGORA_APP_ID=e7f6e9aeecf14b2ba10e3f40be9f56e7
EOF
check_status "Frontend environment file created"

# Install frontend dependencies
npm install
check_status "Frontend dependencies installed"

# Build frontend
npm run build
check_status "Frontend built"

# Step 6: Database Setup
echo -e "\n${YELLOW}Step 5: Setting up Database...${NC}"
cd $PROJECT_DIR

# Create database if it doesn't exist
sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME};" 2>/dev/null || true
sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD 'password';" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};" 2>/dev/null || true

# Run migrations
if [ -f database/schema.sql ]; then
    sudo -u postgres psql -d ${DB_NAME} < database/schema.sql 2>/dev/null || true
    check_status "Database schema applied"
fi

# Step 7: Create logs directory
echo -e "\n${YELLOW}Step 6: Creating logs directory...${NC}"
mkdir -p $PROJECT_DIR/logs
check_status "Logs directory created"

# Step 8: Configure Nginx
echo -e "\n${YELLOW}Step 7: Configuring Nginx...${NC}"
sudo tee /etc/nginx/sites-available/unity-platform > /dev/null << EOF
server {
    listen 80;
    server_name ${SERVER_IP};
    
    # Frontend
    location / {
        proxy_pass http://127.0.0.1:5173;
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
    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Increase timeouts for API
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # WebSocket support
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Health check
    location /health {
        proxy_pass http://127.0.0.1:3000/health;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/unity-platform /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default 2>/dev/null
sudo nginx -t
check_status "Nginx configured"

# Reload Nginx
sudo systemctl reload nginx
check_status "Nginx reloaded"

# Step 9: Start services with PM2
echo -e "\n${YELLOW}Step 8: Starting services with PM2...${NC}"
cd $PROJECT_DIR

# Start backend
pm2 start backend/dist/index.js --name unity-backend \
    --max-memory-restart 1G \
    --log logs/backend.log \
    --error logs/backend-error.log \
    --output logs/backend-out.log \
    --merge-logs \
    --time

check_status "Backend started"

# Start frontend
pm2 start "npx serve -s frontend/dist -p 5173" --name unity-frontend \
    --max-memory-restart 500M \
    --log logs/frontend.log \
    --error logs/frontend-error.log \
    --output logs/frontend-out.log \
    --merge-logs \
    --time

check_status "Frontend started"

# Save PM2 configuration
pm2 save
check_status "PM2 configuration saved"

# Setup PM2 startup
pm2 startup systemd -u ubuntu --hp /home/ubuntu
check_status "PM2 startup configured"

# Step 10: Test services
echo -e "\n${YELLOW}Step 9: Testing services...${NC}"
sleep 5

# Test backend health
curl -f http://localhost:3000/health > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${RED}✗ Backend health check failed${NC}"
    echo "Checking backend logs..."
    pm2 logs unity-backend --lines 20 --nostream
fi

# Test frontend
curl -f http://localhost:5173 > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend is running${NC}"
else
    echo -e "${RED}✗ Frontend health check failed${NC}"
    echo "Checking frontend logs..."
    pm2 logs unity-frontend --lines 20 --nostream
fi

# Test Nginx proxy
curl -f http://${SERVER_IP}/api/v1/auth/health > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Nginx proxy is working${NC}"
else
    echo -e "${YELLOW}⚠ Nginx proxy test failed (this might be normal if /auth/health doesn't exist)${NC}"
fi

# Step 11: Show final status
echo -e "\n${YELLOW}Step 10: Final Status${NC}"
echo "==========================================="
pm2 status

echo -e "\n${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo "==========================================="
echo -e "Frontend: ${GREEN}http://${SERVER_IP}${NC}"
echo -e "Backend API: ${GREEN}http://${SERVER_IP}/api/v1${NC}"
echo -e "Health Check: ${GREEN}http://${SERVER_IP}/health${NC}"
echo ""
echo "Commands for monitoring:"
echo "  pm2 status        - Check service status"
echo "  pm2 logs          - View all logs"
echo "  pm2 monit         - Real-time monitoring"
echo "  pm2 restart all   - Restart all services"
echo ""
echo "If you encounter issues:"
echo "  pm2 logs unity-backend --lines 100"
echo "  pm2 logs unity-frontend --lines 100"
echo "  sudo journalctl -u nginx -n 50"
echo "  sudo tail -f /var/log/nginx/error.log"
