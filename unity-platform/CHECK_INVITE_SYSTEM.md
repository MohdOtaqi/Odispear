# Unity Platform - Invite System Debug Guide

## Current Issue:
Invite links always show "Invalid or expired invite" even when newly created.

## System Flow:

### 1. Invite Creation (Backend)
**File:** `backend/src/controllers/inviteController.ts`
- Creates invite with code: `uuidv4().substring(0, 8)` (8 characters)
- Stores in `guild_invites` table
- Returns URL: `${process.env.FRONTEND_URL}/invite/${inviteCode}`

### 2. Invite Display (Frontend)
**File:** `frontend/src/components/modals/InviteModal.tsx`
- Shows URL as: `${window.location.origin}/invite/${inviteCode}`

### 3. Invite Access (Frontend)
**File:** `frontend/src/pages/InvitePage.tsx`
- Gets code from URL params
- Calls: `GET /api/v1/invites/${code}`

### 4. Invite Validation (Backend)
**File:** `backend/src/controllers/inviteController.ts` (getInviteInfo)
- Query checks:
  - Code exists
  - Not expired (`expires_at IS NULL OR expires_at > NOW()`)
  - Returns guild info

## Potential Issues:

### Problem 1: Route Access
**Status:** ✅ FIXED
- Route `/invites/:code` is now public (no auth required)

### Problem 2: Database Query
**Check:** The query might be failing if:
- Invite code doesn't exist
- Invite is expired
- Database connection issue

### Problem 3: Code Format
**Check:** The code might have:
- Case sensitivity issues
- Special characters
- Length mismatch

## Debug Steps on AWS:

```bash
# 1. SSH into server
ssh ubuntu@16.171.225.46

# 2. Check if invites exist in database
sudo -u postgres psql -d unity_platform
SELECT * FROM guild_invites ORDER BY created_at DESC LIMIT 5;
\q

# 3. Test API directly
curl http://localhost:3000/api/v1/invites/YOUR_CODE

# 4. Check backend logs
pm2 logs unity-backend --lines 100 | grep -i invite

# 5. Create test invite via API
curl -X POST http://localhost:3000/api/v1/guilds/YOUR_GUILD_ID/invites \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"maxUses": null, "maxAge": 86400}'

# 6. Check if the invite was created
sudo -u postgres psql -d unity_platform
SELECT code, guild_id, expires_at, uses, max_uses FROM guild_invites WHERE created_at > NOW() - INTERVAL '5 minutes';
\q
```

## Fix Actions:

### 1. Add Better Logging
```typescript
// In getInviteInfo
console.log(`Fetching invite with code: ${code}`);
const result = await query(...);
console.log(`Invite query result: ${result.rows.length} rows`);
if (result.rows.length === 0) {
  console.log(`No invite found for code: ${code}`);
}
```

### 2. Check Case Sensitivity
The database query might be case-sensitive. Ensure:
- Code is stored and retrieved with same case
- URL parameter is not being modified

### 3. Verify Table Structure
```sql
\d guild_invites
```
Should have columns:
- id
- guild_id
- code (varchar)
- creator_id
- max_uses
- uses
- expires_at
- created_at

### 4. Test Direct Database Query
```sql
-- Test if ANY invites exist
SELECT COUNT(*) FROM guild_invites;

-- Test specific invite
SELECT * FROM guild_invites WHERE code = 'YOUR_CODE';

-- Check recent invites
SELECT code, guild_id, expires_at FROM guild_invites 
WHERE created_at > NOW() - INTERVAL '1 hour';
```

## Quick Fix Suggestion:

The issue might be that the invite table doesn't exist or has different columns. Run this to check/fix:

```sql
-- Create table if not exists
CREATE TABLE IF NOT EXISTS guild_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  code VARCHAR(50) UNIQUE NOT NULL,
  creator_id UUID NOT NULL REFERENCES users(id),
  max_uses INTEGER,
  uses INTEGER DEFAULT 0,
  max_age INTEGER,
  temporary BOOLEAN DEFAULT false,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_guild_invites_code ON guild_invites(code);
```

## Expected Behavior:

1. User creates invite → Backend generates 8-char code
2. Frontend shows: `http://16.171.225.46/invite/abc12345`
3. User shares link
4. Visitor opens link → Frontend fetches `/api/v1/invites/abc12345`
5. Backend returns guild info (name, icon, member count)
6. User sees guild preview and can join

## Most Likely Issue:

**The `guild_invites` table might not exist or has different structure than expected.**

Run the SQL commands above to verify and fix the database structure.
