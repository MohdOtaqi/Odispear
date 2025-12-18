# Google OAuth Configuration - Production Setup

## Step 1: Create Google Cloud Project (5 minutes)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"New Project"**
3. Project name: **Odispear**
4. Click **"Create"**

## Step 2: Enable Google+ API

1. In the project, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"**
3. Click **"Enable"**

## Step 3: Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"External"** (for public app)
3. Fill in:
   - App name: **Odispear**
   - User support email: **your-email@gmail.com**
   - App logo: Upload your logo (optional)
   - Application home page: **https://n0tmot.com**
   - Authorized domains: **n0tmot.com**
   - Developer contact: **your-email@gmail.com**
4. Click **"Save and Continue"**
5. Scopes: Click **"Add or Remove Scopes"**
   - Select: `email`, `profile`, `openid`
6. Click **"Save and Continue"**
7. Test users: Add your email for testing
8. Click **"Save and Continue"**

## Step 4: Create OAuth Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth 2.0 Client ID"**
3. Application type: **Web application**
4. Name: **Odispear Web Client**
5. Authorized JavaScript origins:
   ```
   https://n0tmot.com
   ```
6. Authorized redirect URIs:
   ```
   https://n0tmot.com/api/v1/auth/google/callback
   http://localhost:5000/api/v1/auth/google/callback
   ```
7. Click **"Create"**
8. **COPY THE CLIENT ID AND CLIENT SECRET** - you'll need these!

## Step 5: Update Backend .env on AWS

SSH into your server:
```bash
ssh -i ~/.ssh/mot-key.pem ubuntu@16.24.207.113
```

Edit the .env file:
```bash
nano ~/Odispear/backend/.env
```

Add/update these lines with YOUR credentials:
```env
# Google OAuth (REPLACE WITH YOUR ACTUAL VALUES)
GOOGLE_CLIENT_ID=YOUR-CLIENT-ID-HERE.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR-CLIENT-SECRET-HERE
GOOGLE_CALLBACK_URL=https://n0tmot.com/api/v1/auth/google/callback
FRONTEND_URL=https://n0tmot.com
```

Save (Ctrl+X, Y, Enter)

## Step 6: Restart Backend

```bash
pm2 restart odispear-backend
pm2 logs odispear-backend --lines 20
```

Look for: `[Passport] Google OAuth configured successfully`

## Step 7: Test Google Login

1. Go to https://n0tmot.com/login
2. Click **"Continue with Google"**
3. Select your Google account
4. Should redirect to /app after successful login

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Check that the callback URL in Google Console EXACTLY matches your .env
- Must be: `https://n0tmot.com/api/v1/auth/google/callback`

### Error: "Access blocked: This app's request is invalid"
- Make sure OAuth consent screen is configured
- Add your email as a test user
- Check that scopes include email and profile

### "Cannot find module passport"
Already installed on server. If error persists:
```bash
cd ~/Odispear/backend
npm install passport passport-google-oauth20
pm2 restart odispear-backend
```

## Security Notes

1. **Never commit .env to git** - credentials should only be on server
2. Keep Client Secret secure - treat like a password
3. For production, publish your OAuth consent screen (not required for testing)
4. Monitor Google Cloud Console for any suspicious activity

## Your Credentials Template

```
GOOGLE_CLIENT_ID=_____________________________________.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=_________________________________
```

Fill these in after Step 4 above.
