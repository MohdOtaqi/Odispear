# Unity Platform - Critical Issues & Solutions

## ✅ Issues Fixed in Code:

### 1. **API URL Missing Port**
**Problem:** Frontend was calling http://16.171.225.46 instead of http://16.171.225.46:3000
**Fixed:** Updated `.env` file:
```
VITE_API_URL=http://16.171.225.46:3000
VITE_WS_URL=ws://16.171.225.46:3000
```

### 2. **Members Not Showing**
**Problem:** MainApp wasn't fetching guild members
**Fixed:** Added member fetching in MainApp.tsx:
```typescript
const [members, setMembers] = useState<any[]>([]);

useEffect(() => {
  const fetchMembers = async () => {
    if (currentGuild?.id) {
      const { data } = await api.get(`/guilds/${currentGuild.id}/members`);
      setMembers(data);
    }
  };
  fetchMembers();
}, [currentGuild?.id]);
```

### 3. **Profile Modal Not Working**
**Fixed:** UserProfileModal integrated in:
- FriendsPage.tsx - Click friend name
- MemberList.tsx - Click member name

### 4. **Message Button Not Working**
**Fixed:** Creates DM channel first:
```typescript
const handleMessage = async (friendId: string) => {
  const { data } = await api.post('/dm/create', { user_id: friendId });
  navigate(`/app/dms/${data.id}`);
};
```

---

## ⚠️ Invite Issue - Database Check:

The invite table EXISTS (you got "ERROR: relation "guild_invites" already exists").

### Check if invites are being created properly:

```sql
sudo -u postgres psql -d unity_platform
SELECT * FROM guild_invites ORDER BY created_at DESC LIMIT 5;
\q
```

### If no invites exist, check the table structure:

```sql
\d guild_invites
```

Should have these columns:
- id (UUID)
- guild_id (UUID)
- code (VARCHAR)
- creator_id (UUID)
- expires_at (TIMESTAMP)
- uses (INTEGER)
- max_uses (INTEGER)

### Test invite creation via API:

```bash
# Get your auth token from browser DevTools (Network tab)
TOKEN="your_jwt_token_here"

# Get a guild ID
sudo -u postgres psql -d unity_platform -c "SELECT id, name FROM guilds LIMIT 1;"

# Create test invite
curl -X POST http://localhost:3000/api/v1/guilds/YOUR_GUILD_ID/invites \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# Should return invite with code
```

---

## Deploy Command:

```bash
cd /var/www/Odispear/unity-platform && \
git pull origin main && \
cd backend && npm install && npm run build && \
cd ../frontend && npm install && npm run build && \
cd .. && pm2 restart all && pm2 save && \
pm2 logs unity-backend --lines 30
```

---

## After Deployment:

### 1. Test Friends Page:
- ✅ Click friend → profile modal opens
- ✅ Click message → creates DM

### 2. Test Member List:
- ✅ Click member → profile modal opens  
- ✅ Click message icon → creates DM

### 3. Test Invites:
1. Create NEW invite in app
2. Copy link
3. Test in incognito browser
4. If still "invalid", check logs:
   ```bash
   pm2 logs unity-backend | grep -i invite
   ```

---

## The Real Issue with Invites:

Based on your terminal output, the `guild_invites` table EXISTS. The problem is likely:

1. **No Frontend URL in backend .env** - FIXED (added FRONTEND_URL=http://16.171.225.46)
2. **Wrong API URL in frontend** - FIXED (added :3000 port)
3. **Invites might have wrong format** - Need to check actual data

### Debug the actual invite data:

```bash
sudo -u postgres psql -d unity_platform

-- Check what's in the invites table
SELECT code, guild_id, expires_at, uses, max_uses 
FROM guild_invites 
WHERE created_at > NOW() - INTERVAL '1 day';

-- If invites exist, test one directly
-- Copy a code from above and test:
\q

curl http://localhost:3000/api/v1/invites/YOUR_CODE_HERE
```

If the curl command returns data, the backend is working. If not, the issue is in the backend query.

---

## Most Likely Root Cause:

The frontend was calling the WRONG URL (missing :3000 port). This is now fixed.
Deploy and all features should work!
