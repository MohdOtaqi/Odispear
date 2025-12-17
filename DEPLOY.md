# Railway Deployment Guide

## Prerequisites
- GitHub account with the repository pushed
- Railway account (https://railway.app)
- Daily.co account for voice chat (https://daily.co)

---

## Step 1: Push to GitHub

Make sure your code is pushed to GitHub:
```bash
cd "D:\Odispear Github\Odispear\unity-platform"
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

---

## Step 2: Create Railway Project

1. Go to https://railway.app and sign in with GitHub
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `unity-platform` repository
5. Railway will auto-detect the project

---

## Step 3: Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Railway will automatically inject `DATABASE_URL` into your app

---

## Step 4: Set Environment Variables

1. Click on your main service (not the database)
2. Go to **"Variables"** tab
3. Add these variables:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | (generate a random 64-char string) |
| `DAILY_API_KEY` | (from Daily.co dashboard) |
| `DAILY_DOMAIN` | `your-domain.daily.co` |

### Generate JWT_SECRET:
Run this in terminal:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Step 5: Configure Build Settings

1. Click on your service → **"Settings"**
2. Under **Build Command**, set:
   ```
   cd frontend && npm install && npm run build && cd ../backend && npm install && npm run build
   ```
3. Under **Start Command**, set:
   ```
   cd backend && npm start
   ```

---

## Step 6: Run Database Migrations

1. Go to your service → **"Settings"** → **"Deploy"**
2. Add a **Deploy Command**:
   ```
   cd backend && npm run migrate:prod
   ```

Or run it manually via Railway CLI:
```bash
railway run cd backend && npm run migrate:prod
```

---

## Step 7: Deploy

1. Railway auto-deploys on push
2. Or click **"Deploy"** manually
3. Wait for build to complete (~3-5 minutes)

---

## Step 8: Get Your URL

1. Go to **"Settings"** → **"Networking"**
2. Click **"Generate Domain"**
3. Your app will be at: `https://your-app.up.railway.app`

---

## Step 9: Add Custom Domain (Optional)

1. Go to **"Settings"** → **"Networking"**
2. Click **"+ Custom Domain"**
3. Enter your domain (e.g., `app.yourdomain.com`)
4. Add CNAME record at your DNS provider:
   - Type: `CNAME`
   - Name: `app` (or subdomain)
   - Value: `your-app.up.railway.app`
5. Wait for SSL certificate (~5 mins)

---

## Troubleshooting

### Build Fails
- Check Railway logs for errors
- Ensure all dependencies are in package.json

### Database Connection Error
- Make sure PostgreSQL is added
- Check DATABASE_URL is injected

### Voice Chat Not Working
- Verify DAILY_API_KEY and DAILY_DOMAIN are set
- Check Daily.co dashboard for API usage

---

## Cost Estimate

Railway Free Tier includes:
- $5 credit/month
- ~500 hours of runtime
- Enough for small apps

For production: ~$5-10/month for:
- Backend service
- PostgreSQL database
- Redis (optional)
