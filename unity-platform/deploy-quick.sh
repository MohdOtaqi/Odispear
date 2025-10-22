#!/bin/bash

# Quick Deployment Script for Unity Platform on AWS
# Path: /var/www/Odispear/unity-platform

set -e

echo "🚀 Unity Platform - Quick Deployment"
echo "===================================="

cd /var/www/Odispear/unity-platform

# Step 1: Pull latest code
echo "📥 Pulling latest changes from GitHub..."
git pull origin main

# Step 2: Install backend dependencies (if needed)
echo "📦 Installing backend dependencies..."
cd backend
npm install --production

# Step 3: Build backend
echo "🔨 Building backend..."
npm run build

# Step 4: Install frontend dependencies (if needed)
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install --production

# Step 5: Build frontend
echo "🔨 Building frontend..."
npm run build

# Step 6: Restart services with PM2
echo "🔄 Restarting services..."
cd ..
pm2 restart unity-backend
pm2 restart unity-frontend

# Step 7: Save PM2 configuration
pm2 save

echo ""
echo "✅ Deployment Complete!"
echo "===================================="
echo "📊 Checking status..."
pm2 status

echo ""
echo "📋 View logs with:"
echo "  pm2 logs unity-backend --lines 30"
echo "  pm2 logs unity-backend | grep -i 'daily'"
echo "  pm2 logs unity-backend | grep -i 'room'"
