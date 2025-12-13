#!/bin/bash
# ===========================================
# Deployment Update Script
# Run this to pull latest changes and restart
# ===========================================

set -e

echo "=========================================="
echo "Updating Unity Platform"
echo "=========================================="

cd ~/Odispear

# Pull latest changes
echo "Pulling latest changes..."
git pull origin main

# Update backend
echo "Building backend..."
cd unity-platform/backend
npm install --production=false
npm run build

# Update frontend
echo "Building frontend..."
cd ../frontend
npm install --production=false
npm run build

# Run migrations (safe - handles existing tables)
echo "Running migrations..."
cd ../backend
npm run migrate:prod

# Restart PM2
echo "Restarting application..."
pm2 restart odispear-backend

echo ""
echo "=========================================="
echo "Update complete!"
echo "=========================================="
pm2 status
