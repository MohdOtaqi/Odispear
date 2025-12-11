# Render Deployment Guide

## Prerequisites
- GitHub account with the repository pushed
- Render account (https://render.com)
- Daily.co account for voice chat (https://daily.co)

---

## Step 1: Create Render Account

1. Go to **https://render.com**
2. Sign up with GitHub
3. Connect your GitHub repository

---

## Step 2: Deploy via Blueprint (Recommended)

### Option A: Auto-Deploy with render.yaml
1. In Render dashboard, click **"New"** → **"Blueprint"**
2. Connect your GitHub repo: `MohdOtaqi/Odispear`
3. Render will detect `render.yaml` and auto-configure everything
4. Click **"Apply"**

### Option B: Manual Setup
If blueprint doesn't work, create services manually:

---

## Step 3: Create PostgreSQL Database

1. In Render dashboard, click **"New"** → **"PostgreSQL"**
2. Name: `odispear-db`
3. Plan: **Free** (1GB storage)
4. Click **"Create Database"**
5. Save the connection details (you'll need them)

---

## Step 4: Create Web Service

1. Click **"New"** → **"Web Service"**
2. Connect your GitHub repo: `MohdOtaqi/Odispear`
3. Fill in settings:

| Field | Value |
|-------|-------|
| **Name** | `odispear` |
| **Root Directory** | `unity-platform` |
| **Environment** | `Node` |
| **Region** | `Frankfurt (EU)` |
| **Branch** | `main` |
| **Build Command** | `cd frontend && npm install && npm run build && cd ../backend && npm install && npm run build` |
| **Start Command** | `cd backend && npm start` |

---

## Step 5: Set Environment Variables

In your web service → **Environment** tab, add:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | *(generate with command below)* |
| `DAILY_API_KEY` | *(from Daily.co dashboard)* |
| `DAILY_DOMAIN` | `odispear.daily.co` |
| `DATABASE_URL` | *(from PostgreSQL service)* |

### Generate JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Get DATABASE_URL:
1. Go to your PostgreSQL service
2. Copy the **External Connection String**
3. Paste as `DATABASE_URL`

---

## Step 6: Deploy

1. Click **"Create Web Service"**
2. Render will automatically build and deploy
3. Wait 5-10 minutes for first deployment
4. Your app will be at: `https://odispear.onrender.com`

---

## Step 7: Custom Domain (Optional)

1. Go to your web service → **Settings** → **Custom Domains**
2. Add your domain (e.g., `app.yourdomain.com`)
3. Create CNAME record at your DNS provider:
   - Type: `CNAME`
   - Name: `app`
   - Value: `odispear.onrender.com`
4. SSL certificate auto-provisioned

---

## Step 8: Run Database Migrations

After deployment, you need to run migrations:

### Option A: Manual via Render Shell
1. Go to your web service → **Shell** tab
2. Run: `cd backend && npm run migrate:prod`

### Option B: Add to Build Command
Update build command to include migration:
```
cd frontend && npm install && npm run build && cd ../backend && npm install && npm run build && npm run migrate:prod
```

---

## Environment Variables Reference

| Required | Variable | Description |
|----------|----------|-------------|
| ✅ | `NODE_ENV` | `production` |
| ✅ | `JWT_SECRET` | Random 64-char string |
| ✅ | `DATABASE_URL` | PostgreSQL connection string |
| ✅ | `DAILY_API_KEY` | From Daily.co dashboard |
| ✅ | `DAILY_DOMAIN` | Your Daily.co domain |

---

## Troubleshooting

### Build Fails
- Check build logs in Render dashboard
- Ensure all dependencies in package.json

### Database Connection Error
- Verify DATABASE_URL format: `postgresql://user:pass@host:port/db`
- Check PostgreSQL service is running

### Voice Chat Issues
- Verify Daily.co environment variables
- Check Daily.co API usage limits

---

## Cost Estimate

**Render Free Tier:**
- Web Service: 750 hours/month (enough for small apps)
- PostgreSQL: 1GB free
- SSL certificates included
- Custom domains included

**For production**: ~$7-15/month for more resources.

---

## Benefits of Render vs Railway

- ✅ More stable free tier
- ✅ Better EU server coverage (Frankfurt)
- ✅ Simpler deployment process
- ✅ Built-in database backups
- ✅ No credit system - just resource limits
