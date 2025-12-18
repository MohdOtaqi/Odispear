#!/bin/bash
# Production Deployment Script for Odispear Platform

set -e  # Exit on error

echo "🚀 Starting Odispear Deployment..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_BUILD_DIR="$HOME/Odispear/frontend"
NGINX_SERVE_DIR="$HOME/Odispear/unity-platform/frontend"
BACKEND_DIR="$HOME/Odispear/backend"

echo -e "${BLUE}Step 1:${NC} Building Frontend..."
cd "$FRONTEND_BUILD_DIR"
npm run build

echo -e "${BLUE}Step 2:${NC} Deploying Frontend to Nginx Directory..."
rm -rf "$NGINX_SERVE_DIR/dist"
cp -r "$FRONTEND_BUILD_DIR/dist" "$NGINX_SERVE_DIR/"
echo -e "${GREEN}✓${NC} Frontend deployed to: $NGINX_SERVE_DIR/dist"

echo -e "${BLUE}Step 3:${NC} Testing Nginx Configuration..."
sudo nginx -t

echo -e "${BLUE}Step 4:${NC} Reloading Nginx..."
sudo systemctl reload nginx
echo -e "${GREEN}✓${NC} Nginx reloaded"

echo -e "${BLUE}Step 5:${NC} Restarting Backend (PM2)..."
cd "$BACKEND_DIR"
pm2 restart odispear-backend
echo -e "${GREEN}✓${NC} Backend restarted"

echo -e "${BLUE}Step 6:${NC} Verifying Deployment..."
DEPLOYED_JS=$(curl -s https://n0tmot.com | grep -o 'index-[a-z0-9]*\.js' || echo "FAILED")
echo -e "Live bundle: ${GREEN}$DEPLOYED_JS${NC}"

echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Deployment Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""
echo -e "🌐 Live URL: ${BLUE}https://n0tmot.com${NC}"
echo -e "📊 PM2 Status: ${YELLOW}pm2 status${NC}"
echo -e "📝 PM2 Logs: ${YELLOW}pm2 logs odispear-backend${NC}"
echo ""
echo -e "${YELLOW}⚠️  Remember to hard refresh your browser: Ctrl+Shift+R${NC}"
