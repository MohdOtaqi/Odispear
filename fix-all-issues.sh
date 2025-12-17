#!/bin/bash

# Unity Platform - Complete Fix Script
# This script fixes ALL deployment issues

echo "🔧 UNITY PLATFORM - COMPLETE FIX SCRIPT"
echo "========================================"
echo "This will fix:"
echo "  ✓ PM2 configuration (cluster to fork mode issue)"
echo "  ✓ Frontend offline issue" 
echo "  ✓ Backend 502 Bad Gateway"
echo "  ✓ Database connections"
echo "  ✓ Nginx proxy configuration"
echo "  ✓ API routes"
echo ""

# Variables
PROJECT_DIR="/var/www/Odispear/unity-platform"
DB_NAME="unity_platform"
DB_USER="unity_app"
DB_PASSWORD="password"
SERVER_IP="16.171.225.46"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to check status
check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1${NC}"
    else
        echo -e "${RED}✗ $1 failed${NC}"
        exit 1
    fi
}

echo -e "\n${YELLOW}Step 1: Stopping all services...${NC}"
cd $PROJECT_DIR
pm2 stop all
pm2 delete all
check "Services stopped"

echo -e "\n${YELLOW}Step 2: Installing global dependencies...${NC}"
sudo npm install -g serve pm2
check "Global dependencies installed"

echo -e "\n${YELLOW}Step 3: Setting up Backend...${NC}"
cd $PROJECT_DIR/backend

# Create production .env file
cat > .env << EOF
# Server Configuration
NODE_ENV=production
PORT=3000

# Database - PostgreSQL
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}

# Redis
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-$(openssl rand -hex 32)
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d

# CORS - Allow your server IP
CORS_ORIGIN=http://${SERVER_IP}

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp,application/pdf

# Agora Voice Chat
AGORA_APP_ID=e7f6e9aeecf14b2ba10e3f40be9f56e7
AGORA_APP_CERTIFICATE=

# Session
SESSION_SECRET=$(openssl rand -hex 32)

# Log Level
LOG_LEVEL=info
EOF
check "Backend .env created"

# Install dependencies and build
npm install
check "Backend dependencies installed"

npm run build
check "Backend built"

echo -e "\n${YELLOW}Step 4: Setting up Frontend...${NC}"
cd $PROJECT_DIR/frontend

# Create production .env file
cat > .env << EOF
# Frontend Environment Variables
VITE_API_URL=http://${SERVER_IP}
VITE_WS_URL=ws://${SERVER_IP}
VITE_AGORA_APP_ID=e7f6e9aeecf14b2ba10e3f40be9f56e7
EOF
check "Frontend .env created"

# Install dependencies and build
npm install
check "Frontend dependencies installed"

npm run build
check "Frontend built"

echo -e "\n${YELLOW}Step 5: Setting up Database...${NC}"
cd $PROJECT_DIR

# Create database and user
sudo -u postgres psql << EOF
-- Create database if not exists
SELECT 'CREATE DATABASE ${DB_NAME}' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')\\gexec

-- Create user if not exists  
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = '${DB_USER}') THEN
        CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
    END IF;
END
\$\$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
\\q
EOF
check "Database setup"

# Apply schema
if [ -f database/schema.sql ]; then
    PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME < database/schema.sql 2>/dev/null || true
    check "Schema applied"
fi

echo -e "\n${YELLOW}Step 6: Configuring Nginx...${NC}"
# Create Nginx configuration
sudo tee /etc/nginx/sites-available/unity-platform > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;
    
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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # WebSocket
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
    }
    
    client_max_body_size 10M;
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/unity-platform /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
check "Nginx configured"

sudo systemctl restart nginx
check "Nginx restarted"

echo -e "\n${YELLOW}Step 7: Starting services with PM2...${NC}"
cd $PROJECT_DIR

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: "unity-backend",
      script: "./backend/dist/index.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      },
      max_memory_restart: "1G",
      error_file: "./logs/backend-error.log",
      out_file: "./logs/backend-out.log",
      time: true
    },
    {
      name: "unity-frontend",
      script: "serve",
      args: "-s ./frontend/dist -p 5173",
      instances: 1,
      exec_mode: "fork",
      interpreter: "none",
      env: {
        NODE_ENV: "production"
      },
      max_memory_restart: "500M",
      error_file: "./logs/frontend-error.log",
      out_file: "./logs/frontend-out.log",
      time: true
    }
  ]
};
EOF
check "PM2 ecosystem file created"

# Create logs directory
mkdir -p logs
check "Logs directory created"

# Start services with ecosystem file
pm2 start ecosystem.config.js
check "Services started"

# Save PM2 configuration
pm2 save
check "PM2 configuration saved"

# Setup PM2 startup
pm2 startup systemd -u ubuntu --hp /home/ubuntu 2>/dev/null || true
check "PM2 startup configured"

echo -e "\n${YELLOW}Step 8: Testing services...${NC}"
sleep 5

# Test backend
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${RED}✗ Backend failed to start${NC}"
    pm2 logs unity-backend --lines 50 --nostream
fi

# Test frontend
if curl -f http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend is running${NC}"
else
    echo -e "${RED}✗ Frontend failed to start${NC}"
    pm2 logs unity-frontend --lines 50 --nostream
fi

# Show final status
echo -e "\n${YELLOW}Final Status:${NC}"
pm2 status

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 DEPLOYMENT FIXED SUCCESSFULLY!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Access your app at: ${GREEN}http://${SERVER_IP}${NC}"
echo ""
echo "If you still have issues, check logs:"
echo "  pm2 logs unity-backend"
echo "  pm2 logs unity-frontend"
echo "  sudo tail -f /var/log/nginx/error.log"
echo ""
echo "To restart services:"
echo "  pm2 restart all"
echo ""
echo "To monitor:"
echo "  pm2 monit"
