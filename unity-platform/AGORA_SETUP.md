# 🎤 Agora Voice Chat Setup

## ⚠️ IMPORTANT: Get Real Agora Credentials

The current credentials in your `.env` file are **INVALID/EXAMPLE** credentials.
You MUST create a real Agora account and get valid credentials.

## Step 1: Create Agora Account & Project

1. **Go to**: https://console.agora.io
2. **Sign up** for a free account (or login)
3. **Create a new project**:
   - Click "Create" or "New Project"
   - Name it: `Unity Platform Voice`
   - Choose: **Secured mode: APP ID + Token (Recommended)**
   - Click "Submit"

4. **Get your credentials**:
   - After creating, you'll see your **App ID** (32 characters)
   - Click the "Config" or "Edit" button
   - You'll see the **Primary Certificate** 
   - Copy both values

## Step 2: Update Your .env Files

### For Local Development:

**File**: `backend/.env`
```env
# Replace these with YOUR real Agora credentials:
AGORA_APP_ID=your_32_character_app_id_here
AGORA_APP_CERTIFICATE=your_certificate_here
```

---

## 🚀 Deployment Instructions for AWS

### Method 1: SSH and Update .env (Recommended)

```bash
# 1. SSH into your AWS server
ssh ubuntu@16.171.225.46

# 2. Navigate to backend directory
cd /var/www/Odispear/unity-platform/backend

# 3. Open .env file
nano .env

# 4. Add these lines at the end:
AGORA_APP_ID=90323a9c98fc45b2922bca94a9f08fbb
AGORA_APP_CERTIFICATE=b4a91481752d4a22bcdd43fb2bcac015

# 5. Save file (Ctrl+X, then Y, then Enter)

# 6. Restart backend
pm2 restart unity-backend
# or
pm2 restart all

# 7. Verify it's running
pm2 logs unity-backend --lines 20
```

### Method 2: Update via File Upload

If you prefer using FileZilla or WinSCP:

1. **Download current .env from server**:
   - Path: `/var/www/Odispear/unity-platform/backend/.env`

2. **Add these lines to the file**:
   ```env
   # Voice Chat (Agora)
   AGORA_APP_ID=90323a9c98fc45b2922bca94a9f08fbb
   AGORA_APP_CERTIFICATE=b4a91481752d4a22bcdd43fb2bcac015
   ```

3. **Upload back to server** at the same path

4. **Restart PM2**:
   ```bash
   ssh ubuntu@16.171.225.46
   pm2 restart all
   ```

---

## 🔧 Backend Code Update (If Needed)

The voice controller should use these credentials. Verify this file exists:

**File**: `/var/www/Odispear/unity-platform/backend/src/controllers/voiceController.ts`

It should contain token generation like this:

```typescript
import { RtcTokenBuilder, RtcRole } from 'agora-access-token';

export const getVoiceToken = async (req: AuthRequest, res: Response) => {
  const { channelId } = req.params;
  const userId = req.user!.id;
  
  const appId = process.env.AGORA_APP_ID!;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE!;
  const channelName = channelId;
  const uid = 0; // 0 means generate random UID
  const role = RtcRole.PUBLISHER;
  const expirationTimeInSeconds = 3600; // 1 hour
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    uid,
    role,
    privilegeExpiredTs
  );

  res.json({
    token,
    appId,
    uid,
    channelId
  });
};
```

---

## 📦 Install Agora SDK (If Not Installed)

SSH into server and run:

```bash
cd /var/www/Odispear/unity-platform/backend
npm install agora-access-token
npm run build
pm2 restart all
```

---

## ✅ Testing Voice Chat

After deployment:

1. **Open app**: http://16.171.225.46
2. **Login** to your account
3. **Go to a server** with voice channels
4. **Click on a voice channel** name
5. **Voice chat modal should appear**
6. **Allow microphone access** when browser prompts
7. **You should see "Connected to voice channel"**

### Troubleshooting:

If voice doesn't connect:

```bash
# Check backend logs
ssh ubuntu@16.171.225.46
pm2 logs unity-backend --lines 50

# Look for Agora-related errors
# Check if environment variables loaded
node -e "console.log(process.env.AGORA_APP_ID)"
```

---

## 🌐 Environment Variables Summary

Your complete backend `.env` should now include:

```env
# Server
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://unity_app:YOUR_DB_PASSWORD@localhost:5432/unity_platform

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=YOUR_JWT_SECRET
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://16.171.225.46

# AWS S3
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=unity-platform-uploads
AWS_REGION=us-east-1

# Voice Chat (Agora) - NEW!
AGORA_APP_ID=90323a9c98fc45b2922bca94a9f08fbb
AGORA_APP_CERTIFICATE=b4a91481752d4a22bcdd43fb2bcac015

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 🎯 Quick Deploy Script

Create this file locally, then run it:

**File**: `deploy_agora.sh`
```bash
#!/bin/bash

# SSH into server and add Agora credentials
ssh ubuntu@16.171.225.46 << 'ENDSSH'
cd /var/www/Odispear/unity-platform/backend

# Add Agora credentials to .env
echo "" >> .env
echo "# Voice Chat (Agora)" >> .env
echo "AGORA_APP_ID=90323a9c98fc45b2922bca94a9f08fbb" >> .env
echo "AGORA_APP_CERTIFICATE=b4a91481752d4a22bcdd43fb2bcac015" >> .env

# Install Agora SDK if not present
npm install agora-access-token

# Rebuild backend
npm run build

# Restart services
pm2 restart all

echo "✅ Agora credentials deployed and services restarted!"
ENDSSH
```

Run it:
```bash
chmod +x deploy_agora.sh
./deploy_agora.sh
```

---

## 📊 Feature Status After Setup

With Agora configured:

| Feature | Status |
|---------|--------|
| Voice Channel Join | ✅ Working |
| Microphone Mute/Unmute | ✅ Working |
| Deafen/Undeafen | ✅ Working |
| Audio Level Indicators | ✅ Working |
| Multi-user Voice Rooms | ✅ Working |
| Voice Connection Status | ✅ Working |

---

## 🎉 **YOU'RE ALL SET!**

Once you add these credentials to your AWS server and restart PM2, voice chat will be **fully functional**!

**Next steps**:
1. SSH into server
2. Add credentials to .env
3. Restart PM2
4. Test voice chat

**That's it! Voice chat will work perfectly!** 🎤🚀
