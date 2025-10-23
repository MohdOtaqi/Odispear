# 📦 Files to Upload to AWS - Complete Checklist

## **Method: Using FileZilla/WinSCP**

Connect to: `ubuntu@16.171.225.46`

---

## **✅ BACKEND FILES**

### **Upload to: `/var/www/Odispear/unity-platform/backend/src/`**

#### **New Controllers:**
```
✅ controllers/statusController.ts (NEW - 142 lines)
✅ controllers/reactionController.ts (NEW - 210 lines)
```

#### **New Routes:**
```
✅ routes/statusRoutes.ts (NEW - 20 lines)
✅ routes/reactionRoutes.ts (NEW - 21 lines)
```

#### **Updated Routes:**
```
✅ routes/friendsRoutes.ts (UPDATED - fixed accept/reject)
✅ routes/dmRoutes.ts (UPDATED - added /channels route)
```

#### **New Services:**
```
✅ services/socketService.ts (NEW - 140 lines)
```

#### **Updated Main:**
```
✅ index.ts (UPDATED - added status & reaction routes)
```

---

## **✅ FRONTEND FILES**

### **Upload to: `/var/www/Odispear/unity-platform/frontend/src/`**

#### **New Voice Chat Folder:**
```
📁 components/VoiceChat/ (CREATE THIS FOLDER)
  ├── VoiceChatProvider.tsx (NEW - 450+ lines)
  ├── VoicePanelAdvanced.tsx (NEW - 350+ lines)  
  ├── VoicePanelSimple.tsx (NEW - 250+ lines)
  ├── VoiceSettingsModal.tsx (NEW - 550+ lines)
  └── index.ts (NEW - 5 lines)
```

#### **New Chat Components:**
```
✅ components/chat/MessageReactions.tsx (NEW - 120 lines)
✅ components/chat/FileUploadPreview.tsx (NEW - 95 lines)
```

#### **Updated Components:**
```
✅ components/UserStatusSelector.tsx (UPDATED - now works with API)
✅ pages/MainApp.tsx (UPDATED - integrated voice chat)
```

#### **Updated Config:**
```
✅ .env (UPDATED - added VITE_AGORA_APP_ID)
```

---

## **✅ ROOT FILES**

### **Upload to: `/var/www/Odispear/unity-platform/`**

```
✅ deploy-aws.sh (NEW - deployment script)
✅ COMPLETE_FIX_GUIDE.md (NEW - documentation)
✅ ALL_FEATURES_AND_CODE.md (NEW - features list)
✅ VOICE_IMPLEMENTATION.md (NEW - voice chat guide)
```

---

## **📋 QUICK UPLOAD GUIDE**

### **Step 1: Organize Files Locally**

Create this folder structure on your desktop:

```
Upload/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── statusController.ts
│   │   │   └── reactionController.ts
│   │   ├── routes/
│   │   │   ├── statusRoutes.ts
│   │   │   ├── reactionRoutes.ts
│   │   │   ├── friendsRoutes.ts
│   │   │   └── dmRoutes.ts
│   │   ├── services/
│   │   │   └── socketService.ts
│   │   └── index.ts
│   
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── VoiceChat/
│   │   │   │   ├── VoiceChatProvider.tsx
│   │   │   │   ├── VoicePanelAdvanced.tsx
│   │   │   │   ├── VoicePanelSimple.tsx
│   │   │   │   ├── VoiceSettingsModal.tsx
│   │   │   │   └── index.ts
│   │   │   ├── chat/
│   │   │   │   ├── MessageReactions.tsx
│   │   │   │   └── FileUploadPreview.tsx
│   │   │   └── UserStatusSelector.tsx
│   │   └── pages/
│   │       └── MainApp.tsx
│   └── .env
│
└── root/
    ├── deploy-aws.sh
    ├── COMPLETE_FIX_GUIDE.md
    ├── ALL_FEATURES_AND_CODE.md
    └── VOICE_IMPLEMENTATION.md
```

### **Step 2: Upload with FileZilla**

1. **Connect to AWS:**
   - Host: `16.171.225.46`
   - Username: `ubuntu`
   - Use SSH key authentication

2. **Navigate to project:**
   - Remote path: `/var/www/Odispear/unity-platform`

3. **Upload backend files:**
   - Drag `backend/src/controllers/` → `/var/www/Odispear/unity-platform/backend/src/controllers/`
   - Drag `backend/src/routes/` → `/var/www/Odispear/unity-platform/backend/src/routes/`
   - Drag `backend/src/services/` → `/var/www/Odispear/unity-platform/backend/src/services/`
   - Drag `backend/src/index.ts` → `/var/www/Odispear/unity-platform/backend/src/`

4. **Upload frontend files:**
   - Create folder: `/var/www/Odispear/unity-platform/frontend/src/components/VoiceChat/`
   - Drag all VoiceChat files into it
   - Drag chat components → `/var/www/Odispear/unity-platform/frontend/src/components/chat/`
   - Drag updated files → their respective locations
   - Drag `.env` → `/var/www/Odispear/unity-platform/frontend/`

5. **Upload root files:**
   - Drag deploy script and docs → `/var/www/Odispear/unity-platform/`

### **Step 3: Set Permissions**

SSH to server and run:
```bash
ssh ubuntu@16.171.225.46
cd /var/www/Odispear/unity-platform
chmod +x deploy-aws.sh
```

### **Step 4: Deploy**

```bash
./deploy-aws.sh
```

---

## **🔍 VERIFICATION CHECKLIST**

After upload, verify these files exist:

### **Backend:**
```bash
ls -la backend/src/controllers/statusController.ts
ls -la backend/src/controllers/reactionController.ts
ls -la backend/src/routes/statusRoutes.ts
ls -la backend/src/routes/reactionRoutes.ts
ls -la backend/src/services/socketService.ts
```

### **Frontend:**
```bash
ls -la frontend/src/components/VoiceChat/
ls -la frontend/src/components/chat/MessageReactions.tsx
ls -la frontend/src/components/chat/FileUploadPreview.tsx
ls -la frontend/.env
```

### **Root:**
```bash
ls -la deploy-aws.sh
```

---

## **⚠️ COMMON UPLOAD ISSUES**

### **Issue 1: Permission Denied**
```bash
# Fix with:
sudo chown -R ubuntu:ubuntu /var/www/Odispear/unity-platform
```

### **Issue 2: Files Already Exist**
```bash
# Overwrite them - the new versions are better!
# Or backup first:
mv backend/src/index.ts backend/src/index.ts.backup
```

### **Issue 3: Folder Doesn't Exist**
```bash
# Create it:
mkdir -p frontend/src/components/VoiceChat
mkdir -p backend/src/services
```

---

## **📝 FILE SIZES REFERENCE**

To verify complete uploads:

| File | Approx Size |
|------|-------------|
| statusController.ts | 4 KB |
| reactionController.ts | 6 KB |
| socketService.ts | 4 KB |
| VoiceChatProvider.tsx | 14 KB |
| VoicePanelAdvanced.tsx | 11 KB |
| VoiceSettingsModal.tsx | 17 KB |
| MessageReactions.tsx | 4 KB |
| FileUploadPreview.tsx | 3 KB |

---

## **🚀 AFTER UPLOAD**

1. Run deploy script: `./deploy-aws.sh`
2. Check PM2 status: `pm2 status`
3. View logs: `pm2 logs unity-backend`
4. Test in browser: `http://16.171.225.46`

---

## **✅ SUCCESS INDICATORS**

After successful deployment:
- ✅ PM2 shows both apps running
- ✅ No errors in `pm2 logs`
- ✅ Website loads at `http://16.171.225.46`
- ✅ Can login and access features
- ✅ Friends API works (no 500 errors)
- ✅ DM channels load
- ✅ Status selector works
- ✅ Message reactions appear

---

**All files are in your project folder! Just upload and deploy!** 🎉
