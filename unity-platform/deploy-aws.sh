#!/bin/bash

# Unity Platform AWS Deployment Script
echo "🚀 Starting Unity Platform Deployment..."

cd /var/www/Odispear/unity-platform || exit 1

# Pull latest code
git pull origin main || echo "Using local files"

# Backend
cd backend
npm install
npm run build

# Database migrations
sudo -u postgres psql -d unity_platform << 'EOF'
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'online';
ALTER TABLE users ADD COLUMN IF NOT EXISTS status_text VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS activities JSONB;

CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_reactions_message ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON message_reactions(user_id);
EOF

# Frontend
cd ../frontend
npm install
npm run build

# Restart services
cd ..
pm2 restart all

echo "✅ Deployment complete!"
pm2 status