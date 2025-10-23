#!/bin/bash
# Unity Platform - Complete Fix Deployment Script

echo "================================="
echo "Unity Platform - Deploying Fixes"
echo "================================="

# 1. Navigate to project
cd /var/www/Odispear/unity-platform

# 2. Pull latest changes from Git
echo "Pulling latest changes..."
git pull origin main

# 3. Install backend dependencies and build
echo "Building backend..."
cd backend
npm install
npm run build

# 4. Install frontend dependencies and build
echo "Building frontend..."
cd ../frontend
npm install
npm run build

# 5. Restart PM2
echo "Restarting PM2..."
cd ..
pm2 restart all
pm2 save

# 6. Show logs
echo "Showing backend logs..."
pm2 logs unity-backend --lines 30

echo "================================="
echo "DEPLOYMENT COMPLETE!"
echo "================================="
echo ""
echo "NOW TEST THE FOLLOWING:"
echo "1. Go to: http://16.171.225.46"
echo "2. Friends Page - Click on friend to see profile"
echo "3. Friends Page - Click message to open DM"
echo "4. Server Members - Click on member to see profile"
echo "5. Create a NEW invite and test it"
echo ""
echo "If invites still don't work, check:"
echo "pm2 logs unity-backend | grep -i invite"
