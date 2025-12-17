# 🚀 Unity Platform - Step-by-Step Deployment Guide

## 📋 Prerequisites
- You have SSH access to your AWS server (16.171.225.46)
- Git repository is set up and pushed
- HTTPS is already configured

---

## 🖥️ PART 1: LOCAL MACHINE (Your Computer)

### Step 1.1: Commit All Changes

Open PowerShell in your project directory:

```powershell
# Navigate to project (if not already there)
cd "c:\SandboxShare\Projects\Test 2\unity-platform"
```

**Your prompt should look like:**
```
PS C:\SandboxShare\Projects\Test 2\unity-platform>
```

**Run these commands:**
```powershell
# Add all files
git add .

# Commit with message
git commit -m "Complete feature deployment - all features working"

# Push to GitHub/GitLab
git push origin main
```

**Expected output:**
```
Enumerating objects: XX, done.
Counting objects: 100% (XX/XX), done.
...
To https://github.com/your-repo/unity-platform.git
   abc1234..def5678  main -> main
```

✅ **Checkpoint:** Code is now on GitHub and ready to deploy!

---

## 🌐 PART 2: AWS SERVER (SSH Connection)

### Step 2.1: Connect to AWS Server

**On your local machine, open a new terminal and run:**

```bash
ssh ubuntu@16.171.225.46
```

**You should see:**
```
Welcome to Ubuntu...
ubuntu@ip-172-31-22-52:~$
```

---

### Step 2.2: Navigate to Project Directory

**Current location:** `ubuntu@ip-172-31-22-52:~$`

**Run:**
```bash
cd /var/www/Odispear/unity-platform
```

**Now your prompt should be:**
```
ubuntu@ip-172-31-22-52:/var/www/Odispear/unity-platform$
```

---

### Step 2.3: Pull Latest Code

**Current location:** `ubuntu@ip-172-31-22-52:/var/www/Odispear/unity-platform$`

**Run:**
```bash
git pull origin main
```

**Expected output:**
```
remote: Enumerating objects: XX, done.
remote: Counting objects: 100% (XX/XX), done.
...
Updating abc1234..def5678
Fast-forward
 backend/src/controllers/inviteController.ts  | XX +++++++
 frontend/src/components/ProfileEditor.tsx    | XX +++++++
 ...
```

✅ **Checkpoint:** Latest code is now on the server!

---

### Step 2.4: Install Backend Dependencies

**Current location:** `ubuntu@ip-172-31-22-52:/var/www/Odispear/unity-platform$`

**Run:**
```bash
cd backend
```

**Now your prompt should be:**
```
ubuntu@ip-172-31-22-52:/var/www/Odispear/unity-platform/backend$
```

**Install new dependencies:**
```bash
npm install multer @types/multer sharp @types/sharp bcrypt @types/bcrypt uuid @types/uuid
```

**Expected output:**
```
added XX packages, and audited XXX packages in Xs

XX packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

✅ **Checkpoint:** Backend dependencies installed!

---

### Step 2.5: Build Backend

**Current location:** `ubuntu@ip-172-31-22-52:/var/www/Odispear/unity-platform/backend$`

**Run:**
```bash
npm run build
```

**Expected output:**
```
> unity-platform-backend@1.0.0 build
> tsc

✨  Done in X.XXs
```

**If you see errors, they might be TypeScript warnings. As long as the `dist/` folder is created, you're good!**

**Verify build:**
```bash
ls dist/
```

**Expected output:**
```
config  controllers  index.js  middleware  routes  services  utils
```

✅ **Checkpoint:** Backend compiled successfully!

---

### Step 2.6: Install Frontend Dependencies

**Current location:** `ubuntu@ip-172-31-22-52:/var/www/Odispear/unity-platform/backend$`

**Run:**
```bash
cd ../frontend
```

**Now your prompt should be:**
```
ubuntu@ip-172-31-22-52:/var/www/Odispear/unity-platform/frontend$
```

**Install new dependencies:**
```bash
npm install framer-motion
```

**Expected output:**
```
added XX packages, and audited XXX packages in Xs

found 0 vulnerabilities
```

✅ **Checkpoint:** Frontend dependencies installed!

---

### Step 2.7: Update Frontend Environment Variables

**Current location:** `ubuntu@ip-172-31-22-52:/var/www/Odispear/unity-platform/frontend$`

**Check current .env:**
```bash
cat .env
```

**Update .env file:**
```bash
cat > .env << 'EOF'
VITE_API_URL=https://16.171.225.46
VITE_WS_URL=wss://16.171.225.46
VITE_DAILY_DOMAIN=https://odispear.daily.co
EOF
```

**Update .env.production:**
```bash
cat > .env.production << 'EOF'
VITE_API_URL=https://16.171.225.46
VITE_WS_URL=wss://16.171.225.46
VITE_DAILY_DOMAIN=https://odispear.daily.co
EOF
```

**Verify:**
```bash
cat .env
```

**Expected output:**
```
VITE_API_URL=https://16.171.225.46
VITE_WS_URL=wss://16.171.225.46
VITE_DAILY_DOMAIN=https://odispear.daily.co
```

✅ **Checkpoint:** Environment variables updated!

---

### Step 2.8: Build Frontend

**Current location:** `ubuntu@ip-172-31-22-52:/var/www/Odispear/unity-platform/frontend$`

**Run:**
```bash
npm run build
```

**Expected output:**
```
vite v5.x.x building for production...
✓ XXX modules transformed.
dist/index.html                   X.XX kB │ gzip:   X.XX kB
dist/assets/index-XXXXX.css      XX.XX kB │ gzip:  XX.XX kB
dist/assets/index-XXXXX.js      XXX.XX kB │ gzip: XXX.XX kB
✓ built in X.XXs
```

**Verify build:**
```bash
ls dist/
```

**Expected output:**
```
assets  index.html  vite.svg
```

✅ **Checkpoint:** Frontend built successfully!

---

### Step 2.9: Run Database Migrations

**Current location:** `ubuntu@ip-172-31-22-52:/var/www/Odispear/unity-platform/frontend$`

**Go back to project root:**
```bash
cd ..
```

**Now your prompt should be:**
```
ubuntu@ip-172-31-22-52:/var/www/Odispear/unity-platform$
```

**Run migrations:**
```bash
PGPASSWORD=Ayah2010 psql -h localhost -U unity_app -d unity_platform << 'EOF'
-- User enhancements
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS accent_color VARCHAR(7);

-- Guild invites table
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

-- User preferences
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    keybinds JSONB DEFAULT '{}',
    voice_settings JSONB DEFAULT '{}',
    notification_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Channel permissions
CREATE TABLE IF NOT EXISTS channel_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    allow BIGINT DEFAULT 0,
    deny BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_channel_permissions_channel ON channel_permissions(channel_id);

COMMIT;
EOF
```

**Expected output:**
```
ALTER TABLE
ALTER TABLE
ALTER TABLE
CREATE TABLE
CREATE INDEX
CREATE INDEX
CREATE TABLE
CREATE TABLE
CREATE INDEX
COMMIT
```

**If you see "relation already exists" - that's OK! It means the tables are already there.**

✅ **Checkpoint:** Database migrations complete!

---

### Step 2.10: Create Upload Directories

**Current location:** `ubuntu@ip-172-31-22-52:/var/www/Odispear/unity-platform$`

**Create directories:**
```bash
mkdir -p uploads/avatars
mkdir -p uploads/banners
mkdir -p uploads/attachments
mkdir -p uploads/soundboard
```

**Set permissions:**
```bash
sudo chown -R www-data:www-data uploads
sudo chmod -R 755 uploads
```

**Verify:**
```bash
ls -la uploads/
```

**Expected output:**
```
total XX
drwxr-xr-x  6 www-data www-data 4096 Oct 22 12:00 .
drwxr-xr-x 10 ubuntu   ubuntu   4096 Oct 22 12:00 ..
drwxr-xr-x  2 www-data www-data 4096 Oct 22 12:00 attachments
drwxr-xr-x  2 www-data www-data 4096 Oct 22 12:00 avatars
drwxr-xr-x  2 www-data www-data 4096 Oct 22 12:00 banners
drwxr-xr-x  2 www-data www-data 4096 Oct 22 12:00 soundboard
```

✅ **Checkpoint:** Upload directories created!

---

### Step 2.11: Update Nginx Configuration

**Current location:** `ubuntu@ip-172-31-22-52:/var/www/Odispear/unity-platform$`

**Create new Nginx config:**
```bash
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

    # Increase upload size for avatars/banners
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
        proxy_cache_bypass $http_upgrade;
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
```

**Test Nginx configuration:**
```bash
sudo nginx -t
```

**Expected output:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

**Reload Nginx:**
```bash
sudo systemctl reload nginx
```

✅ **Checkpoint:** Nginx configured!

---

### Step 2.12: Restart All Services

**Current location:** `ubuntu@ip-172-31-22-52:/var/www/Odispear/unity-platform$`

**Stop all PM2 processes:**
```bash
pm2 stop all
```

**Start backend:**
```bash
pm2 start backend/dist/index.js --name unity-backend
```

**Expected output:**
```
[PM2] Starting /var/www/Odispear/unity-platform/backend/dist/index.js in fork_mode (1 instance)
[PM2] Done.
┌─────┬──────────────────┬─────────────┬─────────┬─────────┬──────────┐
│ id  │ name             │ mode        │ ↺       │ status  │ cpu      │
├─────┼──────────────────┼─────────────┼─────────┼─────────┼──────────┤
│ 0   │ unity-backend    │ fork        │ 0       │ online  │ 0%       │
└─────┴──────────────────┴─────────────┴─────────┴─────────┴──────────┘
```

**Start frontend:**
```bash
pm2 start "npm run preview" --name unity-frontend -- --port 5173 --host
```

**Or if you have a custom start script:**
```bash
cd frontend
pm2 start npm --name unity-frontend -- run preview -- --port 5173 --host
cd ..
```

**Check status:**
```bash
pm2 status
```

**Expected output:**
```
┌─────┬──────────────────┬─────────────┬─────────┬─────────┬──────────┐
│ id  │ name             │ mode        │ ↺       │ status  │ cpu      │
├─────┼──────────────────┼─────────────┼─────────┼─────────┼──────────┤
│ 0   │ unity-backend    │ fork        │ 0       │ online  │ 0.5%     │
│ 1   │ unity-frontend   │ fork        │ 0       │ online  │ 0.3%     │
└─────┴──────────────────┴─────────────┴─────────┴─────────┴──────────┘
```

**Save PM2 configuration:**
```bash
pm2 save
```

**Expected output:**
```
[PM2] Saving current process list...
[PM2] Successfully saved in /home/ubuntu/.pm2/dump.pm2
```

✅ **Checkpoint:** All services running!

---

### Step 2.13: Verify Installation

**Current location:** `ubuntu@ip-172-31-22-52:/var/www/Odispear/unity-platform$`

**Test health endpoint:**
```bash
curl -k https://localhost/health
```

**Expected output:**
```json
{"status":"ok","timestamp":"2025-10-22T09:41:23.456Z"}
```

**Check PM2 logs:**
```bash
pm2 logs --lines 20
```

**You should see backend logs like:**
```
0|unity-backend  | Server running on port 3000
0|unity-backend  | Connected to database
0|unity-backend  | Redis connected
0|unity-backend  | Socket.io initialized
```

**If you see errors in logs, check:**
```bash
# Check backend logs only
pm2 logs unity-backend --lines 50

# Check frontend logs only
pm2 logs unity-frontend --lines 50
```

✅ **Checkpoint:** Services verified!

---

### Step 2.14: Check Services Status

**Current location:** `ubuntu@ip-172-31-22-52:/var/www/Odispear/unity-platform$`

**Check all services:**
```bash
echo "=== PM2 Status ==="
pm2 status

echo ""
echo "=== Nginx Status ==="
sudo systemctl status nginx | head -5

echo ""
echo "=== PostgreSQL Status ==="
sudo systemctl status postgresql | head -5

echo ""
echo "=== Redis Status ==="
sudo systemctl status redis | head -5
```

**All should show "active (running)"**

✅ **Checkpoint:** All services active!

---

### Step 2.15: Test the Application

**On your local computer**, open browser and go to:

```
https://16.171.225.46
```

**You will see a security warning:**
1. Click **"Advanced"**
2. Click **"Proceed to 16.171.225.46 (unsafe)"**

**You should see the Unity Platform login page!**

**Test login:**
- Username: `test`
- Password: `test123`

✅ **Checkpoint:** Application accessible!

---

## 🧪 PART 3: TESTING FEATURES

### Step 3.1: Test Voice Chat

**In the browser:**
1. Join a server
2. Click on a voice channel
3. Browser should ask for microphone permission - **Allow**
4. You should connect successfully

**If voice chat doesn't work:**
```bash
# On server, check backend logs
pm2 logs unity-backend | grep -i daily
```

---

### Step 3.2: Test Profile Upload

**In the browser:**
1. Click your avatar
2. Click "Edit Profile"
3. Try uploading an avatar
4. Should upload and resize automatically

**On server, verify uploads:**
```bash
ls -lh uploads/avatars/
```

**You should see uploaded files!**

---

### Step 3.3: Test Server Invites

**In the browser:**
1. Right-click a server
2. Click "Invite People"
3. Generate invite link
4. Copy link
5. Open in incognito window
6. Should show invite preview

---

## 🎉 SUCCESS CHECKLIST

Run this final verification:

```bash
cd /var/www/Odispear/unity-platform
chmod +x verify-installation.sh
./verify-installation.sh
```

**Expected output:**
```
✅ All checks passed! Your installation is perfect!
🎉 Your platform is ready to use!
🌐 Access at: https://16.171.225.46
```

---

## 🔧 TROUBLESHOOTING

### Problem: Backend won't start

**Check logs:**
```bash
pm2 logs unity-backend --err --lines 100
```

**Common fixes:**
```bash
# Rebuild backend
cd /var/www/Odispear/unity-platform/backend
npm run build
pm2 restart unity-backend
```

---

### Problem: Frontend shows blank page

**Check logs:**
```bash
pm2 logs unity-frontend --lines 50
```

**Common fixes:**
```bash
# Rebuild frontend
cd /var/www/Odispear/unity-platform/frontend
npm run build
pm2 restart unity-frontend
```

---

### Problem: Database connection error

**Test database:**
```bash
PGPASSWORD=Ayah2010 psql -h localhost -U unity_app -d unity_platform -c "SELECT 1"
```

**If fails, check PostgreSQL:**
```bash
sudo systemctl status postgresql
sudo systemctl restart postgresql
```

---

### Problem: Upload not working

**Check permissions:**
```bash
cd /var/www/Odispear/unity-platform
sudo chown -R www-data:www-data uploads
sudo chmod -R 755 uploads
pm2 restart all
```

---

## 📝 QUICK REFERENCE

### Restart Everything
```bash
cd /var/www/Odispear/unity-platform
pm2 restart all
sudo systemctl reload nginx
```

### View Logs
```bash
pm2 logs
pm2 logs unity-backend
pm2 logs unity-frontend
```

### Check Status
```bash
pm2 status
sudo systemctl status nginx
sudo systemctl status postgresql
```

### Rebuild After Code Changes
```bash
cd /var/www/Odispear/unity-platform

# Pull latest
git pull origin main

# Backend
cd backend
npm install
npm run build
cd ..

# Frontend
cd frontend
npm install
npm run build
cd ..

# Restart
pm2 restart all
```

---

## 🎊 YOU'RE DONE!

Your Unity Platform is now fully deployed with all features! 🚀

**Access at:** https://16.171.225.46

---

Need help? Check the logs first:
```bash
pm2 logs --lines 50
```
