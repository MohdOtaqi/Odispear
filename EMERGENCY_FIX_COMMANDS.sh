#!/bin/bash

# =====================================================
# UNITY PLATFORM - EMERGENCY FIX SCRIPT
# Fixes: Voice Chat, Missing UI Features, Backend Errors
# =====================================================

echo "🔧 Starting Emergency Fix..."
echo ""
echo "IMPORTANT: You need a Daily.co API key for voice chat!"
echo "Get it from: https://dashboard.daily.co → Developers → API Keys"
echo ""
read -p "Enter your Daily.co API key (or press Enter to skip): " DAILY_KEY

cd /var/www/Odispear/unity-platform

# 1. FIX BACKEND ENVIRONMENT
echo "📝 Updating backend environment..."

# Stop everything first
pm2 stop all
pm2 delete all

# Create proper ecosystem file with ALL environment variables
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'unity-backend',
      script: './backend/dist/index.js',
      cwd: '/var/www/Odispear/unity-platform',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        DATABASE_URL: 'postgresql://unity_app:Ayah2010@localhost:5432/unity_platform',
        JWT_SECRET: 'your-super-secret-jwt-key-change-this-in-production-$(openssl rand -hex 32)',
        REDIS_URL: 'redis://localhost:6379',
        DAILY_API_KEY: '${DAILY_KEY:-YOUR_DAILY_API_KEY_HERE}',
        DAILY_DOMAIN: 'https://odispear.daily.co',
        CORS_ORIGIN: 'https://16.171.225.46',
        FRONTEND_URL: 'https://16.171.225.46'
      },
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'unity-frontend',
      script: 'npm',
      args: 'run preview -- --port 5173 --host',
      cwd: '/var/www/Odispear/unity-platform/frontend',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
EOF

# 2. REBUILD EVERYTHING
echo "🔨 Rebuilding backend..."
cd backend
npm run build
cd ..

echo "🎨 Rebuilding frontend..."
cd frontend
npm run build
cd ..

# 3. START SERVICES
echo "🚀 Starting services..."
pm2 start ecosystem.config.js
pm2 save

# 4. CHECK STATUS
sleep 5
echo ""
echo "📊 Service Status:"
pm2 status

echo ""
echo "🧪 Testing backend..."
if curl -s http://localhost:3000/health | grep -q "ok"; then
  echo "✅ Backend is running!"
else
  echo "❌ Backend failed to start. Checking logs..."
  pm2 logs unity-backend --err --lines 20
fi

echo ""
echo "======================================"
echo "✅ Fix Applied!"
echo "======================================"
echo ""

if [ -z "$DAILY_KEY" ]; then
  echo "⚠️  WARNING: No Daily.co API key provided!"
  echo "   Voice chat will NOT work without it."
  echo ""
  echo "To add it later:"
  echo "1. Edit: nano ecosystem.config.js"
  echo "2. Find: DAILY_API_KEY: 'YOUR_DAILY_API_KEY_HERE'"
  echo "3. Replace with your actual key"
  echo "4. Save and run: pm2 restart unity-backend"
else
  echo "✅ Daily.co API key configured!"
  echo "   Voice chat should work now."
fi

echo ""
echo "🌐 Access your platform at: https://16.171.225.46"
echo ""
echo "📋 Features Available:"
echo "  • Click server name → Server Settings (manage roles, channels)"
echo "  • Click server name → Invite People (generate invite links)"
echo "  • Click avatar → Edit Profile (upload avatar/banner)"
echo "  • Click settings → Keybinds (configure mouse buttons)"
echo "  • Join voice channels (requires Daily.co key)"
echo ""
