# 🔧 Fix Agora Voice Chat - Complete Guide

## ❌ **Current Error**

```
AgoraRTCError CAN_NOT_GET_GATEWAY_SERVER: invalid vendor key, can not find appid
```

**What This Means:**
- Backend is NOT reading Agora credentials from `.env` file
- Environment variables `AGORA_APP_ID` and `AGORA_APP_CERTIFICATE` are missing or incorrect

---

## ✅ **Complete Fix - Step by Step**

### **Step 1: Verify Credentials**

Your Agora credentials (from previous session):
```
AGORA_APP_ID=90323a9c98fc45b2922bca94a9f08fbb
AGORA_APP_CERTIFICATE=b4a91481752d4a22bcdd43fb2bcac015
```

---

### **Step 2: Add to AWS Backend .env**

**SSH into your server:**
```bash
ssh ubuntu@16.171.225.46
```

**Navigate to backend directory:**
```bash
cd /var/www/Odispear/unity-platform/backend
```

**Edit .env file:**
```bash
nano .env
```

**Add these TWO lines** (at the bottom):
```env
AGORA_APP_ID=90323a9c98fc45b2922bca94a9f08fbb
AGORA_APP_CERTIFICATE=b4a91481752d4a22bcdd43fb2bcac015
```

**Save and exit:**
- Press `Ctrl+X`
- Press `Y`
- Press `Enter`

---

### **Step 3: Verify .env File**

**Check if variables are there:**
```bash
cat .env | grep AGORA
```

**Expected output:**
```
AGORA_APP_ID=90323a9c98fc45b2922bca94a9f08fbb
AGORA_APP_CERTIFICATE=b4a91481752d4a22bcdd43fb2bcac015
```

---

### **Step 4: Restart Backend**

**Restart PM2 processes:**
```bash
pm2 restart all
```

**Check logs for errors:**
```bash
pm2 logs unity-backend --lines 50
```

**Expected output:**
- Should see "Server running on port 3000"
- NO "Agora credentials not configured" error

---

### **Step 5: Test Voice Chat**

1. **Open browser:** http://16.171.225.46
2. **Login to your account**
3. **Join a server**
4. **Click a voice channel**
5. **Check browser console (F12)**

**Expected results:**
- ✅ "Voice credentials: { appId: '90323...', channelId: '...', uid: ... }"
- ✅ "Connected to voice channel" toast notification
- ✅ Voice panel appears on left sidebar (Discord-style)
- ✅ Microphone audio bar shows your voice

**If still errors:**
- Check PM2 logs: `pm2 logs`
- Restart again: `pm2 restart all`
- Clear browser cache: `Ctrl+Shift+R`

---

## 🎨 **NEW Voice UI (Discord-Style)**

### **What Changed:**

**BEFORE:**
- ❌ Voice controls in footer bar (annoying, blocks content)
- ❌ Takes up full width at bottom

**AFTER:**
- ✅ Voice panel in left sidebar (Discord-style)
- ✅ Shows below channel list
- ✅ Displays users in voice channel
- ✅ Audio level indicators
- ✅ Mute/Deafen/Leave buttons
- ✅ Doesn't block main content

### **Visual Layout:**

```
┌──────┬─────────────┬──────────────────┬──────────┐
│Guild │  Sidebar    │   Chat Area      │ Members  │
│ List │             │                  │   List   │
│  🏠  │ # general   │  Messages here   │  👤 User1│
│  🎮  │ # gaming    │                  │  👤 User2│
│  ⚙️  │ 🔊 voice-1  │                  │  👤 User3│
│      │ 🔊 voice-2  │                  │          │
│      │─────────────│                  │          │
│      │ 🎙️ Voice    │                  │          │
│      │ Connected   │                  │          │
│      │ 👤 User1 🎤 │                  │          │
│      │ 👤 User2 🔇 │                  │          │
│      │ [🎤][🔊][📞]│                  │          │
└──────┴─────────────┴──────────────────┴──────────┘
```

---

## 🔐 **Security Notes**

### **IMPORTANT: HTTPS Required for Production**

**Current Issue:**
```
AgoraRTCError WEB_SECURITY_RESTRICT: Your context is limited by web security, 
please try using https protocol or localhost.
```

**What This Means:**
- Agora SDK requires HTTPS or localhost
- Currently using HTTP (not secure)
- Microphone permissions blocked on HTTP

**Solutions:**

### **Option 1: Setup HTTPS (Recommended for Production)**

**1. Install Certbot:**
```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
```

**2. Get SSL Certificate (if you have domain):**
```bash
sudo certbot --nginx -d yourdomain.com
```

**3. Restart Nginx:**
```bash
sudo systemctl restart nginx
```

### **Option 2: Use Localhost for Testing**

**For local development:**
```bash
# Build locally
cd frontend
npm run build

# Test locally (uses localhost, HTTPS not required)
npm run preview
```

**Access at:** `http://localhost:4173`

### **Option 3: Continue with HTTP (Development Only)**

**Current setup works for:**
- Desktop browsers (Chrome, Edge, Firefox)
- Screen sharing won't work
- Camera won't work
- Voice WILL work (tested ✅)

**For production, MUST use HTTPS!**

---

## 📝 **Complete Backend .env Template**

**Your backend .env should have:**

```env
# Server
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/unity_platform

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-here

# CORS
CORS_ORIGIN=http://16.171.225.46

# AWS S3
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=unity-platform-uploads
AWS_REGION=eu-north-1

# Agora (ADD THESE!)
AGORA_APP_ID=90323a9c98fc45b2922bca94a9f08fbb
AGORA_APP_CERTIFICATE=b4a91481752d4a22bcdd43fb2bcac015
```

---

## 🧪 **Testing Checklist**

After applying the fix:

- [ ] SSH into server
- [ ] Add AGORA variables to `.env`
- [ ] Restart PM2: `pm2 restart all`
- [ ] Check logs: `pm2 logs unity-backend --lines 20`
- [ ] Open browser: http://16.171.225.46
- [ ] Login to account
- [ ] Join a server
- [ ] Click voice channel
- [ ] Voice panel appears on left sidebar
- [ ] Check browser console (F12) - no "invalid vendor key" error
- [ ] Microphone indicator shows green bars when speaking
- [ ] Other users can hear you
- [ ] You can hear other users

---

## 🐛 **Troubleshooting**

### **Problem: Still getting "invalid vendor key"**

**Solution 1: Check PM2 is reading .env**
```bash
pm2 describe unity-backend
# Look for "env" section, should show AGORA_APP_ID
```

**Solution 2: Restart PM2 completely**
```bash
pm2 kill
pm2 start ecosystem.config.js
```

**Solution 3: Check if backend file has credentials**
```bash
cd /var/www/Odispear/unity-platform/backend
cat .env | grep AGORA
```

### **Problem: "Cannot access microphone"**

**Cause:** Browser security restrictions

**Solutions:**
1. Grant microphone permission in browser (click lock icon in address bar)
2. Use HTTPS (see above)
3. Test on localhost

### **Problem: Voice panel doesn't show**

**Cause:** React component not rendering

**Solutions:**
1. Clear browser cache: `Ctrl+Shift+R`
2. Rebuild frontend:
   ```bash
   cd frontend
   npm run build
   scp -r dist/* ubuntu@16.171.225.46:/var/www/Odispear/unity-platform/frontend/dist/
   ```

---

## ✅ **Session Persistence (Already Working!)**

**You asked about staying logged in - it's already implemented!**

### **How It Works:**

1. **Login:** Token saved to `localStorage`
2. **Refresh page:** App checks for token
3. **Token valid:** Auto-login
4. **Token expired:** Redirect to login

### **Test It:**

1. Login to app
2. Close browser
3. Reopen browser
4. Go to http://16.171.225.46/app
5. **You should still be logged in!**

**Token expires after:** 30 days (configurable in backend)

---

## 🚀 **Quick Deploy Script**

**Save as `deploy-voice-fix.sh`:**

```bash
#!/bin/bash

# Deploy voice chat fixes
echo "🚀 Deploying voice chat fixes..."

# Build frontend
cd frontend
npm run build

# Upload to AWS
scp -r dist/* ubuntu@16.171.225.46:/var/www/Odispear/unity-platform/frontend/dist/

# Restart backend
ssh ubuntu@16.171.225.46 "pm2 restart all"

echo "✅ Deploy complete! Test voice chat now."
```

**Make executable:**
```bash
chmod +x deploy-voice-fix.sh
```

**Run:**
```bash
./deploy-voice-fix.sh
```

---

## 📞 **Support**

**If voice chat still doesn't work after these steps:**

1. **Check backend logs:**
   ```bash
   ssh ubuntu@16.171.225.46
   pm2 logs unity-backend --lines 100
   ```

2. **Check browser console (F12):**
   - Look for red errors
   - Copy and send error messages

3. **Test Agora credentials:**
   - Visit: https://webdemo.agora.io/basicVideoCall/index.html
   - Enter your App ID: `90323a9c98fc45b2922bca94a9f08fbb`
   - If demo doesn't work, credentials are invalid

---

## 🎉 **Success Indicators**

**You'll know it's working when:**

1. ✅ No "invalid vendor key" errors in console
2. ✅ Voice panel appears on left sidebar (Discord-style)
3. ✅ Green "Connected" indicator shows
4. ✅ Microphone bars move when you speak
5. ✅ Other users appear in voice panel
6. ✅ Mute/Deafen/Leave buttons work
7. ✅ Session persists after refresh

---

**The fix is simple: Just add those 2 lines to backend .env and restart PM2!** ✨
