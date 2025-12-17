# 🔧 Fix Voice Chat & Missing UI Features

## 1️⃣ GET YOUR DAILY.CO API KEY (Required for Voice)

1. Go to: https://dashboard.daily.co
2. Sign up or login
3. Click "Developers" → "API keys"
4. Copy your API key

## 2️⃣ UPDATE BACKEND ON SERVER

SSH to your server and run:

```bash
cd /var/www/Odispear/unity-platform

# Edit the ecosystem file
nano ecosystem.config.js
```

Find this line:
```javascript
DAILY_API_KEY: 'your-daily-api-key',
```

Replace with your ACTUAL key from Daily.co:
```javascript
DAILY_API_KEY: 'YOUR_ACTUAL_KEY_HERE',
```

Save (Ctrl+X, Y, Enter)

Then restart:
```bash
pm2 restart unity-backend
pm2 logs unity-backend --lines 20
```

## 3️⃣ REBUILD FRONTEND WITH UI FIXES

```bash
cd /var/www/Odispear/unity-platform

# Pull the latest code
git pull origin main

# Rebuild frontend
cd frontend
npm run build

# Restart frontend
pm2 restart unity-frontend
```

## 4️⃣ ACCESS NEW FEATURES

After rebuild, you can access:

### Server Management
- Click server name at top → Opens dropdown menu
- Select "Server Settings" → Manage roles, channels, members
- Select "Invite People" → Generate invite links

### Keybinds Configuration  
- Click your avatar (bottom left)
- Click Settings icon
- Go to "Keybinds" tab
- Configure mouse buttons for PTT

### Create Channels
- Click server name → "Create Channel"
- Or click the + icon next to "Text Channels" or "Voice Channels"

### Profile Editor
- Click your avatar (bottom left)  
- Click "Edit Profile"
- Upload avatar/banner, change bio

## 5️⃣ TEST EVERYTHING

1. **Voice Chat**: Join a voice channel - should work now with Daily.co API key
2. **Server Settings**: Click server name → Server Settings
3. **Invite System**: Click server name → Invite People  
4. **Keybinds**: Avatar → Settings → Keybinds
5. **Profile**: Avatar → Edit Profile

## 🚨 TROUBLESHOOTING

If voice still doesn't work:
```bash
# Check if Daily.co key is loaded
pm2 env unity-backend | grep DAILY

# Check backend logs for errors
pm2 logs unity-backend --err --lines 50
```

If UI features missing:
```bash
# Make sure frontend rebuilt
cd /var/www/Odispear/unity-platform/frontend
npm run build
pm2 restart unity-frontend
```
