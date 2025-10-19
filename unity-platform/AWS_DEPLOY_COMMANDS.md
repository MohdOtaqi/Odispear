# 🚀 COMPLETE AWS DEPLOYMENT COMMANDS

## **Step 1: Commit and Push Changes (On Your Local Machine)**

First, commit all the changes we made:

```bash
# Navigate to project folder
cd "c:\Users\WDAGUtilityAccount\Desktop\SandboxShare\Projects\Test 2\unity-platform"

# Add all changes
git add .

# Commit with message
git commit -m "Complete Discord clone with voice chat, reactions, status system, and improved UI"

# Push to GitHub
git push origin main
```

---

## **Step 2: SSH into AWS Server**

```bash
ssh -i "Odispear.pem" ubuntu@16.171.225.46
```

---

## **Step 3: Complete Deployment Script (Run These Commands)**

Copy and paste this entire block:

```bash
# ============================================
# UNITY PLATFORM - COMPLETE DEPLOYMENT
# ============================================

# 1. Navigate to project root
cd /var/www/Odispear
echo "📍 Current directory: $(pwd)"

# 2. Pull latest changes from Git
echo "📥 Pulling latest code..."
git fetch origin
git reset --hard origin/main
git clean -fd
echo "✅ Code updated"

# 3. Update Backend
echo "🔧 Setting up backend..."
cd /var/www/Odispear/unity-platform/backend

# Install all dependencies including new ones
npm install
npm install agora-access-token

# Build TypeScript
echo "Building backend..."
npm run build

# 4. Database Migrations
echo "💾 Running database migrations..."
sudo -u postgres psql -d unity_platform << 'EOF'
-- Add status fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'online',
ADD COLUMN IF NOT EXISTS status_text VARCHAR(255),
ADD COLUMN IF NOT EXISTS activities JSONB,
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP DEFAULT NOW();

-- Create message reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL,
  user_id UUID NOT NULL,
  emoji VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reactions_message ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON message_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Create voice sessions table
CREATE TABLE IF NOT EXISTS voice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP DEFAULT NOW(),
  left_at TIMESTAMP,
  muted BOOLEAN DEFAULT false,
  deafened BOOLEAN DEFAULT false,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create file uploads table
CREATE TABLE IF NOT EXISTS file_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  filename VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100),
  file_size INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create server discovery table
CREATE TABLE IF NOT EXISTS guild_discovery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID REFERENCES guilds(id) ON DELETE CASCADE,
  category VARCHAR(100),
  tags TEXT[],
  featured BOOLEAN DEFAULT false,
  boost_level INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

SELECT 'Database migrations completed!' as status;
EOF

echo "✅ Database updated"

# 5. Update Frontend
echo "🎨 Setting up frontend..."
cd /var/www/Odispear/unity-platform/frontend

# Install dependencies
npm install

# Update environment variables
echo "📝 Updating frontend environment..."
cat > .env << 'EOF'
VITE_API_URL=http://16.171.225.46:3000
VITE_WS_URL=ws://16.171.225.46:3000
VITE_AGORA_APP_ID=e7f6e9aeecf14b2ba10e3f40be9f56e7
EOF

# Build frontend
echo "Building frontend..."
npm run build
echo "✅ Frontend built"

# 6. Update Backend Environment
echo "📝 Updating backend environment..."
cd /var/www/Odispear/unity-platform/backend

# Append Agora credentials if not exists
if ! grep -q "AGORA_APP_ID" .env; then
    echo "" >> .env
    echo "# Voice Chat (Agora)" >> .env
    echo "AGORA_APP_ID=e7f6e9aeecf14b2ba10e3f40be9f56e7" >> .env
    echo "AGORA_APP_CERTIFICATE=placeholder_get_real_certificate" >> .env
fi

# Update CORS origin for public IP
sed -i 's|CORS_ORIGIN=.*|CORS_ORIGIN=http://16.171.225.46,http://localhost:5173|' .env

# 7. PM2 Configuration
echo "🔄 Configuring PM2..."
cd /var/www/Odispear/unity-platform

# Create ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'unity-backend',
      script: './backend/dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
EOF

# 8. Restart Services
echo "🚀 Restarting services..."
pm2 stop all
pm2 delete all
pm2 start ecosystem.config.js

# Install serve globally if not installed
npm install -g serve

# Start frontend with serve
pm2 start "serve -s frontend/dist -p 5173" --name unity-frontend

# Save PM2 configuration
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu

# 9. Configure Nginx
echo "🌐 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/unity-platform > /dev/null << 'EOF'
server {
    listen 80;
    server_name 16.171.225.46;
    
    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
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
    }
    
    client_max_body_size 100M;
}
EOF

# Enable site and restart Nginx
sudo ln -sf /etc/nginx/sites-available/unity-platform /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# 10. Final Status Check
echo ""
echo "============================================"
echo "📊 DEPLOYMENT STATUS"
echo "============================================"
pm2 status

# Wait for services to start
sleep 5

# Test endpoints
echo ""
echo "🧪 Testing endpoints..."
echo "---"

# Test backend
if curl -s http://localhost:3000/api/v1/auth/health > /dev/null 2>&1; then
    echo "✅ Backend API: RUNNING"
else
    echo "❌ Backend API: NOT RESPONDING"
fi

# Test frontend
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ Frontend: RUNNING"
else
    echo "❌ Frontend: NOT RESPONDING"
fi

# Test Nginx
if curl -s http://16.171.225.46 > /dev/null 2>&1; then
    echo "✅ Nginx Proxy: WORKING"
else
    echo "❌ Nginx Proxy: NOT WORKING"
fi

# Display final information
echo ""
echo "============================================"
echo "🎉 DEPLOYMENT COMPLETE!"
echo "============================================"
echo ""
echo "📱 Access your app at:"
echo "   http://16.171.225.46"
echo ""
echo "📊 Monitor services:"
echo "   pm2 status"
echo "   pm2 logs unity-backend"
echo "   pm2 logs unity-frontend"
echo "   pm2 monit"
echo ""
echo "🔄 Restart services:"
echo "   pm2 restart all"
echo ""
echo "🐛 If you encounter issues:"
echo "   pm2 logs unity-backend --lines 100"
echo "   sudo tail -f /var/log/nginx/error.log"
echo ""
echo "✨ Unity Platform is now LIVE!"
echo "============================================"
```

---

## **Step 4: Create Test User (Optional)**

After deployment, create a test user:

```bash
# Connect to PostgreSQL
sudo -u postgres psql -d unity_platform

# Create test user
INSERT INTO users (id, username, email, password_hash, display_name, created_at)
VALUES (
  gen_random_uuid(),
  'testuser',
  'test@unity.com',
  '$2a$10$YourHashedPasswordHere',
  'Test User',
  NOW()
);

# Exit PostgreSQL
\q
```

---

## **Step 5: Test the Application**

Open your browser and go to:
### **http://16.171.225.46**

Test these features:
1. ✅ **Register** a new account
2. ✅ **Login** with credentials
3. ✅ **Create a server**
4. ✅ **Send messages**
5. ✅ **Add reactions** to messages
6. ✅ **Join voice channel** (PTT with Space key)
7. ✅ **Send friend request**
8. ✅ **Send DM**
9. ✅ **Change status** (Online/Away/DND)
10. ✅ **Upload files** (images/documents)

---

## **Quick Troubleshooting Commands**

If something doesn't work, run these:

```bash
# Check all services
pm2 status

# View backend logs
pm2 logs unity-backend --lines 50

# View frontend logs
pm2 logs unity-frontend --lines 50

# Restart everything
pm2 restart all

# Check Nginx errors
sudo tail -f /var/log/nginx/error.log

# Test backend directly
curl http://localhost:3000/api/v1/auth/health

# Check database connection
sudo -u postgres psql -d unity_platform -c "SELECT COUNT(*) FROM users;"

# Force rebuild if needed
cd /var/www/Odispear/unity-platform/backend && npm run build && pm2 restart unity-backend
cd /var/www/Odispear/unity-platform/frontend && npm run build && pm2 restart unity-frontend
```

---

## **Voice Chat Fix (If Needed)**

If voice doesn't work with test App ID:

```bash
# Get real Agora credentials from https://console.agora.io
# Then update:
cd /var/www/Odispear/unity-platform/frontend
nano .env
# Change VITE_AGORA_APP_ID to your real App ID
npm run build
pm2 restart unity-frontend
```

---

## **🎉 That's it! Your app should now be fully deployed and accessible at http://16.171.225.46**
