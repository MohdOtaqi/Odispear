# Quick Start Guide - New Discord Features

## 🚀 Quick Deploy

```bash
cd /var/www/Odispear/unity-platform
chmod +x deploy-discord-features.sh
./deploy-discord-features.sh
```

## 📋 What's New

### 1. Click to View Profiles
- **Where:** Any chat message
- **How:** Click username or avatar
- **Result:** Opens user profile modal

### 2. Send DM from Profile
- **Where:** User profile modal
- **How:** Click "Send Message" button
- **Result:** Opens DM conversation

### 3. Customize Your Profile
- **Where:** User settings → Profile
- **What:** Add bio text, upload banner image
- **API:** `/api/v1/users/profile` (PATCH)

### 4. Share Server Invites
- **Where:** Server settings → Invites
- **What:** Anyone can preview server (no login needed)
- **Join:** Requires login

### 5. Real-time Feedback
- **Where:** Everywhere
- **What:** Toast notifications for all actions
- **Examples:** "DM opened!", "Friend request sent!", errors

## 🔧 Quick Configuration

### Backend (.env)
```bash
DATABASE_URL=postgresql://unity_app:password@localhost:5432/unity_platform
JWT_SECRET=your-secret-key
DAILY_API_KEY=your-daily-api-key
CORS_ORIGIN=https://your-domain.com
```

### Frontend (.env)
```bash
VITE_API_URL=https://your-domain.com
VITE_WS_URL=wss://your-domain.com
VITE_DAILY_DOMAIN=https://yourdomain.daily.co
```

## 🗄️ Database Setup

```bash
# Run migration
psql -U unity_app -d unity_platform -f database/user_profile_enhancement_migration.sql

# Verify
psql -U unity_app -d unity_platform -c "\d users"
# Should see: bio, banner_url columns
```

## 🎨 Frontend Integration

### Make Message Authors Clickable

```typescript
import { MessageComponent } from './components/MessageComponent';

<MessageComponent
  message={{
    id: "msg-id",
    author: {
      id: "user-id",  // ← Must include ID
      username: "username",
      avatar: "url"
    },
    content: "Hello!"
  }}
  onProfileClick={(userId) => {
    setSelectedUserId(userId);
    setShowProfileModal(true);
  }}
/>
```

### Create DM from Profile

```typescript
import { UserProfileModal } from './components/UserProfileModal';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

<UserProfileModal
  userId={selectedUserId}
  onClose={() => setShowProfileModal(false)}
/>

// DM creation handled internally with:
// - Toast notifications
// - Auto-navigation
// - Duplicate prevention
```

### Add Toast Notifications

```typescript
import toast from 'react-hot-toast';

// Success
toast.success('Action completed!');

// Error
toast.error('Something went wrong!');

// Loading
const loadingToast = toast.loading('Processing...');
// Later:
toast.success('Done!', { id: loadingToast });
```

## 🔍 Verify Deployment

```bash
# 1. Check backend
curl http://localhost:3000/health
# Should return: {"status":"ok"}

# 2. Check PM2
pm2 status
# unity-backend should be "online"

# 3. Check database
psql -U unity_app -d unity_platform -c "SELECT bio, banner_url FROM users LIMIT 1;"

# 4. Check Nginx
sudo nginx -t
# Should return: "syntax is ok"

# 5. Test API
curl -k https://16.171.225.46/api/v1/invites/test-code
# Should return invite data or 404

# 6. Check frontend build
ls -lh frontend/dist/index.html
# Should exist
```

## 🐛 Common Issues

### "Cannot click username/avatar"
- ✅ Check `author.id` is present in message data
- ✅ Check `onProfileClick` prop is passed
- ✅ Clear browser cache

### "404 Not Found on API"
- ✅ Check Nginx config has `/api/` location
- ✅ Restart Nginx: `sudo systemctl reload nginx`
- ✅ Check backend is running: `pm2 status`

### "Images not uploading"
- ✅ Create directory: `mkdir -p backend/uploads`
- ✅ Set permissions: `chmod -R 755 backend/uploads`
- ✅ Check sharp is installed: `npm list sharp`

### "Toast not showing"
- ✅ Add `<Toaster />` to root component
- ✅ Check react-hot-toast is installed
- ✅ Clear browser cache

## 📊 Performance Tips

1. **Image Optimization:**
   - Avatars: Auto-resized to 256x256 WebP
   - Banners: Auto-resized to 1024x256 WebP
   - Set Nginx caching: `expires 1y;`

2. **Database Queries:**
   - Profile fetches use joins (single query)
   - DM creation uses database function (prevents duplicates)

3. **Frontend:**
   - Code splitting preserved
   - React Router (no page reloads)
   - Toast notifications debounced

## 🔒 Security Checklist

- [ ] JWT_SECRET is secure and unique
- [ ] CORS_ORIGIN matches your domain
- [ ] File upload limits set (10MB max)
- [ ] Image types validated (JPEG, PNG, GIF, WebP only)
- [ ] Rate limiting enabled on API endpoints
- [ ] HTTPS enabled (not HTTP)
- [ ] Database credentials secured

## 📱 User Testing Script

1. **Test Profile Click:**
   - Send a message in any channel
   - Click your username
   - Profile modal should open

2. **Test DM Creation:**
   - Click another user's username
   - Click "Send Message" in profile
   - Should navigate to DM

3. **Test Profile Edit:**
   - Open user settings
   - Upload avatar/banner
   - Add bio text
   - Save changes

4. **Test Invite Preview:**
   - Create server invite
   - Open in incognito window (not logged in)
   - Should see server preview
   - Click "Join" → redirects to login

5. **Test Toast Notifications:**
   - Perform any action (send DM, add friend, etc.)
   - Toast should appear with feedback

## 🎯 Next Steps

1. **Deploy to production:**
   ```bash
   ./deploy-discord-features.sh
   ```

2. **Monitor logs:**
   ```bash
   pm2 logs unity-backend --lines 100
   ```

3. **Test all features** using checklist above

4. **Monitor performance:**
   ```bash
   pm2 monit
   ```

5. **Set up monitoring:**
   - Error tracking (Sentry, etc.)
   - Performance monitoring (New Relic, etc.)
   - Uptime monitoring (UptimeRobot, etc.)

## 💡 Pro Tips

- **Clear browser cache after deployment** (Ctrl+Shift+Delete)
- **Test in incognito mode** to verify without cache
- **Monitor PM2 logs** during first hour after deployment
- **Keep backup** of previous version (script creates automatic backup)
- **Test DM creation with multiple users** to verify no duplicates

## 📞 Support

If issues persist:
1. Check `pm2 logs unity-backend`
2. Check browser console for errors
3. Verify Nginx config: `sudo nginx -t`
4. Check database connection
5. Review `DISCORD_FEATURES_IMPLEMENTED.md` for detailed troubleshooting

---

**Version:** 1.0.0  
**Last Updated:** 2025-01-23  
**Deployment Time:** ~5-10 minutes  
**Downtime Required:** None (zero-downtime deployment)
