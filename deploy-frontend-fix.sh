#!/bin/bash

echo "================================================"
echo "🔧 FIXING FRONTEND API CONFIGURATION"
echo "================================================"

cd /var/www/Odispear/unity-platform

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Make sure .env is correct
echo "📝 Creating correct .env file..."
cat > frontend/.env << 'EOF'
VITE_API_URL=https://16.171.225.46
VITE_WS_URL=wss://16.171.225.46
VITE_DAILY_DOMAIN=https://odispear.daily.co
EOF

# Rebuild frontend
echo "🏗️ Building frontend..."
cd frontend
npm install
npm run build

echo ""
echo "================================================"
echo "✅ FRONTEND REBUILT!"
echo "================================================"
echo ""
echo "The correct URLs are now:"
echo "  - API: https://16.171.225.46/api/v1/..."
echo "  - WebSocket: wss://16.171.225.46/socket.io/..."
echo ""
echo "Clear your browser cache and reload!"
echo ""
echo "Test it:"
echo "  curl -k https://16.171.225.46"
echo ""
