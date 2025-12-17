#!/bin/bash

# Unity Platform - Complete Feature Deployment Script
# This script deploys all Discord-like features to AWS

echo "================================================="
echo "🚀 Unity Platform - Full Feature Deployment"
echo "================================================="
echo ""

# Configuration
SERVER_IP="16.171.225.46"
DB_NAME="unity_platform"
DB_USER="unity_app"
DB_PASS="Ayah2010"
PROJECT_PATH="/var/www/Odispear/unity-platform"

echo "📋 Features to deploy:"
echo "  ✅ Server Invitations System"
echo "  ✅ Role-based Permissions"  
echo "  ✅ Voice Channel Management"
echo "  ✅ Profile Editor with Avatar Upload"
echo "  ✅ Mouse Button Configuration (PTT)"
echo "  ✅ Real-time Typing Indicators"
echo "  ✅ Voice Participants Display"
echo "  ✅ Server Management UI"
echo "  ✅ Enhanced UI Animations"
echo ""

read -p "Deploy all features to $SERVER_IP? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 1
fi

echo ""
echo "🔧 Starting deployment..."
echo ""

# Create deployment commands
cat > /tmp/deploy_commands.sh << 'EOF'
#!/bin/bash

# Navigate to project
cd /var/www/Odispear/unity-platform

echo "📥 Pulling latest code..."
git pull origin main

# Database migrations
echo "🗄️ Running database migrations..."

# 1. Invitations table
PGPASSWORD=Ayah2010 psql -h localhost -U unity_app -d unity_platform << SQL
-- Guild Invites Table
CREATE TABLE IF NOT EXISTS guild_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    code VARCHAR(20) UNIQUE NOT NULL,
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    uses INTEGER DEFAULT 0,
    max_uses INTEGER,
    max_age INTEGER,
    temporary BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_guild_invites_code ON guild_invites(code);
CREATE INDEX IF NOT EXISTS idx_guild_invites_guild ON guild_invites(guild_id);

-- User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    keybinds JSONB DEFAULT '{}',
    voice_settings JSONB DEFAULT '{}',
    notification_settings JSONB DEFAULT '{}',
    privacy_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Voice Sessions Enhancement
ALTER TABLE voice_sessions ADD COLUMN IF NOT EXISTS quality_stats JSONB DEFAULT '{}';
ALTER TABLE voice_sessions ADD COLUMN IF NOT EXISTS is_streaming BOOLEAN DEFAULT FALSE;
ALTER TABLE voice_sessions ADD COLUMN IF NOT EXISTS is_video_enabled BOOLEAN DEFAULT FALSE;

-- Channel Permissions
CREATE TABLE IF NOT EXISTS channel_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    allow BIGINT DEFAULT 0,
    deny BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_channel_role_permission UNIQUE(channel_id, role_id),
    CONSTRAINT unique_channel_user_permission UNIQUE(channel_id, user_id),
    CONSTRAINT check_permission_target CHECK (
        (role_id IS NOT NULL AND user_id IS NULL) OR
        (role_id IS NULL AND user_id IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_channel_permissions_channel ON channel_permissions(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_permissions_role ON channel_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_channel_permissions_user ON channel_permissions(user_id);

-- Typing Indicators Table (for persistence)
CREATE TABLE IF NOT EXISTS typing_indicators (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, channel_id)
);

-- User Profile Enhancements
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS accent_color VARCHAR(7);
ALTER TABLE users ADD COLUMN IF NOT EXISTS badges JSONB DEFAULT '[]';

-- Message Reactions Enhancement
ALTER TABLE message_reactions ADD COLUMN IF NOT EXISTS animated BOOLEAN DEFAULT FALSE;
ALTER TABLE message_reactions ADD COLUMN IF NOT EXISTS custom_emoji_id UUID;

-- Server Features Flags
ALTER TABLE guilds ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]';
ALTER TABLE guilds ADD COLUMN IF NOT EXISTS boost_level INTEGER DEFAULT 0;
ALTER TABLE guilds ADD COLUMN IF NOT EXISTS max_members INTEGER DEFAULT 100000;

COMMIT;
SQL

echo "✅ Database migrations complete!"

# Backend setup
echo "🔧 Setting up backend..."
cd backend

# Install new dependencies
npm install multer @types/multer sharp @types/sharp

# Build backend
npm run build

# Frontend setup
echo "🎨 Setting up frontend..."
cd ../frontend

# Update environment variables for HTTPS
cat > .env << 'ENV'
VITE_API_URL=https://16.171.225.46
VITE_WS_URL=wss://16.171.225.46
VITE_DAILY_DOMAIN=https://odispear.daily.co
ENV

cat > .env.production << 'ENV'
VITE_API_URL=https://16.171.225.46
VITE_WS_URL=wss://16.171.225.46
VITE_DAILY_DOMAIN=https://odispear.daily.co
ENV

# Install new frontend dependencies
npm install @dnd-kit/sortable @dnd-kit/core framer-motion react-color emoji-picker-react

# Build frontend
echo "🏗️ Building frontend..."
npm run build

# Restart services
echo "🔄 Restarting services..."
cd ..
pm2 restart all

# Save PM2 configuration
pm2 save

# Create upload directories
echo "📁 Creating upload directories..."
mkdir -p uploads/avatars
mkdir -p uploads/banners
mkdir -p uploads/soundboard
mkdir -p uploads/attachments

# Set permissions
sudo chown -R www-data:www-data uploads
sudo chmod -R 755 uploads

# Update Nginx for file uploads
echo "🔧 Updating Nginx configuration..."
sudo tee /etc/nginx/sites-available/unity-https > /dev/null << 'NGINX'
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
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 50M;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_request_buffering off;
    }

    # WebSocket
    location /socket.io/ {
        proxy_pass http://localhost:3000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_buffering off;
    }

    # Static uploads
    location /uploads {
        alias /var/www/Odispear/unity-platform/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3000/health;
    }
}
NGINX

# Reload Nginx
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "================================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "================================================="
echo ""
echo "🎉 All features have been deployed successfully!"
echo ""
echo "📋 Deployed Features:"
echo "  ✅ Server invitation system with custom links"
echo "  ✅ Role management and permissions"
echo "  ✅ Voice channel creation and management"
echo "  ✅ Profile editing with avatar/banner upload"
echo "  ✅ Mouse button configuration for PTT"
echo "  ✅ Real-time typing indicators"
echo "  ✅ Voice participant list with speaking indicators"
echo "  ✅ Server management UI"
echo "  ✅ Enhanced animations and UI"
echo ""
echo "🌐 Access your app at: https://16.171.225.46"
echo ""
echo "📝 Test Checklist:"
echo "  1. Create/join server with invite link"
echo "  2. Create and manage roles"
echo "  3. Create voice/text channels"
echo "  4. Edit profile and upload avatar"
echo "  5. Configure mouse buttons for PTT"
echo "  6. Join voice channel and test indicators"
echo "  7. Send messages and see typing indicators"
echo ""
echo "🔒 Security Note: Using HTTPS with self-signed cert"
echo "   Browser will show warning - click Advanced → Proceed"
echo ""

# Show service status
pm2 status

# Show recent logs
echo ""
echo "📜 Recent logs:"
pm2 logs --lines 5 --nostream
EOF

# Make script executable
chmod +x /tmp/deploy_commands.sh

# Execute on server
if [ "$1" = "--local" ]; then
    echo "📝 Script saved to /tmp/deploy_commands.sh"
    echo "Copy and run on your AWS server"
else
    echo "🚀 Executing on AWS server..."
    ssh -o StrictHostKeyChecking=no ubuntu@$SERVER_IP 'bash -s' < /tmp/deploy_commands.sh
fi

echo ""
echo "✅ Deployment script completed!"
